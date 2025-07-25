# 🧪 DEVNET TESTING CONFIGURATION GUIDE

## 📝 Modify these values in your .env file for safe testing

### 1. 🌐 NETWORK CONFIGURATION (Switch to Devnet)

```env
# Change this line:
RPC_ENDPOINT=https://api.mainnet-beta.solana.com

# To this for devnet testing:
RPC_ENDPOINT=https://api.devnet.solana.com
```

### 2. 💰 TRADING AMOUNTS (Use Tiny Amounts)

```env
# Current values (for mainnet):
DISTRIBUTE_WALLET_NUM=8
DISTRIBUTE_AMOUNTS=0.005
JITO_TIP_AMOUNT=0.01

# Recommended for devnet testing:
DISTRIBUTE_WALLET_NUM=4          # Fewer wallets for testing
DISTRIBUTE_AMOUNTS=0.001         # Very small amount (0.001 SOL)
JITO_TIP_AMOUNT=0.001           # Smaller tip amount
```

### 3. 🏷️ TOKEN CONFIGURATION (Change Token Details)

```env
# Current values:
TOKEN_NAME=nyvo
TOKEN_SYMBOL=NYVO
TOKEN_DECIMALS=9
TOTAL_SUPPLY=1000000000

# Example for testing:
TOKEN_NAME=TestCoin
TOKEN_SYMBOL=TEST
TOKEN_DECIMALS=9
TOTAL_SUPPLY=1000000            # Smaller supply for testing
```

### 4. 🔧 SAFETY SETTINGS (Reduce Risk)

```env
# Current values:
RAYDIUM_LP_FEE=0.0025
SLIPPAGE_TOLERANCE=0.01

# For testing (more conservative):
RAYDIUM_LP_FEE=0.0025           # Keep same
SLIPPAGE_TOLERANCE=0.05         # Higher tolerance for testing
```

---

## 📋 **Complete Devnet Testing .env Example:**

```env
# Solana Configuration - DEVNET
RPC_ENDPOINT=https://api.devnet.solana.com
PRIVATE_KEY=your_devnet_wallet_private_key

# RPC Endpoints (your existing ones work)
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=996c379e-5ced-4d60-8099-9fb0ae4f8089
ANKR_DEVNET_RPC_URL=https://rpc.ankr.com/solana_devnet/e12fe989a2c9c3f6f56080a5ebb8400e1b2f2fa5cb5260f670c398c5e8c70dfb

# Jito Configuration - SMALLER AMOUNTS
JITO_URL=https://mainnet.block-engine.jito.wtf/api/v1/bundles
JITO_TIP_AMOUNT=0.001

# Trading Configuration - TESTING AMOUNTS
DISTRIBUTE_WALLET_NUM=4
DISTRIBUTE_AMOUNTS=0.001

# Token Configuration - TEST TOKEN
TOKEN_NAME=TestCoin
TOKEN_SYMBOL=TEST
TOKEN_DECIMALS=9
TOTAL_SUPPLY=1000000

# Raydium Configuration - CONSERVATIVE
RAYDIUM_LP_FEE=0.0025
SLIPPAGE_TOLERANCE=0.05
```

---

## 🚨 **IMPORTANT: Get Devnet SOL First!**

Before testing, you need devnet SOL:

```bash
# Get devnet SOL (free)
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet

# Check balance
solana balance YOUR_WALLET_ADDRESS --url devnet
```

---

## 🔄 **Testing Workflow:**

1. **Backup your current .env**
2. **Modify amounts to tiny values**
3. **Switch to devnet RPC**
4. **Get devnet SOL**
5. **Run test: `npm start`**
6. **Switch back to mainnet when ready**

---

## ⚡ **Quick Test Values:**

- **DISTRIBUTE_AMOUNTS**: `0.001` (1/5th of current)
- **DISTRIBUTE_WALLET_NUM**: `4` (half of current)
- **JITO_TIP_AMOUNT**: `0.001` (1/10th of current)
- **TOKEN_SYMBOL**: `TEST`
- **TOTAL_SUPPLY**: `1000000` (1/1000th of current)

### This way you test with minimal risk! 🛡️
