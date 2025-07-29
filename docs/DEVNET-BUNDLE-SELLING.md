# Devnet Bundle Selling Guide

## Overview

This guide covers the bundle selling functionality for devnet testing. The system allows you to sell tokens in bulk from all buyer wallets created during bundle testing.

## Prerequisites

- Completed devnet bundle test with buyer wallets
- Session ID from the bundle test
- Token mint address from the created token

## Available Commands

### 1. List Available Sessions

```bash
npm run devnet-sell-bundle -- list
```

Lists all available wallet sessions that can be used for bundle selling.

### 2. Check Token Balances

```bash
npm run devnet-sell -- check <sessionId> <tokenMint>
```

**Example:**

```bash
npm run devnet-sell -- check devnet-1753797169325 tykBRbvaf9nx3ghZR3fVta568FaujXD1oo8X33HaCaE
```

This checks the token balances for all wallets in the specified session.

### 3. Bundle Sell Tokens

```bash
npm run devnet-sell-bundle -- sell <sessionId> <tokenMint>
```

**Example:**

```bash
npm run devnet-sell-bundle -- sell devnet-1753797169325 tykBRbvaf9nx3ghZR3fVta568FaujXD1oo8X33HaCaE
```

This executes bundle selling for all wallets with tokens in the session.

### 4. Gather Remaining SOL

```bash
npm run devnet-sell-bundle -- gather <sessionId>
```

**Example:**

```bash
npm run devnet-sell-bundle -- gather devnet-1753797169325
```

This gathers any remaining SOL from buyer wallets back to the main wallet.

## How It Works

### Bundle Selling Process

1. **Load Encrypted Wallets**: The system loads buyer wallets from the encrypted session file
2. **Check Token Balances**: Verifies which wallets have tokens to sell
3. **Execute Sell Transactions**: Creates and sends sell transactions for each wallet with tokens
4. **Transaction Confirmation**: Waits for transaction confirmation on devnet
5. **Results Summary**: Provides a summary of successful and failed transactions

### Security Features

- **Encrypted Wallet Storage**: All private keys are encrypted with AES-256-GCM
- **Session-based Management**: Wallets are organized by unique session IDs
- **Transaction Logging**: All transactions are logged with explorer links

## Configuration

The selling functionality uses these environment variables:

```env
# Wallet Security
WALLET_ENCRYPTION_KEY=your_encryption_key

# Devnet Configuration
RPC_ENDPOINT=https://api.devnet.solana.com

# Main Wallet
PRIVATE_KEY=your_main_wallet_private_key
```

## Example Workflow

### 1. Create Bundle Test

```bash
# Configure .env for 16 wallets
DEVNET_BUYER_WALLETS=16
DEVNET_SOL_PER_WALLET=0.01
DEVNET_BUY_AMOUNT=0.001

# Run bundle test
npm run devnet
```

### 2. Check Results

```bash
# List sessions
npm run devnet-sell-bundle -- list

# Check token balances
npm run devnet-sell -- check devnet-1753797169325 tykBRbvaf9nx3ghZR3fVta568FaujXD1oo8X33HaCaE
```

### 3. Execute Bundle Sell

```bash
# Sell all tokens
npm run devnet-sell-bundle -- sell devnet-1753797169325 tykBRbvaf9nx3ghZR3fVta568FaujXD1oo8X33HaCaE

# Gather remaining SOL
npm run devnet-sell-bundle -- gather devnet-1753797169325
```

## Transaction Tracking

All transactions include:

- **Explorer Links**: Direct links to Solana devnet explorer
- **Transaction Signatures**: Unique transaction IDs for verification
- **Status Reports**: Success/failure status for each wallet
- **JSON Logs**: Detailed results saved to `data/` folder

## Troubleshooting

### Common Issues

1. **"No wallets have tokens to sell"**
   - Check if the token mint address is correct
   - Verify the bundle test actually purchased tokens
   - Ensure token accounts were created properly

2. **"WALLET_ENCRYPTION_KEY required"**
   - Verify the encryption key is set in `.env`
   - Ensure the key matches the one used during wallet creation

3. **Transaction failures**
   - Check wallet SOL balances for transaction fees
   - Verify network connectivity to devnet
   - Review token account permissions

### Debug Mode

For debugging, check:

- Session files in `wallets/` directory
- Transaction logs in `data/` directory
- Explorer links for transaction details

## Integration with Mainnet

The same commands work for mainnet when:

1. Change `RPC_ENDPOINT` to mainnet
2. Use real BonkFun token addresses
3. Ensure sufficient SOL for mainnet fees

## Security Notes

- ⚠️ **Private Keys**: Never share your encryption key or private keys
- 🔒 **Testnet Only**: Use devnet for testing before mainnet deployment
- 📝 **Transaction Logs**: Review all transactions before mainnet use
- 🔄 **Backup**: Keep secure backups of wallet session files

## Related Documentation

- [Devnet Testing Guide](DEVNET-TESTING.md)
- [Wallet Management](WALLET-MANAGEMENT.md)
- [Security Guide](SECURITY.md)
