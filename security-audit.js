#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log("🔒 BonkFun Bundler Security Audit");
console.log("================================");

class SecurityAuditor {
  constructor() {
    this.findings = [];
    this.warnings = [];
    this.info = [];
  }

  addFinding(level, message, details = null) {
    const finding = { level, message, details, timestamp: new Date().toISOString() };
    
    if (level === 'error' || level === 'critical') {
      this.findings.push(finding);
      console.log(`❌ ${level.toUpperCase()}: ${message}`);
    } else if (level === 'warning') {
      this.warnings.push(finding);
      console.log(`⚠️  WARNING: ${message}`);
    } else {
      this.info.push(finding);
      console.log(`ℹ️  INFO: ${message}`);
    }
    
    if (details) {
      console.log(`   Details: ${details}`);
    }
  }

  checkEnvironmentSecurity() {
    console.log("\n🔍 Checking Environment Security...");
    
    // Check if .env file exists and is properly protected
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      this.addFinding('info', '.env file exists');
      
      // Check .env file permissions (on Unix systems)
      try {
        const stats = fs.statSync(envPath);
        const mode = stats.mode & parseInt('777', 8);
        if (mode !== parseInt('600', 8) && process.platform !== 'win32') {
          this.addFinding('warning', '.env file permissions too permissive', 
            'Recommended: chmod 600 .env');
        }
      } catch (e) {
        this.addFinding('info', 'Could not check .env permissions');
      }
      
      // Check for default values
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('your_wallet_private_key_base58_here')) {
        this.addFinding('error', 'Default private key placeholder detected', 
          'Please set a real private key in .env');
      }
      
      if (envContent.includes('YOUR_API_KEY')) {
        this.addFinding('warning', 'Default API key placeholders detected', 
          'Consider adding real API keys for better performance');
      }
    } else {
      this.addFinding('error', '.env file not found', 
        'Run npm run setup to create .env file');
    }

    // Check .gitignore
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      
      const protectedItems = ['.env', '*.key', 'data/', 'backups/'];
      protectedItems.forEach(item => {
        if (!gitignoreContent.includes(item)) {
          this.addFinding('warning', `${item} not in .gitignore`, 
            'Sensitive files may be accidentally committed');
        }
      });
    } else {
      this.addFinding('error', '.gitignore file missing');
    }
  }

  checkCodeSecurity() {
    console.log("\n🔍 Checking Code Security...");
    
    // Check for hardcoded secrets
    const codeFiles = this.findFiles('.', /\.(ts|js)$/, ['node_modules', '.git']);
    const secretPatterns = [
      /private[_-]?key[\s]*[:=]\s*['"]\w+/i,
      /secret[\s]*[:=]\s*['"]\w+/i,
      /api[_-]?key[\s]*[:=]\s*['"]\w+/i,
      /password[\s]*[:=]\s*['"]\w+/i,
      /token[\s]*[:=]\s*['"]\w+/i
    ];

    codeFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        secretPatterns.forEach(pattern => {
          if (pattern.test(content)) {
            this.addFinding('warning', `Potential hardcoded secret in ${file}`, 
              'Review file for hardcoded credentials');
          }
        });

        // Check for suspicious network requests
        const networkPatterns = [
          /fetch\s*\(\s*['"](https?:\/\/[^'"]+)/gi,
          /axios\.(get|post|put|delete)\s*\(\s*['"](https?:\/\/[^'"]+)/gi,
          /XMLHttpRequest|new Request\(/gi
        ];

        networkPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              if (!match.includes('solana') && !match.includes('jito') && 
                  !match.includes('raydium') && !match.includes('localhost')) {
                this.addFinding('warning', `Suspicious network request in ${file}`, 
                  `Found: ${match}`);
              }
            });
          }
        });

        // Check for eval or Function constructor usage
        if (/\beval\s*\(|new\s+Function\s*\(/.test(content)) {
          this.addFinding('error', `Dynamic code execution found in ${file}`, 
            'eval() or Function() constructor detected');
        }

      } catch (e) {
        this.addFinding('info', `Could not read file ${file}`);
      }
    });
  }

  checkWalletSecurity() {
    console.log("\n🔍 Checking Wallet Security...");
    
    // Check for wallet files in dangerous locations
    const dangerousLocations = [
      'wallet.json',
      'keypair.json', 
      'private-key.txt',
      'secret.key'
    ];

    dangerousLocations.forEach(location => {
      if (fs.existsSync(location)) {
        this.addFinding('critical', `Wallet file found in project root: ${location}`, 
          'Move to secure location or delete');
      }
    });

    // Check data directory
    const dataDir = path.join(process.cwd(), 'data');
    if (fs.existsSync(dataDir)) {
      const dataFiles = fs.readdirSync(dataDir);
      dataFiles.forEach(file => {
        if (file.includes('private') || file.includes('secret') || file.includes('key')) {
          this.addFinding('warning', `Potentially sensitive file in data/: ${file}`);
        }
      });
    }
  }

  checkDependencySecurity() {
    console.log("\n🔍 Checking Dependency Security...");
    
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for known vulnerable packages (basic check)
      const suspiciousPackages = [
        'request', // deprecated
        'node-uuid', // deprecated
        'validator' // often has vulnerabilities
      ];

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      Object.keys(allDeps).forEach(dep => {
        if (suspiciousPackages.includes(dep)) {
          this.addFinding('warning', `Potentially problematic dependency: ${dep}`, 
            'Consider finding alternatives');
        }
      });

      this.addFinding('info', `Found ${Object.keys(allDeps).length} dependencies`);
    }
  }

  checkNetworkSecurity() {
    console.log("\n🔍 Checking Network Security...");
    
    // Check RPC endpoints configuration
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      // Count configured RPC endpoints
      const rpcEndpoints = envContent.match(/.*RPC.*URL.*=.*https?:\/\//gi) || [];
      this.addFinding('info', `${rpcEndpoints.length} RPC endpoints configured`);
      
      // Check for HTTP vs HTTPS
      if (envContent.includes('http://') && !envContent.includes('localhost')) {
        this.addFinding('warning', 'HTTP endpoints detected', 
          'Use HTTPS for security');
      }
    }
  }

  findFiles(dir, pattern, exclude = []) {
    const files = [];
    
    function searchDir(currentDir) {
      try {
        const items = fs.readdirSync(currentDir);
        
        items.forEach(item => {
          const fullPath = path.join(currentDir, item);
          const relativePath = path.relative(process.cwd(), fullPath);
          
          if (exclude.some(ex => relativePath.includes(ex))) {
            return;
          }
          
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            searchDir(fullPath);
          } else if (pattern.test(item)) {
            files.push(fullPath);
          }
        });
      } catch (e) {
        // Skip directories we can't read
      }
    }
    
    searchDir(dir);
    return files;
  }

  generateReport() {
    console.log("\n📊 Security Audit Report");
    console.log("========================");
    
    const totalIssues = this.findings.length + this.warnings.length;
    
    console.log(`🔍 Total Issues Found: ${totalIssues}`);
    console.log(`❌ Critical/Errors: ${this.findings.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`ℹ️  Info: ${this.info.length}`);
    
    if (this.findings.length > 0) {
      console.log("\n❌ Critical Issues:");
      this.findings.forEach((finding, index) => {
        console.log(`  ${index + 1}. ${finding.message}`);
        if (finding.details) {
          console.log(`     ${finding.details}`);
        }
      });
    }
    
    if (this.warnings.length > 0) {
      console.log("\n⚠️  Warnings:");
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning.message}`);
        if (warning.details) {
          console.log(`     ${warning.details}`);
        }
      });
    }

    // Overall security score
    const maxScore = 100;
    const errorPenalty = this.findings.length * 20;
    const warningPenalty = this.warnings.length * 5;
    const score = Math.max(0, maxScore - errorPenalty - warningPenalty);
    
    console.log(`\n🎯 Security Score: ${score}/100`);
    
    if (score >= 90) {
      console.log("✅ Excellent security posture!");
    } else if (score >= 70) {
      console.log("⚠️  Good security, but some improvements needed");
    } else if (score >= 50) {
      console.log("⚠️  Moderate security concerns - address critical issues");
    } else {
      console.log("❌ Significant security issues - do not use in production");
    }

    console.log("\n🔒 Security Recommendations:");
    console.log("1. Always use a dedicated wallet for bundling");
    console.log("2. Never commit .env file or private keys");
    console.log("3. Use premium RPC endpoints for better reliability");
    console.log("4. Test on devnet before mainnet");
    console.log("5. Keep dependencies updated");
    console.log("6. Monitor wallet balances regularly");
    
    return {
      score,
      findings: this.findings,
      warnings: this.warnings,
      info: this.info
    };
  }
}

// Run the audit
const auditor = new SecurityAuditor();

auditor.checkEnvironmentSecurity();
auditor.checkCodeSecurity();
auditor.checkWalletSecurity();
auditor.checkDependencySecurity();
auditor.checkNetworkSecurity();

const report = auditor.generateReport();

// Exit with appropriate code
if (report.findings.length > 0) {
  process.exit(1); // Critical issues found
} else if (report.warnings.length > 5) {
  process.exit(2); // Too many warnings
} else {
  process.exit(0); // All good
}
