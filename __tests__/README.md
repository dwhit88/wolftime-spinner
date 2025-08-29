# Testing Guide for WolftimeSpinner

This directory contains comprehensive unit tests and integration tests for the WolftimeSpinner application.

## Test Structure

```
__tests__/
├── README.md                 # This file
├── testUtils.js             # Test utilities and helper functions
├── server.test.js           # Server API endpoint tests
├── googleSheetsService.test.js # GoogleSheetsService class tests
├── spinningWheel.test.js    # Frontend SpinningWheel class tests
└── integration.test.js      # End-to-end integration tests
```

## Test Categories

### 1. Unit Tests

#### Server Tests (`server.test.js`)

- **Passphrase Verification**: Tests the `/api/verify-passphrase` endpoint
- **Scoreboard Operations**: Tests all CRUD operations for the scoreboard
- **Data Validation**: Tests input validation and error handling
- **Business Logic**: Tests points calculation and data processing

#### GoogleSheetsService Tests (`googleSheetsService.test.js`)

- **Authentication**: Tests service account and API key authentication
- **Data Operations**: Tests read, write, append, update, and delete operations
- **Error Handling**: Tests API failures and edge cases
- **Data Transformation**: Tests data format conversion between objects and rows

#### Frontend Tests (`spinningWheel.test.js`)

- **Class Initialization**: Tests constructor and property setup
- **Session Management**: Tests login/logout and session persistence
- **Data Loading**: Tests API integration and data filtering
- **UI Interactions**: Tests wheel spinning, scoreboard display, and modal management
- **Business Logic**: Tests name filtering and weighted random selection

### 2. Integration Tests (`integration.test.js`)

- **Complete Workflows**: Tests end-to-end scoreboard lifecycle
- **Data Consistency**: Tests data integrity across operations
- **Performance**: Tests response times and scalability
- **Error Recovery**: Tests system behavior under failure conditions

### 3. Test Utilities (`testUtils.js`)

- **Mock Data Generators**: Creates realistic test data
- **Validation Helpers**: Common assertion patterns
- **Performance Testing**: Response time measurement
- **Environment Setup**: Test environment configuration

## Running Tests

### Prerequisites

Make sure you have all dependencies installed:

```bash
npm install
```

### Available Test Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- server.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="should handle API errors"
```

### Test Output

- **Passing Tests**: Green checkmarks ✓
- **Failing Tests**: Red X marks with detailed error information
- **Coverage Report**: Shows percentage of code covered by tests

## Test Configuration

### Jest Configuration (`jest.config.js`)

- **Test Environment**: Node.js (for backend tests)
- **Coverage**: HTML, text, and LCOV reports
- **Timeout**: 10 seconds per test
- **File Patterns**: Tests in `__tests__/` directory or files ending in `.test.js`

### Environment Setup (`jest.setup.js`)

- **Mock Environment Variables**: Test configuration values
- **Console Mocking**: Reduces noise in test output
- **Global Setup**: Common test environment configuration

## Writing New Tests

### Test Structure

```javascript
describe("Feature Name", () => {
  let testInstance;

  beforeEach(() => {
    // Setup test environment
    testInstance = new TestClass();
  });

  afterEach(() => {
    // Cleanup after each test
    jest.clearAllMocks();
  });

  it("should do something specific", () => {
    // Arrange
    const input = "test data";

    // Act
    const result = testInstance.method(input);

    // Assert
    expect(result).toBe("expected output");
  });
});
```

### Best Practices

1. **Descriptive Test Names**: Use "should" statements that describe expected behavior
2. **Arrange-Act-Assert**: Structure tests in three clear sections
3. **Mock External Dependencies**: Don't rely on real APIs or databases
4. **Test Edge Cases**: Include error conditions and boundary values
5. **Isolated Tests**: Each test should be independent and not affect others

### Using Test Utilities

```javascript
const {
  TEST_DATA,
  generateMockPerson,
  validatePersonData,
} = require("./testUtils");

it("should validate person data structure", () => {
  const person = generateMockPerson(1, "John", "TRUE");
  validatePersonData(person);
});
```

## Mocking Strategy

### Google Sheets API

- **Service Mocking**: Mock the entire GoogleSheetsService class
- **Method Mocking**: Mock individual methods like `readData`, `writeData`
- **Response Mocking**: Mock API responses with realistic data

### Frontend Dependencies

- **DOM Mocking**: Use JSDOM for browser environment simulation
- **Fetch Mocking**: Mock HTTP requests and responses
- **LocalStorage Mocking**: Mock browser storage for session management

### Environment Variables

- **Test Configuration**: Use test-specific environment values
- **Isolation**: Each test gets a clean environment
- **Cleanup**: Proper cleanup after each test

## Coverage Goals

### Target Coverage

- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

### Coverage Report

After running `npm run test:coverage`, view the HTML report in `coverage/lcov-report/index.html` for detailed coverage information.

## Debugging Tests

### Common Issues

1. **Mock Not Working**: Ensure mocks are set up before importing modules
2. **Async Test Failures**: Use proper async/await or done() callback
3. **Environment Issues**: Check that test environment is properly configured
4. **Timing Issues**: Increase test timeout or use proper async handling

### Debug Commands

```bash
# Run single test with verbose output
npm test -- --verbose --testNamePattern="specific test name"

# Run tests with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Run tests with console output
npm test -- --verbose --silent=false
```

## Continuous Integration

### GitHub Actions

Tests can be integrated into CI/CD pipelines:

```yaml
- name: Run Tests
  run: npm test

- name: Generate Coverage Report
  run: npm run test:coverage
```

### Pre-commit Hooks

Consider adding test execution to pre-commit hooks to ensure code quality:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test"
    }
  }
}
```

## Contributing

When adding new features or fixing bugs:

1. **Write Tests First**: Follow TDD principles when possible
2. **Update Test Coverage**: Ensure new code is properly tested
3. **Maintain Test Quality**: Keep tests readable and maintainable
4. **Document Changes**: Update this README when adding new test categories

## Support

For questions about testing:

1. Check the Jest documentation: https://jestjs.io/
2. Review existing test patterns in this codebase
3. Consult the test utilities for common patterns
4. Ensure all tests pass before submitting changes
