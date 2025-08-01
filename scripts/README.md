# 🔧 Scripts Directory

This folder contains utility scripts for the BonkFun Bundler project.

## 📋 Available Scripts

### Setup & Configuration

- **`setup.js`** - Initial project setup and configuration
- **`security-audit.js`** - Security audit and vulnerability checks

### Development Tools

- **`get-devnet-sol.js`** - Automatically request devnet SOL for testing
- **`explain-wallets.js`** - Interactive explanation of the wallet system

### SOL Recovery & Management

- **`working-collection.ts`** - 🏆 **WORKING SOL COLLECTION SCRIPT** - Recovers SOL from all wallet sessions back to main wallet
  - **Usage**: `npx ts-node scripts/working-collection.ts`
  - **Features**:
    - Properly decrypts encrypted wallet files
    - Calculates correct rent exemption
    - Processes all session formats
    - Safe transfer with fee reserves
  - **Success**: Successfully recovered 0.030312 SOL from stuck wallets ✅

### BonkFun Integration

- **`bonkfun-bundle-buy.ts`** - BonkFun bundle buying script for existing tokens
  - **Usage**: `npx ts-node scripts/bonkfun-bundle-buy.ts`
  - **Features**:
    - Supports both letsbonk.fun and letsbonk.fun/tech modes
    - Bundle buying with multiple wallets
    - Real token integration
    - Session-based wallet management

## 🚀 Usage

All scripts can be run using npm scripts or directly:

```bash
# Initial setup
npm run setup

# Security audit
npm run security-audit

# Get devnet SOL
npm run get-devnet-sol

# Learn about wallets
npm run explain-wallets

# SOL Recovery (Manual - when needed)
npx ts-node scripts/working-collection.ts

# BonkFun Bundle Buy (Manual - for testing)
npx ts-node scripts/bonkfun-bundle-buy.ts
```

## 📁 Organization

Scripts are organized to keep the project root clean while maintaining easy access through npm commands. All script paths are properly configured in `package.json`.

## 🔐 SOL Recovery Process

The `working-collection.ts` script follows this process:

1. **Scans** all wallet session files in `/wallets/` directory
2. **Decrypts** encrypted wallet files using `WALLET_ENCRYPTION_KEY`
3. **Calculates** proper rent exemption for each wallet
4. **Transfers** maximum SOL while leaving minimum required for rent
5. **Reports** total recovery with transaction confirmations

**Example Output:**

```text
🎯 WORKING SOL COLLECTION - Proper Decryption
============================================================
💼 Main wallet: HZtxigpGYaafBbUF1cVJxUdRcjKmb2qrDqk8jjJYcz5M
💰 Initial balance: 0.065907 SOL

✅ SUCCESS! Collected 0.030312 SOL from stuck wallets!
📈 Main wallet: 0.065907 → 0.096219 SOL
```
