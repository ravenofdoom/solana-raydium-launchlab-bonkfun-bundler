const { Connection } = require("@solana/web3.js");
require('dotenv').config();

/**
 * Test RPC endpoint connectivity
 */
async function testRPCEndpoints() {
  console.log("🔗 Testing RPC Endpoint Connectivity\n");
  
  const endpoints = [
    { name: "Helius", url: process.env.HELIUS_RPC_URL },
    { name: "ExtrNode", url: process.env.EXTRNODE_RPC_URL },
    { name: "Moralis", url: process.env.MORALIS_RPC_URL },
    { name: "Shyft", url: process.env.SHYFT_RPC_URL },
    { name: "dRPC", url: process.env.DRPC_RPC_URL },
    { name: "QuickNode", url: process.env.QUICKNODE_RPC_URL },
    { name: "Ankr Devnet", url: process.env.ANKR_DEVNET_RPC_URL },
    { name: "Solana Mainnet", url: "https://api.mainnet-beta.solana.com" }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    if (!endpoint.url || endpoint.url.includes("YOUR_") || endpoint.url.includes("dashboard")) {
      console.log(`⚠️  ${endpoint.name}: Not configured or invalid URL`);
      results.push({ name: endpoint.name, status: "not_configured", url: endpoint.url });
      continue;
    }
    
    try {
      console.log(`🔍 Testing ${endpoint.name}...`);
      const connection = new Connection(endpoint.url, 'confirmed');
      
      // Test with a simple getVersion call (fast and lightweight)
      const startTime = Date.now();
      const version = await connection.getVersion();
      const responseTime = Date.now() - startTime;
      
      if (version && version['solana-core']) {
        console.log(`✅ ${endpoint.name}: OK (${responseTime}ms) - Solana Core v${version['solana-core']}`);
        results.push({ 
          name: endpoint.name, 
          status: "success", 
          responseTime, 
          version: version['solana-core'],
          url: endpoint.url 
        });
      } else {
        console.log(`❌ ${endpoint.name}: Invalid response`);
        results.push({ name: endpoint.name, status: "invalid_response", url: endpoint.url });
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Failed - ${error.message}`);
      results.push({ 
        name: endpoint.name, 
        status: "failed", 
        error: error.message,
        url: endpoint.url 
      });
    }
  }
  
  // Summary
  console.log("\n📊 RPC Endpoint Test Summary");
  console.log("=".repeat(50));
  
  const working = results.filter(r => r.status === "success");
  const failed = results.filter(r => r.status === "failed");
  const notConfigured = results.filter(r => r.status === "not_configured");
  
  console.log(`✅ Working endpoints: ${working.length}`);
  console.log(`❌ Failed endpoints: ${failed.length}`);
  console.log(`⚠️  Not configured: ${notConfigured.length}`);
  
  if (working.length > 0) {
    console.log("\n🚀 Fastest endpoints:");
    working
      .sort((a, b) => a.responseTime - b.responseTime)
      .slice(0, 3)
      .forEach((endpoint, index) => {
        console.log(`${index + 1}. ${endpoint.name}: ${endpoint.responseTime}ms`);
      });
  }
  
  if (failed.length > 0) {
    console.log("\n❌ Failed endpoints to fix:");
    failed.forEach(endpoint => {
      console.log(`- ${endpoint.name}: ${endpoint.error}`);
    });
  }
  
  if (notConfigured.length > 0) {
    console.log("\n⚠️  Endpoints to configure:");
    notConfigured.forEach(endpoint => {
      console.log(`- ${endpoint.name}: Add proper API key`);
    });
  }
  
  return results;
}

// Run the test
if (require.main === module) {
  testRPCEndpoints()
    .then(() => {
      console.log("\n🔗 RPC connectivity test completed!");
      process.exit(0);
    })
    .catch(error => {
      console.error("❌ RPC test failed:", error);
      process.exit(1);
    });
}

module.exports = { testRPCEndpoints };
