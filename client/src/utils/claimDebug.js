// Claim Submission Debug Utility

export const debugClaimSubmission = async (web3, patientAddress, policyContractAddress, claimsContractAddress) => {
  try {
    console.log("🔍 Debugging Claim Submission...");
    console.log("Patient Address:", patientAddress);
    
    const PolicyContract = require('../contracts/PolicyContract.json');
    const ClaimsContract = require('../contracts/ClaimsContract.json');
    
    const policyContract = new web3.eth.Contract(PolicyContract.abi, policyContractAddress);
    const claimsContract = new web3.eth.Contract(ClaimsContract.abi, claimsContractAddress);
    
    // Check 1: Does patient have a subscription?
    console.log("\n✅ Check 1: Subscription Status");
    const hasSubscription = await policyContract.methods.checkActivePolicy(patientAddress).call();
    console.log("Has Subscription:", hasSubscription);
    
    if (!hasSubscription) {
      console.error("❌ PROBLEM: Patient has no subscription!");
      console.log("Solution: Patient must subscribe to a policy first");
      return {
        success: false,
        error: "Patient has no subscription",
        solution: "Patient must subscribe to a policy first"
      };
    }
    
    // Check 2: Get subscription details
    console.log("\n✅ Check 2: Subscription Details");
    const subscription = await policyContract.methods.getSubscription(patientAddress).call();
    console.log("Policy ID:", subscription.policyId.toString());
    console.log("Policy Name:", subscription.policyName);
    console.log("Subscription Status:", subscription.subscriptionStatus);
    console.log("Payment Status:", subscription.paymentStatus);
    
    if (subscription.subscriptionStatus !== "Active") {
      console.error("❌ PROBLEM: Subscription is not Active!");
      console.log("Current Status:", subscription.subscriptionStatus);
      console.log("Solution: Check if subscription is Suspended or Expired");
      return {
        success: false,
        error: `Subscription status is ${subscription.subscriptionStatus}`,
        solution: "Patient needs to pay overdue premium or renew policy"
      };
    }
    
    if (subscription.paymentStatus === "Overdue") {
      console.error("❌ PROBLEM: Payment is Overdue!");
      console.log("Solution: Patient must pay monthly premium");
      return {
        success: false,
        error: "Payment is overdue",
        solution: "Patient must pay monthly premium first"
      };
    }
    
    // Check 3: Get policy details
    console.log("\n✅ Check 3: Policy Details");
    const policy = await policyContract.methods.getPolicy(subscription.policyId).call();
    console.log("Policy Status:", policy.status);
    console.log("Coverage Limit:", web3.utils.fromWei(policy.coverageLimit, "ether"), "ETH");
    console.log("Deductible:", web3.utils.fromWei(policy.deductible, "ether"), "ETH");
    console.log("Copay:", policy.copayPercentage.toString(), "%");
    
    if (policy.status !== "Active") {
      console.error("❌ PROBLEM: Policy is not Active!");
      console.log("Solution: Contact insurer to activate policy");
      return {
        success: false,
        error: "Policy is not active",
        solution: "Contact insurer to activate policy"
      };
    }
    
    // Check 4: Get patient coverage
    console.log("\n✅ Check 4: Patient Coverage");
    const coverage = await claimsContract.methods.getPatientCoverage(patientAddress).call();
    
    if (coverage.policyId === "0") {
      console.log("ℹ️ No claims submitted yet - coverage will be initialized on first claim");
      console.log("Total Coverage Available:", web3.utils.fromWei(policy.coverageLimit, "ether"), "ETH");
    } else {
      console.log("Total Coverage:", web3.utils.fromWei(coverage.totalCoverageLimit, "ether"), "ETH");
      console.log("Remaining Coverage:", web3.utils.fromWei(coverage.remainingCoverage, "ether"), "ETH");
      console.log("Total Claimed:", web3.utils.fromWei(coverage.totalClaimedAmount, "ether"), "ETH");
      console.log("Deductible Used:", web3.utils.fromWei(coverage.deductibleUsed, "ether"), "ETH");
      console.log("Deductible Met:", coverage.deductibleMet);
      
      if (coverage.remainingCoverage === "0") {
        console.error("❌ PROBLEM: No coverage remaining!");
        console.log("Solution: Patient has exhausted coverage limit");
        return {
          success: false,
          error: "No coverage remaining",
          solution: "Patient needs to purchase new policy"
        };
      }
    }
    
    console.log("\n✅ All checks passed! Patient is eligible to submit claims.");
    return {
      success: true,
      subscription: subscription,
      policy: policy,
      coverage: coverage
    };
    
  } catch (error) {
    console.error("❌ Debug Error:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default debugClaimSubmission;
