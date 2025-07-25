import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();

async function quickDevnetTest() {
  console.log("🧪 Quick Devnet Connection Test");
  console.log("================================");
  
  try {
    // Test environment loading
    console.log("📋 Environment Configuration:");
    console.log(`RPC_ENDPOINT: ${process.env.RPC_ENDPOINT}`);
    console.log(`DISTRIBUTE_WALLET_NUM: ${process.env.DISTRIBUTE_WALLET_NUM}`);
    console.log(`DISTRIBUTE_AMOUNTS: ${process.env.DISTRIBUTE_AMOUNTS}`);
    console.log(`TOKEN_NAME: ${process.env.TOKEN_NAME}`);
    console.log(`TOKEN_SYMBOL: ${process.env.TOKEN_SYMBOL}`);
    
    // Test RPC connection
    console.log("\n🌐 Testing RPC Connection...");
    const connection = new Connection(process.env.RPC_ENDPOINT || "https://api.devnet.solana.com", 'confirmed');
    
    // Test wallet loading
    console.log("\n🔑 Testing Wallet...");
    const mainKp = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));
    console.log(`Wallet Address: ${mainKp.publicKey.toBase58()}`);
    
    // Test balance
    console.log("\n💰 Checking Balance...");
    const balance = await connection.getBalance(mainKp.publicKey);
    console.log(`Balance: ${balance / 1e9} SOL`);
    
    // Test network info
    console.log("\n🌐 Network Info...");
    const version = await connection.getVersion();
    console.log(`Solana Core: ${version['solana-core']}`);
    
    const slot = await connection.getSlot();
    console.log(`Current Slot: ${slot}`);
    
    if (balance < 1e9) {
      console.log("⚠️  WARNING: Low balance detected");
      console.log("💡 Get more devnet SOL from: https://faucet.solana.com/");
    }
    
    console.log("\n✅ All tests passed! Ready for bundling.");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    
    if (error instanceof Error && error.message.includes("Invalid private key")) {
      console.log("💡 Check your PRIVATE_KEY in .env file");
    } else if (error instanceof Error && error.message.includes("fetch")) {
      console.log("💡 Check your RPC_ENDPOINT in .env file");
    }
  }
}

quickDevnetTest();
