// Complete test script - registers everything and tests claim submission
// Run with: truffle exec test-claim-complete.js

const HospitalRegistry = artifacts.require("HospitalRegistry");
const UserRegistry = artifacts.require("UserRegistry");
const PolicyContract = artifacts.require("PolicyContract");
const ClaimsContract = artifacts.require("ClaimsContract");

module.exports = async function(callback) {
  try {
    console.log("\n🧪 COMPLETE CLAIM SUBMISSION TEST\n");
    console.log("=".repeat(60));

    // Get contract instances
    const hospitalRegistry = await HospitalRegistry.deployed();
    const userRegistry = await UserRegistry.deployed();
    const policyContract = await PolicyContract.deployed();
    const claimsContract = await ClaimsContract.deployed();

    // Get accounts
    const accounts = await web3.eth.getAccounts();
    const insurerAddress = accounts[0];
    const hospitalAddress = accounts[1];
    const patientAddress = accounts[2];

    console.log("\n📋 Setup:");
    console.log("Insurer: ", insurerAddress);
    console.log("Hospital:", hospitalAddress);
    console.log("Patient: ", patientAddress);

    // Step 1: Register Hospital
    console.log("\n" + "=".repeat(60));
    console.log("STEP 1: Register Hospital");
    console.log("=".repeat(60));
    
    await hospitalRegistry.registerHospital(
      "City Hospital",
      "123 Main St",
      "Test City",
      "Test State",
      "123456",
      "LIC123",
      hospitalAddress,
      { from: insurerAddress }
    );
    console.log("✅ Hospital registered");

    // Step 2: Create Policy
    console.log("\n" + "=".repeat(60));
    console.log("STEP 2: Create Policy");
    console.log("=".repeat(60));
    
    await policyContract.createPolicy({
      policyName: "Basic Health Plan",
      coverageLimit: web3.utils.toWei("5", "ether"),
      premiumAmount: web3.utils.toWei("0.5", "ether"),
      validityPeriod: 1,
      ipfsCID: "QmTest123",
      covered: "Emergency, Surgery",
      excluded: "Cosmetic",
      deductible: web3.utils.toWei("0.5", "ether"),
      copayPercentage: 20
    }, { from: insurerAddress });
    console.log("✅ Policy created");

    // Step 3: Register Patient
    console.log("\n" + "=".repeat(60));
    console.log("STEP 3: Register Patient");
    console.log("=".repeat(60));
    
    await userRegistry.registerPatient({
      name: "Test Patient",
      dob: "1990-01-01",
      gender: "Male",
      mobile: "9876543210",
      email: "test@example.com",
      location: "Test City",
      otpVerified: true,
      aadharHash: "hash123",
      photoHash: "photo123"
    }, { from: patientAddress });
    console.log("✅ Patient registered");

    // Step 4: Approve Patient
    console.log("\n" + "=".repeat(60));
    console.log("STEP 4: Approve Patient");
    console.log("=".repeat(60));
    
    await userRegistry.approvePatient(patientAddress, { from: insurerAddress });
    console.log("✅ Patient approved");

    // Step 5: Subscribe to Policy
    console.log("\n" + "=".repeat(60));
    console.log("STEP 5: Subscribe to Policy");
    console.log("=".repeat(60));
    
    await policyContract.subscribePolicy(1, {
      from: patientAddress,
      value: web3.utils.toWei("0.5", "ether")
    });
    console.log("✅ Patient subscribed");

    // Step 6: Submit Claim
    console.log("\n" + "=".repeat(60));
    console.log("STEP 6: Submit Claim");
    console.log("=".repeat(60));
    
    const claimAmount = web3.utils.toWei("1", "ether");
    console.log("Submitting claim for 1 ETH...");
    
    const result = await claimsContract.submitClaim(
      patientAddress,
      claimAmount,
      "Emergency treatment",
      "QmMedicalDoc123",
      { from: hospitalAddress }
    );
    
    console.log("✅ SUCCESS! Claim submitted!");
    console.log("Transaction hash:", result.tx);
    console.log("Gas used:", result.receipt.gasUsed);

    // Get claim details
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
    const coverage = await claimsContract.getPatientCoverage(patientAddress);
    console.log("\n📊 Coverage After Claim:");
    console.log("Policy ID:", coverage.policyId.toString());
    console.log("Total coverage:", web3.utils.fromWei(coverage.totalCoverageLimit.toString(), 'ether'), "ETH");
    console.log("Remaining:", web3.utils.fromWei(coverage.remainingCoverage.toString(), 'ether'), "ETH");
    console.log("Total claimed:", web3.utils.fromWei(coverage.totalClaimedAmount.toString(), 'ether'), "ETH");
    console.log("Deductible used:", web3.utils.fromWei(coverage.deductibleUsed.toString(), 'ether'), "ETH");
    console.log("Deductible met:", coverage.deductibleMet);

    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL TESTS PASSED!");
    console.log("=".repeat(60) + "\n");

    callback();
  } catch (error) {
    console.error("\n❌ TEST FAILED!");
    console.error("Error:", error.message);
    callback(error);
  }
};
