/**
 * Utility functions for formatting data
 */

/**
 * Format a number as currency (USD)
 * 
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., $12.99)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}
