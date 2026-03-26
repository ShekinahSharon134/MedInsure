// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract UserRegistry {
    address public insurer;

    struct PreRegistered {
        bytes32 memberIdHash;
        bytes32 nameHash;
        bytes32 dobHash;
        bytes32 mobileHash;
        bool    exists;
        bool    activated;
    }

    struct Patient {
        uint    patientId;
        string  name;
        string  dob;
        string  gender;
        string  mobile;
        string  email;
        string  location;
        bool    otpVerified;
        bytes32 memberIdHash;
        string  photoHash;
        address walletAddress;
        string  status;
        uint    timestamp;
    }

    struct PatientInput {
        string  name;
        string  dob;
        string  gender;
        string  mobile;
        string  email;
        string  location;
        bool    otpVerified;
        bytes32 memberIdHash;
        string  photoHash;
    }

    uint public patientCount = 0;

    mapping(bytes32 => PreRegistered) public preRegistered;
    mapping(address => Patient)       public patients;
    mapping(address => bool)          public isRegistered;
    mapping(address => bool)          public isApproved;

    address[] public pendingPatients;
    address[] public allPatients;

    event PatientPreRegistered(bytes32 indexed memberIdHash, uint timestamp);
    event PatientRegistered(uint patientId, string name, address walletAddress, uint timestamp);
    event PatientApproved(address walletAddress, string name, uint timestamp);
    event PatientRejected(address walletAddress, string name, uint timestamp);

    modifier onlyInsurer() {
        require(msg.sender == insurer, "Only insurer can do this");
        _;
    }

    constructor() { insurer = msg.sender; }

    function preRegisterPatient(
        bytes32 _memberIdHash,
        bytes32 _nameHash,
        bytes32 _dobHash,
        bytes32 _mobileHash
    ) public onlyInsurer {
        require(!preRegistered[_memberIdHash].exists, "Already pre-registered");
        preRegistered[_memberIdHash] = PreRegistered(_memberIdHash, _nameHash, _dobHash, _mobileHash, true, false);
        emit PatientPreRegistered(_memberIdHash, block.timestamp);
    }

    function verifyMemberDetails(
        bytes32 _memberIdHash,
        bytes32 _nameHash,
        bytes32 _dobHash,
        bytes32 _mobileHash
    ) public view returns (bool) {
        PreRegistered memory pr = preRegistered[_memberIdHash];
        if (!pr.exists || pr.activated) return false;
        return (pr.nameHash == _nameHash && pr.dobHash == _dobHash && pr.mobileHash == _mobileHash);
    }

    function registerPatient(PatientInput memory input) public {
        require(!isRegistered[msg.sender], "Already registered");
        require(input.otpVerified, "OTP not verified");
        require(bytes(input.photoHash).length > 0, "Photo required");
        require(input.memberIdHash != bytes32(0), "Member ID required");
        PreRegistered storage pr = preRegistered[input.memberIdHash];
        require(pr.exists, "Member ID not pre-registered");
        require(!pr.activated, "Member ID already used");
        require(
            pr.nameHash   == keccak256(abi.encodePacked(input.name)) &&
            pr.dobHash    == keccak256(abi.encodePacked(input.dob))  &&
            pr.mobileHash == keccak256(abi.encodePacked(input.mobile)),
            "Details do not match insurer records"
        );
        patientCount++;
        patients[msg.sender] = Patient(patientCount, input.name, input.dob, input.gender,
            input.mobile, input.email, input.location, input.otpVerified,
            input.memberIdHash, input.photoHash, msg.sender, "Pending", block.timestamp);
        isRegistered[msg.sender] = true;
        pr.activated = true;
        pendingPatients.push(msg.sender);
        allPatients.push(msg.sender);
        emit PatientRegistered(patientCount, input.name, msg.sender, block.timestamp);
    }

    function approvePatient(address _w) public onlyInsurer {
        require(isRegistered[_w], "Not registered");
        require(!isApproved[_w], "Already approved");
        patients[_w].status = "Approved";
        isApproved[_w] = true;
        emit PatientApproved(_w, patients[_w].name, block.timestamp);
    }

    function rejectPatient(address _w) public onlyInsurer {
        require(isRegistered[_w], "Not registered");
        patients[_w].status = "Rejected";
        emit PatientRejected(_w, patients[_w].name, block.timestamp);
    }

    function getPatient(address _w) public view returns (Patient memory) {
        require(isRegistered[_w], "Not registered");
        return patients[_w];
    }

    function isMemberPreRegistered(bytes32 _h) public view returns (bool) {
        return preRegistered[_h].exists && !preRegistered[_h].activated;
    }

    function getPendingPatients() public view returns (address[] memory) { return pendingPatients; }
    function getAllPatients()     public view returns (address[] memory) { return allPatients; }
    function checkPatientApproved(address _w)   public view returns (bool) { return isApproved[_w]; }
    function checkPatientRegistered(address _w) public view returns (bool) { return isRegistered[_w]; }
    function getPatientName(address _w) public view returns (string memory) {
        require(isRegistered[_w], "Not registered");
        return patients[_w].name;
    }
}
