import { describe, expect, it } from 'vitest';
import { clearPendingSchoolRegistrationSession } from './schoolRegistrationSession';

describe('clearPendingSchoolRegistrationSession', () => {
  it('clears current and legacy pending OTP sessions', () => {
    const removed: string[] = [];
    const storage = {
      removeItem: (key: string) => removed.push(key),
    };

    clearPendingSchoolRegistrationSession(storage);

    expect(removed).toEqual([
      'schoolos_pending_school_registration',
      'edusphere_pending_school_registration',
    ]);
  });
});
