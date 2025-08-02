# 🔑 Wallet Information Access Guide

## Overview

The bundler creates encrypted wallet files for security. Here's how to access wallet information when needed.

## 📁 Wallet File Location

Encrypted wallet files are stored in:

./wallets/buyers-[SESSION_ID].json

Example:

./wallets/buyers-BONK_1754048277095.json

## 🔓 Accessing Wallet Private Keys

### Method 1: Using the WalletManager (Recommended)

```typescript
import { WalletManager } from './src/wallet-manager';

// Load wallets from a specific session
const sessionId = "BONK_1754048277095";
const wallets = await WalletManager.getBuyerWallets(3, sessionId);

// Access each wallet
wallets.forEach((wallet, index) => {
  console.log(`Wallet ${index + 1}:`);
  console.log(`  Public Key: ${wallet.publicKey.toString()}`);
  console.log(`  Private Key (Base58): ${bs58.encode(wallet.secretKey)}`);
  console.log(`  Private Key (Array): [${Array.from(wallet.secretKey).join(',')}]`);
});
```

### Method 2: Manual Decryption Script

```typescript
import * as crypto from 'crypto';
import * as fs from 'fs';
import bs58 from 'bs58';

function decrypt(encryptedText: string, key: string): string {
  const algorithm = 'aes-256-gcm';
  const keyBuffer = crypto.scryptSync(key, 'salt', 32);
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Load and decrypt wallet file
const encryptedData = fs.readFileSync('./wallets/buyers-SESSION_ID.json', 'utf8');
const decryptedData = decrypt(encryptedData, process.env.WALLET_ENCRYPTION_KEY!);
const walletData = JSON.parse(decryptedData);

console.log('Wallet Information:');
walletData.privateKeys.forEach((pk: string, index: number) => {
  const keypair = Keypair.fromSecretKey(bs58.decode(pk));
  console.log(`Wallet ${index + 1}:`);
  console.log(`  Public Key: ${keypair.publicKey.toString()}`);
  console.log(`  Private Key: ${pk}`);
});
```

### Method 3: Quick Access Script

Create `scripts/show-wallet-info.ts`:

```typescript
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletManager } from '../src/wallet-manager';
import bs58 from 'bs58';
import * as dotenv from 'dotenv';

dotenv.config();

async function showWalletInfo() {
  const sessionId = process.argv[2];
  if (!sessionId) {
    console.log('Usage: npx ts-node scripts/show-wallet-info.ts <SESSION_ID>');
    return;
  }

  const connection = new Connection(process.env.HELIUS_RPC_URL!);
  
  try {
    const wallets = await WalletManager.getBuyerWallets(10, sessionId); // Try up to 10 wallets
    
    console.log(`\\n🔑 Wallet Information for Session: ${sessionId}`);
    console.log('='.repeat(80));
    
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const balance = await connection.getBalance(wallet.publicKey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;
      
      console.log(`\\n💼 Wallet ${i + 1}:`);
      console.log(`   Public Key:  ${wallet.publicKey.toString()}`);
      console.log(`   Private Key: ${bs58.encode(wallet.secretKey)}`);
      console.log(`   Balance:     ${balanceSOL.toFixed(6)} SOL`);
      console.log(`   Explorer:    https://solscan.io/account/${wallet.publicKey.toString()}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to load wallet information:', error);
  }
}

showWalletInfo();
```

Usage:

```bash
npx ts-node scripts/show-wallet-info.ts BONK_1754048277095
```

### Method 4: Show All Sessions Script

Show wallet details for ALL sessions at once with `scripts/show-all-wallets.ts`:

```bash
npx ts-node scripts/show-all-wallets.ts
```

**Perfect for**: Viewing all wallets across all sessions with complete details including:

- Public keys and private keys (Base58 format)
- Current SOL balances
- Explorer links for each wallet
- Private key arrays (useful for some applications)
- Session totals and status indicators

This script automatically finds all wallet session files and displays comprehensive information for each wallet, making it ideal for getting a complete overview of all your encrypted wallets.

### Method 5: Collect SOL from All Sessions

**MOST IMPORTANT**: Collect all remaining SOL from all wallet sessions back to your main wallet:

```bash
npx ts-node scripts/working-collection.ts
```

**What this does:**
- 🔍 **Scans all wallet session files** in the `wallets/` directory
- 🔓 **Decrypts all encrypted wallets** using your `WALLET_ENCRYPTION_KEY`
- 💰 **Checks balances** on all wallets across all sessions
- 💸 **Transfers SOL back** to your main wallet (leaves rent exemption: 0.000896 SOL)
- 📊 **Shows detailed summary** with total collected amounts

**Example output:**
```
🎉 COLLECTION COMPLETE!
📊 Summary:
   • Sessions processed: 6
   • Successful sessions: 2
   • Total SOL collected: 0.070521 SOL
   • Net gain: 0.070521 SOL
✅ SUCCESS! Collected 0.070521 SOL from stuck wallets!
```

**Perfect for**: Recovering funds after bundle operations, cleaning up test sessions, or preparing for new operations.

## 🔐 Security Notes

- **Private keys are encrypted** using AES-256-GCM with your `WALLET_ENCRYPTION_KEY`
- **Never share private keys** or commit them to version control
- **Use environment variables** for the encryption key
- **Keep wallet files secure** - they contain valuable private keys

## 📊 Wallet File Structure

Decrypted wallet files contain:

```json
{
  "sessionId": "BONK_1754048277095",
  "walletCount": 3,
  "privateKeys": [
    "base58_private_key_1",
    "base58_private_key_2", 
    "base58_private_key_3"
  ],
  "timestamp": 1754048277095,
  "encryptionMethod": "aes-256-gcm"
}
```

## 🛠️ Troubleshooting

### Error: "Cannot decrypt wallet file"

- Check that `WALLET_ENCRYPTION_KEY` in `.env` matches the key used for encryption
- Verify the wallet file exists and isn't corrupted

### Error: "Invalid session ID"

- Check that the session ID format is correct (e.g., BONK_1754048277095)
- Verify the corresponding wallet file exists in `./wallets/`

### Error: "No wallets found"

- The session may not have created any wallets
- Check if the wallet file was deleted or moved

## 🔄 Converting Between Formats

### Base58 to Byte Array

```typescript
import bs58 from 'bs58';
const privateKeyBase58 = "your_base58_private_key";
const privateKeyBytes = bs58.decode(privateKeyBase58);
console.log(`[${Array.from(privateKeyBytes).join(',')}]`);
```

### Byte Array to Base58

```typescript
import bs58 from 'bs58';
const privateKeyBytes = new Uint8Array([1,2,3,...]); // Your byte array
const privateKeyBase58 = bs58.encode(privateKeyBytes);
console.log(privateKeyBase58);
```

This information allows you to access wallet details for debugging, recovery, or manual operations.
