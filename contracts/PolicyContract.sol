// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PolicyContract {

    address public insurer;

    // ================================
    // STRUCTS
    // ================================

    struct PolicyInput {
        string  policyName;
        uint256 coverageLimit;
        uint256 premiumAmount;   // Monthly premium in Wei
        uint256 validityPeriod;  // In years
        string  ipfsCID;
        string  covered;
        string  excluded;
        uint256 deductible;      // Fixed amount patient pays first
        uint256 copayPercentage; // % patient pays after deductible (0-100)
    }

    struct Policy {
        uint256 policyId;
        string  policyName;
        uint256 coverageLimit;
        uint256 premiumAmount;   // Monthly premium in Wei
        uint256 validityPeriod;  // In years
        string  ipfsCID;
        string  covered;
        string  excluded;
        string  status;          // "Active" | "Inactive"
        uint256 timestamp;
        uint256 deductible;      // Fixed amount patient pays first
        uint256 copayPercentage; // % patient pays after deductible (0-100)
    }

    struct Subscription {
        address patientAddress;
        uint256 policyId;
        string  policyName;
        uint256 premiumAmount;       // Monthly premium
        uint256 totalPaid;           // Total ETH paid so far
        uint256 startDate;           // Subscription start
        uint256 endDate;             // Policy end (years)
        uint256 nextDueDate;         // Next monthly due date
        uint256 monthsPaid;          // How many months paid
        string  subscriptionStatus;  // "Active"|"Suspended"|"Expired"
        string  paymentStatus;       // "Paid"|"Due"|"Overdue"
        uint256 timestamp;
    }

    struct PaymentRecord {
        uint256 amount;
        uint256 paidOn;
        uint256 monthNumber;
        string  status;
    }

    // ================================
    // STORAGE
    // ================================

    uint256 public policyCount;
    uint256 public subscriptionCount;

    mapping(uint256 => Policy)          public policies;
    mapping(address => Subscription)    public subscriptions;
    mapping(address => PaymentRecord[]) public paymentHistory;
    mapping(address => bool)            public hasSubscription;

    uint256[] public allPolicyIds;

    // ================================
    // EVENTS
    // ================================

    event PolicyCreated(uint256 policyId, string policyName);
    event PolicySubscribed(address patient, uint256 policyId, string policyName);
    event MonthlyPremiumPaid(address patient, uint256 amount, uint256 monthNumber);
    event PolicySuspended(address patient, string reason);
    event PolicyReactivated(address patient);

    // ================================
    // MODIFIERS
    // ================================

    modifier onlyInsurer() {
        require(msg.sender == insurer, "Only insurer allowed!");
        _;
    }

    modifier hasActiveSub() {
        require(hasSubscription[msg.sender], "No subscription found!");
        _;
    }

    // ================================
    // CONSTRUCTOR
    // ================================

    constructor() {
        insurer = msg.sender;
    }

    // ================================
    // CREATE POLICY (Insurer only)
    // ================================

    function createPolicy(PolicyInput memory input) public onlyInsurer {
        require(input.copayPercentage <= 100, "Copay must be 0-100%");
        
        policyCount++;

        policies[policyCount] = Policy({
            policyId:       policyCount,
            policyName:     input.policyName,
            coverageLimit:  input.coverageLimit,
            premiumAmount:  input.premiumAmount,
            validityPeriod: input.validityPeriod,
            ipfsCID:        input.ipfsCID,
            covered:        input.covered,
            excluded:       input.excluded,
            status:         "Active",
            timestamp:      block.timestamp,
            deductible:     input.deductible,
            copayPercentage: input.copayPercentage
        });

        allPolicyIds.push(policyCount);
        emit PolicyCreated(policyCount, input.policyName);
    }

    // ================================
    // SUBSCRIBE POLICY — First Month
    // ================================

    function subscribePolicy(uint256 policyId) public payable {
        require(!hasSubscription[msg.sender], "Already subscribed!");
        require(policyId > 0 && policyId <= policyCount, "Invalid policy!");

        Policy memory p = policies[policyId];
        require(msg.value == p.premiumAmount, "Incorrect premium amount!");

        // Send first month to insurer
        payable(insurer).transfer(msg.value);

        uint256 start       = block.timestamp;
        uint256 end         = block.timestamp + (p.validityPeriod * 365 days);
        uint256 nextDueDate = block.timestamp + 30 days;

        subscriptions[msg.sender] = Subscription({
            patientAddress:     msg.sender,
            policyId:           policyId,
            policyName:         p.policyName,
            premiumAmount:      p.premiumAmount,
            totalPaid:          msg.value,
            startDate:          start,
            endDate:            end,
            nextDueDate:        nextDueDate,
            monthsPaid:         1,
            subscriptionStatus: "Active",
            paymentStatus:      "Paid",
            timestamp:          block.timestamp
        });

        hasSubscription[msg.sender] = true;
        subscriptionCount++;

        // Record payment
        paymentHistory[msg.sender].push(PaymentRecord({
            amount:      msg.value,
            paidOn:      block.timestamp,
            monthNumber: 1,
            status:      "Paid"
        }));

        emit PolicySubscribed(msg.sender, policyId, p.policyName);
        emit MonthlyPremiumPaid(msg.sender, msg.value, 1);
    }

    // ================================
    // PAY MONTHLY PREMIUM
    // ================================

    function payMonthlyPremium() public payable hasActiveSub {
        Subscription storage sub = subscriptions[msg.sender];

        require(
            keccak256(bytes(sub.subscriptionStatus)) != keccak256(bytes("Expired")),
            "Policy has expired!"
        );
        require(
            msg.value == sub.premiumAmount,
            "Incorrect premium amount!"
        );
        require(
            block.timestamp >= sub.nextDueDate - 3 days,
            "Payment not due yet!"
        );

        // Send to insurer
        payable(insurer).transfer(msg.value);

        // Update subscription
        sub.totalPaid          += msg.value;
        sub.monthsPaid         += 1;
        sub.nextDueDate        += 30 days;
        sub.paymentStatus       = "Paid";
        sub.subscriptionStatus  = "Active";

        // Check if fully expired
        if (block.timestamp >= sub.endDate) {
            sub.subscriptionStatus = "Expired";
            sub.paymentStatus      = "Expired";
        }

        // Record payment
        paymentHistory[msg.sender].push(PaymentRecord({
            amount:      msg.value,
            paidOn:      block.timestamp,
            monthNumber: sub.monthsPaid,
            status:      "Paid"
        }));

        emit MonthlyPremiumPaid(msg.sender, msg.value, sub.monthsPaid);
        emit PolicyReactivated(msg.sender);
    }

    // ================================
    // CHECK & UPDATE STATUS (anyone)
    // ================================

    function checkPaymentStatus(address patient) public {
        if (!hasSubscription[patient]) return;

        Subscription storage sub = subscriptions[patient];

        // Already expired
        if (keccak256(bytes(sub.subscriptionStatus)) == keccak256(bytes("Expired"))) return;

        // Policy period over
        if (block.timestamp >= sub.endDate) {
            sub.subscriptionStatus = "Expired";
            sub.paymentStatus      = "Expired";
            return;
        }

        // Overdue — more than 7 days past due
        if (block.timestamp > sub.nextDueDate + 7 days) {
            sub.subscriptionStatus = "Suspended";
            sub.paymentStatus      = "Overdue";
            emit PolicySuspended(patient, "Payment overdue!");
            return;
        }

        // Due — past due date within grace period
        if (block.timestamp >= sub.nextDueDate - 3 days) {
            sub.paymentStatus = "Due";
            return;
        }

        sub.paymentStatus = "Paid";
    }

    // ================================
    // VIEW FUNCTIONS
    // ================================

    function getAllPolicies() public view returns (uint256[] memory) {
        return allPolicyIds;
    }

    function getPolicy(uint256 policyId) public view returns (Policy memory) {
        return policies[policyId];
    }

    function getSubscription(address patient) public view returns (Subscription memory) {
        return subscriptions[patient];
    }

    function getPaymentHistory(address patient) public view returns (PaymentRecord[] memory) {
        return paymentHistory[patient];
    }

    function checkActivePolicy(address patient) public view returns (bool) {
        return hasSubscription[patient];
    }

    function isPaymentDue(address patient) public view returns (bool) {
        if (!hasSubscription[patient]) return false;
        Subscription memory sub = subscriptions[patient];
        return block.timestamp >= sub.nextDueDate - 3 days;
    }

    function getDaysUntilDue(address patient) public view returns (uint256) {
        if (!hasSubscription[patient]) return 0;
        Subscription memory sub = subscriptions[patient];
        if (block.timestamp >= sub.nextDueDate) return 0;

        return (sub.nextDueDate - block.timestamp) / 1 days;
    }

    // ================================
    // ELIGIBILITY CHECK (NEW)
    // ================================
    
    /**
     * @dev Check patient eligibility for treatment
     * @param patient Patient address to check
     * @return eligible Whether patient is eligible for coverage
     * @return policyName Name of the active policy
     * @return coverageLimit Total coverage limit
     * @return remainingCoverage Coverage remaining (not yet implemented in ClaimsContract)
     * @return deductible Deductible amount
     * @return deductibleMet Whether deductible has been met (not yet implemented)
     * @return copayPercentage Copay percentage
     * @return subscriptionStatus Current subscription status
     * @return paymentStatus Current payment status
     * @return message Human-readable eligibility message
     */
    function checkEligibility(address patient) 
        public 
        view 
        returns (
            bool eligible,
            string memory policyName,
            uint256 coverageLimit,
            uint256 remainingCoverage,
            uint256 deductible,
            bool deductibleMet,
            uint256 copayPercentage,
            string memory subscriptionStatus,
            string memory paymentStatus,
            string memory message
        ) 
    {
        // Check if patient has subscription
        if (!hasSubscription[patient]) {
            return (
                false,
                "",
                0,
                0,
                0,
                false,
                0,
                "No Subscription",
                "N/A",
                "Patient does not have an active insurance policy"
            );
        }

        Subscription memory sub = subscriptions[patient];
        Policy memory policy = policies[sub.policyId];

        // Check if subscription is active
        if (keccak256(bytes(sub.subscriptionStatus)) != keccak256(bytes("Active"))) {
            return (
                false,
                sub.policyName,
                policy.coverageLimit,
                0,
                policy.deductible,
                false,
                policy.copayPercentage,
                sub.subscriptionStatus,
                sub.paymentStatus,
                string(abi.encodePacked("Policy is ", sub.subscriptionStatus, ". Please contact insurer."))
            );
        }

        // Check if payment is overdue
        if (keccak256(bytes(sub.paymentStatus)) == keccak256(bytes("Overdue"))) {
            return (
                false,
                sub.policyName,
                policy.coverageLimit,
                policy.coverageLimit, // Full coverage available but not eligible due to payment
                policy.deductible,
                false,
                policy.copayPercentage,
                sub.subscriptionStatus,
                sub.paymentStatus,
                "Payment is overdue. Please pay premium to restore coverage."
            );
        }

        // Check if policy has expired
        if (block.timestamp > sub.endDate) {
            return (
                false,
                sub.policyName,
                policy.coverageLimit,
                0,
                policy.deductible,
                false,
                policy.copayPercentage,
                "Expired",
                sub.paymentStatus,
                "Policy has expired. Please renew to continue coverage."
            );
        }

        // Patient is eligible!
        return (
            true,
            sub.policyName,
            policy.coverageLimit,
            policy.coverageLimit, // TODO: Integrate with ClaimsContract to get actual remaining
            policy.deductible,
            false, // TODO: Integrate with ClaimsContract to check if deductible met
            policy.copayPercentage,
            sub.subscriptionStatus,
            sub.paymentStatus,
            "Patient is eligible for coverage. Treatment can proceed."
        );
    }

    /**
     * @dev Quick eligibility check - returns only boolean
     * @param patient Patient address to check
     * @return Whether patient is eligible for coverage
     */
    function isEligible(address patient) public view returns (bool) {
        if (!hasSubscription[patient]) return false;
        
        Subscription memory sub = subscriptions[patient];
        
        // Must be active and not overdue
        return (
            keccak256(bytes(sub.subscriptionStatus)) == keccak256(bytes("Active")) &&
            keccak256(bytes(sub.paymentStatus)) != keccak256(bytes("Overdue")) &&
            block.timestamp <= sub.endDate
        );
    }
}
