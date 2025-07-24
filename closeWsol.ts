import { Connection, Keypair } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount, closeAccount } from "@solana/spl-token";
import bs58 from "bs58";
import { RPC_ENDPOINT, PRIVATE_KEY, validateConfig } from "./constants";
import { formatSOL, logOperation } from "./utils";

/**
 * Closes wrapped SOL (WSOL) accounts to recover rent
 */
const closeWrappedSol = async () => {
  try {
    console.log("🔧 Starting WSOL account closure process...");
    
    // Validate configuration
    validateConfig();
    
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const mainKp = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
    
    console.log(`💼 Main wallet: ${mainKp.publicKey.toBase58()}`);
    
    // WSOL mint address
    const WSOL_MINT = "So11111111111111111111111111111111111111112";
    
    try {
      // Get the associated WSOL account
      const wsolAccount = await getAssociatedTokenAddress(
        new (require("@solana/web3.js").PublicKey)(WSOL_MINT),
        mainKp.publicKey
      );
      
      console.log(`📋 WSOL Account: ${wsolAccount.toBase58()}`);
      
      // Check if account exists
      try {
        const accountInfo = await getAccount(connection, wsolAccount);
        
        console.log(`📊 WSOL Account Info:`);
        console.log(`  - Balance: ${formatSOL(Number(accountInfo.amount))}`);
        console.log(`  - Owner: ${accountInfo.owner.toBase58()}`);
        console.log(`  - Mint: ${accountInfo.mint.toBase58()}`);
        
        if (accountInfo.amount === BigInt(0)) {
          console.log("💰 WSOL balance is zero, proceeding with account closure...");
          
          // Close the account
          const signature = await closeAccount(
            connection,
            mainKp,
            wsolAccount,
            mainKp.publicKey,
            mainKp
          );
          
          console.log(`✅ WSOL account closed successfully!`);
          console.log(`🔗 Transaction signature: ${signature}`);
          
          // Wait for confirmation
          const confirmation = await connection.confirmTransaction(signature);
          
          if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${confirmation.value.err}`);
          }
          
          // Check rent recovery
          const rentRecovered = 0.00203928; // Typical rent for token account
          console.log(`💵 Rent recovered: ~${rentRecovered} SOL`);
          
          logOperation("WSOL Account Closure", true, {
            account: wsolAccount.toBase58(),
            signature,
            rentRecovered
          });
          
        } else {
          console.log("⚠️  WSOL account has a balance. Please unwrap the SOL first before closing.");
          console.log("💡 Use: 'spl-token unwrap <account>' or transfer the balance first");
          
          logOperation("WSOL Account Closure", false, "Account has balance");
        }
        
      } catch (accountError: any) {
        if (accountError.message?.includes("could not find account")) {
          console.log("✅ No WSOL account found - nothing to close");
          logOperation("WSOL Account Check", true, "No account found");
        } else {
          throw accountError;
        }
      }
      
    } catch (error) {
      console.error("❌ Error processing WSOL account:", error);
      logOperation("WSOL Account Closure", false, error);
      throw error;
    }
    
    console.log("✅ WSOL account closure process completed");
    
  } catch (error) {
    console.error("❌ Error in WSOL closure:", error);
    logOperation("WSOL Account Closure", false, error);
    process.exit(1);
  }
};

/**
 * Checks for and closes any token accounts with zero balance
 */
const closeEmptyTokenAccounts = async () => {
  try {
    console.log("🔧 Checking for empty token accounts...");
    
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const mainKp = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
    
    // Get all token accounts for the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      mainKp.publicKey,
      { programId: new (require("@solana/web3.js").PublicKey)("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
    );
    
    console.log(`📋 Found ${tokenAccounts.value.length} token accounts`);
    
    const emptyAccounts = tokenAccounts.value.filter(
      account => account.account.data.parsed.info.tokenAmount.uiAmount === 0
    );
    
    if (emptyAccounts.length === 0) {
      console.log("✅ No empty token accounts found");
      return;
    }
    
    console.log(`🗑️  Found ${emptyAccounts.length} empty token accounts`);
    
    for (const account of emptyAccounts) {
      try {
        const accountPubkey = account.pubkey;
        const mint = account.account.data.parsed.info.mint;
        
        console.log(`🗑️  Closing account: ${accountPubkey.toBase58()} (mint: ${mint})`);
        
        const signature = await closeAccount(
          connection,
          mainKp,
          accountPubkey,
          mainKp.publicKey,
          mainKp
        );
        
        console.log(`✅ Account closed: ${signature}`);
        
      } catch (error) {
        console.error(`❌ Failed to close account ${account.pubkey.toBase58()}:`, error);
      }
    }
    
    logOperation("Empty Token Accounts Closure", true, {
      accountsClosed: emptyAccounts.length
    });
    
  } catch (error) {
    console.error("❌ Error closing empty token accounts:", error);
    logOperation("Empty Token Accounts Closure", false, error);
  }
};

if (require.main === module) {
  Promise.all([
    closeWrappedSol(),
    closeEmptyTokenAccounts()
  ]).catch(console.error);
}

export { closeWrappedSol, closeEmptyTokenAccounts };
