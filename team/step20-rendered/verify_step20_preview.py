"""Step 20 Phase 1 gate 1.5 — rendered checks on the step20 preview (guest flows).
Real Chromium via the local CONNECT relay (127.0.0.1:18099).
Writes JSON + screenshots to the evidence dir next to this script.
Usage: ~/workspace/.venv-img/bin/python verify_step20_preview.py
"""
import json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "https://eduvelto--step20-release-yjsbu3be.web.app"
OUT = Path(__file__).resolve().parent
OUT.mkdir(parents=True, exist_ok=True)

DESKTOP_ROUTES = [
    "/", "/jobs", "/jobs/bcs", "/jobs/common",
    "/jobs/viva", "/jobs/career", "/jobs/cv",
    "/jobs/circulars", "/jobs/planner", "/jobs/dashboard",
    "/admin", "/admin/app-version", "/admin/backup",
    "/ceo", "/library", "/about", "/founder", "/install",
]

def check_page(page, url):
    resp = page.goto(url, wait_until="domcontentloaded", timeout=60000)
    try:
        page.wait_for_selector("h1", timeout=20000)
    except Exception:
        pass
    page.wait_for_timeout(2500)
    info = page.evaluate("""() => {
        const h1s = Array.from(document.querySelectorAll('h1')).map(e => e.innerText.trim());
        const body = document.body.innerText;
        return {
            h1_count: h1s.length, h1_texts: h1s,
            body_start: body.slice(0, 300).replace(/\\n+/g, ' | '),
            has_login_wall: /লগইন/.test(body),
            title: document.title,
        };
    }""")
    info["url"] = url
    info["http_status"] = resp.status if resp else None
    return info

def bottom_nav_probe(page):
    return page.evaluate("""() => {
        const fixed = Array.from(document.querySelectorAll('body *')).filter(el => {
            const cs = getComputedStyle(el);
            return cs.position === 'fixed' && (cs.bottom === '0px' || cs.bottom === '0');
        });
        return fixed.map(el => {
            const cs = getComputedStyle(el);
            const btns = Array.from(el.querySelectorAll('button, a')).map(b => {
                const bcs = getComputedStyle(b);
                return { text: b.innerText.trim().slice(0, 40), color: bcs.color,
                         opacity: bcs.opacity, fontSize: bcs.fontSize };
            });
            return { tag: el.tagName, cls: (el.className.baseVal !== undefined ? '' : el.className).toString().slice(0, 80),
                     bg: cs.backgroundColor, buttons: btns };
        });
    }""")

def dark_logo_probe(page):
    return page.evaluate("""() => {
        const imgs = Array.from(document.querySelectorAll('header img, [class*=header] img, nav img')).map(im => {
            const cs = getComputedStyle(im);
            const parent = im.parentElement ? getComputedStyle(im.parentElement) : null;
            return { src: (im.getAttribute('src') || '').slice(-60), alt: im.alt,
                     img_bg: cs.backgroundColor, parent_bg: parent ? parent.backgroundColor : null };
        });
        return { header_imgs: imgs, body_bg: getComputedStyle(document.body).backgroundColor };
    }""")

def main():
    results = {"checked_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
               "base": BASE, "desktop": [], "mobile_nav": None, "dark": None}
    with sync_playwright() as p:
        browser = p.chromium.launch(
            proxy={"server": "http://127.0.0.1:18099"},
            args=["--ignore-certificate-errors"])
        # Desktop
        ctx = browser.new_context(ignore_https_errors=True, viewport={"width": 1280, "height": 800})
        page = ctx.new_page()
        for route in DESKTOP_ROUTES:
            url = BASE + route
            try:
                r = check_page(page, url)
            except Exception as e:
                r = {"url": url, "error": str(e)}
            results["desktop"].append(r)
            print(f"{url}: status={r.get('http_status')} h1={r.get('h1_count')} login_wall={r.get('has_login_wall')} texts={r.get('h1_texts')}", flush=True)
            if route in ("/jobs", "/admin/app-version"):
                page.screenshot(path=str(OUT / f"desktop-{route.strip('/').replace('/', '-') or 'home'}.png"))
        ctx.close()
        # Mobile bottom nav (Step 19 F1)
        mctx = browser.new_context(ignore_https_errors=True, viewport={"width": 390, "height": 844},
                                   user_agent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36",
                                   is_mobile=True, has_touch=True)
        mpage = mctx.new_page()
        mpage.goto(BASE + "/jobs", wait_until="domcontentloaded", timeout=60000)
        try:
            mpage.wait_for_selector("h1", timeout=20000)
        except Exception:
            pass
        mpage.wait_for_timeout(2500)
        results["mobile_nav"] = bottom_nav_probe(mpage)
        mpage.screenshot(path=str(OUT / "mobile-jobs-nav.png"))
        print("mobile bottom nav:", json.dumps(results["mobile_nav"], ensure_ascii=False)[:800], flush=True)
        mctx.close()
        # Dark mode logo (Step 19 F3)
        dctx = browser.new_context(ignore_https_errors=True, viewport={"width": 1280, "height": 800},
                                   color_scheme="dark")
        dpage = dctx.new_page()
        dpage.goto(BASE + "/", wait_until="domcontentloaded", timeout=60000)
        try:
            dpage.wait_for_selector("h1", timeout=20000)
        except Exception:
            pass
        dpage.wait_for_timeout(2500)
        results["dark"] = dark_logo_probe(dpage)
        dpage.screenshot(path=str(OUT / "dark-home.png"))
        print("dark logo:", json.dumps(results["dark"], ensure_ascii=False)[:600], flush=True)
        dctx.close()
        browser.close()
    (OUT / "step20-preview-rendered.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print("WROTE", OUT / "step20-preview-rendered.json")

if __name__ == "__main__":
    main()
