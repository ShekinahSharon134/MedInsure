const HospitalRegistry = artifacts.require("HospitalRegistry");
const UserRegistry = artifacts.require("UserRegistry");
const PolicyContract = artifacts.require("PolicyContract");
const ClaimsContract = artifacts.require("ClaimsContract");

module.exports = async function (deployer) {
  await deployer.deploy(HospitalRegistry);
  await deployer.deploy(UserRegistry);
  await deployer.deploy(PolicyContract);
  
  const hospitalRegistry = await HospitalRegistry.deployed();
  const policyContract = await PolicyContract.deployed();
  
  await deployer.deploy(
    ClaimsContract,
    policyContract.address,
    hospitalRegistry.address
  );
};
