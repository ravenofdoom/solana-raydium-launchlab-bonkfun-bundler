import { WalletManager } from '../src/wallet-manager';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import bs58 = require('bs58');
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Utility to access and manage generated bundle wallets
 */
async function accessBundleWallets() {
  console.log('🔑 Bundle Wallet Access Utility');
  console.log('================================\n');

  try {
    // List all available sessions
    const sessions = await WalletManager.listSessions();
    
    if (sessions.length === 0) {
      console.log('❌ No wallet sessions found');
      console.log('💡 Run a bundle test first to generate wallets');
      return;
    }

    console.log('📁 Available wallet sessions:');
    sessions.forEach((session, index) => {
      console.log(`   ${index + 1}. ${session}`);
    });

    // Get the latest bundle session (most recent)
    const bundleSessions = sessions.filter(s => s.startsWith('bundle_'));
    if (bundleSessions.length === 0) {
      console.log('\n❌ No bundle sessions found');
      console.log('💡 Run npm run test-mainnet-bundle to create bundle wallets');
      return;
    }

    const latestSession = bundleSessions[bundleSessions.length - 1];
    console.log(`\n🎯 Using latest bundle session: ${latestSession}`);

    // Load wallets from the session
    const wallets = await WalletManager.getBuyerWallets(0, latestSession); // 0 means load existing
    console.log(`\n👥 Found ${wallets.length} wallets in session:`);

    // Setup connection
    const connection = new Connection(
      process.env.HELIUS_RPC_URL || process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );

    // Example token from our tests
    const exampleToken = new PublicKey('8FHv4qjU2U9WBK7hCENK1e89bQTajstPzW6qPLweLBNr');

    // Check each wallet
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      console.log(`\n🔑 Wallet ${i + 1}:`);
      console.log(`   Address: ${wallet.publicKey.toString()}`);
      
      // Check SOL balance
      const solBalance = await connection.getBalance(wallet.publicKey);
      console.log(`   SOL Balance: ${(solBalance / 1e9).toFixed(6)} SOL`);

      // Check token balance
      try {
        const tokenAccount = await getAssociatedTokenAddress(exampleToken, wallet.publicKey);
        const tokenAccountInfo = await connection.getAccountInfo(tokenAccount);
        
        if (tokenAccountInfo) {
          console.log(`   Token Account: ${tokenAccount.toString()}`);
          console.log(`   Token Account exists: ✅`);
          // Could decode balance here with proper parsing
        } else {
          console.log(`   Token Account: Not created yet`);
        }
      } catch (error) {
        console.log(`   Token Account: Error checking`);
      }

      // Show private key in formats for wallet import
      const privateKeyArray = Array.from(wallet.secretKey);
      const privateKeyBase58 = bs58.encode(wallet.secretKey);
      
      console.log(`   Private Key (Base58): ${privateKeyBase58}`);
      console.log(`   Private Key (Array): [${privateKeyArray.join(',')}]`);
      console.log(`   💡 For Phantom: Use Base58 format above`);
      console.log(`   💡 For Solflare: Use Array format above`);
      console.log(`   🔗 Explorer: https://solscan.io/account/${wallet.publicKey.toString()}`);
    }

    console.log(`\n💡 How to use these wallets:`);
    console.log(`   1. Import private key into Phantom/Solflare`);
    console.log(`   2. Use devnet-sell-bundle to sell tokens`);
    console.log(`   3. Access via WalletManager.getBuyerWallets('${latestSession}')`);

    console.log(`\n📝 Session file location:`);
    console.log(`   wallets/buyers-${latestSession}.json`);

  } catch (error) {
    console.error('❌ Error accessing wallets:', error);
  }
}

// Run if called directly
if (require.main === module) {
  accessBundleWallets()
    .then(() => {
      console.log('\n✅ Wallet access complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

export { accessBundleWallets };
