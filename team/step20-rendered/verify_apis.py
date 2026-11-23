"""Focused probe: does apis.google.com/js/api.js hit a CSP error on the preview
with a longer dwell (Lighthouse saw it on live; the short probe did not)?
Loads / and /jobs, waits 15 s each, collects console errors + CSP-blocked requests.
"""
import json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "https://eduvelto--step20-release-yjsbu3be.web.app"
OUT = Path(__file__).resolve().parent

def main():
    res = {"checked_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "base": BASE}
    with sync_playwright() as p:
        browser = p.chromium.launch(proxy={"server": "http://127.0.0.1:18099"},
                                    args=["--ignore-certificate-errors"])
        ctx = browser.new_context(ignore_https_errors=True, viewport={"width": 1280, "height": 800})
        page = ctx.new_page()
        msgs, fails = [], []
        page.on("console", lambda m: msgs.append({"type": m.type, "text": m.text[:400]}) if m.type == "error" else None)
        page.on("requestfailed", lambda r: fails.append({"url": r.url[:180], "failure": str(r.failure)[:80]}))
        for route in ("/", "/jobs"):
            page.goto(BASE + route, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(15000)
            print(f"{route}: {len(msgs)} console errors so far", flush=True)
        res["console_errors"] = msgs
        res["failed_requests"] = fails
        print("console errors:", json.dumps(msgs, ensure_ascii=False)[:1500], flush=True)
        print("csp-blocked:", json.dumps([f for f in fails if f["failure"] == "csp"], ensure_ascii=False)[:500], flush=True)
        browser.close()
    (OUT / "step20-apis-probe.json").write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
    print("WROTE", OUT / "step20-apis-probe.json")

if __name__ == "__main__":
    main()
