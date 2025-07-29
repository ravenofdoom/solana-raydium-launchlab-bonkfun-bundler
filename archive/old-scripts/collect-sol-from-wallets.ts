import { Connection, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletManager } from './src/wallet-manager';
import bs58 = require('bs58');
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

/**
 * Collect SOL from all bundle wallets back to the main wallet
 */
async function collectSOLFromWallets() {
  console.log('💰 SOL Collection from Bundle Wallets');
  console.log('====================================\n');

  // Setup connection
  const connection = new Connection(
    process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com',
    'confirmed'
  );

  // Main wallet (destination)
  const mainWallet = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));
  console.log(`🎯 Main wallet: ${mainWallet.publicKey.toString()}`);

  const initialBalance = await connection.getBalance(mainWallet.publicKey);
  console.log(`💰 Initial main wallet balance: ${(initialBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL\n`);

  // Find all wallet files
  const walletsDir = './wallets';
  const walletFiles = fs.readdirSync(walletsDir)
    .filter(file => file.startsWith('buyers-bundle_') && file.endsWith('.json'))
    .sort((a, b) => {
      // Sort by timestamp (newest first)
      const timestampA = parseInt(a.split('_').pop()?.replace('.json', '') || '0');
      const timestampB = parseInt(b.split('_').pop()?.replace('.json', '') || '0');
      return timestampB - timestampA;
    });

  console.log(`📁 Found ${walletFiles.length} bundle wallet files:`);
  walletFiles.forEach((file, i) => console.log(`   ${i + 1}. ${file}`));
  console.log('');

  const walletManager = new WalletManager();
  let totalCollected = 0;
  let walletsProcessed = 0;

  // Process the most recent wallet files (likely contain the 6 wallets with 0.015 SOL)
  const filesToProcess = walletFiles.slice(0, 3); // Check last 3 files

  for (const walletFile of filesToProcess) {
    const filePath = path.join(walletsDir, walletFile);
    const sessionId = walletFile.replace('buyers-bundle_', '').replace('.json', '');
    
    console.log(`\n🔍 Processing session: ${sessionId}`);
    
    try {
      // Load wallets from this session
      const wallets = await WalletManager.getBuyerWallets(0, sessionId); // Use 0 to load existing
      console.log(`   Found ${wallets.length} wallets in this session`);

      for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const balance = await connection.getBalance(wallet.publicKey);
        const balanceSOL = balance / LAMPORTS_PER_SOL;

        console.log(`   Wallet ${i + 1}: ${wallet.publicKey.toString().slice(0, 8)}... Balance: ${balanceSOL.toFixed(6)} SOL`);

        // If wallet has significant balance (> 0.001 SOL), collect it
        if (balance > 0.001 * LAMPORTS_PER_SOL) {
          console.log(`     💸 Collecting SOL from this wallet...`);

          try {
            // Leave some SOL for transaction fees (0.0001 SOL)
            const feeReserve = 0.0001 * LAMPORTS_PER_SOL;
            const amountToTransfer = balance - feeReserve;

            if (amountToTransfer > 0) {
              const transaction = new Transaction().add(
                SystemProgram.transfer({
                  fromPubkey: wallet.publicKey,
                  toPubkey: mainWallet.publicKey,
                  lamports: amountToTransfer,
                })
              );

              const signature = await sendAndConfirmTransaction(
                connection,
                transaction,
                [wallet],
                {
                  commitment: 'confirmed',
                  maxRetries: 3,
                }
              );

              const collectedSOL = amountToTransfer / LAMPORTS_PER_SOL;
              totalCollected += collectedSOL;
              walletsProcessed++;

              console.log(`     ✅ Collected ${collectedSOL.toFixed(6)} SOL (tx: ${signature.slice(0, 8)}...)`);
            }
          } catch (error) {
            console.log(`     ❌ Failed to collect from wallet: ${error}`);
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Failed to load session ${sessionId}: ${error}`);
    }
  }

  // Final summary
  console.log(`\n📊 Collection Summary:`);
  console.log(`   Wallets processed: ${walletsProcessed}`);
  console.log(`   Total SOL collected: ${totalCollected.toFixed(6)} SOL`);

  const finalBalance = await connection.getBalance(mainWallet.publicKey);
  console.log(`   Final main wallet balance: ${(finalBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
  console.log(`   Net gain: ${((finalBalance - initialBalance) / LAMPORTS_PER_SOL).toFixed(6)} SOL`);

  console.log('\n✅ SOL collection completed!');
}

// Run the collection
collectSOLFromWallets().catch(console.error);
