// parse.js
// Contains functions for parsing HTML using cheerio and handling dates.
// Updated to iterate through sibling nodes after H2 to find date/time/location.
// Improved year handling and date/location separation.

import * as cheerio from 'cheerio';
import { parse as dateParse, formatISO, isValid as isDateValid } from 'date-fns';
import { URL } from 'url'; // Built-in Node.js module

// Base URL needed for resolving relative links found during parsing
const BASE_URL = 'https://www.hawaii.edu/calendar/manoa/';

/**
 * Parses date/time strings, handling various formats, "All day", and missing years.
 * Internal helper function.
 * @param {string} dtString - The raw date/time string from the page.
 * @param {boolean} allDayTextPresent - Explicit flag if "All day" text was found separately.
 * @param {string|null} eventUrl - The URL of the event page, used as fallback for date context.
 * @returns {{startIso: string|null, endIso: string|null, isAllDay: boolean}}
 */
function parseDateTimeString(dtString, allDayTextPresent = false, eventUrl = null) { // Added eventUrl parameter
  dtString = dtString ? dtString.trim() : '';
  let startDt = null;
  let endDt = null;
  let isAllDay = false;
  const now = new Date();
  const currentYear = now.getFullYear(); // Get current year for inference

  // Check for "All day"
  if (dtString.toLowerCase().includes('all day') || allDayTextPresent) {
    isAllDay = true;
    // Match date like "Month Day, Year" or "Month Day Year" or just "Month Day"
    const dateMatch = dtString.match(/([A-Za-z]+ \d{1,2})(?:,?\s*(\d{4}))?/); // Year is now optional in match
    if (dateMatch) {
      let dateStr = dateMatch[1]; // e.g., "August 18"
      const yearStr = dateMatch[2]; // e.g., "2017" or undefined

      if (!yearStr) {
        // If year is missing, append current year
        console.log(`[Debug] Year missing in 'All day' date part "${dateStr}". Appending current year: ${currentYear}`);
        dateStr = `${dateStr} ${currentYear}`;
      } else {
        dateStr = `${dateStr} ${yearStr}`; // Append the found year
      }

      const possibleFormats = ['MMMM d yyyy']; // Expect "Month Day Year"
      for (const fmt of possibleFormats) {
        // Use 'now' as the reference date for parsing
        startDt = dateParse(dateStr, fmt, now);
        if (isDateValid(startDt)) break;
      }
      if (!isDateValid(startDt)) {
        console.warn(`Could not parse date from 'All day' string: '${dtString}' (Processed: '${dateStr}')`);
        startDt = null;
      }
    } else {
      console.warn(`Could not extract date pattern from 'All day' string: '${dtString}'`);
    }
    endDt = null; // No end time for all-day events
  } else {
    // Attempt to parse specific start/end times
    // Regex allows optional date part, requires start time, allows optional end time
    const dateTimeRangeRegex = /(?:([A-Za-z]+ \d{1,2},?(?:\s*\d{4})?),?\s*)?(\d{1,2}:\d{2}[ap]m)\s*(?:–|-)?\s*(\d{1,2}:\d{2}[ap]m)?/;
    const match = dtString.match(dateTimeRangeRegex);

    if (match) {
      let [, datePart, startTimePart, endTimePart] = match;
      let eventDate = null;

      if (datePart) {
        datePart = datePart.replace(',', '').trim();
        // Check if year is missing (e.g., "April 19")
        if (!/\d{4}/.test(datePart)) {
          console.log(`[Debug] Year missing in date part "${datePart}". Appending current year: ${currentYear}`);
          datePart = `${datePart} ${currentYear}`; // Append current year
        }

        // Try parsing the date (now potentially with year)
        const possibleDateFormats = ['MMMM d yyyy']; // Expect format like "April 19 2025"
        for (const fmt of possibleDateFormats) {
          eventDate = dateParse(datePart, fmt, now); // Use 'now' as reference
          if (isDateValid(eventDate)) break;
        }
        if (!isDateValid(eventDate)) {
          console.warn(`Could not parse date part: '${datePart}' from string '${dtString}'`);
          eventDate = null; // Parsing failed
        }
      } else if (eventUrl) {
        // Date part is missing from the string, try inferring from URL
        console.warn(`Date part missing in date/time string: '${dtString}'. Attempting to infer from URL: ${eventUrl}`);
        const urlDateMatch = eventUrl.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
        if (urlDateMatch) {
          const [, year, month, day] = urlDateMatch;
          // Create date object from URL parts. Month is 0-indexed in JS Date.
          // Use UTC to avoid timezone issues during intermediate object creation
          eventDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
          if (!isDateValid(eventDate)) {
            console.error(`Failed to parse date from URL ${eventUrl}`);
            eventDate = null;
          } else {
            console.log(`[Debug] Inferred event date from URL: ${eventDate.toLocaleDateString('en-US', { timeZone: 'UTC' })}`);
          }
        } else {
          console.error(`Could not extract YYYY/MM/DD pattern from URL ${eventUrl}`);
        }
      } else {
        // Date part missing and no URL provided for fallback
        console.error(`Date part missing in date/time string: '${dtString}' and no eventUrl provided for context.`);
      }

      // Proceed only if we have a valid date context (eventDate)
      if (eventDate && startTimePart) {
        // Get date components (use UTC methods to avoid local timezone interpretation of the inferred date)
        const year = eventDate.getUTCFullYear();
        const month = eventDate.getUTCMonth(); // 0-indexed
        const day = eventDate.getUTCDate();

        // Parse the time part (e.g., "9:00am") using 'now' as reference for format parsing
        const startTimeObj = dateParse(startTimePart, 'h:mma', now);

        if (isDateValid(startTimeObj)) {
          // Combine date components with time components
          // Create the final Date object - this will be in the system's local timezone
          // For HST, this should be correct if the server runs in HST.
          // If server is UTC, further adjustments might be needed depending on how Prisma handles Timestamptz.
          startDt = new Date(year, month, day, startTimeObj.getHours(), startTimeObj.getMinutes());
        }

        if (!isDateValid(startDt)) {
          console.warn(`Could not parse start time part: '${startTimePart}'`);
          startDt = null;
        }
      } else if (!eventDate) {
        console.error(`Cannot parse time without a valid event date context for string: '${dtString}'`);
      }

      // Parse end time only if start time was successful and end time exists
      if (startDt && eventDate && endTimePart) {
        const year = eventDate.getUTCFullYear();
        const month = eventDate.getUTCMonth();
        const day = eventDate.getUTCDate();
        const endTimeObj = dateParse(endTimePart, 'h:mma', now);

        if (isDateValid(endTimeObj)) {
          endDt = new Date(year, month, day, endTimeObj.getHours(), endTimeObj.getMinutes());

          if (endDt < startDt) {
            console.warn(`End time ${endTimePart} appears before start time ${startTimePart}. Assuming same day.`);
            // Add next-day logic here if needed: endDt.setDate(endDt.getDate() + 1);
          }
        }

        if (!isDateValid(endDt)) {
          console.warn(`Could not parse end time part: '${endTimePart}'`);
          endDt = null;
        }
      } else if (startDt && !endTimePart) {
        // No end time specified. Set endDt to null.
        endDt = null;
      }
    } else {
      // Regex didn't match typical patterns, try parsing just a date as fallback
      console.warn(`Could not parse primary date/time pattern from string: '${dtString}'. Checking for date only.`);
      const dateOnlyMatch = dtString.match(/([A-Za-z]+ \d{1,2})(?:,?\s*(\d{4}))?/); // Year optional
      if (dateOnlyMatch) {
        let dateStr = dateOnlyMatch[1]; // "Month Day"
        const yearStr = dateOnlyMatch[2]; // Year or undefined
        if (!yearStr) {
          dateStr = `${dateStr} ${currentYear}`; // Append current year if missing
        } else {
          dateStr = `${dateStr} ${yearStr}`;
        }
        const possibleFormats = ['MMMM d yyyy'];
        for (const fmt of possibleFormats) {
          startDt = dateParse(dateStr, fmt, now);
          if (isDateValid(startDt)) {
            isAllDay = true; // Treat date-only as all-day
            break;
          }
        }
        if (!isDateValid(startDt)) startDt = null;
      }
    }
  }

  // Convert valid Date objects to ISO 8601 strings for Prisma
  // formatISO automatically uses 'Z' for UTC if the Date object implies it,
  // or includes offset if the Date object has timezone info.
  // Standard JS Date objects are based on system time, so ISO string will reflect that offset.
  const startIso = startDt && isDateValid(startDt) ? formatISO(startDt) : null;
  const endIso = endDt && isDateValid(endDt) ? formatISO(endDt) : null;

  // Ensure isAllDay is boolean
  isAllDay = Boolean(isAllDay);

  return { startIso, endIso, isAllDay };
}

/**
 * Extracts contact details from the 'More Information' section text/HTML.
 * Internal helper function.
 * @param {cheerio.Cheerio<cheerio.Element>} infoSection - Cheerio object for the section.
 * @returns {{ name: string|null, phone: string|null, email: string|null }}
 */
function extractContactInfo(infoSection) {
  // (This function remains the same)
  let name = null; let phone = null; let
    email = null;
  if (!infoSection || infoSection.length === 0) { return { name, phone, email }; }
  const emailLink = infoSection.find('a[href^="mailto:"]');
  if (emailLink.length > 0) {
    email = emailLink.attr('href')?.replace('mailto:', '').trim() || null;
    const tempSection = infoSection.clone();
    tempSection.find('a[href^="mailto:"]').remove();
    infoSection = tempSection;
  }
  let textContent = infoSection.text().replace(/\s+/g, ' ').trim();
  const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/;
  const phoneMatch = textContent.match(phoneRegex);
  if (phoneMatch) {
    const phoneRaw = phoneMatch[0];
    phone = phoneRaw.replace(/\D/g, '');
    textContent = textContent.replace(phoneRaw, '').trim();
  }
  const potentialName = textContent.replace(/More Information:?/i, '').trim();
  if (potentialName && potentialName !== email && potentialName !== phone) {
    if (potentialName.length > 2 && !/^\d+$/.test(potentialName)) name = potentialName;
  }
  return { name, phone, email };
}

/**
 * Parses the main calendar list page to extract event detail URLs and their IDs.
 * @param {string} htmlContent - HTML of the list page.
 * @returns {Array<{url: string, eventId: string}>} - List of unique events.
 */
export function parseListPage(htmlContent) {
  // (This function remains the same)
  const $ = cheerio.load(htmlContent);
  const events = new Map();
  $('table tr td:nth-child(2) a').each((index, element) => {
    const link = $(element);
    const relativeUrl = link.attr('href');
    if (relativeUrl) {
      try {
        const absoluteUrl = new URL(relativeUrl, BASE_URL).toString();
        const parsedUrl = new URL(absoluteUrl);
        const eventId = parsedUrl.searchParams.get('et_id');
        if (eventId && !events.has(eventId)) events.set(eventId, { url: absoluteUrl, eventId });
        else if (!eventId) console.warn(`Found link without et_id: ${absoluteUrl}`);
      } catch (e) { console.error(`Error processing link href "${relativeUrl}": ${e.message}`); }
    }
  });
  return Array.from(events.values());
}

/**
 * Parses the HTML of an event detail page to extract event data.
 * @param {string} htmlContent - HTML string of the detail page.
 * @param {string} eventUrl - The URL of the page being parsed.
 * @param {string} eventId - The unique event ID (from et_id).
 * @returns {object|null} - Structured event data object, or null on critical error.
 */
export function parseEventDetailPage(htmlContent, eventUrl, eventId) {
  const $ = cheerio.load(htmlContent);
  const eventData = {
    event_id: eventId,
    event_url: eventUrl,
    title: null,
    start_datetime: null,
    end_datetime: null,
    all_day: false,
    description: null,
    category_tags: null,
    cost_admission: null,
    location_text: null,
    location_building: null,
    location_room: null,
    location_address: null,
    location_virtual_url: null,
    organizer_sponsor: null,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    event_page_url: null,
    last_scraped_at: new Date(),
  };

  const eventDisplayDiv = $('#event-display');
  if (eventDisplayDiv.length === 0) {
    console.error(`[${eventId}] Could not find main container #event-display.`);
    return null;
  }

  const titleElement = eventDisplayDiv.find('h2').first();
  eventData.title = titleElement.text().trim() || null;
  if (!eventData.title) console.warn(`[${eventId}] Title not found.`);

  // Iterate through sibling nodes after H2 to get date/time/location text
  const dateTimeLocationLines = [];
  let currentNode = titleElement.get(0)?.nextSibling;
  let firstParagraphNode = null;

  while (currentNode) {
    if (currentNode.nodeType === 1) { // ELEMENT_NODE
      const tagName = currentNode.tagName.toUpperCase();
      if (tagName === 'HR') break;
      if (tagName === 'P') { firstParagraphNode = currentNode; break; }
      if (tagName === 'BR') dateTimeLocationLines.push('\n');
    } else if (currentNode.nodeType === 3) { // TEXT_NODE
      const text = currentNode.nodeValue.trim();
      if (text) dateTimeLocationLines.push(text);
    }
    currentNode = currentNode.nextSibling;
  }

  // Process collected lines for Date/Time/Location
  const combinedDateTimeLocationText = dateTimeLocationLines.join(' ').replace(/\s+/g, ' ').replace(/\n /g, '\n').replace(/ \n/g, '\n')
    .trim();
  console.log(`[${eventId}] Raw combinedDateTimeLocationText: "${combinedDateTimeLocationText}"`);

  let dateTimeString = '';
  let locationString = '';
  let allDayTextFound = false;
  const lines = combinedDateTimeLocationText.split('\n').map(l => l.trim()).filter(Boolean);

  if (lines.some(line => line.toLowerCase().includes('all day'))) allDayTextFound = true;

  // *** Refined Heuristic to separate date/time from location ***
  const dateParts = [];
  const locParts = [];
  const timeRegex = /\d{1,2}:\d{2}[ap]m/;
  // Match common date formats (Month Day, Year or Month Day)
  const dateRegex = /[A-Za-z]+ \d{1,2}(?:,?\s*\d{4})?/;

  lines.forEach(line => {
    // Check if the line primarily contains date/time info
    const containsDate = dateRegex.test(line);
    const containsTime = timeRegex.test(line);
    const containsAllDay = line.toLowerCase().includes('all day');
    // Consider it date/time related if it contains date OR time OR all day,
    // AND doesn't obviously look like a location (e.g., contains "Campus", "Hall", common building names - simple check)
    const looksLikeLocation = /\b(Campus|Hall|Center|Library|Room|Bldg|Online|Zoom)\b/i.test(line);

    // Prioritize date/time patterns, unless it strongly looks like a location line
    if ((containsDate || containsTime || containsAllDay) && !looksLikeLocation) {
      dateParts.push(line);
    } else if (dateParts.length > 0 && containsTime && !looksLikeLocation) {
      // Allow capturing subsequent time parts if we already started date section
      dateParts.push(line);
    } else {
      // Otherwise, assume it's part of the location
      locParts.push(line);
    }
  });
  dateTimeString = dateParts.join(' ');
  locationString = locParts.join(', ');

  console.log(`[${eventId}] Extracted dateTimeString: "${dateTimeString}"`);
  console.log(`[${eventId}] Extracted locationString: "${locationString}"`);

  // Fallback if heuristic failed
  if (!dateTimeString && combinedDateTimeLocationText) {
    console.warn(`[${eventId}] Date/Time/Location line splitting heuristic failed or yielded empty date. Using combined text for date parsing.`);
    dateTimeString = combinedDateTimeLocationText;
    locationString = ''; // Reset location as separation failed
  }

  eventData.location_text = locationString || null;

  // Parse the extracted date/time string, passing eventUrl for context
  const { startIso, endIso, isAllDay } = parseDateTimeString(dateTimeString, allDayTextFound, eventUrl); // Pass eventUrl
  eventData.start_datetime = startIso;
  eventData.end_datetime = endIso;
  eventData.all_day = isAllDay;

  // Description (Starts from the first <p> tag found after the date/time section)
  const descriptionParas = [];
  let currentElement = firstParagraphNode ? $(firstParagraphNode) : eventDisplayDiv.find('p').first();
  while (currentElement && currentElement.length > 0) {
    // (Description logic remains the same)
    const tagName = currentElement.prop('tagName')?.toLowerCase();
    if (!currentElement.closest('#event-display').length) break;
    const elementText = currentElement.text().trim();
    const strongText = currentElement.find('strong').first().text().trim();
    if (/^Event Sponsor/i.test(strongText) || /^Event Sponsor/i.test(elementText)
          || /^More Information/i.test(strongText) || /^More Information/i.test(elementText)) {
      break;
    }
    if (tagName === 'p' && elementText) descriptionParas.push(elementText);
    currentElement = currentElement.next();
  }
  eventData.description = descriptionParas.length > 0 ? descriptionParas.join('\n\n') : null;

  // Find specific sections (Sponsor, Info) - Search within #event-display
  let sponsorSection = null;
  let infoSection = null;
  eventDisplayDiv.find('p, div').each((i, el) => {
    // (Sponsor/Info finding logic remains the same)
    const element = $(el);
    const strongText = element.find('strong').first().text().trim();
    const elementTextStart = element.text().trim().split('\n')[0].trim();
    if (/^Event Sponsor/i.test(strongText) || /^Event Sponsor/i.test(elementTextStart)) sponsorSection = element;
    else if (/^More Information/i.test(strongText) || /^More Information/i.test(elementTextStart)) infoSection = element;
  });

  // Organizer/Sponsor
  if (sponsorSection) eventData.organizer_sponsor = sponsorSection.text().replace(/Event Sponsor:?/i, '').trim() || null;
  else console.warn(`[${eventId}] 'Event Sponsor' section not found.`);

  // Contact Info & Event Page URL
  if (infoSection) {
    // (Contact/Event Page URL logic remains the same)
    const contacts = extractContactInfo(infoSection);
    eventData.contact_name = contacts.name;
    eventData.contact_phone = contacts.phone;
    eventData.contact_email = contacts.email;
    infoSection.find('a').each((i, linkEl) => {
      const link = $(linkEl);
      const linkText = link.text().trim();
      const href = link.attr('href');
      if (href && !href.startsWith('mailto:') && /more info|website|details|event page/i.test(linkText)) {
        try { eventData.event_page_url = new URL(href, BASE_URL).toString(); } catch (e) { console.warn(`[${eventId}] Invalid event page URL found: ${href}`); }
      }
    });
    if (!eventData.event_page_url) {
      const firstLink = infoSection.find('a:not([href^="mailto:"])').first();
      if (firstLink.length > 0) {
        const href = firstLink.attr('href');
        if (href) {
          try { eventData.event_page_url = new URL(href, BASE_URL).toString(); } catch (e) { console.warn(`[${eventId}] Invalid fallback event page URL: ${href}`); }
        }
      }
    }
  } else {
    console.warn(`[${eventId}] 'More Information' section not found.`);
  }

  // --- Heuristics & Parsing Attempts --- (Remain the same)

  // Category Tags
  const categoryKeywords = ['Workshop', 'Lecture', 'Seminar', 'Meeting', 'Fair', 'Performance', 'Webinar', 'Conference', 'Exhibit', 'Reception', 'Drive', 'Screening', 'Talk', 'Information Session', 'Symposium'];
  const foundCategories = new Set();
  const textToScanCat = `${eventData.title || ''} ${eventData.description || ''}`;
  categoryKeywords.forEach(keyword => {
    if (new RegExp(`\\b${keyword}\\b`, 'i').test(textToScanCat)) foundCategories.add(keyword);
  });
  eventData.category_tags = foundCategories.size > 0 ? Array.from(foundCategories).join(', ') : null;

  // Cost/Admission
  const costRegex = /(\$?\d+(?:\.\d{2})?)|(free admission)|(cost:)|(fee:)|(admission:)|(ticket price)/i;
  const costTextToScan = `${eventData.description || ''} ${infoSection ? infoSection.text() : ''}`;
  const costMatch = costTextToScan.match(costRegex);
  if (costMatch) {
    const matchIndex = costMatch.index || 0;
    const snippetStart = Math.max(0, matchIndex - 30);
    const snippetEnd = Math.min(costTextToScan.length, matchIndex + 50);
    const contextSnippet = `...${costTextToScan.substring(snippetStart, snippetEnd).replace(/\s+/g, ' ')}...`;
    eventData.cost_admission = `Found: "${costMatch[0]}". Context: ${contextSnippet}`;
  }

  // Location Parsing
  if (eventData.location_text) {
    const parts = eventData.location_text.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length > 0) eventData.location_building = parts[0];
    if (parts.length > 1) eventData.location_room = parts[1];
    const urlRegex = /https?:\/\/[^\s]+/i;
    const virtualMatch = eventData.location_text.match(urlRegex);
    if (virtualMatch) eventData.location_virtual_url = virtualMatch[0];
    else if (/\b(zoom|online|virtual|webinar)\b/i.test(eventData.location_text)) {
      console.log(`[${eventId}] Location text suggests virtual event, but no URL found in location_text.`);
    }
  }

  // --- Final Check ---
  if (!eventData.title || !eventData.start_datetime) {
    console.error(`[${eventId}] Critical information missing (title or start date/time). Skipping save for ${eventUrl}`);
    console.error(`[${eventId}] Found Title: ${eventData.title}, Found Start DateTime: ${eventData.start_datetime}`);
    return null;
  }

  return eventData;
}
