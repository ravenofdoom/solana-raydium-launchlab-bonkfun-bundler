import { Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import bs58 from "bs58";

/**
 * Secure Wallet Manager with persistence for selling tokens later
 */
export class WalletManager {
  private static WALLETS_DIR = path.join(process.cwd(), "wallets");

  static getEncryptionKey(): string {
    const key = process.env.WALLET_ENCRYPTION_KEY || "";
    if (!key) {
      throw new Error("WALLET_ENCRYPTION_KEY not found in environment variables");
    }
    return key;
  }

  static async ensureWalletsDir(): Promise<void> {
    if (!fs.existsSync(this.WALLETS_DIR)) {
      fs.mkdirSync(this.WALLETS_DIR, { recursive: true });
    }
  }

  /**
   * Encrypt wallet data with AES-256-GCM
   */
  private static encrypt(text: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt wallet data
   */
  private static decrypt(encryptedText: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate or load existing buyer wallets
   */
  static async getBuyerWallets(count: number, sessionId: string): Promise<Keypair[]> {
    await this.ensureWalletsDir();
    
    const walletsFile = path.join(this.WALLETS_DIR, `buyers-${sessionId}.json`);
    
    try {
      // Try to load existing wallets
      if (fs.existsSync(walletsFile)) {
        console.log(`📂 Loading existing buyer wallets for session: ${sessionId}`);
        const encryptedData = fs.readFileSync(walletsFile, 'utf8');
        
        if (!this.getEncryptionKey()) {
          throw new Error("WALLET_ENCRYPTION_KEY required in .env to decrypt wallets");
        }
        
        const decryptedData = this.decrypt(encryptedData, this.getEncryptionKey());
        const walletData = JSON.parse(decryptedData);
        
        return walletData.privateKeys.map((pk: string) => 
          Keypair.fromSecretKey(bs58.decode(pk))
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`⚠️  Could not load existing wallets: ${errorMessage}`);
      console.log("🔄 Generating new buyer wallets...");
    }

    // Generate new wallets
    console.log(`🔧 Generating ${count} new buyer wallets for session: ${sessionId}`);
    const wallets: Keypair[] = [];
    const privateKeys: string[] = [];

    for (let i = 0; i < count; i++) {
      const wallet = Keypair.generate();
      wallets.push(wallet);
      privateKeys.push(bs58.encode(wallet.secretKey));
    }

    // Save wallets (encrypted)
    if (this.getEncryptionKey()) {
      const walletData = {
        sessionId,
        createdAt: new Date().toISOString(),
        count: count,
        privateKeys: privateKeys
      };

      const encryptedData = this.encrypt(JSON.stringify(walletData), this.getEncryptionKey());
      fs.writeFileSync(walletsFile, encryptedData);
      
      console.log(`💾 Buyer wallets saved (encrypted) to: ${walletsFile}`);
      console.log(`🔑 Use session ID "${sessionId}" to access these wallets later`);
    } else {
      console.log("⚠️  WALLET_ENCRYPTION_KEY not set - wallets not saved!");
      console.log("🚨 You won't be able to sell tokens later without saving wallets");
    }

    return wallets;
  }

  /**
   * List all available wallet sessions
   */
  static async listSessions(): Promise<string[]> {
    await this.ensureWalletsDir();
    
    const files = fs.readdirSync(this.WALLETS_DIR);
    const sessions = files
      .filter(file => file.startsWith('buyers-') && file.endsWith('.json'))
      .map(file => file.replace('buyers-', '').replace('.json', ''));
    
    return sessions;
  }

  /**
   * Get wallet addresses for a session (for checking balances)
   */
  static async getWalletAddresses(sessionId: string): Promise<string[]> {
    const wallets = await this.getBuyerWallets(0, sessionId); // This will load existing
    return wallets.map(w => w.publicKey.toBase58());
  }

  /**
   * Delete a wallet session (after selling all tokens)
   */
  static async deleteSession(sessionId: string): Promise<void> {
    const walletsFile = path.join(this.WALLETS_DIR, `buyers-${sessionId}.json`);
    
    if (fs.existsSync(walletsFile)) {
      fs.unlinkSync(walletsFile);
      console.log(`🗑️  Deleted wallet session: ${sessionId}`);
    }
  }
}
