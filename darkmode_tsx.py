"""Dark-mode TSX pass for Eduvelto (22 Nov 2026).

Mechanical, audited mapping of hardcoded light hex values in inline
styles to the CSS variables added in index.css. Light values equal the
old hex, so light mode is pixel-identical.

Deliberately NOT mapped (coloured surfaces with white text — correct
in both modes): background '#142B3B'/'#0A1F44'/'#1E3A5F' (navy),
'#12766E' (teal button), '#1D4ED8' (blue button), '#15803D',
'#7E22CE', '#C2410C', '#9D174D', '#92400E', '#57534E' (category
accents), '#F1B308'/'#D9A441' (gold surfaces), color '#fff' (white text
on those surfaces), icon colours on the white chip.

Dynamic data colours (jobExams.ts / nuStructure.ts accentDeep used as
TEXT on a white card) are handled by hand after this pass — see the
report. Re-run is safe: already-mapped values no longer match.
"""
import re
import sys
from pathlib import Path

ROOT = Path('src')

# property -> {hex (lowercased, with #) -> var}
COLOR = {
    '#142b3b': 'var(--heading)', '#0a1f44': 'var(--heading)',
    '#1e3a5f': 'var(--heading)', '#041742': 'var(--heading)',
    '#57616a': 'var(--muted-ivory)', '#68747b': 'var(--muted)',
    '#5a6478': 'var(--muted)', '#3a444b': 'var(--ink-soft)',
    '#12766e': 'var(--teal-text)', '#b00020': 'var(--error)',
    '#8a6100': 'var(--amber-deep)', '#1e7ce8': 'var(--link)',
    '#1d4ed8': 'var(--link)', '#1e3a8a': 'var(--link-deep)',
    '#15803d': 'var(--success)', '#7e22ce': 'var(--purple)',
    '#d9a441': 'var(--amber)', '#9aa5ab': 'var(--muted)',
    '#9aa3a7': 'var(--muted)', '#8a94a8': 'var(--muted)',
    '#7a0013': 'var(--error-text)', '#111': 'var(--ink)',
    '#555': 'var(--ink-soft)', '#444': 'var(--ink-soft)',
    '#333': 'var(--ink)', '#999': 'var(--muted)',
    '#888': 'var(--muted)', '#9aa5ad': 'var(--muted)',
    '#202b33': 'var(--ink)', '#374151': 'var(--ink-soft)',
    '#5c4a12': 'var(--amber-dark-text)',
    '#137333': 'var(--success)', '#7a4d00': 'var(--amber-dark-text)',
}
BACKGROUND = {
    '#fff': 'var(--card)', '#f4f1e9': 'var(--bg)',
    '#fdf0f0': 'var(--error-bg)', '#e3f2f0': 'var(--teal-soft)',
    '#eff7f6': 'var(--teal-softer)', '#fdf3d0': 'var(--soon-bg)',
    '#fdf3d7': 'var(--soon-bg)', '#fff6d6': 'var(--soon-bg)',
    '#fff8e1': 'var(--soon-bg)', '#fffbeb': 'var(--soon-bg)',
    '#fbf3e2': 'var(--amber-soft)', '#fdf8ec': 'var(--amber-soft)',
    '#f7f9fc': 'var(--card)', '#f8f9f9': 'var(--card)',
    '#f4f7fa': 'var(--card)', '#f8f9fc': 'var(--card)',
    '#fafafa': 'var(--card)', '#f1f1f1': 'var(--hover)',
    '#e8effa': 'var(--hover)', '#f2f6ff': 'var(--hover)',
    '#eaf3fb': 'var(--hover)', '#f5f5f5': 'var(--card-subtle)',
    '#e3f2fd': 'var(--home-tint-blue)', '#e8f5e9': 'var(--home-tint-green)',
    '#f3e5f5': 'var(--home-tint-purple)', '#fff3e0': 'var(--home-tint-amber)',
    '#eff6ff': 'var(--hover)', '#e6f4ea': 'var(--home-tint-green)',
    '#fff4e0': 'var(--soon-bg)', '#eef2fb': 'var(--hover)',
    '#eee': 'var(--card-subtle)',
}
BORDER = {
    '#0a1f44': 'var(--heading)', '#1e3a5f': 'var(--heading)',
    '#142b3b': 'var(--heading)', '#aaa': 'var(--line-strong)',
    '#c9d2d8': 'var(--line-strong)', '#e3e7ea': 'var(--line)',
    '#e5e8e5': 'var(--line)', '#f3c1c8': 'var(--error-border)',
    '#bfe3df': 'var(--ok-border)', '#1d4ed8': 'var(--link)',
    '#12766e': 'var(--teal-text)', '#cfe7e4': 'var(--ok-border)',
    '#ddd': 'var(--line-strong)', '#eee': 'var(--line)',
    '#ccc': 'var(--line-strong)', '#d9dee2': 'var(--line)',
    '#e5e7eb': 'var(--line)', '#b45309': 'var(--amber-deep)',
    '#b00020': 'var(--error)',
}

def repl_for(mapping, prop_re):
    def f(m):
        hexval = m.group(2).lower()
        var = mapping.get(hexval)
        if var is None:
            return m.group(0)
        # group(1) already ends with the opening quote (or, for borders,
        # with the '1px solid ' prefix inside the quotes); group(3) is
        # the closing quote the match consumed, so re-add exactly one.
        return m.group(1) + var + "'"
    return f

total = 0
for path in sorted(ROOT.rglob('*.tsx')) + sorted(ROOT.rglob('*.ts')):
    if '__tests__' in path.parts:
        continue
    s = path.read_text()
    orig = s
    # color: '#hex'
    s = re.sub(r"(color:\s*')(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))(')",
               repl_for(COLOR, None), s)
    # background: '#hex' and backgroundColor: '#hex'
    s = re.sub(r"((?:background|backgroundColor):\s*')(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))(')",
               repl_for(BACKGROUND, None), s)
    # border: '1px solid #hex' / borderColor: '#hex' — hex inside quotes
    s = re.sub(r"((?:border|borderColor|borderTop|borderBottom):\s*'[^']*?)(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))(')",
               repl_for(BORDER, None), s)
    if s != orig:
        path.write_text(s)
        n = sum(1 for a, b in zip(orig.splitlines(), s.splitlines()) if a != b)
        print(f'{path}: {n} lines changed')
        total += n

print('total changed lines:', total)
