import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletManager } from '../src/wallet-manager';
import * as bs58 from 'bs58';
import * as dotenv from 'dotenv';

dotenv.config();

async function showWalletInfo() {
  const sessionId = process.argv[2];
  if (!sessionId) {
    console.log('Usage: npx ts-node scripts/show-wallet-info.ts <SESSION_ID>');
    console.log('Example: npx ts-node scripts/show-wallet-info.ts BONK_1754048277095');
    return;
  }

  const connection = new Connection(process.env.HELIUS_RPC_URL!);
  
  try {
    const wallets = await WalletManager.getBuyerWallets(10, sessionId); // Try up to 10 wallets
    
    console.log(`\n🔑 Wallet Information for Session: ${sessionId}`);
    console.log('='.repeat(80));
    
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const balance = await connection.getBalance(wallet.publicKey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;
      
      console.log(`\n💼 Wallet ${i + 1}:`);
      console.log(`   Public Key:  ${wallet.publicKey.toString()}`);
      console.log(`   Private Key: ${bs58.encode(wallet.secretKey)}`);
      console.log(`   Balance:     ${balanceSOL.toFixed(6)} SOL`);
      console.log(`   Explorer:    https://solscan.io/account/${wallet.publicKey.toString()}`);
    }
    
    console.log(`\n📊 Summary: Found ${wallets.length} wallets in session ${sessionId}`);
    
  } catch (error) {
    console.error('❌ Failed to load wallet information:', error);
  }
}

showWalletInfo();
