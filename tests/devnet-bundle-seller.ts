// Load environment variables first
require('dotenv').config();

import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, getAccount, TOKEN_PROGRAM_ID, createTransferInstruction, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import bs58 from "bs58";
import * as fs from "fs";
import * as path from "path";
import { WalletManager } from "../src/wallet-manager";
import { PRIVATE_KEY } from "../constants";

interface TokenBalance {
  walletAddress: string;
  walletIndex: number;
  tokenBalance: number;
  solBalance: number;
  tokenAccount: string;
}

/**
 * Devnet Bundle Seller - Sells tokens from buyer wallets back to main wallet
 */
class DevnetBundleSeller {
  private connection: Connection;
  private mainWallet: Keypair;

  constructor() {
    // Force devnet connection
    const devnetEndpoint = process.env.RPC_ENDPOINT || "https://api.devnet.solana.com";
    this.connection = new Connection(devnetEndpoint, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60000,
    });
    this.mainWallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
  }

  /**
   * List all available wallet sessions
   */
  async listSessions(): Promise<void> {
    console.log("📋 Available Wallet Sessions:");
    console.log("==============================");
    
    const sessions = await WalletManager.listSessions();
    
    if (sessions.length === 0) {
      console.log("❌ No wallet sessions found");
      console.log("💡 Run a devnet bundle test first to create buyer wallets");
      return;
    }
    
    sessions.forEach((sessionId, index) => {
      console.log(`${index + 1}. ${sessionId}`);
    });
    
    console.log(`\n📊 Total sessions: ${sessions.length}`);
  }

  /**
   * Check token balances for a specific session
   */
  async checkTokenBalances(sessionId: string, tokenMint: string): Promise<TokenBalance[]> {
    console.log(`🔍 Checking token balances for session: ${sessionId}`);
    console.log(`🪙 Token mint: ${tokenMint}`);
    console.log("=====================================");
    
    try {
      // Load wallets
      const buyerWallets = await WalletManager.getBuyerWallets(1, sessionId);
      const tokenMintPubkey = new PublicKey(tokenMint);
      const balances: TokenBalance[] = [];
      
      for (let i = 0; i < buyerWallets.length; i++) {
        const wallet = buyerWallets[i];
        const walletAddress = wallet.publicKey.toBase58();
        
        // Get SOL balance
        const solBalance = await this.connection.getBalance(wallet.publicKey);
        
        // Get token account address
        const tokenAccount = getAssociatedTokenAddressSync(
          tokenMintPubkey,
          wallet.publicKey,
          false,
          TOKEN_PROGRAM_ID
        );
        
        let tokenBalance = 0;
        try {
          const accountInfo = await getAccount(this.connection, tokenAccount);
          tokenBalance = Number(accountInfo.amount);
        } catch (error) {
          // Token account doesn't exist or no balance
          tokenBalance = 0;
        }
        
        const walletInfo: TokenBalance = {
          walletAddress,
          walletIndex: i + 1,
          tokenBalance,
          solBalance: solBalance / 1e9,
          tokenAccount: tokenAccount.toBase58()
        };
        
        balances.push(walletInfo);
        
        console.log(`💼 Wallet ${i + 1}: ${walletAddress}`);
        console.log(`   💰 SOL: ${walletInfo.solBalance.toFixed(6)}`);
        console.log(`   🪙 Tokens: ${walletInfo.tokenBalance}`);
        console.log(`   🔗 Explorer: https://explorer.solana.com/address/${walletAddress}?cluster=devnet`);
        console.log("");
      }
      
      const totalTokens = balances.reduce((sum, bal) => sum + bal.tokenBalance, 0);
      const totalSol = balances.reduce((sum, bal) => sum + bal.solBalance, 0);
      
      console.log(`📊 Summary:`);
      console.log(`   Total wallets: ${balances.length}`);
      console.log(`   Total tokens: ${totalTokens}`);
      console.log(`   Total SOL: ${totalSol.toFixed(6)}`);
      
      return balances;
      
    } catch (error) {
      console.error("❌ Error checking balances:", error);
      return [];
    }
  }

  /**
   * Sell tokens from all buyer wallets to main wallet
   */
  async sellTokensFromSession(sessionId: string, tokenMint: string): Promise<void> {
    console.log(`🔥 Starting bundle sell for session: ${sessionId}`);
    console.log(`🪙 Token mint: ${tokenMint}`);
    console.log("===========================================");
    
    try {
      // First check balances
      const balances = await this.checkTokenBalances(sessionId, tokenMint);
      const walletsWithTokens = balances.filter(b => b.tokenBalance > 0);
      
      if (walletsWithTokens.length === 0) {
        console.log("❌ No wallets have tokens to sell");
        return;
      }
      
      console.log(`\n🎯 Found ${walletsWithTokens.length} wallets with tokens`);
      console.log("🚀 Starting token transfers...\n");
      
      // Load wallets
      const buyerWallets = await WalletManager.getBuyerWallets(1, sessionId);
      const tokenMintPubkey = new PublicKey(tokenMint);
      
      // Get or create main wallet token account
      const mainTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.mainWallet,
        tokenMintPubkey,
        this.mainWallet.publicKey
      );
      
      const signatures: string[] = [];
      let totalTransferred = 0;
      
      // Transfer tokens from each wallet
      for (let i = 0; i < buyerWallets.length; i++) {
        const wallet = buyerWallets[i];
        const balance = balances[i];
        
        if (balance.tokenBalance === 0) {
          console.log(`⏭️  Wallet ${i + 1}: No tokens to transfer`);
          continue;
        }
        
        try {
          // Get buyer wallet token account
          const buyerTokenAccount = getAssociatedTokenAddressSync(
            tokenMintPubkey,
            wallet.publicKey,
            false,
            TOKEN_PROGRAM_ID
          );
          
          // Create transfer instruction
          const transferInstruction = createTransferInstruction(
            buyerTokenAccount,
            mainTokenAccount.address,
            wallet.publicKey,
            balance.tokenBalance,
            [],
            TOKEN_PROGRAM_ID
          );
          
          // Create and send transaction
          const transaction = new Transaction().add(transferInstruction);
          transaction.feePayer = wallet.publicKey;
          
          const signature = await sendAndConfirmTransaction(
            this.connection,
            transaction,
            [wallet],
            {
              commitment: 'confirmed',
              maxRetries: 3,
            }
          );
          
          signatures.push(signature);
          totalTransferred += balance.tokenBalance;
          
          console.log(`✅ Wallet ${i + 1}: Transferred ${balance.tokenBalance} tokens`);
          console.log(`   🔗 TX: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
          
        } catch (error) {
          console.error(`❌ Wallet ${i + 1}: Transfer failed:`, error);
        }
      }
      
      console.log("\n🎉 Bundle Sell Complete!");
      console.log("=========================");
      console.log(`📊 Total tokens transferred: ${totalTransferred}`);
      console.log(`🔗 Total transactions: ${signatures.length}`);
      console.log(`💼 Tokens sent to: ${this.mainWallet.publicKey.toBase58()}`);
      
      if (signatures.length > 0) {
        console.log("\n📋 Transaction signatures:");
        signatures.forEach((sig, index) => {
          console.log(`${index + 1}. ${sig}`);
        });
      }
      
    } catch (error) {
      console.error("❌ Bundle sell failed:", error);
    }
  }

  /**
   * Gather remaining SOL from buyer wallets back to main wallet
   */
  async gatherSolFromSession(sessionId: string): Promise<void> {
    console.log(`💰 Gathering SOL from session: ${sessionId}`);
    console.log("=====================================");
    
    try {
      const buyerWallets = await WalletManager.getBuyerWallets(1, sessionId);
      const signatures: string[] = [];
      let totalGathered = 0;
      
      for (let i = 0; i < buyerWallets.length; i++) {
        const wallet = buyerWallets[i];
        
        try {
          const balance = await this.connection.getBalance(wallet.publicKey);
          const rentExemption = await this.connection.getMinimumBalanceForRentExemption(0);
          const availableBalance = balance - rentExemption - 5000; // Leave 5000 lamports for fees
          
          if (availableBalance <= 0) {
            console.log(`⏭️  Wallet ${i + 1}: No SOL to gather (${balance / 1e9} SOL)`);
            continue;
          }
          
          const transferInstruction = SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: this.mainWallet.publicKey,
            lamports: availableBalance,
          });
          
          const transaction = new Transaction().add(transferInstruction);
          transaction.feePayer = wallet.publicKey;
          
          const signature = await sendAndConfirmTransaction(
            this.connection,
            transaction,
            [wallet],
            {
              commitment: 'confirmed',
              maxRetries: 3,
            }
          );
          
          signatures.push(signature);
          totalGathered += availableBalance;
          
          console.log(`✅ Wallet ${i + 1}: Gathered ${availableBalance / 1e9} SOL`);
          console.log(`   🔗 TX: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
          
        } catch (error) {
          console.error(`❌ Wallet ${i + 1}: SOL gather failed:`, error);
        }
      }
      
      console.log("\n🎉 SOL Gathering Complete!");
      console.log("===========================");
      console.log(`💰 Total SOL gathered: ${totalGathered / 1e9}`);
      console.log(`🔗 Total transactions: ${signatures.length}`);
      
    } catch (error) {
      console.error("❌ SOL gathering failed:", error);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const seller = new DevnetBundleSeller();
  
  switch (command) {
    case 'list':
      await seller.listSessions();
      break;
      
    case 'check':
      if (args.length < 3) {
        console.log("Usage: npm run devnet-sell-bundle check <sessionId> <tokenMint>");
        return;
      }
      await seller.checkTokenBalances(args[1], args[2]);
      break;
      
    case 'sell':
      if (args.length < 3) {
        console.log("Usage: npm run devnet-sell-bundle sell <sessionId> <tokenMint>");
        return;
      }
      await seller.sellTokensFromSession(args[1], args[2]);
      break;
      
    case 'gather':
      if (args.length < 2) {
        console.log("Usage: npm run devnet-sell-bundle gather <sessionId>");
        return;
      }
      await seller.gatherSolFromSession(args[1]);
      break;
      
    default:
      console.log("🎯 Devnet Bundle Seller");
      console.log("======================");
      console.log("Available commands:");
      console.log("  list                           - List all wallet sessions");
      console.log("  check <sessionId> <tokenMint>  - Check token balances");
      console.log("  sell <sessionId> <tokenMint>   - Sell all tokens to main wallet");
      console.log("  gather <sessionId>             - Gather remaining SOL to main wallet");
      console.log("");
      console.log("Examples:");
      console.log("  npm run devnet-sell-bundle list");
      console.log("  npm run devnet-sell-bundle check devnet-123456 TokenMintAddress");
      console.log("  npm run devnet-sell-bundle sell devnet-123456 TokenMintAddress");
      console.log("  npm run devnet-sell-bundle gather devnet-123456");
  }
}

if (require.main === module) {
  main().catch(console.error);
}
