import { Connection, PublicKey, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import bs58 from 'bs58';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Simple wallet access script to check all wallet sessions
 * Uses the same decryption method as working-collection.ts
 */

interface WalletInfo {
  publicKey: string;
  privateKey: string;
  balance: number;
  balanceSOL: number;
}

interface SessionInfo {
  sessionId: string;
  walletCount: number;
  totalBalance: number;
  wallets: WalletInfo[];
}

/**
 * Decrypt wallet data using the same method as working-collection.ts
 */
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

/**
 * Load wallets from encrypted session file (same as working-collection.ts)
 */
async function loadWalletsFromSession(sessionFile: string): Promise<Keypair[]> {
  const walletsDir = './wallets';
  const filePath = path.join(walletsDir, sessionFile);
  
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const encryptedData = fs.readFileSync(filePath, 'utf8');
    const encryptionKey = process.env.WALLET_ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      throw new Error("WALLET_ENCRYPTION_KEY required in .env");
    }

    // Decrypt the wallet data
    const decryptedData = decrypt(encryptedData, encryptionKey);
    const walletData = JSON.parse(decryptedData);
    
    // Convert private keys back to Keypair objects
    const wallets = walletData.privateKeys.map((pk: string) => 
      Keypair.fromSecretKey(bs58.decode(pk))
    );
    
    console.log(`   ✅ Successfully loaded ${wallets.length} wallets from ${sessionFile}`);
    return wallets;
    
  } catch (error) {
    console.log(`   ❌ Failed to decrypt ${sessionFile}: ${error}`);
    return [];
  }
}

async function getWalletBalance(connection: Connection, publicKey: PublicKey): Promise<number> {
  try {
    const balance = await connection.getBalance(publicKey);
    return balance;
  } catch (error) {
    console.error(`Error getting balance for ${publicKey.toString()}:`, error);
    return 0;
  }
}

async function processWalletSession(filePath: string, connection: Connection): Promise<SessionInfo | null> {
  try {
    const fileName = path.basename(filePath, '.json');
    const sessionId = fileName.replace('buyers-', '');
    
    console.log(`\n🔍 Processing session: ${sessionId}`);
    
    // Load wallets using the same method as working-collection.ts
    const wallets = await loadWalletsFromSession(path.basename(filePath));
    
    if (wallets.length === 0) {
      console.log(`❌ No wallets loaded from session: ${sessionId}`);
      return null;
    }
    
    const walletInfos: WalletInfo[] = [];
    let totalBalance = 0;
    
    for (let i = 0; i < wallets.length; i++) {
      try {
        const wallet = wallets[i];
        const publicKey = wallet.publicKey;
        const privateKey = bs58.encode(wallet.secretKey);
        
        const balance = await getWalletBalance(connection, publicKey);
        const balanceSOL = balance / LAMPORTS_PER_SOL;
        
        walletInfos.push({
          publicKey: publicKey.toString(),
          privateKey: privateKey,
          balance,
          balanceSOL
        });
        
        totalBalance += balance;
        
        console.log(`  💼 Wallet ${i + 1}: ${publicKey.toString().slice(0, 8)}... - ${balanceSOL.toFixed(6)} SOL`);
        console.log(`      🔑 Private Key: ${privateKey}`);
      } catch (error) {
        console.log(`  ❌ Error processing wallet ${i + 1}:`, (error as Error).message);
      }
    }
    
    return {
      sessionId,
      walletCount: walletInfos.length,
      totalBalance,
      wallets: walletInfos
    };
    
  } catch (error) {
    console.error(`Error processing session file ${filePath}:`, (error as Error).message);
    return null;
  }
}

async function main() {
  console.log('🚀 Wallet Session Inspector');
  console.log('==========================');
  
  const rpcEndpoint = process.env.RPC_ENDPOINT || process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';
  console.log(`🌐 RPC Endpoint: ${rpcEndpoint}`);
  
  const connection = new Connection(rpcEndpoint, 'confirmed');
  
  // Check if wallets directory exists
  const walletsDir = path.join(process.cwd(), 'wallets');
  if (!fs.existsSync(walletsDir)) {
    console.log('❌ Wallets directory not found!');
    console.log('💡 Run a bundle operation first to create wallet sessions.');
    return;
  }
  
  // Get all wallet session files
  const files = fs.readdirSync(walletsDir)
    .filter(file => file.startsWith('buyers-') && file.endsWith('.json'))
    .map(file => path.join(walletsDir, file));
  
  if (files.length === 0) {
    console.log('❌ No wallet session files found!');
    console.log('💡 Wallet session files should be named: buyers-{sessionId}.json');
    return;
  }
  
  console.log(`\n📁 Found ${files.length} wallet session(s)`);
  
  const sessions: SessionInfo[] = [];
  let grandTotalBalance = 0;
  let grandTotalWallets = 0;
  
  for (const filePath of files) {
    const sessionInfo = await processWalletSession(filePath, connection);
    if (sessionInfo) {
      sessions.push(sessionInfo);
      grandTotalBalance += sessionInfo.totalBalance;
      grandTotalWallets += sessionInfo.walletCount;
    }
  }
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('===========');
  console.log(`📂 Sessions processed: ${sessions.length}`);
  console.log(`💼 Total wallets: ${grandTotalWallets}`);
  console.log(`💰 Total balance: ${(grandTotalBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
  
  if (grandTotalBalance > 0) {
    console.log('\n💡 To collect all SOL back to your main wallet, run:');
    console.log('npx ts-node scripts/working-collection.ts');
  }
}

main().catch(console.error);
