# 🔐 Wallet Access Methods

This document outlines all methods to access and manage your encrypted buyer wallets from bundle operations.

## 🎯 Quick Access Methods

### Method 1: List All Available Sessions

```bash
npm run sell list
```

This shows all wallet sessions with their IDs and wallet counts.

### Method 2: Access Specific Session Wallets

```bash
npm run access-wallets
```

This interactive tool lets you:

- 🔍 **Browse all wallet sessions**
- 👁️ **View wallet details** (addresses, balances)
- 💰 **Check SOL and token balances**
- 📋 **Export wallet information**

### Method 3: Direct Session Access

If you know your session ID:

```bash
# Check balances for a specific session
npm run sell check <sessionId> <tokenMintAddress>

# Example:
npm run sell check devnet-1738001567890 9WzDXwGZqXhzjqxJv2KWJ7Pk2CqZ1vK9A7x8s4FHRqm
```

### Method 4: Comprehensive Wallet Information

```bash
npx ts-node tests/access-bundle-wallets.ts
```

This script automatically finds all wallet session files and displays comprehensive information for each wallet, making it ideal for getting a complete overview of all your encrypted wallets.

### Method 5: Collect SOL from All Sessions

**MOST IMPORTANT**: Collect all remaining SOL from all wallet sessions back to your main wallet:

```bash
npx ts-node scripts/working-collection.ts
```

**What this does:**

- 🔍 **Automatically finds all wallet session files** in `/wallets/` directory
- 🔓 **Decrypts all encrypted wallets** using your `WALLET_ENCRYPTION_KEY`
- 💰 **Checks balances** on all wallets across all sessions
- 💸 **Transfers SOL back** to your main wallet (leaves rent exemption: 0.000896 SOL)
- 📊 **Shows detailed summary** with total collected amounts

**Example output:**

🎉 COLLECTION COMPLETE!
📊 Summary:
   • Sessions processed: 6
   • Successful sessions: 2
   • Total SOL collected: 0.070521 SOL
   • Net gain: 0.070521 SOL
✅ SUCCESS! Collected 0.070521 SOL from stuck wallets!

**Perfect for**: Recovering funds after bundle operations, cleaning up test sessions, or preparing for new operations.

## 🔐 Security Notes

### Encryption Requirements

All wallet access methods require:

- ✅ **WALLET_ENCRYPTION_KEY** set in your `.env` file
- ✅ **Valid wallet session files** in `/wallets/` directory
- ✅ **Proper file permissions** on wallet files

### Session File Locations

Wallet session files are stored as:

- **Mainnet**: `/wallets/buyers-{timestamp}.json`
- **Devnet**: `/wallets/buyers-devnet-{timestamp}.json`

### Backup Recommendations

- 📁 **Backup `/wallets/` folder** regularly
- 🔒 **Store encryption key securely** (password manager)
- 💾 **Keep session logs** for transaction history

## 🛠️ Troubleshooting

### "Cannot decrypt wallets"

```bash
# Check if encryption key is set
echo $WALLET_ENCRYPTION_KEY

# Verify wallet files exist
ls -la wallets/
```

### "No wallet sessions found"

```bash
# Check if wallets directory exists
ls -la wallets/

# Run a test bundle to create sessions
npm run devnet
```

### "Connection timeout"

```bash
# Check RPC endpoint
curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' $RPC_ENDPOINT
```

## 📊 Session Management

### View Session Details

```bash
# List all sessions with details
npm run sell list

# Output example:
# Session: devnet-1738001567890 (3 wallets)
# Session: 1738001567890 (8 wallets)
```

### Check Token Holdings

```bash
# Check specific token across all wallets in session
npm run sell check <sessionId> <tokenMint>

# Example output:
# 💎 Wallet 1: 1,000,000 tokens
# 💎 Wallet 2: 1,000,000 tokens
# 📊 Total: 2,000,000 tokens
```

### Recover SOL

```bash
# Recover SOL from specific session
npm run sell recover <sessionId>

# Or recover from ALL sessions (recommended)
npx ts-node scripts/working-collection.ts
```

---

## 🎯 Best Practices

1. **Always collect SOL first** using `scripts/working-collection.ts`
2. **Check balances** before selling tokens
3. **Keep encryption key secure** and backed up
4. **Test on devnet** before mainnet operations
5. **Monitor transaction confirmations** on explorer

## 📈 Next Steps

After accessing your wallets:

1. ✅ **Collect remaining SOL** (`scripts/working-collection.ts`)
2. 📊 **Check token balances** (`npm run sell check`)
3. 💸 **Sell tokens when ready** (`npm run sell sell`)
4. 🧹 **Clean up session files** (after successful operations)

---

**Remember**: Your buyer wallets contain valuable tokens and SOL. Always verify operations and keep your encryption key secure!
