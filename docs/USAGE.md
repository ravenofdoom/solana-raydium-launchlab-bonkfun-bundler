# 🚀 BonkFun Bundler - Complete Usage Guide

This guide will help you set up and use the BonkFun bundler for MEV-protected trading on Solana.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed
- **Solana CLI 1.17+** installed  
- A Solana wallet with sufficient SOL (minimum 5 SOL recommended)
- **Yarn or NPM** package manager

## ⚡ Quick Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-repo/solana-raydium-launchlab-bonkfun-bundler.git
cd solana-raydium-launchlab-bonkfun-bundler

# Install dependencies
npm install

# Run setup script
npm run setup
```

### 2. Configure Environment

Edit the `.env` file with your configuration:

```bash
# Required - Your wallet private key in base58 format
PRIVATE_KEY=your_wallet_private_key_base58_here

# Solana RPC (use a fast RPC for better performance)
RPC_ENDPOINT=https://api.mainnet-beta.solana.com

# Trading Configuration
DISTRIBUTE_WALLET_NUM=16
DISTRIBUTE_AMOUNTS=0.05

# Jito Configuration  
JITO_TIP_AMOUNT=0.01
```

### 3. Get Your Private Key

If you need to extract your private key from Solana CLI:

```bash
# Show your keypair path
solana config get

# Display your private key (keep this secure!)
solana-keygen pubkey ~/.config/solana/id.json --outfile /tmp/pubkey.txt
cat ~/.config/solana/id.json
```

Convert to base58 format using a tool or script.

## 🎯 Usage

### Method 1: Simple Bundler (Recommended)

```bash
# Run the complete bundler process
npm start
```

This will:

- Create a new token
- Generate buyer wallets
- Create bundled buy transactions
- Execute via Jito MEV protection

### Method 2: Step-by-step Process

```bash
# 1. Generate buyer wallets
npm run gather

# 2. Run main bundling logic
npm run main

# 3. Clean up (optional)
npm run closeLut
npm run closeWsol
```

## 📊 What Happens During Execution

1. **Wallet Setup**: Generates 16 buyer wallets
2. **SOL Distribution**: Distributes SOL to buyer wallets for gas
3. **Token Creation**: Creates a new SPL token
4. **LUT Creation**: Creates Address Lookup Table for efficiency
5. **Buy Transactions**: Creates buy transactions for all wallets
6. **Bundle Execution**: Sends all transactions as a Jito bundle
7. **MEV Protection**: Prevents front-running via Jito bundling

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PRIVATE_KEY` | Your wallet private key (base58) | Required |
| `RPC_ENDPOINT` | Solana RPC endpoint | mainnet |
| `DISTRIBUTE_WALLET_NUM` | Number of buyer wallets | 16 |
| `DISTRIBUTE_AMOUNTS` | SOL per wallet | 0.05 |
| `JITO_TIP_AMOUNT` | Jito tip in SOL | 0.01 |
| `TOKEN_NAME` | Token name | BonkFun Token |
| `TOKEN_SYMBOL` | Token symbol | BONK |
| `TOTAL_SUPPLY` | Token total supply | 1,000,000,000 |

### Advanced Configuration

For advanced users, you can modify:

- `src/token.ts` - Token creation parameters
- `src/buy.ts` - Buy transaction logic
- `executor/liljit.ts` - Jito bundling configuration

## 🚨 Important Security Notes

### Private Key Security

- **Never share your private key**
- **Never commit .env file to git**
- **Use a dedicated wallet for bundling**
- **Keep backups of important data**

### Recommended Wallet Setup

```bash
# Create a new wallet specifically for bundling
solana-keygen new -o ~/bundler-wallet.json

# Fund it with SOL
solana transfer <amount> <new-wallet-address>

# Use this wallet's private key in .env
```

## 💰 Cost Estimation

### Typical Costs (16 wallets)

- **SOL Distribution**: 0.8 SOL (0.05 × 16)
- **Transaction Fees**: ~0.01 SOL
- **Jito Tips**: 0.01 SOL
- **Total**: ~0.82 SOL

### Minimum Balance Required

- **Recommended**: 5 SOL
- **Minimum**: 1 SOL

## 🔍 Monitoring and Debugging

### Check Logs

```bash
# View bundler logs
tail -f data/*.log

# Check transaction logs
ls data/transactions-*.json
```

### Verify Bundle Execution

1. Check the console output for bundle UUID
2. Visit Jito Explorer: `https://explorer.jito.wtf/bundle/<bundle-uuid>`
3. Verify transactions on Solscan

### Common Issues

### "Insufficient balance"**

- Ensure your wallet has at least 5 SOL
- Check RPC connection

### "Bundle failed"**

- Network congestion - try again
- Increase Jito tip amount
- Reduce number of buyer wallets

### "Token creation failed"**

- Check if token parameters are valid
- Ensure sufficient SOL for mint creation

## 📈 Performance Optimization

### For Better Success Rates

1. **Use Premium RPC**: Helius, QuickNode, or GenesysGo
2. **Increase Jito Tips**: Higher tips = better inclusion
3. **Optimal Timing**: Avoid high-traffic periods
4. **Reduce Bundle Size**: Fewer transactions = higher success

### RPC Recommendations

```bash
# Free (slower)
RPC_ENDPOINT=https://api.mainnet-beta.solana.com

# Premium (faster)
RPC_ENDPOINT=https://rpc.helius.xyz/?api-key=YOUR_KEY
RPC_ENDPOINT=https://solana-mainnet.core.chainstack.com/YOUR_KEY
```

## 🛠️ Troubleshooting

### Reset Everything

```bash
# Clean data directory
rm -rf data/
rm -rf backups/

# Regenerate configuration
npm run setup
```

### Check Dependencies

```bash
# Verify Node.js version
node --version  # Should be 18+

# Check TypeScript compilation
npx tsc --noEmit

# Update dependencies
npm update
```

### Test Configuration

```bash
# Test wallet connection
npm run gather

# Verify RPC connection
curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' $RPC_ENDPOINT
```

## 📞 Support

- **Issues**: Check GitHub Issues
- **Telegram**: <https://t.me/frogansol>
- **Documentation**: README.md

## ⚖️ Legal Disclaimer

This software is provided for educational purposes. Users are responsible for:

- Compliance with local laws
- Understanding MEV and bundling risks  
- Proper security practices
- Testing on devnet first

## 🔗 Useful Links

- [Jito Documentation](https://docs.jito.wtf/)
- [Solana Documentation](https://docs.solana.com/)
- [Raydium Docs](https://docs.raydium.io/)
- [Bundle Explorer](https://explorer.jito.wtf/)
