import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges conflicting Tailwind classes', () => {
    expect(cn('px-2', 'px-4', 'text-sm')).toBe('px-4 text-sm');
  });

  it('ignores falsy values', () => {
    const hidden = false;
    expect(cn('block', hidden && 'hidden', undefined, null)).toBe('block');
  });
});
