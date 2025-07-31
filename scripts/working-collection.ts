import { Connection, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import bs58 from 'bs58';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * WORKING SOL Collection Script - Properly decrypts encrypted wallet files
 */
class WorkingCollector {
  private connection: Connection;
  private mainWallet: Keypair;
  private walletsDir: string;

  constructor() {
    this.connection = new Connection(
      process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    this.mainWallet = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));
    this.walletsDir = './wallets';
  }

  /**
   * Decrypt wallet data using the same method as WalletManager
   */
  private decrypt(encryptedText: string, key: string): string {
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
   * Load wallets from encrypted session file
   */
  private async loadWalletsFromSession(sessionFile: string): Promise<Keypair[]> {
    const filePath = path.join(this.walletsDir, sessionFile);
    
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
      const decryptedData = this.decrypt(encryptedData, encryptionKey);
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

  /**
   * Collect SOL from all wallets in a session
   */
  private async collectFromWallets(wallets: Keypair[]): Promise<number> {
    let totalCollected = 0;
    
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      
      try {
        const balance = await this.connection.getBalance(wallet.publicKey);
        const balanceSOL = balance / LAMPORTS_PER_SOL;
        
        console.log(`     💼 Wallet ${i + 1}: ${wallet.publicKey.toString().slice(0, 8)}... Balance: ${balanceSOL.toFixed(6)} SOL`);
        
        // If wallet has significant balance (> 0.001 SOL), collect it
        if (balance > 0.001 * LAMPORTS_PER_SOL) {
          console.log(`       💸 Collecting SOL from this wallet...`);
          
          // Get rent exemption minimum and add transaction fee buffer
          const rentExemption = await this.connection.getMinimumBalanceForRentExemption(0);
          const transactionFee = 5000; // 0.000005 SOL for transaction fees
          const totalReserve = rentExemption + transactionFee;
          const amountToTransfer = balance - totalReserve;
          
          if (amountToTransfer > 0) {
            console.log(`       📊 Balance: ${balanceSOL.toFixed(6)} SOL, Transferring: ${(amountToTransfer / LAMPORTS_PER_SOL).toFixed(6)} SOL, Leaving: ${(totalReserve / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
            
            const transaction = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: this.mainWallet.publicKey,
                lamports: amountToTransfer,
              })
            );
            
            const signature = await sendAndConfirmTransaction(
              this.connection,
              transaction,
              [wallet],
              {
                commitment: 'confirmed',
                maxRetries: 3,
              }
            );
            
            const collectedSOL = amountToTransfer / LAMPORTS_PER_SOL;
            totalCollected += collectedSOL;
            
            console.log(`       ✅ Collected ${collectedSOL.toFixed(6)} SOL (tx: ${signature.slice(0, 8)}...)`);
          } else {
            console.log(`       ⚠️  Cannot transfer - amount would be ${(amountToTransfer / LAMPORTS_PER_SOL).toFixed(6)} SOL (negative or zero)`);
          }
        }
      } catch (error) {
        console.log(`       ❌ Failed to collect from wallet ${i + 1}: ${error}`);
      }
    }
    
    return totalCollected;
  }

  /**
   * Main collection process
   */
  async collect(): Promise<void> {
    console.log('🎯 WORKING SOL COLLECTION - Proper Decryption');
    console.log('='.repeat(60));
    console.log(`💼 Main wallet: ${this.mainWallet.publicKey.toString()}`);
    
    const initialBalance = await this.connection.getBalance(this.mainWallet.publicKey);
    console.log(`💰 Initial balance: ${(initialBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL\n`);
    
    // Find all wallet session files
    const sessionFiles = fs.readdirSync(this.walletsDir)
      .filter(file => file.startsWith('buyers-') && file.endsWith('.json') && !file.includes('devnet'))
      .sort((a, b) => {
        // Sort by timestamp (newest first)
        const timestampA = parseInt(a.split('_').pop()?.replace('.json', '') || '0');
        const timestampB = parseInt(b.split('_').pop()?.replace('.json', '') || '0');
        return timestampB - timestampA;
      });
    
    console.log(`📁 Found ${sessionFiles.length} wallet session files:`);
    sessionFiles.forEach((file, i) => console.log(`   ${i + 1}. ${file}`));
    console.log('');
    
    let totalCollected = 0;
    let walletsProcessed = 0;
    let successfulSessions = 0;
    
    // Process each session file
    for (const sessionFile of sessionFiles) {
      console.log(`\n🔍 Processing: ${sessionFile}`);
      
      const wallets = await this.loadWalletsFromSession(sessionFile);
      
      if (wallets.length > 0) {
        const collected = await this.collectFromWallets(wallets);
        totalCollected += collected;
        walletsProcessed += wallets.length;
        
        if (collected > 0) {
          successfulSessions++;
          console.log(`   ✅ Session collected: ${collected.toFixed(6)} SOL`);
        } else {
          console.log(`   📭 Session had no collectable SOL`);
        }
      }
    }
    
    // Final summary
    const finalBalance = await this.connection.getBalance(this.mainWallet.publicKey);
    
    console.log(`\n🎉 COLLECTION COMPLETE!`);
    console.log('='.repeat(50));
    console.log(`📊 Summary:`);
    console.log(`   • Sessions processed: ${sessionFiles.length}`);
    console.log(`   • Successful sessions: ${successfulSessions}`);
    console.log(`   • Wallets processed: ${walletsProcessed}`);
    console.log(`   • Total SOL collected: ${totalCollected.toFixed(6)} SOL`);
    console.log(`   • Initial balance: ${(initialBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`   • Final balance: ${(finalBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`   • Net gain: ${((finalBalance - initialBalance) / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    
    if (totalCollected > 0) {
      console.log(`\n✅ SUCCESS! Collected ${totalCollected.toFixed(6)} SOL from stuck wallets!`);
    } else {
      console.log(`\n⚠️  No SOL was collected. All wallets may already be empty.`);
    }
  }
}

// Run the collection
async function main() {
  try {
    const collector = new WorkingCollector();
    await collector.collect();
  } catch (error) {
    console.error('❌ Collection failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
