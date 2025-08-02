import { RaydiumLaunchlabService } from '../src/raydium-launchlab-service-v2';
import { Connection } from '@solana/web3.js';
import * as dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing Raydium Service...');

async function main() {
  try {
    const connection = new Connection(
      process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    
    const service = new RaydiumLaunchlabService(connection);
    
    console.log('✅ Service created successfully');
    console.log('🔗 Connection:', connection.rpcEndpoint);
    
    // Test basic functionality
    const testToken = '8dqNN3h1Da5QTXW419oJrYfLAM2u13kCqLkRHdufbonk'; // BONK
    
    console.log('\n📊 Testing getTokenInfo...');
    const tokenInfo = await service.getTokenInfo(testToken);
    console.log('Token Info:', tokenInfo);
    
    console.log('\n🔍 Testing findRaydiumPool...');
    const poolInfo = await service.findRaydiumPool(testToken);
    console.log('Pool Info:', poolInfo);
    
    console.log('\n🏭 Testing isLaunchlabToken...');
    const isLaunchlab = await service.isLaunchlabToken(testToken);
    console.log('Is Launchlab:', isLaunchlab);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
