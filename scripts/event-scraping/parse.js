// parse.js

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
function parseDateTimeString(dtString, allDayTextPresent = false, eventUrl = null) {
  // (This function remains the same as the previous version)
  dtString = dtString ? dtString.trim() : '';
  let startDt = null;
  let endDt = null;
  let isAllDay = false;
  const now = new Date();
  const currentYear = now.getFullYear();

  if (dtString.toLowerCase().includes('all day') || allDayTextPresent) {
    isAllDay = true;
    // Basic date parsing for 'All day' events
    const dateMatch = dtString.match(/([A-Za-z]+ \d{1,2})(?:,?\s*(\d{4}))?/);
    if (dateMatch) {
      let dateStr = dateMatch[1];
      const yearStr = dateMatch[2];
      // Ensure year is present for parsing
      if (!yearStr) dateStr = `${dateStr} ${currentYear}`;
      else dateStr = `${dateStr} ${yearStr}`;
      // ** FIXED ESLint issue: Replaced U+1F4DD with 'd yyyy' **
      const possibleFormats = ['MMMM d yyyy']; // Use standard format tokens
      for (const fmt of possibleFormats) {
        startDt = dateParse(dateStr, fmt, now);
        if (isDateValid(startDt)) break;
      }
      if (!isDateValid(startDt)) { console.warn(`Could not parse date from 'All day' string: '${dtString}' (Processed: '${dateStr}')`); startDt = null; }
    } else { console.warn(`Could not extract date pattern from 'All day' string: '${dtString}'`); }
    endDt = null; // No end time for all-day usually
  } else {
    // Regex to capture optional date, start time, and optional end time
    const dateTimeRangeRegex = /(?:([A-Za-z]+ \d{1,2},?(?:\s*\d{4})?),?\s*)?(\d{1,2}:\d{2}[ap]m)\s*(?:–|-)?\s*(\d{1,2}:\d{2}[ap]m)?/;
    const match = dtString.match(dateTimeRangeRegex);
    if (match) {
      let [, datePart, startTimePart, endTimePart] = match;
      let eventDate = null;
      // Parse date part if present
      if (datePart) {
        datePart = datePart.replace(',', '').trim();
        // Ensure year is present for parsing
        if (!/\d{4}/.test(datePart)) datePart = `${datePart} ${currentYear}`;
        // ** FIXED ESLint issue: Replaced U+1F4DD with 'd yyyy' **
        const possibleDateFormats = ['MMMM d yyyy']; // Use standard format tokens
        for (const fmt of possibleDateFormats) { eventDate = dateParse(datePart, fmt, now); if (isDateValid(eventDate)) break; }
        if (!isDateValid(eventDate)) { console.warn(`Could not parse date part: '${datePart}' from string '${dtString}'`); eventDate = null; }
      } else if (eventUrl) {
        // Fallback: Try to infer date from event URL if date part is missing
        console.warn(`Date part missing in date/time string: '${dtString}'. Attempting to infer from URL: ${eventUrl}`);
        const urlDateMatch = eventUrl.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
        if (urlDateMatch) {
          const [, year, month, day] = urlDateMatch;
          // Use Date.UTC to avoid timezone issues during parsing
          eventDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
          if (!isDateValid(eventDate)) { console.error(`Failed to parse date from URL ${eventUrl}`); eventDate = null; } else { console.log(`[Debug] Inferred event date from URL: ${eventDate.toLocaleDateString('en-US', { timeZone: 'UTC' })}`); }
        } else { console.error(`Could not extract YYYY/MM/DD pattern from URL ${eventUrl}`); }
      } else { console.error(`Date part missing in date/time string: '${dtString}' and no eventUrl provided.`); }

      // Parse start time if event date is valid
      if (eventDate && startTimePart) {
        const year = eventDate.getUTCFullYear(); const month = eventDate.getUTCMonth(); const day = eventDate.getUTCDate();
        const startTimeObj = dateParse(startTimePart, 'h:mma', now); // Use 'a' for am/pm
        if (isDateValid(startTimeObj)) {
          // Construct Date object using UTC components to avoid local timezone shifts
          startDt = new Date(Date.UTC(year, month, day, startTimeObj.getHours(), startTimeObj.getMinutes()));
        }
        if (!isDateValid(startDt)) { console.warn(`Could not parse start time part: '${startTimePart}'`); startDt = null; }
      } else if (!eventDate) { console.error(`Cannot parse time without a valid event date context for string: '${dtString}'`); }

      // Parse end time if start time and event date are valid
      if (startDt && eventDate && endTimePart) {
        const year = eventDate.getUTCFullYear(); const month = eventDate.getUTCMonth(); const day = eventDate.getUTCDate();
        const endTimeObj = dateParse(endTimePart, 'h:mma', now); // Use 'a' for am/pm
        if (isDateValid(endTimeObj)) {
          endDt = new Date(Date.UTC(year, month, day, endTimeObj.getHours(), endTimeObj.getMinutes()));
          // Basic check if end time is before start time (assuming same day)
          if (endDt < startDt) {
            console.warn(`End time ${endTimePart} appears before start time ${startTimePart}. Assuming same day, but check event details.`);
            // Optional: Add a day if it wraps around midnight? Depends on source data consistency.
            // endDt.setUTCDate(endDt.getUTCDate() + 1);
          }
        }
        if (!isDateValid(endDt)) { console.warn(`Could not parse end time part: '${endTimePart}'`); endDt = null; }
      } else if (startDt && !endTimePart) {
        endDt = null; // No end time provided
      }
    } else {
      // Fallback: Try parsing as just a date if primary pattern fails
      console.warn(`Could not parse primary date/time pattern from string: '${dtString}'. Checking for date only.`);
      const dateOnlyMatch = dtString.match(/([A-Za-z]+ \d{1,2})(?:,?\s*(\d{4}))?/);
      if (dateOnlyMatch) {
        let dateStr = dateOnlyMatch[1]; const yearStr = dateOnlyMatch[2];
        // Ensure year is present for parsing
        if (!yearStr) dateStr = `${dateStr} ${currentYear}`; else dateStr = `${dateStr} ${yearStr}`;
        // ** FIXED ESLint issue: Replaced U+1F4DD with 'd yyyy' **
        const possibleFormats = ['MMMM d yyyy']; // Use standard format tokens
        for (const fmt of possibleFormats) {
          startDt = dateParse(dateStr, fmt, now);
          if (isDateValid(startDt)) { isAllDay = true; break; } // Assume all day if only date found
        }
        if (!isDateValid(startDt)) startDt = null;
      }
    }
  }
  // Format valid dates to ISO strings, preserving timezone offset if applicable (though we used UTC)
  // formatISO typically includes timezone offset ('Z' for UTC or +/-HH:mm)
  const startIso = startDt && isDateValid(startDt) ? formatISO(startDt) : null;
  const endIso = endDt && isDateValid(endDt) ? formatISO(endDt) : null;
  isAllDay = Boolean(isAllDay); // Ensure it's a boolean
  return { startIso, endIso, isAllDay };
}

/**
 * Extracts contact details from the 'More Information' section text/HTML.
 * @param {cheerio.Cheerio<cheerio.Element>} infoSection - Cheerio object for the section.
 * @param {string|null} eventPageUrl - The extracted event page URL to remove it from name.
 * @returns {{ name: string|null, phone: string|null, email: string|null }}
 */
function extractContactInfo(infoSection, eventPageUrl) {
  let name = null; let phone = null; let email = null;
  if (!infoSection || infoSection.length === 0) {
    return { name, phone, email };
  }

  // Find email link first
  const emailLink = infoSection.find('a[href^="mailto:"]');
  if (emailLink.length > 0) {
    email = emailLink.attr('href')?.replace('mailto:', '').trim() || null;
  }

  // Find phone number (simple North American format regex)
  const fullTextContent = infoSection.text(); // Use text content for regex
  const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/;
  const phoneMatch = fullTextContent.match(phoneRegex);
  if (phoneMatch) {
    phone = phoneMatch[0].replace(/\D/g, ''); // Keep only digits
  }

  // --- Clean text to find name ---
  const nameSection = infoSection.clone(); // Clone to avoid modifying original
  nameSection.find('a[href^="mailto:"]').remove(); // Remove email link element
  // Remove the raw matched phone number string from the text content
  let textContent = nameSection.text().replace(/\s+/g, ' ').trim();
  if (phoneMatch) {
    textContent = textContent.replace(phoneMatch[0], '').trim();
  }
  // Remove the known email address string
  if (email) {
    textContent = textContent.replace(email, '').trim();
  }
  // Remove eventPageUrl if it was present
  if (eventPageUrl && textContent.includes(eventPageUrl)) {
    textContent = textContent.replace(eventPageUrl, '').trim();
  }
  // Remove the heading itself ("More Information:")
  textContent = textContent.replace(/^More Information:?/i, '').trim();
  // Remove leading/trailing commas, normalize internal spacing/commas
  textContent = textContent.replace(/^,|,$/g, '').trim();
  textContent = textContent.replace(/ , /g, ', ').trim();
  textContent = textContent.replace(/,+/g, ',').trim();
  textContent = textContent.replace(/^,|,$/g, '').trim(); // Check again

  // Basic checks for validity
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
  // (This function remains the same)
  const $ = cheerio.load(htmlContent);
  const events = new Map(); // Use Map to handle potential duplicates by eventId
  // Target links within the second column (td) of table rows (tr)
  $('table tr td:nth-child(2) a').each((index, element) => {
    const link = $(element);
    const relativeUrl = link.attr('href');
    if (relativeUrl) {
      try {
        // Resolve relative URL against the base URL
        const absoluteUrl = new URL(relativeUrl, BASE_URL).toString();
        const parsedUrl = new URL(absoluteUrl);
        // Extract the event ID from the 'et_id' query parameter
        const eventId = parsedUrl.searchParams.get('et_id');
        if (eventId) {
          // Add to map only if eventId is found and not already present
          if (!events.has(eventId)) {
            events.set(eventId, { url: absoluteUrl, eventId });
          }
        } else {
          console.warn(`Found link without et_id: ${absoluteUrl}`);
        }
      } catch (e) {
        // Log errors during URL processing
        console.error(`Error processing link href "${relativeUrl}": ${e.message}`);
      }
    }
  });
  // Convert Map values back to an array
  return Array.from(events.values());
}

/**
 * Parses the HTML of an event detail page to extract event data.
 * SIMPLIFIED: Removes detailed location fields (building, room, campus).
 * Renames location_text to location, containing filtered physical location info.
 * UPDATED: Includes check for virtual keywords in 'More Information' section.
 * UPDATED: Description now includes text from *all* <p> tags in #event-display.
 * @param {string} htmlContent - HTML string of the detail page.
 * @param {string} eventUrl - The URL of the page being parsed.
 * @param {string} eventId - The unique event ID (from et_id).
 * @returns {object|null} - Structured event data object, or null on critical error.
 */
export function parseEventDetailPage(htmlContent, eventUrl, eventId) {
  const $ = cheerio.load(htmlContent);
  // Define the structure for the event data to be extracted
  const eventData = {
    event_id: eventId,
    event_url: eventUrl,
    title: null,
    start_datetime: null,
    end_datetime: null,
    all_day: false,
    description: null,
    category_tags: null, // Note: No parsing logic implemented for this field
    cost_admission: null,
    location: null, // Simplified: physical location string (filtered)
    location_virtual_url: null, // URL for online component (e.g., Zoom)
    attendance_type: 'IN_PERSON', // Default attendance type
    organizer_sponsor: null,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    event_page_url: null, // Specific external event page if available
    last_scraped_at: new Date(), // Timestamp of when scraping occurred
  };

  // Find the main container for event details
  const eventDisplayDiv = $('#event-display');
  if (eventDisplayDiv.length === 0) {
    console.error(`[${eventId}] Critical Error: Could not find main container #event-display.`);
    return null; // Cannot proceed without the main container
  }

  // Extract the event title (usually the first H2)
  const titleElement = eventDisplayDiv.find('h2').first();
  eventData.title = titleElement.text().trim() || null;
  if (!eventData.title) console.warn(`[${eventId}] Title not found.`);

  // --- Extract Date/Time and Location strings ---
  // Iterate through sibling nodes *after* the title (H2)
  // to collect text/BR tags until a horizontal rule (HR) likely indicates the end
  const dateTimeLocationLines = [];
  let currentNode = titleElement.get(0)?.nextSibling;
  // ** Removed firstParagraphNode tracking as description logic changed **

  while (currentNode) {
    if (currentNode.nodeType === 1) { // ELEMENT_NODE
      const tagName = currentNode.tagName.toUpperCase();
      // Stop collecting if we hit a horizontal rule (common separator)
      if (tagName === 'HR') break;
      // Treat <br> tags as newlines
      if (tagName === 'BR') dateTimeLocationLines.push('\n');
    } else if (currentNode.nodeType === 3) { // TEXT_NODE
      const text = currentNode.nodeValue.trim();
      if (text) dateTimeLocationLines.push(text); // Add non-empty text nodes
    }
    currentNode = currentNode.nextSibling; // Move to the next sibling
  }

  // Combine extracted lines, cleaning whitespace
  const combinedDateTimeLocationText = dateTimeLocationLines
    .join('') // Join parts including the '\n' from <br>
    .replace(/[ \t]*\n[ \t]*/g, '\n') // Trim spaces around newlines
    .replace(/[ \t]{2,}/g, ' ') // Collapse multiple spaces
    .trim();

  // Split into date/time and raw location based on the first newline
  const splitLines = combinedDateTimeLocationText.split('\n').map(line => line.trim()).filter(Boolean);
  let dateTimeString = '';
  let rawLocationString = null; // The original location string before filtering

  if (splitLines.length >= 2) {
    dateTimeString = splitLines[0]; // First line is assumed date/time
    rawLocationString = splitLines.slice(1).join(', '); // Join remaining lines as location string
  } else if (splitLines.length === 1) {
    // If only one line, assume it's the date/time string
    dateTimeString = splitLines[0];
    console.warn(`[${eventId}] Only one line found after title; assuming it's date/time: "${dateTimeString}"`);
  } else {
    // If no lines found (e.g., empty space between H2 and HR)
    console.warn(`[${eventId}] Could not extract date/time/location text between title and HR.`);
  }

  console.log(`[${eventId}] Extracted dateTimeString: "${dateTimeString}"`);
  console.log(`[${eventId}] Extracted rawLocationString: "${rawLocationString}"`);

  // --- Filter raw location string to get physical location ---
  // Remove virtual keywords and URLs to isolate physical location details
  if (rawLocationString) {
    const virtualFilterKeywords = /\b(zoom|online|virtual|webinar|hybrid|webcast|join meeting)\b/i;
    const urlFilterRegex = /^https?:\/\//i;
    const locationPartsFiltered = rawLocationString
      .split(',') // Split by comma to check each part
      .map(p => p.trim())
      .filter(p => !virtualFilterKeywords.test(p) // Exclude parts matching virtual keywords
        && !urlFilterRegex.test(p), // Exclude parts that are URLs
      );

    // Assign the joined filtered parts to eventData.location
    if (locationPartsFiltered.length > 0) {
      eventData.location = locationPartsFiltered.join(', '); // Re-join remaining parts
    } else {
      eventData.location = null; // Set to null if filtering removed everything
    }
    console.log(`[${eventId}] Filtered physical location (eventData.location): "${eventData.location}"`);
  } else {
    eventData.location = null; // No raw location string was extracted
  }

  // --- Parse Date/Time ---
  // Use the dedicated function to parse the extracted date/time string
  const allDayTextPresent = dateTimeString && dateTimeString.toLowerCase().includes('all day');
  const { startIso, endIso, isAllDay } = parseDateTimeString(dateTimeString, allDayTextPresent, eventUrl);
  eventData.start_datetime = startIso;
  eventData.end_datetime = endIso;
  eventData.all_day = isAllDay;

  // --- Description ---
  // ** UPDATED LOGIC: Get text from ALL <p> tags within #event-display **
  // This is simpler but may include text from Sponsor/Info/Ticket sections.
  const descriptionParas = [];
  eventDisplayDiv.find('p').each((index, element) => {
    const paragraphText = $(element).text().trim();
    if (paragraphText) {
      descriptionParas.push(paragraphText);
    }
  });
  eventData.description = descriptionParas.length > 0 ? descriptionParas.join('\n\n') : null; // Join paragraphs with double newline
  console.log(`[${eventId}] Extracted description from all <p> tags.`);

  // --- Find Sections (Sponsor, Info, Ticket) ---
  // Look for paragraphs containing a <strong> tag with specific starting text
  // Note: This logic now runs *after* the description is gathered.
  let sponsorSection = null;
  let infoSection = null;
  let ticketSection = null;
  eventDisplayDiv.find('p:has(strong), div:has(strong)').each((i, el) => { // Target P or DIV containing STRONG
    const element = $(el);
    const strongText = element.find('strong').first().text().trim();
    // Check if the strong text itself starts with the keywords
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
    // Extract text *after* the <strong> tag, handling potential <br>
    const sponsorHtml = sponsorSection.html(); // Get inner HTML
    const strongEndTag = '</strong>';
    const strongEndIndex = sponsorHtml?.indexOf(strongEndTag);
    let sponsorText = '';
    if (sponsorHtml && strongEndIndex !== -1) {
      sponsorText = sponsorHtml.substring(strongEndIndex + strongEndTag.length).trim(); // Get text after </strong>
    } else {
      // Fallback if <strong> wasn't found as expected, use text after ":"
      sponsorText = sponsorSection.text().replace(/Event Sponsor:?/i, '').trim();
    }
    // Clean up any leading <br> or whitespace remnants using cheerio on the extracted text
    eventData.organizer_sponsor = cheerio.load(sponsorText || '').text().trim() || null;
  } else {
    console.warn(`[${eventId}] 'Event Sponsor' section not found.`);
  }

  // --- Contact Info & Event Page URL (from More Information section) ---
  let infoSectionText = ''; // Store text content for keyword check later
  if (infoSection) {
    infoSectionText = infoSection.text(); // Get text before extracting links/contacts
    // Extract event page URL (prefer links with specific text, fallback to first non-mailto link)
    let foundPageUrl = false;
    infoSection.find('a').each((i, linkEl) => {
      const link = $(linkEl);
      const linkText = link.text().trim();
      const href = link.attr('href');
      if (!foundPageUrl && href && !href.startsWith('mailto:') && /more info|website|details|event page|register/i.test(linkText)) {
        try {
          eventData.event_page_url = new URL(href, BASE_URL).toString();
          foundPageUrl = true; // Stop after finding the first likely candidate
        } catch (e) { console.warn(`[${eventId}] Invalid potential event page URL found: ${href}`); }
      }
    });
    // Fallback if no specific link text matched
    if (!foundPageUrl) {
      const firstLink = infoSection.find('a:not([href^="mailto:"])').first();
      if (firstLink.length > 0) {
        const href = firstLink.attr('href');
        if (href) {
          try {
            eventData.event_page_url = new URL(href, BASE_URL).toString();
          } catch (e) { console.warn(`[${eventId}] Invalid fallback event page URL: ${href}`); }
        }
      }
    }
    // Extract contact info using the helper function
    const contacts = extractContactInfo(infoSection, eventData.event_page_url);
    eventData.contact_name = contacts.name;
    eventData.contact_phone = contacts.phone;
    eventData.contact_email = contacts.email;
  } else {
    console.warn(`[${eventId}] 'More Information' section not found.`);
  }

  // --- Cost/Admission ---
  // Prioritize "Ticket Information" section if found
  if (ticketSection) {
    const ticketHtml = ticketSection.html();
    const strongEndTag = '</strong>';
    const strongEndIndex = ticketHtml?.indexOf(strongEndTag);
    let costTextRaw = '';
    if (ticketHtml && strongEndIndex !== -1) {
      costTextRaw = ticketHtml.substring(strongEndIndex + strongEndTag.length).trim(); // Get text after </strong>
    } else {
      // Fallback if <strong> wasn't found as expected, use text after ":"
      costTextRaw = ticketSection.text().replace(/Ticket Information:?/i, '').trim();
    }
    // Clean the extracted text
    const costText = cheerio.load(costTextRaw || '').text().trim();
    if (costText) {
      eventData.cost_admission = costText;
      console.log(`[${eventId}] Found cost in 'Ticket Information': ${costText}`);
    } else {
      console.warn(`[${eventId}] Found 'Ticket Information' section but cost text was empty.`);
    }
  } else {
    // Fallback heuristic: Scan description and info section text for cost patterns
    // ** Note: Description now potentially includes cost info itself, but scanning infoSectionText is still useful **
    console.log(`[${eventId}] 'Ticket Information' section not found. Scanning info section text for cost keywords.`);
    const costRegex = /(\$\d+(?:\.\d{2})?)|(free admission)|(free event)|free and open to the public/i;
    const textToScan = infoSectionText; // Only scan info section text now
    const costMatch = textToScan.match(costRegex);
    if (costMatch) {
      eventData.cost_admission = costMatch[0]; // Store the matched phrase
      console.log(`[${eventId}] Found cost via heuristic scan in info section: ${eventData.cost_admission}`);
    }
  }

  // --- Attendance Type & Virtual URL ---
  eventData.attendance_type = 'IN_PERSON'; // Start with default assumption
  const virtualKeywords = /\b(zoom|online|virtual|webinar|hybrid|webcast|join meeting)\b/i;
  // Broader regex to catch common Zoom link patterns
  const zoomUrlRegex = /https:\/\/[\w-]*\.?zoom\.us\/(?:j|my|w|meeting)\/[\d\w?=-]+/i;
  let foundZoomUrl = null; // Store the first found Zoom URL

  // 1. Check rawLocationString for Zoom URL
  const zoomMatchLoc = (rawLocationString || '').match(zoomUrlRegex);
  if (zoomMatchLoc) {
    foundZoomUrl = zoomMatchLoc[0];
    eventData.location_virtual_url = foundZoomUrl;
    console.log(`[${eventId}] Found Zoom URL in raw location string: ${foundZoomUrl}`);
  }

  // 2. Check "More Information" section links for Zoom URL (if not already found)
  if (!foundZoomUrl && infoSection) {
    infoSection.find('a').each((i, linkEl) => {
      const href = $(linkEl).attr('href');
      if (href) {
        const zoomMatchInfo = href.match(zoomUrlRegex);
        if (zoomMatchInfo) {
          foundZoomUrl = zoomMatchInfo[0];
          eventData.location_virtual_url = foundZoomUrl;
          console.log(`[${eventId}] Found Zoom URL in More Information links: ${foundZoomUrl}`);
          return false; // Stop searching links once found
        }
      }
    });
  }

  // 3. Check Description for Zoom URL (if still not found)
  // ** Note: Description now includes all <p> text, so this check is more comprehensive **
  if (!foundZoomUrl && eventData.description) {
    const zoomMatchDesc = eventData.description.match(zoomUrlRegex);
    if (zoomMatchDesc) {
      foundZoomUrl = zoomMatchDesc[0];
      eventData.location_virtual_url = foundZoomUrl;
      console.log(`[${eventId}] Found Zoom URL in description: ${foundZoomUrl}`);
    }
  }

  // --- Determine Attendance Type based on combined evidence ---
  // Check for virtual indicators in various places:
  const foundVirtualKeywordInRawLocation = virtualKeywords.test(rawLocationString || '');
  // ** Check the *newly gathered* full description **
  const foundVirtualKeywordInDescription = virtualKeywords.test(eventData.description || '');
  const foundVirtualKeywordInInfo = virtualKeywords.test(infoSectionText || '');

  // Combine all virtual indicators: Found a Zoom URL OR found keywords in location/description/info
  const hasVirtualComponent = Boolean(foundZoomUrl) // Use Boolean() for explicit true/false from URL string
                             || foundVirtualKeywordInRawLocation
                             || foundVirtualKeywordInDescription // Checks the full description now
                             || foundVirtualKeywordInInfo;

  // Check if there's any physical location info left after filtering
  const likelyPhysical = !!eventData.location;

  // Set attendance type based on physical and virtual evidence
  if (hasVirtualComponent) {
    if (likelyPhysical) {
      eventData.attendance_type = 'HYBRID';
    } else {
      eventData.attendance_type = 'ONLINE';
      // If purely online, ensure physical location field is null
      eventData.location = null;
    }
  } else {
    // No virtual component detected
    if (likelyPhysical) {
      eventData.attendance_type = 'IN_PERSON';
    } else {
      // Edge case: No physical location AND no virtual indicators found.
      console.warn(`[${eventId}] No physical location parsed and no virtual indicators found. Attendance type unclear, defaulting to IN_PERSON.`);
      eventData.attendance_type = 'IN_PERSON'; // Default, or could be 'UNKNOWN'
    }
  }
  console.log(`[${eventId}] Determined Attendance Type: ${eventData.attendance_type}`);

  // --- Final Validation Check ---
  // Ensure essential fields like title and start date/time were successfully parsed
  if (!eventData.title || !eventData.start_datetime) {
    console.error(`[${eventId}] CRITICAL ERROR: Missing title or start date/time. Skipping save for ${eventUrl}`);
    console.error(`[${eventId}] -> Found Title: ${eventData.title}`);
    console.error(`[${eventId}] -> Found Start DateTime: ${eventData.start_datetime}`);
    return null; // Return null to indicate parsing failure
  }

  // Return the structured event data object
  return eventData;
}
