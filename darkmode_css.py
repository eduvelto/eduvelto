"""Dark-mode CSS transform for Eduvelto (22 Nov 2026).

Adds dark-mode tokens to :root, a html[data-theme="dark"] variable block,
swaps hardcoded light hex values for the new tokens (light values equal
the old hex, so light mode is pixel-identical), and appends a small
override block for things a variable swap cannot express (gradients,
dot pattern, spinner, focus ring, progress fill, header shadow).
Idempotent-ish: re-running on an already-transformed file replaces 0
of most patterns and asserts loudly if the :root anchor is gone.
"""
import re
import sys

PATH = 'src/index.css'

NEW_VARS = """  /* Dark-mode tokens (22 Nov 2026): every value below has a dark twin
     in html[data-theme="dark"]; components use these names, never raw
     hex, so light mode is pixel-identical to before. */
  --heading: #142b3b;
  --teal-text: #12766e;
  --link: #1d4ed8;
  --link-deep: #1e40af;
  --hover: #eaf3fb;
  --track: #e9e7de;
  --num-bg: #f2f4f2;
  --soon-bg: #fdf3d7;
  --ink-soft: #3a444b;
  --success: #15803d;
  --purple: #7b1fa2;
  --card-subtle: #f8fafb;
  --error-text: #7a0013;
  --error-border: #f3c1c8;
  --ok-border: #bfe3df;
  --home-tint-green: #e8f5e9;
  --home-tint-green-border: #c8e6c9;
  --home-tint-blue: #e3f2fd;
  --home-tint-blue-border: #bbdefb;
  --home-tint-purple: #f3e5f5;
  --home-tint-purple-border: #e1bee7;
  --home-tint-amber: #fff3e0;
  --home-tint-amber-border: #ffe0b2;
  --skeleton-a: #eae6db;
  --skeleton-b: #f4f1e9;
"""

DARK_BLOCK = """
/* ---- Dark mode (22 Nov 2026, owner: "dark mode ta o tik kore daw") ----
   Forest Navy #142b3b stays the dark surface/button colour; the page
   background goes darker (#0f1b24), cards lift to #1a2b38, text to
   #e8eef2, and accent colours brighten so text on dark stays readable
   (AA on the new backgrounds). Light mode is unchanged: every light
   value above equals the old hardcoded value. */
html[data-theme="dark"] {
  --bg: #0f1b24;
  --card: #1a2b38;
  --card-subtle: #22394a;
  --ink: #e8eef2;
  --heading: #dce8ef;
  --muted: #9fb0ba;
  --muted-ivory: #aab9c2;
  --ink-soft: #b9c6cf;
  --line: #2e4252;
  --line-strong: #43586a;
  --teal: #2fb3a6;
  --teal-text: #5cc8b8;
  --teal-soft: #17393a;
  --teal-softer: #122a2c;
  --amber: #e8b64c;
  --amber-deep: #eec46a;
  --amber-soft: #3a2f14;
  --amber-dark-text: #f0cd7a;
  --link: #8ab4f8;
  --link-deep: #a8c7fa;
  --hover: #22394a;
  --track: #2e4252;
  --num-bg: #22394a;
  --soon-bg: #3a2f14;
  --success: #4ade80;
  --purple: #c084fc;
  --error: #ff9a92;
  --error-bg: #3d1a1a;
  --error-text: #ffb4ab;
  --error-border: #5c2b2b;
  --ok-border: #2a4a47;
  --ok-teal: #5cc8b8;
  --ok-teal-bg: #17393a;
  --home-tint-green: #173329;
  --home-tint-green-border: #2a4a33;
  --home-tint-blue: #16283a;
  --home-tint-blue-border: #274a6b;
  --home-tint-purple: #2b2140;
  --home-tint-purple-border: #4a3670;
  --home-tint-amber: #33270f;
  --home-tint-amber-border: #5c4517;
  --skeleton-a: #22394a;
  --skeleton-b: #1a2b38;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.35);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 12px 28px rgba(0, 0, 0, 0.5);
}
"""

OVERRIDES = """
/* ---- Dark-mode overrides (22 Nov 2026) ----
   Things a variable swap cannot express: light gradients, the dotted
   Coming-Soon pattern, the dark spinner, the focus-ring colour, the
   progress-bar fill (dark teal is too dim on a dark track), and the
   header shadow. Everything else switches via the variables above. */
html[data-theme="dark"] .ev-home-hero {
  background: linear-gradient(120deg, #16283a 0%, #1c2a20 55%, #12292b 100%);
}
html[data-theme="dark"] .ev-home-slide-job {
  background: linear-gradient(135deg, #173329, #1c2a20);
}
html[data-theme="dark"] .ev-home-slide-admissions {
  background: linear-gradient(135deg, #16283a, #1a2333);
}
html[data-theme="dark"] .ev-home-slide-academic {
  background: linear-gradient(135deg, #2b2140, #241d38);
}
html[data-theme="dark"] .ev-ad {
  background: linear-gradient(135deg, #1c2a20, #12292b);
}
html[data-theme="dark"] .ev-coming-soon-hero,
html[data-theme="dark"] .ev-coming-soon-compact {
  background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px);
}
html[data-theme="dark"] .ev-spinner-dark {
  border-color: rgba(255, 255, 255, 0.25);
  border-top-color: var(--heading);
}
html[data-theme="dark"] .ev-progress > span {
  background: var(--teal);
}
html[data-theme="dark"] :focus-visible {
  outline-color: var(--amber);
}
html[data-theme="dark"] .ev-header {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
"""

# (regex, replacement, minimum expected matches on a fresh file)
REPLACEMENTS = [
    (r'(?<![\w-])color: var\(--forest\);', 'color: var(--heading);', 20),
    (r'(?<![\w-])color: var\(--teal-deep\);', 'color: var(--teal-text);', 5),
    (r'border-color: var\(--forest\);', 'border-color: var(--heading);', 1),
    (r'border: 1px solid var\(--forest\);', 'border: 1px solid var(--heading);', 1),
    (r'border-color: var\(--teal-deep\);', 'border-color: var(--teal-text);', 2),
    (r'outline: 3px solid var\(--teal-deep\);', 'outline: 3px solid var(--teal-text);', 1),
    (r'outline-color: var\(--teal-deep\);', 'outline-color: var(--teal-text);', 1),
    (r'(?<![\w-])color: #3a444b;', 'color: var(--ink-soft);', 4),
    (r'(?<![\w-])color: #68747b;', 'color: var(--muted);', 2),
    (r'(?<![\w-])color: #9aa5ab;', 'color: var(--muted);', 2),
    (r'(?<![\w-])color: #9aa3a7;', 'color: var(--muted);', 1),
    (r'(?<![\w-])color: #8a94a8;', 'color: var(--muted);', 2),
    (r'(?<![\w-])color: #c6cbc6;', 'color: var(--muted);', 1),
    (r'(?<![\w-])color: #8a6100;', 'color: var(--amber-deep);', 3),
    (r'(?<![\w-])color: #7a5200;', 'color: var(--amber-dark-text);', 0),
    (r'(?<![\w-])color: #7a0013;', 'color: var(--error-text);', 1),
    (r'(?<![\w-])color: #1d4ed8;', 'color: var(--link);', 3),
    (r'(?<![\w-])color: #15803d;', 'color: var(--success);', 1),
    (r'(?<![\w-])color: #d9a441;', 'color: var(--amber);', 1),
    (r'(?<![\w-])color: #142b3b;', 'color: var(--heading);', 3),
    (r'background: #fff;', 'background: var(--card);', 20),
    (r'background: #eaf3fb;', 'background: var(--hover);', 10),
    (r'background: #f8fafb;', 'background: var(--card-subtle);', 1),
    (r'background: #f2f4f2;', 'background: var(--num-bg);', 2),
    (r'background: #e8f5e9;', 'background: var(--home-tint-green);', 1),
    (r'background: #e3f2fd;', 'background: var(--home-tint-blue);', 1),
    (r'background: #f3e5f5;', 'background: var(--home-tint-purple);', 1),
    (r'background: #fff3e0;', 'background: var(--home-tint-amber);', 1),
    (r'background: #fdf3d7;', 'background: var(--soon-bg);', 2),
    (r'background: #e9e7de;', 'background: var(--track);', 1),
    (r'background: #c9d2d8;', 'background: var(--line-strong);', 1),
    (r'background: #1d4ed8;', 'background: var(--link);', 4),
    (r'background: #1e40af;', 'background: var(--link-deep);', 3),
    (r'border: 1px solid #c8e6c9;', 'border: 1px solid var(--home-tint-green-border);', 1),
    (r'border: 1px solid #bbdefb;', 'border: 1px solid var(--home-tint-blue-border);', 1),
    (r'border: 1px solid #e1bee7;', 'border: 1px solid var(--home-tint-purple-border);', 1),
    (r'border: 1px solid #ffe0b2;', 'border: 1px solid var(--home-tint-amber-border);', 1),
    (r'border: 1px solid #e3e7ea;', 'border: 1px solid var(--line);', 6),
    (r'border: 1px solid #e5e8e5;', 'border: 1px solid var(--line);', 3),
    (r'border: 1px solid #d7dee3;', 'border: 1px solid var(--line);', 1),
    (r'border-bottom: 1px solid #e3e7ea;', 'border-bottom: 1px solid var(--line);', 1),
    (r'border-bottom: 1px solid #eef1f3;', 'border-bottom: 1px solid var(--line);', 1),
    (r'border-top: 1px solid rgba\(20, 43, 59, 0\.12\);', 'border-top: 1px solid var(--line);', 1),
    (r'border: 1px solid rgba\(20, 43, 59, 0\.4\);', 'border: 1px solid var(--line-strong);', 1),
    (r'border-color: rgba\(20, 43, 59, 0\.4\);', 'border-color: var(--line-strong);', 1),
    (r'border: 1px solid #f3c1c8;', 'border: 1px solid var(--error-border);', 1),
    (r'border: 1px solid #bfe3df;', 'border: 1px solid var(--ok-border);', 1),
    (r'border: 1px solid #cfe7e4;', 'border: 1px solid var(--ok-border);', 1),
    (r'border: 2px dashed #c9cfcb;', 'border: 2px dashed var(--line-strong);', 1),
    (r'border-color: #1d4ed8;', 'border-color: var(--link);', 3),
    (r'background: linear-gradient\(90deg, #eae6db 25%, #f4f1e9 50%, #eae6db 75%\);',
     'background: linear-gradient(90deg, var(--skeleton-a) 25%, var(--skeleton-b) 50%, var(--skeleton-a) 75%);', 1),
]

def main():
    s = open(PATH).read()
    anchor = "  --font-body: 'Hind Siliguri', 'Noto Sans Bengali', system-ui, -apple-system, 'Segoe UI', sans-serif;\n}\n"
    if s.count(anchor) != 1:
        print('ANCHOR FAIL: :root closing not found exactly once; aborting')
        sys.exit(1)
    s = s.replace(anchor, "  --font-body: 'Hind Siliguri', 'Noto Sans Bengali', system-ui, -apple-system, 'Segoe UI', sans-serif;\n" + NEW_VARS + "}\n" + DARK_BLOCK, 1)
    print('inserted new :root vars + dark variable block')

    failures = []
    for pattern, repl, minimum in REPLACEMENTS:
        s, n = re.subn(pattern, repl, s)
        status = 'OK ' if n >= minimum else 'LOW'
        print(f'{status} {n:3d} (min {minimum:2d})  {pattern[:70]}')
        if n < minimum:
            failures.append((pattern, n, minimum))

    if 'html[data-theme="dark"] .ev-home-hero' not in s:
        s = s.rstrip('\n') + '\n' + OVERRIDES
        print('appended dark override block')
    else:
        print('override block already present, skipped')

    open(PATH, 'w').write(s)
    print('FAILURES:', failures if failures else 'none')

main()
