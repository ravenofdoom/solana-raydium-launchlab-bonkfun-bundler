import fs from "fs";
import path from "path";

/**
 * Saves lookup table address to file
 */
export const saveLUTFile = (lutAddress: string): void => {
  try {
    const dataDir = path.join(process.cwd(), "data");
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const lutFilePath = path.join(dataDir, "lookup-table.json");
    const lutData = {
      address: lutAddress,
      created: new Date().toISOString(),
      network: process.env.NODE_ENV === "production" ? "mainnet" : "devnet"
    };
    
    fs.writeFileSync(lutFilePath, JSON.stringify(lutData, null, 2));
    console.log(`✅ LUT address saved to: ${lutFilePath}`);
  } catch (error) {
    console.error("❌ Error saving LUT file:", error);
    throw error;
  }
};

/**
 * Loads lookup table address from file
 */
export const loadLUTFile = (): string | null => {
  try {
    const lutFilePath = path.join(process.cwd(), "data", "lookup-table.json");
    
    if (!fs.existsSync(lutFilePath)) {
      console.log("📄 No LUT file found");
      return null;
    }
    
    const lutData = JSON.parse(fs.readFileSync(lutFilePath, "utf8"));
    console.log(`✅ LUT address loaded: ${lutData.address}`);
    return lutData.address;
  } catch (error) {
    console.error("❌ Error loading LUT file:", error);
    return null;
  }
};

/**
 * Saves transaction signatures to file
 */
export const saveTransactionLog = (signatures: string[], type: string): void => {
  try {
    const dataDir = path.join(process.cwd(), "data");
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const logFilePath = path.join(dataDir, `transactions-${type}-${timestamp}.json`);
    
    const logData = {
      type,
      timestamp: new Date().toISOString(),
      signatures,
      count: signatures.length
    };
    
    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
    console.log(`✅ Transaction log saved to: ${logFilePath}`);
  } catch (error) {
    console.error("❌ Error saving transaction log:", error);
  }
};

/**
 * Saves wallet information to file
 */
export const saveWalletInfo = (wallets: { publicKey: string; privateKey?: string }[]): void => {
  try {
    const dataDir = path.join(process.cwd(), "data");
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const walletFilePath = path.join(dataDir, `wallets-${timestamp}.json`);
    
    // Only save public keys for security
    const safeWalletData = wallets.map(wallet => ({
      publicKey: wallet.publicKey,
      created: new Date().toISOString()
    }));
    
    fs.writeFileSync(walletFilePath, JSON.stringify(safeWalletData, null, 2));
    console.log(`✅ Wallet info saved to: ${walletFilePath}`);
  } catch (error) {
    console.error("❌ Error saving wallet info:", error);
  }
};

/**
 * Creates a backup of important data
 */
export const createBackup = (): void => {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const backupDir = path.join(process.cwd(), "backups");
    
    if (!fs.existsSync(dataDir)) {
      console.log("📁 No data directory found to backup");
      return;
    }
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    
    // Copy data directory to backup
    fs.cpSync(dataDir, backupPath, { recursive: true });
    console.log(`✅ Backup created at: ${backupPath}`);
  } catch (error) {
    console.error("❌ Error creating backup:", error);
  }
};

/**
 * Formats numbers for display
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Formats SOL amounts for display
 */
export const formatSOL = (lamports: number): string => {
  return formatNumber(lamports / 1e9, 6) + " SOL";
};

/**
 * Generates a random string for IDs
 */
export const generateId = (length: number = 8): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Waits for a specified amount of time
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Validates if a string is a valid Solana address
 */
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    // Basic validation - Solana addresses are base58 encoded and 32 bytes
    if (address.length < 32 || address.length > 44) {
      return false;
    }
    
    // Check if it's valid base58
    const decoded = require("bs58").decode(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
};

/**
 * Gets current timestamp in a readable format
 */
export const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Logs operation results
 */
export const logOperation = (operation: string, success: boolean, details?: any): void => {
  const timestamp = getTimestamp();
  const status = success ? "✅ SUCCESS" : "❌ FAILED";
  
  console.log(`[${timestamp}] ${status}: ${operation}`);
  
  if (details) {
    console.log("Details:", details);
  }
};
