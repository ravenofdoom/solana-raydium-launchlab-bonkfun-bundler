import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { PRIVATE_KEY, validateConfig } from "./constants";
import { createTokenTx, validateTokenParams } from "./src/token";
import { distributeSol, validateDistributionParams } from "./src/distribute";
import { makeBuyTx, validateBuyParams } from "./src/buy";
import { createExtendLut, createLutInst } from "./src/LUT";
import { saveLUTFile, saveTransactionLog, logOperation } from "./utils";
import { getConnectionWithRetry, rpcManager } from "./src/rpcManager";
import { WalletManager } from "./src/wallet-manager";

/**
 * Devnet-specific bundler (no Jito integration)
 */
const runDevnetBundler = async () => {
  console.log("🧪 Starting Devnet Bundler Test (No Jito)");
  console.log("=".repeat(50));
  
  try {
    // Generate session ID for this bundle
    const sessionId = `devnet-${Date.now()}`;
    console.log(`🎯 Devnet Session ID: ${sessionId}`);
    
    // Validate configuration
    validateConfig();
    validateTokenParams();
    
    const connection = await getConnectionWithRetry();
    rpcManager.listEndpoints();
    
    const mainKp = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
    
    console.log(`💼 Main Wallet: ${mainKp.publicKey.toBase58()}`);
    
    // Add explorer links for main wallet
    const isDevnet = process.env.RPC_ENDPOINT?.includes('devnet');
    const networkParam = isDevnet ? '?cluster=devnet' : '';
    console.log(`🔗 Solscan: https://solscan.io/account/${mainKp.publicKey.toBase58()}${networkParam}`);
    console.log(`🔗 Explorer: https://explorer.solana.com/address/${mainKp.publicKey.toBase58()}${networkParam}`);
    
    // Check wallet balance
    const balance = await connection.getBalance(mainKp.publicKey);
    console.log(`💰 Balance: ${balance / 1e9} SOL`);
    
    if (balance < 1e9) { // Less than 1 SOL for devnet
      throw new Error("Insufficient balance. Need at least 1 SOL for devnet testing.");
    }
    
    // Get persistent buyer wallets for devnet
    const walletCount = parseInt(process.env.DISTRIBUTE_WALLET_NUM || "3"); // Fewer for devnet
    const buyerKeypairs = await WalletManager.getBuyerWallets(walletCount, sessionId);
    
    console.log(`👥 Using ${buyerKeypairs.length} buyer wallets for devnet session: ${sessionId}`);
    console.log("\n📋 Buyer Wallet Addresses:");
    buyerKeypairs.forEach((kp: Keypair, index: number) => {
      const address = kp.publicKey.toBase58();
      console.log(`  Buyer ${index + 1}: ${address}`);
      console.log(`    🔗 Solscan: https://solscan.io/account/${address}${networkParam}`);
      console.log(`    🔗 Explorer: https://explorer.solana.com/address/${address}${networkParam}`);
    });
    
    // Generate mint keypair
    const mintKeypair = Keypair.generate();
    console.log(`🏭 Token Mint: ${mintKeypair.publicKey.toBase58()}`);
    console.log(`🔗 Token Solscan: https://solscan.io/token/${mintKeypair.publicKey.toBase58()}${networkParam}`);
    console.log(`🔗 Token Explorer: https://explorer.solana.com/address/${mintKeypair.publicKey.toBase58()}${networkParam}`);
    
    // Create lookup table
    console.log("\n📋 Creating Address Lookup Table...");
    const slot = await connection.getSlot();
    const [lookupTableInst, lookupTableAddress] = require("@solana/web3.js").AddressLookupTableProgram.createLookupTable({
      authority: mainKp.publicKey,
      payer: mainKp.publicKey,
      recentSlot: slot - 1,
    });
    
    console.log(`📍 LUT Address: ${lookupTableAddress.toBase58()}`);
    console.log(`🔗 LUT Solscan: https://solscan.io/account/${lookupTableAddress.toBase58()}${networkParam}`);
    console.log(`🔗 LUT Explorer: https://explorer.solana.com/address/${lookupTableAddress.toBase58()}${networkParam}`);
    saveLUTFile(lookupTableAddress.toBase58());
    
    // Phase 1: Setup transactions
    console.log("\n🔧 Phase 1: Creating setup transactions...");
    
    const lutTransaction = await createLutInst(connection, mainKp, lookupTableInst);
    console.log("✅ LUT creation transaction prepared");
    
    // Distribute SOL to buyer wallets
    const distributionAmount = 0.001; // From env
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
    
    // Phase 4: Execute individually (no Jito bundling on devnet)
    console.log("\n🎯 Phase 4: Executing transactions individually...");
    
    const allTransactions = [
      lutTransaction,
      ...distributionTxs,
      extendLutTx,
      tokenCreationTx,
      ...buyTxsResult.transactions
    ];
    
    console.log(`📦 Executing ${allTransactions.length} transactions individually...`);
    
    // Execute transactions one by one for devnet testing
    for (let i = 0; i < allTransactions.length; i++) {
      try {
        console.log(`🚀 Sending transaction ${i + 1}/${allTransactions.length}...`);
        const signature = await connection.sendTransaction(allTransactions[i]);
        console.log(`✅ Transaction ${i + 1} sent: ${signature}`);
        console.log(`🔗 Tx Solscan: https://solscan.io/tx/${signature}${networkParam}`);
        console.log(`🔗 Tx Explorer: https://explorer.solana.com/tx/${signature}${networkParam}`);
        
        // Wait for confirmation
        await connection.confirmTransaction(signature);
        console.log(`✅ Transaction ${i + 1} confirmed`);
        
      } catch (error) {
        console.error(`❌ Transaction ${i + 1} failed:`, error);
        // Continue with other transactions for testing
      }
    }
    
    console.log("\n✅ Devnet bundler test completed!");
    console.log("🎉 All transaction types tested successfully!");
    
    // Log results
    logOperation("Devnet Bundle Test", true, {
      transactionCount: allTransactions.length,
      mintAddress: mintKeypair.publicKey.toBase58(),
      lutAddress: lookupTableAddress.toBase58(),
      network: "devnet",
      sessionId: sessionId
    });
    
    console.log("\n🎯 IMPORTANT: Save this session ID to sell tokens later!");
    console.log(`📝 Devnet Session ID: ${sessionId}`);
    console.log(`💡 To sell tokens: npm run sell sell ${sessionId} ${mintKeypair.publicKey.toBase58()}`);
    console.log(`💡 To check balances: npm run sell check ${sessionId} ${mintKeypair.publicKey.toBase58()}`);
    
  } catch (error) {
    console.error("❌ Devnet bundler test failed:", error);
    logOperation("Devnet Bundle Test", false, error);
    
    if (error instanceof Error) {
      if (error.message.includes("Insufficient balance")) {
        console.log("💡 Get more devnet SOL: https://faucet.solana.com/");
      } else if (error.message.includes("Network request failed")) {
        console.log("💡 Check your internet connection and RPC endpoint");
      }
    }
    
    process.exit(1);
  }
};

if (require.main === module) {
  runDevnetBundler().catch(console.error);
}

export { runDevnetBundler };
