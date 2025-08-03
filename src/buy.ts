import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
  TransactionMessage,
  AddressLookupTableAccount,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { SLIPPAGE_TOLERANCE } from "./constants";
import { getLookupTableAccount } from "./LUT";

export interface BuyTransactionResult {
  transactions: VersionedTransaction[];
  totalTransactions: number;
}

/**
 * Creates buy transactions for multiple wallets
 */
export const makeBuyTx = async (
  connection: Connection,
  mintKeypair: Keypair,
  buyerKeypairs: Keypair[],
  lookupTableAddress: PublicKey,
  purchaseAmount: number
): Promise<BuyTransactionResult> => {
  try {
    const transactions: VersionedTransaction[] = [];
    const lookupTableAccount = await getLookupTableAccount(connection, lookupTableAddress);

    for (const buyerKeypair of buyerKeypairs) {
      const buyTransaction = await createBuyTransaction(
        connection,
        mintKeypair.publicKey,
        buyerKeypair,
        purchaseAmount,
        lookupTableAccount
      );

      if (buyTransaction) {
        transactions.push(buyTransaction);
      }
    }

    console.log(`✅ Created ${transactions.length} buy transactions`);
    
    return {
      transactions,
      totalTransactions: transactions.length,
    };
  } catch (error) {
    console.error("❌ Error creating buy transactions:", error);
    throw error;
  }
};

/**
 * Creates a single buy transaction
 */
const createBuyTransaction = async (
  connection: Connection,
  mintAddress: PublicKey,
  buyerKeypair: Keypair,
  purchaseAmount: number,
  lookupTableAccount: AddressLookupTableAccount
): Promise<VersionedTransaction | null> => {
  try {
    // Get buyer's associated token account
    const buyerTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      buyerKeypair.publicKey
    );

    // Check if token account exists
    const accountInfo = await connection.getAccountInfo(buyerTokenAccount);
    const instructions = [];

    // Add compute budget instruction for priority
    instructions.push(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 10000, // 0.01 lamports per compute unit
      })
    );

    // Create associated token account if it doesn't exist
    if (!accountInfo) {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          buyerKeypair.publicKey,
          buyerTokenAccount,
          buyerKeypair.publicKey,
          mintAddress
        )
      );
    }

    // For simulation purposes, we create a token transfer instruction
    // In a real implementation, this would be replaced with Raydium swap instructions
    const transferInstruction = createMockSwapInstruction(
      buyerKeypair.publicKey,
      mintAddress,
      purchaseAmount
    );

    instructions.push(transferInstruction);

    const recentBlockhash = await connection.getLatestBlockhash();
    
    const messageV0 = new TransactionMessage({
      payerKey: buyerKeypair.publicKey,
      recentBlockhash: recentBlockhash.blockhash,
      instructions,
    }).compileToV0Message([lookupTableAccount]);

    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([buyerKeypair]);

    return transaction;
  } catch (error) {
    console.error(`❌ Error creating buy transaction for ${buyerKeypair.publicKey.toBase58()}:`, error);
    return null;
  }
};

/**
 * Creates a mock swap instruction (placeholder for actual Raydium integration)
 */
const createMockSwapInstruction = (
  buyer: PublicKey,
  mintAddress: PublicKey,
  amount: number
) => {
  // This is a placeholder instruction
  // In a real implementation, you would use Raydium SDK to create swap instructions
  return ComputeBudgetProgram.setComputeUnitLimit({
    units: 200000,
  });
};

/**
 * Calculates slippage for a trade
 */
export const calculateSlippage = (
  expectedAmount: number,
  actualAmount: number
): number => {
  return Math.abs((expectedAmount - actualAmount) / expectedAmount);
};

/**
 * Validates buy transaction parameters
 */
export const validateBuyParams = (
  mintAddress: PublicKey,
  buyerKeypairs: Keypair[],
  purchaseAmount: number
) => {
  if (!mintAddress) {
    throw new Error("Mint address is required");
  }
  
  if (buyerKeypairs.length === 0) {
    throw new Error("No buyer keypairs provided");
  }
  
  if (purchaseAmount <= 0) {
    throw new Error("Purchase amount must be greater than 0");
  }
  
  if (calculateSlippage(1, 1 + SLIPPAGE_TOLERANCE) > 0.05) {
    console.warn("⚠️  High slippage tolerance detected");
  }
  
  console.log("✅ Buy transaction parameters validated");
};

/**
 * Estimates transaction fees for buy operations
 */
export const estimateBuyFees = (transactionCount: number): number => {
  const baseFeePerTx = 0.000005; // Base Solana transaction fee
  const priorityFeePerTx = 0.00001; // Priority fee for faster processing
  
  return (baseFeePerTx + priorityFeePerTx) * transactionCount;
};
