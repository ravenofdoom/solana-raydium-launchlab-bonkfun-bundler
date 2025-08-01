import { Connection, PublicKey } from '@solana/web3.js';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Token Pool Discovery Tool
 * Helps find the correct pool addresses for a BonkFun token
 */
async function discoverTokenPool() {
  const connection = new Connection(process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com');
  
  // The token we want to analyze
  const tokenMint = new PublicKey('Gnth6Qhb9ChRGcE2bx2FJM4TSCk6KRMKF3U3AnFJbonk');
  
  console.log('🔍 Discovering pool information for token:', tokenMint.toString());
  
  try {
    // Get token account info
    const mintInfo = await connection.getAccountInfo(tokenMint);
    if (!mintInfo) {
      console.log('❌ Token mint not found');
      return;
    }
    
    console.log('✅ Token mint found');
    console.log('Owner program:', mintInfo.owner.toString());
    
    // Get recent transactions involving this token
    console.log('\n🔍 Searching for recent transactions...');
    const signatures = await connection.getSignaturesForAddress(tokenMint, { limit: 10 });
    
    console.log(`Found ${signatures.length} recent transactions:`);
    
    for (let i = 0; i < Math.min(3, signatures.length); i++) {
      const sig = signatures[i];
      console.log(`\n📤 Transaction ${i + 1}: ${sig.signature}`);
      
      try {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        
        if (tx && tx.meta && tx.transaction) {
          console.log('   Accounts involved:');
          const accountKeys = tx.transaction.message.staticAccountKeys || [];
          accountKeys.forEach((account, index) => {
            if (index < 15) { // Only show first 15 accounts
              console.log(`   ${index}: ${account.toString()}`);
            }
          });
        }
      } catch (error) {
        console.log(`   ❌ Could not fetch transaction details: ${error}`);
      }
    }
    
    // Look for Raydium Launchpad program interactions
    console.log('\n🔍 Looking for Raydium Launchpad program interactions...');
    const launchpadProgram = new PublicKey('LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj');
    
    for (const sig of signatures.slice(0, 5)) {
      try {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        
        if (tx && tx.transaction) {
          const accountKeys = tx.transaction.message.staticAccountKeys || [];
          const hasLaunchpad = accountKeys.some(key => key.equals(launchpadProgram));
          
          if (hasLaunchpad) {
            console.log(`\n🎯 Found Raydium Launchpad transaction: ${sig.signature}`);
            console.log('This transaction might contain the pool addresses we need!');
            console.log('Accounts in this transaction:');
            accountKeys.forEach((account, index) => {
              console.log(`   ${index}: ${account.toString()}`);
            });
            break;
          }
        }
      } catch (error) {
        console.log(`   ❌ Error checking transaction: ${error}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Error discovering pool information:', error);
  }
}

// Run the discovery
discoverTokenPool().catch(console.error);
