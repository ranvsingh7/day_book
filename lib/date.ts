const APP_TIME_ZONE = process.env.APP_TIME_ZONE || "Asia/Kolkata";

function getTimeZoneParts(date: Date, timeZone = APP_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: lookup("year"),
    month: lookup("month"),
    day: lookup("day"),
    hour: lookup("hour"),
    minute: lookup("minute"),
    second: lookup("second"),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone = APP_TIME_ZONE) {
  const parts = getTimeZoneParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    0
  );

  return asUtc - date.getTime();
}

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number,
  timeZone = APP_TIME_ZONE
) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms));
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offset);
}

export function startOfDay(date: Date, timeZone = APP_TIME_ZONE) {
  const parts = getTimeZoneParts(date, timeZone);
  return zonedDateTimeToUtc(parts.year, parts.month, parts.day, 0, 0, 0, 0, timeZone);
}

export function endOfDay(date: Date, timeZone = APP_TIME_ZONE) {
  const parts = getTimeZoneParts(date, timeZone);
  const nextDayStart = zonedDateTimeToUtc(
    parts.year,
    parts.month,
    parts.day + 1,
    0,
    0,
    0,
    0,
    timeZone
  );
  return new Date(nextDayStart.getTime() - 1);
}

export function startOfMonth(date: Date, timeZone = APP_TIME_ZONE) {
  const parts = getTimeZoneParts(date, timeZone);
  return zonedDateTimeToUtc(parts.year, parts.month, 1, 0, 0, 0, 0, timeZone);
}

export function endOfMonth(date: Date, timeZone = APP_TIME_ZONE) {
  const parts = getTimeZoneParts(date, timeZone);
  const nextMonthStart = zonedDateTimeToUtc(parts.year, parts.month + 1, 1, 0, 0, 0, 0, timeZone);
  return new Date(nextMonthStart.getTime() - 1);
}

export function toDateString(date: Date, timeZone = APP_TIME_ZONE) {
  const parts = getTimeZoneParts(date, timeZone);
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}
