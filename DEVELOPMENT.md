# 🛠️ BonkFun Bundler - Development Guide

This guide is for developers who want to understand, modify, or extend the BonkFun bundler codebase.

## 🏗️ Architecture Overview

┌─────────────────────────────────────────────────────────────┐
│                    BonkFun Bundler                         │
├─────────────────────────────────────────────────────────────┤
│  Entry Points:                                             │
│  ├── index.ts (main bundler)                               │
│  ├── main.ts (alternative entry)                           │
│  ├── gather.ts (wallet generation)                         │
│  ├── closeLut.ts (cleanup)                                 │
│  └── closeWsol.ts (cleanup)                                │
├─────────────────────────────────────────────────────────────┤
│  Core Modules:                                             │
│  ├── src/                                                  │
│  │   ├── LUT.ts (Address Lookup Tables)                    │
│  │   ├── token.ts (SPL Token Creation)                     │
│  │   ├── buy.ts (Buy Transaction Logic)                    │
│  │   └── distribute.ts (SOL Distribution)                  │
│  ├── executor/                                             │
│  │   └── liljit.ts (Jito Bundle Execution)                 │
│  ├── utils.ts (Utility Functions)                          │
│  └── constants.ts (Configuration)                          │
└─────────────────────────────────────────────────────────────┘

## 📁 File Structure Explained

### Entry Points

- **`index.ts`**: Main bundler entry point - complete automated process
- **`main.ts`**: Alternative entry with more granular control
- **`gather.ts`**: Wallet generation utility
- **`closeLut.ts`**: Lookup table cleanup utility
- **`closeWsol.ts`**: WSOL account cleanup utility

### Core Modules (`src/`)

#### `LUT.ts` - Address Lookup Tables

Handles creation and management of Solana Address Lookup Tables for transaction optimization.

**Key Functions:**

- `createLutInst()` - Creates LUT instruction
- `createExtendLut()` - Extends LUT with addresses
- `getLookupTableAccount()` - Retrieves LUT account
- `waitForLookupTableActive()` - Waits for LUT activation

#### `token.ts` - SPL Token Creation

Manages SPL token creation and metadata.

**Key Functions:**

- `createTokenTx()` - Creates token creation transaction
- `getTokenMetadata()` - Returns token metadata
- `validateTokenParams()` - Validates token parameters

#### `buy.ts` - Buy Transaction Logic

Creates buy transactions for multiple wallets.

**Key Functions:**

- `makeBuyTx()` - Creates buy transactions
- `createBuyTransaction()` - Creates individual buy transaction
- `validateBuyParams()` - Validates buy parameters

#### `distribute.ts` - SOL Distribution

Handles distribution of SOL to buyer wallets.

**Key Functions:**

- `distributeSol()` - Distributes SOL to wallets
- `checkWalletBalances()` - Checks wallet balances
- `validateDistributionParams()` - Validates distribution parameters

### Executor Module (`executor/`)

#### `liljit.ts` - Jito Bundle Execution

Handles interaction with Jito for MEV-protected bundle execution.

**Key Functions:**

- `sendBundleByLilJit()` - Sends bundle via Jito
- `createTipTransaction()` - Creates Jito tip transaction
- `validateBundle()` - Validates bundle before sending

### Utilities

#### `utils.ts` - Utility Functions

Common utility functions used throughout the codebase.

**Key Functions:**

- `saveLUTFile()` / `loadLUTFile()` - LUT persistence
- `saveTransactionLog()` - Transaction logging
- `formatNumber()` / `formatSOL()` - Number formatting
- `isValidSolanaAddress()` - Address validation

#### `constants.ts` - Configuration

Central configuration management with environment variable loading.

## 🔧 Development Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd solana-raydium-launchlab-bonkfun-bundler
npm install
```

### 2. Development Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with development settings
# Use devnet for testing:
RPC_ENDPOINT=https://api.devnet.solana.com
```

### 3. TypeScript Configuration

The project uses TypeScript with configuration in `tsconfig.json`:

- Target: ES2016
- Module: CommonJS
- Strict type checking enabled

### 4. Development Scripts

```bash
# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Type checking
npx tsc --noEmit
```

## 🧪 Testing and Debugging

### Local Testing

1. Use Solana devnet for testing
2. Get devnet SOL from faucet: `solana airdrop 10`
3. Test with small amounts first

### Debugging Tips

```bash
# Enable verbose logging
export DEBUG=*

# Check transaction status
solana confirm -v <signature>

# Monitor logs
tail -f data/*.log
```

### Common Development Issues

**TypeScript Errors:**

- Ensure all imports are correctly typed
- Check `@types/` packages are installed
- Use proper async/await syntax

**Solana Errors:**

- Verify RPC connection
- Check account permissions
- Ensure sufficient SOL for transactions

## 🚀 Extending the Bundler

### Adding New Features

1. **New Trading Strategies:**
   - Modify `src/buy.ts`
   - Add new transaction creation logic
   - Update bundle composition

2. **Additional Token Types:**
   - Extend `src/token.ts`
   - Add metadata handling
   - Implement different token standards

3. **Alternative Bundling Services:**
   - Create new executor in `executor/`
   - Implement bundling interface
   - Add configuration options

### Example: Adding Custom Buy Logic

```typescript
// In src/buy.ts
export const createCustomBuyTx = async (
  connection: Connection,
  customParams: CustomBuyParams
): Promise<VersionedTransaction> => {
  // Your custom buy logic here
  const instructions = [];
  
  // Add your instructions
  
  const transaction = new VersionedTransaction(messageV0);
  return transaction;
};
```

### Example: Adding New Executor

```typescript
// In executor/custom.ts
export const sendBundleByCustomService = async (
  transactions: VersionedTransaction[]
): Promise<string> => {
  // Custom bundling service integration
  return bundleId;
};
```

## 🔒 Security Considerations

### Private Key Handling

- Never log private keys
- Use environment variables only
- Implement key rotation for production

### Transaction Security

- Validate all inputs
- Use slippage protection
- Implement retry logic with limits

### Code Security

```typescript
// ✅ Good: Validate inputs
if (!isValidSolanaAddress(address)) {
  throw new Error("Invalid address");
}

// ❌ Bad: Direct usage without validation
const pubkey = new PublicKey(userInput);
```

## 🎯 Performance Optimization

### Transaction Optimization

- Use Address Lookup Tables
- Batch operations when possible
- Optimize instruction count

### Bundle Optimization

- Keep bundle size reasonable (< 5 transactions)
- Use appropriate compute limits
- Implement priority fees

### RPC Optimization

```typescript
// Use connection pooling
const connection = new Connection(RPC_ENDPOINT, {
  commitment: "confirmed",
  wsEndpoint: WS_ENDPOINT
});

// Batch RPC calls when possible
const results = await Promise.all([
  connection.getBalance(pubkey1),
  connection.getBalance(pubkey2)
]);
```

## 📚 Dependencies Explained

### Core Dependencies

- **@solana/web3.js**: Solana blockchain interaction
- **@solana/spl-token**: SPL token operations
- **jito-ts**: Jito bundling service
- **bs58**: Base58 encoding/decoding

### Development Dependencies

- **typescript**: TypeScript compilation
- **ts-node**: TypeScript execution
- **prettier**: Code formatting

### Utility Dependencies

- **dotenv**: Environment variable loading
- **pino**: Structured logging
- **axios**: HTTP requests

## 🔄 CI/CD and Deployment

### GitHub Actions Example

```yaml
name: Build and Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npx tsc --noEmit
```

### Production Deployment

1. Use environment-specific configurations
2. Implement proper logging
3. Set up monitoring and alerts
4. Use secure key management

## 🤝 Contributing

### Code Style

- Use TypeScript for type safety
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Use Prettier for formatting

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Add tests if applicable
4. Ensure TypeScript compilation
5. Update documentation
6. Submit pull request

### Commit Message Format

type(scope): description

feat(buy): add custom slippage logic
fix(lut): handle lookup table timeout
docs(readme): update installation steps

## 📖 Additional Resources

- [Solana Cookbook](https://solanacookbook.com/)
- [Jito Documentation](https://docs.jito.wtf/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Solana Program Library](https://spl.solana.com/)

## 🐛 Known Issues and Workarounds

### Issue: Bundle Timeout

**Problem**: Bundles failing due to network congestion
**Workaround**: Implement exponential backoff and retry logic

### Issue: LUT Not Active

**Problem**: Trying to use LUT before it's active
**Workaround**: Use `waitForLookupTableActive()` function

### Issue: High Gas Fees

**Problem**: Transactions failing due to insufficient gas
**Workaround**: Implement dynamic fee calculation

## 🔮 Future Roadmap

- [ ] Integration with multiple DEX protocols
- [ ] Advanced MEV protection strategies
- [ ] Real-time market data integration
- [ ] Web interface for easier operation
- [ ] Multi-chain support
- [ ] Advanced analytics and reporting
