# 🧪 Tests Directory

This directory contains all test files for the BonkFun Bundler project.

## 📋 Test Categories

### Core Bundle Testing

- **`test-real-bonkfun.ts`** - Main BonkFun integration tests
- **`test-mainnet-bundle.ts`** - Mainnet bundle operations testing
- **`test-bundle-launch.ts`** - Bundle launch functionality tests

### Devnet Testing

- **`devnet-bundler.ts`** - Devnet bundler implementation
- **`devnet-bundler-fixed.ts`** - Fixed version of devnet bundler
- **`test-devnet.ts`** - General devnet testing
- **`test-devnet-bundle-creation.ts`** - Devnet bundle creation tests

### Token Management

- **`devnet-bundle-seller.ts`** - Token selling from bundle wallets
- **`devnet-token-seller.ts`** - General token selling utilities

### SOL & Wallet Management

- **`collect-sol-from-wallets.ts`** - ⚠️ DEPRECATED - Use `scripts/working-collection.ts` instead
- **`quick-collect-sol.ts`** - Quick SOL collection utility
- **`quick-collect.ts`** - Fast collection methods
- **`access-bundle-wallets.ts`** - Wallet access utilities

### Utility Tests

- **`check-balance.ts`** - Balance checking utilities
- **`gather.ts`** - Wallet gathering operations
- **`closeWsol.ts`** - Wrapped SOL account closure
- **`closeLut.ts`** - Lookup table closure
- **`index.ts`** - Test entry point

## 🚀 Running Tests

### Main Test Scripts

```bash
# Main working tests (recommended)
npm run test-real           # Main real token test
npm run demo                # Show current functionality
npm run test:bundle         # BonkFun bundle testing

# Devnet tests
npm run devnet              # Devnet bundler testing
npm run test-devnet         # General devnet tests
```

### Manual Test Execution

```bash
# Direct test execution
npx ts-node tests/test-real-bonkfun.ts
npx ts-node tests/test-mainnet-bundle.ts
npx ts-node tests/devnet-bundler.ts
```

## ⚠️ Important Notes

### SOL Recovery

- **DO NOT USE** `tests/collect-sol-from-wallets.ts` - it's deprecated
- **USE INSTEAD** `scripts/working-collection.ts` - the working version
- The working script properly handles:
  - AES-256-GCM decryption
  - Rent exemption calculations
  - Safe SOL transfers

### Test Data

All test files may create session data in the `/wallets/` directory. Use the SOL recovery script to reclaim funds after testing.

## 📊 Test Status

### ✅ Working Tests

- `test-real-bonkfun.ts` - Bundle buying with existing tokens
- `devnet-bundler.ts` - Devnet bundle operations
- SOL recovery via `scripts/working-collection.ts`

### ⚠️ Known Issues

- BonkFun token creation blocked by program interface issues
- Some legacy test files may have compilation errors

### 🔧 Maintenance

Regular cleanup recommended:

1. Run SOL recovery after failed tests
2. Clean up old session files in `/wallets/`
3. Use the working collection script for fund recovery

## 📁 Organization

Tests are separated from core scripts to maintain a clean project structure. All test utilities and experiments are contained within this directory.
