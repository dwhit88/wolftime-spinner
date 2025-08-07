const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(".")); // Serve static files from current directory

// CSV file path
const CSV_FILE_PATH = path.join(__dirname, "standup_scoreboard.csv");

// Helper function to read CSV data
function readCSVData() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}

// Helper function to write CSV data
function writeCSVData(data) {
  return new Promise((resolve, reject) => {
    const csvWriter = createCsvWriter({
      path: CSV_FILE_PATH,
      header: [
        { id: "Name", title: "Name" },
        { id: "isDev", title: "isDev" },
        { id: "questionsAsked", title: "questionsAsked" },
        { id: "questionsMissed", title: "questionsMissed" },
        {
          id: "questionsAnsweredCorrectly",
          title: "questionsAnsweredCorrectly",
        },
        { id: "points", title: "points" },
        { id: "isRemoved", title: "isRemoved" },
      ],
    });

    csvWriter
      .writeRecords(data)
      .then(() => resolve())
      .catch((error) => reject(error));
  });
}

// GET endpoint to read CSV data
app.get("/api/scoreboard", async (req, res) => {
  try {
    const data = await readCSVData();
    res.json(data);
  } catch (error) {
    console.error("Error reading CSV:", error);
    res.status(500).json({ error: "Failed to read CSV data" });
  }
});

// POST endpoint to update CSV data
app.post("/api/scoreboard/update", async (req, res) => {
  try {
    const { selectedNames, updatedData } = req.body;

    // Read current data
    const data = await readCSVData();

    // Update the data
    const updatedCSVData = data.map((row) => {
      let updatedRow = { ...row };

      // Mark selected names as removed
      if (selectedNames && selectedNames.includes(row.Name)) {
        updatedRow.isRemoved = "TRUE";
      }

      // Update question values if provided
      if (updatedData) {
        const updateEntry = updatedData.find((item) => item.name === row.Name);
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

    // Write updated data back to CSV
    await writeCSVData(updatedCSVData);

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
    console.error("Error updating CSV:", error);
    res.status(500).json({ error: "Failed to update CSV data" });
  }
});

// POST endpoint to add new person to CSV
app.post("/api/scoreboard/add", async (req, res) => {
  try {
    const { name, isDev } = req.body;

    if (!name || !isDev) {
      return res.status(400).json({ error: "name and isDev are required" });
    }

    // Read current data
    const data = await readCSVData();

    // Check if person already exists
    const existingPerson = data.find((row) => row.Name === name);
    if (existingPerson) {
      return res
        .status(400)
        .json({ error: "Person with this name already exists" });
    }

    // Create new person entry
    const newPerson = {
      Name: name,
      isDev: isDev,
      questionsAsked: "0",
      questionsMissed: "",
      questionsAnsweredCorrectly: "",
      points: "0",
      isRemoved: "FALSE",
    };

    // Add new person to data
    data.push(newPerson);

    // Write updated data back to CSV
    await writeCSVData(data);

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`CSV file path: ${CSV_FILE_PATH}`);
});
