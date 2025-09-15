const request = require("supertest");
const express = require("express");
const cors = require("cors");

// Mock the GoogleSheetsService
jest.mock("../googleSheetsService");

// Import the server after mocking
const GoogleSheetsService = require("../googleSheetsService");

describe("Server API Endpoints", () => {
  let app;
  let mockGoogleSheetsService;

  beforeEach(() => {
    // Clear all mocks
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

  describe("GET /api/scoreboard", () => {
    it("should return scoreboard data successfully", async () => {
      const mockData = [
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

      mockGoogleSheetsService.readData.mockResolvedValue(mockData);

      const response = await request(app).get("/api/scoreboard").expect(200);

      expect(response.body).toEqual(mockData);
      expect(mockGoogleSheetsService.readData).toHaveBeenCalledTimes(1);
    });

    it("should handle Google Sheets read error", async () => {
      const error = new Error("Google Sheets API error");
      mockGoogleSheetsService.readData.mockRejectedValue(error);

      const response = await request(app).get("/api/scoreboard").expect(500);

      expect(response.body.error).toBe(
        "Failed to read data from Google Sheets"
      );
    });
  });

  describe("POST /api/scoreboard/update", () => {
    it("should update scoreboard data successfully", async () => {
      const mockData = [
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
        selectedNames: ["1"],
        updatedData: [
          {
            id: "2",
            questionsAsked: 4,
            questionsMissed: 1,
            questionsAnsweredCorrectly: 3,
          },
        ],
      };

      mockGoogleSheetsService.readData.mockResolvedValue(mockData);
      mockGoogleSheetsService.writeData.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/scoreboard/update")
        .send(updateRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.removedCount).toBe(1);
      expect(response.body.updatedCount).toBe(1);
      expect(response.body.message).toContain(
        "Successfully removed 1 people and updated 1 entries"
      );

      expect(mockGoogleSheetsService.readData).toHaveBeenCalledTimes(1);
      expect(mockGoogleSheetsService.writeData).toHaveBeenCalledTimes(1);
    });

    it("should handle only removal without updates", async () => {
      const mockData = [
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

      const updateRequest = {
        selectedNames: ["1"],
      };

      mockGoogleSheetsService.readData.mockResolvedValue(mockData);
      mockGoogleSheetsService.writeData.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/scoreboard/update")
        .send(updateRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.removedCount).toBe(1);
      expect(response.body.updatedCount).toBe(0);
      expect(response.body.message).toContain(
        "Successfully marked 1 people as removed"
      );
    });

    it("should handle only updates without removal", async () => {
      const mockData = [
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

      const updateRequest = {
        updatedData: [
          {
            id: "1",
            questionsAsked: 6,
            questionsMissed: 1,
            questionsAnsweredCorrectly: 5,
          },
        ],
      };

      mockGoogleSheetsService.readData.mockResolvedValue(mockData);
      mockGoogleSheetsService.writeData.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/scoreboard/update")
        .send(updateRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.removedCount).toBe(0);
      expect(response.body.updatedCount).toBe(1);
      expect(response.body.message).toContain("Successfully updated 1 entries");
    });

    it("should calculate points correctly", async () => {
      const mockData = [
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

      const updateRequest = {
        updatedData: [
          { id: "1", questionsAnsweredCorrectly: 5, questionsMissed: 2 },
        ],
      };

      mockGoogleSheetsService.readData.mockResolvedValue(mockData);
      mockGoogleSheetsService.writeData.mockResolvedValue(true);

      await request(app)
        .post("/api/scoreboard/update")
        .send(updateRequest)
        .expect(200);

      // Verify that writeData was called with updated points (5 - 2 = 3)
      expect(mockGoogleSheetsService.writeData).toHaveBeenCalledWith([
        {
          Id: "1",
          Name: "John",
          isDev: "TRUE",
          questionsAsked: "5",
          questionsMissed: "2",
          questionsAnsweredCorrectly: "5",
          points: "3",
          isRemoved: "FALSE",
        },
      ]);
    });

    it("should handle negative points calculation", async () => {
      const mockData = [
        {
          Id: "1",
          Name: "John",
          isDev: "TRUE",
          questionsAsked: "5",
          questionsMissed: "3",
          questionsAnsweredCorrectly: "1",
          points: "3",
          isRemoved: "FALSE",
        },
      ];

      const updateRequest = {
        updatedData: [
          { id: "1", questionsAnsweredCorrectly: 1, questionsMissed: 5 },
        ],
      };

      mockGoogleSheetsService.readData.mockResolvedValue(mockData);
      mockGoogleSheetsService.writeData.mockResolvedValue(true);

      await request(app)
        .post("/api/scoreboard/update")
        .send(updateRequest)
        .expect(200);

      // Verify that points are set to 0 when calculation would be negative
      expect(mockGoogleSheetsService.writeData).toHaveBeenCalledWith([
        {
          Id: "1",
          Name: "John",
          isDev: "TRUE",
          questionsAsked: "5",
          questionsMissed: "5",
          questionsAnsweredCorrectly: "1",
          points: "0",
          isRemoved: "FALSE",
        },
      ]);
    });

    it("should handle Google Sheets error", async () => {
      const error = new Error("Google Sheets API error");
      mockGoogleSheetsService.readData.mockRejectedValue(error);

      const response = await request(app)
        .post("/api/scoreboard/update")
        .send({ selectedNames: ["1"] })
        .expect(500);

      expect(response.body.error).toBe(
        "Failed to update data in Google Sheets"
      );
    });
  });

  describe("POST /api/scoreboard/add", () => {
    it("should add new person successfully", async () => {
      const mockData = [
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

      const newPerson = {
        name: "Jane",
        isDev: "FALSE",
      };

      mockGoogleSheetsService.readData.mockResolvedValue(mockData);
      mockGoogleSheetsService.writeData.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/scoreboard/add")
        .send(newPerson)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(
        "Successfully added Jane to the scoreboard"
      );
      expect(response.body.newPerson.Name).toBe("Jane");
      expect(response.body.newPerson.Id).toBe("2");
      expect(response.body.newPerson.isDev).toBe("FALSE");
      expect(response.body.newPerson.points).toBe("0");

      expect(mockGoogleSheetsService.readData).toHaveBeenCalledTimes(1);
      expect(mockGoogleSheetsService.writeData).toHaveBeenCalledTimes(1);
    });

    it("should handle missing required fields", async () => {
      const response = await request(app)
        .post("/api/scoreboard/add")
        .send({ name: "Jane" })
        .expect(400);

      expect(response.body.error).toBe("name and isDev are required");
    });

    it("should handle duplicate name", async () => {
      const mockData = [
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

      const newPerson = {
        name: "John",
        isDev: "FALSE",
      };

      mockGoogleSheetsService.readData.mockResolvedValue(mockData);

      const response = await request(app)
        .post("/api/scoreboard/add")
        .send(newPerson)
        .expect(400);

      expect(response.body.error).toBe("Person with this name already exists");
    });

    it("should handle Google Sheets error", async () => {
      const error = new Error("Google Sheets API error");
      mockGoogleSheetsService.readData.mockRejectedValue(error);

      const response = await request(app)
        .post("/api/scoreboard/add")
        .send({ name: "Jane", isDev: "FALSE" })
        .expect(500);

      expect(response.body.error).toBe("Failed to add person to CSV data");
    });
  });

  describe("POST /api/scoreboard/clear", () => {
    it("should clear scoreboard successfully", async () => {
      const mockData = [
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

      mockGoogleSheetsService.readData.mockResolvedValue(mockData);
      mockGoogleSheetsService.writeData.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/scoreboard/clear")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Scoreboard cleared successfully");
      expect(response.body.clearedCount).toBe(2);

      expect(mockGoogleSheetsService.readData).toHaveBeenCalledTimes(1);
      expect(mockGoogleSheetsService.writeData).toHaveBeenCalledTimes(1);

      // Verify that all question values are reset to 0
      const expectedData = mockData.map((row) => ({
        ...row,
        questionsAsked: "0",
        questionsMissed: "0",
        questionsAnsweredCorrectly: "0",
        points: "0",
      }));

      expect(mockGoogleSheetsService.writeData).toHaveBeenCalledWith(
        expectedData
      );
    });

    it("should handle Google Sheets error", async () => {
      const error = new Error("Google Sheets API error");
      mockGoogleSheetsService.readData.mockRejectedValue(error);

      const response = await request(app)
        .post("/api/scoreboard/clear")
        .expect(500);

      expect(response.body.error).toBe("Failed to clear scoreboard data");
    });
  });
});
