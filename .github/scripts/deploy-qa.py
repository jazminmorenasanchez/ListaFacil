"""Deploy the published SHA-tagged images to QA or production, then run smoke checks.

Only Python's standard library is needed on the GitHub runner.
"""

import argparse
import json
import os
import re
import subprocess
import time
import uuid
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from urllib.request import Request, urlopen


API = "https://api.render.com/v1"
ENVIRONMENTS = {
    "qa": {"suffix": "QA", "label": "QA",
           "backend": "https://listafacil-api-qa.onrender.com",
           "frontend": "https://listafacil-web-qa.onrender.com"},
    "production": {"suffix": "PROD", "label": "PROD",
                   "backend": "https://listafacil-api-prod.onrender.com",
                   "frontend": "https://listafacil-web-prod.onrender.com"},
}
TERMINAL = {"build_failed", "update_failed", "pre_deploy_failed", "canceled", "deactivated"}


def image_urls(sha):
    return {name: f"ghcr.io/jazminmorenasanchez/listafacil-{name}:sha-{sha}"
            for name in ("backend", "frontend")}


def image_hook_url(hook, image):
    parts = urlsplit(hook)
    # Preserve the hook key, replacing any stale Git/image selector.
    params = [(key, value) for key, value in parse_qsl(parts.query, keep_blank_values=True)
              if key not in ("ref", "imgURL")]
    params.append(("imgURL", image))
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(params), ""))


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


def start_deploy(service, hook, token, deadline, image):
    # Exclude existing deploy IDs as well as old creation times: a previous
    # deployment of the same SHA must never satisfy this run.
    cutoff = (datetime.now(timezone.utc) - timedelta(seconds=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
    previous = {deploy["id"] for deploy in list_deploys(service, token, deadline, cutoff)}
    status, body = request(image_hook_url(hook, image), method="POST")
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


def wait_live(deployments, sha, token, deadline, label="QA"):
    images = image_urls(sha)
    while time.monotonic() < deadline:
        all_live = True
        for name, deployment in deployments.items():
            service = deployment["service"]
            if not deployment["id"]:
                candidates = [deploy for deploy in list_deploys(service, token, deadline, deployment["cutoff"])
                              if deploy["id"] not in deployment["previous"]
                              and (deploy.get("image") or {}).get("ref") == images[name]
                              and deploy.get("trigger") == "deploy_hook"]
                if len(candidates) > 1:
                    raise RuntimeError(f"{name}: ambiguous new deployments; refusing to guess")
                if not candidates:
                    all_live = False
                    continue
                deployment["id"] = candidates[0]["id"]
            deploy = api_get(f"/services/{service}/deploys/{deployment['id']}", token, deadline)
            status = deploy.get("status")
            print(f"{label} {name}: {deployment['id']} — {status}", flush=True)
            if status in TERMINAL:
                raise RuntimeError(f"{name}: deployment ended with {status}")
            image = deploy.get("image") or {}
            if image.get("ref") != images[name]:
                raise RuntimeError(f"{name}: deployed image.ref does not match the expected SHA-tagged image")
            if status == "live":
                digest = image.get("sha")
                if not isinstance(digest, str) or not re.fullmatch(r"(?:sha256:)?[0-9a-fA-F]{64}", digest):
                    raise RuntimeError(f"{name}: live deployment has no image.sha; cannot verify image identity")
                expected = deployment.get("image_sha")
                if expected and digest != expected:
                    raise RuntimeError(f"{name}: image digest differs from the verified QA image")
                deployment["image_sha"] = digest
            all_live = all_live and status == "live"
        if all_live:
            return
        time.sleep(min(10, max(0, deadline - time.monotonic())))
    raise RuntimeError(f"Timeout waiting for both {label} deployments to become live")


def smoke(deadline, environment="qa"):
    config = ENVIRONMENTS[environment]
    backend, frontend, label = config["backend"], config["frontend"], config["label"]
    credentials = {"email": f"smoke-{uuid.uuid4()}@example.invalid", "password": "smoke-invalid-password"}
    checks = [
        ("backend health", backend + "/health", None, 200, "status", "ok"),
        ("frontend HTML", frontend + "/", None, 200, None, None),
        ("backend PostgreSQL login", backend + "/api/auth/login", credentials, 401, "message", "Credenciales inválidas"),
        ("frontend proxy login", frontend + "/api/auth/login", credentials, 401, "message", "Credenciales inválidas"),
    ]
    while time.monotonic() < deadline:
        passed = True
        for name, url, data, expected_status, key, expected_value in checks:
            if time.monotonic() >= deadline:
                raise RuntimeError(f"Timeout running {label} smoke checks")
            status, body = request(url, method="POST" if data else "GET", data=data,
                                   timeout=min(60, max(1, deadline - time.monotonic())))
            try:
                valid = json.loads(body).get(key) == expected_value if key else '<div id="root"' in body and '<html' in body.lower()
            except (ValueError, AttributeError):
                valid = False
            valid = status == expected_status and valid
            print(f"{label} smoke {name}: {'OK' if valid else 'retry'} (HTTP {status})", flush=True)
            passed = passed and valid
        if passed:
            return
        time.sleep(min(10, max(0, deadline - time.monotonic())))
    raise RuntimeError(f"Timeout running {label} smoke checks")


def parse_environment(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--environment", choices=ENVIRONMENTS, default="qa")
    return parser.parse_args(argv).environment


def require_current_main(sha):
    try:
        result = subprocess.run(
            ["git", "ls-remote", "--exit-code", "origin", "refs/heads/main"],
            capture_output=True, text=True, timeout=30, check=True,
        )
    except (subprocess.SubprocessError, OSError):
        # Do not expose Git authentication details from stderr.
        raise RuntimeError("PROD: unable to verify origin/main; no deployment started") from None
    fields = result.stdout.split()
    if len(fields) != 2 or fields[1] != "refs/heads/main":
        raise RuntimeError("PROD: invalid origin/main response; no deployment started")
    if fields[0] != sha:
        raise RuntimeError("PROD: obsolete run; approved GITHUB_SHA is no longer HEAD of origin/main; no deployment started")


def main(environment="qa"):
    config = ENVIRONMENTS[environment]
    suffix, label = config["suffix"], config["label"]
    required = ["GITHUB_SHA", "RENDER_API_KEY", f"RENDER_HOOK_API_{suffix}", f"RENDER_HOOK_FRONT_{suffix}",
                f"RENDER_SERVICE_API_{suffix}", f"RENDER_SERVICE_FRONT_{suffix}"]
    if environment == "production":
        required.extend(["QA_BACKEND_IMAGE_SHA", "QA_FRONTEND_IMAGE_SHA"])
    for name in required:
        if not os.environ.get(name, "").strip():
            raise RuntimeError(f"Missing required environment variable: {name}")
    if environment == "production":
        for name in ("QA_BACKEND_IMAGE_SHA", "QA_FRONTEND_IMAGE_SHA"):
            if not re.fullmatch(r"(?:sha256:)?[0-9a-fA-F]{64}", os.environ[name]):
                raise RuntimeError(f"Invalid verified QA image SHA: {name}")
    for name in (f"RENDER_HOOK_API_{suffix}", f"RENDER_HOOK_FRONT_{suffix}"):
        url = urlsplit(os.environ[name])
        if url.scheme != "https" or url.hostname != "api.render.com" or not url.query:
            raise RuntimeError(f"Invalid Render hook configuration: {name}")
    if environment == "production":
        require_current_main(os.environ["GITHUB_SHA"])
    token = os.environ["RENDER_API_KEY"]
    deadline = time.monotonic() + 20 * 60
    deployments = {}
    images = image_urls(os.environ["GITHUB_SHA"])
    for name, service in (("backend", "API"), ("frontend", "FRONT")):
        deployments[name] = start_deploy(os.environ[f"RENDER_SERVICE_{service}_{suffix}"],
                                         os.environ[f"RENDER_HOOK_{service}_{suffix}"], token, deadline, images[name])
        if environment == "production":
            deployments[name]["image_sha"] = os.environ[f"QA_{name.upper()}_IMAGE_SHA"]
    wait_live(deployments, os.environ["GITHUB_SHA"], token, deadline, label)
    smoke(time.monotonic() + 5 * 60, environment)
    # Recheck both deployment IDs after smoke, detecting superseded deploys.
    wait_live(deployments, os.environ["GITHUB_SHA"], token, time.monotonic() + 60, label)
    if environment == "qa" and os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
            for name, deployment in deployments.items():
                output.write(f"{name}_image_sha={deployment['image_sha']}\n")
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as output:
            output.write(f"### {label} deploy verified\n\nCommit: `{os.environ['GITHUB_SHA']}`\n\n")
            for name, deployment in deployments.items():
                output.write(f"- {name}: `{deployment['id']}` — live; `{images[name]}`; image SHA `{deployment['image_sha']}`\n")
            output.write("\nAll four read-only smoke checks passed.\n")


if __name__ == "__main__":
    environment = parse_environment()
    try:
        main(environment)
    except (RuntimeError, KeyError, TypeError) as error:
        print(f"{ENVIRONMENTS[environment]['label']} deploy failed: {error}", flush=True)
        raise SystemExit(1)
