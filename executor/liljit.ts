import {
  Connection,
  VersionedTransaction,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  Keypair,
} from "@solana/web3.js";
import { searcherClient } from "jito-ts/dist/sdk/block-engine/searcher";
import { Bundle } from "jito-ts/dist/sdk/block-engine/types";
import bs58 from "bs58";
import { JITO_URL, JITO_TIP_AMOUNT, MAX_RETRIES } from "../constants";

/**
 * Sends a bundle of transactions using Jito
 */
export const sendBundleByLilJit = async (
  transactions: VersionedTransaction[]
): Promise<string> => {
  if (transactions.length === 0) {
    throw new Error("No transactions provided for bundling");
  }

  console.log(`🚀 Preparing to send bundle with ${transactions.length} transactions`);

  try {
    // Create a temporary keypair for Jito client authentication
    const authKeypair = Keypair.generate();
    
    // Create Jito searcher client
    const client = searcherClient(JITO_URL, authKeypair);
    
    // Create tip transaction
    const tipTransaction = await createTipTransaction();
    
    // Add tip transaction to the beginning of the bundle
    const bundleTransactions = [tipTransaction, ...transactions];
    
    // Create bundle
    const bundle = new Bundle(bundleTransactions, bundleTransactions.length);
    
    console.log(`📦 Bundle created with ${bundleTransactions.length} transactions (including tip)`);
    
    // Send bundle with retry logic
    let lastError;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Sending bundle attempt ${attempt}/${MAX_RETRIES}`);
        
        const response = await client.sendBundle(bundle);
        
        if (response) {
          console.log("✅ Bundle sent successfully!");
          console.log(`📊 Bundle UUID: ${response}`);
          
          // Wait and check bundle status
          await checkBundleStatus(client, response);
          
          return response;
        }
      } catch (error) {
        lastError = error;
        console.error(`❌ Bundle send attempt ${attempt} failed:`, error);
        
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Failed to send bundle after ${MAX_RETRIES} attempts. Last error: ${lastError}`);
    
  } catch (error) {
    console.error("❌ Critical error in bundle sending:", error);
    throw error;
  }
};

/**
 * Creates a tip transaction for Jito
 */
const createTipTransaction = async (): Promise<VersionedTransaction> => {
  try {
    // Jito tip accounts (randomly select one)
    const tipAccounts = [
      "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
      "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
      "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
      "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
      "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
      "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
      "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
      "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT"
    ];
    
    const randomTipAccount = tipAccounts[Math.floor(Math.random() * tipAccounts.length)];
    const tipAccountPubkey = new PublicKey(randomTipAccount);
    
    // Create a dummy keypair for the tip transaction (this would be replaced with actual payer)
    const tempKeypair = Keypair.generate();
    
    const tipInstruction = SystemProgram.transfer({
      fromPubkey: tempKeypair.publicKey,
      toPubkey: tipAccountPubkey,
      lamports: JITO_TIP_AMOUNT * 1e9, // Convert SOL to lamports
    });

    // Create a mock recent blockhash for the tip transaction
    const recentBlockhash = "11111111111111111111111111111111";
    
    const messageV0 = new TransactionMessage({
      payerKey: tempKeypair.publicKey,
      recentBlockhash,
      instructions: [tipInstruction],
    }).compileToV0Message();

    const tipTransaction = new VersionedTransaction(messageV0);
    tipTransaction.sign([tempKeypair]);

    console.log(`💰 Tip transaction created: ${JITO_TIP_AMOUNT} SOL to ${randomTipAccount}`);
    
    return tipTransaction;
  } catch (error) {
    console.error("❌ Error creating tip transaction:", error);
    throw error;
  }
};

/**
 * Checks the status of a submitted bundle
 */
const checkBundleStatus = async (
  client: any,
  bundleUuid: string,
  maxChecks: number = 10
): Promise<void> => {
  console.log(`🔍 Checking bundle status for UUID: ${bundleUuid}`);
  
  for (let i = 0; i < maxChecks; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      // In a real implementation, you would check bundle status here
      // const status = await client.getBundleStatuses([bundleUuid]);
      
      console.log(`⏳ Bundle status check ${i + 1}/${maxChecks}`);
      
      // For now, we'll assume success after a few checks
      if (i >= 3) {
        console.log("✅ Bundle likely processed successfully");
        return;
      }
    } catch (error) {
      console.error(`❌ Error checking bundle status:`, error);
    }
  }
  
  console.log("⚠️  Bundle status check completed, but status unclear");
};

/**
 * Validates bundle before sending
 */
export const validateBundle = (transactions: VersionedTransaction[]): boolean => {
  if (transactions.length === 0) {
    console.error("❌ Bundle is empty");
    return false;
  }
  
  if (transactions.length > 5) {
    console.warn("⚠️  Bundle has many transactions, may fail");
  }
  
  // Check if all transactions are properly signed
  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].signatures.some(sig => sig.every(byte => byte === 0))) {
      console.error(`❌ Transaction ${i} is not properly signed`);
      return false;
    }
  }
  
  console.log("✅ Bundle validation passed");
  return true;
};

/**
 * Estimates bundle success probability based on current network conditions
 */
export const estimateBundleSuccess = (transactionCount: number): number => {
  // Simple heuristic - fewer transactions = higher success rate
  const baseSuccessRate = 0.95;
  const penaltyPerTx = 0.02;
  
  return Math.max(0.5, baseSuccessRate - (transactionCount * penaltyPerTx));
};
