import { describe, it, expect } from 'vitest';
import { cn } from '../src/lib/utils';

describe('cn (class name utility)', () => {
  it('returns a single class unchanged', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('merges multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('ignores falsy values', () => {
    expect(cn('foo', undefined, null as any, false, '')).toBe('foo');
  });

  it('handles conditional object syntax', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('handles array of classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('merges conflicting Tailwind classes (twMerge behaviour)', () => {
    // twMerge should keep only the last conflicting utility
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles mixed conditionals and strings', () => {
    const active = true;
    const disabled = false;
    expect(cn('base', { active, disabled })).toBe('base active');
  });

  it('returns empty string when no valid classes are given', () => {
    expect(cn(undefined, null as any, false)).toBe('');
  });

  it('deduplicates redundant classes via twMerge', () => {
    // twMerge removes earlier duplicate modifier
    expect(cn('font-bold', 'font-bold')).toBe('font-bold');
  });

  it('preserves non-conflicting Tailwind classes', () => {
    const result = cn('flex', 'items-center', 'justify-between');
    expect(result).toBe('flex items-center justify-between');
  });
});
