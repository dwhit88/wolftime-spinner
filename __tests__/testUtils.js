/**
 * Test utilities for the WolftimeSpinner application
 */

// Mock data generators
const generateMockPerson = (
  id,
  name,
  isDev = "TRUE",
  questionsAsked = "0",
  questionsMissed = "0",
  questionsAnsweredCorrectly = "0",
  isRemoved = "FALSE"
) => ({
  Id: id.toString(),
  Name: name,
  isDev,
  questionsAsked: questionsAsked.toString(),
  questionsMissed: questionsMissed.toString(),
  questionsAnsweredCorrectly: questionsAnsweredCorrectly.toString(),
  points: Math.max(
    0,
    parseInt(questionsAnsweredCorrectly) - parseInt(questionsMissed)
  ).toString(),
  isRemoved,
});

const generateMockDataset = (count = 10) => {
  return Array.from({ length: count }, (_, i) =>
    generateMockPerson(
      i + 1,
      `Person${i + 1}`,
      i % 2 === 0 ? "TRUE" : "FALSE",
      (i % 10).toString(),
      (i % 5).toString(),
      (i % 8).toString()
    )
  );
};

// Mock Google Sheets API responses
const generateMockSheetsResponse = (data) => ({
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
      ...data.map((row) => [
        row.Id,
        row.Name,
        row.isDev,
        row.questionsAsked,
        row.questionsMissed,
        row.questionsAnsweredCorrectly,
        row.points,
        row.isRemoved,
      ]),
    ],
  },
});

// Mock fetch responses
const createMockFetchResponse = (data, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

const createMockFetchError = (message = "Network error", status = 500) => {
  const error = new Error(message);
  error.status = status;
  return Promise.reject(error);
};

// Test data constants
const TEST_DATA = {
  singlePerson: generateMockPerson(1, "John", "TRUE", "5", "1", "4"),
  multiplePeople: [
    generateMockPerson(1, "John", "TRUE", "5", "1", "4"),
    generateMockPerson(2, "Jane", "FALSE", "3", "0", "3"),
    generateMockPerson(3, "Bob", "TRUE", "2", "1", "1"),
  ],
  emptyDataset: [],
  largeDataset: generateMockDataset(100),
};

// Validation helpers
const validatePersonData = (person) => {
  expect(person).toHaveProperty("Id");
  expect(person).toHaveProperty("Name");
  expect(person).toHaveProperty("isDev");
  expect(person).toHaveProperty("questionsAsked");
  expect(person).toHaveProperty("questionsMissed");
  expect(person).toHaveProperty("questionsAnsweredCorrectly");
  expect(person).toHaveProperty("points");
  expect(person).toHaveProperty("isRemoved");

  // Validate data types
  expect(typeof person.Id).toBe("string");
  expect(typeof person.Name).toBe("string");
  expect(typeof person.isDev).toBe("string");
  expect(typeof person.questionsAsked).toBe("string");
  expect(typeof person.questionsMissed).toBe("string");
  expect(typeof person.questionsAnsweredCorrectly).toBe("string");
  expect(typeof person.points).toBe("string");
  expect(typeof person.isRemoved).toBe("string");

  // Validate boolean values
  expect(["TRUE", "FALSE"]).toContain(person.isDev);
  expect(["TRUE", "FALSE"]).toContain(person.isRemoved);

  // Validate numeric values
  expect(parseInt(person.questionsAsked)).toBeGreaterThanOrEqual(0);
  expect(parseInt(person.questionsMissed)).toBeGreaterThanOrEqual(0);
  expect(parseInt(person.questionsAnsweredCorrectly)).toBeGreaterThanOrEqual(0);
  expect(parseInt(person.points)).toBeGreaterThanOrEqual(0);
};

const validateScoreboardResponse = (response) => {
  expect(response).toHaveProperty("success");
  expect(response.success).toBe(true);
  expect(response).toHaveProperty("message");
  expect(typeof response.message).toBe("string");
};

// Performance testing helpers
const measurePerformance = async (operation, maxTime = 1000) => {
  const startTime = Date.now();
  const result = await operation();
  const endTime = Date.now();
  const duration = endTime - startTime;

  expect(duration).toBeLessThan(maxTime);
  return { result, duration };
};

// Error testing helpers
const expectErrorResponse = (response, expectedStatus, expectedError) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty("error");
  if (expectedError) {
    expect(response.body.error).toBe(expectedError);
  }
};

const expectSuccessResponse = (response, expectedData = null) => {
  expect(response.status).toBe(200);
  if (expectedData) {
    expect(response.body).toEqual(expectedData);
  }
};

// Mock setup helpers
const setupMockGoogleSheets = (
  mockService,
  data = TEST_DATA.multiplePeople
) => {
  mockService.readData.mockResolvedValue(data);
  mockService.writeData.mockResolvedValue(true);
  mockService.appendRow.mockResolvedValue(true);
  mockService.updateRow.mockResolvedValue(true);
  mockService.deleteRow.mockResolvedValue(true);
  mockService.clearScoreboard.mockResolvedValue(true);
};

const setupMockFetch = (responses) => {
  if (Array.isArray(responses)) {
    responses.forEach((response, index) => {
      if (response.error) {
        fetch.mockRejectedValueOnce(new Error(response.error));
      } else {
        fetch.mockResolvedValueOnce(
          createMockFetchResponse(response.data, response.ok, response.status)
        );
      }
    });
  } else {
    // Single response
    if (responses.error) {
      fetch.mockRejectedValue(new Error(responses.error));
    } else {
      fetch.mockResolvedValue(
        createMockFetchResponse(responses.data, responses.ok, responses.status)
      );
    }
  }
};

// Test environment setup
const setupTestEnvironment = () => {
  // Reset all mocks
  jest.clearAllMocks();

  // Setup default environment variables
  process.env.PORT = "3001";
  process.env.PASSPHRASE = "test-passphrase";
  process.env.GOOGLE_SPREADSHEET_ID = "test-spreadsheet-id";
  process.env.GOOGLE_SHEET_RANGE = "Sheet1!A:H";

  // Mock console methods
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
};

const cleanupTestEnvironment = () => {
  jest.resetModules();

  // Clean up environment variables
  delete process.env.PORT;
  delete process.env.PASSPHRASE;
  delete process.env.GOOGLE_SPREADSHEET_ID;
  delete process.env.GOOGLE_SHEET_RANGE;
  delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  delete process.env.GOOGLE_API_KEY;
};

module.exports = {
  // Data generators
  generateMockPerson,
  generateMockDataset,
  generateMockSheetsResponse,

  // Mock responses
  createMockFetchResponse,
  createMockFetchError,

  // Test data
  TEST_DATA,

  // Validation helpers
  validatePersonData,
  validateScoreboardResponse,

  // Performance helpers
  measurePerformance,

  // Error testing helpers
  expectErrorResponse,
  expectSuccessResponse,

  // Mock setup helpers
  setupMockGoogleSheets,
  setupMockFetch,

  // Environment helpers
  setupTestEnvironment,
  cleanupTestEnvironment,
};
