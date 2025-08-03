# 🔐 Wallet Management & Token Selling Guide

## The Problem We Solved

**Before:** Buyer wallets were generated fresh each time, making it impossible to sell the tokens later!

**Now:** Buyer wallets are securely saved and can be reused to sell tokens after bundle execution.

## 🔑 How Wallet Persistence Works

### 1. Session-Based Wallet Storage

- Each bundle run gets a unique **Session ID** (timestamp-based)
- Buyer wallets are encrypted and saved to `/wallets/buyers-{sessionId}.json`
- You can access the same wallets later using the Session ID

### 2. Security Features

- **AES-256-GCM encryption**: Wallet private keys are never stored in plain text
- **Encryption password**: Set `WALLET_ENCRYPTION_KEY` in your `.env` file
- **Memory-only during execution**: Private keys are only decrypted when needed

### 3. Session Management

```bash
# List all available wallet sessions
npm run sell list

# Check token balances for a session
npm run sell check <sessionId> <tokenMintAddress>

# Sell all tokens from buyer wallets to main wallet
npm run sell sell <sessionId> <tokenMintAddress>

# Recover remaining SOL from buyer wallets
npm run sell recover <sessionId>
```

## 📋 Complete Workflow

### Step 0: Quick SOL Collection (Priority Action)

**MOST IMPORTANT**: Before starting new operations, collect all remaining SOL from previous sessions:

```bash
npx ts-node scripts/working-collection.ts
```

**What this does:**

- 🔍 **Automatically finds all wallet session files** in `/wallets/` directory
- 🔓 **Decrypts all encrypted wallets** using your `WALLET_ENCRYPTION_KEY`
- 💰 **Checks SOL balances** across all wallets in all sessions
- 💸 **Transfers SOL back to your main wallet** (leaves rent exemption: 0.000896 SOL)
- 📊 **Shows detailed collection summary**

**Example output:**

🎉 COLLECTION COMPLETE!
📊 Summary:
   • Sessions processed: 6
   • Successful sessions: 2
   • Total SOL collected: 0.070521 SOL
   • Net gain: 0.070521 SOL
✅ SUCCESS! Collected 0.070521 SOL from stuck wallets!

**Perfect for**: Emergency fund recovery, cleaning up after failed operations, preparing for new bundles.

### Step 1: Configure Encryption

```bash
# Edit .env file
WALLET_ENCRYPTION_KEY=your-super-secure-password-123
```

### Step 2: Run Bundle (Devnet Testing)

```bash
npm run devnet
```

**Output:**

🎯 Bundle Session ID: devnet-1738001567890
💼 Main Wallet: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHU
👥 Using 3 buyer wallets for devnet session: devnet-1738001567890
📝 Devnet Session ID: devnet-1738001567890
💡 To sell tokens: npm run sell sell devnet-1738001567890 9WzDXw...

### Step 3: Check Token Balances

```bash
npm run sell check devnet-1738001567890 9WzDXwGZqXhzjqxJv2KWJ7Pk2CqZ1vK9A7x8s4FHRqm
```

**Output:**

💎 Wallet 1: 1,000,000 tokens
💎 Wallet 2: 1,000,000 tokens  
💎 Wallet 3: 1,000,000 tokens
📊 Total tokens found: 3,000,000

### Step 4: Sell All Tokens

```bash
npm run sell sell devnet-1738001567890 9WzDXwGZqXhzjqxJv2KWJ7Pk2CqZ1vK9A7x8s4FHRqm
```

**Output:**

🔄 Transferring 1,000,000 tokens from wallet 1...
✅ Transfer successful: 5KJp9...abc123
🔄 Transferring 1,000,000 tokens from wallet 2...
✅ Transfer successful: 2Xyz8...def456
📊 SELLING COMPLETE:
Total tokens transferred: 3,000,000
All tokens now in main wallet: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHU

### Step 5: Recover Remaining SOL

```bash
npm run sell recover devnet-1738001567890
```

**Output:**

🔄 Recovering 0.001500 SOL from wallet 1...
🔄 Recovering 0.001500 SOL from wallet 2...
📊 SOL RECOVERY COMPLETE:
Total SOL recovered: 0.004500 SOL

## 🚨 Important Security Notes

### 1. Protect Your Encryption Key

- Never commit `WALLET_ENCRYPTION_KEY` to version control
- Use a strong, unique password (20+ characters)
- Store it securely (password manager recommended)

### 2. Backup Wallet Sessions

- The `/wallets/` folder contains your encrypted buyer wallets
- Back up this folder if you want to keep sessions long-term
- Without the encryption key, the files are useless

### 3. Clean Up After Selling

```bash
# After successfully selling all tokens and recovering SOL
rm wallets/buyers-devnet-1738001567890.json
```

## 🎯 Mainnet vs Devnet

### Devnet Testing

- Session IDs start with `devnet-`
- Uses fewer wallets (3 instead of 8)
- No Jito bundling (individual transactions)
- Explorer links include `?cluster=devnet`

### Mainnet Production

- Session IDs are just timestamps
- Uses full wallet count (8 by default)
- Full Jito bundling with MEV protection
- Standard explorer links

## 💡 Pro Tips

### 1. Session ID Naming

- Devnet: `devnet-1738001567890`
- Mainnet: `1738001567890`
- You can identify the network from the session ID

### 2. Explorer Links

All commands provide clickable explorer links:

- **Solscan**: `https://solscan.io/account/...`
- **Solana Explorer**: `https://explorer.solana.com/address/...`
- **Transaction**: `https://solscan.io/tx/...`

### 3. Error Recovery

If something goes wrong:

```bash
# Check all available sessions
npm run sell list

# Check if wallets still have tokens
npm run sell check <sessionId> <tokenMint>

# Try selling again
npm run sell sell <sessionId> <tokenMint>
```

## 🔧 Troubleshooting

### "Cannot decrypt wallets"

- Check `WALLET_ENCRYPTION_KEY` in `.env`
- Make sure you're using the same encryption key

### "No wallet sessions found"

- Run a bundle operation first: `npm run devnet` or `npm start`
- Check if `/wallets/` folder exists

### "No tokens found"

- Verify the token mint address
- Check if the bundle actually executed successfully
- Try different session ID from `npm run sell list`

---

## 📖 Next Steps

1. **Test on Devnet**: Run `npm run devnet` and practice the selling workflow
2. **Set Strong Encryption**: Update `WALLET_ENCRYPTION_KEY` in `.env`
3. **Mainnet Ready**: Switch to mainnet and run `npm start`
4. **Monitor & Sell**: Use the session ID to sell tokens when ready

## You now have complete control over your bundled tokens! 🎉
