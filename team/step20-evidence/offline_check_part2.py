"""Step 20 gate 1.9 — offline-state check, part 2 (supplementary).
(a) Is a service worker registered on the live site?
(b) Network drops while the page is already loaded — any in-app banner?
(c) Client-side navigation while offline — what shows?
(d) Dump the chrome-error page DOM after a failed offline reload."""
import json
from playwright.sync_api import sync_playwright

BASE = "https://eduvelto.com"
OUT = "/home/hatch/workspace/eduorbit/team/step20-evidence"
results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--no-sandbox"])
    ctx = browser.new_context(
        proxy={"server": "http://127.0.0.1:18099"},
        viewport={"width": 1280, "height": 800},
        ignore_https_errors=True,
    )
    page = ctx.new_page()
    page.goto(BASE + "/", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_selector("h1", timeout=30000)
    page.wait_for_timeout(5000)

    # (a) service worker state
    results["service_worker"] = page.evaluate("""async () => {
        if (!('serviceWorker' in navigator)) return {supported: false};
        const regs = await navigator.serviceWorker.getRegistrations();
        return {supported: true, count: regs.length,
                regs: regs.map(r => ({scope: r.scope, active: !!r.active,
                                       state: r.active ? r.active.state : null}))};
    }""")
    results["navigator_onLine_online"] = page.evaluate("navigator.onLine")

    # (b) drop network while loaded (no reload)
    ctx.set_offline(True)
    page.wait_for_timeout(5000)
    results["offline_while_loaded"] = {
        "navigator_onLine": page.evaluate("navigator.onLine"),
        "body_text_first_2000": page.locator("body").inner_text()[:2000],
    }
    page.screenshot(path=f"{OUT}/offline-05-drop-while-loaded.png")

    # (c) client-side navigation while offline: click the Jobs nav link if present
    try:
        link = page.locator('a[href="/jobs"]').first
        if link.count() > 0:
            link.click(timeout=10000)
            page.wait_for_timeout(4000)
            results["offline_client_nav"] = {
                "clicked": True, "url": page.url,
                "body_text_first_2000": page.locator("body").inner_text()[:2000],
            }
        else:
            results["offline_client_nav"] = {"clicked": False, "reason": "no a[href=/jobs] found"}
    except Exception as e:
        results["offline_client_nav"] = {"clicked": False, "error": f"{type(e).__name__}: {str(e)[:300]}", "url": page.url}
    page.screenshot(path=f"{OUT}/offline-06-client-nav-offline.png")

    # (d) hard reload while offline, then dump error-page DOM
    try:
        page.reload(wait_until="domcontentloaded", timeout=30000)
    except Exception as e:
        results["offline_hard_reload_error"] = f"{type(e).__name__}: {str(e)[:200]}"
    page.wait_for_timeout(3000)
    try:
        dom = page.evaluate("document.documentElement ? document.documentElement.outerHTML.slice(0, 2000) : 'no documentElement'")
        title = page.title()
    except Exception as e:
        dom, title = f"evaluate failed: {e}", ""
    results["offline_error_page"] = {"url": page.url, "title": title, "dom_first_2000": dom}
    page.screenshot(path=f"{OUT}/offline-07-error-page.png")
    browser.close()

with open(f"{OUT}/offline-check-part2.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(json.dumps(results, ensure_ascii=False, indent=2)[:5000])
