import { Connection, Keypair } from '@solana/web3.js';
import { BundleLauncher, BundleLaunchConfig } from '../src/bundle-launcher';
import * as dotenv from 'dotenv';
import bs58 = require('bs58');

// Load environment variables
dotenv.config();

/**
 * Test real BonkFun bundle buying on mainnet
 * Uses existing BonkFun token with 3 wallets for safety
 */
async function testMainnetBundle() {
  console.log('🚀 Mainnet BonkFun Bundle Test');
  console.log('==============================\n');

  // Setup connection (mainnet with Helius)
  const connection = new Connection(
    process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com',
    'confirmed'
  );

  console.log(`🌐 Connected to: ${connection.rpcEndpoint}`);

  // Setup launcher wallet from environment
  const launcherKeypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));
  
  console.log(`🔑 Launcher wallet: ${launcherKeypair.publicKey.toString()}`);

  // Check launcher balance
  const launcherBalance = await connection.getBalance(launcherKeypair.publicKey);
  console.log(`💰 Launcher balance: ${(launcherBalance / 1e9).toFixed(4)} SOL`);

  const requiredSOL = 0.015; // 2 wallets * 0.005 SOL + fees (updated for BonkFun minimum)
  if (launcherBalance < requiredSOL * 1e9) {
    console.log(`⚠️  Need at least ${requiredSOL} SOL for this test`);
    console.log(`💡  Current balance: ${(launcherBalance / 1e9).toFixed(4)} SOL`);
    console.log(`💡  BonkFun minimum buy amount is 0.005 SOL per wallet`);
    return;
  }

  // Get configuration with small amounts for testing
  const config: BundleLaunchConfig = {
    // Use example token (no actual launching for now)
    tokenParams: {
      tokenName: 'Test Bundle Buy',
      tokenSymbol: 'TBB',
      decimals: 9,
      totalSupply: 1000000000,
      description: 'Testing real BonkFun bundle buys'
    },
    
    // Small test configuration (updated for BonkFun minimums)
    launchMode: 'tech',
    numberOfWallets: 2, // Reduced to fit current balance
    solAmountPerWallet: 0.005, // Updated to meet BonkFun minimum
    maxSlippage: 0.1, // 10% slippage for safety
    buyDelayMs: 2000, // 2 second delay between buys
    maxRetries: 2
  };

  console.log('📝 Bundle Test Configuration:');
  console.log(`   Mode: ${config.launchMode} (real BonkFun)`);
  console.log(`   Wallets: ${config.numberOfWallets}`);
  console.log(`   SOL per wallet: ${config.solAmountPerWallet}`);
  console.log(`   Total SOL for buys: ${(config.numberOfWallets * config.solAmountPerWallet).toFixed(3)} SOL`);
  console.log(`   Max slippage: ${(config.maxSlippage * 100).toFixed(1)}%`);
  console.log('');

  // Confirm before proceeding
  console.log('⚠️  This will execute REAL transactions on MAINNET with REAL SOL!');
  console.log('💡 Starting in 5 seconds... Press Ctrl+C to cancel');
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // Initialize Bundle Launcher
    const launcher = new BundleLauncher(connection, config.launchMode);

    // Execute bundle test
    console.log('🎯 Starting mainnet bundle test...\n');
    const result = await launcher.launchAndBundle(launcherKeypair, config);

    console.log('\n📊 Mainnet Bundle Test Results:');
    console.log('==============================');
    console.log(`🏠 Token Used: ${result.tokenMint.toString()}`);
    console.log(`✅ Successful Buys: ${result.totalSuccessful}/${config.numberOfWallets}`);
    console.log(`❌ Failed Buys: ${result.totalFailed}/${config.numberOfWallets}`);
    console.log(`📈 Success Rate: ${((result.totalSuccessful / config.numberOfWallets) * 100).toFixed(1)}%`);

    // Show individual results with explorer links
    console.log('\n🔍 Individual Buy Results:');
    result.buyResults.forEach((buyResult, index) => {
      const status = buyResult.signature ? '✅' : '❌';
      if (buyResult.signature) {
        const explorerUrl = `https://solscan.io/tx/${buyResult.signature}`;
        console.log(`   ${status} Wallet ${buyResult.walletIndex + 1}: ${explorerUrl}`);
      } else {
        console.log(`   ${status} Wallet ${buyResult.walletIndex + 1}: ${buyResult.error}`);
      }
    });

    // Calculate costs
    const totalSOLSpent = result.totalSuccessful * config.solAmountPerWallet;
    const estimatedFees = result.totalSuccessful * 0.001; // Rough fee estimate
    console.log(`\n💸 Total SOL spent on buys: ${totalSOLSpent.toFixed(4)} SOL`);
    console.log(`💸 Estimated transaction fees: ${estimatedFees.toFixed(4)} SOL`);
    console.log(`💸 Total cost: ~${(totalSOLSpent + estimatedFees).toFixed(4)} SOL`);

    if (result.totalSuccessful > 0) {
      console.log('\n🎉 Mainnet bundle test completed successfully!');
      console.log('🚀 Ready to scale up to 16-20 wallets for production');
      console.log('💡 You can now sell these tokens using the devnet-sell-bundle command');
    } else {
      console.log('\n⚠️  No successful buys. Check the errors above.');
    }

  } catch (error) {
    console.error('\n❌ Mainnet bundle test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testMainnetBundle()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { testMainnetBundle };
