import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import crypto from "crypto";

/**
 * Secure wallet management without persistent private key storage
 */
export class SecureWalletManager {
  private wallets: Map<string, Keypair> = new Map();
  private masterSeed: string;

  constructor(masterSeed?: string) {
    // Use provided seed or generate a secure one
    this.masterSeed = masterSeed || this.generateSecureSeed();
  }

  /**
   * Generates a cryptographically secure seed
   */
  private generateSecureSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Derives a keypair from the master seed and index
   * This ensures deterministic wallet generation without storing private keys
   */
  private deriveKeypair(index: number): Keypair {
    // Create deterministic seed from master seed + index
    const derivationData = `${this.masterSeed}-wallet-${index}`;
    const hash = crypto.createHash('sha256').update(derivationData).digest();
    
    // Generate keypair from hash
    return Keypair.fromSeed(hash);
  }

  /**
   * Generates buyer wallets without storing private keys
   */
  public generateBuyerWallets(count: number): { publicKey: string; index: number }[] {
    console.log(`🔐 Generating ${count} buyer wallets securely...`);
    
    const wallets = [];
    this.wallets.clear(); // Clear any existing wallets
    
    for (let i = 0; i < count; i++) {
      const keypair = this.deriveKeypair(i);
      const publicKey = keypair.publicKey.toBase58();
      
      // Store keypair in memory only (not on disk)
      this.wallets.set(publicKey, keypair);
      
      wallets.push({
        publicKey,
        index: i
      });
    }
    
    console.log(`✅ Generated ${count} wallets securely (private keys in memory only)`);
    return wallets;
  }

  /**
   * Gets a keypair by public key (from memory)
   */
  public getKeypair(publicKey: string): Keypair | null {
    return this.wallets.get(publicKey) || null;
  }

  /**
   * Gets all keypairs as array
   */
  public getAllKeypairs(): Keypair[] {
    return Array.from(this.wallets.values());
  }

  /**
   * Gets all public keys
   */
  public getAllPublicKeys(): string[] {
    return Array.from(this.wallets.keys());
  }

  /**
   * Securely clears all wallets from memory
   */
  public clearWallets(): void {
    this.wallets.clear();
    console.log("🧹 Cleared all wallets from memory");
  }

  /**
   * Gets wallet count
   */
  public getWalletCount(): number {
    return this.wallets.size;
  }

  /**
   * Validates that all wallets are available
   */
  public validateWallets(): boolean {
    const allValid = Array.from(this.wallets.values()).every(keypair => {
      try {
        // Test that keypair is valid
        const publicKey = keypair.publicKey.toBase58();
        return publicKey.length > 30; // Basic validation
      } catch {
        return false;
      }
    });

    if (allValid) {
      console.log("✅ All wallets validated successfully");
    } else {
      console.error("❌ Some wallets failed validation");
    }

    return allValid;
  }

  /**
   * Creates a backup of public keys only (for logging)
   */
  public exportPublicKeysOnly(): { publicKeys: string[]; timestamp: string } {
    return {
      publicKeys: this.getAllPublicKeys(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * SECURITY WARNING: Only use this for debugging in development
   * Never call this in production
   */
  public debugExportPrivateKeys(): { publicKey: string; privateKey: string }[] {
    if (process.env.NODE_ENV === 'production') {
      throw new Error("Private key export is disabled in production");
    }
    
    console.warn("⚠️  WARNING: Exporting private keys for debugging. NEVER do this in production!");
    
    return Array.from(this.wallets.entries()).map(([publicKey, keypair]) => ({
      publicKey,
      privateKey: bs58.encode(keypair.secretKey)
    }));
  }
}

/**
 * Security audit function to check for potential issues
 */
export function performSecurityAudit(): void {
  console.log("🔒 Performing Security Audit...");
  
  const checks = [
    {
      name: "Environment Variables",
      check: () => {
        const hasPrivateKey = !!process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== 'your_wallet_private_key_base58_here';
        const hasRPCEndpoint = !!process.env.RPC_ENDPOINT;
        return hasPrivateKey && hasRPCEndpoint;
      }
    },
    {
      name: "Git Ignore Protection",
      check: () => {
        try {
          const fs = require('fs');
          const gitignore = fs.readFileSync('.gitignore', 'utf8');
          return gitignore.includes('.env') && gitignore.includes('*.key');
        } catch {
          return false;
        }
      }
    },
    {
      name: "Node Environment",
      check: () => {
        return process.env.NODE_ENV !== 'development' || process.env.DEBUG !== '*';
      }
    }
  ];

  let passed = 0;
  checks.forEach(check => {
    const result = check.check();
    if (result) {
      console.log(`✅ ${check.name}: PASSED`);
      passed++;
    } else {
      console.log(`❌ ${check.name}: FAILED`);
    }
  });

  console.log(`\n🔒 Security Audit Results: ${passed}/${checks.length} checks passed`);
  
  if (passed < checks.length) {
    console.warn("⚠️  Some security checks failed. Please review before proceeding.");
  } else {
    console.log("✅ All security checks passed!");
  }
}
