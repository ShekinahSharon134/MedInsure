// Debug script to test claim submission in Truffle console
// Run with: truffle exec debug-claim.js

const HospitalRegistry = artifacts.require("HospitalRegistry");
const UserRegistry = artifacts.require("UserRegistry");
const PolicyContract = artifacts.require("PolicyContract");
const ClaimsContract = artifacts.require("ClaimsContract");

module.exports = async function(callback) {
  try {
    console.log("\n🔍 DEBUGGING CLAIM SUBMISSION\n");
    console.log("=".repeat(60));

    // Get contract instances
    const hospitalRegistry = await HospitalRegistry.deployed();
    const userRegistry = await UserRegistry.deployed();
    const policyContract = await PolicyContract.deployed();
    const claimsContract = await ClaimsContract.deployed();

    // Define addresses
    const insurerAddress = "0xa003158186fB4ebC91291E1BaEBa0219EcCe1aD5";
    const hospitalAddress = "0x3c93061F47e19CE7806154FFCA63939d164Ce71a";
    const patientAddress = "0xBbBF347257110a7699AD53aF46acF84403C5709c";

    console.log("\n📋 Contract Addresses:");
    console.log("HospitalRegistry:", hospitalRegistry.address);
    console.log("UserRegistry:    ", userRegistry.address);
    console.log("PolicyContract:  ", policyContract.address);
    console.log("ClaimsContract:  ", claimsContract.address);

    console.log("\n👥 Account Addresses:");
    console.log("Insurer: ", insurerAddress);
    console.log("Hospital:", hospitalAddress);
    console.log("Patient: ", patientAddress);

    // Check 1: Is hospital registered?
    console.log("\n" + "=".repeat(60));
    console.log("CHECK 1: Hospital Registration");
    console.log("=".repeat(60));
    
    const isHospitalRegistered = await hospitalRegistry.checkHospital(hospitalAddress);
    console.log("✓ Hospital registered:", isHospitalRegistered);
    
    if (!isHospitalRegistered) {
      console.log("❌ PROBLEM: Hospital is NOT registered!");
      console.log("   Solution: Register hospital as insurer first");
      callback();
      return;
    }

    // Check 2: Is patient registered and approved?
    console.log("\n" + "=".repeat(60));
    console.log("CHECK 2: Patient Registration");
    console.log("=".repeat(60));
    
    try {
      const patient = await userRegistry.getPatient(patientAddress);
      console.log("✓ Patient name:", patient.name);
      console.log("✓ Status:", patient.status);
      
      if (patient.status !== "Approved") {
        console.log("❌ PROBLEM: Patient status is '" + patient.status + "', not 'Approved'!");
        console.log("   Solution: Approve patient as insurer first");
        callback();
        return;
      }
    } catch (error) {
      console.log("❌ PROBLEM: Patient not registered!");
      console.log("Error:", error.message);
      console.log("   Solution: Register patient first");
      callback();
      return;
    }

    // Check 3: Does patient have subscription?
    console.log("\n" + "=".repeat(60));
    console.log("CHECK 3: Patient Subscription");
    console.log("=".repeat(60));
    
    try {
      const subscription = await policyContract.getSubscription(patientAddress);
      console.log("✓ Policy ID:", subscription.policyId.toString());
      console.log("✓ Status:", subscription.subscriptionStatus);
      console.log("✓ Payment:", subscription.paymentStatus);
      
      if (subscription.subscriptionStatus !== "Active") {
        console.log("❌ PROBLEM: Subscription not active!");
        console.log("   Solution: Subscribe to policy as patient");
        callback();
        return;
      }
      
      if (subscription.paymentStatus === "Overdue") {
        console.log("❌ PROBLEM: Payment is overdue!");
        console.log("   Solution: Pay premium as patient");
        callback();
        return;
      }

      // Check 4: Is policy active?
      console.log("\n" + "=".repeat(60));
      console.log("CHECK 4: Policy Details");
      console.log("=".repeat(60));
      
      const policy = await policyContract.getPolicy(subscription.policyId);
      console.log("✓ Policy name:", policy.policyName);
      console.log("✓ Coverage limit:", web3.utils.fromWei(policy.coverageLimit.toString(), 'ether'), "ETH");
      console.log("✓ Deductible:", web3.utils.fromWei(policy.deductible.toString(), 'ether'), "ETH");
      console.log("✓ Copay:", policy.copayPercentage.toString(), "%");
      console.log("✓ Status:", policy.status);
      
      if (policy.status !== "Active") {
        console.log("❌ PROBLEM: Policy status is '" + policy.status + "', not 'Active'!");
        callback();
        return;
      }

      // Check 5: Patient coverage in ClaimsContract
      console.log("\n" + "=".repeat(60));
      console.log("CHECK 5: Patient Coverage (ClaimsContract)");
      console.log("=".repeat(60));
      
      const coverage = await claimsContract.getPatientCoverage(patientAddress);
      console.log("✓ Policy ID:", coverage.policyId.toString());
      console.log("✓ Total coverage:", web3.utils.fromWei(coverage.totalCoverageLimit.toString(), 'ether'), "ETH");
      console.log("✓ Remaining:", web3.utils.fromWei(coverage.remainingCoverage.toString(), 'ether'), "ETH");
      console.log("✓ Total claimed:", web3.utils.fromWei(coverage.totalClaimedAmount.toString(), 'ether'), "ETH");
      console.log("✓ Deductible used:", web3.utils.fromWei(coverage.deductibleUsed.toString(), 'ether'), "ETH");
      console.log("✓ Deductible met:", coverage.deductibleMet);

      // Try to submit a test claim
      console.log("\n" + "=".repeat(60));
      console.log("CHECK 6: Test Claim Submission");
      console.log("=".repeat(60));
      
      const claimAmount = web3.utils.toWei("1", "ether");
      console.log("Attempting to submit claim for 1 ETH...");
      
      try {
        const result = await claimsContract.submitClaim(
          patientAddress,
          claimAmount,
          "Test treatment",
          "QmTestCID123",
          { from: hospitalAddress, gas: 3000000 }
        );
        
        console.log("✅ SUCCESS! Claim submitted!");
        console.log("Transaction hash:", result.tx);
        console.log("Gas used:", result.receipt.gasUsed);
        
        // Get the claim details
        const claimId = result.logs[0].args.claimId;
        const claim = await claimsContract.getClaim(claimId);
        console.log("\n📄 Claim Details:");
        console.log("Claim ID:", claim.claimId.toString());
        console.log("Claim amount:", web3.utils.fromWei(claim.claimAmount.toString(), 'ether'), "ETH");
        console.log("Deductible:", web3.utils.fromWei(claim.deductibleAmount.toString(), 'ether'), "ETH");
        console.log("Copay:", web3.utils.fromWei(claim.copayAmount.toString(), 'ether'), "ETH");
        console.log("Insurer pays:", web3.utils.fromWei(claim.insurerPaysAmount.toString(), 'ether'), "ETH");
        console.log("Patient pays:", web3.utils.fromWei(claim.patientPaysAmount.toString(), 'ether'), "ETH");
        console.log("Status:", claim.status);
        
        // Check coverage after claim
        const coverageAfter = await claimsContract.getPatientCoverage(patientAddress);
        console.log("\n📊 Coverage After Claim:");
        console.log("Policy ID:", coverageAfter.policyId.toString());
        console.log("Total coverage:", web3.utils.fromWei(coverageAfter.totalCoverageLimit.toString(), 'ether'), "ETH");
        console.log("Remaining:", web3.utils.fromWei(coverageAfter.remainingCoverage.toString(), 'ether'), "ETH");
        
      } catch (error) {
        console.log("❌ CLAIM SUBMISSION FAILED!");
        console.log("Error:", error.message);
        
        // Get the full error reason
        if (error.reason) {
          console.log("\n🔍 Revert Reason:", error.reason);
        }
        
        // Try to identify the specific revert reason
        if (error.message.includes("Hospital not registered")) {
          console.log("\n🔍 Issue: Hospital not registered in HospitalRegistry");
        } else if (error.message.includes("Patient subscription not active")) {
          console.log("\n🔍 Issue: Patient subscription is not active");
        } else if (error.message.includes("Patient payment overdue")) {
          console.log("\n🔍 Issue: Patient payment is overdue");
        } else if (error.message.includes("Policy not active")) {
          console.log("\n🔍 Issue: Policy is not active");
        } else if (error.message.includes("Policy coverage limit is 0")) {
          console.log("\n🔍 Issue: Policy coverage limit is 0");
        } else if (error.message.includes("No coverage remaining")) {
          console.log("\n🔍 Issue: No coverage remaining");
        } else if (error.message.includes("Claim amount must be greater than 0")) {
          console.log("\n🔍 Issue: Claim amount is 0");
        } else {
          console.log("\n🔍 Unknown error - trying to get more details...");
          
          // Try to call the function with estimateGas to get better error
          try {
            await claimsContract.submitClaim.estimateGas(
              patientAddress,
              claimAmount,
              "Test treatment",
              "QmTestCID123",
              { from: hospitalAddress }
            );
          } catch (gasError) {
            console.log("Gas estimation error:", gasError.message);
          }
        }
      }

    } catch (error) {
      console.log("❌ PROBLEM: Could not get subscription!");
      console.log("Error:", error.message);
      console.log("   Solution: Subscribe to policy as patient");
    }

    console.log("\n" + "=".repeat(60));
    console.log("Debug complete!");
    console.log("=".repeat(60) + "\n");

    callback();
  } catch (error) {
    console.error("Error:", error);
    callback(error);
  }
};
