"""Offline regression tests for the QA deployment script."""

import importlib.util
import os
import time
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch
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


if __name__ == "__main__":
    unittest.main()
