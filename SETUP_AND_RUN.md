# MedInsure - Complete Setup & Run Guide

## Prerequisites

Before starting, make sure you have:
- ✅ Node.js (v14 or higher)
- ✅ Ganache (for local blockchain)
- ✅ MetaMask browser extension
- ✅ Truffle installed globally

If you don't have Truffle:
```bash
npm install -g truffle
```

---

## Step 1: Start Ganache

1. Open Ganache application
2. Click "Quickstart" or create a new workspace
3. Make sure it's running on `http://127.0.0.1:7545`
4. Note down the first 3 account addresses (you'll need them)

---

## Step 2: Compile Smart Contracts

Open terminal in the project root directory:

```bash
truffle compile
```

You should see:
```
Compiling your contracts...
✔ Compiled successfully
```

---

## Step 3: Deploy Contracts to Ganache

```bash
truffle migrate --reset
```

**IMPORTANT:** After deployment, you'll see output like this:

```
2_deploy_contracts.js
=====================

   Deploying 'HospitalRegistry'
   ----------------------------
   > contract address:    0xA39cE24807ae652039E1D7c88f0A23D71cDB4A81

   Deploying 'UserRegistry'
   ------------------------
   > contract address:    0xe8bF5993C4162Eda2dcb92d5488a9f978B6805Bd

   Deploying 'PolicyContract'
   --------------------------
   > contract address:    0xd32508C30cEc0d3961c2fBA35aaB127DD14BDAe9

   Deploying 'ClaimsContract'
   --------------------------
   > contract address:    0x1234567890abcdef... (YOUR NEW ADDRESS)
```

**COPY THE ClaimsContract ADDRESS** - you'll need it in Step 5!

---

## Step 4: Copy Contract ABIs to Frontend

```bash
cp build/contracts/ClaimsContract.json client/src/contracts/
```

This copies the compiled contract ABI so the frontend can interact with it.

---

## Step 5: Update Contract Addresses in Frontend

You need to update the ClaimsContract address in 3 files:

### File 1: `client/src/components/Hospital/SubmitClaim.js`

Find this line (around line 5):
```javascript
const CONTRACT_ADDRESS = "YOUR_CLAIMS_CONTRACT_ADDRESS";
```

Replace with your deployed address:
```javascript
const CONTRACT_ADDRESS = "0x1234567890abcdef..."; // Paste your ClaimsContract address
```

### File 2: `client/src/components/Insurer/ViewClaims.js`

Same thing - update line 5:
```javascript
const CONTRACT_ADDRESS = "0x1234567890abcdef..."; // Paste your ClaimsContract address
```

### File 3: `client/src/components/Patient/ViewMyClaims.js`

Same thing - update line 5:
```javascript
const CONTRACT_ADDRESS = "0x1234567890abcdef..."; // Paste your ClaimsContract address
```

---

## Step 6: Setup MetaMask

### Connect to Ganache Network

1. Open MetaMask
2. Click network dropdown (top)
3. Click "Add Network" → "Add a network manually"
4. Fill in:
   - Network Name: `Ganache Local`
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`
5. Click "Save"

### Import Ganache Accounts

Import 3 accounts from Ganache:

1. In Ganache, click the key icon next to Account 0
2. Copy the private key
3. In MetaMask: Click account icon → "Import Account" → Paste private key
4. Repeat for Account 1 and Account 2

You should now have:
- **Account 1** (Ganache Account 0) = Insurer
- **Account 2** (Ganache Account 1) = Hospital  
- **Account 3** (Ganache Account 2) = Patient

---

## Step 7: Install Frontend Dependencies

```bash
cd client
npm install
```

Wait for all packages to install.

---

## Step 8: Start the React App

```bash
npm start
```

The app should open at `http://localhost:3000`

---

## Step 9: Test the Complete Workflow

### A. As Insurer (Account 1 in MetaMask)

1. Switch to Account 1 in MetaMask
2. Refresh the page
3. You should see "Insurer Dashboard"
4. Click "Create Policy"
5. Fill in:
   - Policy Name: `Basic Health Plan`
   - Coverage Limit: `5` ETH
   - Premium Amount: `0.5` ETH
   - Deductible: `0.5` ETH
   - Co-pay Percentage: `20`
   - Validity: `1 Year`
   - Covered: `Surgery, ICU, Emergency`
   - Excluded: `Cosmetic, Dental`
6. Click "Create Policy"
7. Approve transaction in MetaMask
8. Wait for confirmation ✅

9. Go back to dashboard
10. Click "Register Hospital"
11. Fill in hospital details
12. Use **Account 2 address** from MetaMask as wallet address
13. Submit and approve transaction

### B. As Patient (Account 3 in MetaMask)

1. Switch to Account 3 in MetaMask
2. Refresh the page
3. Click "Register as Patient"
4. Fill in your details
5. For OTP verification - just check the box (simplified for testing)
6. Upload a photo (or use dummy data)
7. Enter Aadhaar hash (any unique string)
8. Submit and approve transaction

9. Switch back to Account 1 (Insurer)
10. Go to "Approve Patients"
11. Find Account 3 and approve

12. Switch back to Account 3 (Patient)
13. Go to "Subscribe to Policy"
14. Select the policy you created
15. Click "Subscribe" and pay 0.5 ETH
16. Approve transaction in MetaMask

### C. As Hospital (Account 2 in MetaMask)

1. Switch to Account 2 in MetaMask
2. Refresh the page
3. You should see "Hospital Dashboard"
4. Click "Submit Claim" (or navigate to `/hospital/submit-claim`)
5. Fill in:
   - Patient Address: `[Account 3 address from MetaMask]`
   - Claim Amount: `3` ETH
   - Treatment: `Emergency Surgery`
   - IPFS CID: `QmTest123` (dummy for testing)
6. Click "Submit Claim"
7. Approve transaction in MetaMask

**The smart contract will automatically calculate:**
- Deductible: 0.5 ETH (patient pays)
- Co-pay: 0.5 ETH (20% of 2.5 ETH remaining)
- Insurer pays: 2.0 ETH
- Patient pays: 1.0 ETH

### D. As Insurer - Approve Claim

1. Switch to Account 1 (Insurer)
2. Go to "View Claims"
3. You'll see the claim with payment breakdown
4. Click "Approve"
5. MetaMask will ask you to send 2.0 ETH
6. Approve the transaction
7. The hospital receives 2.0 ETH automatically! ✅

### E. As Patient - View Your Claims

1. Switch to Account 3 (Patient)
2. Go to "My Claims"
3. You'll see:
   - Your claim status: "Approved"
   - Coverage used
   - Remaining coverage: 3 ETH
   - Amount you owe hospital: 1.0 ETH

---

## Troubleshooting

### "Nonce too high" error
- Reset MetaMask: Settings → Advanced → Clear activity tab data

### "Contract not deployed"
- Make sure Ganache is running
- Run `truffle migrate --reset` again
- Check contract addresses match in frontend

### "Transaction failed"
- Check you have enough ETH in MetaMask
- Make sure you're on the correct account
- Check Ganache console for errors

### Page shows "Connecting to blockchain..."
- Make sure MetaMask is unlocked
- Make sure you're on Ganache network in MetaMask
- Refresh the page

### "Patient subscription not active"
- Patient must subscribe to policy first
- Check subscription status in patient dashboard

---

## Project Structure

```
MedInsure/
├── contracts/
│   ├── ClaimsContract.sol       ← NEW: Handles claims with copay/deductible
│   ├── PolicyContract.sol       ← UPDATED: Added deductible & copay fields
│   ├── HospitalRegistry.sol
│   └── UserRegistry.sol
├── migrations/
│   └── 2_deploy_contracts.js    ← UPDATED: Deploys ClaimsContract
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Hospital/
│   │   │   │   ├── HospitalDashboard.js
│   │   │   │   └── SubmitClaim.js      ← NEW
│   │   │   ├── Insurer/
│   │   │   │   ├── CreatePolicy.js     ← UPDATED
│   │   │   │   └── ViewClaims.js       ← NEW
│   │   │   └── Patient/
│   │   │       └── ViewMyClaims.js     ← NEW
│   │   ├── contracts/
│   │   │   └── ClaimsContract.json     ← Copy after compile
│   │   └── App.js                      ← UPDATED: Added new routes
│   └── package.json
├── truffle-config.js
└── SETUP_AND_RUN.md                    ← This file
```

---

## Quick Command Reference

```bash
# Compile contracts
truffle compile

# Deploy to Ganache
truffle migrate --reset

# Copy ABI
cp build/contracts/ClaimsContract.json client/src/contracts/

# Install frontend dependencies
cd client
npm install

# Start React app
npm start

# Open Truffle console (for debugging)
truffle console
```

---

## Next Steps

Once everything is working:

1. ✅ Test multiple claims to see coverage decrease
2. ✅ Test deductible being met (submit another claim)
3. ✅ Test claim rejection
4. ✅ Add IPFS integration for real document upload
5. ✅ Add ML fraud detection
6. ✅ Deploy to testnet (Sepolia/Goerli)

---

## Support

If you encounter issues:
1. Check Ganache console for transaction logs
2. Check browser console (F12) for errors
3. Check MetaMask transaction history
4. Verify contract addresses are correct
5. Make sure all accounts have ETH

Happy coding! 🚀
