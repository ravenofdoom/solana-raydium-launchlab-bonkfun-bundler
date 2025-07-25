const { Connection, Keypair, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const bs58 = require("bs58");
require('dotenv').config();

/**
 * Wallet System Explanation and Explorer Links
 */
async function explainWalletSystem() {
  console.log("🔍 BonkFun Bundler - Wallet System Explanation");
  console.log("=".repeat(60));
  
  try {
    const connection = new Connection(process.env.RPC_ENDPOINT || "https://api.devnet.solana.com", "confirmed");
    
    // 1. Main Wallet (from .env)
    console.log("\n💼 1. MAIN WALLET (Your Funding Wallet)");
    console.log("-".repeat(40));
    const mainKp = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
    const mainAddress = mainKp.publicKey.toBase58();
    const balance = await connection.getBalance(mainKp.publicKey);
    
    console.log(`Address: ${mainAddress}`);
    console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    console.log(`Purpose: Funds all operations, pays fees, distributes SOL`);
    
    // Explorer links
    const isDevnet = process.env.RPC_ENDPOINT?.includes('devnet');
    const networkParam = isDevnet ? '?cluster=devnet' : '';
    
    console.log("\n🔗 Explorer Links:");
    console.log(`Solscan: https://solscan.io/account/${mainAddress}${networkParam}`);
    console.log(`Solana Explorer: https://explorer.solana.com/address/${mainAddress}${networkParam}`);
    
    // 2. Buyer Wallets (generated)
    console.log("\n👥 2. BUYER WALLETS (Auto-Generated Bundle)");
    console.log("-".repeat(40));
    const walletCount = parseInt(process.env.DISTRIBUTE_WALLET_NUM || "8");
    console.log(`Number of wallets: ${walletCount}`);
    console.log(`Purpose: Simulate different buyers for bundle effect`);
    console.log(`Funding: Each gets ${process.env.DISTRIBUTE_AMOUNTS || '0.001'} SOL from main wallet`);
    console.log(`Security: Private keys ONLY in memory during execution`);
    
    // Generate sample buyer wallets to show addresses
    console.log("\n📋 Sample Buyer Wallet Addresses (these change each run):");
    for (let i = 0; i < Math.min(walletCount, 5); i++) {
      const buyerWallet = Keypair.generate();
      const buyerAddress = buyerWallet.publicKey.toBase58();
      console.log(`  Buyer ${i + 1}: ${buyerAddress}`);
      console.log(`    Solscan: https://solscan.io/account/${buyerAddress}${networkParam}`);
      console.log(`    Explorer: https://explorer.solana.com/address/${buyerAddress}${networkParam}`);
    }
    if (walletCount > 5) {
      console.log(`  ... and ${walletCount - 5} more buyer wallets`);
    }
    
    // 3. Bundle Process
    console.log("\n🎯 3. BUNDLING PROCESS");
    console.log("-".repeat(40));
    console.log("Step 1: Main wallet distributes SOL to all buyer wallets");
    console.log("Step 2: Create new token with main wallet");
    console.log("Step 3: All buyer wallets purchase token simultaneously");
    console.log("Step 4: Bundle transactions together (via Jito on mainnet)");
    console.log("Step 5: Execute bundle for maximum impact");
    
    // 4. Transaction Types
    console.log("\n📊 4. TRANSACTION TYPES & EXPLORER LINKS");
    console.log("-".repeat(40));
    console.log("Distribution Txns: Main → Buyer wallets (SOL transfer)");
    console.log("Token Creation: Create new SPL token");
    console.log("Buy Txns: Buyer wallets → Token purchases");
    console.log("Bundle Txnn: All combined via Jito (mainnet only)");
    
    if (isDevnet) {
      console.log("\n🧪 DEVNET NOTE:");
      console.log("- Jito bundling disabled (devnet doesn't support it)");
      console.log("- Transactions executed individually for testing");
      console.log("- All functionality tested except final bundling");
    } else {
      console.log("\n🚀 MAINNET NOTE:");
      console.log("- Full Jito bundling enabled");
      console.log("- MEV protection active");
      console.log("- Bundle explorer: https://explorer.jito.wtf/");
    }
    
    // 5. Cost Breakdown
    console.log("\n💰 5. COST BREAKDOWN");
    console.log("-".repeat(40));
    const distributionAmount = parseFloat(process.env.DISTRIBUTE_AMOUNTS || "0.001");
    const totalDistribution = distributionAmount * walletCount;
    const estimatedFees = 0.01; // Rough estimate
    const jitoTip = parseFloat(process.env.JITO_TIP_AMOUNT || "0.01");
    const totalCost = totalDistribution + estimatedFees + jitoTip;
    
    console.log(`Distribution to buyers: ${totalDistribution} SOL`);
    console.log(`Transaction fees: ~${estimatedFees} SOL`);
    console.log(`Jito tips: ${jitoTip} SOL`);
    console.log(`Total estimated cost: ${totalCost} SOL`);
    console.log(`Your current balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    if (balance / LAMPORTS_PER_SOL >= totalCost) {
      console.log("✅ Sufficient balance for bundling!");
    } else {
      console.log("⚠️  Need more SOL for bundling operations");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

explainWalletSystem();
