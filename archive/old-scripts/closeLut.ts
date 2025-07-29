import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { RPC_ENDPOINT, PRIVATE_KEY, validateConfig } from "./constants";
import { loadLUTFile, logOperation } from "./utils";

/**
 * Closes a lookup table (LUT) when no longer needed
 */
const closeLookupTable = async () => {
  try {
    console.log("🔧 Starting LUT closure process...");
    
    // Validate configuration
    validateConfig();
    
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const mainKp = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
    
    console.log(`💼 Authority wallet: ${mainKp.publicKey.toBase58()}`);
    
    // Load LUT address from file
    const lutAddressString = loadLUTFile();
    
    if (!lutAddressString) {
      console.error("❌ No LUT address found. Please run the main script first to create a LUT.");
      process.exit(1);
    }
    
    const lutAddress = new PublicKey(lutAddressString);
    console.log(`📋 LUT Address: ${lutAddress.toBase58()}`);
    
    // Check if LUT exists and get its info
    try {
      const lutAccount = await connection.getAddressLookupTable(lutAddress);
      
      if (!lutAccount.value) {
        console.error("❌ LUT not found on-chain");
        process.exit(1);
      }
      
      console.log(`📊 LUT Info:`);
      console.log(`  - Authority: ${lutAccount.value.state.authority?.toBase58() || "None"}`);
      console.log(`  - Addresses: ${lutAccount.value.state.addresses.length}`);
      console.log(`  - Deactivation Slot: ${lutAccount.value.state.deactivationSlot}`);
      
      // Check if we're the authority
      if (!lutAccount.value.state.authority?.equals(mainKp.publicKey)) {
        console.error("❌ Not authorized to close this LUT");
        process.exit(1);
      }
      
      // Check if LUT is already deactivated
      const maxSlot = BigInt("18446744073709551615");
      if (lutAccount.value.state.deactivationSlot !== maxSlot) {
        console.log("⏳ LUT is already deactivated. Checking if it can be closed...");
        
        const currentSlot = await connection.getSlot();
        const deactivationSlot = Number(lutAccount.value.state.deactivationSlot);
        const slotsToWait = 513; // Minimum slots to wait after deactivation
        
        if (currentSlot < deactivationSlot + slotsToWait) {
          console.log(`⏳ Need to wait ${deactivationSlot + slotsToWait - currentSlot} more slots before closing`);
          console.log(`Current slot: ${currentSlot}`);
          console.log(`Can close after slot: ${deactivationSlot + slotsToWait}`);
          process.exit(0);
        }
        
        console.log("✅ LUT can now be closed");
      } else {
        console.log("⚠️  LUT is not deactivated. It should be deactivated first before closing.");
        console.log("Note: Deactivation and closure are typically handled automatically after bundle execution.");
      }
      
      logOperation("LUT Closure Check", true, {
        address: lutAddress.toBase58(),
        addressCount: lutAccount.value.state.addresses.length,
        authority: lutAccount.value.state.authority?.toBase58()
      });
      
    } catch (error) {
      console.error("❌ Error checking LUT:", error);
      logOperation("LUT Closure", false, error);
      process.exit(1);
    }
    
    console.log("✅ LUT closure process completed");
    console.log("💡 Note: In production, LUTs are typically closed automatically after successful bundle execution");
    
  } catch (error) {
    console.error("❌ Error in LUT closure:", error);
    logOperation("LUT Closure", false, error);
    process.exit(1);
  }
};

if (require.main === module) {
  closeLookupTable().catch(console.error);
}

export { closeLookupTable };
