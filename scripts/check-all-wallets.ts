import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletManager } from '../src/wallet-manager';
import * as bs58 from 'bs58';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function checkAllWallets() {
  const connection = new Connection(process.env.HELIUS_RPC_URL!);
  
  // Get all wallet session files
  const walletsDir = 'wallets';
  const files = fs.readdirSync(walletsDir).filter(f => f.endsWith('.json'));
  
  console.log('🔍 Checking all wallet sessions...\n');
  
  let totalSOL = 0;
  let totalWallets = 0;
  
  for (const file of files) {
    console.log(`📁 ${file}:`);
    
    try {
      // Extract session ID from filename
      const sessionId = file.replace(/\.json$/, '').replace(/^buyers-/, '');
      const wallets = await WalletManager.getBuyerWallets(0, sessionId);
      
      let sessionSOL = 0;
      console.log(`   Found ${wallets.length} wallets:`);
      
      for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const balance = await connection.getBalance(wallet.publicKey);
        const balanceSOL = balance / LAMPORTS_PER_SOL;
        sessionSOL += balanceSOL;
        
        if (balanceSOL > 0.001) { // Only show wallets with significant balance
          console.log(`   💰 Wallet ${i + 1}: ${balanceSOL.toFixed(6)} SOL`);
          console.log(`      Address: ${wallet.publicKey.toString()}`);
          console.log(`      Private: ${bs58.encode(wallet.secretKey)}`);
        } else {
          console.log(`   💸 Wallet ${i + 1}: ${balanceSOL.toFixed(6)} SOL (nearly empty)`);
        }
      }
      
      console.log(`   📊 Session Total: ${sessionSOL.toFixed(6)} SOL`);
      totalSOL += sessionSOL;
      totalWallets += wallets.length;
      
    } catch (error) {
      console.log(`   ❌ Error loading session: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log(`🎯 TOTAL SUMMARY:`);
  console.log(`   Sessions: ${files.length}`);
  console.log(`   Wallets: ${totalWallets}`);
  console.log(`   Total SOL: ${totalSOL.toFixed(6)} SOL`);
  console.log(`   Est. Value: $${(totalSOL * 150).toFixed(2)} (assuming $150/SOL)`);
}

checkAllWallets().catch(console.error);
