const { Connection, PublicKey, LAMPORTS_PER_SOL } = require("@solana/web3.js");

/**
 * Get devnet SOL for testing
 */
async function getDevnetSOL() {
  const walletAddress = "HZtxigpGYaafBbUF1cVJxUdRcjKmb2qrDqk8jjJYcz5M";
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  const { Connection, Keypair, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const bs58 = require("bs58");
require('dotenv').config();

/**
 * Get devnet SOL for testing
 */
async function getDevnetSOL() {
  try {
    console.log("💰 Getting Devnet SOL for testing...");
    
    // Connect to devnet
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    
    // Get wallet from private key
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY not found in .env file");
    }
    
    const wallet = Keypair.fromSecretKey(bs58.decode(privateKey));
    const walletAddress = wallet.publicKey.toBase58();
    
    console.log(`🔑 Wallet Address: ${walletAddress}`);
    
    // Check current balance
    const balanceBefore = await connection.getBalance(wallet.publicKey);
    console.log(`💳 Current Balance: ${(balanceBefore / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    
    // Request airdrop (max 2 SOL per request)
    console.log("🚁 Requesting devnet SOL airdrop...");
    
    const airdropAmount = 2 * LAMPORTS_PER_SOL; // 2 SOL
    const signature = await connection.requestAirdrop(wallet.publicKey, airdropAmount);
    
    console.log(`📋 Airdrop Transaction: ${signature}`);
    console.log("⏳ Waiting for confirmation...");
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, "confirmed");
    
    // Check new balance
    const balanceAfter = await connection.getBalance(wallet.publicKey);
    console.log(`💰 New Balance: ${(balanceAfter / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    console.log(`✅ Added: ${((balanceAfter - balanceBefore) / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    
    // Calculate bundle requirements
    const distributeAmount = parseFloat(process.env.DISTRIBUTE_AMOUNTS || "0.001");
    const walletNum = parseInt(process.env.DISTRIBUTE_WALLET_NUM || "8");
    const jitorTip = parseFloat(process.env.JITO_TIP_AMOUNT || "0.003");
    
    const totalNeeded = (distributeAmount * walletNum) + jitorTip + 0.01; // +0.01 for fees
    
    console.log("📊 Bundle Requirements Analysis:");
    console.log(`   ${walletNum} wallets × ${distributeAmount} SOL = ${(distributeAmount * walletNum).toFixed(4)} SOL`);
    console.log(`   Jito tip: ${jitorTip} SOL`);
    console.log(`   Transaction fees: ~0.01 SOL`);
    console.log(`   Total needed: ~${totalNeeded.toFixed(4)} SOL`);
    console.log(`   You have: ${(balanceAfter / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    
    if (balanceAfter >= totalNeeded * LAMPORTS_PER_SOL) {
      console.log("✅ Sufficient balance for bundle testing!");
      return true;
    } else {
      console.log("⚠️  May need more SOL for testing. Run this script again if needed.");
      return false;
    }
    
  } catch (error) {
    console.error("❌ Error getting devnet SOL:", error.message);
    
    if (error.message.includes("airdrop")) {
      console.log("💡 Alternative options:");
      console.log("1. Wait 24 hours and try again (airdrop limits)");
      console.log("2. Use web faucet: https://faucet.solana.com/");
      console.log("3. Try different devnet faucets");
    }
    
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  getDevnetSOL()
    .then(success => {
      if (success) {
        console.log("🚀 Ready to run: npm start");
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = { getDevnetSOL };
  console.log(`📍 Wallet: ${walletAddress}`);
  console.log("🌐 Network: Devnet");
  
  try {
    // Check current balance
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    console.log(`💰 Current Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    // Request airdrop (max 2 SOL per request on devnet)
    console.log("\n🚁 Requesting devnet airdrop...");
    
    const airdropSignature = await connection.requestAirdrop(
      publicKey,
      2 * LAMPORTS_PER_SOL // 2 SOL
    );
    
    console.log(`📝 Airdrop signature: ${airdropSignature}`);
    
    // Wait for confirmation
    await connection.confirmTransaction(airdropSignature);
    
    // Check new balance
    const newBalance = await connection.getBalance(publicKey);
    console.log(`✅ New Balance: ${newBalance / LAMPORTS_PER_SOL} SOL`);
    
    const needed = 8 * 0.001 + 0.01; // 8 wallets × 0.001 + fees
    if (newBalance / LAMPORTS_PER_SOL >= needed) {
      console.log(`🎉 Sufficient balance for bundle test! (Need: ${needed} SOL)`);
    } else {
      console.log(`⚠️  Need more SOL. Required: ${needed}, Have: ${newBalance / LAMPORTS_PER_SOL}`);
      console.log("💡 Run this script again to get more SOL");
    }
    
  } catch (error) {
    console.error("❌ Error getting devnet SOL:", error.message);
    
    if (error.message.includes("airdrop request failed")) {
      console.log("\n💡 Alternative methods to get devnet SOL:");
      console.log("1. Use web faucet: https://faucet.solana.com/");
      console.log("2. Use SolFaucet: https://solfaucet.com/");
      console.log("3. Wait a few minutes and try again");
      console.log(`4. Use this address: ${walletAddress}`);
    }
  }
}

// Alternative: Show manual methods
function showManualMethods() {
  const walletAddress = "HZtxigpGYaafBbUF1cVJxUdRcjKmb2qrDqk8jjJYcz5M";
  
  console.log("\n🌐 Alternative: Get Devnet SOL Manually");
  console.log("=".repeat(50));
  console.log("1. 🔗 Visit: https://faucet.solana.com/");
  console.log("2. 🔗 Or visit: https://solfaucet.com/");
  console.log(`3. 📋 Enter this address: ${walletAddress}`);
  console.log("4. 🚁 Request airdrop (usually 1-2 SOL per request)");
  console.log("5. ⏱️  Wait a few seconds for confirmation");
  console.log("6. 🔄 Repeat until you have 5+ SOL for testing");
  
  console.log("\n📊 For Bundle Testing You Need:");
  console.log("- 8 wallets × 0.001 SOL = 0.008 SOL");
  console.log("- Transaction fees ≈ 0.01 SOL");
  console.log("- Jito tips = 0.003 SOL");
  console.log("- Buffer for safety = 1+ SOL");
  console.log("📈 Total Recommended: 2-5 SOL");
}

if (require.main === module) {
  console.log("🧪 Devnet SOL Request Tool");
  console.log("=".repeat(40));
  
  getDevnetSOL()
    .then(() => {
      showManualMethods();
      process.exit(0);
    })
    .catch(error => {
      console.error("Error:", error);
      showManualMethods();
      process.exit(1);
    });
}

module.exports = { getDevnetSOL };
