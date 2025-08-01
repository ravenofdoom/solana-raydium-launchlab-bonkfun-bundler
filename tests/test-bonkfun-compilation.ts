import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletManager } from '../src/wallet-manager';
import { BonkFunService } from '../src/bonkfun-service';
import * as bs58 from 'bs58';
import * as dotenv from 'dotenv';

dotenv.config();

console.log('✅ TypeScript compilation test passed!');
console.log('📦 All imports resolved correctly');

// Test bs58 usage
const testKey = bs58.encode(Buffer.from('hello'));
console.log(`🔑 BS58 test: ${testKey}`);

// Test wallet manager import
console.log(`💼 WalletManager available: ${typeof WalletManager}`);

// Test BonkFun service import
console.log(`🎯 BonkFunService available: ${typeof BonkFunService}`);

console.log('🎉 All imports and compilation successful!');
