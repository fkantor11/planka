import {
  getDefaultReminderInput,
  parseReminderInput,
  sortReminders,
  toDateInputValue,
  toTimeInputValue,
} from './card-reminders';

describe('card reminders', () => {
  test('default input is tomorrow at 9:00', () => {
    expect(getDefaultReminderInput(new Date(2026, 10, 30, 15, 45))).toEqual({
      date: '2026-12-01',
      time: '09:00',
    });
  });

  test('parses local date and time', () => {
    const date = parseReminderInput('2026-11-13', '9:05');

    expect(toDateInputValue(date)).toBe('2026-11-13');
    expect(toTimeInputValue(date)).toBe('09:05');
  });

  test('rejects invalid input', () => {
    expect(parseReminderInput('', '09:00')).toBeNull();
    expect(parseReminderInput('2026-02-30', '09:00')).toBeNull();
    expect(parseReminderInput('2026-02-10', '24:00')).toBeNull();
    expect(parseReminderInput('2026-02-10', 'nine')).toBeNull();
  });

  test('sorts by next occurrence', () => {
    const reminders = [
      { id: 'b', nextAt: '2026-11-12T08:00:00.000Z' },
      { id: 'a', nextAt: '2026-11-10T08:00:00.000Z' },
    ];

    expect(sortReminders(reminders).map(({ id }) => id)).toEqual(['a', 'b']);
    expect(reminders[0].id).toBe('b');
  });
});
