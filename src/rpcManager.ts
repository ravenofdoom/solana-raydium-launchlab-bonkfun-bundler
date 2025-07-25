import { Connection } from "@solana/web3.js";

// RPC Endpoint Configuration with Rotation Support
export interface RPCEndpoint {
  url: string;
  name: string;
  weight: number; // Higher weight = more likely to be selected
  rateLimit?: number; // requests per second
}

// Secure RPC endpoint configuration
const RPC_ENDPOINTS: RPCEndpoint[] = [
  // Primary endpoints (if API keys provided)
  {
    url: process.env.HELIUS_RPC_URL || "",
    name: "Helius",
    weight: 10,
    rateLimit: 100
  },
  {
    url: process.env.MORALIS_RPC_URL || "",
    name: "Moralis", 
    weight: 8,
    rateLimit: 50
  },
  {
    url: process.env.SHYFT_RPC_URL || "",
    name: "Shyft",
    weight: 8,
    rateLimit: 50
  },
  {
    url: process.env.DRPC_RPC_URL || "",
    name: "dRPC",
    weight: 8,
    rateLimit: 50
  },
  {
    url: process.env.QUICKNODE_RPC_URL || "",
    name: "QuickNode",
    weight: 9,
    rateLimit: 75
  },
  // Fallback endpoints
  {
    url: "https://api.mainnet-beta.solana.com",
    name: "Solana Mainnet",
    weight: 3,
    rateLimit: 10
  },
  {
    url: "https://solana-api.projectserum.com",
    name: "Project Serum",
    weight: 2,
    rateLimit: 10
  }
].filter(endpoint => endpoint.url && endpoint.url.length > 0);

class RPCManager {
  private currentIndex = 0;
  private failureCounts: Map<string, number> = new Map();
  private lastUsed: Map<string, number> = new Map();
  private connections: Map<string, Connection> = new Map();

  constructor() {
    // Initialize failure counts
    RPC_ENDPOINTS.forEach(endpoint => {
      this.failureCounts.set(endpoint.url, 0);
      this.lastUsed.set(endpoint.url, 0);
    });
  }

  /**
   * Gets the best available RPC endpoint based on weights and failure rates
   */
  private getBestEndpoint(): RPCEndpoint {
    const now = Date.now();
    const availableEndpoints = RPC_ENDPOINTS.filter(endpoint => {
      const failures = this.failureCounts.get(endpoint.url) || 0;
      const lastUsed = this.lastUsed.get(endpoint.url) || 0;
      
      // Skip if too many recent failures (more than 3 in last 5 minutes)
      if (failures > 3 && (now - lastUsed) < 300000) {
        return false;
      }
      
      return true;
    });

    if (availableEndpoints.length === 0) {
      console.warn("⚠️  All RPC endpoints have failed recently, using fallback");
      return RPC_ENDPOINTS[RPC_ENDPOINTS.length - 1]; // Use last endpoint as ultimate fallback
    }

    // Weight-based selection with some randomness
    const totalWeight = availableEndpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const endpoint of availableEndpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }
    
    return availableEndpoints[0];
  }

  /**
   * Gets a connection, creating new one if needed
   */
  public getConnection(): Connection {
    const endpoint = this.getBestEndpoint();
    
    if (!this.connections.has(endpoint.url)) {
      console.log(`🔗 Creating new RPC connection to ${endpoint.name}`);
      this.connections.set(endpoint.url, new Connection(endpoint.url, {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 60000,
        disableRetryOnRateLimit: false
      }));
    }
    
    this.lastUsed.set(endpoint.url, Date.now());
    return this.connections.get(endpoint.url)!;
  }

  /**
   * Reports a failure for an endpoint
   */
  public reportFailure(connectionUrl: string): void {
    const current = this.failureCounts.get(connectionUrl) || 0;
    this.failureCounts.set(connectionUrl, current + 1);
    console.warn(`⚠️  RPC endpoint ${connectionUrl} failure reported (${current + 1} failures)`);
  }

  /**
   * Reports success for an endpoint (resets failure count)
   */
  public reportSuccess(connectionUrl: string): void {
    this.failureCounts.set(connectionUrl, 0);
  }

  /**
   * Gets connection with retry logic
   */
  public async getConnectionWithRetry(maxRetries: number = 3): Promise<Connection> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const connection = this.getConnection();
        
        // Test the connection
        await connection.getEpochInfo();
        this.reportSuccess(connection.rpcEndpoint);
        
        return connection;
      } catch (error) {
        console.error(`❌ RPC connection attempt ${i + 1} failed:`, error);
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw new Error("Failed to establish RPC connection after retries");
  }

  /**
   * Lists all configured endpoints
   */
  public listEndpoints(): void {
    console.log("🔗 Configured RPC Endpoints:");
    RPC_ENDPOINTS.forEach((endpoint, index) => {
      const failures = this.failureCounts.get(endpoint.url) || 0;
      console.log(`  ${index + 1}. ${endpoint.name} (weight: ${endpoint.weight}, failures: ${failures})`);
    });
  }
}

// Export singleton instance
export const rpcManager = new RPCManager();

// Backward compatibility - get primary connection
export const getConnection = () => rpcManager.getConnection();
export const getConnectionWithRetry = (maxRetries?: number) => rpcManager.getConnectionWithRetry(maxRetries);
