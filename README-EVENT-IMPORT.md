# UH Manoa Calendar Event Importer

This guide explains how to use the event importer to fetch events from the University of Hawaii at Manoa Calendar.

## Overview

The `import-uh-events.js` script fetches events directly from the UH Manoa Calendar website and imports them into the Manoa Compass database. The script:

1. Scrapes event listings from the UH Manoa Calendar
2. Visits individual event pages to gather detailed information
3. Maps UH event categories to Manoa Compass categories
4. Creates or updates events in the database
5. Performs cleanup to ensure data quality

## Running the Importer

To import events from the UH Manoa Calendar:

```bash
# Make sure you're in the project root directory
node scripts/import-uh-events.js
```

## Features

- **Automatic category mapping**: Maps UH Manoa event categories to Manoa Compass categories
- **Deduplication**: Prevents duplicate events by checking for existing events with the same URL or title/date
- **Robust date/time parsing**: Handles various date and time formats from the UH calendar
- **Attendance type detection**: Automatically detects if events are in-person, online, or hybrid based on location
- **Detailed logging**: Provides comprehensive logging of the import process
- **Data cleanup**: Removes invalid events (like page navigation elements) and ensures all events have at least one category
- **Error handling**: Gracefully handles parsing errors and network issues

## Category Mapping

The script maps UH Manoa event categories to Manoa Compass categories as follows:

| UH Manoa Category | Manoa Compass Category |
|-------------------|------------------------|
| Academic          | Academic               |
| Arts & Culture    | Cultural & Ethnic      |
| Athletics         | Sports                 |
| Community         | Service                |
| Conference        | Academic               |
| Misc              | Leisure/Recreational   |
| Research          | Academic               |
| Seminar           | Academic               |
| Student Affairs   | Leisure/Recreational   |
| Workshop          | Leisure/Recreational   |
| Meeting           | Leisure/Recreational   |
| Special Event     | Leisure/Recreational   |
| Exhibition        | Cultural & Ethnic      |
| Concert           | Leisure/Recreational   |
| Lecture           | Academic               |

## Additional Scripts

### Fix UH Events Script

If you've already imported events but need to fix issues with categories or cleanup problematic data, you can use the `fix-uh-events.js` script:

```bash
node scripts/fix-uh-events.js
```

This script:
1. Finds all events from UH Manoa (matching hawaii.edu/calendar in the URL)
2. Deletes events with numeric-only titles (which are navigation elements, not real events)
3. Assigns the Academic category to any UH Manoa events that don't have a category

### List Events Script

To verify the imported events and see their categories:

```bash
node scripts/list-events.js
```

This script provides a summary of:
- Total number of events in the database
- Sample of upcoming events with their details
- Count of events by category
- Sample of UH Manoa events

## Customization

You can modify the following aspects of the importer:

1. **Category mapping**: Edit the `CATEGORY_MAPPING` object in the script to change how UH categories map to Manoa Compass categories.
2. **Default event duration**: By default, events without an end time are set to 1 hour duration. You can modify this in the `scrapeEvents` function.
3. **Request delay**: The script waits 300ms between requests to avoid overwhelming the UH Calendar server. Adjust this value in the `scrapeEvents` function if needed.

## Troubleshooting

If you encounter issues:

1. **Connection problems**: Ensure you have a stable internet connection and can access the UH Manoa Calendar website.
2. **Database errors**: Verify that your database connection is properly configured.
3. **Parsing errors**: If the UH Calendar website structure changes, the scraping logic may need to be updated.
4. **Missing categories**: If events are imported without categories, run the `fix-uh-events.js` script to repair them.

## Scheduling Regular Imports

For production use, consider setting up a cron job to run the importer regularly:

```bash
# Example cron entry to run the importer daily at 2:00 AM
0 2 * * * cd /path/to/project && node scripts/import-uh-events.js >> /path/to/logs/importer.log 2>&1
``` 