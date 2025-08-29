#!/usr/bin/env node

/**
 * Test script for Google Sheets integration
 * Run this to verify your setup is working correctly
 */

require("dotenv").config();

async function testGoogleSheets() {
  console.log("🧪 Testing Google Sheets Integration...\n");

  // Check environment variables
  console.log("📋 Environment Variables:");
  console.log(
    `  GOOGLE_SPREADSHEET_ID: ${
      process.env.GOOGLE_SPREADSHEET_ID ? "✅ Set" : "❌ Missing"
    }`
  );
  console.log(
    `  GOOGLE_SERVICE_ACCOUNT_KEY: ${
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? "✅ Set" : "❌ Missing"
    }`
  );
  console.log(
    `  GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? "✅ Set" : "❌ Missing"}`
  );
  console.log(
    `  PASSPHRASE: ${process.env.PASSPHRASE ? "✅ Set" : "❌ Missing"}\n`
  );

  // Check if we have the required credentials
  if (!process.env.GOOGLE_SPREADSHEET_ID) {
    console.error("❌ GOOGLE_SPREADSHEET_ID is required");
    process.exit(1);
  }

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY && !process.env.GOOGLE_API_KEY) {
    console.error(
      "❌ Either GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_API_KEY is required"
    );
    process.exit(1);
  }

  try {
    // Test the Google Sheets service
    console.log("🔌 Testing Google Sheets Service...");
    const GoogleSheetsService = require("./googleSheetsService");
    const service = new GoogleSheetsService();
    console.log("✅ Service initialized successfully\n");

    // Test reading data
    console.log("📖 Testing data read...");
    const data = await service.readData();
    console.log(`✅ Successfully read ${data.length} rows from Google Sheets`);

    if (data.length > 0) {
      console.log("📊 Sample data structure:");
      console.log("  Headers:", Object.keys(data[0]));
      console.log("  First row:", data[0]);
    }
    console.log("");

    // Test write operations (only if using service account)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.log("✏️  Testing write operations...");

      // Test updating a row (if data exists)
      if (data.length > 0) {
        const firstRow = data[0];
        const originalPoints = firstRow.points;

        // Update points temporarily
        await service.updateRow(firstRow.Id, { points: "999" });
        console.log("✅ Row update test passed");

        // Restore original points
        await service.updateRow(firstRow.Id, { points: originalPoints });
        console.log("✅ Row restore test passed");
      }

      console.log("✅ Write operations working correctly\n");
    } else {
      console.log(
        "⚠️  Skipping write tests (API key only - read-only access)\n"
      );
    }

    console.log(
      "🎉 All tests passed! Your Google Sheets integration is working correctly."
    );
    console.log("\n📝 Next steps:");
    console.log("  1. Start your server: npm start");
    console.log("  2. Test the app functionality");
    console.log("  3. Your data will now persist in Google Sheets!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("\n🔍 Troubleshooting tips:");
    console.error("  1. Check your environment variables");
    console.error("  2. Verify the Google Sheets API is enabled");
    console.error(
      "  3. Ensure the service account has access to the spreadsheet"
    );
    console.error("  4. Check the spreadsheet ID and range");
    process.exit(1);
  }
}

// Run the test
testGoogleSheets().catch(console.error);
