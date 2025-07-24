#!/usr/bin/env node

console.log("🚀 BonkFun Bundler Setup Script");
console.log("================================");

const fs = require("fs");
const path = require("path");

// Check if .env exists
const envPath = path.join(process.cwd(), ".env");
const envExamplePath = path.join(process.cwd(), ".env.example");

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log("✅ Created .env file from .env.example");
    console.log("⚠️  Please edit .env file with your configuration before running the bundler");
  } else {
    console.log("❌ .env.example not found");
  }
} else {
  console.log("✅ .env file already exists");
}

// Create data directory
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("✅ Created data directory");
}

// Create backups directory
const backupsDir = path.join(process.cwd(), "backups");
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
  console.log("✅ Created backups directory");
}

console.log("\n📋 Setup completed! Next steps:");
console.log("1. Edit .env file with your private key and configuration");
console.log("2. Run 'npm install' to install dependencies");
console.log("3. Run 'npm run gather' to generate buyer wallets");
console.log("4. Run 'npm start' to execute the bundler");
console.log("\n💡 For more information, check the README.md file");
