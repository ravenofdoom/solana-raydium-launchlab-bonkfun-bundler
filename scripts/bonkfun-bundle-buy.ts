import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletManager } from '../src/wallet-manager';
import { BonkFunService } from '../src/bonkfun-service';
import * as bs58 from 'bs58';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * BonkFun Bundle Launcher - Buy existing BonkFun tokens with multiple wallets
 * Supports both letsbonk.fun (classic) and letsbonk.fun/tech (Raydium Launchpad) modes
 */
class BonkFunBundleLauncher {
  private connection: Connection;
  private mainWallet: Keypair;
  private bonkFunService: BonkFunService;
  private mode: 'classic' | 'tech';

  constructor() {
    this.connection = new Connection(
      process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    this.mainWallet = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));
    
    // Initialize BonkFun service with mode from .env
    this.mode = process.env.BONKFUN_LAUNCH_MODE as 'classic' | 'tech' || 'tech';
    this.bonkFunService = new BonkFunService(this.connection, this.mode);
  }

  /**
   * Launch a BonkFun bundle buy operation
   */
  async launchBundleBuy(tokenMint: string, config?: {
    walletCount?: number;
    solPerWallet?: number;
    buyAmount?: number;
    maxSlippage?: number;
  }): Promise<void> {
    console.log('🚀 BonkFun Bundle Buy Launcher');
    console.log('='.repeat(60));
    console.log(`🎯 Mode: ${this.mode === 'classic' ? 'letsbonk.fun (bonding curve)' : 'letsbonk.fun/tech (Raydium Launchpad)'}`);
    console.log(`🪙 Token: ${tokenMint}`);
    console.log(`💼 Main wallet: ${this.mainWallet.publicKey.toString()}`);

    // Configuration with defaults from .env
    const walletCount = config?.walletCount || parseInt(process.env.BONKFUN_BUNDLE_WALLETS || '3');
    const solPerWallet = config?.solPerWallet || parseFloat(process.env.BONKFUN_BUNDLE_SOL_PER_WALLET || '0.015'); // Increased for wrapped SOL account
    const buyAmount = config?.buyAmount || parseFloat(process.env.BONKFUN_BUNDLE_BUY_AMOUNT || '0.006');
    const maxSlippage = config?.maxSlippage || parseFloat(process.env.BONKFUN_MAX_SLIPPAGE || '0.05');

    console.log(`👥 Bundle wallets: ${walletCount}`);
    console.log(`💰 SOL per wallet: ${solPerWallet}`);
    console.log(`🛒 Buy amount per wallet: ${buyAmount} SOL`);
    console.log(`📊 Max slippage: ${(maxSlippage * 100).toFixed(1)}%`);

    // Check main wallet balance
    const mainBalance = await this.connection.getBalance(this.mainWallet.publicKey);
    const totalRequired = (solPerWallet * walletCount) + 0.02; // Extra for fees
    
    console.log(`💳 Main wallet balance: ${(mainBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`💸 Total required: ${totalRequired.toFixed(6)} SOL`);

    if (mainBalance < totalRequired * LAMPORTS_PER_SOL) {
      throw new Error(`Insufficient balance. Need ${totalRequired.toFixed(6)} SOL, have ${(mainBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    }

    // Generate session ID
    const sessionId = `BONK_${Date.now()}`;
    console.log(`📋 Session ID: ${sessionId}`);

    try {
      // Step 1: Generate or load buyer wallets
      console.log(`\n🔧 Step 1: Generating ${walletCount} buyer wallets...`);
      const buyerWallets = await WalletManager.getBuyerWallets(walletCount, sessionId);
      console.log(`✅ Generated ${buyerWallets.length} buyer wallets`);

      // Step 2: Fund buyer wallets
      console.log(`\n💸 Step 2: Funding buyer wallets...`);
      await this.fundWallets(buyerWallets, solPerWallet);

      // Step 3: Create buy transactions
      console.log(`\n🛒 Step 3: Creating buy transactions...`);
      const buyTransactions = await this.createBuyTransactions(
        buyerWallets,
        tokenMint,
        buyAmount,
        maxSlippage
      );

      // Step 4: Execute transactions individually (Jito support disabled for now)
      console.log(`\n📤 Step 4: Executing transactions individually...`);
      await this.executeTransactionsIndividually(buyTransactions);

      console.log(`\n🎉 BonkFun bundle buy completed successfully!`);
      console.log(`📋 Session ID: ${sessionId} (use for later SOL recovery)`);

    } catch (error) {
      console.error(`❌ Bundle buy failed:`, error);
      console.log(`📋 Session ID: ${sessionId} (wallets may need SOL recovery)`);
      throw error;
    }
  }

  /**
   * Fund buyer wallets from main wallet
   */
  private async fundWallets(wallets: Keypair[], solAmount: number): Promise<void> {
    console.log(`💸 Funding ${wallets.length} wallets with ${solAmount} SOL each...`);

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const balance = await this.connection.getBalance(wallet.publicKey);
      const currentSOL = balance / LAMPORTS_PER_SOL;

      console.log(`   Wallet ${i + 1}: ${wallet.publicKey.toString().slice(0, 8)}... (${currentSOL.toFixed(6)} SOL)`);

      if (currentSOL < solAmount) {
        const transferAmount = solAmount - currentSOL;
        const lamports = Math.floor(transferAmount * LAMPORTS_PER_SOL);

        try {
          const signature = await this.connection.requestAirdrop(wallet.publicKey, lamports);
          await this.connection.confirmTransaction(signature, 'confirmed');
          console.log(`     ✅ Funded with ${transferAmount.toFixed(6)} SOL`);
        } catch (error) {
          // If airdrop fails, try direct transfer (for mainnet)
          const { Transaction, SystemProgram } = await import('@solana/web3.js');
          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: this.mainWallet.publicKey,
              toPubkey: wallet.publicKey,
              lamports: lamports,
            })
          );

          const signature = await this.connection.sendTransaction(transaction, [this.mainWallet]);
          await this.connection.confirmTransaction(signature, 'confirmed');
          console.log(`     ✅ Transferred ${transferAmount.toFixed(6)} SOL`);
        }
      } else {
        console.log(`     ✅ Already funded`);
      }
    }
  }

  /**
   * Create buy transactions for all wallets
   */
  private async createBuyTransactions(
    wallets: Keypair[],
    tokenMint: string,
    buyAmount: number,
    maxSlippage: number
  ): Promise<any[]> {
    console.log(`🛒 Creating buy transactions for ${wallets.length} wallets...`);

    const transactions = [];

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      console.log(`   Creating buy tx for wallet ${i + 1}...`);

      try {
        const { instructions } = await this.bonkFunService.createBuyInstructions(
          wallet.publicKey,
          {
            tokenMint: new PublicKey(tokenMint),
            solAmount: buyAmount,
            slippage: maxSlippage,
          }
        );

        const { Transaction } = await import('@solana/web3.js');
        const transaction = new Transaction();
        instructions.forEach(ix => transaction.add(ix));

        transaction.feePayer = wallet.publicKey;
        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.sign(wallet);

        transactions.push({
          transaction,
          wallet,
          index: i + 1,
        });

        console.log(`     ✅ Created transaction for wallet ${i + 1}`);
      } catch (error) {
        console.log(`     ❌ Failed to create transaction for wallet ${i + 1}: ${error}`);
      }
    }

    console.log(`✅ Created ${transactions.length} buy transactions`);
    return transactions;
  }

  /**
   * Execute transactions individually
   */
  private async executeTransactionsIndividually(transactions: any[]): Promise<void> {
    console.log(`📤 Executing ${transactions.length} transactions individually...`);

    for (const tx of transactions) {
      try {
        const signature = await this.connection.sendRawTransaction(tx.transaction.serialize());
        await this.connection.confirmTransaction(signature, 'confirmed');
        console.log(`   ✅ Wallet ${tx.index}: ${signature.slice(0, 8)}...`);
        
        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, parseInt(process.env.BONKFUN_BUY_DELAY_MS || '1000')));
      } catch (error) {
        console.log(`   ❌ Wallet ${tx.index} failed: ${error}`);
      }
    }

    console.log(`✅ Individual transaction execution completed`);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    const launcher = new BonkFunBundleLauncher();

    // Use the real BonkFun token from the documentation
    const tokenMint = '8dqNN3h1Da5QTXW419oJrYfLAM2u13kCqLkRHdufbonk'; // From STATUS.md

    console.log('🎯 BonkFun Bundle Buy Test');
    console.log('='.repeat(40));

    await launcher.launchBundleBuy(tokenMint);

  } catch (error) {
    console.error('❌ BonkFun bundle buy failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { BonkFunBundleLauncher };
