import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import { BonkFunService } from '../src/bonkfun-service';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test real BonkFun integration with existing token
 * Uses the example token from your working transaction
 */
async function testRealBonkFun() {
  console.log('🔥 Testing Real BonkFun Integration');
  console.log('===================================\n');

  // Setup connection (mainnet for real BonkFun tokens)
  const connection = new Connection(
    process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com',
    'confirmed'
  );

  console.log(`🌐 Connected to: ${connection.rpcEndpoint}`);

  // Setup test wallet from your environment
  let testWallet: Keypair;
  try {
    if (process.env.PRIVATE_KEY) {
      // Try base58 format first (most common)
      if (process.env.PRIVATE_KEY.startsWith('[')) {
        // JSON array format
        testWallet = Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.PRIVATE_KEY)));
      } else {
        // Base58 format
        const bs58 = require('bs58');
        testWallet = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
      }
    } else {
      testWallet = Keypair.generate();
    }
  } catch (error) {
    console.log(`⚠️ Error parsing PRIVATE_KEY: ${error}. Using generated wallet.`);
    testWallet = Keypair.generate();
  }

  console.log(`🔑 Test wallet: ${testWallet.publicKey.toString()}`);

  // Check wallet balance
  const balance = await connection.getBalance(testWallet.publicKey);
  console.log(`💰 Wallet balance: ${(balance / 1e9).toFixed(4)} SOL`);

  if (balance < 0.01 * 1e9) {
    console.log('⚠️  Wallet needs more SOL for testing');
    console.log('💡 Please fund the wallet for testing real BonkFun transactions');
    return;
  }

  try {
    // Initialize BonkFun service
    const bonkFunService = new BonkFunService(connection, 'tech');

    // Get example token
    const exampleToken = bonkFunService.getExampleToken();
    console.log(`\n🎯 Testing with example token: ${exampleToken.toString()}`);

    // Verify it's a valid BonkFun token
    const isValid = await bonkFunService.isValidBonkFunToken(exampleToken);
    if (!isValid) {
      console.log('❌ Example token is not valid or pool doesn\'t exist');
      return;
    }

    console.log('✅ Token verification passed!');

    // Create buy instructions (but don't execute yet)
    console.log('\n🔨 Creating buy instructions...');
    const { instructions, signers } = await bonkFunService.createBuyInstructions(
      testWallet.publicKey,
      {
        tokenMint: exampleToken,
        solAmount: 0.005, // Minimum amount
        slippage: 0.05
      }
    );

    console.log(`✅ Created ${instructions.length} instructions`);
    console.log(`🔑 Additional signers needed: ${signers.length}`);

    // Show instruction details
    instructions.forEach((ix, index) => {
      console.log(`   Instruction ${index + 1}: ${ix.programId.toString()} (${ix.data.length} bytes)`);
    });

    console.log('\n🎉 Real BonkFun integration test passed!');
    console.log('💡 Instructions created successfully - ready for bundle execution');

    // Estimate transaction size
    const totalInstructions = instructions.length;
    const estimatedSize = totalInstructions * 100; // Rough estimate
    console.log(`📏 Estimated transaction size: ~${estimatedSize} bytes`);

  } catch (error) {
    console.error('\n❌ BonkFun integration test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

// Run the test
if (require.main === module) {
  testRealBonkFun()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { testRealBonkFun };
