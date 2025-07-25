# 🧪 Tests Directory

This folder contains all testing utilities and test scripts for the BonkFun Bundler project.

## 📋 Available Tests

### Core Tests

- **`devnet-bundler.ts`** - Complete devnet bundler test (main test runner)
- **`test-devnet.ts`** - Additional devnet-specific tests
- **`simple-test.js`** - Basic functionality tests
- **`minimal-test.js`** - Minimal bundler test

### Network & RPC Tests

- **`test-rpc.js`** - RPC endpoint connectivity and performance tests
- **`analyze-rpc.js`** - Detailed RPC analysis and benchmarking

### Utilities

- **`check-results.js`** - Test result verification and analysis

## 🚀 Usage

All tests can be run using npm scripts:

```bash
# Main devnet testing
npm run devnet              # Complete devnet bundler test (RECOMMENDED)
npm run test-devnet         # Additional devnet tests

# Network testing
npm run test-rpc            # Test RPC endpoints
npm run analyze-rpc         # Analyze RPC performance

# Simple tests
npm run test-simple         # Basic functionality test
npm run test-minimal        # Minimal test

# Result checking
npm run check-results       # Check test results
```

## 🎯 Recommended Testing Order

1. **RPC Testing**: `npm run test-rpc` - Verify your network connectivity
2. **Simple Test**: `npm run test-simple` - Basic functionality check
3. **Main Devnet Test**: `npm run devnet` - Complete bundler test
4. **Result Analysis**: `npm run check-results` - Verify outcomes

## 🧪 Testing Strategy

### 1. Devnet Testing (Primary)

- **Purpose**: Safe testing without real money or mainnet risks
- **Features**: All bundler functionality except Jito bundling
- **Command**: `npm run devnet`
- **Requirements**: Devnet SOL (automatic via faucet)

### 2. RPC Testing

- **Purpose**: Verify RPC endpoint connectivity and performance
- **Command**: `npm run test-rpc`
- **Tests**: Connection speed, reliability, API availability

### 3. Component Testing

- **Purpose**: Test individual components and utilities
- **Commands**: `npm run test-simple`, `npm run test-minimal`

## 📁 Organization

All test files are organized here to keep the project root clean while maintaining easy access through npm commands. Test paths are properly configured in `package.json`.
