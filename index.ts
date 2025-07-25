import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { PRIVATE_KEY, validateConfig } from "./constants";
import { createTokenTx, validateTokenParams } from "./src/token";
import { distributeSol, validateDistributionParams } from "./src/distribute";
import { makeBuyTx, validateBuyParams } from "./src/buy";
import { createExtendLut, createLutInst } from "./src/LUT";
import { sendBundleByLilJit, validateBundle } from "./executor/liljit";
import { saveLUTFile, saveTransactionLog, logOperation } from "./utils";
import { getConnectionWithRetry, rpcManager } from "./src/rpcManager";
import { SecureWalletManager, performSecurityAudit } from "./src/secureWallet";

/**
 * Main entry point for the BonkFun bundler
 */
const runBundler = async () => {
  console.log("🚀 Starting BonkFun/Raydium Bundler with MEV Protection");
  try {
    // Perform security audit first
    console.log("🔒 Performing security audit...");
    performSecurityAudit();
    
    // Validate configuration
    validateConfig();
    validateTokenParams();
    
    const connection = await getConnectionWithRetry();
    rpcManager.listEndpoints();
    
    const mainKp = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
    
    console.log(`💼 Main Wallet: ${mainKp.publicKey.toBase58()}`);
    
    // Check wallet balance
    const balance = await connection.getBalance(mainKp.publicKey);
    console.log(`💰 Balance: ${balance / 1e9} SOL`);
    
    if (balance < 5e9) { // Less than 5 SOL
      throw new Error("Insufficient balance. Need at least 5 SOL for bundling operations.");
    }
    
    // Initialize secure wallet manager
    const walletManager = new SecureWalletManager();
    const walletCount = 16;
    
    // Generate buyer wallets securely (private keys only in memory)
    const buyerWalletInfo = walletManager.generateBuyerWallets(walletCount);
    const buyerKeypairs = walletManager.getAllKeypairs();
    
    console.log(`👥 Generated ${buyerKeypairs.length} buyer wallets securely`);
    
    console.log(`👥 Generated ${buyerKeypairs.length} buyer wallets`);
    
    // Generate mint keypair
    const mintKeypair = Keypair.generate();
    console.log(`🏭 Token Mint: ${mintKeypair.publicKey.toBase58()}`);
    
    // Create lookup table
    console.log("\n📋 Creating Address Lookup Table...");
    const slot = await connection.getSlot();
    const [lookupTableInst, lookupTableAddress] = require("@solana/web3.js").AddressLookupTableProgram.createLookupTable({
      authority: mainKp.publicKey,
      payer: mainKp.publicKey,
      recentSlot: slot - 1,
    });
    
    console.log(`📍 LUT Address: ${lookupTableAddress.toBase58()}`);
    saveLUTFile(lookupTableAddress.toBase58());
    
    // Phase 1: Setup transactions
    console.log("\n🔧 Phase 1: Creating setup transactions...");
    
    const lutTransaction = await createLutInst(connection, mainKp, lookupTableInst);
    console.log("✅ LUT creation transaction prepared");
    
    // Distribute SOL to buyer wallets
    const distributionAmount = 0.05; // SOL per wallet
    validateDistributionParams(buyerKeypairs, distributionAmount);
    
    const distributionTxs = await distributeSol(connection, mainKp, buyerKeypairs, distributionAmount);
    console.log("✅ Distribution transactions prepared");
    
    // Extend LUT with addresses
    const buyerPubkeys = buyerKeypairs.map(kp => kp.publicKey);
    const extendLutTx = await createExtendLut(
      connection,
      mainKp,
      lookupTableAddress,
      buyerPubkeys,
      mintKeypair.publicKey
    );
    console.log("✅ LUT extension transaction prepared");
    
    // Phase 2: Token creation
    console.log("\n🪙 Phase 2: Creating token...");
    const tokenCreationTx = await createTokenTx(connection, mainKp, mintKeypair);
    console.log("✅ Token creation transaction prepared");
    
    // Phase 3: Buy transactions
    console.log("\n💰 Phase 3: Creating buy transactions...");
    validateBuyParams(mintKeypair.publicKey, buyerKeypairs, distributionAmount);
    
    const buyTxsResult = await makeBuyTx(
      connection,
      mintKeypair,
      buyerKeypairs,
      lookupTableAddress,
      distributionAmount
    );
    console.log("✅ Buy transactions prepared");
    
    // Phase 4: Bundle and execute
    console.log("\n🎯 Phase 4: Bundling and execution...");
    
    // Prepare final bundle
    const bundleTransactions = [
      tokenCreationTx,
      ...buyTxsResult.transactions
    ];
    
    // Validate bundle before sending
    if (!validateBundle(bundleTransactions)) {
      throw new Error("Bundle validation failed");
    }
    
    console.log(`📦 Bundle contains ${bundleTransactions.length} transactions`);
    
    // Send bundle via Jito
    console.log("🚀 Sending bundle via Jito...");
    const bundleId = await sendBundleByLilJit(bundleTransactions);
    
    // Log successful execution
    const signatures = bundleTransactions.map(tx => bs58.encode(tx.signatures[0]));
    saveTransactionLog(signatures, "bundle");
    
    logOperation("Bundle Execution", true, {
      bundleId,
      transactionCount: bundleTransactions.length,
      mintAddress: mintKeypair.publicKey.toBase58(),
      lutAddress: lookupTableAddress.toBase58()
    });
    
    console.log("\n✅ BonkFun bundler completed successfully!");
    
    // Securely clear wallets from memory
    walletManager.clearWallets();
    
    console.log("\n✅ BonkFun bundler completed successfully!");
    
  } catch (error) {
    console.error("❌ Bundler execution failed:", error);
    logOperation("Bundle Execution", false, error);
    process.exit(1);
  }
};

if (require.main === module) {
  runBundler().catch(console.error);
}

export { runBundler };
