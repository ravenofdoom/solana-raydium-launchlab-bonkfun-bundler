import { Connection, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletManager } from '../src/wallet-manager';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL!;

async function closeAccountsCollection() {
  console.log('🗑️  CLOSE ACCOUNTS COLLECTION - Recovering rent exemption');
  console.log('='.repeat(60));

  const connection = new Connection(HELIUS_RPC_URL, 'confirmed');
  
  // Load main wallet from environment
  const mainWalletSecretKey = process.env.PRIVATE_KEY;
  if (!mainWalletSecretKey) {
    console.error('❌ PRIVATE_KEY not found in environment variables');
    return;
  }
  
  const mainWallet = Keypair.fromSecretKey(Buffer.from(JSON.parse(mainWalletSecretKey)));

  console.log(`💰 Main Wallet: ${mainWallet.publicKey.toString()}`);
  
  const initialMainBalance = await connection.getBalance(mainWallet.publicKey);
  console.log(`📊 Initial Main Balance: ${(initialMainBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL\n`);

  const walletsDir = path.join(process.cwd(), 'wallets');
  const files = fs.readdirSync(walletsDir).filter(f => f.endsWith('.json'));

  let totalCollected = 0;
  let walletsProcessed = 0;

  for (const file of files) {
    console.log(`📁 Processing: ${file}`);
    
    try {
      // Extract session ID correctly from filename
      // For "buyers-BONK_1754049213315.json" -> "BONK_1754049213315"
      const sessionId = file.replace(/^buyers-/, '').replace(/\.json$/, '');
      console.log(`   🆔 Session ID: ${sessionId}`);
      
      const wallets = await WalletManager.getBuyerWallets(0, sessionId);
      
      if (wallets.length === 0) {
        console.log('   ⚠️  No wallets found in this session\n');
        continue;
      }

      console.log(`   📂 Found ${wallets.length} wallets`);

      for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const balance = await connection.getBalance(wallet.publicKey);
        
        if (balance > 0) {
          console.log(`   💸 Wallet ${i + 1}: ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL - CLOSING ACCOUNT`);
          
          try {
            // Create transaction that allocates 0 bytes (closes the account)
            // This will transfer ALL lamports including rent exemption
            const transaction = new Transaction().add(
              SystemProgram.allocate({
                accountPubkey: wallet.publicKey,
                space: 0,
              }),
              SystemProgram.assign({
                accountPubkey: wallet.publicKey,
                programId: SystemProgram.programId,
              }),
              SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: mainWallet.publicKey,
                lamports: balance,
              })
            );

            const signature = await sendAndConfirmTransaction(
              connection,
              transaction,
              [wallet],
              { commitment: 'confirmed', skipPreflight: true }
            );

            totalCollected += balance;
            walletsProcessed++;
            
            console.log(`   ✅ Closed account and collected ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
            console.log(`   🔗 Tx: https://solscan.io/tx/${signature}`);
            
            // Wait a bit to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            if (error instanceof Error) {
              console.log(`   ❌ Failed to close account ${i + 1}: ${error.message}`);
            } else {
              console.log(`   ❌ Failed to close account ${i + 1}: ${String(error)}`);
            }
            
            // Try simple transfer instead
            try {
              console.log(`   🔄 Trying simple transfer instead...`);
              const availableAmount = balance - 890880; // Leave standard rent exemption
              
              if (availableAmount > 5000) {
                const transaction = new Transaction().add(
                  SystemProgram.transfer({
                    fromPubkey: wallet.publicKey,
                    toPubkey: mainWallet.publicKey,
                    lamports: availableAmount,
                  })
                );

                const signature = await sendAndConfirmTransaction(
                  connection,
                  transaction,
                  [wallet],
                  { commitment: 'confirmed' }
                );

                totalCollected += availableAmount;
                walletsProcessed++;
                
                console.log(`   ✅ Collected ${(availableAmount / LAMPORTS_PER_SOL).toFixed(6)} SOL (partial)`);
                console.log(`   🔗 Tx: https://solscan.io/tx/${signature}`);
              } else {
                console.log(`   ⚠️  Amount too small to collect after rent exemption`);
              }
            } catch (fallbackError) {
              if (fallbackError instanceof Error) {
                console.log(`   ❌ Fallback also failed: ${fallbackError.message}`);
              } else {
                console.log(`   ❌ Fallback also failed: ${String(fallbackError)}`);
              }
            }
          }
        } else {
          console.log(`   💸 Wallet ${i + 1}: 0.000000 SOL (already empty)`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error processing session: ${error}\n`);
      continue;
    }
    
    console.log('');
  }

  const finalMainBalance = await connection.getBalance(mainWallet.publicKey);
  const collectedSOL = (totalCollected / LAMPORTS_PER_SOL);
  
  console.log('🎯 CLOSE ACCOUNTS SUMMARY:');
  console.log('='.repeat(40));
  console.log(`📊 Wallets processed: ${walletsProcessed}`);
  console.log(`💰 Total collected: ${collectedSOL.toFixed(6)} SOL`);
  console.log(`💵 Final main balance: ${(finalMainBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
  console.log(`📈 Net gain: ${((finalMainBalance - initialMainBalance) / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
  
  if (collectedSOL > 0) {
    console.log('\n✅ Successfully collected SOL from buyer wallets!');
    console.log('🗑️  Accounts closed or minimized - ready for new session!');
  } else {
    console.log('\n⚠️  No SOL was collected (wallets only had rent exemption)');
    console.log('💡 This is normal - rent exemption keeps accounts active');
  }
}

closeAccountsCollection().catch(console.error);
