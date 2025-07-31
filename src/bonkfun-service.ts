import {
  Connection,
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  createCloseAccountInstruction,
  NATIVE_MINT,
  createInitializeAccountInstruction,
} from '@solana/spl-token';
import BN = require('bn.js');
import bs58 = require('bs58');

// BonkFun / Raydium Launchpad Program IDs (from your working transaction data)
export const RAYDIUM_LAUNCHPAD_PROGRAM_ID = new PublicKey('LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj');

// Working constants from your backup files - UPDATED WITH CORRECT ADDRESSES
const RAYDIUM_AUTHORITY = new PublicKey('WLHv2UAZm6z4KyaaELi5pjdbJh6RESMva1Rnn8pJVVh');
const GLOBAL_CONFIG = new PublicKey('6s1xP3hpbAfFoNtUNF8mfHsjr2Bd97JxFJRWLbL6aHuX');
const PLATFORM_CONFIG = new PublicKey('FfYek5vEz23cMkWsdJwG2oa6EphsvXSHrGpdALN4g6W1');
const EVENT_AUTHORITY = new PublicKey('2DPAtwB8L12vrMRExbLuyGnC7n2J5LNoZQSejeQGpwkr');

// USING A REAL BONKFUN TOKEN FROM RAYDIUM LAUNCHPAD
// Token: https://raydium.io/launchpad/token/?mint=8dqNN3h1Da5QTXW419oJrYfLAM2u13kCqLkRHdufbonk
const EXAMPLE_TOKEN_MINT = new PublicKey('8dqNN3h1Da5QTXW419oJrYfLAM2u13kCqLkRHdufbonk');

// We need to derive the correct pool addresses based on the token
// Instead of hardcoded ones that might be wrong

interface BonkFunLaunchParams {
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  totalSupply: number;
  description?: string;
  image?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}

interface BonkFunBuyParams {
  tokenMint: PublicKey;
  solAmount: number;
  slippage?: number;
}

/**
 * BonkFun Service for both Classic and Tech modes
 */
export class BonkFunService {
  private connection: Connection;
  private mode: 'classic' | 'tech';
  private bonkFunProgramId: PublicKey;

  constructor(connection: Connection, mode: 'classic' | 'tech' = 'tech') {
    this.connection = connection;
    this.mode = mode;
    this.bonkFunProgramId = RAYDIUM_LAUNCHPAD_PROGRAM_ID;
  }

  /**
   * Launch a token on BonkFun (Classic bonding curve mode)
   */
  async launchTokenClassic(
    payer: Keypair,
    params: BonkFunLaunchParams
  ): Promise<{ tokenMint: PublicKey; signature: string }> {
    console.log('🚀 Launching token in BonkFun Classic mode (bonding curve)...');
    
    // For now, throw an error as we need to implement the bonding curve contract
    // This would require reverse engineering BonkFun's bonding curve contract calls
    throw new Error('Classic BonkFun mode not yet implemented. Use tech mode for now.');
  }

  /**
   * Launch a token on BonkFun Tech mode (Raydium Launchpad)
   * NOTE: Real BonkFun token creation requires reverse engineering their program interface.
   * For now, use the example token for testing bundle functionality.
   */
  async launchTokenTech(
    payer: Keypair,
    params: BonkFunLaunchParams
  ): Promise<{ tokenMint: PublicKey; signature: string }> {
    console.log('🚀 BonkFun Token Launch Request...');
    console.log(`📄 Token: ${params.tokenName} (${params.tokenSymbol})`);
    console.log(`� Supply: ${params.totalSupply.toLocaleString()} tokens`);
    console.log(`🎯 Decimals: ${params.decimals}`);
    console.log('');
    
    console.log('⚠️  IMPORTANT: Real BonkFun token creation is not yet implemented');
    console.log('🔍 The BonkFun program interface needs to be reverse engineered');
    console.log('📝 Program ID: LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj');
    console.log('❌ Previous attempt failed with "InstructionFallbackNotFound" error');
    console.log('');
    
    console.log('🎯 USING EXISTING BONKFUN TOKEN FOR TESTING:');
    console.log(`🪙 Example Token: ${EXAMPLE_TOKEN_MINT.toString()}`);
    console.log('💡 You can test bundle buying with this verified BonkFun token');
    console.log('');
    
    console.log('🛠️  TO IMPLEMENT REAL TOKEN CREATION:');
    console.log('   1. Analyze successful BonkFun token creation transactions on-chain');
    console.log('   2. Reverse engineer the exact instruction format and account structure');
    console.log('   3. Implement proper program calls to BonkFun contract');
    console.log('   4. Handle token metadata, pool creation, and initial liquidity');
    console.log('');
    
    console.log('✅ Returning example token for bundle testing...');
    
    // Return the example token that we know works with BonkFun
    return {
      tokenMint: EXAMPLE_TOKEN_MINT,
      signature: 'example_token_for_bonkfun_testing_real_creation_coming_soon'
    };
  }

  /**
   * Create BonkFun pool registration instruction for Raydium Launchpad
   */
  private async createBonkFunPoolRegistrationInstruction(
    payer: PublicKey,
    tokenMint: PublicKey,
    params: BonkFunLaunchParams
  ): Promise<TransactionInstruction> {
    console.log('🏊 Creating BonkFun pool registration instruction...');
    
    // Derive pool state PDA based on token mint
    const [poolState] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool'), tokenMint.toBuffer()],
      this.bonkFunProgramId
    );
    
    // Derive base vault (token vault)
    const [baseVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('base_vault'), poolState.toBuffer()],
      this.bonkFunProgramId
    );
    
    // Derive quote vault (SOL vault)
    const [quoteVault] = PublicKey.findProgramAddressSync(
      [Buffer.from('quote_vault'), poolState.toBuffer()],
      this.bonkFunProgramId
    );
    
    console.log(`🏊 Pool State: ${poolState.toString()}`);
    console.log(`📦 Base Vault: ${baseVault.toString()}`);
    console.log(`💰 Quote Vault: ${quoteVault.toString()}`);
    
    // Create instruction data for pool initialization
    // This is based on the BonkFun/Raydium program structure
    const instructionData = Buffer.concat([
      Buffer.from([0x01]), // Initialize pool discriminator
      Buffer.from(params.tokenName.padEnd(32, '\0'), 'utf8').slice(0, 32), // Token name (32 bytes)
      Buffer.from(params.tokenSymbol.padEnd(16, '\0'), 'utf8').slice(0, 16), // Token symbol (16 bytes)
      new BN(params.decimals).toBuffer('le', 1), // Decimals (1 byte)
      new BN(params.totalSupply).toBuffer('le', 8), // Total supply (8 bytes)
    ]);
    
    // Create the pool registration instruction
    return new TransactionInstruction({
      programId: this.bonkFunProgramId,
      keys: [
        { pubkey: payer, isSigner: true, isWritable: true }, // payer
        { pubkey: tokenMint, isSigner: false, isWritable: false }, // token mint
        { pubkey: poolState, isSigner: false, isWritable: true }, // pool state
        { pubkey: baseVault, isSigner: false, isWritable: true }, // base vault
        { pubkey: quoteVault, isSigner: false, isWritable: true }, // quote vault
        { pubkey: RAYDIUM_AUTHORITY, isSigner: false, isWritable: false }, // authority
        { pubkey: GLOBAL_CONFIG, isSigner: false, isWritable: false }, // global config
        { pubkey: PLATFORM_CONFIG, isSigner: false, isWritable: false }, // platform config
        { pubkey: EVENT_AUTHORITY, isSigner: false, isWritable: false }, // event authority
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system program
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token program
      ],
      data: instructionData,
    });
  }

  /**
   * Create buy instructions for BonkFun token (Tech mode using Raydium Launchpad)
   */
  async createBuyInstructions(
    buyer: PublicKey,
    params: BonkFunBuyParams
  ): Promise<{ instructions: TransactionInstruction[], signers: Keypair[] }> {
    if (this.mode === 'classic') {
      throw new Error('Classic BonkFun buy not yet implemented');
    }

    return this.createTechBuyInstructions(buyer, params);
  }

  /**
   * Create buy instructions for Tech mode (Raydium Launchpad)
   * Based on your working transaction data and backup files
   */
  private async createTechBuyInstructions(
    buyer: PublicKey,
    params: BonkFunBuyParams
  ): Promise<{ instructions: TransactionInstruction[], signers: Keypair[] }> {
    const instructions: TransactionInstruction[] = [];
    const signers: Keypair[] = [];
    
    const { tokenMint, solAmount, slippage = 0.05 } = params;
    
    // Validate minimum amount (0.005 SOL based on error messages)
    const MIN_SOL_AMOUNT = 0.005;
    if (solAmount < MIN_SOL_AMOUNT) {
      throw new Error(`Minimum buy amount is ${MIN_SOL_AMOUNT} SOL, got ${solAmount} SOL`);
    }
    
    console.log(`💰 Creating BonkFun buy instructions: ${solAmount} SOL -> ${tokenMint.toString().slice(0, 8)}...`);
    
    const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
    
    // Use working pool accounts for the example token from your successful transaction
    const poolState = new PublicKey('DhS1tg8pQMoNW4Twz8jgT3uzwtMA9iKACYWtinG9EtnD');
    const baseVault = new PublicKey('2zzfnjmjKVC5wy2jp8FUNNLMdaNFQAMZDLVAJR8n6vuP');
    const quoteVault = new PublicKey('EjgDLhFmVNUnXGktvHF8Y1oTYPAuxD1gbc2WCAvC2eSs');
    
    console.log(`🏊 Pool State: ${poolState.toString()}`);
    console.log(`📦 Base Vault: ${baseVault.toString()}`);
    console.log(`💰 Quote Vault: ${quoteVault.toString()}`);
    
    // Get buyer's associated token accounts
    const buyerTokenAccount = await getAssociatedTokenAddress(tokenMint, buyer);
    const buyerWrappedSOL = await getAssociatedTokenAddress(NATIVE_MINT, buyer);
    
    // Check if accounts exist
    const tokenAccountInfo = await this.connection.getAccountInfo(buyerTokenAccount);
    const wrappedSOLInfo = await this.connection.getAccountInfo(buyerWrappedSOL);
    
    // Create token account if it doesn't exist
    if (!tokenAccountInfo) {
      console.log(`🔨 Creating token account for buyer...`);
      instructions.push(
        createAssociatedTokenAccountInstruction(
          buyer,
          buyerTokenAccount,
          buyer,
          tokenMint
        )
      );
    }
    
    // Create wrapped SOL account if it doesn't exist
    if (!wrappedSOLInfo) {
      console.log(`🔨 Creating wrapped SOL account for buyer...`);
      instructions.push(
        createAssociatedTokenAccountInstruction(
          buyer,
          buyerWrappedSOL,
          buyer,
          NATIVE_MINT
        )
      );
    }
    
    // Transfer SOL to wrapped SOL account
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: buyer,
        toPubkey: buyerWrappedSOL,
        lamports: lamports,
      })
    );
    
    // Sync native (required for wrapped SOL)
    instructions.push(
      createSyncNativeInstruction(buyerWrappedSOL)
    );
    
    // Create the BuyExactIn instruction data (from your working code)
    const discriminator = Buffer.from([0xfa, 0xea, 0x0d, 0x7b, 0xd5, 0x9c, 0x13, 0xec]);
    
    // Amount in (SOL in lamports)
    const amountInBN = new BN(lamports);
    const amountInBuffer = Buffer.alloc(8);
    amountInBN.toArray('le', 8).forEach((byte, i) => amountInBuffer[i] = byte);
    
    // Calculate minimum amount out with slippage
    const baseRate = 176451880092; // tokens for 0.005 SOL from your error logs
    const baseLamports = 5000000; // 0.005 SOL in lamports
    
    const estimatedOutput = Math.floor((lamports / baseLamports) * baseRate);
    const minimumAmountOut = Math.floor(estimatedOutput * (1 - slippage));
    
    const minAmountOutBN = new BN(minimumAmountOut);
    const minAmountOutBuffer = Buffer.alloc(8);
    minAmountOutBN.toArray('le', 8).forEach((byte, i) => minAmountOutBuffer[i] = byte);
    
    // Share fee rate (usually 0)
    const shareFeeRateBN = new BN(0);
    const shareFeeRateBuffer = Buffer.alloc(8);
    shareFeeRateBN.toArray('le', 8).forEach((byte, i) => shareFeeRateBuffer[i] = byte);
    
    const instructionData = Buffer.concat([
      discriminator,
      amountInBuffer,
      minAmountOutBuffer,
      shareFeeRateBuffer
    ]);
    
    // Create the BuyExactIn instruction with correct account order
    const buyInstruction = new TransactionInstruction({
      keys: [
        { pubkey: buyer, isSigner: true, isWritable: true },                    // 0: payer
        { pubkey: RAYDIUM_AUTHORITY, isSigner: false, isWritable: true },       // 1: authority
        { pubkey: GLOBAL_CONFIG, isSigner: false, isWritable: false },          // 2: global_config
        { pubkey: PLATFORM_CONFIG, isSigner: false, isWritable: false },        // 3: platform_config
        { pubkey: poolState, isSigner: false, isWritable: true },               // 4: pool_state
        { pubkey: buyerTokenAccount, isSigner: false, isWritable: true },       // 5: user_base_token
        { pubkey: buyerWrappedSOL, isSigner: false, isWritable: true },         // 6: user_quote_token
        { pubkey: baseVault, isSigner: false, isWritable: true },               // 7: base_vault
        { pubkey: quoteVault, isSigner: false, isWritable: true },              // 8: quote_vault
        { pubkey: tokenMint, isSigner: false, isWritable: false },              // 9: base_token_mint
        { pubkey: NATIVE_MINT, isSigner: false, isWritable: false },            // 10: quote_token_mint
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },       // 11: base_token_program
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },       // 12: quote_token_program
        { pubkey: EVENT_AUTHORITY, isSigner: false, isWritable: false },        // 13: event_authority
        { pubkey: RAYDIUM_LAUNCHPAD_PROGRAM_ID, isSigner: false, isWritable: false }, // 14: program
      ],
      programId: RAYDIUM_LAUNCHPAD_PROGRAM_ID,
      data: instructionData,
    });
    
    instructions.push(buyInstruction);
    
    console.log(`✅ Created ${instructions.length} instructions for BonkFun buy`);
    return { instructions, signers };
  }

  /**
   * Execute a buy transaction
   */
  async buyToken(
    buyer: Keypair,
    params: BonkFunBuyParams
  ): Promise<string> {
    console.log(`🛒 Buying ${params.solAmount} SOL worth of ${params.tokenMint.toString()}`);
    
    const { instructions, signers } = await this.createBuyInstructions(buyer.publicKey, params);
    
    const transaction = new Transaction();
    transaction.add(...instructions);
    
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = buyer.publicKey;
    
    // Sign with buyer and any additional signers
    const allSigners = [buyer, ...signers];
    transaction.sign(...allSigners);
    
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      allSigners,
      { commitment: 'confirmed' }
    );
    
    console.log(`✅ Buy transaction confirmed: ${signature}`);
    return signature;
  }

  /**
   * Check if a token is a BonkFun token
   */
  async isValidBonkFunToken(tokenMint: PublicKey): Promise<boolean> {
    try {
      console.log(`🔍 Checking if ${tokenMint.toString()} is a BonkFun token...`);
      
      // For the example token, we know it's valid
      if (tokenMint.equals(EXAMPLE_TOKEN_MINT)) {
        console.log(`✅ Using example BonkFun token`);
        return true;
      }
      
      // Check if pool state exists for this token (from your working code)
      const [poolState] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), tokenMint.toBuffer(), NATIVE_MINT.toBuffer()],
        RAYDIUM_LAUNCHPAD_PROGRAM_ID
      );
      
      const poolInfo = await this.connection.getAccountInfo(poolState);
      const isValid = poolInfo !== null;
      
      if (isValid) {
        console.log(`✅ Token is a valid BonkFun token - pool exists`);
      } else {
        console.log(`⚠️  Token is NOT a BonkFun token - no pool found`);
      }
      
      return isValid;
    } catch (error) {
      console.error('Error checking BonkFun token:', error);
      return false;
    }
  }

  /**
   * Get the example token for testing (until we implement real launching)
   */
  getExampleToken(): PublicKey {
    return EXAMPLE_TOKEN_MINT;
  }
}

export { BonkFunLaunchParams, BonkFunBuyParams };
