/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: calendar math in the company time zone (Europe/Prague) using only Intl, so daylight
// saving time is handled without a time zone library.

const TIME_ZONE = 'Europe/Prague';

const WORKING_HOURS_START = 8;
const WORKING_HOURS_END = 17;
const DIGEST_HOUR = 8;

const DAY_MS = 24 * 60 * 60 * 1000;

const WEEKDAY_INDEX = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

const formatters = {};

const getFormatter = (timeZone) => {
  if (!formatters[timeZone]) {
    formatters[timeZone] = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      weekday: 'short',
    });
  }

  return formatters[timeZone];
};

// Local wall clock parts of an instant; weekday is ISO (1 = Monday ... 7 = Sunday)
const getParts = (date, timeZone = TIME_ZONE) => {
  const parts = getFormatter(timeZone)
    .formatToParts(new Date(date))
    .reduce((result, { type, value }) => ({ ...result, [type]: value }), {});

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAY_INDEX[parts.weekday],
  };
};

const getOffset = (timestamp, timeZone) => {
  const parts = getParts(timestamp, timeZone);

  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return asUtc - Math.floor(timestamp / 1000) * 1000;
};

// Instant of a local wall clock time; day / month may overflow (e.g. day 32 = next month)
const fromLocal = (year, month, day, hour = 0, minute = 0, timeZone = TIME_ZONE) => {
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, 0);

  const offset = getOffset(asUtc, timeZone);
  let result = asUtc - offset;

  const nextOffset = getOffset(result, timeZone);
  if (nextOffset !== offset) {
    result = asUtc - nextOffset;
  }

  return new Date(result);
};

const getLocalDate = (date, timeZone = TIME_ZONE) => {
  const { year, month, day } = getParts(date, timeZone);

  return { year, month, day };
};

// Weekday (ISO) of a local calendar date, independent of time zone
const getWeekdayOfLocalDate = (year, month, day) => {
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return weekday === 0 ? 7 : weekday;
};

const isWorkday = (weekday) => weekday >= 1 && weekday <= 5;

const isWorkingTime = (date, timeZone = TIME_ZONE) => {
  const { weekday, hour } = getParts(date, timeZone);

  return isWorkday(weekday) && hour >= WORKING_HOURS_START && hour < WORKING_HOURS_END;
};

// Start of the next working window (Mon-Fri 08:00) strictly after the given instant
const getNextWorkingWindowStart = (date, timeZone = TIME_ZONE) => {
  const time = new Date(date).getTime();
  const { year, month, day } = getLocalDate(date, timeZone);

  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = fromLocal(year, month, day + offset, WORKING_HOURS_START, 0, timeZone);

    if (candidate.getTime() > time) {
      const { year: y, month: m, day: d } = getLocalDate(candidate, timeZone);

      if (isWorkday(getWeekdayOfLocalDate(y, m, d))) {
        return candidate;
      }
    }
  }

  return null; // Unreachable
};

// The most recent digest slot at or before the given instant (daily 08:00 / Monday 08:00)
const getLatestDigestSlot = (date, digest, timeZone = TIME_ZONE) => {
  const time = new Date(date).getTime();
  const { year, month, day } = getLocalDate(date, timeZone);

  if (digest === 'daily') {
    const today = fromLocal(year, month, day, DIGEST_HOUR, 0, timeZone);

    return today.getTime() <= time
      ? today
      : fromLocal(year, month, day - 1, DIGEST_HOUR, 0, timeZone);
  }

  if (digest === 'weekly') {
    const weekday = getWeekdayOfLocalDate(year, month, day);
    const monday = fromLocal(year, month, day - (weekday - 1), DIGEST_HOUR, 0, timeZone);

    return monday.getTime() <= time
      ? monday
      : fromLocal(year, month, day - (weekday - 1) - 7, DIGEST_HOUR, 0, timeZone);
  }

  return null;
};

const getDaysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

const Repeats = {
  NONE: 'none',
  DAILY: 'daily',
  WORKDAYS: 'workdays',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

/*
  Next occurrence of a reminder series strictly after both `nextAt` (the occurrence that just
  fired) and `now`. The time of day and the day of month come from `anchorAt` (the first occurrence
  the user picked), so a monthly reminder on the 31st fires on Feb 28 and then on Mar 31 again.
  Returns null when the reminder does not repeat.
*/
const getNextOccurrence = ({ nextAt, anchorAt, repeat, now }, timeZone = TIME_ZONE) => {
  if (!repeat || repeat === Repeats.NONE) {
    return null;
  }

  const nextAtTime = new Date(nextAt).getTime();
  const threshold = Math.max(nextAtTime, new Date(now || nextAt).getTime());
  const anchor = getParts(anchorAt || nextAt, timeZone);

  const isAfterThreshold = (candidate) => candidate.getTime() > threshold;

  if (repeat === Repeats.DAILY || repeat === Repeats.WORKDAYS) {
    const { year, month, day } = getLocalDate(threshold, timeZone);

    for (let offset = 0; offset < 16; offset += 1) {
      const candidate = fromLocal(year, month, day + offset, anchor.hour, anchor.minute, timeZone);

      if (isAfterThreshold(candidate)) {
        const { year: y, month: m, day: d } = getLocalDate(candidate, timeZone);

        if (repeat === Repeats.DAILY || isWorkday(getWeekdayOfLocalDate(y, m, d))) {
          return candidate;
        }
      }
    }

    return null; // Unreachable
  }

  if (repeat === Repeats.WEEKLY) {
    const { year, month, day } = getLocalDate(nextAtTime, timeZone);

    // Jump close to the threshold first, then step week by week
    const weeksBehind = Math.max(0, Math.floor((threshold - nextAtTime) / (7 * DAY_MS)) - 1);

    for (let week = weeksBehind + 1; week < weeksBehind + 4; week += 1) {
      const candidate = fromLocal(
        year,
        month,
        day + week * 7,
        anchor.hour,
        anchor.minute,
        timeZone,
      );

      if (isAfterThreshold(candidate)) {
        return candidate;
      }
    }

    return null; // Unreachable
  }

  if (repeat === Repeats.MONTHLY) {
    const { year, month } = getLocalDate(nextAtTime, timeZone);

    for (let offset = 1; offset < 1200; offset += 1) {
      const monthIndex = month - 1 + offset;
      const y = year + Math.floor(monthIndex / 12);
      const m = (monthIndex % 12) + 1;

      const candidate = fromLocal(
        y,
        m,
        Math.min(anchor.day, getDaysInMonth(y, m)),
        anchor.hour,
        anchor.minute,
        timeZone,
      );

      if (isAfterThreshold(candidate)) {
        return candidate;
      }
    }

    return null; // Unreachable
  }

  return null;
};

module.exports = {
  TIME_ZONE,
  WORKING_HOURS_START,
  WORKING_HOURS_END,
  Repeats,
  getParts,
  fromLocal,
  isWorkingTime,
  getNextWorkingWindowStart,
  getLatestDigestSlot,
  getNextOccurrence,
};
