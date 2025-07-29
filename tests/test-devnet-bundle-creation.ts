import { Connection, Keypair } from '@solana/web3.js';
import { BundleLauncher, BundleLaunchConfig } from '../src/bundle-launcher';
import * as dotenv from 'dotenv';
import bs58 = require('bs58');

// Load environment variables
dotenv.config();

/**
 * Test bundle creation and buying on devnet with actual token creation
 */
async function testDevnetBundleWithTokenCreation() {
  console.log('🚀 Devnet Bundle Test with Token Creation');
  console.log('==========================================\n');

  // Setup connection (devnet)
  const connection = new Connection(
    process.env.RPC_ENDPOINT || 'https://api.devnet.solana.com',
    'confirmed'
  );

  console.log(`🌐 Connected to: ${connection.rpcEndpoint}`);

  // Setup launcher wallet from environment
  const launcherKeypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));
  
  console.log(`🔑 Launcher wallet: ${launcherKeypair.publicKey.toString()}`);

  // Check launcher balance
  const launcherBalance = await connection.getBalance(launcherKeypair.publicKey);
  console.log(`💰 Launcher balance: ${(launcherBalance / 1e9).toFixed(4)} SOL`);

  const requiredSOL = 0.02; // For devnet testing with token creation
  if (launcherBalance < requiredSOL * 1e9) {
    console.log(`⚠️  Need at least ${requiredSOL} SOL for this test`);
    console.log(`💡  Get devnet SOL from: https://faucet.solana.com/`);
    return;
  }

  // Get configuration with token creation
  const config: BundleLaunchConfig = {
    // Create a new token
    tokenParams: {
      tokenName: process.env.TOKEN_NAME || 'Devnet Test Bundle',
      tokenSymbol: process.env.TOKEN_SYMBOL || 'DTB',
      decimals: parseInt(process.env.TOKEN_DECIMALS || '9'),
      totalSupply: parseInt(process.env.TOTAL_SUPPLY || '1000000000'),
      description: 'Devnet bundle test with token creation'
    },
    
    // Devnet test configuration
    launchMode: 'classic', // Start with classic mode for devnet
    numberOfWallets: 3, // Small number for testing
    solAmountPerWallet: 0.005, // Test amount
    maxSlippage: 0.15, // 15% slippage for devnet
    buyDelayMs: 2000, // 2 second delay between buys
    maxRetries: 3
  };

  console.log('📝 Bundle Test Configuration:');
  console.log(`   Token: ${config.tokenParams.tokenName} (${config.tokenParams.tokenSymbol})`);
  console.log(`   Mode: ${config.launchMode}`);
  console.log(`   Wallets: ${config.numberOfWallets}`);
  console.log(`   SOL per wallet: ${config.solAmountPerWallet}`);
  console.log(`   Total SOL for buys: ${(config.numberOfWallets * config.solAmountPerWallet).toFixed(3)} SOL`);
  console.log(`   Max slippage: ${(config.maxSlippage * 100).toFixed(1)}%`);
  console.log('');

  // Confirm before proceeding
  console.log('⚠️  This will create a new token and execute transactions on DEVNET');
  console.log('💡 Starting in 3 seconds... Press Ctrl+C to cancel');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Initialize Bundle Launcher
    const launcher = new BundleLauncher(connection, config.launchMode);

    // Execute bundle test
    console.log('🎯 Starting devnet bundle test...\n');
    
    const result = await launcher.launchAndBundle(
      launcherKeypair,
      config
    );

    console.log('📊 Devnet Bundle Test Results:');
    console.log('==============================');
    console.log(`🏠 Token Mint: ${result.tokenMint.toString()}`);
    console.log(`📋 Launch Signature: ${result.launchSignature}`);
    console.log(`✅ Successful Buys: ${result.totalSuccessful}/${config.numberOfWallets}`);
    console.log(`❌ Failed Buys: ${result.totalFailed}/${config.numberOfWallets}`);
    console.log(`📈 Success Rate: ${((result.totalSuccessful / config.numberOfWallets) * 100).toFixed(1)}%`);

    console.log('\n🔍 Individual Buy Results:');
    result.buyResults.forEach((buyResult: any, index: number) => {
      const status = buyResult.success ? '✅' : '❌';
      const wallet = buyResult.walletAddress.toString().slice(0, 8) + '...';
      console.log(`   ${status} Wallet ${index + 1} (${wallet}): ${buyResult.success ? buyResult.signature?.slice(0, 8) + '...' : buyResult.error}`);
    });

    if (result.totalSuccessful > 0) {
      const avgCost = result.buyResults
        .filter((r: any) => r.success && r.solSpent)
        .reduce((sum: number, r: any) => sum + (r.solSpent || 0), 0) / result.totalSuccessful;
      
      console.log(`\n💸 Average SOL spent per successful buy: ${avgCost.toFixed(6)} SOL`);
    }

    // Explorer links
    console.log('\n🔗 Explorer Links:');
    console.log(`   Token: https://explorer.solana.com/address/${result.tokenMint.toString()}?cluster=devnet`);
    console.log(`   Launch Tx: https://explorer.solana.com/tx/${result.launchSignature}?cluster=devnet`);

    if (result.totalSuccessful === 0) {
      console.log('\n⚠️  No successful buys. Check the errors above.');
    } else {
      console.log('\n🎉 Bundle test completed successfully!');
      console.log('💡 You can now import the wallet private keys into Phantom to access tokens');
      console.log('💡 Run access-bundle-wallets.ts to see wallet details');
    }

  } catch (error) {
    console.error('\n❌ Bundle test failed:', error);
    
    if (error instanceof Error) {
      console.error('📝 Error details:', error.message);
      if (error.stack) {
        console.error('🔍 Stack trace:', error.stack);
      }
    }
  }
}

testDevnetBundleWithTokenCreation()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
