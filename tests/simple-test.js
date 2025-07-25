const { Connection, Keypair, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const bs58 = require("bs58");
require('dotenv').config();

/**
 * Simple devnet connectivity test
 */
async function simpleTest() {
  console.log("🧪 Simple Devnet Test");
  console.log("=".repeat(30));
  
  try {
    // 1. Check environment
    console.log("1️⃣ Checking environment...");
    console.log(`   RPC: ${process.env.RPC_ENDPOINT}`);
    console.log(`   Private Key: ${process.env.PRIVATE_KEY ? 'Set ✅' : 'Missing ❌'}`);
    
    // 2. Test RPC connection
    console.log("\n2️⃣ Testing RPC connection...");
    const connection = new Connection(process.env.RPC_ENDPOINT || "https://api.devnet.solana.com", "confirmed");
    
    // Get slot height (quick test)
    const slot = await connection.getSlot();
    console.log(`   Current slot: ${slot} ✅`);
    
    // 3. Test wallet
    console.log("\n3️⃣ Testing wallet...");
    const keypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
    console.log(`   Address: ${keypair.publicKey.toBase58()}`);
    
    // Get balance
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`   Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    if (balance > 0) {
      console.log("   Balance check: ✅");
    } else {
      console.log("   Balance check: ❌ (Need devnet SOL)");
    }
    
    console.log("\n✅ Basic connectivity test passed!");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error instanceof Error ? error.message : error);
  }
}

simpleTest();
