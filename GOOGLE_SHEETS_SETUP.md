# Google Sheets API Setup Guide

This guide will help you set up Google Sheets API integration to replace the CSV file operations in your Wolftime Spinner app.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console
3. A Google Spreadsheet with the same structure as your current CSV

## Step 1: Create a Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it something like "Wolftime Spinner Scoreboard"
3. Set up the headers in the first row (A1:H1):
   - A1: `Id`
   - B1: `Name`
   - C1: `isDev`
   - D1: `questionsAsked`
   - E1: `questionsMissed`
   - F1: `questionsAnsweredCorrectly`
   - G1: `points`
   - H1: `isRemoved`
4. Copy your existing CSV data into the spreadsheet (starting from row 2)
5. Note the Spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit`

## Step 2: Set up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click on it and press "Enable"

## Step 3: Create Service Account (Recommended for full access)

1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: "wolftime-spinner-api"
   - Description: "Service account for Wolftime Spinner app"
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"
6. Click on the created service account
7. Go to the "Keys" tab
8. Click "Add Key" > "Create new key"
9. Choose "JSON" format and download the key file
10. **Important**: Keep this file secure and never commit it to version control

## Step 4: Share the Spreadsheet

1. Open your Google Spreadsheet
2. Click the "Share" button in the top right
3. Add the service account email (found in the JSON key file under `client_email`)
4. Give it "Editor" permissions
5. Click "Send" (no need to send an email)

## Step 5: Configure Environment Variables

1. Copy the `env.example` file to `.env`
2. Fill in the required values:

```bash
# Required: Your Google Spreadsheet ID
GOOGLE_SPREADSHEET_ID=your_actual_spreadsheet_id_here

# Required: Your service account key (paste the entire JSON content)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

# Your app passphrase
PASSPHRASE=your_app_passphrase_here

# Optional: Port (defaults to 3000)
PORT=3000
```

## Step 6: Test the Integration

1. Start your server: `npm start`
2. Check the console for successful Google Sheets connection
3. Test the app functionality:
   - View the scoreboard
   - Add a new person
   - Update question counts
   - Clear the scoreboard

## Alternative: API Key Only (Read-Only Access)

If you only need read access:

1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key
4. In your `.env` file, use:
   ```bash
   GOOGLE_API_KEY=your_api_key_here
   ```
   Instead of the service account key

**Note**: With API key only, you'll have read-only access. All write operations will fail.

## Troubleshooting

### Common Issues

1. **"Failed to initialize Google Sheets service"**

   - Check that your environment variables are set correctly
   - Verify the service account key JSON is valid
   - Ensure the Google Sheets API is enabled

2. **"Permission denied" errors**

   - Make sure the service account email has access to the spreadsheet
   - Check that the spreadsheet ID is correct
   - Verify the service account has "Editor" permissions

3. **"Invalid range" errors**

   - Check the `GOOGLE_SHEET_RANGE` environment variable
   - Ensure the range covers all your data columns (A:H)

4. **Authentication errors**
   - Verify your service account key is complete and valid
   - Check that the service account hasn't been deleted
   - Ensure the Google Sheets API is enabled in your project

### Testing the Connection

You can test your Google Sheets connection by running:

```bash
node -e "
const GoogleSheetsService = require('./googleSheetsService');
const service = new GoogleSheetsService();
service.readData().then(data => {
  console.log('Successfully connected to Google Sheets!');
  console.log('Found', data.length, 'rows');
}).catch(err => {
  console.error('Connection failed:', err.message);
});
"
```

## Security Notes

- Never commit your `.env` file or service account keys to version control
- Use environment variables for all sensitive configuration
- Consider using a secrets management service in production
- Regularly rotate your service account keys
- Limit the service account permissions to only what's necessary

## Migration from CSV

After setting up Google Sheets:

1. Your existing CSV data will be preserved in the spreadsheet
2. All new operations will use Google Sheets instead of CSV
3. You can remove the `standup_scoreboard.csv` file if desired
4. The app will continue to work exactly as before, but with persistent data storage

## Support

If you encounter issues:

1. Check the Google Cloud Console for API quotas and errors
2. Verify your service account permissions
3. Test with a simple spreadsheet first
4. Check the server console for detailed error messages
