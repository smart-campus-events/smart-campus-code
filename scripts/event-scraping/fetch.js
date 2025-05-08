import axios from 'axios';

// --- Configuration ---
// IMPORTANT: Identify your bot responsibly. Include contact info if possible.
const SCRAPER_USER_AGENT = 'ManoaCompassScraper/1.0 (+https://github.com/manoa-compass/manoa-compass-code)';
// Timeout for requests in milliseconds
const REQUEST_TIMEOUT_MS = 20000; // 20 seconds

/**
 * Fetches HTML content from a URL with appropriate headers and error handling.
 * @param {string} url - The URL to fetch.
 * @returns {Promise<string|null>} - HTML content as string, or null on error.
 */
export default async function fetchHtml(url) {
  console.log(`Fetching URL: ${url}`);
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': SCRAPER_USER_AGENT },
      timeout: REQUEST_TIMEOUT_MS,
    });
    // Axios throws for non-2xx status codes by default
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
    }
    return null;
  }
}