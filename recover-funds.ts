#!/usr/bin/env node

/**
 * Recover SOL from Bundle Wallets
 * 
 * This script recovers SOL from previously created bundle wallets back to the main wallet.
 * Use this when tests fail or you want to reclaim funding.
 */

import { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletManager } from './src/wallet-manager';
import { RPC_ENDPOINT } from './constants';
import bs58 from 'bs58';

async function recoverFundsFromBundleWallets() {
  console.log('💰 Recovering SOL from Bundle Wallets');
  console.log('=' .repeat(50));
  
  try {
    // Initialize connection
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    console.log(`🌐 Network: ${RPC_ENDPOINT.includes('devnet') ? 'Devnet' : 'Mainnet'}`);
    
    // Get main wallet
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not found in environment variables');
    }
    
    const mainWallet = Keypair.fromSecretKey(bs58.decode(privateKey));
    console.log(`🏦 Main wallet: ${mainWallet.publicKey.toString()}`);
    
    // Check main wallet balance before
    const mainBalanceBefore = await connection.getBalance(mainWallet.publicKey);
    console.log(`💵 Main wallet balance: ${(mainBalanceBefore / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log('');
    
    // List all available sessions
    const sessions = await WalletManager.listSessions();
    console.log(`📁 Found ${sessions.length} wallet sessions:`);
    
    if (sessions.length === 0) {
      console.log('ℹ️  No wallet sessions found. Nothing to recover.');
      return;
    }
    
    for (const sessionId of sessions) {
      console.log(`  📦 ${sessionId}`);
    }
    console.log('');
    
    // Let user choose which session to recover from
    console.log('🔄 Processing all sessions for recovery...');
    
    let totalRecovered = 0;
    let totalWalletsProcessed = 0;
    
    for (const sessionId of sessions) {
      console.log(`\n🔍 Processing session: ${sessionId}`);
      
      try {
        // Get wallets for this session
        const wallets = await WalletManager.getBuyerWallets(10, sessionId); // Try to get up to 10 wallets
        console.log(`  👥 Found ${wallets.length} wallets in session`);
        
        for (let i = 0; i < wallets.length; i++) {
          const wallet = wallets[i];
          
          try {
            // Check wallet balance
            const balance = await connection.getBalance(wallet.publicKey);
            const solBalance = balance / LAMPORTS_PER_SOL;
            
            if (balance < 5000) { // Less than 0.000005 SOL, not worth recovering
              console.log(`  💸 Wallet ${i + 1}: ${wallet.publicKey.toString().slice(0, 8)}... (${solBalance.toFixed(6)} SOL) - Skip (too low)`);
              continue;
            }
            
            console.log(`  💰 Wallet ${i + 1}: ${wallet.publicKey.toString().slice(0, 8)}... (${solBalance.toFixed(6)} SOL) - Recovering...`);
            
            // Calculate amount to transfer (leave small amount for rent)
            const rentReserve = 890880; // Minimum rent exemption for account
            const transferAmount = balance - rentReserve - 5000; // Extra 5000 lamports for fees
            
            if (transferAmount <= 0) {
              console.log(`    ⚠️  Not enough balance to recover after rent exemption`);
              continue;
            }
            
            // Create transfer transaction
            const transaction = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: mainWallet.publicKey,
                lamports: transferAmount,
              })
            );
            
            // Send transaction
            const signature = await sendAndConfirmTransaction(
              connection,
              transaction,
              [wallet], // Sign with the wallet we're recovering from
              { commitment: 'confirmed' }
            );
            
            const recoveredSOL = transferAmount / LAMPORTS_PER_SOL;
            totalRecovered += recoveredSOL;
            totalWalletsProcessed++;
            
            console.log(`    ✅ Recovered ${recoveredSOL.toFixed(6)} SOL - Tx: ${signature}`);
            
          } catch (walletError) {
            console.log(`    ❌ Failed to recover from wallet ${i + 1}: ${walletError}`);
          }
        }
        
      } catch (sessionError) {
        console.log(`  ❌ Failed to process session ${sessionId}: ${sessionError}`);
      }
    }
    
    console.log('');
    console.log('📊 Recovery Summary:');
    console.log(`💰 Total recovered: ${totalRecovered.toFixed(6)} SOL`);
    console.log(`👥 Wallets processed: ${totalWalletsProcessed}`);
    
    // Check main wallet balance after
    const mainBalanceAfter = await connection.getBalance(mainWallet.publicKey);
    const balanceIncrease = (mainBalanceAfter - mainBalanceBefore) / LAMPORTS_PER_SOL;
    console.log(`🏦 Main wallet balance: ${(mainBalanceAfter / LAMPORTS_PER_SOL).toFixed(6)} SOL (+${balanceIncrease.toFixed(6)} SOL)`);
    
    console.log('');
    console.log('🧹 Cleanup Options:');
    console.log('To delete wallet sessions after recovery:');
    sessions.forEach(sessionId => {
      console.log(`  node -e "const {WalletManager} = require('./src/wallet-manager'); WalletManager.deleteSession('${sessionId}')"`);
    });
    
  } catch (error) {
    console.error('❌ Recovery failed:', error);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check network connectivity');
    console.log('2. Verify PRIVATE_KEY in .env file');
    console.log('3. Make sure wallet session files exist in ./wallets/ directory');
  }
}

// Add session deletion helper
async function deleteSession(sessionId: string) {
  try {
    await WalletManager.deleteSession(sessionId);
    console.log(`✅ Deleted session: ${sessionId}`);
  } catch (error) {
    console.error(`❌ Failed to delete session ${sessionId}:`, error);
  }
}

// Run the recovery
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'delete' && args[1]) {
    deleteSession(args[1]).catch(console.error);
  } else {
    recoverFundsFromBundleWallets().catch(console.error);
  }
}

export { recoverFundsFromBundleWallets, deleteSession };
