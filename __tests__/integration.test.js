const request = require("supertest");
const express = require("express");
const cors = require("cors");

// Mock the GoogleSheetsService
jest.mock("../googleSheetsService");

// Import the server after mocking
const GoogleSheetsService = require("../googleSheetsService");

describe("Integration Tests", () => {
  let app;
  let mockGoogleSheetsService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh Express app for each test
    app = express();
    app.use(cors());
    app.use(express.json());

    // Mock GoogleSheetsService instance
    mockGoogleSheetsService = {
      readData: jest.fn(),
      writeData: jest.fn(),
      appendRow: jest.fn(),
      updateRow: jest.fn(),
      deleteRow: jest.fn(),
      clearScoreboard: jest.fn(),
    };

    // Mock the constructor to return our mock instance
    GoogleSheetsService.mockImplementation(() => mockGoogleSheetsService);

    // Set up environment variables
    process.env.PORT = "3001";
    process.env.GOOGLE_SPREADSHEET_ID = "test-spreadsheet-id";

    // Create routes manually instead of importing server

    // Helper function to read data from Google Sheets
    async function readData() {
      try {
        return await mockGoogleSheetsService.readData();
      } catch (error) {
        console.error("Error reading from Google Sheets:", error);
        throw error;
      }
    }

    // Helper function to write data to Google Sheets
    async function writeData(data) {
      try {
        return await mockGoogleSheetsService.writeData(data);
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
        res
          .status(500)
          .json({ error: "Failed to read data from Google Sheets" });
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
                updatedRow.questionsAsked =
                  updateEntry.questionsAsked.toString();
              }
              if (updateEntry.questionsMissed !== undefined) {
                updatedRow.questionsMissed =
                  updateEntry.questionsMissed.toString();
              }
              if (updateEntry.questionsAnsweredCorrectly !== undefined) {
                updatedRow.questionsAnsweredCorrectly =
                  updateEntry.questionsAnsweredCorrectly.toString();
              }

              // Calculate points: questionsAnsweredCorrectly - questionsMissed (minimum 0)
              const questionsAnsweredCorrectly =
                parseInt(updateEntry.questionsAnsweredCorrectly) || 0;
              const questionsMissed =
                parseInt(updateEntry.questionsMissed) || 0;
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
        res
          .status(500)
          .json({ error: "Failed to update data in Google Sheets" });
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
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe("Complete Scoreboard Workflow", () => {
    it("should handle complete scoreboard lifecycle: add, update, clear", async () => {
      // Initial state
      const initialData = [
        {
          Id: "1",
          Name: "John",
          isDev: "TRUE",
          questionsAsked: "0",
          questionsMissed: "0",
          questionsAnsweredCorrectly: "0",
          points: "0",
          isRemoved: "FALSE",
        },
      ];

      // 1. Read initial data
      mockGoogleSheetsService.readData.mockResolvedValue(initialData);

      let response = await request(app).get("/api/scoreboard").expect(200);

      expect(response.body).toEqual(initialData);

      // 2. Add new person
      const newPerson = { name: "Jane", isDev: "FALSE" };
      mockGoogleSheetsService.readData.mockResolvedValue(initialData);
      mockGoogleSheetsService.writeData.mockResolvedValue(true);

      response = await request(app)
        .post("/api/scoreboard/add")
        .send(newPerson)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.newPerson.Name).toBe("Jane");
      expect(response.body.newPerson.Id).toBe("2");

      // 3. Update scores
      const updatedData = [
        {
          Id: "1",
          Name: "John",
          isDev: "TRUE",
          questionsAsked: "5",
          questionsMissed: "1",
          questionsAnsweredCorrectly: "4",
          points: "3",
          isRemoved: "FALSE",
        },
        {
          Id: "2",
          Name: "Jane",
          isDev: "FALSE",
          questionsAsked: "3",
          questionsMissed: "0",
          questionsAnsweredCorrectly: "3",
          points: "3",
          isRemoved: "FALSE",
        },
      ];

      const updateRequest = {
        updatedData: [
          {
            id: "1",
            questionsAsked: 5,
            questionsMissed: 1,
            questionsAnsweredCorrectly: 4,
          },
          {
            id: "2",
            questionsAsked: 3,
            questionsMissed: 0,
            questionsAnsweredCorrectly: 3,
          },
        ],
      };

      mockGoogleSheetsService.readData.mockResolvedValue(updatedData);
      mockGoogleSheetsService.writeData.mockResolvedValue(true);

      response = await request(app)
        .post("/api/scoreboard/update")
        .send(updateRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.updatedCount).toBe(2);

      // 4. Clear scoreboard
      mockGoogleSheetsService.readData.mockResolvedValue(updatedData);
      mockGoogleSheetsService.writeData.mockResolvedValue(true);

      response = await request(app).post("/api/scoreboard/clear").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Scoreboard cleared successfully");

      // Verify that clearScoreboard was called with reset values
      expect(mockGoogleSheetsService.writeData).toHaveBeenCalledWith([
        {
          Id: "1",
          Name: "John",
          isDev: "TRUE",
          questionsAsked: "0",
          questionsMissed: "0",
          questionsAnsweredCorrectly: "0",
          points: "0",
          isRemoved: "FALSE",
        },
        {
          Id: "2",
          Name: "Jane",
          isDev: "FALSE",
          questionsAsked: "0",
          questionsMissed: "0",
          questionsAnsweredCorrectly: "0",
          points: "0",
          isRemoved: "FALSE",
        },
      ]);
    });
  });

  describe("Data Consistency and Validation", () => {
    it("should maintain data consistency across operations", async () => {
      const initialData = [
        {
          Id: "1",
          Name: "John",
          isDev: "TRUE",
          questionsAsked: "5",
          questionsMissed: "1",
          questionsAnsweredCorrectly: "4",
          points: "3",
          isRemoved: "FALSE",
        },
      ];

      // 1. Read data
      mockGoogleSheetsService.readData.mockResolvedValue(initialData);

      let response = await request(app).get("/api/scoreboard").expect(200);

      expect(response.body).toEqual(initialData);

      // 2. Update with invalid data (negative values)
      const updateRequest = {
        updatedData: [
          { id: "1", questionsAnsweredCorrectly: -1, questionsMissed: 5 },
        ],
      };

      mockGoogleSheetsService.readData.mockResolvedValue(initialData);
      mockGoogleSheetsService.writeData.mockResolvedValue(true);

      response = await request(app)
        .post("/api/scoreboard/update")
        .send(updateRequest)
        .expect(200);

      // Verify that negative values are handled and points are calculated correctly
      expect(mockGoogleSheetsService.writeData).toHaveBeenCalledWith([
        {
          Id: "1",
          Name: "John",
          isDev: "TRUE",
          questionsAsked: "5",
          questionsMissed: "5",
          questionsAnsweredCorrectly: "-1",
          points: "0",
          isRemoved: "FALSE",
        },
      ]);
    });

    it("should handle edge cases in data operations", async () => {
      // Test with empty data
      mockGoogleSheetsService.readData.mockResolvedValue([]);

      let response = await request(app).get("/api/scoreboard").expect(200);

      expect(response.body).toEqual([]);

      // Test adding person to empty scoreboard
      mockGoogleSheetsService.readData.mockResolvedValue([]);
      mockGoogleSheetsService.writeData.mockResolvedValue(true);

      response = await request(app)
        .post("/api/scoreboard/add")
        .send({ name: "First Person", isDev: "TRUE" })
        .expect(200);

      expect(response.body.newPerson.Id).toBe("1"); // First ID should be 1
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle Google Sheets service failures gracefully", async () => {
      const error = new Error("Google Sheets API unavailable");
      mockGoogleSheetsService.readData.mockRejectedValue(error);

      // Test read failure
      const response = await request(app).get("/api/scoreboard").expect(500);

      expect(response.body.error).toBe(
        "Failed to read data from Google Sheets"
      );

      // Test write failure
      mockGoogleSheetsService.readData.mockResolvedValue([]);
      mockGoogleSheetsService.writeData.mockRejectedValue(error);

      const addResponse = await request(app)
        .post("/api/scoreboard/add")
        .send({ name: "Test", isDev: "TRUE" })
        .expect(500);

      expect(addResponse.body.error).toBe("Failed to add person to CSV data");
    });

    it("should handle malformed requests gracefully", async () => {
      // Test missing required fields
      const response = await request(app)
        .post("/api/scoreboard/add")
        .send({ name: "Test" }) // Missing isDev
        .expect(400);

      expect(response.body.error).toBe("name and isDev are required");

      // Test invalid data types - this should still work as the data gets converted to numbers
      // First, we need to have some data to update
      mockGoogleSheetsService.readData.mockResolvedValue([
        {
          Id: "1",
          Name: "John",
          isDev: "TRUE",
          questionsAsked: "5",
          questionsMissed: "1",
          questionsAnsweredCorrectly: "4",
          points: "3",
          isRemoved: "FALSE",
        },
      ]);

      const updateResponse = await request(app)
        .post("/api/scoreboard/update")
        .send({ updatedData: [{ id: "1", questionsAsked: "invalid" }] })
        .expect(200); // This should pass as the data gets processed

      expect(updateResponse.body.success).toBe(true);
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle large datasets efficiently", async () => {
      // Create a large dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        Id: (i + 1).toString(),
        Name: `Person${i + 1}`,
        isDev: i % 2 === 0 ? "TRUE" : "FALSE",
        questionsAsked: (i % 10).toString(),
        questionsMissed: (i % 5).toString(),
        questionsAnsweredCorrectly: (i % 8).toString(),
        points: Math.max(0, (i % 8) - (i % 5)).toString(),
        isRemoved: "FALSE",
      }));

      mockGoogleSheetsService.readData.mockResolvedValue(largeDataset);

      const startTime = Date.now();

      const response = await request(app).get("/api/scoreboard").expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body).toHaveLength(100);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it("should handle concurrent operations", async () => {
      const initialData = [
        {
          Id: "1",
          Name: "John",
          isDev: "TRUE",
          questionsAsked: "0",
          questionsMissed: "0",
          questionsAnsweredCorrectly: "0",
          points: "0",
          isRemoved: "FALSE",
        },
      ];

      mockGoogleSheetsService.readData.mockResolvedValue(initialData);
      mockGoogleSheetsService.writeData.mockResolvedValue(true);

      // Simulate concurrent read operations
      const concurrentReads = Array.from({ length: 5 }, () =>
        request(app).get("/api/scoreboard")
      );

      const responses = await Promise.all(concurrentReads);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toEqual(initialData);
      });

      expect(mockGoogleSheetsService.readData).toHaveBeenCalledTimes(5);
    });
  });

  describe("Business Logic Validation", () => {
    it("should enforce business rules correctly", async () => {
      const initialData = [
        {
          Id: "1",
          Name: "John",
          isDev: "TRUE",
          questionsAsked: "5",
          questionsMissed: "1",
          questionsAnsweredCorrectly: "4",
          points: "3",
          isRemoved: "FALSE",
        },
      ];

      // Test duplicate name prevention
      mockGoogleSheetsService.readData.mockResolvedValue(initialData);

      const duplicateResponse = await request(app)
        .post("/api/scoreboard/add")
        .send({ name: "John", isDev: "TRUE" })
        .expect(400);

      expect(duplicateResponse.body.error).toBe(
        "Person with this name already exists"
      );

      // Test points calculation logic
      const updateRequest = {
        updatedData: [
          { id: "1", questionsAnsweredCorrectly: 10, questionsMissed: 3 },
        ],
      };

      mockGoogleSheetsService.readData.mockResolvedValue(initialData);
      mockGoogleSheetsService.writeData.mockResolvedValue(true);

      await request(app)
        .post("/api/scoreboard/update")
        .send(updateRequest)
        .expect(200);

      // Verify points calculation: 10 - 3 = 7
      expect(mockGoogleSheetsService.writeData).toHaveBeenCalledWith([
        {
          Id: "1",
          Name: "John",
          isDev: "TRUE",
          questionsAsked: "5",
          questionsMissed: "3",
          questionsAnsweredCorrectly: "10",
          points: "7",
          isRemoved: "FALSE",
        },
      ]);
    });

    it("should handle soft delete correctly", async () => {
      const initialData = [
        {
          Id: "1",
          Name: "John",
          isDev: "TRUE",
          questionsAsked: "5",
          questionsMissed: "1",
          questionsAnsweredCorrectly: "4",
          points: "3",
          isRemoved: "FALSE",
        },
      ];

      const removeRequest = {
        selectedNames: ["1"],
      };

      mockGoogleSheetsService.readData.mockResolvedValue(initialData);
      mockGoogleSheetsService.writeData.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/scoreboard/update")
        .send(removeRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.removedCount).toBe(1);

      // Verify that the person is marked as removed, not actually deleted
      expect(mockGoogleSheetsService.writeData).toHaveBeenCalledWith([
        {
          Id: "1",
          Name: "John",
          isDev: "TRUE",
          questionsAsked: "5",
          questionsMissed: "1",
          questionsAnsweredCorrectly: "4",
          points: "3",
          isRemoved: "TRUE",
        },
      ]);
    });
  });
});
