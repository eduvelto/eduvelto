"""Step 20 gate 1.9 — Bangla offline-state check on live https://eduvelto.com.
Read-only: loads the public homepage, then goes offline (context offline mode)
and reloads / navigates. Saves screenshots + page text."""
import json, sys
from playwright.sync_api import sync_playwright

BASE = "https://eduvelto.com"
OUT = "/home/hatch/workspace/eduorbit/team/step20-evidence"
results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--no-sandbox"])
    ctx = browser.new_context(
        proxy={"server": "http://127.0.0.1:18099"},
        viewport={"width": 1280, "height": 800},
        ignore_https_errors=True,  # egress proxy MITMs TLS; cert not in Chromium store
    )
    page = ctx.new_page()

    # 1. Online load of homepage
    resp = page.goto(BASE + "/", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_selector("h1", timeout=30000)
    page.wait_for_timeout(4000)
    results["online_home"] = {
        "status": resp.status if resp else None,
        "url": page.url,
        "h1": page.locator("h1").first.inner_text()[:200],
        "title": page.title(),
    }
    page.screenshot(path=f"{OUT}/offline-01-online-home.png")

    # 2. Go offline, then reload the homepage
    ctx.set_offline(True)
    try:
        page.reload(wait_until="domcontentloaded", timeout=30000)
    except Exception as e:
        results["offline_reload_error"] = f"{type(e).__name__}: {str(e)[:300]}"
    page.wait_for_timeout(4000)
    body_online_reload = page.locator("body").inner_text()[:3000]
    results["offline_reload"] = {
        "url": page.url,
        "body_text_first_3000": body_online_reload,
    }
    page.screenshot(path=f"{OUT}/offline-02-reload-offline.png")

    # 3. While still offline, navigate to /jobs
    try:
        page.goto(BASE + "/jobs", wait_until="domcontentloaded", timeout=30000)
    except Exception as e:
        results["offline_nav_error"] = f"{type(e).__name__}: {str(e)[:300]}"
    page.wait_for_timeout(4000)
    body_jobs = page.locator("body").inner_text()[:3000]
    results["offline_nav_jobs"] = {
        "url": page.url,
        "body_text_first_3000": body_jobs,
    }
    page.screenshot(path=f"{OUT}/offline-03-nav-jobs-offline.png")

    # 4. Back online, confirm recovery
    ctx.set_offline(False)
    page.goto(BASE + "/jobs", wait_until="domcontentloaded", timeout=60000)
    try:
        page.wait_for_selector("h1", timeout=30000)
        h1 = page.locator("h1").first.inner_text()[:200]
    except Exception as e:
        h1 = f"h1 wait failed: {e}"
    results["back_online_jobs"] = {"url": page.url, "h1": h1}
    page.screenshot(path=f"{OUT}/offline-04-back-online-jobs.png")

    browser.close()

# Bangla offline keyword scan over the offline-captured text
keywords = ["অফলাইন", "ইন্টারনেট", "সংযোগ", "নেটওয়ার্ক", "সংযোগ নেই", "অনলাইন"]
for key in ("offline_reload", "offline_nav_jobs"):
    text = results[key].get("body_text_first_3000", "")
    results[key]["bangla_offline_keywords_found"] = [k for k in keywords if k in text]

with open(f"{OUT}/offline-check.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(json.dumps(results, ensure_ascii=False, indent=2)[:6000])
