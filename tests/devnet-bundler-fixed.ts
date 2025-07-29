import { Connection, Keypair, PublicKey, AddressLookupTableProgram } from "@solana/web3.js";
import bs58 from "bs58";
import * as fs from "fs";
import * as path from "path";
import { PRIVATE_KEY, validateConfig } from "../constants";
import { createTokenTx } from "../src/token";
import { distributeSol } from "../src/distribute";
import { makeBuyTx } from "../src/buy";
import { createExtendLut, createLutInst } from "../src/LUT";
import { saveTransactionLog } from "../utils";
import { getConnectionWithRetry } from "../src/rpcManager";

// Load environment variables
require('dotenv').config();

interface TransactionResult {
  signature: string;
  timestamp: number;
  status: string;
  explorerLink: string;
}

/**
 * Simple devnet bundler test
 */
async function devnetBundler() {
  console.log("🚀 Starting Devnet Bundler Test...\n");
  
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize connection
    const connection = await getConnectionWithRetry();
    const slot = await connection.getSlot();
    console.log(`📡 Connected to Solana devnet (slot: ${slot})`);
    
    // Initialize main wallet
    const mainWallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
    const mainBalance = await connection.getBalance(mainWallet.publicKey);
    console.log(`💼 Main Wallet: ${mainWallet.publicKey.toString()}`);
    console.log(`💰 Balance: ${(mainBalance / 1e9).toFixed(6)} SOL`);
    
    if (mainBalance < 0.1 * 1e9) {
      throw new Error("Insufficient balance. Need at least 0.1 SOL for testing.");
    }
    
    // Create session ID for devnet
    const sessionId = `devnet-${Date.now()}`;
    console.log(`🎯 Bundle Session ID: ${sessionId}`);
    
    // Generate 3 buyer wallets for devnet testing
    const buyerKeypairs: Keypair[] = [];
    for (let i = 0; i < 3; i++) {
      buyerKeypairs.push(Keypair.generate());
    }
    
    console.log(`👥 Generated ${buyerKeypairs.length} buyer wallets:`);
    buyerKeypairs.forEach((kp, index) => {
      console.log(`   Buyer ${index + 1}: ${kp.publicKey.toString()}`);
    });
    
    // Create token first
    console.log("\n🪙 Creating Test Token...");
    const tokenKeypair = Keypair.generate();
    const tokenTx = await createTokenTx(
      connection,
      mainWallet,
      tokenKeypair
    );
    
    tokenTx.sign([mainWallet, tokenKeypair]);
    const tokenSignature = await connection.sendTransaction(tokenTx, {
      skipPreflight: false,
      preflightCommitment: "confirmed"
    });
    
    console.log(`✅ Token created: ${tokenKeypair.publicKey.toString()}`);
    console.log(`🔗 Token Explorer: https://explorer.solana.com/address/${tokenKeypair.publicKey.toString()}?cluster=devnet`);
    console.log(`🔗 Transaction: https://explorer.solana.com/tx/${tokenSignature}?cluster=devnet`);
    
    await connection.confirmTransaction(tokenSignature, "confirmed");
    
    // Create lookup table
    console.log("\n📋 Creating Address Lookup Table...");
    const [createLutInstruction, lookupTableAddress] = AddressLookupTableProgram.createLookupTable({
      authority: mainWallet.publicKey,
      payer: mainWallet.publicKey,
      recentSlot: await connection.getSlot(),
    });
    
    const lutTx = await createLutInst(
      connection,
      mainWallet,
      createLutInstruction
    );
    
    // Sign and send LUT creation transaction
    lutTx.sign([mainWallet]);
    const lutSignature = await connection.sendTransaction(lutTx, {
      skipPreflight: false,
      preflightCommitment: "confirmed"
    });
    
    console.log(`✅ LUT created: ${lutSignature}`);
    console.log(`🔗 Explorer: https://explorer.solana.com/tx/${lutSignature}?cluster=devnet`);
    
    // Wait for confirmation
    await connection.confirmTransaction(lutSignature, "confirmed");
    
    // Extend LUT with buyer addresses and token mint
    const buyerPubkeys = buyerKeypairs.map(kp => kp.publicKey);
    const extendTx = await createExtendLut(
      connection,
      mainWallet,
      lookupTableAddress,
      buyerPubkeys,
      tokenKeypair.publicKey
    );
    
    extendTx.sign([mainWallet]);
    const extendSignature = await connection.sendTransaction(extendTx, {
      skipPreflight: false,
      preflightCommitment: "confirmed"
    });
    
    console.log(`✅ LUT extended: ${extendSignature}`);
    await connection.confirmTransaction(extendSignature, "confirmed");
    
    // Distribute SOL to buyer wallets
    console.log("\n💸 Distributing SOL to buyer wallets...");
    const distributeTxs = await distributeSol(
      connection,
      mainWallet,
      buyerKeypairs,
      0.001 // 0.001 SOL per wallet for devnet
    );
    
    // Send all distribution transactions
    for (let i = 0; i < distributeTxs.length; i++) {
      const distributeTx = distributeTxs[i];
      distributeTx.sign([mainWallet]);
      const distributeSignature = await connection.sendTransaction(distributeTx, {
        skipPreflight: false,
        preflightCommitment: "confirmed"
      });
      console.log(`✅ SOL distributed (batch ${i + 1}/${distributeTxs.length}): ${distributeSignature}`);
      console.log(`🔗 Explorer: https://explorer.solana.com/tx/${distributeSignature}?cluster=devnet`);
      await connection.confirmTransaction(distributeSignature, "confirmed");
    }
    
    // Create buy transactions
    console.log("\n🛒 Creating buy transactions...");
    const { transactions: buyTxs } = await makeBuyTx(
      connection,
      tokenKeypair,
      buyerKeypairs,
      lookupTableAddress,
      0.0005 // Small purchase amount for devnet
    );
    
    // Execute buy transactions
    const transactionResults: TransactionResult[] = [];
    
    for (let i = 0; i < buyTxs.length; i++) {
      const tx = buyTxs[i];
      const buyerWallet = buyerKeypairs[i];
      
      tx.sign([buyerWallet]);
      
      try {
        const signature = await connection.sendTransaction(tx, {
          skipPreflight: false,
          preflightCommitment: "confirmed"
        });
        
        const timestamp = Date.now();
        const explorerLink = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
        
        console.log(`✅ Buy transaction ${i + 1}: ${signature}`);
        console.log(`🔗 Explorer: ${explorerLink}`);
        
        transactionResults.push({
          signature,
          timestamp,
          status: "sent",
          explorerLink
        });
        
        // Wait for confirmation
        await connection.confirmTransaction(signature, "confirmed");
        transactionResults[i].status = "confirmed";
        
      } catch (error) {
        console.error(`❌ Buy transaction ${i + 1} failed:`, error);
        transactionResults.push({
          signature: "failed",
          timestamp: Date.now(),
          status: "failed",
          explorerLink: "N/A"
        });
      }
    }
    
    // Save transaction log
    const signatures = transactionResults
      .filter(tx => tx.signature !== "failed")
      .map(tx => tx.signature);
    
    saveTransactionLog(signatures, "devnet-bundle");
    
    // Also save detailed session data
    const sessionData = {
      sessionId,
      tokenMint: tokenKeypair.publicKey.toString(),
      buyerWallets: buyerKeypairs.map(kp => kp.publicKey.toString()),
      transactions: transactionResults,
      network: "devnet",
      timestamp: new Date().toISOString()
    };
    
    const sessionDir = path.join(process.cwd(), "data", "sessions");
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    
    const sessionFile = path.join(sessionDir, `session-${sessionId}.json`);
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
    
    // Final balance check
    const finalBalance = await connection.getBalance(mainWallet.publicKey);
    const spent = (mainBalance - finalBalance) / 1e9;
    
    console.log("\n🎉 Devnet Bundle Test Complete!");
    console.log(`💰 SOL spent: ${spent.toFixed(6)} SOL`);
    console.log(`💰 Remaining balance: ${(finalBalance / 1e9).toFixed(6)} SOL`);
    console.log(`📝 Session ID: ${sessionId}`);
    console.log(`🪙 Token Mint: ${tokenKeypair.publicKey.toString()}`);
    
    console.log("\n🔗 Explorer Links Summary:");
    transactionResults.forEach((result, index) => {
      if (result.status === "confirmed") {
        console.log(`   Buy ${index + 1}: ${result.explorerLink}`);
      }
    });
    
    console.log("\n✅ Devnet bundler test completed successfully!");
    
  } catch (error) {
    console.error("❌ Devnet bundler test failed:", error);
    process.exit(1);
  }
}

// Run the bundler
devnetBundler().catch(console.error);
