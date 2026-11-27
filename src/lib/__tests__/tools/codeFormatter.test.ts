import { describe, it, expect } from 'vitest';
import { minifyCode, beautifyCode } from '../../tools/codeFormatter';

describe('codeFormatter', () => {
  it('minifies CSS', () => {
    expect(minifyCode('a { color: red; /* note */ margin: 0; }', 'css')).toBe('a{color:red;margin:0}');
  });
  it('beautifies JS by brace depth', () => {
    const out = beautifyCode('function f() { return 1; }', 'javascript');
    expect(out).toContain('\n  return 1;');
  });
  it('beautifies HTML by tag depth', () => {
    const out = beautifyCode('<div><p>hi</p></div>', 'html');
    expect(out).toBe('<div>\n  <p>hi</p>\n</div>');
  });
});
