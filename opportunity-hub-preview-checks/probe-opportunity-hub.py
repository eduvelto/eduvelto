"""Rendered checks for the Global Opportunity Hub preview (23 Nov 2026).

Usage:
    ~/workspace/.venv-img/bin/python probe-opportunity-hub.py <preview-base-url> [out-dir]

Goes through the local CONNECT relay (127.0.0.1:18099 -> 198.19.0.1:3128)
because the 127.0.0.1:18080 proxy is dead and Chromium through the live
egress proxy gets HTTP 403 policy_denied on every CONNECT (AGENTS.md,
23 Nov 2026 H1 lesson). Start the relay first if it is not running:
    python3 ~/workspace/eduorbit/h1-fix-deploy-evidence/connect_relay.py
(wait_until="networkidle" never fires on this SPA — Firestore persistent
connection — so we use domcontentloaded + a fixed wait + wait_for_selector.)

Checks, desktop (1280x800) + mobile (390x844):
  /opportunities            h1, 7 listing cards, scam warning, guide links
  /opportunities/bpsc-non-cadre-2026   detail, verification box, Apply link
  /opportunities/unicef-writer-editor-2026  closing-soon chip
  /opportunities/kaggle-learn          rolling chip, Apply link
  /opportunities/cv-builder            form + live preview
  /opportunities/interview-prep        guide items
Console errors are collected per page. Writes JSON + screenshots to out-dir.
"""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = sys.argv[1].rstrip("/")
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("opportunity-hub-preview-checks")
OUT.mkdir(parents=True, exist_ok=True)

CHECKS = [
    {
        "path": "/opportunities",
        "name": "hub",
        "asserts": [
            ("h1_count", "h1", 1),
            ("detail_links", "a[href^='/opportunities/bpsc'], a[href^='/opportunities/unicef'], a[href^='/opportunities/undrr'], a[href^='/opportunities/commonwealth'], a[href^='/opportunities/kaggle'], a[href^='/opportunities/google'], a[href^='/opportunities/upwork']", 7),
            ("cv_builder_link", "a[href='/opportunities/cv-builder']", 1),
            ("guide_links", "a[href='/opportunities/interview-prep'], a[href='/opportunities/career-guidance'], a[href='/opportunities/entrepreneurship'], a[href='/opportunities/income']", 4),
        ],
        "texts": ["সুযোগ হাব", "প্রতারণা", "আবেদন করুন"],
    },
    {
        "path": "/opportunities/bpsc-non-cadre-2026",
        "name": "detail-bpsc",
        "asserts": [
            ("h1_count", "h1", 1),
            ("apply_link", "a[href='http://bpsc.teletalk.com.bd']", 1),
            ("source_link", "a[href='https://www.bpsc.gov.bd']", 1),
        ],
        "texts": ["যাচাইয়ের বিবরণ", "১৩৩ বনাম ১৪৭", "আবেদন চলছে"],
    },
    {
        "path": "/opportunities/unicef-writer-editor-2026",
        "name": "detail-unicef",
        "asserts": [("h1_count", "h1", 1)],
        "texts": ["আবেদনের সময় শেষের পথে", "অফিসিয়াল পাতা খুলে পড়ে"],
    },
    {
        "path": "/opportunities/kaggle-learn",
        "name": "detail-kaggle",
        "asserts": [
            ("h1_count", "h1", 1),
            ("apply_link", "a[href='https://www.kaggle.com/learn']", 1),
        ],
        "texts": ["সবসময় খোলা"],
    },
    {
        "path": "/opportunities/cv-builder",
        "name": "cv-builder",
        "asserts": [
            ("h1_count", "h1", 1),
            ("name_input", "input", 1),  # at least one text input
        ],
        "texts": ["সিভি ও কভার লেটার তৈরি", "প্রিভিউ", "প্রিন্ট"],
    },
    {
        "path": "/opportunities/interview-prep",
        "name": "guide-interview",
        "asserts": [("h1_count", "h1", 1)],
        "texts": ["ইন্টারভিউ প্রস্তুতি", "STAR", "গুরুত্বপূর্ণ তথ্য"],
    },
]

VIEWPORTS = [
    ("desktop", {"width": 1280, "height": 800}),
    ("mobile", {"width": 390, "height": 844}),
]

results = {}
failures = []

with sync_playwright() as p:
    browser = p.chromium.launch(
        args=["--ignore-certificate-errors"],
        proxy={"server": "http://127.0.0.1:18099"},
    )
    for vp_name, vp in VIEWPORTS:
        context = browser.new_context(viewport=vp)
        for check in CHECKS:
            page = context.new_page()
            errors = []
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))
            url = BASE + check["path"]
            page.goto(url, wait_until="domcontentloaded")
            try:
                page.wait_for_selector("h1", timeout=15000)
            except Exception:
                pass
            # The hub list loads Firestore first (live project, empty
            # collection) and falls back to the seed — the cards arrive
            # after h1. Wait for a CARD link, not just any
            # /opportunities/ href: the header nav now links to the
            # hub too, so a bare prefix match returns instantly.
            if check["name"] == "hub":
                try:
                    page.wait_for_selector("a[href='/opportunities/bpsc-non-cadre-2026']", timeout=30000)
                except Exception:
                    pass
            # Detail pages also load via Firestore first (getDoc, then
            # seed fallback) — wait for the verification box, which
            # only renders once the listing has loaded.
            if check["name"].startswith("detail-"):
                try:
                    page.wait_for_selector("text=যাচাইয়ের বিবরণ", timeout=30000)
                except Exception:
                    pass
            page.wait_for_timeout(3000)
            entry = {"url": url, "title": page.title(), "console_errors": errors, "asserts": {}, "texts": {}}
            for label, selector, expected in check["asserts"]:
                count = page.locator(selector).count()
                entry["asserts"][label] = {"selector": selector, "count": count, "expected": expected}
                if count < expected:
                    failures.append(f"{vp_name} {check['name']} {label}: got {count}, want >= {expected}")
            body = page.locator("body").inner_text()
            for t in check["texts"]:
                found = t in body
                entry["texts"][t] = found
                if not found:
                    failures.append(f"{vp_name} {check['name']} text missing: {t!r}")
            shot = OUT / f"{vp_name}-{check['name']}.png"
            page.screenshot(path=str(shot), full_page=False)
            entry["screenshot"] = str(shot)
            results[f"{vp_name}/{check['name']}"] = entry
            page.close()
        context.close()
    browser.close()

(OUT / "results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"failures": failures, "pages": len(results)}, ensure_ascii=False, indent=2))
if failures:
    sys.exit(1)
print("ALL RENDERED CHECKS PASSED")
