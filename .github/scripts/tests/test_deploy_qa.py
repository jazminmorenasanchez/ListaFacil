"""Offline regression tests for the QA deployment script."""

import importlib.util
import json
import os
import subprocess
import time
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import Mock, patch
from urllib.parse import parse_qs, urlsplit


spec = importlib.util.spec_from_file_location(
    "deploy_qa", Path(__file__).resolve().parents[1] / "deploy-qa.py"
)
deploy_qa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy_qa)


class CreatedAfterTests(unittest.TestCase):
    def test_initial_and_queued_queries_use_utc_seconds_with_z(self):
        fixed_now = datetime(2026, 10, 11, 12, 34, 56, 123456, tzinfo=timezone.utc)
        expected_cutoff = "2026-10-11T12:34:51Z"
        paths = []
        new_deploy = {
            "id": "dep-new",
            "commit": {"id": "tested-sha"},
            "trigger": "deploy_hook",
            "status": "live",
        }

        def api_response(path, token, deadline):
            paths.append(path)
            if urlsplit(path).query:
                # First snapshot is empty; the queued deployment appears later.
                return [] if len(paths) == 1 else [{"deploy": new_deploy}]
            return new_deploy

        with patch.dict(os.environ, {"GITHUB_SHA": "tested-sha"}), \
                patch.object(deploy_qa, "datetime") as clock, \
                patch.object(deploy_qa, "api_get", side_effect=api_response), \
                patch.object(deploy_qa, "request", return_value=(202, "{}")):
            clock.now.return_value = fixed_now
            deadline = time.monotonic() + 10
            deployment = deploy_qa.start_deploy(
                "srv-test", "https://api.render.com/deploy/test?key=fake", "fake-token", deadline
            )
            self.assertEqual(deployment["cutoff"], expected_cutoff)
            self.assertIsNone(deployment["id"])
            deploy_qa.wait_live({"backend": deployment}, "tested-sha", "fake-token", deadline)

        queries = [parse_qs(urlsplit(path).query) for path in paths if urlsplit(path).query]
        self.assertEqual(len(queries), 2)
        for query in queries:
            self.assertEqual(query["createdAfter"], [expected_cutoff])
            self.assertEqual(query["limit"], ["100"])
        self.assertEqual(deployment["id"], "dep-new")


class EnvironmentTests(unittest.TestCase):
    def test_cli_defaults_to_qa_and_accepts_production(self):
        self.assertEqual(deploy_qa.parse_environment([]), "qa")
        self.assertEqual(deploy_qa.parse_environment(["--environment", "production"]), "production")
        for environment, suffix, host_suffix in (("qa", "QA", "qa"), ("production", "PROD", "prod")):
            config = deploy_qa.ENVIRONMENTS[environment]
            self.assertEqual(config["suffix"], suffix)
            self.assertEqual(config["backend"], f"https://listafacil-api-{host_suffix}.onrender.com")
            self.assertEqual(config["frontend"], f"https://listafacil-web-{host_suffix}.onrender.com")

    def test_each_environment_uses_its_variables_and_preserves_sha(self):
        for environment, suffix in (("qa", "QA"), ("production", "PROD")):
            values = {
                "GITHUB_SHA": "approved-sha", "RENDER_API_KEY": "fake-token",
                f"RENDER_HOOK_API_{suffix}": "https://api.render.com/deploy/api?key=fake",
                f"RENDER_HOOK_FRONT_{suffix}": "https://api.render.com/deploy/front?key=fake",
                f"RENDER_SERVICE_API_{suffix}": f"srv-api-{suffix}",
                f"RENDER_SERVICE_FRONT_{suffix}": f"srv-front-{suffix}",
            }
            with self.subTest(environment=environment), patch.dict(os.environ, values, clear=True), \
                    patch.object(deploy_qa, "require_current_main") as guard, \
                    patch.object(deploy_qa, "start_deploy", return_value={"id": "dep-test"}) as start, \
                    patch.object(deploy_qa, "wait_live") as wait, patch.object(deploy_qa, "smoke") as smoke:
                deploy_qa.main() if environment == "qa" else deploy_qa.main(environment)
                self.assertEqual([call.args[:3] for call in start.call_args_list], [
                    (values[f"RENDER_SERVICE_API_{suffix}"], values[f"RENDER_HOOK_API_{suffix}"], "fake-token"),
                    (values[f"RENDER_SERVICE_FRONT_{suffix}"], values[f"RENDER_HOOK_FRONT_{suffix}"], "fake-token"),
                ])
                self.assertEqual(smoke.call_args.args[1], environment)
                self.assertEqual(wait.call_count, 2)
                self.assertTrue(all(call.args[1] == "approved-sha" for call in wait.call_args_list))
                if environment == "production":
                    guard.assert_called_once_with("approved-sha")
                else:
                    guard.assert_not_called()

    def test_smoke_uses_correct_urls_and_read_only_logins(self):
        for environment in ("qa", "production"):
            config = deploy_qa.ENVIRONMENTS[environment]
            responses = [(200, '{"status":"ok"}'), (200, '<html><div id="root"></div></html>'),
                         (401, json.dumps({"message": "Credenciales inválidas"})),
                         (401, json.dumps({"message": "Credenciales inválidas"}))]
            with self.subTest(environment=environment), patch.object(deploy_qa, "request", side_effect=responses) as request:
                deploy_qa.smoke(time.monotonic() + 10, environment)
                self.assertEqual([call.args[0] for call in request.call_args_list], [
                    config["backend"] + "/health", config["frontend"] + "/",
                    config["backend"] + "/api/auth/login", config["frontend"] + "/api/auth/login",
                ])
                self.assertEqual([call.kwargs["method"] for call in request.call_args_list], ["GET", "GET", "POST", "POST"])
                credentials = request.call_args_list[2].kwargs["data"]
                self.assertTrue(credentials["email"].endswith("@example.invalid"))
                self.assertTrue(credentials["password"])
                self.assertEqual(credentials, request.call_args_list[3].kwargs["data"])

    def test_obsolete_production_run_stops_before_render_requests(self):
        values = {"GITHUB_SHA": "old-sha", "RENDER_API_KEY": "fake-token",
                  "RENDER_HOOK_API_PROD": "https://api.render.com/deploy/api?key=fake",
                  "RENDER_HOOK_FRONT_PROD": "https://api.render.com/deploy/front?key=fake",
                  "RENDER_SERVICE_API_PROD": "srv-api", "RENDER_SERVICE_FRONT_PROD": "srv-front"}
        result = subprocess.CompletedProcess([], 0, stdout="new-sha\trefs/heads/main\n")
        with patch.dict(os.environ, values, clear=True), \
                patch.object(deploy_qa.subprocess, "run", return_value=result), \
                patch.object(deploy_qa, "request") as request, \
                self.assertRaisesRegex(RuntimeError, "obsolete run"):
            deploy_qa.main("production")
        request.assert_not_called()

    def test_current_main_is_accepted(self):
        result = subprocess.CompletedProcess([], 0, stdout="approved-sha\trefs/heads/main\n")
        with patch.object(deploy_qa.subprocess, "run", return_value=result) as run:
            deploy_qa.require_current_main("approved-sha")
        self.assertEqual(run.call_args.args[0], ["git", "ls-remote", "--exit-code", "origin", "refs/heads/main"])

    def test_git_failure_or_invalid_response_blocks_production(self):
        for result in (subprocess.TimeoutExpired("git", 30), Mock(stdout="")):
            with self.subTest(result=type(result).__name__):
                options = {"side_effect": result} if isinstance(result, Exception) else {"return_value": result}
                with patch.object(deploy_qa.subprocess, "run", **options), self.assertRaises(RuntimeError):
                    deploy_qa.require_current_main("approved-sha")


if __name__ == "__main__":
    unittest.main()
