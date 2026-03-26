import moment from "moment-timezone";

const DAILY_CUTOFF_HOUR = 1;
const DAILY_TIMEZONE = "Europe/Paris";

export function getCurrentDailySetId(now: Date = new Date()): string {
  const currentTime = moment(now).tz(DAILY_TIMEZONE);
  const dailyDate =
    currentTime.hour() < DAILY_CUTOFF_HOUR
      ? currentTime.clone().subtract(1, "day")
      : currentTime;

  return `daily-${dailyDate.format("YYYY-MM-DD")}`;
}
