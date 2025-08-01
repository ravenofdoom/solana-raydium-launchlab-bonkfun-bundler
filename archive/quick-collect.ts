import { Connection, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as crypto from 'crypto';
import bs58 from 'bs58';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

async function quickCollect() {
  console.log('🚀 QUICK FIXED COLLECTION - Target Session Only');
  console.log('='.repeat(60));
  
  const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=996c379e-5ced-4d60-8099-9fb0ae4f8089', 'confirmed');
  const mainWallet = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));
  
  console.log(`💼 Main wallet: ${mainWallet.publicKey.toString()}`);
  
  const initialBalance = await connection.getBalance(mainWallet.publicKey);
  console.log(`💰 Initial balance: ${(initialBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL\n`);
  
  // Decrypt function
  function decrypt(encryptedText: string, key: string): string {
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
  
  // Load the target session with funds
  const sessionFile = './wallets/buyers-bundle_TBONK6928_1753870306975.json';
  const encryptedData = fs.readFileSync(sessionFile, 'utf8');
  const decryptedData = decrypt(encryptedData, process.env.WALLET_ENCRYPTION_KEY!);
  const walletData = JSON.parse(decryptedData);
  
  const wallets = walletData.privateKeys.map((pk: string) => 
    Keypair.fromSecretKey(bs58.decode(pk))
  );
  
  console.log(`✅ Loaded ${wallets.length} wallets from session TBONK6928_1753870306975\n`);
  
  let totalCollected = 0;
  
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    const balance = await connection.getBalance(wallet.publicKey);
    const balanceSOL = balance / LAMPORTS_PER_SOL;
    
    console.log(`💼 Wallet ${i + 1}: ${wallet.publicKey.toString().slice(0, 8)}... Balance: ${balanceSOL.toFixed(6)} SOL`);
    
    if (balance > 0.001 * LAMPORTS_PER_SOL) {
      console.log(`   💸 Collecting SOL...`);
      
      try {
        // Get actual rent exemption + leave extra for fees
        const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
        const extraFeeBuffer = 10000; // 0.00001 SOL extra buffer
        const totalReserve = rentExemption + extraFeeBuffer;
        const amountToTransfer = balance - totalReserve;
        
        console.log(`   📊 Rent exemption: ${(rentExemption / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
        console.log(`   📊 Total reserve: ${(totalReserve / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
        console.log(`   📊 Will transfer: ${(amountToTransfer / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
        
        if (amountToTransfer > 0) {
          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: mainWallet.publicKey,
              lamports: amountToTransfer,
            })
          );
          
          const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [wallet],
            {
              commitment: 'confirmed',
              maxRetries: 3,
            }
          );
          
          const collectedSOL = amountToTransfer / LAMPORTS_PER_SOL;
          totalCollected += collectedSOL;
          
          console.log(`   ✅ SUCCESS! Collected ${collectedSOL.toFixed(6)} SOL`);
          console.log(`   🔗 TX: ${signature}`);
        } else {
          console.log(`   ⚠️  Cannot transfer - would leave insufficient balance`);
        }
      } catch (error) {
        console.log(`   ❌ Failed: ${error}`);
      }
    }
    console.log('');
  }
  
  const finalBalance = await connection.getBalance(mainWallet.publicKey);
  
  console.log(`🎉 COLLECTION COMPLETE!`);
  console.log(`💰 Total collected: ${totalCollected.toFixed(6)} SOL`);
  console.log(`📈 Main wallet: ${(initialBalance / LAMPORTS_PER_SOL).toFixed(6)} → ${(finalBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
  console.log(`🎯 Net gain: ${((finalBalance - initialBalance) / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
}

quickCollect().catch(console.error);
