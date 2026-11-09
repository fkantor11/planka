import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NOTIFICATION_EVENT_GROUPS,
  normalizeNotificationSettings,
  setNotificationEventChannel,
  setNotificationOption,
} from './notification-settings';

describe('normalizeNotificationSettings', () => {
  test('returns defaults for missing settings', () => {
    expect(normalizeNotificationSettings(undefined)).toEqual(DEFAULT_NOTIFICATION_SETTINGS);
    expect(normalizeNotificationSettings(null)).toEqual(DEFAULT_NOTIFICATION_SETTINGS);
  });

  test('keeps valid values and replaces invalid ones', () => {
    const settings = normalizeNotificationSettings({
      events: {
        mentioned: { email: false },
        overdue: { inApp: 'no' },
      },
      digest: 'weekly',
      dueReminderOffset: '5d',
    });

    expect(settings.events.mentioned).toEqual({ inApp: true, email: false });
    expect(settings.events.overdue).toEqual({ inApp: true, email: true });
    expect(settings.digest).toBe('weekly');
    expect(settings.dueReminderOffset).toBe('1d');
  });
});

describe('setNotificationEventChannel', () => {
  test('changes one channel and keeps the rest complete', () => {
    const settings = setNotificationEventChannel(null, 'commentOnSubscribed', 'email', true);

    expect(settings.events.commentOnSubscribed).toEqual({ inApp: true, email: true });
    expect(settings.events.addedToCard).toEqual({ inApp: true, email: true });
    expect(settings.digest).toBe('none');
  });
});

describe('setNotificationOption', () => {
  test('changes an option', () => {
    expect(setNotificationOption(null, 'quietHours', true).quietHours).toBe(true);
  });
});

describe('NOTIFICATION_EVENT_GROUPS', () => {
  test('lists every event exactly once', () => {
    const eventKeys = NOTIFICATION_EVENT_GROUPS.flatMap(({ eventKeys: keys }) => keys);

    expect(eventKeys.sort()).toEqual(Object.keys(DEFAULT_NOTIFICATION_SETTINGS.events).sort());
  });
});
