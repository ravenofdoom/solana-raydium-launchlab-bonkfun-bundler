import dotenv from "dotenv";

dotenv.config();

// Solana Configuration
export const RPC_ENDPOINT = process.env.RPC_ENDPOINT || "https://api.mainnet-beta.solana.com";
export const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

// Jito Configuration
export const JITO_URL = process.env.JITO_URL || "https://mainnet.block-engine.jito.wtf/api/v1/bundles";
export const JITO_TIP_AMOUNT = parseFloat(process.env.JITO_TIP_AMOUNT || "0.01");

// Trading Configuration
export const DISTRIBUTE_WALLET_NUM = parseInt(process.env.DISTRIBUTE_WALLET_NUM || "16");
export const DISTRIBUTE_AMOUNTS = parseFloat(process.env.DISTRIBUTE_AMOUNTS || "0.05");

// Token Configuration
export const TOKEN_NAME = process.env.TOKEN_NAME || "BonkFun Token";
export const TOKEN_SYMBOL = process.env.TOKEN_SYMBOL || "BONK";
export const TOKEN_DECIMALS = parseInt(process.env.TOKEN_DECIMALS || "9");
export const TOTAL_SUPPLY = parseInt(process.env.TOTAL_SUPPLY || "1000000000");

// BonkFun API Configuration
export const BONKFUN_API_URL = process.env.BONKFUN_API_URL || "https://api.bonkfun.com";
export const BONKFUN_API_KEY = process.env.BONKFUN_API_KEY || "";

// Raydium Configuration
export const RAYDIUM_LP_FEE = parseFloat(process.env.RAYDIUM_LP_FEE || "0.0025");
export const SLIPPAGE_TOLERANCE = parseFloat(process.env.SLIPPAGE_TOLERANCE || "0.01");

// Security
export const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || "3");
export const TRANSACTION_TIMEOUT = parseInt(process.env.TRANSACTION_TIMEOUT || "30000");

// Validation
if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is required in environment variables");
}

export const validateConfig = () => {
  const requiredVars = [
    { name: 'PRIVATE_KEY', value: PRIVATE_KEY },
    { name: 'RPC_ENDPOINT', value: RPC_ENDPOINT }
  ];

  for (const { name, value } of requiredVars) {
    if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }

  console.log("Configuration validated successfully");
};
