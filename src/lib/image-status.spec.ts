import { describe, expect, it } from 'vitest';
import { shouldPromoteOnFirstAnnotation } from './image-status.js';

describe('shouldPromoteOnFirstAnnotation (RN-05)', () => {
  it('promueve una imagen en "pending"', () => {
    expect(shouldPromoteOnFirstAnnotation('pending')).toBe(true);
  });

  it('no toca una imagen ya "in_progress"', () => {
    expect(shouldPromoteOnFirstAnnotation('in_progress')).toBe(false);
  });

  it('no reabre una imagen "completed"', () => {
    expect(shouldPromoteOnFirstAnnotation('completed')).toBe(false);
  });
});
