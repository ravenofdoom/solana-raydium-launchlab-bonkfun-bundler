# 📦 Source Directory

This directory contains the core source code for the BonkFun Bundler project.

## 📋 Core Components

### Wallet Management

- **`wallet-manager.ts`** - 🔐 **Core wallet management system**
  - AES-256-GCM encryption for wallet storage
  - Session-based wallet persistence
  - Secure private key handling
  - **Working encryption/decryption used by collection script**

- **`secureWallet.ts`** - Secure wallet utilities and helpers

### Token Operations

- **`token.ts`** - SPL token creation and management
- **`token-seller.ts`** - Token selling utilities from bundle wallets
- **`buy.ts`** - Token buying operations and Raydium integration

### Bundle & Distribution

- **`bundle-launcher.ts`** - 🚀 **Main bundle launcher class**
  - Complete bundle launch workflow
  - Wallet funding and management
  - Token creation integration
  - **Core functionality for BonkFun integration**

- **`distribute.ts`** - SOL distribution to multiple wallets

### External Service Integration

- **`bonkfun-service.ts`** - 🎯 **BonkFun platform integration**
  - Real BonkFun token buying (✅ Working)
  - Token creation interface (⚠️ Program interface issues)
  - Supports both letsbonk.fun and letsbonk.fun/tech modes
  - **Successfully tested with real tokens**

### Infrastructure

- **`rpcManager.ts`** - RPC connection management and failover
- **`LUT.ts`** - Lookup Table (LUT) management for transaction optimization

## 🏗️ Architecture

### Core Flow

```text
BundleLauncher → WalletManager → BonkFunService
     ↓               ↓              ↓
Token Creation  → Wallet Funding → Bundle Buying
     ↓               ↓              ↓
Distribution    → Encryption     → Real Trading
```

### Key Features

1. **Secure Wallet Management**
   - All private keys encrypted at rest
   - Session-based wallet organization
   - Automatic cleanup and recovery

2. **BonkFun Integration**
   - Direct integration with letsbonk.fun platform
   - Support for both classic and tech modes
   - Real token buying with bundle coordination

3. **Transaction Bundling**
   - Multiple wallet coordination
   - Jito MEV protection (when enabled)
   - Optimized transaction batching

## 🔧 Usage in Scripts

### Working Collection Script

```typescript
// Used by scripts/working-collection.ts
import { WalletManager } from '../src/wallet-manager';

// Loads encrypted wallets
const wallets = await WalletManager.getBuyerWallets(0, sessionId);
```

### BonkFun Bundle Buying

```typescript
// Used by scripts/bonkfun-bundle-buy.ts
import { BonkFunService } from '../src/bonkfun-service';
import { WalletManager } from '../src/wallet-manager';

const bonkFun = new BonkFunService(connection, mode);
await bonkFun.buyTokenWithWallets(params);
```

### Bundle Launching

```typescript
// Used by main test files
import { BundleLauncher } from '../src/bundle-launcher';

const launcher = new BundleLauncher(connection);
await launcher.launch(params);
```

## 📊 Component Status

### ✅ Working Components

- `wallet-manager.ts` - Encryption/decryption working perfectly
- `bonkfun-service.ts` - Buy functionality tested and working
- `bundle-launcher.ts` - Core bundle operations functional
- `rpcManager.ts` - RPC management stable

### ⚠️ Known Issues

- `bonkfun-service.ts` - Token creation blocked by program interface
- Some components may need updates for latest Solana changes

### 🔒 Security Features

- All private keys encrypted with AES-256-GCM
- Scrypt key derivation for password security
- Session isolation for wallet management
- Automatic cleanup of sensitive data

## 📖 Dependencies

Core dependencies used across components:

- `@solana/web3.js` - Solana blockchain interaction
- `@solana/spl-token` - SPL token operations
- `bs58` - Base58 encoding for Solana keys
- `crypto` - Node.js cryptography for wallet encryption

## 🚀 Getting Started

1. **Wallet Management**: Start with `WalletManager` for secure wallet handling
2. **BonkFun Integration**: Use `BonkFunService` for platform interaction
3. **Bundle Operations**: Implement `BundleLauncher` for complete workflows
4. **Recovery**: Always use `scripts/working-collection.ts` for SOL recovery
