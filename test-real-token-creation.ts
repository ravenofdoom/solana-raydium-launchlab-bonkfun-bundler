import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import { BundleLauncher } from './src/bundle-launcher';
import { WalletManager } from './src/wallet-manager';
import bs58 from 'bs58';
import 'dotenv/config';

async function testRealTokenCreation() {
  console.log('🔧 Testing REAL BonkFun Token Creation...\n');

  // Connect to mainnet
  const endpoint = process.env.SOLANA_RPC_ENDPOINT || clusterApiUrl('mainnet-beta');
  const connection = new Connection(endpoint, 'confirmed');
  
  console.log(`🌐 Connected to: ${endpoint}`);

  // Use the correct main wallet with existing SOL
  const mainWalletPrivateKey = process.env.PRIVATE_KEY!;
  const launcherWallet = Keypair.fromSecretKey(bs58.decode(mainWalletPrivateKey));
  
  console.log(`👤 Main launcher wallet: ${launcherWallet.publicKey.toString()}`);

  // Check launcher balance
  const balance = await connection.getBalance(launcherWallet.publicKey);
  console.log(`💰 Launcher balance: ${balance / 1e9} SOL`);

  if (balance < 0.01 * 1e9) { // Need at least 0.01 SOL
    console.log('❌ Insufficient balance for token creation. Need at least 0.01 SOL.');
    console.log('💡 Please fund the launcher wallet with SOL for token creation:');
    console.log(`📋 Address: ${launcherWallet.publicKey.toString()}`);
    return;
  }

  // Create bundle launcher in tech mode
  const bundleLauncher = new BundleLauncher(connection, 'tech');

  // Test configuration for MINIMAL token creation
  const testConfig = {
    tokenParams: {
      tokenName: 'TestBonk ' + Date.now(),
      tokenSymbol: 'TBONK' + Date.now().toString().slice(-4),
      decimals: 9,
      totalSupply: 1000000, // 1 million tokens
      description: 'Test token for real BonkFun integration',
      image: 'https://example.com/test.png',
      twitter: 'https://twitter.com/testbonk',
      telegram: 'https://t.me/testbonk',
      website: 'https://testbonk.com'
    },
    launchMode: 'tech' as const,
    numberOfWallets: 3, // Start with just 3 wallets for testing
    solAmountPerWallet: 0.001, // Minimal SOL amount for testing
    maxSlippage: 10,
    buyDelayMs: 1000,
    maxRetries: 3
  };

  try {
    console.log('\n🚀 Creating REAL BonkFun token...');
    console.log(`📝 Token: ${testConfig.tokenParams.tokenName} (${testConfig.tokenParams.tokenSymbol})`);
    
    // Test REAL token creation and bundle buying
    const result = await bundleLauncher.launchAndBundle(launcherWallet, testConfig);
    
    console.log('\n✅ REAL TOKEN CREATION SUCCESS!');
    console.log(`🪙 Token Mint: ${result.tokenMint.toString()}`);
    console.log(`📋 Launch Signature: ${result.launchSignature}`);
    console.log(`📊 Bundle Results: ${result.totalSuccessful}/${result.totalSuccessful + result.totalFailed} successful`);
    
    // Show buy results
    console.log('\n📈 Buy Results:');
    result.buyResults.forEach((buy, i) => {
      if (buy.signature) {
        console.log(`  ✅ Wallet ${i + 1}: ${buy.signature}`);
      } else {
        console.log(`  ❌ Wallet ${i + 1}: ${buy.error}`);
      }
    });

  } catch (error) {
    console.error('\n❌ REAL TOKEN CREATION FAILED:');
    console.error(error);
    
    if (error instanceof Error && error.message.includes('insufficient funds')) {
      console.log('\n💡 Try funding the launcher wallet with more SOL.');
    }
  }
}

// Run the test
testRealTokenCreation().catch(console.error);
