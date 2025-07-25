import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import { 
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount,
  TokenAccountNotFoundError
} from "@solana/spl-token";
import { WalletManager } from "./wallet-manager";
import bs58 from "bs58";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Token Selling Utility - Sell tokens from bundled buyer wallets
 */
export class TokenSeller {
  private connection: Connection;

  constructor() {
    const rpcEndpoint = process.env.RPC_ENDPOINT || "https://api.devnet.solana.com";
    this.connection = new Connection(rpcEndpoint, "confirmed");
  }

  /**
   * List all available wallet sessions with token balances
   */
  async listSessionsWithBalances(): Promise<void> {
    console.log("📋 Available Wallet Sessions");
    console.log("=".repeat(50));

    const sessions = await WalletManager.listSessions();
    
    if (sessions.length === 0) {
      console.log("❌ No wallet sessions found");
      console.log("💡 Run a bundle operation first to create buyer wallets");
      return;
    }

    for (const sessionId of sessions) {
      console.log(`\n🔍 Session: ${sessionId}`);
      console.log("-".repeat(30));

      try {
        const wallets = await WalletManager.getBuyerWallets(0, sessionId);
        console.log(`👥 Buyer wallets: ${wallets.length}`);

        // Check SOL balances
        let totalSol = 0;
        for (let i = 0; i < wallets.length; i++) {
          const balance = await this.connection.getBalance(wallets[i].publicKey);
          const solBalance = balance / LAMPORTS_PER_SOL;
          totalSol += solBalance;
          
          if (i < 3) { // Show first 3 wallets
            console.log(`  Wallet ${i + 1}: ${wallets[i].publicKey.toBase58()} (${solBalance.toFixed(6)} SOL)`);
          }
        }
        
        if (wallets.length > 3) {
          console.log(`  ... and ${wallets.length - 3} more wallets`);
        }
        
        console.log(`💰 Total SOL across wallets: ${totalSol.toFixed(6)} SOL`);
        
        // Explorer links
        const isDevnet = process.env.RPC_ENDPOINT?.includes('devnet');
        const networkParam = isDevnet ? '?cluster=devnet' : '';
        console.log(`🔗 First wallet explorer: https://solscan.io/account/${wallets[0].publicKey.toBase58()}${networkParam}`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Error loading session: ${errorMessage}`);
      }
    }
  }

  /**
   * Check token balances for a specific session
   */
  async checkTokenBalances(sessionId: string, tokenMintAddress: string): Promise<void> {
    console.log(`🔍 Token Balances for Session: ${sessionId}`);
    console.log("=".repeat(50));

    try {
      const wallets = await WalletManager.getBuyerWallets(0, sessionId);
      const tokenMint = new PublicKey(tokenMintAddress);

      let totalTokens = 0;
      const walletsWithTokens: Array<{wallet: Keypair, balance: number, ata: PublicKey}> = [];

      for (let i = 0; i < wallets.length; i++) {
        try {
          const tokenAccount = await getOrCreateAssociatedTokenAccount(
            this.connection,
            wallets[i],
            tokenMint,
            wallets[i].publicKey
          );

          const accountInfo = await getAccount(this.connection, tokenAccount.address);
          const balance = Number(accountInfo.amount);
          
          if (balance > 0) {
            totalTokens += balance;
            walletsWithTokens.push({
              wallet: wallets[i],
              balance: balance,
              ata: tokenAccount.address
            });

            console.log(`💎 Wallet ${i + 1}: ${balance.toLocaleString()} tokens`);
            console.log(`   Address: ${wallets[i].publicKey.toBase58()}`);
          }
        } catch (error) {
          if (error instanceof TokenAccountNotFoundError) {
            console.log(`📭 Wallet ${i + 1}: No tokens (no token account)`);
          } else {
            console.log(`❌ Wallet ${i + 1}: Error checking balance`);
          }
        }
      }

      console.log(`\n📊 SUMMARY:`);
      console.log(`Total tokens found: ${totalTokens.toLocaleString()}`);
      console.log(`Wallets with tokens: ${walletsWithTokens.length}/${wallets.length}`);

      // Token mint explorer
      const isDevnet = process.env.RPC_ENDPOINT?.includes('devnet');
      const networkParam = isDevnet ? '?cluster=devnet' : '';
      console.log(`🔗 Token mint: https://solscan.io/token/${tokenMintAddress}${networkParam}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Error: ${errorMessage}`);
    }
  }

  /**
   * Sell all tokens from buyer wallets to main wallet
   */
  async sellAllTokens(sessionId: string, tokenMintAddress: string): Promise<void> {
    console.log(`💸 Selling All Tokens from Session: ${sessionId}`);
    console.log("=".repeat(50));

    try {
      const wallets = await WalletManager.getBuyerWallets(0, sessionId);
      const tokenMint = new PublicKey(tokenMintAddress);
      const mainWallet = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));

      // Get main wallet token account
      const mainTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        mainWallet,
        tokenMint,
        mainWallet.publicKey
      );

      console.log(`📬 Main wallet token account: ${mainTokenAccount.address.toBase58()}`);

      let totalTransferred = 0;
      let successfulTransfers = 0;

      for (let i = 0; i < wallets.length; i++) {
        try {
          // Get buyer wallet token account
          const buyerTokenAccount = await getOrCreateAssociatedTokenAccount(
            this.connection,
            wallets[i],
            tokenMint,
            wallets[i].publicKey
          );

          const accountInfo = await getAccount(this.connection, buyerTokenAccount.address);
          const balance = Number(accountInfo.amount);

          if (balance > 0) {
            console.log(`\n🔄 Transferring ${balance.toLocaleString()} tokens from wallet ${i + 1}...`);

            // Create transfer transaction
            const transferSignature = await transfer(
              this.connection,
              wallets[i],
              buyerTokenAccount.address,
              mainTokenAccount.address,
              wallets[i],
              balance
            );

            console.log(`✅ Transfer successful: ${transferSignature}`);
            
            // Explorer link
            const isDevnet = process.env.RPC_ENDPOINT?.includes('devnet');
            const networkParam = isDevnet ? '?cluster=devnet' : '';
            console.log(`🔗 Transaction: https://solscan.io/tx/${transferSignature}${networkParam}`);

            totalTransferred += balance;
            successfulTransfers++;
          } else {
            console.log(`📭 Wallet ${i + 1}: No tokens to transfer`);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(`❌ Wallet ${i + 1} transfer failed: ${errorMessage}`);
        }
      }

      console.log(`\n📊 SELLING COMPLETE:`);
      console.log(`Total tokens transferred: ${totalTransferred.toLocaleString()}`);
      console.log(`Successful transfers: ${successfulTransfers}/${wallets.length}`);
      console.log(`All tokens now in main wallet: ${mainWallet.publicKey.toBase58()}`);

      // Check main wallet final balance
      const mainAccountInfo = await getAccount(this.connection, mainTokenAccount.address);
      console.log(`💰 Main wallet token balance: ${Number(mainAccountInfo.amount).toLocaleString()}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Error: ${errorMessage}`);
    }
  }

  /**
   * Recover remaining SOL from buyer wallets back to main wallet
   */
  async recoverSol(sessionId: string): Promise<void> {
    console.log(`💰 Recovering SOL from Session: ${sessionId}`);
    console.log("=".repeat(50));

    try {
      const wallets = await WalletManager.getBuyerWallets(0, sessionId);
      const mainWallet = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));

      let totalRecovered = 0;
      let successfulRecoveries = 0;

      for (let i = 0; i < wallets.length; i++) {
        try {
          const balance = await this.connection.getBalance(wallets[i].publicKey);
          const solBalance = balance / LAMPORTS_PER_SOL;

          // Leave small amount for rent (0.002 SOL should be enough)
          const rentExempt = 0.002 * LAMPORTS_PER_SOL;
          const transferAmount = balance - rentExempt - 5000; // 5000 lamports for fee

          if (transferAmount > 0) {
            console.log(`\n🔄 Recovering ${(transferAmount / LAMPORTS_PER_SOL).toFixed(6)} SOL from wallet ${i + 1}...`);

            const transaction = new Transaction().add(
              {
                fromPubkey: wallets[i].publicKey,
                toPubkey: mainWallet.publicKey,
                lamports: transferAmount,
                programId: new PublicKey("11111111111111111111111111111112"),
                keys: [
                  { pubkey: wallets[i].publicKey, isSigner: true, isWritable: true },
                  { pubkey: mainWallet.publicKey, isSigner: false, isWritable: true }
                ]
              } as any
            );

            const signature = await sendAndConfirmTransaction(
              this.connection,
              transaction,
              [wallets[i]]
            );

            console.log(`✅ Recovery successful: ${signature}`);
            
            totalRecovered += transferAmount / LAMPORTS_PER_SOL;
            successfulRecoveries++;
          } else {
            console.log(`📭 Wallet ${i + 1}: Insufficient balance to recover (${solBalance.toFixed(6)} SOL)`);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(`❌ Wallet ${i + 1} recovery failed: ${errorMessage}`);
        }
      }

      console.log(`\n📊 SOL RECOVERY COMPLETE:`);
      console.log(`Total SOL recovered: ${totalRecovered.toFixed(6)} SOL`);
      console.log(`Successful recoveries: ${successfulRecoveries}/${wallets.length}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Error: ${errorMessage}`);
    }
  }
}

// CLI Interface
async function main() {
  const seller = new TokenSeller();

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "list":
      await seller.listSessionsWithBalances();
      break;

    case "check":
      if (args.length < 3) {
        console.log("Usage: npm run sell check <sessionId> <tokenMintAddress>");
        process.exit(1);
      }
      await seller.checkTokenBalances(args[1], args[2]);
      break;

    case "sell":
      if (args.length < 3) {
        console.log("Usage: npm run sell sell <sessionId> <tokenMintAddress>");
        process.exit(1);
      }
      await seller.sellAllTokens(args[1], args[2]);
      break;

    case "recover":
      if (args.length < 2) {
        console.log("Usage: npm run sell recover <sessionId>");
        process.exit(1);
      }
      await seller.recoverSol(args[1]);
      break;

    default:
      console.log("🎯 Token Seller Commands:");
      console.log("npm run sell list                           - List all wallet sessions");
      console.log("npm run sell check <sessionId> <tokenMint>   - Check token balances");
      console.log("npm run sell sell <sessionId> <tokenMint>    - Sell all tokens to main wallet");
      console.log("npm run sell recover <sessionId>            - Recover remaining SOL");
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}
