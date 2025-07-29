import { Connection, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletManager } from '../src/wallet-manager';
import bs58 = require('bs58');
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Quick SOL collector - collect from the latest bundle with 0.015 SOL per wallet
 */
async function quickCollectSOL() {
  console.log('⚡ Quick SOL Collection');
  console.log('======================\n');

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

  // Use the exact same logic as the access script that worked
  const sessions = await WalletManager.listSessions();
  console.log(`📁 Found ${sessions.length} wallet sessions`);
  
  // Get the latest bundle session (same logic as access script)
  const bundleSessions = sessions.filter(s => s.startsWith('bundle_'));
  const latestSession = bundleSessions.sort().pop();
  
  if (!latestSession) {
    console.log('❌ No bundle sessions found');
    return;
  }

  console.log(`🎯 Using latest bundle session: ${latestSession}`);

  try {
    // Load wallets using the same method as access script
    const wallets = await WalletManager.getBuyerWallets(0, latestSession);
    console.log(`👥 Found ${wallets.length} wallets in session\n`);

    let totalCollected = 0;
    let successfulTransfers = 0;

    // Collect SOL from each wallet
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const balance = await connection.getBalance(wallet.publicKey);
      
      console.log(`💸 Wallet ${i + 1}: ${wallet.publicKey.toString().slice(0, 8)}... has ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
      
      if (balance > 5000) { // Only collect if more than 0.000005 SOL (min rent exempt)
        const collectAmount = balance - 5000; // Leave minimum for rent exemption
        
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
          successfulTransfers++;
          
          // Small delay between transfers
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.log(`   ⚠️  Failed to collect from wallet ${i + 1}: ${error}`);
        }
      } else {
        console.log(`   💸 Balance too low to collect (${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL)`);
      }
    }

    // Check main wallet balance after
    const mainBalanceAfter = await connection.getBalance(mainWallet.publicKey);
    console.log(`\n💰 Collection Summary:`);
    console.log(`   Successful transfers: ${successfulTransfers}/${wallets.length}`);
    console.log(`   Total SOL collected: ${(totalCollected / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`   Main wallet balance before: ${(mainBalanceBefore / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`   Main wallet balance after: ${(mainBalanceAfter / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`   Net gain: ${((mainBalanceAfter - mainBalanceBefore) / LAMPORTS_PER_SOL).toFixed(6)} SOL`);

  } catch (error) {
    console.log(`❌ Error loading wallets: ${error}`);
  }
}

quickCollectSOL()
  .then(() => {
    console.log('\n✅ Quick SOL collection completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error collecting SOL:', error);
    process.exit(1);
  });
