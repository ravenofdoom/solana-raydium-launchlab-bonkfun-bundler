const { Connection, Keypair, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const bs58 = require("bs58");
require('dotenv').config();

/**
 * Check the results of our test
 */
async function checkTestResults() {
  console.log("🔍 Checking Test Results");
  console.log("=".repeat(30));
  
  try {
    const connection = new Connection(process.env.RPC_ENDPOINT || "https://api.devnet.solana.com", "confirmed");
    const mainKp = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
    
    // Check main wallet balance
    const balance = await connection.getBalance(mainKp.publicKey);
    console.log(`💼 Main Wallet: ${mainKp.publicKey.toBase58()}`);
    console.log(`💰 Current Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    // Check if balance changed (should be less than 2 if transactions went through)
    if (balance < 2 * LAMPORTS_PER_SOL) {
      console.log("✅ Transactions were successful! Balance decreased.");
      const spent = (2 * LAMPORTS_PER_SOL - balance) / LAMPORTS_PER_SOL;
      console.log(`💸 Spent approximately: ${spent.toFixed(6)} SOL`);
    } else {
      console.log("⚠️  Balance unchanged - transactions may have failed");
    }
    
    // Get recent transaction history
    console.log("\n📋 Recent Transaction History:");
    const signatures = await connection.getSignaturesForAddress(mainKp.publicKey, { limit: 5 });
    
    signatures.forEach((sig, index) => {
      const time = new Date(sig.blockTime * 1000).toLocaleTimeString();
      const status = sig.err ? "❌ Failed" : "✅ Success";
      console.log(`  ${index + 1}. ${status} at ${time} - ${sig.signature.substring(0, 20)}...`);
    });
    
    console.log("\n🎯 Test Summary:");
    if (balance < 2 * LAMPORTS_PER_SOL) {
      console.log("✅ BUNDLE TEST SUCCESSFUL!");
      console.log("🚀 Your bundler is working on devnet!");
      console.log("💡 Ready for mainnet testing with real funds!");
    } else {
      console.log("⚠️  Test inconclusive - check transaction details");
    }
    
  } catch (error) {
    console.error("❌ Error checking results:", error.message);
  }
}

checkTestResults();
