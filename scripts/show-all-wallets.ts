import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletManager } from '../src/wallet-manager';
import * as bs58 from 'bs58';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function showAllWalletDetails() {
  console.log('🔑 COMPLETE WALLET ACCESS - All Sessions');
  console.log('='.repeat(80));

  const connection = new Connection(process.env.HELIUS_RPC_URL!, 'confirmed');
  
  const walletsDir = path.join(process.cwd(), 'wallets');
  const files = fs.readdirSync(walletsDir).filter(f => f.endsWith('.json'));

  console.log(`📁 Found ${files.length} wallet session files\n`);

  for (const file of files) {
    console.log(`📄 SESSION FILE: ${file}`);
    console.log('─'.repeat(80));
    
    try {
      // Extract session ID correctly from filename
      // For "buyers-BONK_1754049213315.json" -> "BONK_1754049213315"
      const sessionId = file.replace(/^buyers-/, '').replace(/\.json$/, '');
      console.log(`🆔 Session ID: ${sessionId}`);
      
      // Load wallets
      const wallets = await WalletManager.getBuyerWallets(0, sessionId);
      
      if (wallets.length === 0) {
        console.log('⚠️  No wallets found in this session\n');
        continue;
      }

      console.log(`👛 Number of wallets: ${wallets.length}\n`);

      let sessionTotal = 0;

      for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const balance = await connection.getBalance(wallet.publicKey);
        const balanceSOL = balance / LAMPORTS_PER_SOL;
        sessionTotal += balance;

        console.log(`💼 WALLET ${i + 1}:`);
        console.log(`   🔑 Public Key:  ${wallet.publicKey.toString()}`);
        console.log(`   🗝️  Private Key: ${bs58.encode(wallet.secretKey)}`);
        console.log(`   💰 Balance:     ${balanceSOL.toFixed(6)} SOL`);
        console.log(`   🔗 Explorer:    https://solscan.io/account/${wallet.publicKey.toString()}`);
        
        // Show private key in array format too (useful for some applications)
        const secretKeyArray = Array.from(wallet.secretKey);
        console.log(`   📋 Secret Array: [${secretKeyArray.slice(0, 8).join(',')},...] (64 bytes total)`);
        
        if (balanceSOL > 0.001) {
          console.log(`   💸 Status: HAS BALANCE`);
        } else if (balanceSOL > 0) {
          console.log(`   💸 Status: Minimal balance (rent exemption)`);
        } else {
          console.log(`   💸 Status: EMPTY`);
        }
        
        console.log('');
      }

      console.log(`📊 SESSION TOTAL: ${(sessionTotal / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
      console.log('═'.repeat(80));
      console.log('');
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
      console.log('');
    }
  }

  // Show main wallet info if available
  try {
    if (process.env.MAIN_WALLET_PRIVATE_KEY) {
      const mainWalletKey = JSON.parse(process.env.MAIN_WALLET_PRIVATE_KEY);
      const mainWallet = require('@solana/web3.js').Keypair.fromSecretKey(Buffer.from(mainWalletKey));
      const mainBalance = await connection.getBalance(mainWallet.publicKey);
      
      console.log('💎 MAIN WALLET INFORMATION:');
      console.log('═'.repeat(80));
      console.log(`🔑 Public Key:  ${mainWallet.publicKey.toString()}`);
      console.log(`💰 Balance:     ${(mainBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
      console.log(`🔗 Explorer:    https://solscan.io/account/${mainWallet.publicKey.toString()}`);
      console.log('');
    }
  } catch (error) {
    console.log('⚠️  Main wallet info not available or configured');
  }

  console.log('✅ Wallet access verification complete!');
}

showAllWalletDetails().catch(console.error);
