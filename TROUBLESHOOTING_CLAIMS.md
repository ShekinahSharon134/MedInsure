# Troubleshooting Claim Submission Errors

## ❌ Error: "VM Exception while processing transaction: revert"

This error means the smart contract rejected your transaction. Here's how to fix it:

---

## 🔍 Quick Diagnosis

### Step 1: Check Patient Address

**Problem**: Wrong or invalid patient address

**How to check**:
1. Open MetaMask
2. Switch to Patient account
3. Copy the address (click on account name)
4. Make sure it matches what you entered

**Solution**: Use the exact address from MetaMask

---

### Step 2: Check Patient Subscription

**Problem**: Patient hasn't subscribed to a policy

**How to check**:
1. Switch to Patient account in MetaMask
2. Go to Patient Dashboard
3. Look for "Subscription Status"

**What you should see**:
```
✅ Subscription Status: Active
✅ Policy: Basic Health Plan
✅ Coverage Remaining: 5 ETH
```

**If you see "No subscription"**:
```
Solution:
1. Patient must go to "Subscribe to Policy"
2. Select a policy
3. Pay first month premium (e.g., 0.5 ETH)
4. Wait for transaction confirmation
5. Then try submitting claim again
```

---

### Step 3: Check Payment Status

**Problem**: Patient's premium payment is overdue

**How to check**:
1. Go to Patient Dashboard
2. Look for "Payment Status"

**What you should see**:
```
✅ Payment Status: Paid
✅ Next Due Date: [future date]
```

**If you see "Overdue" or "Due"**:
```
Solution:
1. Patient must pay monthly premium
2. Go to Patient Dashboard
3. Click "Pay Premium"
4. Send payment
5. Then try submitting claim again
```

---

### Step 4: Check Policy Status

**Problem**: Policy is not active

**How to check**:
1. Go to Insurer Dashboard
2. Click "View Policies"
3. Find the policy patient subscribed to
4. Check status column

**What you should see**:
```
✅ Status: Active
```

**If you see "Inactive"**:
```
Solution:
1. Contact insurer
2. Insurer must activate the policy
3. Then try submitting claim again
```

---

### Step 5: Check Coverage Remaining

**Problem**: Patient has exhausted coverage limit

**How to check**:
1. Go to Patient Dashboard
2. Look for "Coverage Summary"

**What you should see**:
```
✅ Remaining Coverage: 5 ETH (or any amount > 0)
```

**If you see "Remaining Coverage: 0 ETH"**:
```
Solution:
Patient has used all coverage
Options:
1. Wait for policy renewal
2. Purchase additional coverage
3. Subscribe to new policy
```

---

## 🛠️ Manual Check Using Browser Console

Open browser console (F12) and run:

```javascript
// Check if patient has subscription
const policyContract = new web3.eth.Contract(
  PolicyContract.abi,
  "0x7a362Ab91D314325bf90617966Ce538E3D74bb97"
);

const patientAddress = "0x..."; // Your patient address

// Check 1: Has subscription?
const hasSub = await policyContract.methods.checkActivePolicy(patientAddress).call();
console.log("Has Subscription:", hasSub);

// Check 2: Get subscription details
if (hasSub) {
  const sub = await policyContract.methods.getSubscription(patientAddress).call();
  console.log("Subscription Status:", sub.subscriptionStatus);
  console.log("Payment Status:", sub.paymentStatus);
  console.log("Policy ID:", sub.policyId.toString());
}

// Check 3: Get coverage
const claimsContract = new web3.eth.Contract(
  ClaimsContract.abi,
  "0x0Ff528780c181C081Daa21c84136Eae900dF7E76"
);

const coverage = await claimsContract.methods.getPatientCoverage(patientAddress).call();
console.log("Remaining Coverage:", web3.utils.fromWei(coverage.remainingCoverage, "ether"), "ETH");
```

---

## 📋 Complete Checklist

Before submitting a claim, verify:

- [ ] Patient address is correct (copied from MetaMask)
- [ ] Patient has registered
- [ ] Patient is approved by insurer
- [ ] Patient has subscribed to a policy
- [ ] Patient paid first month premium
- [ ] Subscription status is "Active"
- [ ] Payment status is "Paid" (not "Overdue")
- [ ] Policy status is "Active"
- [ ] Patient has coverage remaining (> 0 ETH)
- [ ] Hospital is registered
- [ ] Using correct MetaMask account (Hospital)
- [ ] Claim amount is valid (> 0)
- [ ] Treatment description is filled

---

## 🔄 Complete Setup Flow

If patient is not set up, follow this order:

### 1. Patient Registration
```
1. Switch to Patient account in MetaMask
2. Go to "Register as Patient"
3. Fill in details
4. Submit registration
5. Wait for confirmation
```

### 2. Insurer Approval
```
1. Switch to Insurer account in MetaMask
2. Go to "Approve Patients"
3. Find the patient
4. Click "Approve"
5. Confirm transaction
```

### 3. Patient Subscription
```
1. Switch back to Patient account
2. Go to "Subscribe to Policy"
3. Select a policy
4. Click "Subscribe"
5. Pay premium (e.g., 0.5 ETH)
6. Wait for confirmation
```

### 4. Now Submit Claim
```
1. Switch to Hospital account
2. Go to "Submit Claim"
3. Enter patient address
4. Fill in claim details
5. Upload documents
6. Submit
```

---

## 🎯 Common Error Messages & Solutions

### "Patient subscription not active"
**Cause**: Patient hasn't subscribed
**Solution**: Patient must subscribe to policy first

### "Payment overdue"
**Cause**: Patient missed premium payment
**Solution**: Patient must pay monthly premium

### "Policy not active"
**Cause**: Policy is inactive or suspended
**Solution**: Contact insurer to activate policy

### "No coverage remaining"
**Cause**: Patient used all coverage
**Solution**: Patient needs new policy or renewal

### "Hospital not registered"
**Cause**: Your hospital is not in the system
**Solution**: Contact insurer to register hospital

### "Claim amount exceeds remaining coverage"
**Cause**: Claim is larger than available coverage
**Solution**: Reduce claim amount or patient pays excess

---

## 🆘 Still Not Working?

### Check Ganache
1. Open Ganache
2. Check if it's running
3. Verify network is on port 7545
4. Check accounts have ETH

### Check MetaMask
1. Verify you're on Ganache network
2. Check you're using correct account
3. Clear activity data if needed:
   - Settings → Advanced → Clear activity tab data

### Check Contract Addresses
1. Verify all contract addresses are correct
2. Check `CONTRACT_ADDRESSES.md`
3. Make sure they match your deployment

### Check Browser Console
1. Press F12
2. Go to Console tab
3. Look for error messages
4. Share errors for help

---

## 📞 Debug Commands

Run these in browser console to diagnose:

```javascript
// Get current account
const accounts = await web3.eth.getAccounts();
console.log("Current Account:", accounts[0]);

// Check account balance
const balance = await web3.eth.getBalance(accounts[0]);
console.log("Balance:", web3.utils.fromWei(balance, "ether"), "ETH");

// Check if contracts are deployed
const code = await web3.eth.getCode("0x0Ff528780c181C081Daa21c84136Eae900dF7E76");
console.log("Contract deployed:", code !== "0x");
```

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ No error messages appear
2. ✅ Progress messages show:
   - "🔍 Checking patient eligibility..."
   - "✅ Patient is eligible"
   - "📤 Uploading documents..."
   - "⛓️ Submitting to blockchain..."
3. ✅ MetaMask pops up for confirmation
4. ✅ Transaction confirms
5. ✅ "✅ Claim Submitted Successfully!" appears
6. ✅ Claim appears in "View Claims"

---

**Need more help? Check the browser console (F12) for detailed error messages!**
