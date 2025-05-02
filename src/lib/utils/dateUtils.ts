/**
 * Date and time utility functions for formatting
 */

/**
 * Formats a date in a user-friendly format (e.g., "May 15, 2023")
 * @param date Date object to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats time in a user-friendly format (e.g., "2:30 PM")
 * @param date Date object to format
 * @returns Formatted time string
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Returns a relative time string (e.g., "2 days ago", "in 3 hours")
 * @param date Date to compare
 * @returns Relative time string
 */
export function getRelativeTimeString(date: Date): string {
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
 * @param date1 First date
 * @param date2 Second date
 * @returns Boolean indicating if dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
} 