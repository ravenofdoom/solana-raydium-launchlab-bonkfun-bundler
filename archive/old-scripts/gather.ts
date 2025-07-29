import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { RPC_ENDPOINT, PRIVATE_KEY, validateConfig } from "./constants";
import { saveWalletInfo } from "./utils";

/**
 * Gathers and generates wallets for the bundler operation
 */
const gatherWallets = async () => {
  try {
    console.log("🔧 Starting wallet generation process...");
    
    // Validate configuration
    validateConfig();
    
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const mainKp = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
    
    console.log(`💼 Main wallet: ${mainKp.publicKey.toBase58()}`);
    
    // Check main wallet balance
    const balance = await connection.getBalance(mainKp.publicKey);
    console.log(`💰 Main wallet balance: ${balance / 1e9} SOL`);
    
    if (balance < 1e9) { // Less than 1 SOL
      console.warn("⚠️  Warning: Main wallet has low balance. Consider adding more SOL.");
    }
    
    // Generate buyer wallets
    const walletCount = 16; // Default number of wallets
    const buyerWallets = [];
    
    for (let i = 0; i < walletCount; i++) {
      const wallet = Keypair.generate();
      buyerWallets.push({
        publicKey: wallet.publicKey.toBase58(),
        privateKey: bs58.encode(wallet.secretKey),
        index: i
      });
    }
    
    console.log(`🎯 Generated ${buyerWallets.length} buyer wallets`);
    
    // Save wallet information (excluding private keys for security)
    const safeWalletInfo = buyerWallets.map(w => ({ publicKey: w.publicKey }));
    saveWalletInfo(safeWalletInfo);
    
    // Display wallet information
    console.log("\n📋 Generated Wallets:");
    console.log("=".repeat(60));
    buyerWallets.forEach((wallet, index) => {
      console.log(`Wallet ${index + 1}: ${wallet.publicKey}`);
    });
    console.log("=".repeat(60));
    
    console.log("\n✅ Wallet generation completed successfully!");
    console.log("🔐 Private keys generated but not displayed for security");
    console.log("📁 Wallet information saved to data directory");
    
  } catch (error) {
    console.error("❌ Error in wallet gathering:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  gatherWallets().catch(console.error);
}

export { gatherWallets };
