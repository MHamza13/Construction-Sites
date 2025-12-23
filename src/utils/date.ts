// src/utils/dateUtils.ts
import { DateTime } from "luxon";

const UK_TIMEZONE = "Europe/London";

/**
 * ✅ Convert UTC → UK Local Time (auto BST/GMT)
 * @param dateStr - DB datetime string (e.g. "2025-10-28 12:49:55.7183853" or ISO)
 * @param formatStr - Format string for output (default = "dd MMM yyyy, hh:mm a")
 */
export const formatDateToUK = (
  dateStr: string | undefined,
  formatStr: string = "dd MMM yyyy, hh:mm a"
): string => {
  if (!dateStr) return "—";

  try {
    // Normalize DB style to ISO if needed
    let isoString: string;
    if (dateStr.includes("T")) {
      isoString = dateStr;
    } else {
      const cleaned = dateStr.split(".")[0].replace(" ", "T");
      isoString = `${cleaned}Z`;
    }

    const dt = DateTime.fromISO(isoString, { zone: "utc" });
    if (!dt.isValid) return "Invalid";

    const ukDt = dt.setZone(UK_TIMEZONE);
    return ukDt.toFormat(formatStr);
  } catch (err) {
    console.error("formatDateToUK Error:", err);
    return "Invalid";
  }
};

/** ✅ Only Date (UK) */
export const formatDateOnlyUK = (dateStr?: string): string =>
  formatDateToUK(dateStr, "dd MMM yyyy");

/** ✅ Only Time (UK, 12-hour format with AM/PM) */
export const formatTimeOnlyUK = (dateStr?: string): string =>
  formatDateToUK(dateStr, "hh:mm a");

/** ✅ Duration (UK time) */
export const calculateShiftDuration = (
  checkIn: string,
  endShift: string | null
): string => {
  try {
    const parse = (dateStr: string): DateTime => {
      let iso = dateStr.includes("T")
        ? dateStr
        : `${dateStr.split(".")[0].replace(" ", "T")}Z`;
      return DateTime.fromISO(iso, { zone: "utc" });
    };

    const start = parse(checkIn);
    if (!start.isValid) return "—";

    if (!endShift) {
      const now = DateTime.now().setZone(UK_TIMEZONE);
      const diff = now.diff(start.setZone(UK_TIMEZONE), ["hours", "minutes"]);
      const hours = Math.floor(diff.hours);
      const minutes = Math.floor(diff.minutes);
      return `${hours}h ${minutes}m (Live)`;
    }

    const end = parse(endShift);
    if (!end.isValid) return "—";

    const diff = end
      .setZone(UK_TIMEZONE)
      .diff(start.setZone(UK_TIMEZONE), ["hours", "minutes"]);
    const hours = Math.floor(diff.hours);
    const minutes = Math.floor(diff.minutes);
    return `${hours}h ${minutes}m`;
  } catch {
    return "—";
  }
};


export const convertUKToUTC = (
  dateStr?: string,
  format: "string" | "iso" = "string"
): string => {
  try {
    let ukTime: DateTime;

    if (dateStr) {
      const iso = dateStr.includes("T")
        ? dateStr
        : `${dateStr.replace(" ", "T")}:00`;
      ukTime = DateTime.fromISO(iso, { zone: "Europe/London" });
    } else {
      ukTime = DateTime.now().setZone("Europe/London");
    }

    if (!ukTime.isValid) return "Invalid";

    const utcTime = ukTime.setZone("utc");

    // ✅ Return correct ISO format for .NET
    return format === "iso"
      ? utcTime.toISO({ suppressMilliseconds: true })
      : utcTime.toFormat("yyyy-MM-dd HH:mm:ss");
  } catch (err) {
    console.error("convertUKToUTC Error:", err);
    return "Invalid";
  }
};


export const getCurrentUKDateTimeLocal = (): string => {
  return DateTime.now().setZone(UK_TIMEZONE).toFormat("yyyy-MM-dd'T'HH:mm");
};

/**
 * Get end of current UK day formatted for <input type="datetime-local"> max value
 */
export const getEndOfUKDay = (): string => {
  return DateTime.now().setZone(UK_TIMEZONE).endOf("day").toFormat("yyyy-MM-dd'T'HH:mm");
};
