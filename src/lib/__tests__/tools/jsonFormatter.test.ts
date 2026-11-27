import { describe, it, expect } from 'vitest';
import { validateJson, formatJson, minifyJson, sortJsonKeys } from '../../tools/jsonFormatter';

describe('jsonFormatter', () => {
  it('formats and minifies', () => {
    expect(formatJson('{"b":1,"a":2}', 2)).toBe('{\n  "b": 1,\n  "a": 2\n}');
    expect(minifyJson('{ "a": 1 }')).toBe('{"a":1}');
  });
  it('sorts keys', () => {
    expect(sortJsonKeys('{"b":1,"a":2}')).toContain('"a": 2');
  });
  it('reports invalid JSON with an error', () => {
    expect(validateJson('{"a":}').valid).toBe(false);
    expect(validateJson('{"a":1}').valid).toBe(true);
    expect(() => formatJson('not json')).toThrow();
  });
});
