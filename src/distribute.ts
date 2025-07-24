import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * Distributes SOL to multiple wallets for gas fees
 */
export const distributeSol = async (
  connection: Connection,
  payer: Keypair,
  recipients: Keypair[],
  amount: number
): Promise<VersionedTransaction[]> => {
  try {
    const transactions: VersionedTransaction[] = [];
    const lamportsToSend = amount * LAMPORTS_PER_SOL;
    
    // Split recipients into batches to avoid transaction size limits
    const batchSize = 10; // Conservative batch size
    const batches = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const instructions = batch.map(recipient =>
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: recipient.publicKey,
          lamports: lamportsToSend,
        })
      );

      const recentBlockhash = await connection.getLatestBlockhash();
      
      const messageV0 = new TransactionMessage({
        payerKey: payer.publicKey,
        recentBlockhash: recentBlockhash.blockhash,
        instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);
      transaction.sign([payer]);

      transactions.push(transaction);
    }

    console.log(`✅ Created ${transactions.length} distribution transactions for ${recipients.length} wallets`);
    console.log(`💰 Amount per wallet: ${amount} SOL`);
    console.log(`🔢 Total distribution: ${(amount * recipients.length).toFixed(4)} SOL`);

    return transactions;
  } catch (error) {
    console.error("❌ Error creating distribution transactions:", error);
    throw error;
  }
};

/**
 * Checks if wallets have sufficient balance
 */
export const checkWalletBalances = async (
  connection: Connection,
  wallets: Keypair[],
  requiredAmount: number
): Promise<boolean> => {
  try {
    const requiredLamports = requiredAmount * LAMPORTS_PER_SOL;
    let allSufficient = true;

    for (const wallet of wallets) {
      const balance = await connection.getBalance(wallet.publicKey);
      
      if (balance < requiredLamports) {
        console.log(`⚠️  Wallet ${wallet.publicKey.toBase58()} has insufficient balance: ${balance / LAMPORTS_PER_SOL} SOL (required: ${requiredAmount} SOL)`);
        allSufficient = false;
      }
    }

    if (allSufficient) {
      console.log("✅ All wallets have sufficient balance");
    }

    return allSufficient;
  } catch (error) {
    console.error("❌ Error checking wallet balances:", error);
    return false;
  }
};

/**
 * Gets total balance needed for distribution
 */
export const getTotalDistributionCost = (
  recipientCount: number,
  amountPerRecipient: number,
  estimatedTxFees: number = 0.001
): number => {
  const totalDistribution = recipientCount * amountPerRecipient;
  const totalFees = recipientCount * estimatedTxFees;
  
  return totalDistribution + totalFees;
};

/**
 * Validates distribution parameters
 */
export const validateDistributionParams = (
  recipients: Keypair[],
  amount: number
) => {
  if (recipients.length === 0) {
    throw new Error("No recipients provided");
  }
  
  if (amount <= 0) {
    throw new Error("Distribution amount must be greater than 0");
  }
  
  if (amount < 0.001) {
    throw new Error("Distribution amount too small (minimum 0.001 SOL)");
  }
  
  console.log("✅ Distribution parameters validated");
};
