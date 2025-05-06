# UH Manoa Clubs Import Feature

This document explains how to use the Google Sheets club import feature that has been integrated into the Manoa Compass application.

## Overview

The club import feature allows you to import clubs from a Google Sheet directly into the Manoa Compass database. The imported clubs will appear in the Clubs tab of the application.

## Prerequisites

1. A Google Sheet containing club data
2. Google Cloud Platform account to create service account credentials
3. Node.js installed on your computer

## Step 1: Prepare Your Google Sheet

Create a Google Sheet with the following columns (headers must match exactly):

| Header Name | Description | Required? |
|-------------|-------------|-----------|
| Name of Organization | The name of the club | Yes |
| Purpose | Description of the club's purpose | Yes |
| Type | Category/type of the club | No |
| Main Contact Person | Name of the primary contact | No |
| Contact Person's Email | Email of the primary contact | No |
| Website | Club website URL | No |
| Meeting Time | When the club meets | No |
| Meeting Location | Where the club meets | No |
| How to Join | Instructions for joining | No |

## Step 2: Set Up Google Sheets API Access

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable the Google Sheets API:
   - From the dashboard, navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API" and enable it
4. Create a service account:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" and select "Service Account"
   - Fill in the service account details and click "Create"
5. Generate a JSON key for the service account:
   - Click on your new service account
   - Go to the "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Choose JSON format and click "Create"
   - The key file will be downloaded to your computer
6. Share your Google Sheet with the service account email:
   - Open your Google Sheet
   - Click the "Share" button
   - Add the service account email (it looks like `something@project-id.iam.gserviceaccount.com`)
   - Give it at least "Viewer" permissions
   - Click "Share"

## Step 3: Configure Your Environment

1. Open the `.env` file in the root of the project
2. Update the following values:
   ```
   GOOGLE_SPREADSHEET_ID="your-spreadsheet-id"
   GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Content\n-----END PRIVATE KEY-----\n"
   ```
   - The spreadsheet ID can be found in your Google Sheet URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
   - The service account email and private key can be found in the JSON key file downloaded in Step 2

3. Optionally, specify which sheet to use:
   ```
   GOOGLE_SHEET_NAME="Sheet1"  # If you want to use a specific sheet by name
   GOOGLE_SHEET_GID="0"        # If you want to use a specific sheet by GID
   ```

## Step 4: Run the Import Script

In your terminal, navigate to the project root and run:
```bash
node scripts/import-clubs.js
```

You should see output showing the clubs being imported into the database.

## Step 5: View the Imported Clubs

1. Start the application:
   ```bash
   npm run dev
   ```
2. Open your browser and navigate to `http://localhost:3000/clubs`
3. You should see all the imported clubs displayed in the Clubs tab

## Troubleshooting

- **Missing credentials**: Ensure your `.env` file has all the required Google API credentials
- **Permission issues**: Make sure you've shared the Google Sheet with the service account email
- **Invalid sheet format**: Verify your sheet headers match the expected names exactly
- **Database issues**: Check the database connection is working properly

## Technical Details

- The import script uses the Google Sheets API v4 to access the sheet data
- Clubs are "upserted" (updated if they exist, created if they don't) based on the club name
- Categories from the "Type" field are matched to existing categories or created as new ones
- Imported clubs are automatically approved and visible in the Clubs tab 