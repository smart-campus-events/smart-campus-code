/**
 * Script to correct event dates to match the UH Manoa calendar website
 * 
 * This script fixes the dates of events to match exactly what's shown on the UH Manoa calendar:
 * https://www.hawaii.edu/calendar/manoa/
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Creates a date in Hawaii time zone and converts to UTC for storage
 */
function createHawaiiDate(year, month, day, hour = 9, minute = 0) {
  // Create date string in ISO format with Hawaii timezone (-10:00)
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00-10:00`;
  
  // Create a date with the timezone specified
  return new Date(dateStr);
}

/**
 * Parses time string from UH Manoa website
 * @param {string} timeStr - Time string (e.g., "9:00am", "12:00pm", "3:30pm")
 * @returns {Object} - Hour and minute values
 */
function parseTimeString(timeStr) {
  if (!timeStr) return { hour: 9, minute: 0 };
  
  // Try to match time patterns
  const timePattern = /(\d+):?(\d+)?(?:\s*)(am|pm|a\.m\.|p\.m\.)/i;
  const match = timeStr.match(timePattern);
  
  if (!match) return { hour: 9, minute: 0 };
  
  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3].toLowerCase();
  
  // Convert to 24-hour format
  if ((meridiem === 'pm' || meridiem === 'p.m.') && hour < 12) {
    hour += 12;
  } else if ((meridiem === 'am' || meridiem === 'a.m.') && hour === 12) {
    hour = 0;
  }
  
  return { hour, minute };
}

// Map of event titles to their correct dates from the UH Manoa calendar website
// Data directly copied from https://www.hawaii.edu/calendar/manoa/ on May 2025
const CALENDAR_EVENTS = [
  // Monday, May 5 events
  { title: 'Sensory Room Mondays', year: 2025, month: 5, day: 5, timeStr: '9:00am' },
  { title: 'Talk by James Zarsadiaz: Hiram Fong\'s Asian America', year: 2025, month: 5, day: 5, timeStr: '12:00pm' },
  { title: 'Midday Reset: Chair Yoga Stretch', year: 2025, month: 5, day: 5, timeStr: '12:30pm' },
  { title: 'Education-PhD Final Oral', year: 2025, month: 5, day: 5, timeStr: '1:00pm' },
  { title: 'O.H.A.N.A. Connection Meeting', year: 2025, month: 5, day: 5, timeStr: '1:00pm' },
  { title: 'Virtual Writing Room', year: 2025, month: 5, day: 5, timeStr: '1:30pm' },
  { title: 'James C. Scott\'s Scholarship on Southeast Asia and Beyond: A Panel Discussion', year: 2025, month: 5, day: 5, timeStr: '3:00pm' },
  { title: 'Mixer', year: 2025, month: 5, day: 5, timeStr: '4:30pm' },
  { title: 'Dance Pau Hana 2025', year: 2025, month: 5, day: 5, timeStr: '6:00pm' },
  
  // Tuesday, May 6 events
  { title: 'Slice of PI-CASC', year: 2025, month: 5, day: 6, timeStr: '12:00pm' },
  { title: 'School of Architecture Inflatables Installation – Temporary Emergency Space', year: 2025, month: 5, day: 6, timeStr: '2:00pm' },
  { title: 'Franklin Odo Undergraduate Colloquium', year: 2025, month: 5, day: 6, timeStr: '3:00pm' },
  { title: 'UH Bands Chamber Groups Concert', year: 2025, month: 5, day: 6, timeStr: '7:30pm' },
  
  // Wednesday, May 7 events
  { title: 'CCS Spring 2025 Webinar Series: Presentations and Panel Discussions', year: 2025, month: 5, day: 7, timeStr: '9:00am' },
  { title: 'Education-PhD Final Oral', year: 2025, month: 5, day: 7, timeStr: '9:00am' },
  { title: 'CB RIP: Xuemei Xie', year: 2025, month: 5, day: 7, timeStr: '9:30am' },
  { title: 'Botany Final Oral', year: 2025, month: 5, day: 7, timeStr: '10:00am' },
  { title: 'Campus Clothing Swap', year: 2025, month: 5, day: 7, timeStr: '10:00am' },
  { title: 'Nursing Practice Final Oral', year: 2025, month: 5, day: 7, timeStr: '10:00am' },
  { title: 'Breathe & Reset: Mid-week Meditation Break', year: 2025, month: 5, day: 7, timeStr: '12:30pm' },
  { title: 'CTO Lunch & Learn - Healthcare Disparities in Lung Cancer', year: 2025, month: 5, day: 7, timeStr: '1:00pm' },
  { title: 'Public Health Final Oral', year: 2025, month: 5, day: 7, timeStr: '3:00pm' },
  { title: 'ORE Seminar: A Low-Cost, Modular Autonomous Water Sampler (MAWS) for Coastal', year: 2025, month: 5, day: 7, timeStr: '3:30pm' },
  
  // Thursday, May 8 events
  { title: 'Virtual Writing Room', year: 2025, month: 5, day: 8, timeStr: '9:00am' },
  { title: 'Graduating Student Global Seal of Biliteracy Testing', year: 2025, month: 5, day: 8, timeStr: '9:00am' },
  { title: 'Mathematics Final Oral', year: 2025, month: 5, day: 8, timeStr: '9:00am' },
  { title: 'English Final Oral', year: 2025, month: 5, day: 8, timeStr: '10:30am' },
  { title: 'Hamilton Exam Hangout', year: 2025, month: 5, day: 8, timeStr: '11:00am' },
  { title: 'Nursing Practice Final Oral', year: 2025, month: 5, day: 8, timeStr: '2:00pm' },
  
  // Friday, May 9 events
  { title: 'Spring Undergraduate Showcase (Hybrid)', year: 2025, month: 5, day: 9, timeStr: '9:15am' },
  { title: 'Psychology Final Oral', year: 2025, month: 5, day: 9, timeStr: '10:00am' },
  
  // Monday-Tuesday, May 12-13 events
  { title: 'English, Final Oral', year: 2025, month: 5, day: 13, timeStr: '10:00am' },
  
  // Wednesday, May 14 events
  { title: 'SNAP Outreach & Enrollment Clinic', year: 2025, month: 5, day: 14, timeStr: '10:30am' },
  { title: 'Hamilton Exam Hangout', year: 2025, month: 5, day: 14, timeStr: '11:00am' },
  { title: 'Breathe & Reset: Mid-week Meditation Break', year: 2025, month: 5, day: 14, timeStr: '12:30pm' },
  { title: 'Music Final Oral', year: 2025, month: 5, day: 14, timeStr: '2:30pm' },
  { title: 'Second Language Studies Final Oral', year: 2025, month: 5, day: 14, timeStr: '3:00pm' },
  { title: 'How to be a Remarkable Leader with Guy Kawasaki', year: 2025, month: 5, day: 14, timeStr: '5:30pm' },
  
  // Thursday, May 15 events
  { title: '"Charting Your Course In An Uncertain World" with Mark S. Bergman', year: 2025, month: 5, day: 15, timeStr: '10:00am' },
  { title: 'Seminar: Dr. Yukiko Yano', year: 2025, month: 5, day: 15, timeStr: '12:00pm' },
  
  // Friday, May 16 events
  { title: 'Zoology Final Oral', year: 2025, month: 5, day: 16, timeStr: '12:00pm' },
  { title: 'Midday Reset: Chair Yoga Stretch', year: 2025, month: 5, day: 16, timeStr: '12:30pm' },
  { title: 'Educational Psychology Final Oral', year: 2025, month: 5, day: 16, timeStr: '1:00pm' },
  
  // Saturday, May 17 events
  { title: '114th Annual UHM Commencement Exercises - 9:00 a.m. Ceremony', year: 2025, month: 5, day: 17, timeStr: '9:00am' },
  { title: '114th Annual UHM Commencement Exercises - 3:30 p.m. Ceremony', year: 2025, month: 5, day: 17, timeStr: '3:30pm' },
  
  // Tuesday, May 20 events
  { title: 'Seminar: Dr. Alexandra Harris', year: 2025, month: 5, day: 20, timeStr: '12:00pm' },
  
  // Wednesday, May 21 events
  { title: 'Join us for our May PIER Speaker Session | Strategies for Employers', year: 2025, month: 5, day: 21, timeStr: '11:30am' }
];

/**
 * Find the best match for a given event from our database in the calendar events
 */
function findBestMatchingEvent(dbEventTitle) {
  // First try exact title match
  const exactMatch = CALENDAR_EVENTS.find(event => 
    event.title.toLowerCase() === dbEventTitle.toLowerCase()
  );
  
  if (exactMatch) return exactMatch;
  
  // Try partial match (if title contains a calendar event title or vice versa)
  for (const calendarEvent of CALENDAR_EVENTS) {
    if (dbEventTitle.includes(calendarEvent.title) || 
        calendarEvent.title.includes(dbEventTitle)) {
      return calendarEvent;
    }
  }
  
  // No match found
  return null;
}

async function correctEventDates() {
  console.log('Starting to correct event dates using UH Manoa calendar data...');
  console.log(`Using ${CALENDAR_EVENTS.length} events from the UH Manoa calendar.`);
  
  // Get all events from our database from UH Manoa
  const dbEvents = await prisma.event.findMany({
    where: {
      OR: [
        { organizerSponsor: { contains: 'University of Hawaii' } },
        { eventUrl: { contains: 'hawaii.edu/calendar' } },
        { eventPageUrl: { contains: 'hawaii.edu/calendar' } }
      ]
    }
  });
  
  console.log(`Found ${dbEvents.length} UH Manoa events in our database to process`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;
  
  for (const dbEvent of dbEvents) {
    try {
      // Find matching calendar event
      const matchingEvent = findBestMatchingEvent(dbEvent.title);
      
      if (!matchingEvent) {
        console.log(`⚠️ No matching calendar event found for: "${dbEvent.title}"`);
        notFoundCount++;
        continue;
      }
      
      // Create date in Hawaii time and convert to UTC for storage
      const { year, month, day, timeStr } = matchingEvent;
      const { hour, minute } = parseTimeString(timeStr);
      const startDateTime = createHawaiiDate(year, month, day, hour, minute);
      
      // Format for log display
      const hawaiiDateFormatted = new Date(startDateTime.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }));
      const formattedDay = hawaiiDateFormatted.getDate();
      const formattedMonth = hawaiiDateFormatted.getMonth() + 1;
      const formattedYear = hawaiiDateFormatted.getFullYear();
      const formattedHour = hawaiiDateFormatted.getHours();
      const formattedMinute = hawaiiDateFormatted.getMinutes();
      const isPM = formattedHour >= 12;
      const formattedHour12 = formattedHour > 12 ? formattedHour - 12 : (formattedHour === 0 ? 12 : formattedHour);
      
      const displayTime = `${formattedMonth}/${formattedDay}/${formattedYear} ${formattedHour12}:${formattedMinute.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
      
      // Check if the date needs to be updated by comparing ISO strings
      if (startDateTime.toISOString() === new Date(dbEvent.startDateTime).toISOString()) {
        console.log(`✓ Event "${dbEvent.title}" already has correct date/time: ${displayTime} (${matchingEvent.title})`);
        skippedCount++;
        continue;
      }
      
      // Update the event with the correct date
      await prisma.event.update({
        where: { id: dbEvent.id },
        data: {
          startDateTime
        }
      });
      
      console.log(`✅ Updated event "${dbEvent.title}" to match "${matchingEvent.title}" at ${timeStr}: ${displayTime}`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Error processing event "${dbEvent.title}": ${error.message}`);
      errorCount++;
    }
  }
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Calendar events available: ${CALENDAR_EVENTS.length}`);
  console.log(`Database events processed: ${dbEvents.length}`);
  console.log(`Events updated with correct dates: ${updatedCount}`);
  console.log(`Events already correct: ${skippedCount}`);
  console.log(`Events without a calendar match: ${notFoundCount}`);
  console.log(`Errors: ${errorCount}`);
}

async function main() {
  try {
    await correctEventDates();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 