# MedInsure - Copay & Deductible Feature

## 🎯 What's New

This update adds **automatic copay and deductible calculation** to your blockchain insurance system. The smart contract now handles complex payment splitting between insurer and patient based on policy terms.

## 📦 What Was Added

### New Smart Contract
- **ClaimsContract.sol** - Handles claim submission, approval, and automatic payment calculation

### Updated Smart Contract
- **PolicyContract.sol** - Added `deductible` and `copayPercentage` fields

### New Frontend Components
- **SubmitClaim.js** - Hospital submits claims
- **ViewClaims.js** - Insurer reviews and approves claims
- **ViewMyClaims.js** - Patient views claims and coverage

### Updated Frontend Components
- **CreatePolicy.js** - Added deductible and copay inputs
- **App.js** - Added new routes

## 🚀 How to Run

### Quick Start (5 minutes)

```bash
# 1. Start Ganache (GUI)

# 2. Deploy contracts
truffle compile
truffle migrate --reset

# 3. Copy ABI
cp build/contracts/ClaimsContract.json client/src/contracts/

# 4. Update contract addresses in frontend
# Edit these 3 files with your ClaimsContract address:
# - client/src/components/Hospital/SubmitClaim.js
# - client/src/components/Insurer/ViewClaims.js
# - client/src/components/Patient/ViewMyClaims.js

# 5. Install and run
cd client
npm install
npm start
```

### Detailed Instructions

See **SETUP_AND_RUN.md** for complete step-by-step guide.

## 💡 How It Works

### Example Scenario

**Policy Terms:**
- Coverage Limit: 5 ETH
- Monthly Premium: 0.5 ETH
- Deductible: 0.5 ETH
- Co-pay: 20%

**Patient gets treatment costing 3 ETH:**

```
Total Bill:          3.000 ETH
- Deductible:        0.500 ETH  ← Patient pays first
Remaining:           2.500 ETH
- Co-pay (20%):      0.500 ETH  ← Patient shares
─────────────────────────────────
Insurer Pays:        2.000 ETH  → Sent to hospital
Patient Pays:        1.000 ETH  → Paid to hospital
```

**After claim:**
- Remaining Coverage: 3 ETH (was 5 ETH)
- Deductible Met: ✅ Yes
- Next claim: Only copay applies (no more deductible)

## 🔑 Key Features

✅ **Automatic Calculations** - Smart contract calculates everything
✅ **Deductible Tracking** - Tracks if deductible is met
✅ **Coverage Tracking** - Decreases with each claim
✅ **Payment Breakdown** - Clear visualization of who pays what
✅ **IPFS Integration** - Store medical documents
✅ **MetaMask Ready** - Full Web3 integration
✅ **Claim Status** - Pending, Approved, Rejected

## 📊 Smart Contract Functions

### ClaimsContract

**For Hospitals:**
```solidity
submitClaim(patientAddress, claimAmount, treatment, ipfsCID)
```

**For Insurer:**
```solidity
approveClaim(claimId) payable
rejectClaim(claimId, reason)
```

**View Functions:**
```solidity
getClaim(claimId)
getPatientClaims(patientAddress)
getPatientCoverage(patientAddress)
calculatePayout(claimAmount, deductible, copay, deductibleUsed, remainingCoverage)
```

## 🧪 Testing

### Test Accounts (from Ganache)
- Account 1: Insurer
- Account 2: Hospital
- Account 3: Patient

### Test Flow
1. Insurer creates policy with deductible & copay
2. Patient subscribes (pays premium)
3. Hospital submits claim
4. Smart contract calculates payment split
5. Insurer approves (sends ETH to hospital)
6. Patient views their responsibility

See **DEPLOYMENT_CHECKLIST.md** for complete testing checklist.

## 📁 Project Structure

```
MedInsure/
├── contracts/
│   ├── ClaimsContract.sol       ← NEW
│   ├── PolicyContract.sol       ← UPDATED
│   ├── HospitalRegistry.sol
│   └── UserRegistry.sol
├── migrations/
│   └── 2_deploy_contracts.js    ← UPDATED
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Hospital/
│   │   │   │   └── SubmitClaim.js      ← NEW
│   │   │   ├── Insurer/
│   │   │   │   ├── CreatePolicy.js     ← UPDATED
│   │   │   │   └── ViewClaims.js       ← NEW
│   │   │   └── Patient/
│   │   │       └── ViewMyClaims.js     ← NEW
│   │   ├── contracts/
│   │   │   └── ClaimsContract.json     ← Copy after compile
│   │   └── App.js                      ← UPDATED
│   └── package.json
└── truffle-config.js
```

## 📚 Documentation

- **QUICK_START.md** - Fast setup guide (5 minutes)
- **SETUP_AND_RUN.md** - Detailed step-by-step instructions
- **COPAY_DEDUCTIBLE_GUIDE.md** - Feature documentation
- **DEPLOYMENT_CHECKLIST.md** - Complete checklist
- **WORKFLOW_DIAGRAM.txt** - Visual workflow diagram

## 🔧 Troubleshooting

**Contract not deployed?**
```bash
truffle migrate --reset
```

**Nonce too high?**
- MetaMask → Settings → Advanced → Clear activity data

**Transaction failed?**
- Check you have enough ETH
- Verify you're on correct account
- Check Ganache console

**Stuck on "Connecting..."?**
- Make sure MetaMask is on Ganache network
- Unlock MetaMask
- Refresh page

## 🎓 Technical Details

### Payment Calculation Logic

```javascript
// 1. Apply deductible first
if (claimAmount <= deductibleRemaining) {
    patientPays = claimAmount;
    insurerPays = 0;
} else {
    deductibleAmount = deductibleRemaining;
    amountAfterDeductible = claimAmount - deductibleAmount;
    
    // 2. Apply copay percentage
    copayAmount = amountAfterDeductible * copayPercentage / 100;
    insurerPays = amountAfterDeductible - copayAmount;
    patientPays = deductibleAmount + copayAmount;
    
    // 3. Check coverage limit
    if (insurerPays > remainingCoverage) {
        insurerPays = remainingCoverage;
        patientPays = claimAmount - insurerPays;
    }
}
```

### Coverage Tracking

```javascript
// After claim approval
remainingCoverage -= insurerPaysAmount;
totalClaimedAmount += insurerPaysAmount;
deductibleUsed += deductibleAmount;

if (deductibleUsed >= policyDeductible) {
    deductibleMet = true;
}
```

## 🚀 Next Steps

1. ✅ Test the complete workflow
2. ✅ Add IPFS document upload
3. ✅ Implement ML fraud detection
4. ✅ Add claim appeal process
5. ✅ Create analytics dashboard
6. ✅ Deploy to testnet (Sepolia)
7. ✅ Add email/SMS notifications

## 📞 Support

Need help? Check:
1. Browser console (F12) for errors
2. Ganache console for transaction logs
3. MetaMask transaction history
4. Contract addresses are correct
5. All accounts have ETH

## 🎉 Success Criteria

You're done when:
- ✅ Insurer can create policies with deductible & copay
- ✅ Hospital can submit claims
- ✅ Smart contract calculates payments automatically
- ✅ Insurer can approve and send ETH
- ✅ Patient can view claims and coverage
- ✅ Coverage decreases with claims
- ✅ Deductible tracking works

## 📝 License

MIT

## 👥 Contributors

Your team

---

**Happy coding! 🚀**

For detailed instructions, see **SETUP_AND_RUN.md**
