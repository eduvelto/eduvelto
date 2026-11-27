/**
 * JSON Formatter — pure logic. Parses with JSON.parse and re-prints;
 * invalid JSON returns a readable error instead of throwing into the UI.
 */
export interface JsonCheck { valid: boolean; error?: string; }

export function validateJson(text: string): JsonCheck {
  if (text.trim() === '') return { valid: false, error: 'Empty input — paste some JSON first.' };
  try {
    JSON.parse(text);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'Invalid JSON.' };
  }
}

export function formatJson(text: string, indent = 2): string {
  const parsed: unknown = JSON.parse(text);
  return JSON.stringify(parsed, null, indent);
}

export function minifyJson(text: string): string {
  return JSON.stringify(JSON.parse(text));
}

export function sortJsonKeys(text: string): string {
  const parsed: unknown = JSON.parse(text);
  const sortDeep = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sortDeep);
    if (value !== null && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(value as Record<string, unknown>).sort()) {
        out[key] = sortDeep((value as Record<string, unknown>)[key]);
      }
      return out;
    }
    return value;
  };
  return JSON.stringify(sortDeep(parsed), null, 2);
}
