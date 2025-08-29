// Mock environment variables for testing
process.env.PORT = "3001";
process.env.PASSPHRASE = "test-passphrase";
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

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
