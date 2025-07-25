# 📚 Documentation

This folder contains comprehensive documentation for the BonkFun Bundler project.

## 📖 Available Guides

- **[WALLET-MANAGEMENT.md](./WALLET-MANAGEMENT.md)** - Complete guide on wallet persistence and token selling

## 🚀 Quick Start

1. **Understand the wallet system**: Read the wallet management guide
2. **Set up encryption**: Configure `WALLET_ENCRYPTION_KEY` in `.env`
3. **Test on devnet**: Run `npm run devnet` to test the bundler
4. **Sell tokens**: Use `npm run sell` commands to manage your tokens

## 🔗 Key Commands

```bash
# Test on devnet
npm run devnet

# Check wallet sessions
npm run sell list

# Sell tokens from a session
npm run sell sell <sessionId> <tokenMint>

# Recover SOL from buyer wallets
npm run sell recover <sessionId>
```

## 🆘 Need Help?

- Check the wallet management guide for detailed instructions
- Run `npm run explain-wallets` for a live explanation of the wallet system
- All commands provide explorer links for easy monitoring
