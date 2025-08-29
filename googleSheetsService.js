const { google } = require("googleapis");
require("dotenv").config();

class GoogleSheetsService {
  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    this.range = process.env.GOOGLE_SHEET_RANGE || "Sheet1!A:H"; // A:H covers all our columns
    this.auth = null;
    this.sheets = null;

    if (!this.spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable is required");
    }

    this.initializeAuth();
  }

  initializeAuth() {
    try {
      // For service account authentication
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const serviceAccountKey = JSON.parse(
          process.env.GOOGLE_SERVICE_ACCOUNT_KEY
        );
        this.auth = new google.auth.GoogleAuth({
          credentials: serviceAccountKey,
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
      }
      // For API key authentication (read-only)
      else if (process.env.GOOGLE_API_KEY) {
        this.auth = new google.auth.GoogleAuth({
          key: process.env.GOOGLE_API_KEY,
          scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
        });
      } else {
        throw new Error(
          "Either GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_API_KEY environment variable is required"
        );
      }

      this.sheets = google.sheets({ version: "v4", auth: this.auth });
    } catch (error) {
      console.error("Error initializing Google Sheets authentication:", error);
      throw error;
    }
  }

  async readData() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.range,
      });

      const rows = response.data.values || [];

      if (rows.length === 0) {
        return [];
      }

      // First row contains headers
      const headers = rows[0];
      const data = [];

      // Convert rows to objects starting from second row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const obj = {};

        headers.forEach((header, index) => {
          obj[header] = row[index] || "";
        });

        data.push(obj);
      }

      return data;
    } catch (error) {
      console.error("Error reading from Google Sheets:", error);
      throw error;
    }
  }

  async writeData(data) {
    try {
      // Convert data back to rows format
      const headers = [
        "Id",
        "Name",
        "isDev",
        "questionsAsked",
        "questionsMissed",
        "questionsAnsweredCorrectly",
        "points",
        "isRemoved",
      ];

      const rows = [headers];

      data.forEach((item) => {
        const row = headers.map((header) => item[header] || "");
        rows.push(row);
      });

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: this.range,
        valueInputOption: "RAW",
        resource: {
          values: rows,
        },
      });

      return true;
    } catch (error) {
      console.error("Error writing to Google Sheets:", error);
      throw error;
    }
  }

  async appendRow(newRow) {
    try {
      const headers = [
        "Id",
        "Name",
        "isDev",
        "questionsAsked",
        "questionsMissed",
        "questionsAnsweredCorrectly",
        "points",
        "isRemoved",
      ];

      const row = headers.map((header) => newRow[header] || "");

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: this.range,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: {
          values: [row],
        },
      });

      return true;
    } catch (error) {
      console.error("Error appending row to Google Sheets:", error);
      throw error;
    }
  }

  async updateRow(rowId, updates) {
    try {
      // Read current data to find the row index
      const data = await this.readData();
      const rowIndex = data.findIndex((row) => row.Id === rowId);

      if (rowIndex === -1) {
        throw new Error(`Row with ID ${rowId} not found`);
      }

      // Update the data
      const updatedData = [...data];
      Object.keys(updates).forEach((key) => {
        updatedData[rowIndex][key] = updates[key];
      });

      // Write back the updated data
      await this.writeData(updatedData);

      return true;
    } catch (error) {
      console.error("Error updating row in Google Sheets:", error);
      throw error;
    }
  }

  async deleteRow(rowId) {
    try {
      // Read current data to find the row index
      const data = await this.readData();
      const rowIndex = data.findIndex((row) => row.Id === rowId);

      if (rowIndex === -1) {
        throw new Error(`Row with ID ${rowId} not found`);
      }

      // Mark as removed instead of actually deleting
      const updatedData = [...data];
      updatedData[rowIndex].isRemoved = "TRUE";

      // Write back the updated data
      await this.writeData(updatedData);

      return true;
    } catch (error) {
      console.error("Error deleting row in Google Sheets:", error);
      throw error;
    }
  }

  async clearScoreboard() {
    try {
      const data = await this.readData();

      // Reset all question values to 0 and recalculate points
      const updatedData = data.map((row) => ({
        ...row,
        questionsAsked: "0",
        questionsMissed: "0",
        questionsAnsweredCorrectly: "0",
        points: "0",
      }));

      await this.writeData(updatedData);

      return true;
    } catch (error) {
      console.error("Error clearing scoreboard in Google Sheets:", error);
      throw error;
    }
  }
}

module.exports = GoogleSheetsService;
