// /src/utils/currency.js

/**
 * Formats a number as Philippine Peso currency
 * Example: 12345 => "₱12,345"
 * @param {number} n
 * @returns {string}
 */
export function currency(n) {
  return `₱${Number(n || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}
