# Manoa Compass Scripts

This directory contains the essential scripts for the Manoa Compass application.

## Main Script

The primary script `manoa-compass-data-manager.js` combines all the essential functionality for:

1. **Importing Clubs**: Imports clubs from Google Sheets with email addresses
2. **Importing Events**: Imports events from UH Manoa calendar
3. **Cleaning Categories**: Standardizes categories for clubs and events
4. **Approving Content**: Approves all clubs and events
5. **Checking Data**: Verifies database contents

## Usage

To use the main script:

```bash
node scripts/manoa-compass-data-manager.js [command]
```

Available commands:
- `import-clubs`: Import clubs from Google Sheet
- `import-events`: Import events from UH Manoa calendar
- `clean-categories`: Clean and standardize categories
- `approve-all`: Approve all clubs and events
- `check-data`: Check database contents
- `run-all`: Run all commands in sequence
