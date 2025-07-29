import { Connection, PublicKey } from "@solana/web3.js";
import { PRIVATE_KEY } from "../constants";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

async function checkBalance() {
  console.log("🔍 Checking wallet balance across different RPC endpoints...\n");
  
  const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
  const walletAddress = wallet.publicKey;
  
  console.log(`👛 Wallet Address: ${walletAddress.toString()}`);
  console.log(`🔗 Explorer: https://explorer.solana.com/address/${walletAddress.toString()}?cluster=devnet\n`);
  
  const endpoints = [
    { name: "Solana Official Devnet", url: "https://api.devnet.solana.com" },
    { name: "Helius Devnet", url: process.env.HELIUS_RPC_URL },
    { name: "Ankr Devnet", url: "https://rpc.ankr.com/solana_devnet" },
    { name: "Shyft Devnet", url: process.env.SHYFT_RPC_URL }
  ];
  
  for (const endpoint of endpoints) {
    if (!endpoint.url) {
      console.log(`⚠️  ${endpoint.name}: Not configured`);
      continue;
    }
    
    try {
      const connection = new Connection(endpoint.url, 'confirmed');
      const balance = await connection.getBalance(walletAddress);
      const solBalance = balance / 1e9;
      
      console.log(`✅ ${endpoint.name}: ${solBalance.toFixed(6)} SOL`);
      
      // Also get the latest blockhash to verify connection
      const { blockhash } = await connection.getLatestBlockhash();
      console.log(`   Latest blockhash: ${blockhash.slice(0, 16)}...`);
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Error - ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

checkBalance().catch(console.error);
