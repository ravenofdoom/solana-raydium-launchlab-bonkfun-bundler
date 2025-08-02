// BonkFun Platform Types

export interface BonkFunToken {
  address: string;
  name: string;
  symbol: string;
  creator: string;
  marketCap: number;
  price: number;
  volume24h: number;
  holders: number;
  poolAddress?: string;
  isLaunched: boolean;
  isTech: boolean;
  description?: string;
  imageUrl?: string;
  website?: string;
  telegram?: string;
  twitter?: string;
}

export interface BonkFunApiResponse {
  success: boolean;
  data: BonkFunToken[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface LaunchpadTokenInfo {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
  supply: number;
  creator: string;
  poolId?: string;
  marketId?: string;
  baseMint: string;
  quoteMint: string;
  lpMint?: string;
  baseDecimals: number;
  quoteDecimals: number;
  lpDecimals?: number;
  version: number;
  programId: string;
  authority: string;
  openOrders: string;
  targetOrders: string;
  baseVault: string;
  quoteVault: string;
  withdrawQueue: string;
  lpVault: string;
  marketVersion: number;
  marketProgramId: string;
  marketAuthority: string;
  marketBaseVault: string;
  marketQuoteVault: string;
  bids: string;
  asks: string;
  eventQueue: string;
}

export interface BundleBuyConfig {
  tokenAddress: string;
  solAmount: number;
  walletCount: number;
  slippage: number;
  priorityFee: number;
  maxRetries: number;
  delayBetweenBuys: number;
  useJito: boolean;
  jitoTip?: number;
}

export interface BundleBuyResult {
  success: boolean;
  walletAddress: string;
  tokenAddress: string;
  solSpent: number;
  tokensReceived: number;
  signature: string;
  error?: string;
}

export interface PoolInfo {
  id: string;
  baseMint: string;
  quoteMint: string;
  lpMint: string;
  baseDecimals: number;
  quoteDecimals: number;
  lpDecimals: number;
  version: number;
  programId: string;
  authority: string;
  openOrders: string;
  targetOrders: string;
  baseVault: string;
  quoteVault: string;
  withdrawQueue: string;
  lpVault: string;
  marketVersion: number;
  marketProgramId: string;
  marketAuthority: string;
  marketBaseVault: string;
  marketQuoteVault: string;
  bids: string;
  asks: string;
  eventQueue: string;
  lookupTableAccount?: string;
}
