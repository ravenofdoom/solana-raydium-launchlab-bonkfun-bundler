import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import { BundleLauncher, BundleLaunchConfig } from '../src/bundle-launcher';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test script for BonkFun Bundle Launcher
 * Creates a token and immediately bundles buy with multiple wallets
 */
async function testBundleLaunch() {
  console.log('🚀 BonkFun Bundle Launcher Test');
  console.log('================================\n');

  // Setup connection (devnet for testing)
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || clusterApiUrl('devnet'),
    'confirmed'
  );

  // Setup launcher wallet (needs SOL for launching token)
  const launcherKeypair = process.env.LAUNCHER_PRIVATE_KEY
    ? Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.LAUNCHER_PRIVATE_KEY)))
    : Keypair.generate();

  console.log(`🔑 Launcher wallet: ${launcherKeypair.publicKey.toString()}`);

  // Check launcher balance
  const launcherBalance = await connection.getBalance(launcherKeypair.publicKey);
  console.log(`💰 Launcher balance: ${(launcherBalance / 1e9).toFixed(4)} SOL`);

  if (launcherBalance < 0.1 * 1e9) {
    console.log('⚠️  Launcher needs more SOL for gas fees');
    if (connection.rpcEndpoint.includes('devnet')) {
      console.log('🪂 Requesting devnet airdrop...');
      try {
        await connection.requestAirdrop(launcherKeypair.publicKey, 1 * 1e9);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error('❌ Airdrop failed:', error);
      }
    }
  }

  // Get configuration from environment with defaults
  const envConfig = BundleLauncher.getConfigFromEnv();
  
  const config: BundleLaunchConfig = {
    // Token parameters
    tokenParams: {
      tokenName: process.env.TEST_TOKEN_NAME || 'Bundle Test Token',
      tokenSymbol: process.env.TEST_TOKEN_SYMBOL || 'BTT',
      decimals: 9,
      totalSupply: 1000000000, // 1 billion tokens
      description: 'Test token for bundle launcher',
      website: 'https://example.com',
      twitter: 'https://twitter.com/example',
      telegram: 'https://t.me/example'
    },
    
    // Bundle configuration from environment
    launchMode: envConfig.launchMode || 'tech',
    numberOfWallets: envConfig.numberOfWallets || 5, // Start with fewer for testing
    solAmountPerWallet: envConfig.solAmountPerWallet || 0.001, // Small amounts for testing
    maxSlippage: envConfig.maxSlippage || 0.1, // 10% slippage for testing
    buyDelayMs: envConfig.buyDelayMs || 1000,
    maxRetries: envConfig.maxRetries || 2
  };

  console.log('📝 Bundle Launch Configuration:');
  console.log(`   Token: ${config.tokenParams.tokenName} (${config.tokenParams.tokenSymbol})`);
  console.log(`   Mode: ${config.launchMode}`);
  console.log(`   Wallets: ${config.numberOfWallets}`);
  console.log(`   SOL per wallet: ${config.solAmountPerWallet}`);
  console.log(`   Max slippage: ${(config.maxSlippage * 100).toFixed(1)}%`);
  console.log(`   Buy delay: ${config.buyDelayMs}ms`);
  console.log('');

  try {
    // Initialize Bundle Launcher
    const launcher = new BundleLauncher(connection, config.launchMode);

    // Execute bundle launch
    console.log('🎯 Starting bundle launch...\n');
    const result = await launcher.launchAndBundle(launcherKeypair, config);

    console.log('\n📊 Bundle Launch Results:');
    console.log('========================');
    console.log(`🏠 Token Mint: ${result.tokenMint.toString()}`);
    console.log(`📋 Launch Signature: ${result.launchSignature}`);
    console.log(`✅ Successful Buys: ${result.totalSuccessful}/${config.numberOfWallets}`);
    console.log(`❌ Failed Buys: ${result.totalFailed}/${config.numberOfWallets}`);
    console.log(`📈 Success Rate: ${((result.totalSuccessful / config.numberOfWallets) * 100).toFixed(1)}%`);

    // Show individual results
    console.log('\n🔍 Individual Buy Results:');
    result.buyResults.forEach((buyResult, index) => {
      const status = buyResult.signature ? '✅' : '❌';
      const info = buyResult.signature 
        ? `Signature: ${buyResult.signature}`
        : `Error: ${buyResult.error}`;
      console.log(`   ${status} Wallet ${buyResult.walletIndex + 1}: ${info}`);
    });

    // Calculate total SOL spent
    const totalSOLSpent = result.totalSuccessful * config.solAmountPerWallet;
    console.log(`\n💸 Total SOL spent on buys: ${totalSOLSpent.toFixed(4)} SOL`);

    // Save session info for later selling
    console.log(`\n💾 Session saved for later selling. Look for files with "bundle_${config.tokenParams.tokenSymbol}_" prefix`);
    
    if (result.totalSuccessful > 0) {
      console.log('\n🎉 Bundle launch completed successfully!');
      console.log('💡 You can now use the token seller to sell these tokens');
    } else {
      console.log('\n⚠️  No successful buys. Check the errors above.');
    }

  } catch (error) {
    console.error('\n❌ Bundle launch failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testBundleLaunch()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { testBundleLaunch };
