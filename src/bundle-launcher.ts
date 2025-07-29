import { Connection, Keypair, Transaction, sendAndConfirmTransaction, PublicKey, SystemProgram } from '@solana/web3.js';
import { BonkFunService, BonkFunLaunchParams, BonkFunBuyParams } from './bonkfun-service';
import { WalletManager } from './wallet-manager';

interface BundleLaunchConfig {
  // Launch parameters
  tokenParams: BonkFunLaunchParams;
  launchMode: 'classic' | 'tech';
  
  // Bundle parameters
  numberOfWallets: number;
  solAmountPerWallet: number;
  maxSlippage: number;
  
  // Timing
  buyDelayMs: number; // Delay between each buy transaction
  maxRetries: number;
}

interface BundleLaunchResult {
  tokenMint: PublicKey;
  launchSignature: string;
  buyResults: {
    walletIndex: number;
    signature?: string;
    error?: string;
  }[];
  totalSuccessful: number;
  totalFailed: number;
}

/**
 * Bundle Launcher - Create a token and immediately bundle buy with multiple wallets
 */
export class BundleLauncher {
  private connection: Connection;
  private bonkFunService: BonkFunService;
  private mode: 'classic' | 'tech';

  constructor(connection: Connection, mode: 'classic' | 'tech' = 'tech') {
    this.connection = connection;
    this.mode = mode;
    this.bonkFunService = new BonkFunService(connection, mode);
  }

  /**
   * Launch a token and immediately bundle buy with multiple wallets
   */
  async launchAndBundle(
    launcher: Keypair,
    config: BundleLaunchConfig
  ): Promise<BundleLaunchResult> {
    console.log('🚀 Starting Bundle Launch...');
    console.log(`📊 Token: ${config.tokenParams.tokenName} (${config.tokenParams.tokenSymbol})`);
    console.log(`🔧 Mode: ${config.launchMode}`);
    console.log(`👥 Wallets: ${config.numberOfWallets}`);
    console.log(`💰 SOL per wallet: ${config.solAmountPerWallet}`);
    
    const result: BundleLaunchResult = {
      tokenMint: PublicKey.default,
      launchSignature: '',
      buyResults: [],
      totalSuccessful: 0,
      totalFailed: 0
    };

    try {
      // Step 1: Launch the NEW BonkFun token
      console.log('\n📝 Step 1: Launching NEW BonkFun token...');
      
      // IMPLEMENT ACTUAL TOKEN CREATION
      if (this.mode === 'tech') {
        const launchResult = await this.bonkFunService.launchTokenTech(
          launcher,
          config.tokenParams
        );
        result.tokenMint = launchResult.tokenMint;
        result.launchSignature = launchResult.signature;
      } else {
        const launchResult = await this.bonkFunService.launchTokenClassic(
          launcher,
          config.tokenParams
        );
        result.tokenMint = launchResult.tokenMint;
        result.launchSignature = launchResult.signature;
      }
      
      console.log(`✅ NEW BonkFun token launched! Mint: ${result.tokenMint.toString()}`);
      console.log(`📋 Launch signature: ${result.launchSignature}`);

      // Verify the token is valid
      const isValidToken = await this.bonkFunService.isValidBonkFunToken(result.tokenMint);
      if (!isValidToken) {
        throw new Error(`Token ${result.tokenMint.toString()} is not a valid BonkFun token`);
      }

      // Step 2: Load or generate bundle wallets
      console.log('\n👥 Step 2: Preparing bundle wallets...');
      const sessionId = `bundle_${config.tokenParams.tokenSymbol}_${Date.now()}`;
      
      // Generate the required number of wallets
      const wallets = await WalletManager.getBuyerWallets(config.numberOfWallets, sessionId);

      // Step 3: Fund wallets (transfer SOL from launcher)
      console.log('\n💰 Step 3: Funding wallets...');
      await this.fundWalletsFromLauncher(launcher, wallets.slice(0, config.numberOfWallets), config.solAmountPerWallet);

      // Step 4: Execute bundle buys
      console.log('\n🛒 Step 4: Executing bundle buys...');
      const buyParams: BonkFunBuyParams = {
        tokenMint: result.tokenMint,
        solAmount: config.solAmountPerWallet,
        slippage: config.maxSlippage
      };

      result.buyResults = await this.executeBundleBuys(
        wallets.slice(0, config.numberOfWallets),
        buyParams,
        config
      );

      // Step 6: Calculate results
      result.totalSuccessful = result.buyResults.filter(r => r.signature).length;
      result.totalFailed = result.buyResults.filter(r => r.error).length;

      console.log('\n📊 Bundle Launch Complete!');
      console.log(`✅ Successful buys: ${result.totalSuccessful}/${config.numberOfWallets}`);
      console.log(`❌ Failed buys: ${result.totalFailed}/${config.numberOfWallets}`);
      console.log(`🏠 Token Mint: ${result.tokenMint.toString()}`);

      return result;

    } catch (error) {
      console.error('❌ Bundle launch failed:', error);
      throw error;
    }
  }

  /**
   * Execute bundle buy transactions with configured delays and retries
   */
  private async executeBundleBuys(
    wallets: Keypair[],
    buyParams: BonkFunBuyParams,
    config: BundleLaunchConfig
  ): Promise<BundleLaunchResult['buyResults']> {
    const results: BundleLaunchResult['buyResults'] = [];
    
    console.log(`🔄 Executing ${wallets.length} buy transactions...`);
    
    // Process wallets in small batches to avoid overwhelming the network
    const batchSize = 3;
    for (let i = 0; i < wallets.length; i += batchSize) {
      const batch = wallets.slice(i, i + batchSize);
      const batchPromises = batch.map(async (wallet, batchIndex) => {
        const walletIndex = i + batchIndex;
        console.log(`🛒 Wallet ${walletIndex + 1}/${wallets.length}: ${wallet.publicKey.toString()}`);
        
        let retries = 0;
        while (retries <= config.maxRetries) {
          try {
            const signature = await this.bonkFunService.buyToken(wallet, buyParams);
            return { walletIndex, signature };
          } catch (error) {
            retries++;
            console.error(`❌ Wallet ${walletIndex + 1} attempt ${retries} failed:`, error instanceof Error ? error.message : error);
            
            if (retries <= config.maxRetries) {
              console.log(`🔄 Retrying wallet ${walletIndex + 1} in 1 second...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              return { walletIndex, error: error instanceof Error ? error.message : 'Unknown error' };
            }
          }
        }
        
        return { walletIndex, error: 'Max retries exceeded' };
      });
      
      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Delay between batches
      if (i + batchSize < wallets.length && config.buyDelayMs > 0) {
        console.log(`⏳ Waiting ${config.buyDelayMs}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, config.buyDelayMs));
      }
    }
    
    return results;
  }

  /**
   * Fund wallets by transferring SOL from the launcher wallet
   */
  private async fundWalletsFromLauncher(
    launcher: Keypair,
    wallets: Keypair[],
    solAmountPerWallet: number
  ): Promise<void> {
    const requiredBalance = solAmountPerWallet + 0.01; // Add extra for fees
    
    console.log(`💸 Funding ${wallets.length} wallets with ${requiredBalance.toFixed(4)} SOL each...`);
    
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const balance = await this.connection.getBalance(wallet.publicKey);
      const balanceSOL = balance / 1e9;
      
      if (balanceSOL < requiredBalance) {
        const transferAmount = requiredBalance - balanceSOL;
        console.log(`💸 Transferring ${transferAmount.toFixed(4)} SOL to wallet ${i + 1}`);
        
        try {
          const transferIx = SystemProgram.transfer({
            fromPubkey: launcher.publicKey,
            toPubkey: wallet.publicKey,
            lamports: Math.floor(transferAmount * 1e9)
          });
          
          const { blockhash } = await this.connection.getLatestBlockhash();
          const transaction = new Transaction({
            recentBlockhash: blockhash,
            feePayer: launcher.publicKey
          }).add(transferIx);
          
          transaction.sign(launcher);
          
          const signature = await this.connection.sendRawTransaction(transaction.serialize());
          await this.connection.confirmTransaction(signature, 'confirmed');
          
          console.log(`✅ Funded wallet ${i + 1}: ${signature}`);
          
        } catch (error) {
          console.error(`❌ Failed to fund wallet ${i + 1}:`, error);
          throw new Error(`Failed to fund wallet ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        console.log(`✅ Wallet ${i + 1} already funded: ${balanceSOL.toFixed(4)} SOL`);
      }
    }
    
    console.log('💰 All wallets funded successfully!');
  }

  /**
   * Ensure all wallets have sufficient SOL for the buy amount + fees
   */
  private async ensureWalletsFunded(wallets: Keypair[], solAmountPerWallet: number): Promise<void> {
    const requiredBalance = solAmountPerWallet + 0.01; // Add extra for fees
    
    console.log(`💰 Funding ${wallets.length} wallets with ${requiredBalance.toFixed(4)} SOL each...`);
    
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const balance = await this.connection.getBalance(wallet.publicKey);
      const balanceSOL = balance / 1e9;
      
      if (balanceSOL < requiredBalance) {
        console.log(`💸 Funding wallet ${i + 1}: ${wallet.publicKey.toString()}`);
        console.log(`   Current: ${balanceSOL.toFixed(4)} SOL, Need: ${requiredBalance.toFixed(4)} SOL`);
        
        // In mainnet, we need to transfer from launcher wallet
        if (!this.connection.rpcEndpoint.includes('devnet')) {
          console.log(`💸 Transferring ${requiredBalance.toFixed(4)} SOL from launcher...`);
          
          // We'll implement this transfer in the bundle execution
          // For now, just log the requirement
        } else {
          // Devnet airdrop
          console.log(`🪂 Attempting devnet airdrop...`);
          try {
            const airdropAmount = (requiredBalance - balanceSOL) * 1e9;
            await this.connection.requestAirdrop(wallet.publicKey, airdropAmount);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for airdrop
          } catch (error) {
            console.error(`❌ Airdrop failed for wallet ${i + 1}:`, error);
          }
        }
      } else {
        console.log(`✅ Wallet ${i + 1} funded: ${balanceSOL.toFixed(4)} SOL`);
      }
    }
  }

  /**
   * Get bundle launch configuration from environment
   */
  static getConfigFromEnv(): Partial<BundleLaunchConfig> {
    return {
      launchMode: (process.env.BONKFUN_LAUNCH_MODE as 'classic' | 'tech') || 'tech',
      numberOfWallets: parseInt(process.env.BONKFUN_BUNDLE_WALLETS || '16'),
      solAmountPerWallet: parseFloat(process.env.BONKFUN_BUNDLE_SOL_PER_WALLET || '0.01'),
      maxSlippage: parseFloat(process.env.BONKFUN_MAX_SLIPPAGE || '0.05'),
      buyDelayMs: parseInt(process.env.BONKFUN_BUY_DELAY_MS || '500'),
      maxRetries: parseInt(process.env.BONKFUN_MAX_RETRIES || '3')
    };
  }
}

export { BundleLaunchConfig, BundleLaunchResult };
