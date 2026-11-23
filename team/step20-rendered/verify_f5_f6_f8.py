"""Step 20 Phase 1 — F5/F6/F8 re-verification on the redeployed step20 preview.
- F5: measure .ev-chip-btn targets on /jobs/circulars (+ /jobs/notifications if rendered).
- F6: collect console errors / failed requests on / and /jobs; flag CSP connect-src
  violations mentioning adtrafficquality / google ads.
- F8: dark mode — count [data-ad-preview] elements; if any, record its background.
Writes step20-f5-f6-f8-verify.json next to this script.
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
        # F6: console + request failures on / and /jobs
        msgs, fails = [], []
        page.on("console", lambda m: msgs.append({"type": m.type, "text": m.text[:300]}) if m.type in ("error", "warning") else None)
        page.on("pageerror", lambda e: msgs.append({"type": "pageerror", "text": str(e)[:300]}))
        page.on("requestfailed", lambda r: fails.append({"url": r.url[:160], "failure": str(r.failure)[:120]}))
        for route in ("/", "/jobs"):
            page.goto(BASE + route, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(4000)
        res["console_errors"] = [m for m in msgs if m["type"] == "error"]
        res["console_warnings_csp"] = [m for m in msgs if m["type"] == "warning" and ("CSP" in m["text"] or "Content Security" in m["text"])]
        res["failed_requests"] = fails
        res["csp_mentions_adtrafficquality"] = [m for m in msgs if "adtrafficquality" in m["text"].lower()]
        print("console errors:", json.dumps(res["console_errors"], ensure_ascii=False)[:1000], flush=True)
        print("failed requests:", json.dumps(res["failed_requests"], ensure_ascii=False)[:600], flush=True)
        # F5: chip buttons
        for route in ("/jobs/circulars", "/jobs/notifications"):
            page.goto(BASE + route, wait_until="domcontentloaded", timeout=60000)
            try:
                page.wait_for_selector("h1", timeout=20000)
            except Exception:
                pass
            page.wait_for_timeout(2500)
            chips = page.evaluate("""() => {
                const els = Array.from(document.querySelectorAll('.ev-chip-btn'));
                return els.map(el => {
                    const r = el.getBoundingClientRect();
                    return { text: el.innerText.trim().slice(0, 30),
                             w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 };
                });
            }""")
            key = "chips_" + route.strip("/").replace("/", "_")
            res[key] = chips
            print(f"{route}: {len(chips)} chip buttons ->", json.dumps(chips, ensure_ascii=False)[:500], flush=True)
        page.screenshot(path=str(OUT / "f5-circulars.png"))
        ctx.close()
        # F8: dark mode ad placeholder
        dctx = browser.new_context(ignore_https_errors=True, viewport={"width": 1280, "height": 800},
                                   color_scheme="dark")
        dpage = dctx.new_page()
        dpage.goto(BASE + "/", wait_until="domcontentloaded", timeout=60000)
        dpage.wait_for_timeout(3000)
        res["dark_ad_preview"] = dpage.evaluate("""() => {
            const els = Array.from(document.querySelectorAll('[data-ad-preview]'));
            return els.map(el => {
                const cs = getComputedStyle(el);
                return { bg: cs.backgroundColor, color: cs.color,
                         text: el.innerText.trim().slice(0, 60) };
            });
        }""")
        print("dark [data-ad-preview]:", json.dumps(res["dark_ad_preview"], ensure_ascii=False), flush=True)
        dctx.close()
        browser.close()
    (OUT / "step20-f5-f6-f8-verify.json").write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
    print("WROTE", OUT / "step20-f5-f6-f8-verify.json")

if __name__ == "__main__":
    main()
