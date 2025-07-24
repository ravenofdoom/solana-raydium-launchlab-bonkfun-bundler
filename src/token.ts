import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";
import { TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, TOTAL_SUPPLY } from "../constants";

/**
 * Creates a new SPL token
 */
export const createTokenTx = async (
  connection: Connection,
  payer: Keypair,
  mintKeypair: Keypair
): Promise<VersionedTransaction> => {
  try {
    const lamports = await getMinimumBalanceForRentExemptMint(connection);
    
    // Get associated token account for the payer
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      payer.publicKey
    );

    const instructions = [
      // Create mint account
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      
      // Initialize mint
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        TOKEN_DECIMALS,
        payer.publicKey,
        payer.publicKey
      ),
      
      // Create associated token account
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        associatedTokenAccount,
        payer.publicKey,
        mintKeypair.publicKey
      ),
      
      // Mint initial supply
      createMintToInstruction(
        mintKeypair.publicKey,
        associatedTokenAccount,
        payer.publicKey,
        TOTAL_SUPPLY * Math.pow(10, TOKEN_DECIMALS)
      ),
    ];

    const recentBlockhash = await connection.getLatestBlockhash();
    
    const messageV0 = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: recentBlockhash.blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([payer, mintKeypair]);

    console.log(`✅ Token creation transaction prepared`);
    console.log(`📄 Token Name: ${TOKEN_NAME}`);
    console.log(`🔤 Token Symbol: ${TOKEN_SYMBOL}`);
    console.log(`🔢 Decimals: ${TOKEN_DECIMALS}`);
    console.log(`💰 Total Supply: ${TOTAL_SUPPLY.toLocaleString()}`);
    console.log(`🏠 Mint Address: ${mintKeypair.publicKey.toBase58()}`);

    return transaction;
  } catch (error) {
    console.error("❌ Error creating token transaction:", error);
    throw error;
  }
};

/**
 * Gets token metadata
 */
export const getTokenMetadata = (mintAddress: PublicKey) => {
  return {
    name: TOKEN_NAME,
    symbol: TOKEN_SYMBOL,
    decimals: TOKEN_DECIMALS,
    totalSupply: TOTAL_SUPPLY,
    mintAddress: mintAddress.toBase58(),
    description: `${TOKEN_NAME} - A revolutionary MEV-protected token on Solana`,
    image: "", // Add image URL if available
    external_url: "", // Add website URL if available
  };
};

/**
 * Validates token creation parameters
 */
export const validateTokenParams = () => {
  if (TOKEN_DECIMALS < 0 || TOKEN_DECIMALS > 9) {
    throw new Error("Token decimals must be between 0 and 9");
  }
  
  if (TOTAL_SUPPLY <= 0) {
    throw new Error("Total supply must be greater than 0");
  }
  
  if (!TOKEN_NAME || TOKEN_NAME.length === 0) {
    throw new Error("Token name is required");
  }
  
  if (!TOKEN_SYMBOL || TOKEN_SYMBOL.length === 0) {
    throw new Error("Token symbol is required");
  }
  
  console.log("✅ Token parameters validated");
};
