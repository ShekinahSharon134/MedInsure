// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPolicyContract {
    struct Subscription {
        address patientAddress;
        uint256 policyId;
        string policyName;
        uint256 premiumAmount;
        uint256 totalPaid;
        uint256 startDate;
        uint256 endDate;
        uint256 nextDueDate;
        uint256 monthsPaid;
        string subscriptionStatus;
        string paymentStatus;
        uint256 timestamp;
    }
    
    struct Policy {
        uint256 policyId;
        string policyName;
        uint256 coverageLimit;
        uint256 premiumAmount;
        uint256 validityPeriod;
        string ipfsCID;
        string covered;
        string excluded;
        string status;
        uint256 timestamp;
        uint256 deductible;
        uint256 copayPercentage;
    }
    
    function getSubscription(address patient) external view returns (Subscription memory);
    function getPolicy(uint256 policyId) external view returns (Policy memory);
}

interface IHospitalRegistry {
    function checkHospital(address _walletAddress) external view returns (bool);
}

contract ClaimsContract {

    address public insurer;
    address public policyContractAddress;
    address public hospitalRegistryAddress;

    // ================================
    // STRUCTS
    // ================================

    struct Claim {
        uint256 claimId;
        address patientAddress;
        address hospitalAddress;
        uint256 policyId;
        uint256 claimAmount;           // Total bill amount
        uint256 deductibleAmount;      // Patient pays this first
        uint256 copayAmount;           // Patient pays this % after deductible
        uint256 insurerPaysAmount;     // Insurer pays this to hospital
        uint256 patientPaysAmount;     // Total patient responsibility
        string treatment;
        string ipfsCID;                // Medical documents
        string status;                 // "Pending" | "Approved" | "Rejected"
        uint256 submittedOn;
        uint256 processedOn;
        string rejectionReason;
    }

    struct PatientCoverage {
        uint256 policyId;
        uint256 totalCoverageLimit;    // Original coverage limit
        uint256 remainingCoverage;     // Coverage left after claims
        uint256 totalClaimedAmount;    // Total insurer has paid
        uint256 deductibleUsed;        // How much deductible used
        bool deductibleMet;            // Has patient met deductible?
    }

    // ================================
    // STORAGE
    // ================================

    uint256 public claimCount;

    mapping(uint256 => Claim) public claims;
    mapping(address => PatientCoverage) public patientCoverages;
    mapping(address => uint256[]) public patientClaims;
    mapping(address => uint256[]) public hospitalClaims;

    uint256[] public allClaimIds;

    // ================================
    // EVENTS
    // ================================

    event ClaimSubmitted(
        uint256 claimId,
        address patient,
        address hospital,
        uint256 claimAmount,
        uint256 timestamp
    );

    event ClaimApproved(
        uint256 claimId,
        address patient,
        uint256 insurerPays,
        uint256 patientPays,
        uint256 timestamp
    );

    event ClaimRejected(
        uint256 claimId,
        address patient,
        string reason,
        uint256 timestamp
    );

    // ================================
    // MODIFIERS
    // ================================

    modifier onlyInsurer() {
        require(msg.sender == insurer, "Only insurer allowed");
        _;
    }

    modifier onlyRegisteredHospital() {
        IHospitalRegistry hospitalRegistry = IHospitalRegistry(hospitalRegistryAddress);
        require(
            hospitalRegistry.checkHospital(msg.sender),
            "Hospital not registered"
        );
        _;
    }

    // ================================
    // CONSTRUCTOR
    // ================================

    constructor(
        address _policyContractAddress,
        address _hospitalRegistryAddress
    ) {
        insurer = msg.sender;
        policyContractAddress = _policyContractAddress;
        hospitalRegistryAddress = _hospitalRegistryAddress;
    }

    // ================================
    // SUBMIT CLAIM (Hospital only)
    // ================================

    function submitClaim(
        address _patientAddress,
        uint256 _claimAmount,
        string memory _treatment,
        string memory _ipfsCID
    ) public onlyRegisteredHospital {
        
        // Step 1: Verify patient has active subscription
        IPolicyContract policyContract = IPolicyContract(policyContractAddress);
        
        IPolicyContract.Subscription memory subscription = policyContract.getSubscription(_patientAddress);

        require(
            keccak256(bytes(subscription.subscriptionStatus)) == keccak256(bytes("Active")),
            "Patient subscription not active"
        );

        require(
            keccak256(bytes(subscription.paymentStatus)) != keccak256(bytes("Overdue")),
            "Patient payment overdue"
        );

        // Step 2: Get policy details
        IPolicyContract.Policy memory policy = policyContract.getPolicy(subscription.policyId);

        require(
            keccak256(bytes(policy.status)) == keccak256(bytes("Active")),
            "Policy not active"
        );
        
        require(
            policy.coverageLimit > 0,
            "Policy coverage limit is 0"
        );

        // Step 3: Initialize or get patient coverage
        PatientCoverage storage coverage = patientCoverages[_patientAddress];
        
        bool isFirstClaim = (coverage.policyId == 0);
        
        if (isFirstClaim) {
            // First claim - initialize coverage
            coverage.policyId = subscription.policyId;
            coverage.totalCoverageLimit = policy.coverageLimit;
            coverage.remainingCoverage = policy.coverageLimit;
            coverage.totalClaimedAmount = 0;
            coverage.deductibleUsed = 0;
            coverage.deductibleMet = false;
        } else {
            // Not first claim - verify policy hasn't changed
            require(
                coverage.policyId == subscription.policyId,
                "Policy ID mismatch - patient changed policies"
            );
            
            // Check remaining coverage only for subsequent claims
            require(
                coverage.remainingCoverage > 0,
                "No coverage remaining - limit exhausted"
            );
        }
        
        require(
            _claimAmount > 0,
            "Claim amount must be greater than 0"
        );

        // Step 5: Calculate payout
        (
            uint256 deductibleAmount,
            uint256 copayAmount,
            uint256 insurerPays,
            uint256 patientPays
        ) = calculatePayout(
            _claimAmount,
            policy.deductible,
            policy.copayPercentage,
            coverage.deductibleUsed,
            coverage.remainingCoverage
        );

        // Step 6: Create claim
        claimCount++;

        claims[claimCount] = Claim({
            claimId: claimCount,
            patientAddress: _patientAddress,
            hospitalAddress: msg.sender,
            policyId: subscription.policyId,
            claimAmount: _claimAmount,
            deductibleAmount: deductibleAmount,
            copayAmount: copayAmount,
            insurerPaysAmount: insurerPays,
            patientPaysAmount: patientPays,
            treatment: _treatment,
            ipfsCID: _ipfsCID,
            status: "Pending",
            submittedOn: block.timestamp,
            processedOn: 0,
            rejectionReason: ""
        });

        allClaimIds.push(claimCount);
        patientClaims[_patientAddress].push(claimCount);
        hospitalClaims[msg.sender].push(claimCount);

        emit ClaimSubmitted(
            claimCount,
            _patientAddress,
            msg.sender,
            _claimAmount,
            block.timestamp
        );
    }

    // ================================
    // CALCULATE PAYOUT
    // ================================

    function calculatePayout(
        uint256 claimAmount,
        uint256 policyDeductible,
        uint256 copayPercentage,
        uint256 deductibleAlreadyUsed,
        uint256 remainingCoverage
    ) public pure returns (
        uint256 deductibleAmount,
        uint256 copayAmount,
        uint256 insurerPays,
        uint256 patientPays
    ) {
        // Step 1: Calculate remaining deductible
        uint256 deductibleRemaining = 0;
        if (deductibleAlreadyUsed < policyDeductible) {
            deductibleRemaining = policyDeductible - deductibleAlreadyUsed;
        }

        // Step 2: Apply deductible
        if (claimAmount <= deductibleRemaining) {
            // Entire claim covered by deductible
            deductibleAmount = claimAmount;
            copayAmount = 0;
            insurerPays = 0;
            patientPays = claimAmount;
        } else {
            // Deductible partially or fully met
            deductibleAmount = deductibleRemaining;
            uint256 amountAfterDeductible = claimAmount - deductibleAmount;

            // Step 3: Calculate copay
            copayAmount = (amountAfterDeductible * copayPercentage) / 100;
            uint256 insurerResponsibility = amountAfterDeductible - copayAmount;

            // Step 4: Check remaining coverage
            if (insurerResponsibility > remainingCoverage) {
                insurerPays = remainingCoverage;
                // Patient pays: deductible + copay + excess
                patientPays = claimAmount - insurerPays;
            } else {
                insurerPays = insurerResponsibility;
                patientPays = deductibleAmount + copayAmount;
            }
        }

        return (deductibleAmount, copayAmount, insurerPays, patientPays);
    }

    // ================================
    // APPROVE CLAIM (Insurer only)
    // ================================

    function approveClaim(uint256 _claimId) public payable onlyInsurer {
        require(_claimId > 0 && _claimId <= claimCount, "Invalid claim ID");
        
        Claim storage claim = claims[_claimId];
        
        require(
            keccak256(bytes(claim.status)) == keccak256(bytes("Pending")),
            "Claim already processed"
        );

        require(
            msg.value == claim.insurerPaysAmount,
            "Incorrect ETH amount sent"
        );

        // Transfer ETH to hospital
        payable(claim.hospitalAddress).transfer(msg.value);

        // Update claim status
        claim.status = "Approved";
        claim.processedOn = block.timestamp;

        // Update patient coverage
        PatientCoverage storage coverage = patientCoverages[claim.patientAddress];
        coverage.remainingCoverage -= claim.insurerPaysAmount;
        coverage.totalClaimedAmount += claim.insurerPaysAmount;
        coverage.deductibleUsed += claim.deductibleAmount;
        
        if (coverage.deductibleUsed >= getDeductibleForPolicy(claim.policyId)) {
            coverage.deductibleMet = true;
        }

        emit ClaimApproved(
            _claimId,
            claim.patientAddress,
            claim.insurerPaysAmount,
            claim.patientPaysAmount,
            block.timestamp
        );
    }

    // ================================
    // REJECT CLAIM (Insurer only)
    // ================================

    function rejectClaim(
        uint256 _claimId,
        string memory _reason
    ) public onlyInsurer {
        require(_claimId > 0 && _claimId <= claimCount, "Invalid claim ID");
        
        Claim storage claim = claims[_claimId];
        
        require(
            keccak256(bytes(claim.status)) == keccak256(bytes("Pending")),
            "Claim already processed"
        );

        claim.status = "Rejected";
        claim.processedOn = block.timestamp;
        claim.rejectionReason = _reason;

        emit ClaimRejected(
            _claimId,
            claim.patientAddress,
            _reason,
            block.timestamp
        );
    }

    // ================================
    // VIEW FUNCTIONS
    // ================================

    function getClaim(uint256 _claimId) public view returns (Claim memory) {
        return claims[_claimId];
    }

    function getPatientClaims(address _patient) public view returns (uint256[] memory) {
        return patientClaims[_patient];
    }

    function getHospitalClaims(address _hospital) public view returns (uint256[] memory) {
        return hospitalClaims[_hospital];
    }

    function getAllClaims() public view returns (uint256[] memory) {
        return allClaimIds;
    }

    function getPatientCoverage(address _patient) public view returns (PatientCoverage memory) {
        return patientCoverages[_patient];
    }

    function getDeductibleForPolicy(uint256 _policyId) public view returns (uint256) {
        IPolicyContract policyContract = IPolicyContract(policyContractAddress);
        IPolicyContract.Policy memory policy = policyContract.getPolicy(_policyId);
        return policy.deductible;
    }

    // ================================
    // ADMIN FUNCTIONS
    // ================================

    function updatePolicyContract(address _newAddress) public onlyInsurer {
        policyContractAddress = _newAddress;
    }

    function updateHospitalRegistry(address _newAddress) public onlyInsurer {
        hospitalRegistryAddress = _newAddress;
    }
}
