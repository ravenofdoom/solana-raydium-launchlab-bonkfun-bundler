import { PublicKey } from '@solana/web3.js';

// Environment Configuration
export const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
export const RPC_ENDPOINT = process.env.RPC_ENDPOINT || process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';
export const DISTRIBUTE_WALLET_NUM = parseInt(process.env.DISTRIBUTE_WALLET_NUM || '8');
export const DISTRIBUTE_AMOUNTS = parseFloat(process.env.DISTRIBUTE_AMOUNTS || '0.006');

// Jito Configuration
export const JITO_URL = process.env.JITO_URL || 'https://mainnet.block-engine.jito.wtf/api/v1/bundles';
export const JITO_TIP_AMOUNT = parseFloat(process.env.JITO_TIP_AMOUNT || '0.003');

// Token Configuration
export const TOKEN_NAME = process.env.TOKEN_NAME || 'TestBundle16';
export const TOKEN_SYMBOL = process.env.TOKEN_SYMBOL || 'TB16';
export const TOKEN_DECIMALS = parseInt(process.env.TOKEN_DECIMALS || '9');
export const TOTAL_SUPPLY = parseInt(process.env.TOTAL_SUPPLY || '1000000000');
export const SLIPPAGE_TOLERANCE = parseFloat(process.env.SLIPPAGE_TOLERANCE || '0.01');

// Max Retries
export const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3');

// Solana Program IDs
export const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111112');
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const RENT_PROGRAM_ID = new PublicKey('SysvarRent111111111111111111111111111111111');

// Raydium Program IDs
export const RAYDIUM_LIQUIDITY_POOL_V4_PROGRAM_ID = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
export const RAYDIUM_AMM_V4_PROGRAM_ID = new PublicKey('5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1');
export const RAYDIUM_OPENBOOK_AMM = new PublicKey('EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj');

// BonkFun Constants
export const BONKFUN_API_BASE = 'https://api.bonkfun.com';
export const BONKFUN_PROGRAM_ID = new PublicKey('BonkFun111111111111111111111111111111111111');

// Jito Constants
export const JITO_BLOCK_ENGINE_URL = 'https://mainnet.block-engine.jito.wtf';
export const JITO_BUNDLE_API = `${JITO_BLOCK_ENGINE_URL}/api/v1/bundles`;

// Trading Constants
export const DEFAULT_SLIPPAGE = 0.01; // 1%
export const MAX_SLIPPAGE = 0.05; // 5%
export const DEFAULT_PRIORITY_FEE = 0.000005; // 0.000005 SOL
export const RENT_EXEMPT_AMOUNT = 0.00203928; // ~0.002 SOL for rent exemption

// Network Constants
export const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
export const DEVNET_RPC = 'https://api.devnet.solana.com';

// Wallet Constants
export const DEFAULT_WALLET_COUNT = 8;
export const DEFAULT_SOL_PER_WALLET = 0.006; // 0.006 SOL per wallet
export const MIN_SOL_BALANCE = 0.001; // Minimum SOL balance to keep in wallets

// Transaction Constants
export const TRANSACTION_TIMEOUT = 30000; // 30 seconds
export const CONFIRMATION_TIMEOUT = 60000; // 60 seconds

// Bundle Constants
export const MAX_TRANSACTIONS_PER_BUNDLE = 5;
export const BUNDLE_TIP_MULTIPLIER = 1.5;
