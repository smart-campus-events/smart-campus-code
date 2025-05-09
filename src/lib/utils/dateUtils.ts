/**
 * Date and time utility functions for formatting
 */

/**
 * Formats a date in a user-friendly format (e.g., "May 15, 2023")
 * @param dateInput Date object or ISO string to format
 * @returns Formatted date string
 */
export function formatDate(dateInput: Date | string): string {
  // Convert string to Date if needed
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats time in a user-friendly format (e.g., "2:30 PM")
 * @param dateInput Date object or ISO string to format
 * @returns Formatted time string
 */
export function formatTime(dateInput: Date | string): string {
  // Convert string to Date if needed
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Returns a relative time string (e.g., "2 days ago", "in 3 hours")
 * @param dateInput Date object or ISO string to compare
 * @returns Relative time string
 */
export function getRelativeTimeString(dateInput: Date | string): string {
  // Convert string to Date if needed
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHrs = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHrs / 24);

  if (diffInDays < -30) {
    return formatDate(date); // Just return the formatted date for older dates
  }
  if (diffInDays < -1) {
    return `${Math.abs(diffInDays)} days ago`;
  }
  if (diffInDays === -1) {
    return 'Yesterday';
  }
  if (diffInHrs < 0) {
    return `${Math.abs(diffInHrs)} hour${Math.abs(diffInHrs) !== 1 ? 's' : ''} ago`;
  }
  if (diffInMins < 0) {
    return `${Math.abs(diffInMins)} minute${Math.abs(diffInMins) !== 1 ? 's' : ''} ago`;
  }
  if (diffInSecs < 0) {
    return 'Just now';
  }
  if (diffInSecs < 60) {
    return 'Just now';
  }
  if (diffInMins < 60) {
    return `In ${diffInMins} minute${diffInMins !== 1 ? 's' : ''}`;
  }
  if (diffInHrs < 24) {
    return `In ${diffInHrs} hour${diffInHrs !== 1 ? 's' : ''}`;
  }
  if (diffInDays === 1) {
    return 'Tomorrow';
  }
  if (diffInDays < 30) {
    return `In ${diffInDays} day${diffInDays !== 1 ? 's' : ''}`;
  }
  return formatDate(date); // Just return the formatted date for distant future dates
}

/**
 * Determines if two dates are on the same day
 * @param date1Input First date (object or ISO string)
 * @param date2Input Second date (object or ISO string)
 * @returns Boolean indicating if dates are the same day
 */
export function isSameDay(date1Input: Date | string, date2Input: Date | string): boolean {
  // Convert strings to Date objects if needed
  const date1 = typeof date1Input === 'string' ? new Date(date1Input) : date1Input;
  const date2 = typeof date2Input === 'string' ? new Date(date2Input) : date2Input;

  return (
    date1.getFullYear() === date2.getFullYear()
    && date1.getMonth() === date2.getMonth()
    && date1.getDate() === date2.getDate()
  );
}
