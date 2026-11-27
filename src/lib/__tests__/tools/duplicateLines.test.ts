import { describe, it, expect } from 'vitest';
import { removeDuplicateLines } from '../../tools/duplicateLines';

describe('duplicateLines', () => {
  it('removes duplicates', () => {
    expect(removeDuplicateLines('x\ny\nx').result).toBe('x\ny');
  });
});
