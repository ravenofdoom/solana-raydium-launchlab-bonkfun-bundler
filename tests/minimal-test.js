const { Connection, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const bs58 = require("bs58");
require('dotenv').config();

/**
 * Minimal bundle test for devnet
 */
async function minimalBundleTest() {
  console.log("🧪 Minimal Devnet Bundle Test");
  console.log("=".repeat(40));
  
  try {
    // Setup
    const connection = new Connection(process.env.RPC_ENDPOINT || "https://api.devnet.solana.com", "confirmed");
    const mainKp = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
    
    console.log(`💼 Main Wallet: ${mainKp.publicKey.toBase58()}`);
    
    // Check balance
    const balance = await connection.getBalance(mainKp.publicKey);
    console.log(`💰 Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    if (balance < 0.1 * LAMPORTS_PER_SOL) {
      throw new Error("Need at least 0.1 SOL for testing");
    }
    
    // Generate 3 test wallets (instead of 8 for simpler test)
    console.log("\n👥 Generating test wallets...");
    const testWallets = [];
    for (let i = 0; i < 3; i++) {
      testWallets.push(Keypair.generate());
    }
    console.log(`Generated ${testWallets.length} test wallets`);
    
    // Create distribution transactions
    console.log("\n💸 Creating distribution transactions...");
    const distributionAmount = 0.001 * LAMPORTS_PER_SOL; // 0.001 SOL
    const transactions = [];
    
    // Get recent blockhash once for all transactions
    const { blockhash } = await connection.getLatestBlockhash();
    
    for (const wallet of testWallets) {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: mainKp.publicKey,
          toPubkey: wallet.publicKey,
          lamports: distributionAmount,
        })
      );
      
      // Set recent blockhash and fee payer
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = mainKp.publicKey;
      
      // Sign transaction
      transaction.sign(mainKp);
      transactions.push(transaction);
    }
    
    console.log(`✅ Created ${transactions.length} distribution transactions`);
    
    // Send transactions
    console.log("\n🚀 Sending transactions...");
    const signatures = [];
    
    for (let i = 0; i < transactions.length; i++) {
      try {
        console.log(`  Sending transaction ${i + 1}/${transactions.length}...`);
        const signature = await connection.sendRawTransaction(transactions[i].serialize());
        signatures.push(signature);
        console.log(`  ✅ Sent: ${signature}`);
        
        // Wait a moment between transactions
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`  ❌ Failed transaction ${i + 1}:`, error.message);
      }
    }
    
    // Check confirmations
    console.log("\n⏳ Waiting for confirmations...");
    for (let i = 0; i < signatures.length; i++) {
      try {
        await connection.confirmTransaction(signatures[i]);
        console.log(`  ✅ Transaction ${i + 1} confirmed`);
      } catch (error) {
        console.error(`  ❌ Transaction ${i + 1} confirmation failed:`, error.message);
      }
    }
    
    // Verify balances
    console.log("\n💰 Verifying balances...");
    for (let i = 0; i < testWallets.length; i++) {
      const walletBalance = await connection.getBalance(testWallets[i].publicKey);
      console.log(`  Wallet ${i + 1}: ${walletBalance / LAMPORTS_PER_SOL} SOL`);
    }
    
    console.log("\n🎉 Minimal bundle test completed successfully!");
    console.log("✅ Ready for full bundler test!");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    
    if (error.message.includes("Need at least")) {
      console.log("💡 Get more devnet SOL: https://faucet.solana.com/");
      console.log(`💡 Your address: ${process.env.PRIVATE_KEY ? Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY)).publicKey.toBase58() : 'N/A'}`);
    }
  }
}

minimalBundleTest();
