const FundReserveContract = artifacts.require("FundReserveContract");

module.exports = function (deployer) {
  deployer.deploy(FundReserveContract);
};
