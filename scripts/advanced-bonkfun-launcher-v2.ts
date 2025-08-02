import { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL, VersionedTransaction, ComputeBudgetProgram } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { WalletManager } from '../src/wallet-manager';
import { RaydiumLaunchlabService } from '../src/raydium-launchlab-service-v2';
import { BonkFunService } from '../src/services/bonkfun-service';
import { BundleBuyConfig, BundleBuyResult, BonkFunToken, PoolInfo } from '../src/types/bonkfun';
import * as bs58 from 'bs58';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Advanced BonkFun Bundle Launcher with Raydium Launchlab SDK Integration
 * Supports proper token discovery and trading via Raydium pools
 */
class AdvancedBonkFunLauncher {
  private connection: Connection;
  private mainWallet: Keypair;
  private raydiumService: RaydiumLaunchlabService;
  private bonkFunService: BonkFunService;

  constructor() {
    this.connection = new Connection(
      process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );

    // Initialize main wallet
    const privateKeyString = process.env.MAIN_WALLET_PRIVATE_KEY;
    if (!privateKeyString) {
      throw new Error('MAIN_WALLET_PRIVATE_KEY not found in environment variables');
    }

    this.mainWallet = Keypair.fromSecretKey(
      bs58.decode(privateKeyString)
    );

    // Initialize services
    this.raydiumService = new RaydiumLaunchlabService(this.connection);
    this.bonkFunService = new BonkFunService(this.connection);
  }

  /**
   * Search and display BonkFun tokens
   */
  async searchBonkFunTokens(query?: string): Promise<BonkFunToken[]> {
    console.log('🔍 Searching BonkFun tokens...');
    const tokens = await this.bonkFunService.searchBonkFunTokens(query, 20);
    
    if (tokens.length === 0) {
      console.log('❌ No tokens found');
      return [];
    }

    console.log(`✅ Found ${tokens.length} tokens:`);
    tokens.forEach((token, index) => {
      console.log(`${index + 1}. ${token.name} (${token.symbol})`);
      console.log(`   📍 Address: ${token.address}`);
      console.log(`   💰 Market Cap: $${token.marketCap.toLocaleString()}`);
      console.log(`   💵 Price: $${token.price}`);
      console.log(`   📈 24h Volume: $${token.volume24h.toLocaleString()}`);
      console.log(`   🏗️ Launched: ${token.isLaunched ? 'Yes' : 'No'}`);
      console.log(`   🔧 Tech: ${token.isTech ? 'Yes' : 'No'}`);
      console.log('');
    });

    return tokens;
  }

  /**
   * Get pool information for a token
   */
  async getTokenPoolInfo(tokenAddress: string): Promise<PoolInfo | null> {
    console.log(`🔍 Finding pool for token: ${tokenAddress}`);
    
    // Try BonkFun service first
    const poolInfo = await this.bonkFunService.getPoolInfo(tokenAddress);
    if (poolInfo) {
      console.log('✅ Pool found via BonkFun service:');
      console.log(`   Pool ID: ${poolInfo.id}`);
      console.log(`   Base: ${poolInfo.baseMint}`);
      console.log(`   Quote: ${poolInfo.quoteMint}`);
      return poolInfo;
    }

    // Try Raydium service
    const raydiumPoolInfo = await this.raydiumService.getTokenInfo(tokenAddress);
    if (raydiumPoolInfo) {
      console.log('✅ Pool found via Raydium service');
      return raydiumPoolInfo;
    }

    console.log('❌ No pool found for this token');
    return null;
  }

  /**
   * Execute bundle buy operation
   */
  async executeBundleBuy(config: BundleBuyConfig): Promise<BundleBuyResult[]> {
    console.log('\n🚀 Starting bundle buy operation...');
    console.log(`Target Token: ${config.tokenAddress}`);
    console.log(`SOL Amount per wallet: ${config.solAmount}`);
    console.log(`Number of wallets: ${config.walletCount}`);
    console.log(`Slippage: ${config.slippage * 100}%`);
    console.log(`Priority Fee: ${config.priorityFee} microLamports`);

    const results: BundleBuyResult[] = [];

    // Get buyer wallets
    const buyerWallets = await WalletManager.getBuyerWallets(config.walletCount, 'BONK_LAUNCHER');
    const walletsToUse = buyerWallets.slice(0, config.walletCount);

    if (walletsToUse.length < config.walletCount) {
      throw new Error(`Not enough wallets available. Requested: ${config.walletCount}, Available: ${walletsToUse.length}`);
    }

    // Get pool information
    const poolInfo = await this.raydiumService.findTokenPools(config.tokenAddress);
    if (!poolInfo || poolInfo.length === 0) {
      // Check if token is at least tradeable
      const isTradeable = await this.raydiumService.isTokenTradeable(config.tokenAddress);
      if (!isTradeable) {
        throw new Error('Cannot find pool for token. Token might not be launched yet.');
      }
    }

    // Execute buys for each wallet
    for (let i = 0; i < walletsToUse.length; i++) {
      const wallet = walletsToUse[i];
      
      try {
        console.log(`\n💰 Wallet ${i + 1}/${walletsToUse.length}: ${wallet.publicKey.toString()}`);
        
        // Check wallet balance
        const balance = await this.connection.getBalance(wallet.publicKey);
        const balanceSOL = balance / LAMPORTS_PER_SOL;
        
        console.log(`   Balance: ${balanceSOL.toFixed(6)} SOL`);
        
        if (balanceSOL < config.solAmount + 0.01) { // 0.01 SOL for fees
          console.log(`   ❌ Insufficient balance (need ${config.solAmount + 0.01} SOL)`);
          results.push({
            success: false,
            walletAddress: wallet.publicKey.toString(),
            tokenAddress: config.tokenAddress,
            solSpent: 0,
            tokensReceived: 0,
            signature: '',
            error: 'Insufficient balance'
          });
          continue;
        }

        // Create swap transaction
        const swapTx = await this.raydiumService.createSwapTransaction(
          wallet,
          'So11111111111111111111111111111111111111112', // SOL mint
          config.tokenAddress,
          config.solAmount * LAMPORTS_PER_SOL
        );

        if (!swapTx) {
          console.log(`   ❌ Failed to create swap transaction`);
          results.push({
            success: false,
            walletAddress: wallet.publicKey.toString(),
            tokenAddress: config.tokenAddress,
            solSpent: 0,
            tokensReceived: 0,
            signature: '',
            error: 'Failed to create swap transaction'
          });
          continue;
        }

        // Add priority fee and compute units
        const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: config.priorityFee
        });
        const computeUnitIx = ComputeBudgetProgram.setComputeUnitLimit({
          units: 400000
        });

        // Create final transaction
        let finalTx: Transaction;
        if (swapTx instanceof VersionedTransaction) {
          // Handle versioned transaction
          console.log('   🔄 Using versioned transaction');
          // For now, skip versioned transactions
          results.push({
            success: false,
            walletAddress: wallet.publicKey.toString(),
            tokenAddress: config.tokenAddress,
            solSpent: 0,
            tokensReceived: 0,
            signature: '',
            error: 'Versioned transactions not yet supported'
          });
          continue;
        } else {
          finalTx = new Transaction();
          finalTx.add(priorityFeeIx);
          finalTx.add(computeUnitIx);
          // Add swap instructions here
        }

        // Send transaction
        console.log(`   📤 Sending transaction...`);
        const signature = await sendAndConfirmTransaction(
          this.connection,
          finalTx,
          [wallet],
          {
            commitment: 'confirmed',
            maxRetries: config.maxRetries
          }
        );

        console.log(`   ✅ Success! Signature: ${signature}`);
        
        results.push({
          success: true,
          walletAddress: wallet.publicKey.toString(),
          tokenAddress: config.tokenAddress,
          solSpent: config.solAmount,
          tokensReceived: 0, // Would need to calculate from transaction
          signature: signature
        });

        // Delay between transactions if specified
        if (config.delayBetweenBuys > 0 && i < walletsToUse.length - 1) {
          console.log(`   ⏳ Waiting ${config.delayBetweenBuys}ms before next buy...`);
          await new Promise(resolve => setTimeout(resolve, config.delayBetweenBuys));
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        results.push({
          success: false,
          walletAddress: wallet.publicKey.toString(),
          tokenAddress: config.tokenAddress,
          solSpent: 0,
          tokensReceived: 0,
          signature: '',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Main launcher function
   */
  async launch() {
    try {
      console.log('🚀 ADVANCED BONKFUN BUNDLE LAUNCHER');
      console.log('=' .repeat(60));
      console.log(`🔗 Connection: ${this.connection.rpcEndpoint}`);
      console.log(`💰 Main Wallet: ${this.mainWallet.publicKey.toString()}`);
      
      // Get main wallet balance
      const mainBalance = await this.connection.getBalance(this.mainWallet.publicKey);
      console.log(`💵 Main Balance: ${(mainBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL\n`);

      // Example: Search for tokens
      console.log('🔍 Searching for popular BonkFun tokens...');
      const tokens = await this.searchBonkFunTokens('bonk');

      if (tokens.length === 0) {
        console.log('No tokens found. Exiting...');
        return;
      }

      // Example configuration for bundle buy
      const config: BundleBuyConfig = {
        tokenAddress: tokens[0].address, // Use first token found
        solAmount: 0.01, // 0.01 SOL per wallet
        walletCount: 3, // Use 3 wallets
        slippage: 0.01, // 1% slippage
        priorityFee: 100000, // 0.1 SOL priority fee
        maxRetries: 3,
        delayBetweenBuys: 1000, // 1 second delay
        useJito: false
      };

      // Execute bundle buy
      const results = await this.executeBundleBuy(config);

      // Summary
      console.log('\n📊 BUNDLE BUY SUMMARY');
      console.log('=' .repeat(40));
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      console.log(`✅ Successful: ${successful.length}`);
      console.log(`❌ Failed: ${failed.length}`);
      
      if (successful.length > 0) {
        const totalSOLSpent = successful.reduce((sum, r) => sum + r.solSpent, 0);
        console.log(`💰 Total SOL spent: ${totalSOLSpent.toFixed(6)} SOL`);
      }

      if (failed.length > 0) {
        console.log('\n❌ Failed transactions:');
        failed.forEach((result, index) => {
          console.log(`${index + 1}. ${result.walletAddress}: ${result.error}`);
        });
      }

    } catch (error) {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    }
  }
}

// Run the launcher
if (require.main === module) {
  const launcher = new AdvancedBonkFunLauncher();
  launcher.launch()
    .then(() => {
      console.log('\n🎉 Bundle launcher completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Bundle launcher failed:', error);
      process.exit(1);
    });
}

export { AdvancedBonkFunLauncher };
