# Manoa Compass Scripts

This directory contains utility scripts for managing the Manoa Compass application database and event data.

## Event Import and Management Scripts

### 1. Import Events from UH Manoa Calendar 

- **`import-uh-events.js`**: Imports events from the UH Manoa calendar into the database
- **`import-ics-events.js`**: Imports events from an ICS file into the database

### 2. Event Database Management

- **`add-sample-events.js`**: Adds sample events to the database for testing and demonstration
- **`remove-sample-events.js`**: Removes sample/placeholder events from the database
- **`list-events.js`**: Lists all events in the database, showing categories and event details
- **`fix-event-dates.js`**: Updates event dates to be in the near future for better display on the frontend

### 3. Event Categorization

- **`verify-event-categories.js`**: Verifies that all events have at least one category and displays category distribution
- **`diversify-event-categories.js`**: Analyses event titles and descriptions to assign appropriate categories beyond Academic

### 4. Event URL Management

- **`update-event-links.js`**: Updates event URLs to point to the UH Manoa calendar for imported events
- **`verify-event-urls.js`**: Validates and fixes event URLs to ensure proper formatting and accessibility

### 5. Event Date/Time Management

- **`fix-event-times.js`**: Fixes events with 12:00am default times to have more appropriate times
- **`fix-event-display-times.js`**: Updates how event times are displayed to match UH Manoa calendar format
- **`fix-hawaii-timezone.js`**: Adjusts event times to properly account for Hawaii Standard Time (HST)
- **`correct-event-dates.js`**: Corrects event dates to match the actual dates from the UH Manoa calendar website
- **`sync-with-uh-calendar.js`**: Synchronizes event details with the official UH Manoa calendar (requires setup)

## How to Use

Each script can be run with Node.js:

```bash
node scripts/script-name.js
```

## Event URL Formats

For UH Manoa events, we support two URL formats:
- `https://manoa.hawaii.edu/calendar/`
- `https://www.hawaii.edu/calendar/manoa/`

Each event typically has two URL fields:
- `eventUrl`: Points to the UH Manoa calendar (original event source)
- `eventPageUrl`: Points to the specific event page with details

## Event Time Display

Events imported from the UH Manoa calendar follow these display rules:
- If a specific time is provided on the UH calendar (e.g., "9:00am"), we show it
- If no time is specified, we only show the date without a time
- For events with specific times, we display both start and end times when available

The `fix-event-display-times.js` script provides code for updating the frontend to handle these display rules properly.

## Event Categories

Events from the UH Manoa calendar are typically imported with the "Academic" category by default. To create a better user experience, we recommend running the `diversify-event-categories.js` script, which will:

1. Analyze event titles, descriptions, and organizer information
2. Match against keyword patterns for various categories (Arts, Health, Social, etc.)
3. Assign appropriate additional categories to each event

This improves filtering functionality and gives users a more accurate view of event types.

## Troubleshooting

- If events aren't displaying in the frontend, run `fix-event-dates.js` to update event dates to the near future
- If events are missing categories, run `verify-event-categories.js` to assign default categories
- If all events are only showing as "Academic", run `diversify-event-categories.js` to assign proper categories
- If event links are missing or incorrect, run `verify-event-urls.js` to fix them
- If events show incorrect times (like 12:00am for everything), run `fix-event-times.js` to fix them
- If event dates are incorrect compared to the UH Manoa calendar, run `correct-event-dates.js` to fix them
- To clean up placeholder events, use `remove-sample-events.js` 