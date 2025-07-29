import { Connection, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletManager } from '../src/wallet-manager';
import bs58 = require('bs58');
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Collect SOL from all generated bundle wallets back to main wallet
 */
async function collectSOLFromWallets() {
  console.log('💰 SOL Collection from Bundle Wallets');
  console.log('=====================================\n');

  // Setup connection
  const connection = new Connection(
    process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com',
    'confirmed'
  );

  // Main wallet to collect SOL into
  const mainWallet = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));
  console.log(`🏦 Main wallet: ${mainWallet.publicKey.toString()}`);

  // Check main wallet balance before
  const mainBalanceBefore = await connection.getBalance(mainWallet.publicKey);
  console.log(`💰 Main wallet balance before: ${(mainBalanceBefore / LAMPORTS_PER_SOL).toFixed(6)} SOL\n`);

  // Load wallet manager
  const walletManager = WalletManager;

  // Get all wallet bundle files
  const fs = require('fs');
  const path = require('path');
  const walletsDir = path.join(__dirname, '..', 'wallets');
  
  if (!fs.existsSync(walletsDir)) {
    console.log('❌ No wallets directory found');
    return;
  }

  const walletFiles = fs.readdirSync(walletsDir)
    .filter((file: string) => file.startsWith('buyers-bundle_') && file.endsWith('.json'));

  console.log(`📁 Found ${walletFiles.length} wallet bundle files:`);
  walletFiles.forEach((file: string) => console.log(`   - ${file}`));
  console.log();

  let totalCollected = 0;
  let totalWallets = 0;

  // Process each wallet bundle
  for (const walletFile of walletFiles) {
    console.log(`🔍 Processing ${walletFile}...`);
    
    try {
      // Extract session ID correctly - keep the full session ID format
      const sessionId = walletFile.replace('buyers-', '').replace('.json', '');
      console.log(`   Session ID: ${sessionId}`);
      
      const wallets = await walletManager.getBuyerWallets(0, sessionId); // 0 count loads existing
      
      console.log(`   Found ${wallets.length} wallets in this bundle`);
      
      if (wallets.length === 0) {
        console.log(`   ⚠️  No wallets found for session: ${sessionId}`);
        console.log(`   🔍 File exists at: ${walletFile}`);
        continue;
      }
      
      // Collect SOL from each wallet
      for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const balance = await connection.getBalance(wallet.publicKey);
        
        if (balance > 5000) { // Only collect if more than 0.000005 SOL (min rent exempt)
          const collectAmount = balance - 5000; // Leave minimum for rent exemption
          
          console.log(`   💸 Wallet ${i + 1}: ${wallet.publicKey.toString().slice(0, 8)}... has ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
          
          try {
            // Create transfer transaction
            const transaction = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: mainWallet.publicKey,
                lamports: collectAmount,
              })
            );

            // Send transaction
            const signature = await sendAndConfirmTransaction(
              connection,
              transaction,
              [wallet],
              { commitment: 'confirmed' }
            );

            console.log(`   ✅ Collected ${(collectAmount / LAMPORTS_PER_SOL).toFixed(6)} SOL - Signature: ${signature.slice(0, 8)}...`);
            totalCollected += collectAmount;
            totalWallets++;
            
            // Small delay between transfers
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            console.log(`   ⚠️  Failed to collect from wallet ${i + 1}: ${error}`);
          }
        } else {
          console.log(`   💸 Wallet ${i + 1}: ${wallet.publicKey.toString().slice(0, 8)}... has ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL (too low to collect)`);
        }
      }
      
      console.log(`   ✅ Completed ${walletFile}\n`);
      
    } catch (error) {
      console.log(`   ❌ Error processing ${walletFile}: ${error}\n`);
    }
  }

  // Check main wallet balance after
  const mainBalanceAfter = await connection.getBalance(mainWallet.publicKey);
  console.log(`\n💰 Collection Summary:`);
  console.log(`   Wallets processed: ${totalWallets}`);
  console.log(`   Total SOL collected: ${(totalCollected / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
  console.log(`   Main wallet balance before: ${(mainBalanceBefore / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
  console.log(`   Main wallet balance after: ${(mainBalanceAfter / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
  console.log(`   Net gain: ${((mainBalanceAfter - mainBalanceBefore) / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
}

collectSOLFromWallets()
  .then(() => {
    console.log('\n✅ SOL collection completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error collecting SOL:', error);
    process.exit(1);
  });
