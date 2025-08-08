# Wolftime Spinner

A modern web application for Stand Up Trivia with a spinning wheel to randomly select participants and a comprehensive scoreboard system.

## Features

- **Spinning Wheel**: Animated wheel that randomly selects participants with weighted probability
- **Scoreboard Management**: Add, edit, and track participant scores
- **Group Filtering**: Separate developers and non-developers with toggle
- **Weighted Selection**: Favors participants who have asked fewer questions
- **CSV Data Storage**: Persistent data storage with CSV file
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
- `standup_scoreboard.csv` - Data storage file
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

- **Volume Mounting**: CSV file persists between container restarts
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
- **Data Storage**: CSV file with persistent data
- **Weighted Selection**: Algorithm favors participants with fewer questions asked
- **Accessibility**: High contrast colors and proper text shadows
- **Containerization**: Full Docker support with health checks

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

Example `.env` file:

```env
# Security Configuration
PASSPHRASE=wolftime2024

# Server Configuration
PORT=3000
NODE_ENV=development
```

You can also set these variables in the `docker-compose.yml` file or via environment variables when running Docker:

## Data Persistence

The CSV file is mounted as a volume, ensuring data persists between container restarts. The file is located at `./standup_scoreboard.csv` on the host machine.
