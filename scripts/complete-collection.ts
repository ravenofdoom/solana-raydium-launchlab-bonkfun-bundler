import { Connection, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletManager } from '../src/wallet-manager';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as bs58 from 'bs58';

dotenv.config();

const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL!;

async function completeCollection() {
  console.log('🧹 COMPLETE SOL COLLECTION - Emptying ALL wallets');
  console.log('='.repeat(60));

  const connection = new Connection(HELIUS_RPC_URL, 'confirmed');
  
  // Load main wallet from environment (same as working collection script)
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ PRIVATE_KEY not found in environment variables');
    return;
  }
  
  const mainWallet = Keypair.fromSecretKey(bs58.decode(privateKey));

  console.log(`💰 Main Wallet: ${mainWallet.publicKey.toString()}`);
  
  const initialMainBalance = await connection.getBalance(mainWallet.publicKey);
  console.log(`📊 Initial Main Balance: ${(initialMainBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL\n`);

  const walletsDir = path.join(process.cwd(), 'wallets');
  const files = fs.readdirSync(walletsDir).filter(f => f.endsWith('.json'));

  let totalCollected = 0;
  let walletsProcessed = 0;

  for (const file of files) {
    console.log(`📁 Processing: ${file}`);
    
    try {
      // Extract session ID correctly from filename
      // For "buyers-BONK_1754049213315.json" -> "BONK_1754049213315"
      const sessionId = file.replace(/^buyers-/, '').replace(/\.json$/, '');
      console.log(`   🆔 Session ID: ${sessionId}`);
      
      const wallets = await WalletManager.getBuyerWallets(0, sessionId);
      
      if (wallets.length === 0) {
        console.log('   ⚠️  No wallets found in this session\n');
        continue;
      }

      console.log(`   📂 Found ${wallets.length} wallets`);

      for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const balance = await connection.getBalance(wallet.publicKey);
        
        if (balance > 0) {
          // Leave minimum rent exemption (890,880 lamports = ~0.00089088 SOL)
          const rentExemption = 890880; // Standard account rent exemption
          const collectableAmount = balance - rentExemption;
          
          if (collectableAmount > 5000) { // Only collect if more than 5000 lamports (0.000005 SOL)
            console.log(`   💸 Wallet ${i + 1}: ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL - COLLECTING ${(collectableAmount / LAMPORTS_PER_SOL).toFixed(6)} SOL (leaving rent exemption)`);
            
            try {
              // Create transaction to send available amount (minus rent exemption)
              const transaction = new Transaction().add(
                SystemProgram.transfer({
                  fromPubkey: wallet.publicKey,
                  toPubkey: mainWallet.publicKey,
                  lamports: collectableAmount,
                })
              );

              const signature = await sendAndConfirmTransaction(
                connection,
                transaction,
                [wallet],
                { commitment: 'confirmed' }
              );

              totalCollected += collectableAmount;
              walletsProcessed++;
              
              console.log(`   ✅ Collected ${(collectableAmount / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
              console.log(`   🔗 Tx: https://solscan.io/tx/${signature}`);
              
              // Verify remaining balance
              const newBalance = await connection.getBalance(wallet.publicKey);
              console.log(`   🧹 Wallet now has: ${(newBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL (rent exemption left)`);
              
            } catch (error) {
              console.log(`   ❌ Failed to collect from wallet ${i + 1}: ${error}`);
            }
          } else {
            console.log(`   💸 Wallet ${i + 1}: ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL (only rent exemption - skipping)`);
          }
        } else {
          console.log(`   💸 Wallet ${i + 1}: 0.000000 SOL (already empty)`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error processing session: ${error}\n`);
      continue;
    }
    
    console.log('');
  }

  const finalMainBalance = await connection.getBalance(mainWallet.publicKey);
  const collectedSOL = (totalCollected / LAMPORTS_PER_SOL);
  
  console.log('🎯 COLLECTION SUMMARY:');
  console.log('='.repeat(40));
  console.log(`📊 Wallets processed: ${walletsProcessed}`);
  console.log(`💰 Total collected: ${collectedSOL.toFixed(6)} SOL`);
  console.log(`💵 Final main balance: ${(finalMainBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
  console.log(`📈 Net gain: ${((finalMainBalance - initialMainBalance) / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
  
  if (collectedSOL > 0) {
    console.log('\n✅ All wallets have been completely emptied!');
    console.log('🚀 Ready to generate new wallets for next session!');
  } else {
    console.log('\n⚠️  No SOL was collected (wallets were already empty)');
  }
}

completeCollection().catch(console.error);
