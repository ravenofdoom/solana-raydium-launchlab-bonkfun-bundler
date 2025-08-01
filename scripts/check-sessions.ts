import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletManager } from '../src/wallet-manager';
import fs from 'fs';
import path from 'path';

async function checkSessions() {
  const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY', 'confirmed');
  
  const walletsDir = 'wallets';
  const files = fs.readdirSync(walletsDir).filter(f => f.endsWith('.json'));
  
  // Sort by modification time (newest first)
  files.sort((a, b) => {
    const statA = fs.statSync(path.join(walletsDir, a));
    const statB = fs.statSync(path.join(walletsDir, b));
    return statB.mtime.getTime() - statA.mtime.getTime();
  });
  
  console.log('Session balance check:\n');
  
  for (const file of files) {
    console.log(`${file}:`);
    
    try {
      // Extract session ID from filename (everything before timestamp)
      const sessionId = file.replace(/(_\d+)?\.json$/, '');
      const wallets = await WalletManager.getBuyerWallets(0, sessionId);
      
      let totalBalance = 0;
      for (const wallet of wallets) {
        const balance = await connection.getBalance(wallet.publicKey);
        totalBalance += balance;
      }
      
      const solBalance = totalBalance / LAMPORTS_PER_SOL;
      const status = solBalance > 0.001 ? '💰 HAS BALANCE' : '💸 Empty';
      console.log(`  ${status} - ${wallets.length} wallets, ${solBalance.toFixed(6)} SOL\n`);
      
    } catch (error) {
      console.log(`  ❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }
}

checkSessions().catch(console.error);
