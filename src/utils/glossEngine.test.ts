import { describe, expect, it } from 'vitest';
import { convertToGloss } from './glossEngine';

describe('convertToGloss', () => {
  it('uses the airport gloss dictionary for known sentences', () => {
    expect(convertToGloss('탑승 수속 창구가 어디인가요?')).toBe('탑승수속 창구 어디');
  });

  it('normalizes particles and polite endings for unknown sentences', () => {
    expect(convertToGloss('안내 데스크에서 도와주세요.')).toBe('안내 데스크 도와주다');
  });
});
