# 💰 Devnet Bundle Selling Guide

## Overview

The devnet bundle selling functionality allows you to clean up after testing by selling all tokens back and recovering SOL to your main wallet. This is essential for:

- **Testing Cleanup**: Remove test tokens after bundle testing
- **SOL Recovery**: Get devnet SOL back for more testing
- **Workflow Validation**: Test the complete buy → sell cycle
- **Performance Analysis**: Measure selling efficiency

## 📋 Available Selling Scripts

### Core Selling Scripts

```bash
# Primary bundle selling script
npx ts-node tests/devnet-bundle-seller.ts

# Alternative token selling script  
npx ts-node tests/devnet-token-seller.ts
```

## 🎯 Bundle Selling Workflow

### 1. Automatic Token Discovery
The bundle seller automatically:
- Scans all buyer wallets from the last session
- Identifies tokens with non-zero balances
- Calculates total tokens available for selling
- Estimates potential SOL recovery

### 2. Batch Selling Process
```bash
# Run the bundle seller
npx ts-node tests/devnet-bundle-seller.ts
```

**Process:**
1. **Wallet Scanning**: Finds all buyer wallets with tokens
2. **Balance Check**: Verifies token and SOL balances
3. **Sell Transactions**: Creates sell transactions for each wallet
4. **SOL Recovery**: Transfers remaining SOL back to main wallet
5. **Cleanup**: Consolidates everything to main wallet

### 3. Expected Output
```
🔍 Scanning buyer wallets for tokens...
📊 Found 16 wallets with tokens:
   • Wallet 1: 45,678 DTT tokens (0.001 SOL)
   • Wallet 2: 45,678 DTT tokens (0.001 SOL)
   • [...]
   
💰 Total tokens to sell: 731,248 DTT
💸 Estimated SOL recovery: 0.015 SOL

📤 Executing sell transactions...
✅ Wallet 1: Sold 45,678 DTT → 0.0009 SOL
✅ Wallet 2: Sold 45,678 DTT → 0.0009 SOL
[...]

💰 Recovering remaining SOL...
✅ Transferred 0.001 SOL from Wallet 1
✅ Transferred 0.001 SOL from Wallet 2
[...]

🎉 Bundle selling completed!
📊 Final Results:
   • Tokens sold: 731,248 DTT
   • SOL recovered: 0.0144 SOL
   • Main wallet balance: 0.0956 SOL (+0.0144)
```

## ⚙️ Configuration

### Environment Variables
```env
# Ensure devnet mode
RPC_ENDPOINT=https://api.devnet.solana.com

# Selling configuration
SLIPPAGE_TOLERANCE=0.01      # 1% slippage for selling
TRANSACTION_TIMEOUT=30000    # 30 second timeout
MAX_RETRIES=3               # Retry failed transactions
```

### Wallet Management
The script uses the same encrypted wallet system:
```typescript
// Automatically loads buyer wallets from last session
const buyerWallets = await WalletManager.getBuyerWallets(16, sessionId);
```

## 🔍 Testing Scenarios

### Scenario 1: Complete Test Cycle
```bash
# 1. Create tokens and buy
npx ts-node tests/devnet-bundler-fixed.ts

# 2. Sell tokens and recover SOL  
npx ts-node tests/devnet-bundle-seller.ts
```

### Scenario 2: Partial Selling
```bash
# Sell only specific wallets or amounts
# (modify script parameters as needed)
npx ts-node tests/devnet-bundle-seller.ts
```

### Scenario 3: Multiple Token Cleanup
If you have multiple test tokens from different sessions:
```bash
# Run bundle seller multiple times
# Or modify script to handle multiple tokens
```

## 📊 Performance Metrics

### Typical Selling Performance
- **Transaction Speed**: ~1-2 seconds per wallet
- **Success Rate**: >95% with retries
- **SOL Recovery**: ~80-90% (after transaction fees)
- **Total Time**: ~30-60 seconds for 16 wallets

### Gas Costs (Devnet)
- **Sell Transaction**: ~0.000005 SOL per transaction
- **SOL Transfer**: ~0.000005 SOL per transfer
- **Total Fees**: ~0.00016 SOL for 16 wallets

## ⚠️ Important Considerations

### Devnet Specific
- **No Real Value**: Devnet tokens have no monetary value
- **Network Resets**: Tokens may disappear during devnet resets  
- **Rate Limits**: Devnet may have transaction rate limits
- **Different Liquidity**: Devnet pools behave differently than mainnet

### Error Handling
- **"No tokens found"**: Wallets may already be empty or session invalid
- **"Insufficient liquidity"**: Pool may not have enough SOL for all sells
- **"Transaction failed"**: Network issues or slippage too high
- **"Wallet not found"**: Session file may be corrupted or missing

### Best Practices
- **Run after testing**: Always clean up test tokens
- **Monitor results**: Check that SOL is properly recovered
- **Verify balances**: Ensure main wallet received expected SOL
- **Save logs**: Keep transaction logs for debugging
- **Test edge cases**: Try selling with various token amounts

## 🛠️ Troubleshooting

### Common Issues

#### Issue: "No buyer wallets found"
```bash
# Solution: Check session ID and wallet files
ls wallets/buyers-*.json
```

#### Issue: "Insufficient token balance"  
```bash
# Solution: Verify tokens exist in wallets
# Check if tokens were already sold or transferred
```

#### Issue: "Sell transaction failed"
```bash
# Solution: Check devnet connection and pool liquidity
# Try reducing selling amounts or increasing slippage
```

#### Issue: "SOL recovery incomplete"
```bash
# Solution: Run SOL recovery separately
npx ts-node scripts/working-collection.ts [session-id]
```

## 🚀 Advanced Usage

### Custom Selling Strategy
```typescript
// Modify devnet-bundle-seller.ts for custom logic:
// - Sell only profitable positions
// - Implement time-based selling  
// - Add price impact calculations
// - Batch transactions for efficiency
```

### Integration with Testing
```bash
# Automated test cycle
npm run test-devnet-cycle() {
  npx ts-node tests/devnet-bundler-fixed.ts &&
  sleep 10 &&
  npx ts-node tests/devnet-bundle-seller.ts
}
```

The devnet bundle selling system ensures you can test the complete token lifecycle safely and recover resources for continued testing!
