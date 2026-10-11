"""Deploy the tested Git commit to QA, then run read-only smoke checks.

Only Python's standard library is needed on the GitHub runner.
"""

import json
import os
import time
import uuid
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen


API = "https://api.render.com/v1"
BACKEND = "https://listafacil-api-qa.onrender.com"
FRONTEND = "https://listafacil-web-qa.onrender.com"
TERMINAL = {"build_failed", "update_failed", "pre_deploy_failed", "canceled", "deactivated"}


def request(url, method="GET", data=None, token=None, timeout=60):
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if data is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(data).encode("utf-8")
    try:
        with urlopen(Request(url, data=data, headers=headers, method=method), timeout=timeout) as response:
            return response.status, response.read().decode("utf-8")
    except HTTPError as error:
        return error.code, error.read().decode("utf-8", errors="replace")
    except (URLError, TimeoutError, OSError):
        # Never include exceptions containing a secret hook URL in logs.
        return 0, ""


def api_get(path, token, deadline):
    while time.monotonic() < deadline:
        status, body = request(f"{API}{path}", token=token, timeout=min(60, max(1, deadline - time.monotonic())))
        if status == 200:
            try:
                return json.loads(body)
            except ValueError:
                raise RuntimeError("Render API returned invalid JSON") from None
        if status != 0 and status != 429 and status < 500:
            raise RuntimeError(f"Render API failed: HTTP {status}")
        time.sleep(min(10, max(0, deadline - time.monotonic())))
    raise RuntimeError("Timeout contacting Render API")


def list_deploys(service, token, deadline, created_after=None):
    params = {"limit": 100}
    if created_after:
        params["createdAfter"] = created_after
    result = []
    while True:
        page = api_get(f"/services/{service}/deploys?{urlencode(params)}", token, deadline)
        if not isinstance(page, list):
            raise RuntimeError("Unexpected Render deploy list")
        result.extend(entry["deploy"] for entry in page)
        if len(page) < 100:
            return result
        cursor = page[-1].get("cursor")
        if not cursor or cursor == params.get("cursor"):
            raise RuntimeError("Invalid Render pagination cursor")
        params["cursor"] = cursor


def start_deploy(service, hook, token, deadline):
    # Exclude existing deploy IDs as well as old creation times: a previous
    # deployment of the same SHA must never satisfy this run.
    cutoff = (datetime.now(timezone.utc) - timedelta(seconds=5)).isoformat()
    previous = {deploy["id"] for deploy in list_deploys(service, token, deadline, cutoff)}
    status, body = request(f"{hook}&ref={os.environ['GITHUB_SHA']}", method="POST")
    if status not in (200, 202):
        raise RuntimeError(f"Deploy hook failed: HTTP {status}; not retried to avoid duplicate deploys")
    try:
        payload = json.loads(body) if body else {}
    except ValueError:
        raise RuntimeError("Deploy hook returned invalid JSON") from None
    deploy_id = payload.get("deploy", {}).get("id") or payload.get("id")
    if deploy_id in previous:
        raise RuntimeError("Deploy hook returned an existing deployment")
    return {"service": service, "id": deploy_id, "previous": previous, "cutoff": cutoff}


def wait_live(deployments, sha, token, deadline):
    while time.monotonic() < deadline:
        all_live = True
        for name, deployment in deployments.items():
            service = deployment["service"]
            if not deployment["id"]:
                candidates = [deploy for deploy in list_deploys(service, token, deadline, deployment["cutoff"])
                              if deploy["id"] not in deployment["previous"]
                              and deploy.get("commit", {}).get("id") == sha
                              and deploy.get("trigger") == "deploy_hook"]
                if len(candidates) > 1:
                    raise RuntimeError(f"{name}: ambiguous new deployments; refusing to guess")
                if not candidates:
                    all_live = False
                    continue
                deployment["id"] = candidates[0]["id"]
            deploy = api_get(f"/services/{service}/deploys/{deployment['id']}", token, deadline)
            if deploy.get("commit", {}).get("id") != sha:
                raise RuntimeError(f"{name}: deployed commit does not match GITHUB_SHA")
            status = deploy.get("status")
            print(f"{name}: {deployment['id']} — {status}", flush=True)
            if status in TERMINAL:
                raise RuntimeError(f"{name}: deployment ended with {status}")
            all_live = all_live and status == "live"
        if all_live:
            return
        time.sleep(min(10, max(0, deadline - time.monotonic())))
    raise RuntimeError("Timeout waiting for both QA deployments to become live")


def smoke(deadline):
    credentials = {"email": f"smoke-{uuid.uuid4()}@example.invalid", "password": "smoke-invalid-password"}
    checks = [
        ("backend health", BACKEND + "/health", None, 200, "status", "ok"),
        ("frontend HTML", FRONTEND + "/", None, 200, None, None),
        ("backend PostgreSQL login", BACKEND + "/api/auth/login", credentials, 401, "message", "Credenciales inválidas"),
        ("frontend proxy login", FRONTEND + "/api/auth/login", credentials, 401, "message", "Credenciales inválidas"),
    ]
    while time.monotonic() < deadline:
        passed = True
        for name, url, data, expected_status, key, expected_value in checks:
            if time.monotonic() >= deadline:
                raise RuntimeError("Timeout running QA smoke checks")
            status, body = request(url, method="POST" if data else "GET", data=data,
                                   timeout=min(60, max(1, deadline - time.monotonic())))
            try:
                valid = json.loads(body).get(key) == expected_value if key else '<div id="root"' in body and '<html' in body.lower()
            except (ValueError, AttributeError):
                valid = False
            valid = status == expected_status and valid
            print(f"Smoke {name}: {'OK' if valid else 'retry'} (HTTP {status})", flush=True)
            passed = passed and valid
        if passed:
            return
        time.sleep(min(10, max(0, deadline - time.monotonic())))
    raise RuntimeError("Timeout running QA smoke checks")


def main():
    required = ["GITHUB_SHA", "RENDER_API_KEY", "RENDER_HOOK_API_QA", "RENDER_HOOK_FRONT_QA",
                "RENDER_SERVICE_API_QA", "RENDER_SERVICE_FRONT_QA"]
    for name in required:
        if not os.environ.get(name, "").strip():
            raise RuntimeError(f"Missing required environment variable: {name}")
    for name in ("RENDER_HOOK_API_QA", "RENDER_HOOK_FRONT_QA"):
        url = urlsplit(os.environ[name])
        if url.scheme != "https" or url.hostname != "api.render.com" or not url.query:
            raise RuntimeError(f"Invalid Render hook configuration: {name}")
    token = os.environ["RENDER_API_KEY"]
    deadline = time.monotonic() + 20 * 60
    deployments = {}
    for name, suffix in (("backend", "API"), ("frontend", "FRONT")):
        deployments[name] = start_deploy(os.environ[f"RENDER_SERVICE_{suffix}_QA"],
                                         os.environ[f"RENDER_HOOK_{suffix}_QA"], token, deadline)
    wait_live(deployments, os.environ["GITHUB_SHA"], token, deadline)
    smoke(time.monotonic() + 5 * 60)
    # Recheck both deployment IDs after smoke, detecting superseded deploys.
    wait_live(deployments, os.environ["GITHUB_SHA"], token, time.monotonic() + 60)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as output:
            output.write(f"### QA deploy verified\n\nCommit: `{os.environ['GITHUB_SHA']}`\n\n")
            for name, deployment in deployments.items():
                output.write(f"- {name}: `{deployment['id']}` — live\n")
            output.write("\nAll four read-only smoke checks passed.\n")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, KeyError, TypeError) as error:
        print(f"QA deploy failed: {error}", flush=True)
        raise SystemExit(1)
