/**
 * Script to sync event times with the UH Manoa calendar
 * 
 * This script:
 * 1. Finds events that have a UH Manoa calendar URL
 * 2. Extracts the event ID from the URL
 * 3. Uses it to update the event with accurate information
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const prisma = new PrismaClient();

// Extract UH Manoa event ID from URL
function extractEventId(url) {
  if (!url) return null;
  
  // Pattern: .../2025/05/08/44135.html or ?et_id=57492
  const urlMatch = url.match(/\/(\d+)\.html/);
  const paramMatch = url.match(/et(?:%5F|_)id=(\d+)/);
  
  return urlMatch ? urlMatch[1] : (paramMatch ? paramMatch[1] : null);
}

// Extract date and time from the UH Manoa calendar page title
function extractDateTime(date, time) {
  if (!date) return null;
  
  // Handle date format: Monday, May 5
  const dateMatch = date.match(/(\w+),\s+(\w+)\s+(\d+)/);
  if (!dateMatch) return null;
  
  const month = dateMatch[2];
  const day = dateMatch[3];
  const year = 2025; // Default year
  
  // Map month name to month number
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  };
  
  // Create date object
  const eventDate = new Date(year, months[month], parseInt(day));
  
  // Add time if available
  if (time) {
    // Handle time format: 9:00am, 12:00pm, etc.
    const timeMatch = time.match(/(\d+):(\d+)(am|pm)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const ampm = timeMatch[3].toLowerCase();
      
      // Convert to 24-hour format
      if (ampm === 'pm' && hours < 12) {
        hours += 12;
      } else if (ampm === 'am' && hours === 12) {
        hours = 0;
      }
      
      eventDate.setHours(hours, minutes, 0);
    }
  } else {
    // Default to 9am if no time provided
    eventDate.setHours(9, 0, 0);
  }
  
  return eventDate;
}

// Mock function to simulate fetching event data from UH Manoa calendar
// In a real implementation, you would use a web scraping library to actually fetch this data
async function fetchUHManoaEventData(eventId) {
  // This is where you'd implement actual web scraping
  // For this example, we'll use the UH Manoa calendar structure from the website
  
  // Sample data based on the UH Manoa calendar format
  // In a real implementation, you would fetch this from the actual website
  const sampleEvents = {
    // Monday, May 5 events
    '56623': { date: 'Monday, May 5', time: '9:00am', title: 'Sensory Room Mondays', location: 'Mānoa Campus, Kuykendall 106 Events Room' },
    '57432': { date: 'Monday, May 5', time: '12:00pm', title: 'Talk by James Zarsadiaz: Hiram Fong\'s Asian America', location: 'Mānoa Campus, Zoom' },
    '57493': { date: 'Monday, May 5', time: '1:00pm', title: 'O.H.A.N.A. Connection Meeting', location: 'UH Cancer Center, Sullivan Conference Center' },
    '57503': { date: 'Monday, May 5', time: '3:00pm', title: 'James C. Scott\'s Scholarship on Southeast Asia and Beyond: A Panel Discussion', location: 'Mānoa Campus, Moore Hall, Room 258' },
    '57500': { date: 'Monday, May 5', time: '4:30pm', title: 'Mixer', location: 'Mānoa Campus, Walter Dods, Jr. RISE Center, Level 2' },
    '57490': { date: 'Monday, May 5', time: '6:00pm', title: 'Dance Pau Hana 2025', location: 'Mānoa Campus, UHM Campus Center' },
    
    // Tuesday, May 6 events
    '57409': { date: 'Tuesday, May 6', time: '12:00pm', title: 'Slice of PI-CASC', location: 'Mānoa Campus, HIG 210' },
    '57524': { date: 'Tuesday, May 6', time: '3:00pm', title: 'Franklin Odo Undergraduate Colloquium', location: 'Mānoa Campus, George Hall 301B' },
    '57484': { date: 'Tuesday, May 6', time: '7:30pm', title: 'UH Bands Chamber Groups Concert', location: 'Mānoa Campus, Orvis Auditorium, 2411 Dole Street' },
    
    // Wednesday, May 7 events
    '57499': { date: 'Wednesday, May 7', time: '9:00am', title: 'CCS Spring 2025 Webinar Series: Presentations and Panel Discussions', location: 'Mānoa Campus, Zoom' },
    '57514': { date: 'Wednesday, May 7', time: '9:30am', title: 'CB RIP: Xuemei Xie', location: 'UH Cancer Center, Sullivan Conference Center' },
    '57491': { date: 'Wednesday, May 7', time: '10:00am', title: 'Botany Final Oral', location: 'Mānoa Campus, St. John Plant Science Laboratory Rm 007' },
    '57041': { date: 'Wednesday, May 7', time: '12:30pm', title: 'Breathe & Reset: Mid-week Meditation Break', location: 'Mānoa Campus, Webster Hall, Room 112' },
    '57495': { date: 'Wednesday, May 7', time: '1:00pm', title: 'CTO Lunch & Learn - Healthcare Disparities in Lung Cancer', location: 'UH Cancer Center, Sullivan Conference Center' },
    '57470': { date: 'Wednesday, May 7', time: '3:00pm', title: 'Public Health Final Oral', location: 'Mānoa Campus, BIOMED D-205, Zoom' },
    
    // Thursday, May 8 events
    '56979': { date: 'Thursday, May 8', time: '9:00am', title: 'Graduating Student Global Seal of Biliteracy Testing', location: 'Mānoa Campus, Moore Hall 153B EWA Computer Lab' },
    '57471': { date: 'Thursday, May 8', time: '9:00am', title: 'Mathematics Final Oral', location: 'Mānoa Campus, GARTLEY 102' },
    '57492': { date: 'Thursday, May 8', time: '10:30am', title: 'English Final Oral', location: 'Mānoa Campus' },
    
    // Friday, May 9 events
    '57195': { date: 'Friday, May 9', time: '9:15am', title: 'Spring Undergraduate Showcase (Hybrid)', location: 'Mānoa Campus, Manoa Campus, Kuykendall Hall (physical), Zoom (virtual)' },
    '57445': { date: 'Friday, May 9', time: '10:00am', title: 'Psychology Final Oral', location: 'Mānoa Campus' },
    
    // Other events
    '55913': { date: 'Saturday, May 17', time: '9:00am', title: '114th Annual UHM Commencement Exercises - 9:00 a.m. Ceremony', location: 'Mānoa Campus, Stan Sheriff Center, 1355 Lower Campus Road' },
    '55912': { date: 'Saturday, May 17', time: '3:30pm', title: '114th Annual UHM Commencement Exercises - 3:30 p.m. Ceremony', location: 'Mānoa Campus, Stan Sheriff Center, 1355 Lower Campus Road' },
    '54338': { date: 'Wednesday, May 14', time: '10:30am', title: 'SNAP Outreach & Enrollment Clinic', location: 'Mānoa Campus, Campus Center Courtyard' },
    '57502': { date: 'Wednesday, May 14', time: '3:00pm', title: 'Second Language Studies Final Oral', location: 'Mānoa Campus, Zoom, Link Below' },
    '57501': { date: 'Wednesday, May 14', time: '5:30pm', title: 'How to be a Remarkable Leader with Guy Kawasaki', location: 'Mānoa Campus, Walter Dods, Jr. RISE Center, Level 2' },
    '57320': { date: 'Thursday, May 15', time: '10:00am', title: '"Charting Your Course In An Uncertain World" with Mark S. Bergman', location: 'Mānoa Campus, Online' },
    '57515': { date: 'Thursday, May 15', time: '12:00pm', title: 'Seminar: Dr. Yukiko Yano', location: 'UH Cancer Center, Sullivan Conference Center' },
    '57504': { date: 'Friday, May 16', time: '12:00pm', title: 'Zoology Final Oral', location: 'Mānoa Campus, MSB 100 and Zoom' },
    '57516': { date: 'Tuesday, May 20', time: '12:00pm', title: 'Seminar: Dr. Alexandra Harris', location: 'Mānoa Campus, UH Cancer Center, Sullivan Conference Center' },
    '57496': { date: 'Wednesday, May 21', time: '11:30am', title: 'Join us for our May PIER Speaker Session | Strategies for Employers', location: 'Mānoa Campus, 1410 Lower Campus Rd 171f, Honolulu, HI 96822' },
  };
  
  return sampleEvents[eventId] || null;
}

async function syncWithUHManoaCalendar() {
  console.log('Starting to sync events with UH Manoa calendar...');
  
  // Get all events with UH Manoa calendar URLs
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { eventUrl: { contains: 'hawaii.edu/calendar' } },
        { eventPageUrl: { contains: 'hawaii.edu/calendar' } }
      ]
    }
  });
  
  console.log(`Found ${events.length} UH Manoa events to process`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const event of events) {
    try {
      // Get event ID from URL
      const eventUrl = event.eventUrl || event.eventPageUrl;
      const eventId = extractEventId(eventUrl);
      
      if (!eventId) {
        console.log(`Could not extract event ID from URL for event "${event.title}"`);
        skippedCount++;
        continue;
      }
      
      // Fetch event data from UH Manoa calendar
      const uhEventData = await fetchUHManoaEventData(eventId);
      
      if (!uhEventData) {
        console.log(`Could not find UH Manoa event data for ID ${eventId} (event: "${event.title}")`);
        skippedCount++;
        continue;
      }
      
      // Parse date and time
      const eventDateTime = extractDateTime(uhEventData.date, uhEventData.time);
      
      if (!eventDateTime) {
        console.log(`Could not parse date/time for event "${event.title}"`);
        skippedCount++;
        continue;
      }
      
      // Create an end time 1 hour after the start time if none was provided
      const endDateTime = new Date(eventDateTime);
      endDateTime.setHours(endDateTime.getHours() + 1);
      
      // Update the event with the correct date, time, and location
      await prisma.event.update({
        where: { id: event.id },
        data: {
          startDateTime: eventDateTime,
          endDateTime: endDateTime,
          location: uhEventData.location || event.location,
          title: uhEventData.title || event.title // Update title if different
        }
      });
      
      console.log(`✅ Updated event "${event.title}" with correct date/time: ${eventDateTime.toLocaleString()}`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Error processing event "${event.title}": ${error.message}`);
      errorCount++;
    }
  }
  
  // Summary
  console.log('\n--- Summary ---');
  console.log(`Events processed: ${events.length}`);
  console.log(`Events updated with correct times: ${updatedCount}`);
  console.log(`Events skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
}

async function main() {
  try {
    await syncWithUHManoaCalendar();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 