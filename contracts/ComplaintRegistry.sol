// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ComplaintRegistry
 * @dev Minimal MVP contract to log, resolve, and escalate grievances.
 */
contract ComplaintRegistry {
    enum Status {
        Submitted,
        Resolved,
        Escalated
    }

    struct Complaint {
        address complainant;
        string description;
        uint256 timestamp;
        Status status;
    }

    uint256 public complaintCount;
    mapping(uint256 => Complaint) public complaints;

    // --- Ownership & Access Control ---
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    event ComplaintSubmitted(uint256 indexed id, address indexed complainant, string description);
    event ComplaintResolved(uint256 indexed id);
    event ComplaintEscalated(uint256 indexed id);

    /**
     * @notice Get a complaint by id
     */
    function getComplaint(uint256 id) external view returns (Complaint memory) {
        return complaints[id];
    }

    /**
     * @notice Get all complaints in the system
     * @return Array of all complaints (including empty slots for deleted complaints)
     */
    function getAllComplaints() external view returns (Complaint[] memory) {
        Complaint[] memory allComplaints = new Complaint[](complaintCount);
        for (uint256 i = 1; i <= complaintCount; i++) {
            allComplaints[i - 1] = complaints[i];
        }
        return allComplaints;
    }

    /**
     * @notice Submit a new grievance
     * @param description Free-text complaint description
     * @return id Complaint ID
     */
    function submitComplaint(string calldata description) external returns (uint256 id) {
        require(bytes(description).length > 0, "Empty description");
        id = ++complaintCount;
        complaints[id] = Complaint({
            complainant: msg.sender,
            description: description,
            timestamp: block.timestamp,
            status: Status.Submitted
        });
        emit ComplaintSubmitted(id, msg.sender, description);
    }

    /**
     * @notice Mark a complaint as resolved. In this MVP anyone can resolve; in production restrict to officials.
     */
    function resolveComplaint(uint256 id) external onlyOwner {
        Complaint storage c = complaints[id];
        require(c.status == Status.Submitted, "Already processed");
        c.status = Status.Resolved;
        emit ComplaintResolved(id);
    }

    /**
     * @notice Escalate a complaint (simulated DAO/admin action)
     */
    function escalateComplaint(uint256 id) external onlyOwner {
        Complaint storage c = complaints[id];
        require(c.status == Status.Submitted, "Cannot escalate");
        c.status = Status.Escalated;
        emit ComplaintEscalated(id);
    }
}
