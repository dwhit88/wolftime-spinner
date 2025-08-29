# Wolftime Spinner

A modern web application for Stand Up Trivia with a spinning wheel to randomly select participants and a comprehensive scoreboard system.

Note: This is a vibe-coded web app I made for fun 😎

## Features

- **Spinning Wheel**: Animated wheel that randomly selects participants with weighted probability
- **Scoreboard Management**: Add, edit, and track participant scores
- **Group Filtering**: Separate developers and non-developers with toggle
- **Weighted Selection**: Favors participants who have asked fewer questions
- **Google Sheets Integration**: Persistent data storage with Google Sheets API
- **Modern UI**: Clean, gradient-based design with smooth animations
- **Responsive Design**: Works on both desktop and mobile devices

## Quick Start

### Using Docker (Recommended)

1. **Prerequisites**: Install [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

2. **Run with Docker**:

   ```bash
   # Option 1: Use the convenience script
   ./run-docker.sh

   # Option 2: Manual Docker commands
   docker-compose up --build
   ```

3. **Access the Application**: Open http://localhost:3000 in your browser

### Local Development

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Start the Server**:

   ```bash
   node server.js
   ```

3. **Access the Application**: Open http://localhost:3000 in your browser

## File Structure

- `index.html` - Main HTML structure
- `styles.css` - CSS styling and animations
- `script.js` - Frontend JavaScript functionality
- `server.js` - Node.js Express server
- `googleSheetsService.js` - Google Sheets API integration service
- `package.json` - Node.js dependencies
- `Dockerfile` - Docker container configuration
- `docker-compose.yml` - Docker Compose configuration
- `run-docker.sh` - Convenience script for Docker setup

## Docker Configuration

### Dockerfile Features

- **Base Image**: Node.js 18 Alpine (lightweight)
- **Security**: Non-root user for container security
- **Health Check**: Automatic health monitoring
- **Optimized**: Multi-stage build for smaller image size

### Docker Compose Features

- **Environment Variables**: Google Sheets API configuration
- **Port Mapping**: Exposes port 3000
- **Health Checks**: Automatic container health monitoring
- **Restart Policy**: Automatic restart on failure

## Usage

### Spinner Screen

1. **Toggle Groups**: Use "Devs Only" toggle to filter participants
2. **Spin the Wheel**: Click "SPIN" to randomly select a participant
3. **View Chips**: See available participants as colored chips below the toggle

### Scoreboard Screen

1. **Add Participants**: Click "Add" to add new people to the scoreboard
2. **Edit Scores**: Click "Update" to edit question values
3. **Clear Data**: Click "Clear Scoreboard" to reset all scores
4. **Manage Data**: Delete participants or update their information

## Technical Details

- **Backend**: Node.js with Express server
- **Frontend**: Vanilla JavaScript with modern CSS
- **Data Storage**: Google Sheets API with persistent data
- **Weighted Selection**: Algorithm favors participants with fewer questions asked
- **Accessibility**: High contrast colors and proper text shadows
- **Containerization**: Full Docker support with health checks

## Google Sheets Integration

The application has been upgraded from CSV file storage to Google Sheets API integration. This provides several benefits:

- **Persistent Data**: Data survives server restarts and downtime
- **Real-time Updates**: Changes are immediately saved to Google Sheets
- **Backup & Sharing**: Easy to backup and share data with team members
- **Version History**: Google Sheets provides automatic version control
- **Multi-user Access**: Multiple people can view/edit the spreadsheet simultaneously

### Setup Requirements

1. **Google Cloud Project** with Google Sheets API enabled
2. **Service Account** for authentication (recommended)
3. **Google Spreadsheet** with proper structure and permissions
4. **Environment Variables** configured with API credentials

See `GOOGLE_SHEETS_SETUP.md` for complete setup instructions.

## Docker Commands

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in background
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Rebuild image
docker-compose build --no-cache
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

- `PASSPHRASE`: Authentication passphrase (default: wolftime2024)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (default: development, set to production in Docker)
- `GOOGLE_SPREADSHEET_ID`: Your Google Spreadsheet ID (required)
- `GOOGLE_SERVICE_ACCOUNT_KEY`: Service account JSON key for full access (recommended)
- `GOOGLE_API_KEY`: API key for read-only access (alternative)

Example `.env` file:

```env
# Security Configuration
PASSPHRASE=wolftime2024

# Server Configuration
PORT=3000
NODE_ENV=development

# Google Sheets API Configuration
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Important**: See `GOOGLE_SHEETS_SETUP.md` for detailed setup instructions.

You can also set these variables in the `docker-compose.yml` file or via environment variables when running Docker:

## Data Persistence

The application now uses Google Sheets API for data storage, ensuring data persists even when the server goes down. Your data is stored in a Google Spreadsheet and accessed via the Google Sheets API.

### Testing Google Sheets Integration

Before starting the server, test your Google Sheets setup:

```bash
npm run test:sheets
```

This will verify your credentials and test the connection to Google Sheets.

### Migration from CSV

If you were previously using the CSV file:

1. Copy your CSV data into a Google Spreadsheet
2. Follow the setup instructions in `GOOGLE_SHEETS_SETUP.md`
3. Your data will now persist in Google Sheets
4. You can remove the `standup_scoreboard.csv` file if desired
