import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
  AddressLookupTableProgram,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";

/**
 * Creates a lookup table instruction
 */
export const createLutInst = async (
  connection: Connection,
  payer: Keypair,
  lookupTableInst: TransactionInstruction
): Promise<VersionedTransaction> => {
  try {
    const recentBlockhash = await connection.getLatestBlockhash();
    
    const messageV0 = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: recentBlockhash.blockhash,
      instructions: [lookupTableInst],
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([payer]);

    console.log("✅ LUT instruction created successfully");
    return transaction;
  } catch (error) {
    console.error("❌ Error creating LUT instruction:", error);
    throw error;
  }
};

/**
 * Extends lookup table with additional addresses
 */
export const createExtendLut = async (
  connection: Connection,
  payer: Keypair,
  lookupTableAddress: PublicKey,
  addressesToAdd: PublicKey[],
  mintAddress: PublicKey
): Promise<VersionedTransaction> => {
  try {
    // Add mint address to the list
    const allAddresses = [mintAddress, ...addressesToAdd];
    
    const extendInstruction = AddressLookupTableProgram.extendLookupTable({
      payer: payer.publicKey,
      authority: payer.publicKey,
      lookupTable: lookupTableAddress,
      addresses: allAddresses,
    });

    const recentBlockhash = await connection.getLatestBlockhash();
    
    const messageV0 = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: recentBlockhash.blockhash,
      instructions: [extendInstruction],
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([payer]);

    console.log(`✅ Extended LUT with ${allAddresses.length} addresses`);
    return transaction;
  } catch (error) {
    console.error("❌ Error extending LUT:", error);
    throw error;
  }
};

/**
 * Gets lookup table account
 */
export const getLookupTableAccount = async (
  connection: Connection,
  lookupTableAddress: PublicKey
) => {
  try {
    const lookupTableAccount = await connection.getAddressLookupTable(lookupTableAddress);
    
    if (!lookupTableAccount.value) {
      throw new Error("Lookup table not found");
    }

    console.log("✅ Retrieved lookup table account");
    return lookupTableAccount.value;
  } catch (error) {
    console.error("❌ Error getting lookup table account:", error);
    throw error;
  }
};

/**
 * Waits for lookup table to be active
 */
export const waitForLookupTableActive = async (
  connection: Connection,
  lookupTableAddress: PublicKey,
  maxAttempts: number = 30
): Promise<boolean> => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const lookupTableAccount = await getLookupTableAccount(connection, lookupTableAddress);
      
      if (lookupTableAccount.state.addresses.length > 0) {
        console.log("✅ Lookup table is active");
        return true;
      }
      
      console.log(`⏳ Waiting for lookup table to become active... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(`⏳ Lookup table not ready yet... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error("Lookup table failed to become active within timeout");
};
