const { google } = require("googleapis");

// Mock the googleapis module
jest.mock("googleapis");

describe("GoogleSheetsService", () => {
  let GoogleSheetsService;
  let mockAuth;
  let mockSheets;
  let mockGoogleAuth;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Google Auth
    mockAuth = {
      getClient: jest.fn(),
    };

    mockGoogleAuth = jest.fn().mockImplementation(() => mockAuth);
    google.auth.GoogleAuth = mockGoogleAuth;

    // Mock Google Sheets API
    mockSheets = {
      spreadsheets: {
        values: {
          get: jest.fn(),
          update: jest.fn(),
          append: jest.fn(),
        },
      },
    };

    google.sheets = jest.fn().mockReturnValue(mockSheets);

    // Set up environment variables
    process.env.GOOGLE_SPREADSHEET_ID = "test-spreadsheet-id";
    process.env.GOOGLE_SHEET_RANGE = "Sheet1!A:H";
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({
      type: "service_account",
      project_id: "test-project",
      private_key_id: "test-key-id",
      private_key:
        "-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n",
      client_email: "test@test.iam.gserviceaccount.com",
      client_id: "test-client-id",
    });

    // Mock the googleapis module properly
    jest.doMock("googleapis", () => ({
      google: {
        auth: {
          GoogleAuth: mockGoogleAuth,
        },
        sheets: jest.fn().mockReturnValue(mockSheets),
      },
    }));

    // Import the service after mocking
    GoogleSheetsService = require("../googleSheetsService");
  });

  afterEach(() => {
    jest.resetModules();
    delete process.env.GOOGLE_SPREADSHEET_ID;
    delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    delete process.env.GOOGLE_API_KEY;
  });

  describe("Constructor", () => {
    it("should initialize with service account authentication", () => {
      const service = new GoogleSheetsService();

      expect(service.spreadsheetId).toBe("test-spreadsheet-id");
      expect(service.range).toBe("Sheet1!A:H");
      expect(service.auth).toBeDefined();
      expect(service.sheets).toBeDefined();

      expect(mockGoogleAuth).toHaveBeenCalledWith({
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
    });

    it("should initialize with API key authentication", () => {
      delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      process.env.GOOGLE_API_KEY = "test-api-key";

      const service = new GoogleSheetsService();

      expect(mockGoogleAuth).toHaveBeenCalledWith({
        key: "test-api-key",
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });
    });

    it("should throw error when no authentication method is provided", () => {
      delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      delete process.env.GOOGLE_API_KEY;

      expect(() => new GoogleSheetsService()).toThrow(
        "Either GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_API_KEY environment variable is required"
      );
    });

    it("should throw error when spreadsheet ID is missing", () => {
      delete process.env.GOOGLE_SPREADSHEET_ID;

      expect(() => new GoogleSheetsService()).toThrow(
        "GOOGLE_SPREADSHEET_ID environment variable is required"
      );
    });

    it("should handle authentication initialization errors", () => {
      const error = new Error("Auth initialization failed");
      mockGoogleAuth.mockImplementation(() => {
        throw error;
      });

      expect(() => new GoogleSheetsService()).toThrow(
        "Auth initialization failed"
      );
    });
  });

  describe("readData", () => {
    let service;

    beforeEach(() => {
      service = new GoogleSheetsService();
    });

    it("should read data successfully", async () => {
      const mockResponse = {
        data: {
          values: [
            [
              "Id",
              "Name",
              "isDev",
              "questionsAsked",
              "questionsMissed",
              "questionsAnsweredCorrectly",
              "points",
              "isRemoved",
            ],
            ["1", "John", "TRUE", "5", "1", "4", "3", "FALSE"],
            ["2", "Jane", "FALSE", "3", "0", "3", "3", "FALSE"],
          ],
        },
      };

      mockSheets.spreadsheets.values.get.mockResolvedValue(mockResponse);

      const result = await service.readData();

      expect(mockSheets.spreadsheets.values.get).toHaveBeenCalledWith({
        spreadsheetId: "test-spreadsheet-id",
        range: "Sheet1!A:H",
      });

      expect(result).toEqual([
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
      ]);
    });

    it("should handle empty response", async () => {
      const mockResponse = {
        data: {
          values: [],
        },
      };

      mockSheets.spreadsheets.values.get.mockResolvedValue(mockResponse);

      const result = await service.readData();

      expect(result).toEqual([]);
    });

    it("should handle missing values in response", async () => {
      const mockResponse = {
        data: {},
      };

      mockSheets.spreadsheets.values.get.mockResolvedValue(mockResponse);

      const result = await service.readData();

      expect(result).toEqual([]);
    });

    it("should handle rows with missing values", async () => {
      const mockResponse = {
        data: {
          values: [
            ["Id", "Name", "isDev", "questionsAsked"],
            ["1", "John", "TRUE", "5"],
            ["2", "Jane"], // Missing some values
          ],
        },
      };

      mockSheets.spreadsheets.values.get.mockResolvedValue(mockResponse);

      const result = await service.readData();

      expect(result).toEqual([
        { Id: "1", Name: "John", isDev: "TRUE", questionsAsked: "5" },
        { Id: "2", Name: "Jane", isDev: "", questionsAsked: "" },
      ]);
    });

    it("should handle API errors", async () => {
      const error = new Error("Google Sheets API error");
      mockSheets.spreadsheets.values.get.mockRejectedValue(error);

      await expect(service.readData()).rejects.toThrow(
        "Google Sheets API error"
      );
    });
  });

  describe("writeData", () => {
    let service;

    beforeEach(() => {
      service = new GoogleSheetsService();
    });

    it("should write data successfully", async () => {
      const testData = [
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

      mockSheets.spreadsheets.values.update.mockResolvedValue({});

      const result = await service.writeData(testData);

      expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: "test-spreadsheet-id",
        range: "Sheet1!A:H",
        valueInputOption: "RAW",
        resource: {
          values: [
            [
              "Id",
              "Name",
              "isDev",
              "questionsAsked",
              "questionsMissed",
              "questionsAnsweredCorrectly",
              "points",
              "isRemoved",
            ],
            ["1", "John", "TRUE", "5", "1", "4", "3", "FALSE"],
            ["2", "Jane", "FALSE", "3", "0", "3", "3", "FALSE"],
          ],
        },
      });

      expect(result).toBe(true);
    });

    it("should handle missing data fields", async () => {
      const testData = [
        { Id: "1", Name: "John" }, // Missing some fields
      ];

      mockSheets.spreadsheets.values.update.mockResolvedValue({});

      const result = await service.writeData(testData);

      expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: "test-spreadsheet-id",
        range: "Sheet1!A:H",
        valueInputOption: "RAW",
        resource: {
          values: [
            [
              "Id",
              "Name",
              "isDev",
              "questionsAsked",
              "questionsMissed",
              "questionsAnsweredCorrectly",
              "points",
              "isRemoved",
            ],
            ["1", "John", "", "", "", "", "", ""],
          ],
        },
      });

      expect(result).toBe(true);
    });

    it("should handle API errors", async () => {
      const testData = [{ Id: "1", Name: "John" }];
      const error = new Error("Google Sheets API error");
      mockSheets.spreadsheets.values.update.mockRejectedValue(error);

      await expect(service.writeData(testData)).rejects.toThrow(
        "Google Sheets API error"
      );
    });
  });

  describe("appendRow", () => {
    let service;

    beforeEach(() => {
      service = new GoogleSheetsService();
    });

    it("should append row successfully", async () => {
      const newRow = {
        Id: "3",
        Name: "Bob",
        isDev: "TRUE",
        questionsAsked: "0",
        questionsMissed: "0",
        questionsAnsweredCorrectly: "0",
        points: "0",
        isRemoved: "FALSE",
      };

      mockSheets.spreadsheets.values.append.mockResolvedValue({});

      const result = await service.appendRow(newRow);

      expect(mockSheets.spreadsheets.values.append).toHaveBeenCalledWith({
        spreadsheetId: "test-spreadsheet-id",
        range: "Sheet1!A:H",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: {
          values: [["3", "Bob", "TRUE", "0", "0", "0", "0", "FALSE"]],
        },
      });

      expect(result).toBe(true);
    });

    it("should handle missing row data", async () => {
      const newRow = { Name: "Bob" };

      mockSheets.spreadsheets.values.append.mockResolvedValue({});

      const result = await service.appendRow(newRow);

      expect(mockSheets.spreadsheets.values.append).toHaveBeenCalledWith({
        spreadsheetId: "test-spreadsheet-id",
        range: "Sheet1!A:H",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: {
          values: [["", "Bob", "", "", "", "", "", ""]],
        },
      });

      expect(result).toBe(true);
    });

    it("should handle API errors", async () => {
      const newRow = { Name: "Bob" };
      const error = new Error("Google Sheets API error");
      mockSheets.spreadsheets.values.append.mockRejectedValue(error);

      await expect(service.appendRow(newRow)).rejects.toThrow(
        "Google Sheets API error"
      );
    });
  });

  describe("updateRow", () => {
    let service;

    beforeEach(() => {
      service = new GoogleSheetsService();

      // Mock readData and writeData methods
      service.readData = jest.fn();
      service.writeData = jest.fn();
    });

    it("should update row successfully", async () => {
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

      service.readData.mockResolvedValue(mockData);
      service.writeData.mockResolvedValue(true);

      const updates = { questionsAsked: "6", points: "4" };
      const result = await service.updateRow("1", updates);

      expect(service.readData).toHaveBeenCalledTimes(1);
      expect(service.writeData).toHaveBeenCalledWith([
        {
          Id: "1",
          Name: "John",
          isDev: "TRUE",
          questionsAsked: "6",
          questionsMissed: "1",
          questionsAnsweredCorrectly: "4",
          points: "4",
          isRemoved: "FALSE",
        },
      ]);

      expect(result).toBe(true);
    });

    it("should throw error when row not found", async () => {
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

      service.readData.mockResolvedValue(mockData);

      const updates = { questionsAsked: "6" };

      await expect(service.updateRow("999", updates)).rejects.toThrow(
        "Row with ID 999 not found"
      );
    });

    it("should handle API errors", async () => {
      const error = new Error("Google Sheets API error");
      service.readData.mockRejectedValue(error);

      const updates = { questionsAsked: "6" };

      await expect(service.updateRow("1", updates)).rejects.toThrow(
        "Google Sheets API error"
      );
    });
  });

  describe("deleteRow", () => {
    let service;

    beforeEach(() => {
      service = new GoogleSheetsService();

      // Mock readData and writeData methods
      service.readData = jest.fn();
      service.writeData = jest.fn();
    });

    it("should mark row as removed successfully", async () => {
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

      service.readData.mockResolvedValue(mockData);
      service.writeData.mockResolvedValue(true);

      const result = await service.deleteRow("1");

      expect(service.readData).toHaveBeenCalledTimes(1);
      expect(service.writeData).toHaveBeenCalledWith([
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

      expect(result).toBe(true);
    });

    it("should throw error when row not found", async () => {
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

      service.readData.mockResolvedValue(mockData);

      await expect(service.deleteRow("999")).rejects.toThrow(
        "Row with ID 999 not found"
      );
    });

    it("should handle API errors", async () => {
      const error = new Error("Google Sheets API error");
      service.readData.mockRejectedValue(error);

      await expect(service.deleteRow("1")).rejects.toThrow(
        "Google Sheets API error"
      );
    });
  });

  describe("clearScoreboard", () => {
    let service;

    beforeEach(() => {
      service = new GoogleSheetsService();

      // Mock readData and writeData methods
      service.readData = jest.fn();
      service.writeData = jest.fn();
    });

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

      service.readData.mockResolvedValue(mockData);
      service.writeData.mockResolvedValue(true);

      const result = await service.clearScoreboard();

      expect(service.readData).toHaveBeenCalledTimes(1);
      expect(service.writeData).toHaveBeenCalledWith([
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

      expect(result).toBe(true);
    });

    it("should handle API errors", async () => {
      const error = new Error("Google Sheets API error");
      service.readData.mockRejectedValue(error);

      await expect(service.clearScoreboard()).rejects.toThrow(
        "Google Sheets API error"
      );
    });
  });
});
