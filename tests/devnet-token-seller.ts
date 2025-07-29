// Load environment variables first
require('dotenv').config();

console.log("🔧 Environment Debug:");
console.log("- WALLET_ENCRYPTION_KEY:", process.env.WALLET_ENCRYPTION_KEY ? "✅ Found" : "❌ Missing");
console.log("- .env file exists:", require('fs').existsSync('.env') ? "✅ Yes" : "❌ No");
console.log("- Current directory:", process.cwd());

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
 * Devnet token seller - Lists and manages tokens from buyer wallets
 */
class DevnetTokenSeller {
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
      // First check if the session file exists
      const walletsFile = path.join(process.cwd(), "wallets", `buyers-${sessionId}.json`);
      if (!fs.existsSync(walletsFile)) {
        console.error(`❌ Session file not found: ${walletsFile}`);
        console.log("💡 Available sessions:");
        await this.listSessions();
        return [];
      }
      
      // Load wallets by calling getBuyerWallets with a dummy count (it will load existing)
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
          tokenBalance = Number(accountInfo.amount) / Math.pow(10, 9); // Assuming 9 decimals
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
        console.log(`   🪙 Tokens: ${walletInfo.tokenBalance.toFixed(6)}`);
        console.log(`   🔗 Explorer: https://explorer.solana.com/address/${walletAddress}?cluster=devnet`);
        console.log("");
      }
      
      const totalTokens = balances.reduce((sum, b) => sum + b.tokenBalance, 0);
      const totalSol = balances.reduce((sum, b) => sum + b.solBalance, 0);
      
      console.log("📊 Summary:");
      console.log(`   Total wallets: ${balances.length}`);
      console.log(`   Total tokens: ${totalTokens.toFixed(6)}`);
      console.log(`   Total SOL: ${totalSol.toFixed(6)}`);
      
      return balances;
      
    } catch (error) {
      console.error("❌ Error checking balances:", error);
      return [];
    }
  }

  /**
   * Display help information
   */
  displayHelp(): void {
    console.log("🔧 Devnet Token Seller Commands:");
    console.log("=================================");
    console.log("");
    console.log("📋 List all wallet sessions:");
    console.log("   npm run sell -- list");
    console.log("");
    console.log("🔍 Check token balances:");
    console.log("   npm run sell -- check <sessionId> <tokenMint>");
    console.log("");
    console.log("💡 Example:");
    console.log("   npm run sell -- check devnet-1753794649156 G4in2VBa5XefXMvfPnt485tLT49HbKvhQSEvdg6xArA8");
    console.log("");
    console.log("📝 Note: Token selling functionality will be added next");
  }
}

// CLI Interface
async function main() {
  const seller = new DevnetTokenSeller();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    seller.displayHelp();
    return;
  }
  
  const command = args[0].toLowerCase();
  
  try {
    switch (command) {
      case 'list':
        await seller.listSessions();
        break;
        
      case 'check':
        if (args.length < 3) {
          console.error("❌ Missing arguments");
          console.log("Usage: npm run sell -- check <sessionId> <tokenMint>");
          return;
        }
        const sessionId = args[1];
        const tokenMint = args[2];
        await seller.checkTokenBalances(sessionId, tokenMint);
        break;
        
      case 'help':
      default:
        seller.displayHelp();
        break;
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);
