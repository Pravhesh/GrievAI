// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ComplaintRegistry
 * @dev Decentralized grievance system with DAO voting for resolutions.
 */
contract ComplaintRegistry {
    // --- Types ---
    enum Vote { None, For, Against }
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

    // --- Access Control ---
    address public owner;
    mapping(address => bool) public officials;
    
    // DAO Voting
    struct Proposal {
        uint256 complaintId;
        bool isEscalation; // true=escalate, false=resolve
        uint256 voteStart;
        uint256 voteEnd;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        mapping(address => bool) hasVoted;
    }
    
    uint256 public votingDelay = 1; // blocks
    uint256 public votingPeriod = 100; // blocks (~20min on Ethereum)
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyOfficial() {
        require(officials[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }
    
    event OfficialAdded(address indexed official);
    event OfficialRemoved(address indexed official);
    event ProposalCreated(uint256 indexed proposalId, uint256 indexed complaintId, bool isEscalation);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);

    constructor() {
        owner = msg.sender;
        officials[msg.sender] = true; // Deployer is first official
    }
    
    function addOfficial(address _official) external onlyOwner {
        officials[_official] = true;
        emit OfficialAdded(_official);
    }
    
    function removeOfficial(address _official) external onlyOwner {
        officials[_official] = false;
        emit OfficialRemoved(_official);
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
     * @notice Create a proposal to resolve/escalate a complaint
     * @param complaintId ID of the complaint
     * @param isEscalation True to escalate, false to resolve
     */
    function proposeAction(uint256 complaintId, bool isEscalation) external onlyOfficial returns (uint256) {
        require(complaints[complaintId].status == Status.Submitted, "Invalid status");
        
        uint256 proposalId = ++proposalCount;
        Proposal storage newProposal = proposals[proposalId];
        newProposal.complaintId = complaintId;
        newProposal.isEscalation = isEscalation;
        newProposal.voteStart = block.number + votingDelay;
        newProposal.voteEnd = block.number + votingDelay + votingPeriod;
        
        emit ProposalCreated(proposalId, complaintId, isEscalation);
        return proposalId;
    }
    
    /**
     * @notice Vote on a proposal
     * @param proposalId ID of the proposal
     * @param support True for yes, false for no
     */
    function castVote(uint256 proposalId, bool support) external onlyOfficial {
        Proposal storage proposal = proposals[proposalId];
        require(block.number >= proposal.voteStart, "Voting not started");
        require(block.number <= proposal.voteEnd, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        proposal.hasVoted[msg.sender] = true;
        if (support) {
            proposal.forVotes += 1;
        } else {
            proposal.againstVotes += 1;
        }
        
        emit Voted(proposalId, msg.sender, support, 1);
    }
    
    /**
     * @notice Execute a proposal after voting
     * @param proposalId ID of the proposal to execute
     */
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.number > proposal.voteEnd, "Voting in progress");
        require(!proposal.executed, "Already executed");
        require(proposal.forVotes > proposal.againstVotes, "Proposal failed");
        
        Complaint storage c = complaints[proposal.complaintId];
        if (proposal.isEscalation) {
            c.status = Status.Escalated;
            emit ComplaintEscalated(proposal.complaintId);
        } else {
            c.status = Status.Resolved;
            emit ComplaintResolved(proposal.complaintId);
        }
        
        proposal.executed = true;
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @notice Direct resolve by officials (without DAO voting)
     */
    function resolveComplaint(uint256 id) external onlyOfficial {
        Complaint storage c = complaints[id];
        require(c.status == Status.Submitted, "Already processed");
        c.status = Status.Resolved;
        emit ComplaintResolved(id);
    }
    
    /**
     * @notice Direct escalate by officials (without DAO voting)
     */
    function escalateComplaint(uint256 id) external onlyOfficial {
        Complaint storage c = complaints[id];
        require(c.status == Status.Submitted, "Cannot escalate");
        c.status = Status.Escalated;
        emit ComplaintEscalated(id);
    }
}
