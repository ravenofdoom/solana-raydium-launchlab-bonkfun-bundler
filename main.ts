import {
  Connection,
  Keypair,
  AddressLookupTableProgram,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58"
import { DISTRIBUTE_AMOUNTS, DISTRIBUTE_WALLET_NUM, PRIVATE_KEY, RPC_ENDPOINT} from "./constants";
import { createExtendLut, createLutInst } from "./src/LUT";
import { createTokenTx } from "./src/token";
import { makeBuyTx } from "./src/buy";
import { distributeSol } from "./src/distribute";
import { saveLUTFile } from "./utils";
import { sendBundleByLilJit } from "./executor/liljit";


const main = async () => {

  const connection = new Connection(RPC_ENDPOINT, "confirmed");
  const mainKp = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

  const buyerKps: Keypair[] = []
  
  for(let i = 0; i < DISTRIBUTE_WALLET_NUM; i++)
    buyerKps.push(Keypair.generate())

  const buyerPubkeys: PublicKey[] = buyerKps.map(kp => kp.publicKey);

  const mintKp = Keypair.generate()
  
  const slot = await connection.getSlot();

  const [lookupTableInst, lookupTableAddress] = AddressLookupTableProgram.createLookupTable({
    authority: mainKp.publicKey,
    payer: mainKp.publicKey,
    recentSlot: slot - 1
  });
  console.log("🚀 ~ main ~ lookupTableInst:", lookupTableInst)
  console.log("🚀 ~ main ~ lookupTableAddress:", lookupTableAddress)

  if( lookupTableInst && lookupTableAddress ) {
    try {
      saveLUTFile(lookupTableAddress.toBase58())
    } catch (err) {
      console.log("save LUT address error =>", err)
    }
  }

  const lutInst = await createLutInst(connection, mainKp, lookupTableInst);
 
  const distribute = await distributeSol(connection, mainKp, buyerKps, DISTRIBUTE_AMOUNTS);
  const extendLut = await createExtendLut(connection, mainKp, lookupTableAddress, buyerPubkeys, mintKp.publicKey);
  const createTx = await createTokenTx(connection, mainKp, mintKp);
  
  // Get transactions for bundling
  const buyTxs = await makeBuyTx(connection, mintKp, buyerKps, lookupTableAddress, DISTRIBUTE_AMOUNTS);
  console.log("🚀 ~ main ~ buyTxs:", buyTxs)

  // Bundle and send transactions
  try {
    const bundleTx: VersionedTransaction[] = [];
    
    // Add create token transaction
    if (createTx) bundleTx.push(createTx);
    
    // Add buy transactions
    if (buyTxs && Array.isArray(buyTxs)) {
      buyTxs.map(tx => console.log('transaction size : ', tx.serialize().length))
    }
    bundleTx.push(...buyTxs.transactions);
      console.log("🚀 ~ main ~ bundleTx:", bundleTx)


    await sendBundleByLilJit(bundleTx)

  } catch (err) {
    console.error("Error in bundling:", err);
  }
}

main()
