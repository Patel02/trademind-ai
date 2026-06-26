/**
 * Shared Utility Functions for TradeMind AI
 */

/**
 * Format a number as Indian Rupee (INR) currency.
 */
export const formatINR = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Format a percentage change with sign (+/-).
 */
export const formatPercent = (value: number): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

/**
 * Calculate percentage difference.
 */
export const calculatePercentageDiff = (current: number, base: number): number => {
  if (base === 0) return 0;
  return Number(((current - base) / base * 100).toFixed(2));
};

/**
 * Truncate long strings with ellipses.
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Format ISO string to local human readable date time.
 */
export const formatDateTime = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return isoString;
  }
};
