const { expect } = require('chai');

const {
  fromLocal,
  getParts,
  isWorkingTime,
  getNextWorkingWindowStart,
  getLatestDigestSlot,
  getNextOccurrence,
} = require('../../utils/zoned-time');
const {
  normalize,
  isValidPatch,
  merge,
  DEFAULT_SETTINGS,
} = require('../../utils/notification-settings');

const local = (date) => {
  const { year, month, day, hour, minute, weekday } = getParts(date);

  return { year, month, day, hour, minute, weekday };
};

describe('zoned-time', () => {
  it('converts Prague wall clock time across daylight saving changes', () => {
    expect(fromLocal(2026, 7, 1, 8, 0).toISOString()).to.equal('2026-07-01T06:00:00.000Z');
    expect(fromLocal(2026, 12, 1, 8, 0).toISOString()).to.equal('2026-12-01T07:00:00.000Z');
  });

  it('knows the working window', () => {
    expect(isWorkingTime(fromLocal(2026, 11, 9, 8, 0))).to.equal(true); // Monday
    expect(isWorkingTime(fromLocal(2026, 11, 9, 16, 59))).to.equal(true);
    expect(isWorkingTime(fromLocal(2026, 11, 9, 17, 0))).to.equal(false);
    expect(isWorkingTime(fromLocal(2026, 11, 14, 10, 0))).to.equal(false); // Saturday
  });

  it('finds the next working window start', () => {
    expect(local(getNextWorkingWindowStart(fromLocal(2026, 11, 13, 18, 0)))).to.include({
      day: 16,
      hour: 8,
      weekday: 1,
    });
    expect(local(getNextWorkingWindowStart(fromLocal(2026, 11, 10, 6, 0)))).to.include({
      day: 10,
      hour: 8,
    });
  });

  it('finds the latest digest slot', () => {
    expect(local(getLatestDigestSlot(fromLocal(2026, 11, 11, 7, 59), 'daily'))).to.include({
      day: 10,
      hour: 8,
    });
    expect(local(getLatestDigestSlot(fromLocal(2026, 11, 11, 8, 0), 'daily'))).to.include({
      day: 11,
      hour: 8,
    });
    expect(local(getLatestDigestSlot(fromLocal(2026, 11, 11, 12, 0), 'weekly'))).to.include({
      day: 9,
      weekday: 1,
    });
    expect(local(getLatestDigestSlot(fromLocal(2026, 11, 9, 7, 0), 'weekly'))).to.include({
      day: 2,
      weekday: 1,
    });
  });

  describe('#getNextOccurrence', () => {
    const friday = fromLocal(2026, 11, 13, 9, 30);

    it('does not repeat "none"', () => {
      expect(getNextOccurrence({ nextAt: friday, anchorAt: friday, repeat: 'none' })).to.equal(
        null,
      );
    });

    it('repeats daily, including the weekend', () => {
      expect(
        local(getNextOccurrence({ nextAt: friday, anchorAt: friday, repeat: 'daily' })),
      ).to.include({ day: 14, hour: 9, minute: 30 });
    });

    it('skips Saturday and Sunday on workdays', () => {
      expect(
        local(getNextOccurrence({ nextAt: friday, anchorAt: friday, repeat: 'workdays' })),
      ).to.include({ day: 16, weekday: 1, hour: 9, minute: 30 });

      const saturday = fromLocal(2026, 11, 14, 9, 30);
      expect(
        local(getNextOccurrence({ nextAt: saturday, anchorAt: friday, repeat: 'workdays' })),
      ).to.include({ day: 16, weekday: 1 });
    });

    it('repeats weekly and catches up missed weeks only once', () => {
      expect(
        local(getNextOccurrence({ nextAt: friday, anchorAt: friday, repeat: 'weekly' })),
      ).to.include({ day: 20, weekday: 5 });

      const now = fromLocal(2026, 12, 2, 12, 0);
      expect(
        local(getNextOccurrence({ nextAt: friday, anchorAt: friday, repeat: 'weekly', now })),
      ).to.include({ month: 12, day: 4, weekday: 5 });
    });

    it('repeats monthly keeping the day of month, clamped', () => {
      const anchor = fromLocal(2027, 1, 31, 9, 0);

      const february = getNextOccurrence({ nextAt: anchor, anchorAt: anchor, repeat: 'monthly' });
      expect(local(february)).to.include({ month: 2, day: 28 });

      const march = getNextOccurrence({ nextAt: february, anchorAt: anchor, repeat: 'monthly' });
      expect(local(march)).to.include({ month: 3, day: 31, hour: 9 });
    });

    it('keeps the local time over a daylight saving change', () => {
      const anchor = fromLocal(2026, 10, 1, 9, 0);
      const nextAt = fromLocal(2026, 10, 24, 9, 0);

      expect(local(getNextOccurrence({ nextAt, anchorAt: anchor, repeat: 'daily' }))).to.include({
        day: 25,
        hour: 9,
      });
    });
  });
});

describe('notification-settings', () => {
  it('fills defaults', () => {
    expect(normalize(null)).to.deep.equal(DEFAULT_SETTINGS);
    expect(normalize({ digest: 'daily' }).digest).to.equal('daily');
    expect(normalize({ digest: 'hourly' }).digest).to.equal('none');
  });

  it('validates patches strictly', () => {
    expect(isValidPatch({ events: { mentioned: { email: false } } })).to.equal(true);
    expect(isValidPatch({ quietHours: true, digest: 'weekly', dueReminderOffset: '2d' })).to.equal(
      true,
    );
    expect(isValidPatch({ events: { unknown: { email: false } } })).to.equal(false);
    expect(isValidPatch({ events: { mentioned: { teams: false } } })).to.equal(false);
    expect(isValidPatch({ events: { mentioned: { email: 'no' } } })).to.equal(false);
    expect(isValidPatch({ dueReminderOffset: '3d' })).to.equal(false);
    expect(isValidPatch({ foo: 1 })).to.equal(false);
    expect(isValidPatch([])).to.equal(false);
  });

  it('merges patches', () => {
    const settings = merge(null, { events: { mentioned: { email: false } } });

    expect(settings.events.mentioned).to.deep.equal({ inApp: true, email: false });
    expect(settings.events.addedToCard).to.deep.equal({ inApp: true, email: true });
  });
});
