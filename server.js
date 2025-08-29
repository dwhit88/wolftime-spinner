const express = require("express");
const cors = require("cors");
const GoogleSheetsService = require("./googleSheetsService");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const PASSPHRASE = process.env.PASSPHRASE || "";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(".")); // Serve static files from current directory

// Verify passphrase endpoint
app.post("/api/verify-passphrase", (req, res) => {
  const { passphrase } = req.body;
  if (passphrase === PASSPHRASE) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid passphrase" });
  }
});

// Initialize Google Sheets service
let googleSheetsService;
try {
  googleSheetsService = new GoogleSheetsService();
} catch (error) {
  console.error("Failed to initialize Google Sheets service:", error);
  process.exit(1);
}

// Helper function to read data from Google Sheets
async function readData() {
  try {
    return await googleSheetsService.readData();
  } catch (error) {
    console.error("Error reading from Google Sheets:", error);
    throw error;
  }
}

// Helper function to write data to Google Sheets
async function writeData(data) {
  try {
    return await googleSheetsService.writeData(data);
  } catch (error) {
    console.error("Error writing to Google Sheets:", error);
    throw error;
  }
}

// GET endpoint to read data from Google Sheets
app.get("/api/scoreboard", async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (error) {
    console.error("Error reading from Google Sheets:", error);
    res.status(500).json({ error: "Failed to read data from Google Sheets" });
  }
});

// POST endpoint to update data in Google Sheets
app.post("/api/scoreboard/update", async (req, res) => {
  try {
    const { selectedNames, updatedData } = req.body;

    // Read current data
    const data = await readData();

    // Update the data
    const updatedSheetData = data.map((row) => {
      let updatedRow = { ...row };

      // Mark selected IDs as removed
      if (selectedNames && selectedNames.includes(row.Id)) {
        updatedRow.isRemoved = "TRUE";
      }

      // Update question values if provided
      if (updatedData) {
        const updateEntry = updatedData.find((item) => item.id === row.Id);
        if (updateEntry) {
          if (updateEntry.questionsAsked !== undefined) {
            updatedRow.questionsAsked = updateEntry.questionsAsked.toString();
          }
          if (updateEntry.questionsMissed !== undefined) {
            updatedRow.questionsMissed = updateEntry.questionsMissed.toString();
          }
          if (updateEntry.questionsAnsweredCorrectly !== undefined) {
            updatedRow.questionsAnsweredCorrectly =
              updateEntry.questionsAnsweredCorrectly.toString();
          }

          // Calculate points: questionsAnsweredCorrectly - questionsMissed (minimum 0)
          const questionsAnsweredCorrectly =
            parseInt(updateEntry.questionsAnsweredCorrectly) || 0;
          const questionsMissed = parseInt(updateEntry.questionsMissed) || 0;
          const points = Math.max(
            0,
            questionsAnsweredCorrectly - questionsMissed
          );
          updatedRow.points = points.toString();

          // Also update points if it's provided in the update data
          if (updateEntry.points !== undefined) {
            updatedRow.points = updateEntry.points.toString();
          }
        }
      }

      return updatedRow;
    });

    // Write updated data back to Google Sheets
    await writeData(updatedSheetData);

    const removedCount = selectedNames ? selectedNames.length : 0;
    const updatedCount = updatedData ? updatedData.length : 0;

    let message = "";
    if (removedCount > 0 && updatedCount > 0) {
      message = `Successfully removed ${removedCount} people and updated ${updatedCount} entries`;
    } else if (removedCount > 0) {
      message = `Successfully marked ${removedCount} people as removed`;
    } else if (updatedCount > 0) {
      message = `Successfully updated ${updatedCount} entries`;
    } else {
      message = "No changes made";
    }

    res.json({
      success: true,
      message: message,
      removedCount: removedCount,
      updatedCount: updatedCount,
    });
  } catch (error) {
    console.error("Error updating Google Sheets:", error);
    res.status(500).json({ error: "Failed to update data in Google Sheets" });
  }
});

// POST endpoint to add new person to Google Sheets
app.post("/api/scoreboard/add", async (req, res) => {
  try {
    const { name, isDev } = req.body;

    if (!name || !isDev) {
      return res.status(400).json({ error: "name and isDev are required" });
    }

    // Read current data
    const data = await readData();

    // Check if person already exists
    const existingPerson = data.find((row) => row.Name === name);
    if (existingPerson) {
      return res
        .status(400)
        .json({ error: "Person with this name already exists" });
    }

    // Find the highest ID to generate a new one
    const maxId = Math.max(...data.map((row) => parseInt(row.Id) || 0), 0);
    const newId = maxId + 1;

    // Create new person entry
    const newPerson = {
      Id: newId.toString(),
      Name: name,
      isDev: isDev,
      questionsAsked: "0",
      questionsMissed: "0",
      questionsAnsweredCorrectly: "0",
      points: "0",
      isRemoved: "FALSE",
    };

    // Add new person to data
    data.push(newPerson);

    // Write updated data back to Google Sheets
    await writeData(data);

    res.json({
      success: true,
      message: `Successfully added ${name} to the scoreboard`,
      newPerson: newPerson,
    });
  } catch (error) {
    console.error("Error adding person to CSV:", error);
    res.status(500).json({ error: "Failed to add person to CSV data" });
  }
});

// POST endpoint to clear scoreboard (reset all question values to 0)
app.post("/api/scoreboard/clear", async (req, res) => {
  try {
    // Read current data
    const data = await readData();

    // Reset all question values to 0 and recalculate points
    const updatedData = data.map((row) => {
      const updatedRow = { ...row };
      updatedRow.questionsAsked = "0";
      updatedRow.questionsMissed = "0";
      updatedRow.questionsAnsweredCorrectly = "0";
      updatedRow.points = "0";
      return updatedRow;
    });

    // Write updated data back to Google Sheets
    await writeData(updatedData);

    res.json({
      success: true,
      message: "Scoreboard cleared successfully",
      clearedCount: updatedData.length,
    });
  } catch (error) {
    console.error("Error clearing scoreboard:", error);
    res.status(500).json({ error: "Failed to clear scoreboard data" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Google Sheets ID: ${process.env.GOOGLE_SPREADSHEET_ID}`);
});
