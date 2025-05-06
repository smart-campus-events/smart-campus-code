[![ci-nextjs-application-template](https://github.com/manoa-compass/manoa-compass-code/actions/workflows/ci-manoa-compass-code/badge.svg)](https://github.com/ics-software-engineering/nextjs-application-template/actions/workflows/ci.yml)

For details, please see http://ics-software-engineering.github.io/nextjs-application-template/.

# Manoa Compass

A platform for UH Manoa students to discover campus activities, events, and clubs.

## Club Import Feature

The application includes a feature to import club data from a Google Sheet. Follow these steps to use it:

### 1. Prepare Your Google Sheet

Create a Google Sheet with the following column headers in Row 1:
- `Name of Organization` (required)
- `Purpose` (required)
- `Type` (optional - club category)
- `Main Contact Person` (optional)
- `Contact Person's Email` (optional)
- `Website` (optional)
- `Meeting Time` (optional)
- `Meeting Location` (optional)
- `How to Join` (optional)

### 2. Set Up Google Sheets API Access

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Sheets API
4. Create a Service Account
5. Generate a JSON key for the service account
6. Share your Google Sheet with the service account email (with at least viewer permissions)

### 3. Configure Your Environment

Update your `.env` file with the following values from your Google Cloud project:
```
GOOGLE_SPREADSHEET_ID="your-spreadsheet-id"
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Content\n-----END PRIVATE KEY-----\n"
```

You can optionally specify:
```
GOOGLE_SHEET_NAME="Sheet1"  # If you want to use a specific sheet by name
GOOGLE_SHEET_GID="0"        # If you want to use a specific sheet by GID
```

### 4. Run the Import Script

```bash
node scripts/import-clubs.js
```

### 5. View Imported Clubs

After running the import script, the imported clubs will be available on the Clubs page of the application.

## Development

[Additional development instructions here]
