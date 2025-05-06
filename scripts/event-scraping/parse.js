// parse.js

import * as cheerio from 'cheerio';
import { parse as dateParse, formatISO, isValid as isDateValid } from 'date-fns';
import { URL } from 'url'; // Built-in Node.js module

// Base URL needed for resolving relative links found during parsing
const BASE_URL = 'https://www.hawaii.edu/calendar/manoa/';

// --- Helper Functions (parseDateTimeString, extractContactInfo) ---
// These internal helpers remain the same as your provided version.
// Ensure they are included here in the actual file.

/**
 * Parses date/time strings, handling various formats, "All day", and missing years.
 * Internal helper function.
 * @param {string} dtString - The raw date/time string from the page.
 * @param {boolean} allDayTextPresent - Explicit flag if "All day" text was found separately.
 * @param {string|null} eventUrl - The URL of the event page, used as fallback for date context.
 * @returns {{startIso: string|null, endIso: string|null, isAllDay: boolean}}
 */
function parseDateTimeString(dtString, allDayTextPresent = false, eventUrl = null) {
  // (Keep the existing implementation of this function from your file)
  // ... (implementation omitted for brevity)
  dtString = dtString ? dtString.trim() : '';
  let startDt = null;
  let endDt = null;
  let isAllDay = false;
  const now = new Date();
  const currentYear = now.getFullYear();

  if (dtString.toLowerCase().includes('all day') || allDayTextPresent) {
    isAllDay = true;
    const dateMatch = dtString.match(/([A-Za-z]+ \d{1,2})(?:,?\s*(\d{4}))?/);
    if (dateMatch) {
      let dateStr = dateMatch[1];
      const yearStr = dateMatch[2];
      if (!yearStr) dateStr = `${dateStr} ${currentYear}`;
      else dateStr = `${dateStr} ${yearStr}`;
      const possibleFormats = ['MMMM d yyyy', 'MMM d yyyy']; // Add common formats
      for (const fmt of possibleFormats) {
        startDt = dateParse(dateStr, fmt, now);
        if (isDateValid(startDt)) break;
      }
      if (!isDateValid(startDt)) { console.warn(`Could not parse date from 'All day' string: '${dtString}' (Processed: '${dateStr}')`); startDt = null; }
    } else { console.warn(`Could not extract date pattern from 'All day' string: '${dtString}'`); }
    endDt = null;
  } else {
    const dateTimeRangeRegex = /(?:([A-Za-z]+ \d{1,2},?(?:\s*\d{4})?),?\s*)?(\d{1,2}:\d{2}[ap]m)\s*(?:–|-)?\s*(\d{1,2}:\d{2}[ap]m)?/;
    const match = dtString.match(dateTimeRangeRegex);
    if (match) {
      let [, datePart, startTimePart, endTimePart] = match;
      let eventDate = null;
      if (datePart) {
        datePart = datePart.replace(',', '').trim();
        if (!/\d{4}/.test(datePart)) datePart = `${datePart} ${currentYear}`;
        const possibleDateFormats = ['MMMM d yyyy', 'MMM d yyyy']; // Add common formats
        for (const fmt of possibleDateFormats) { eventDate = dateParse(datePart, fmt, now); if (isDateValid(eventDate)) break; }
        if (!isDateValid(eventDate)) { console.warn(`Could not parse date part: '${datePart}' from string '${dtString}'`); eventDate = null; }
      } else if (eventUrl) {
        console.warn(`Date part missing in date/time string: '${dtString}'. Attempting to infer from URL: ${eventUrl}`);
        const urlDateMatch = eventUrl.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
        if (urlDateMatch) {
          const [, year, month, day] = urlDateMatch;
          eventDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
          if (!isDateValid(eventDate)) { console.error(`Failed to parse date from URL ${eventUrl}`); eventDate = null; } else { console.log(`[Debug] Inferred event date from URL: ${eventDate.toLocaleDateString('en-US', { timeZone: 'UTC' })}`); }
        } else { console.error(`Could not extract yyyy/MM/DD pattern from URL ${eventUrl}`); }
      } else { console.error(`Date part missing in date/time string: '${dtString}' and no eventUrl provided.`); }

      if (eventDate && startTimePart) {
        const year = eventDate.getUTCFullYear(); const month = eventDate.getUTCMonth(); const day = eventDate.getUTCDate();
        const startTimeObj = dateParse(startTimePart, 'h:mma', now);
        if (isDateValid(startTimeObj)) {
          startDt = new Date(Date.UTC(year, month, day, startTimeObj.getHours(), startTimeObj.getMinutes()));
        }
        if (!isDateValid(startDt)) { console.warn(`Could not parse start time part: '${startTimePart}'`); startDt = null; }
      } else if (!eventDate) { console.error(`Cannot parse time without a valid event date context for string: '${dtString}'`); }

      if (startDt && eventDate && endTimePart) {
        const year = eventDate.getUTCFullYear(); const month = eventDate.getUTCMonth(); const day = eventDate.getUTCDate();
        const endTimeObj = dateParse(endTimePart, 'h:mma', now);
        if (isDateValid(endTimeObj)) {
          endDt = new Date(Date.UTC(year, month, day, endTimeObj.getHours(), endTimeObj.getMinutes()));
          if (endDt < startDt) {
            console.warn(`End time ${endTimePart} appears before start time ${startTimePart}. Assuming same day, but check event details.`);
          }
        }
        if (!isDateValid(endDt)) { console.warn(`Could not parse end time part: '${endTimePart}'`); endDt = null; }
      } else if (startDt && !endTimePart) {
        endDt = null;
      }
    } else {
      console.warn(`Could not parse primary date/time pattern from string: '${dtString}'. Checking for date only.`);
      const dateOnlyMatch = dtString.match(/([A-Za-z]+ \d{1,2})(?:,?\s*(\d{4}))?/);
      if (dateOnlyMatch) {
        let dateStr = dateOnlyMatch[1]; const yearStr = dateOnlyMatch[2];
        if (!yearStr) dateStr = `${dateStr} ${currentYear}`; else dateStr = `${dateStr} ${yearStr}`;
        const possibleFormats = ['MMMM d yyyy', 'MMM d yyyy'];
        for (const fmt of possibleFormats) {
          startDt = dateParse(dateStr, fmt, now);
          if (isDateValid(startDt)) { isAllDay = true; break; }
        }
        if (!isDateValid(startDt)) startDt = null;
      }
    }
  }
  const startIso = startDt && isDateValid(startDt) ? formatISO(startDt) : null;
  const endIso = endDt && isDateValid(endDt) ? formatISO(endDt) : null;
  isAllDay = Boolean(isAllDay);
  return { startIso, endIso, isAllDay };
}

/**
 * Extracts contact details from the 'More Information' section text/HTML.
 * @param {cheerio.Cheerio<cheerio.Element>} infoSection - Cheerio object for the section.
 * @param {string|null} eventPageUrl - The extracted event page URL to remove it from name.
 * @returns {{ name: string|null, phone: string|null, email: string|null }}
 */
function extractContactInfo(infoSection, eventPageUrl) {
  // (Keep the existing implementation of this function from your file)
  // ... (implementation omitted for brevity)
  let name = null; let phone = null; let email = null;
  if (!infoSection || infoSection.length === 0) {
    return { name, phone, email };
  }

  const emailLink = infoSection.find('a[href^="mailto:"]');
  if (emailLink.length > 0) {
    email = emailLink.attr('href')?.replace('mailto:', '').trim() || null;
  }

  const fullTextContent = infoSection.text();
  const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/;
  const phoneMatch = fullTextContent.match(phoneRegex);
  if (phoneMatch) {
    phone = phoneMatch[0].replace(/\D/g, '');
  }

  const nameSection = infoSection.clone();
  nameSection.find('a[href^="mailto:"]').remove();
  let textContent = nameSection.text().replace(/\s+/g, ' ').trim();
  if (phoneMatch) {
    textContent = textContent.replace(phoneMatch[0], '').trim();
  }
  if (email) {
    textContent = textContent.replace(email, '').trim();
  }
  if (eventPageUrl && textContent.includes(eventPageUrl)) {
    textContent = textContent.replace(eventPageUrl, '').trim();
  }
  textContent = textContent.replace(/^More Information:?/i, '').trim();
  textContent = textContent.replace(/^,|,$/g, '').trim();
  textContent = textContent.replace(/ , /g, ', ').trim();
  textContent = textContent.replace(/,+/g, ',').trim();
  textContent = textContent.replace(/^,|,$/g, '').trim();

  if (!textContent || /^[,.\s]*$/.test(textContent) || /^https?:\/\//.test(textContent)) {
    name = null;
  } else {
    name = textContent;
  }

  return { name, phone, email };
}

/**
 * Parses the main calendar list page to extract event detail URLs and their IDs.
 * @param {string} htmlContent - HTML of the list page.
 * @returns {Array<{url: string, eventId: string}>} - List of unique events.
 */
export function parseListPage(htmlContent) {
  // (Keep the existing implementation of this function from your file)
  // ... (implementation omitted for brevity)
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
        if (eventId) {
          if (!events.has(eventId)) {
            events.set(eventId, { url: absoluteUrl, eventId });
          }
        } else {
          console.warn(`Found link without et_id: ${absoluteUrl}`);
        }
      } catch (e) {
        console.error(`Error processing link href "${relativeUrl}": ${e.message}`);
      }
    }
  });
  return Array.from(events.values());
}

/**
 * Parses the HTML of an event detail page to extract event data.
 * UPDATED: Returns an object with camelCase keys matching the new schema.
 * REMOVED: categoryTags field.
 * @param {string} htmlContent - HTML string of the detail page.
 * @param {string} eventUrl - The URL of the page being parsed (used for schema's eventUrl field).
 * @param {string} eventId - The unique event ID (from et_id, used for schema's id field).
 * @returns {object|null} - Structured event data object (camelCase), or null on critical error.
 */
export function parseEventDetailPage(htmlContent, eventUrl, eventId) {
  const $ = cheerio.load(htmlContent);
  // Define the structure using camelCase keys matching the schema
  const eventData = {
    id: eventId, // Use eventId (from et_id) as the primary key 'id'
    eventUrl, // Map the detail page URL to eventUrl
    title: null,
    startDateTime: null, // Changed from start_datetime
    endDateTime: null, // Changed from end_datetime
    allDay: false, // Changed from all_day
    description: null,
    // categoryTags: null, // REMOVED - now a relation 'categories'
    costAdmission: null, // Changed from cost_admission
    location: null, // Physical location string
    locationVirtualUrl: null, // Changed from location_virtual_url
    attendanceType: 'IN_PERSON', // Changed from attendance_type (Prisma maps to Enum)
    organizerSponsor: null, // Changed from organizer_sponsor
    contactName: null, // Changed from contact_name
    contactPhone: null, // Changed from contact_phone
    contactEmail: null, // Changed from contact_email
    eventPageUrl: null, // Changed from event_page_url (More Info link)
    lastScrapedAt: new Date(), // Changed from last_scraped_at (set here, updated in db.js)
  };

  // --- Core Parsing Logic ---
  // (The existing parsing logic from your file should go here)
  // It extracts data into local variables (e.g., title, dateTimeString, rawLocationString etc.)
  // Ensure the final assignments update the camelCase keys in the eventData object above.
  // Example snippets of updates needed within the existing logic:

  const eventDisplayDiv = $('#event-display');
  if (eventDisplayDiv.length === 0) {
    console.error(`[${eventId}] Critical Error: Could not find main container #event-display.`);
    return null;
  }

  const titleElement = eventDisplayDiv.find('h2').first();
  // Assign to camelCase key:
  eventData.title = titleElement.text().trim() || null;
  if (!eventData.title) console.warn(`[${eventId}] Title not found.`);

  // ... (rest of the date/time/location line extraction logic remains the same) ...
  const dateTimeLocationLines = [];
  let currentNode = titleElement.get(0)?.nextSibling;
  while (currentNode) {
    if (currentNode.nodeType === 1) { // ELEMENT_NODE
      const tagName = currentNode.tagName.toUpperCase();
      if (tagName === 'HR') break;
      if (tagName === 'BR') dateTimeLocationLines.push('\n');
    } else if (currentNode.nodeType === 3) { // TEXT_NODE
      const text = currentNode.nodeValue.trim();
      if (text) dateTimeLocationLines.push(text);
    }
    currentNode = currentNode.nextSibling;
  }
  const combinedDateTimeLocationText = dateTimeLocationLines
    .join('')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  const splitLines = combinedDateTimeLocationText.split('\n').map(line => line.trim()).filter(Boolean);
  let dateTimeString = '';
  let rawLocationString = null;
  if (splitLines.length >= 2) {
    dateTimeString = splitLines[0];
    rawLocationString = splitLines.slice(1).join(', ');
  } else if (splitLines.length === 1) {
    dateTimeString = splitLines[0];
    console.warn(`[${eventId}] Only one line found after title; assuming it's date/time: "${dateTimeString}"`);
  } else {
    console.warn(`[${eventId}] Could not extract date/time/location text between title and HR.`);
  }

  console.log(`[${eventId}] Extracted dateTimeString: "${dateTimeString}"`);
  console.log(`[${eventId}] Extracted rawLocationString: "${rawLocationString}"`);

  // --- Filter raw location string for physical location ---
  if (rawLocationString) {
    const virtualFilterKeywords = /\b(zoom|online|virtual|webinar|hybrid|webcast|join meeting)\b/i;
    const urlFilterRegex = /^https?:\/\//i;
    const locationPartsFiltered = rawLocationString
      .split(',')
      .map(p => p.trim())
      .filter(p => !virtualFilterKeywords.test(p) && !urlFilterRegex.test(p));

    // Assign to camelCase key:
    eventData.location = locationPartsFiltered.length > 0 ? locationPartsFiltered.join(', ') : null;
    console.log(`[${eventId}] Filtered physical location (eventData.location): "${eventData.location}"`);
  } else {
    eventData.location = null;
  }

  // --- Parse Date/Time ---
  const allDayTextPresent = dateTimeString && dateTimeString.toLowerCase().includes('all day');
  const { startIso, endIso, isAllDay } = parseDateTimeString(dateTimeString, allDayTextPresent, eventUrl);
  // Assign to camelCase keys:
  eventData.startDateTime = startIso;
  eventData.endDateTime = endIso;
  eventData.allDay = isAllDay;

  // --- Description (using all <p> tags logic) ---
  const descriptionParas = [];
  // MODIFIED SELECTOR: Exclude paragraphs that directly contain a <strong> tag
  eventDisplayDiv.find('p:not(:has(> strong))').each((index, element) => {
    const paragraphText = $(element).text().trim();
    if (paragraphText) {
      descriptionParas.push(paragraphText);
    }
  });
  // Assign to camelCase key:
  eventData.description = descriptionParas.length > 0 ? descriptionParas.join('\n\n') : null;
  console.log(`[${eventId}] Extracted description from <p> tags not containing <strong>.`);

  // --- Find Sections (Sponsor, Info, Ticket) ---
  // ... (logic remains the same) ...
  let sponsorSection = null;
  let infoSection = null;
  let ticketSection = null;
  eventDisplayDiv.find('p:has(strong), div:has(strong)').each((i, el) => {
    const element = $(el);
    const strongText = element.find('strong').first().text().trim();
    if (/^Event Sponsor/i.test(strongText)) {
      sponsorSection = element;
    } else if (/^More Information/i.test(strongText)) {
      infoSection = element;
    } else if (/^Ticket Information/i.test(strongText)) {
      ticketSection = element;
    }
  });

  // --- Organizer/Sponsor ---
  if (sponsorSection) {
    // ... (extraction logic remains the same) ...
    const sponsorHtml = sponsorSection.html();
    const strongEndTag = '</strong>';
    const strongEndIndex = sponsorHtml?.indexOf(strongEndTag);
    let sponsorText = '';
    if (sponsorHtml && strongEndIndex !== -1) {
      sponsorText = sponsorHtml.substring(strongEndIndex + strongEndTag.length).trim();
    } else {
      sponsorText = sponsorSection.text().replace(/Event Sponsor:?/i, '').trim();
    }
    // Assign to camelCase key:
    eventData.organizerSponsor = cheerio.load(sponsorText || '').text().trim() || null;
  } else {
    console.warn(`[${eventId}] 'Event Sponsor' section not found.`);
  }

  // --- Contact Info & Event Page URL ---
  let infoSectionText = '';
  if (infoSection) {
    infoSectionText = infoSection.text();
    // ... (event page URL extraction logic remains the same) ...
    let foundPageUrl = false;
    infoSection.find('a').each((i, linkEl) => {
      const link = $(linkEl);
      const linkText = link.text().trim();
      const href = link.attr('href');
      if (!foundPageUrl && href && !href.startsWith('mailto:') && /more info|website|details|event page|register/i.test(linkText)) {
        try {
          // Assign to camelCase key:
          eventData.eventPageUrl = new URL(href, BASE_URL).toString();
          foundPageUrl = true;
        } catch (e) { console.warn(`[${eventId}] Invalid potential event page URL found: ${href}`); }
      }
    });
    if (!foundPageUrl) {
      const firstLink = infoSection.find('a:not([href^="mailto:"])').first();
      if (firstLink.length > 0) {
        const href = firstLink.attr('href');
        if (href) {
          try {
            // Assign to camelCase key:
            eventData.eventPageUrl = new URL(href, BASE_URL).toString();
          } catch (e) { console.warn(`[${eventId}] Invalid fallback event page URL: ${href}`); }
        }
      }
    }

    // Assign to camelCase keys:
    const contacts = extractContactInfo(infoSection, eventData.eventPageUrl);
    eventData.contactName = contacts.name;
    eventData.contactPhone = contacts.phone;
    eventData.contactEmail = contacts.email;
  } else {
    console.warn(`[${eventId}] 'More Information' section not found.`);
  }

  // --- Cost/Admission ---
  if (ticketSection) {
    // ... (extraction logic remains the same) ...
    const ticketHtml = ticketSection.html();
    const strongEndTag = '</strong>';
    const strongEndIndex = ticketHtml?.indexOf(strongEndTag);
    let costTextRaw = '';
    if (ticketHtml && strongEndIndex !== -1) {
      costTextRaw = ticketHtml.substring(strongEndIndex + strongEndTag.length).trim();
    } else {
      costTextRaw = ticketSection.text().replace(/Ticket Information:?/i, '').trim();
    }
    const costText = cheerio.load(costTextRaw || '').text().trim();
    if (costText) {
      // Assign to camelCase key:
      eventData.costAdmission = costText;
      console.log(`[${eventId}] Found cost in 'Ticket Information': ${costText}`);
    } else {
      console.warn(`[${eventId}] Found 'Ticket Information' section but cost text was empty.`);
    }
  } else {
    // ... (heuristic logic remains the same) ...
    console.log(`[${eventId}] 'Ticket Information' section not found. Scanning info section text for cost keywords.`);
    const costRegex = /(\$\d+(?:\.\d{2})?)|(free admission)|(free event)|free and open to the public/i;
    const textToScan = infoSectionText;
    const costMatch = textToScan.match(costRegex);
    if (costMatch) {
      // Assign to camelCase key:
      eventData.costAdmission = costMatch[0];
      console.log(`[${eventId}] Found cost via heuristic scan in info section: ${eventData.costAdmission}`);
    }
  }

  // --- Attendance Type & Virtual URL ---
  // ... (logic for finding Zoom URL remains the same) ...
  const virtualKeywords = /\b(zoom|online|virtual|webinar|hybrid|webcast|join meeting)\b/i;
  const zoomUrlRegex = /https:\/\/[\w-]*\.?zoom\.us\/(?:j|my|w|meeting)\/[\d\w?=-]+/i;
  let foundZoomUrl = null;

  const zoomMatchLoc = (rawLocationString || '').match(zoomUrlRegex);
  if (zoomMatchLoc) {
    foundZoomUrl = zoomMatchLoc[0];
    // Assign to camelCase key:
    eventData.locationVirtualUrl = foundZoomUrl;
    console.log(`[${eventId}] Found Zoom URL in raw location string: ${foundZoomUrl}`);
  }

  if (!foundZoomUrl && infoSection) {
    infoSection.find('a').each((i, linkEl) => {
      const href = $(linkEl).attr('href');
      if (href) {
        const zoomMatchInfo = href.match(zoomUrlRegex);
        if (zoomMatchInfo) {
          foundZoomUrl = zoomMatchInfo[0];
          // Assign to camelCase key:
          eventData.locationVirtualUrl = foundZoomUrl;
          console.log(`[${eventId}] Found Zoom URL in More Information links: ${foundZoomUrl}`);
          return false;
        }
      }
    });
  }

  if (!foundZoomUrl && eventData.description) {
    const zoomMatchDesc = eventData.description.match(zoomUrlRegex);
    if (zoomMatchDesc) {
      foundZoomUrl = zoomMatchDesc[0];
      // Assign to camelCase key:
      eventData.locationVirtualUrl = foundZoomUrl;
      console.log(`[${eventId}] Found Zoom URL in description: ${foundZoomUrl}`);
    }
  }

  // ... (logic for determining attendance type remains the same) ...
  const foundVirtualKeywordInRawLocation = virtualKeywords.test(rawLocationString || '');
  const foundVirtualKeywordInDescription = virtualKeywords.test(eventData.description || '');
  const foundVirtualKeywordInInfo = virtualKeywords.test(infoSectionText || '');
  const hasVirtualComponent = Boolean(foundZoomUrl)
                             || foundVirtualKeywordInRawLocation
                             || foundVirtualKeywordInDescription
                             || foundVirtualKeywordInInfo;
  const likelyPhysical = !!eventData.location;

  // Assign to camelCase key:
  if (hasVirtualComponent) {
    eventData.attendanceType = likelyPhysical ? 'HYBRID' : 'ONLINE';
    if (eventData.attendanceType === 'ONLINE') eventData.location = null; // Ensure physical location is null if purely online
  } else {
    eventData.attendanceType = likelyPhysical ? 'IN_PERSON' : 'IN_PERSON'; // Default to IN_PERSON if unclear
    if (!likelyPhysical) {
      console.warn(`[${eventId}] No physical location parsed and no virtual indicators found. Attendance type unclear, defaulting to IN_PERSON.`);
    }
  }
  console.log(`[${eventId}] Determined Attendance Type: ${eventData.attendanceType}`);

  // --- Final Validation Check ---
  // Check camelCase keys:
  if (!eventData.title || !eventData.startDateTime) {
    console.error(`[${eventId}] CRITICAL ERROR: Missing title or start date/time. Skipping save for ${eventUrl}`);
    console.error(`[${eventId}] -> Found Title: ${eventData.title}`);
    console.error(`[${eventId}] -> Found Start DateTime: ${eventData.startDateTime}`);
    return null;
  }

  // Return the updated structure
  return eventData;
}
