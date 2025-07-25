# 🧪 Complete Testing Guide for BonkFun Bundler

## ✅ Your Current Configuration

I can see you've correctly configured your `.env` for devnet testing:

- ✅ **RPC_ENDPOINT**: Set to devnet  
- ✅ **WALLET_ENCRYPTION_KEY**: Configured for wallet persistence
- ✅ **All API Keys**: Working endpoints detected

## 🎯 Step-by-Step Testing Process

### Step 1: Verify RPC Connectivity

```bash
npm run test-rpc
```

**Expected Output:**

- ✅ 5+ working endpoints
- Response times under 500ms
- No critical connection failures

**Current Status:** ✅ **PASSED** - 5 working endpoints, fastest 62ms

---

### Step 2: Check Wallet Configuration

```bash
npm run explain-wallets
```

**What this shows:**

- Your main wallet address and balance
- How buyer wallets work
- Cost breakdown for testing
- Explorer links for monitoring

**Expected:** Main wallet with sufficient devnet SOL (>0.1 SOL recommended)

---

### Step 3: Run Simple Functionality Test

```bash
npm run test-simple
```

**Purpose:** Quick sanity check of basic components
**Expected:** All basic functions working without errors

---

### Step 4: Main Devnet Bundle Test (The Big One!)

```bash
npm run devnet
```

**What happens:**

1. **Session Creation**: Gets unique session ID (e.g., `devnet-1738001567890`)
2. **Wallet Generation**: Creates 3 encrypted buyer wallets
3. **SOL Distribution**: Sends SOL to buyer wallets
4. **Token Creation**: Creates new test token
5. **Bundle Simulation**: Buyer wallets purchase tokens
6. **Session Saving**: Encrypts and saves wallets for later

**Expected Output:**

🎯 Bundle Session ID: devnet-1738001567890
💼 Main Wallet: [your-address]
👥 Using 3 buyer wallets for devnet session: devnet-1738001567890
📝 Session ID: devnet-1738001567890
💡 To sell tokens: npm run sell sell devnet-1738001567890 [token-address]
✅ Devnet bundler test completed successfully!

**⚠️ SAVE THE SESSION ID!** You'll need it to sell tokens later.

---

### Step 5: Verify Token Balances

```bash
npm run sell list
```

**Expected:** Shows your session(s)

```bash
npm run sell check [SESSION_ID] [TOKEN_MINT_ADDRESS]
```

**Replace with actual values from Step 4**
**Expected:** Shows token balances in buyer wallets

---

### Step 6: Sell All Tokens (Test Complete Flow)

```bash
npm run sell sell [SESSION_ID] [TOKEN_MINT_ADDRESS]
```

**What happens:**

- Transfers all tokens from buyer wallets to main wallet
- Shows transaction signatures
- Provides explorer links

**Expected:** All tokens successfully transferred to main wallet

---

### Step 7: Recover Remaining SOL

```bash
npm run sell recover [SESSION_ID]
```

**Purpose:** Get back the SOL from buyer wallets
**Expected:** SOL transferred back to main wallet

---

## 🔍 Troubleshooting Guide

### Problem: "Insufficient balance"

**Solution:**

```bash
npm run get-devnet-sol  # Get more devnet SOL
```

### Problem: "Cannot decrypt wallets"

**Check:** `WALLET_ENCRYPTION_KEY` in your `.env` file

### Problem: "No wallet sessions found"

**Solution:** Run `npm run devnet` first to create a session

### Problem: "RPC connection failed"

**Solution:** Run `npm run test-rpc` and use a different endpoint

---

## 🎉 Success Criteria

### ✅ Complete Success Checklist

- [ ] RPC test passes with 5+ endpoints
- [ ] Main wallet has sufficient devnet SOL
- [ ] Devnet bundler runs without errors
- [ ] Session ID is generated and displayed
- [ ] Buyer wallets receive tokens
- [ ] Token selling works correctly
- [ ] SOL recovery completes
- [ ] All explorer links work

### 📊 Performance Benchmarks

- **RPC Response**: < 500ms
- **Bundle Test**: < 2 minutes
- **Token Transfer**: < 30 seconds per wallet

---

## 🚀 Advanced Testing

### Test Different Scenarios

```bash
# Test with minimal wallets
npm run test-minimal

# Analyze RPC performance
npm run analyze-rpc

# Check specific test results
npm run check-results
```

---

## 🎯 Ready for Mainnet?

Once all devnet tests pass:

1. **Update .env for mainnet:**

```bash
   RPC_ENDPOINT=https://api.mainnet-beta.solana.com
   ```

2. **Verify mainnet balance:**
   - Need 5+ SOL for full mainnet bundling
   - Check `JITO_TIP_AMOUNT` and `DISTRIBUTE_AMOUNTS`

3. **Run mainnet bundler:**

   ```bash
   npm start
   ```

---

## 📝 Quick Command Reference

```bash
# Testing Commands
npm run test-rpc          # Test network connectivity
npm run explain-wallets   # Understand wallet system
npm run devnet           # Main devnet test
npm run test-simple      # Basic functionality

# Token Management
npm run sell list        # List wallet sessions
npm run sell check <session> <token>  # Check balances
npm run sell sell <session> <token>   # Sell tokens
npm run sell recover <session>        # Recover SOL

# Utilities
npm run get-devnet-sol   # Get devnet SOL
npm run security-audit   # Security check
```

**Start with: `npm run test-rpc` and work your way through the steps! 🚀**
