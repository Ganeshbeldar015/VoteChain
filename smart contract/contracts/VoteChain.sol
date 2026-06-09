// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

error VoteChain__InvalidTime();
error VoteChain__ElectionNotExists();
error VoteChain__ElectionNotActive();
error VoteChain__ElectionAlreadyActive();
error VoteChain__ElectionEnded();
error VoteChain__EmptyString();
error VoteChain__CandidateNotExists();
error VoteChain__VoterAlreadyRegistered();
error VoteChain__VoterNotRegistered();
error VoteChain__AlreadyVoted();

contract VoteChain is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ELECTION_MANAGER_ROLE = keccak256("ELECTION_MANAGER_ROLE");

    enum ElectionStatus { NotStarted, Active, Ended }

    struct Candidate {
        uint256 id;
        string name;
        string party;
        string imageUrl;
        uint256 voteCount;
        bool exists;
    }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidateId;
    }

    struct Election {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        ElectionStatus status;
        uint256 totalVotes;
        uint256[] candidateIds;
    }

    uint256 private _electionIds;
    uint256 private _candidateIds;

    // electionId => Election
    mapping(uint256 => Election) private _elections;
    
    // electionId => (candidateId => Candidate)
    mapping(uint256 => mapping(uint256 => Candidate)) private _electionCandidates;
    
    // electionId => (voterAddress => Voter)
    mapping(uint256 => mapping(address => Voter)) private _electionVoters;

    // Events
    event ElectionCreated(uint256 indexed electionId, string title, uint256 startTime, uint256 endTime);
    event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name);
    event VoterRegistered(uint256 indexed electionId, address indexed voter);
    event ElectionStarted(uint256 indexed electionId);
    event ElectionEnded(uint256 indexed electionId);
    event VoteCast(uint256 indexed electionId, address indexed voter, uint256 indexed candidateId);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ELECTION_MANAGER_ROLE, msg.sender);
    }

    /// @notice Pauses the contract in case of an emergency
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpauses the contract
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /// @notice Creates a new election
    function createElection(
        string calldata title,
        string calldata description,
        uint256 startTime,
        uint256 endTime
    ) external onlyRole(ELECTION_MANAGER_ROLE) returns (uint256) {
        if (bytes(title).length == 0) revert VoteChain__EmptyString();
        if (startTime <= block.timestamp || endTime <= startTime) revert VoteChain__InvalidTime();

        _electionIds++;
        uint256 newElectionId = _electionIds;

        Election storage newElection = _elections[newElectionId];
        newElection.id = newElectionId;
        newElection.title = title;
        newElection.description = description;
        newElection.startTime = startTime;
        newElection.endTime = endTime;
        newElection.status = ElectionStatus.NotStarted;

        emit ElectionCreated(newElectionId, title, startTime, endTime);
        return newElectionId;
    }

    /// @notice Adds a candidate to an election
    function addCandidate(
        uint256 electionId,
        string calldata name,
        string calldata party,
        string calldata imageUrl
    ) external onlyRole(ELECTION_MANAGER_ROLE) {
        if (_elections[electionId].id == 0) revert VoteChain__ElectionNotExists();
        if (bytes(name).length == 0) revert VoteChain__EmptyString();

        _candidateIds++;
        uint256 newCandidateId = _candidateIds;

        Candidate memory newCandidate = Candidate({
            id: newCandidateId,
            name: name,
            party: party,
            imageUrl: imageUrl,
            voteCount: 0,
            exists: true
        });

        _electionCandidates[electionId][newCandidateId] = newCandidate;
        _elections[electionId].candidateIds.push(newCandidateId);

        emit CandidateAdded(electionId, newCandidateId, name);
    }

    /// @notice Registers a voter for an election
    function registerVoter(uint256 electionId, address voter) external onlyRole(ELECTION_MANAGER_ROLE) {
        if (_elections[electionId].id == 0) revert VoteChain__ElectionNotExists();
        if (_electionVoters[electionId][voter].isRegistered) revert VoteChain__VoterAlreadyRegistered();

        _electionVoters[electionId][voter].isRegistered = true;
        
        emit VoterRegistered(electionId, voter);
    }

    /// @notice Starts an election manually
    function startElection(uint256 electionId) external onlyRole(ELECTION_MANAGER_ROLE) {
        Election storage election = _elections[electionId];
        if (election.id == 0) revert VoteChain__ElectionNotExists();
        if (election.status != ElectionStatus.NotStarted) revert VoteChain__ElectionAlreadyActive();

        election.status = ElectionStatus.Active;
        emit ElectionStarted(electionId);
    }

    /// @notice Ends an election manually
    function endElection(uint256 electionId) external onlyRole(ELECTION_MANAGER_ROLE) {
        Election storage election = _elections[electionId];
        if (election.id == 0) revert VoteChain__ElectionNotExists();
        if (election.status != ElectionStatus.Active) revert VoteChain__ElectionNotActive();

        election.status = ElectionStatus.Ended;
        emit ElectionEnded(electionId);
    }

    /// @notice Allows a registered voter to cast a vote
    function vote(uint256 electionId, uint256 candidateId) external nonReentrant whenNotPaused {
        Election storage election = _elections[electionId];
        if (election.id == 0) revert VoteChain__ElectionNotExists();
        if (election.status != ElectionStatus.Active) revert VoteChain__ElectionNotActive();
        if (block.timestamp > election.endTime) revert VoteChain__ElectionEnded();

        Voter storage voter = _electionVoters[electionId][msg.sender];
        if (!voter.isRegistered) revert VoteChain__VoterNotRegistered();
        if (voter.hasVoted) revert VoteChain__AlreadyVoted();

        Candidate storage candidate = _electionCandidates[electionId][candidateId];
        if (!candidate.exists) revert VoteChain__CandidateNotExists();

        voter.hasVoted = true;
        voter.votedCandidateId = candidateId;
        candidate.voteCount++;
        election.totalVotes++;

        emit VoteCast(electionId, msg.sender, candidateId);
    }

    // ==========================================
    // View Functions
    // ==========================================

    function getCandidateVotes(uint256 electionId, uint256 candidateId) external view returns (uint256) {
        return _electionCandidates[electionId][candidateId].voteCount;
    }

    function getAllCandidates(uint256 electionId) external view returns (Candidate[] memory) {
        uint256[] memory candidateIds = _elections[electionId].candidateIds;
        Candidate[] memory candidates = new Candidate[](candidateIds.length);
        for (uint256 i = 0; i < candidateIds.length; i++) {
            candidates[i] = _electionCandidates[electionId][candidateIds[i]];
        }
        return candidates;
    }

    function getWinner(uint256 electionId) external view returns (Candidate memory) {
        Election storage election = _elections[electionId];
        if (election.id == 0) revert VoteChain__ElectionNotExists();
        
        uint256[] memory candidateIds = election.candidateIds;
        if (candidateIds.length == 0) revert VoteChain__CandidateNotExists();

        Candidate memory winner = _electionCandidates[electionId][candidateIds[0]];
        for (uint256 i = 1; i < candidateIds.length; i++) {
            Candidate memory candidate = _electionCandidates[electionId][candidateIds[i]];
            if (candidate.voteCount > winner.voteCount) {
                winner = candidate;
            }
        }
        return winner;
    }

    function getElectionDetails(uint256 electionId) external view returns (Election memory) {
        return _elections[electionId];
    }

    function isRegisteredVoter(uint256 electionId, address voterAddress) external view returns (bool) {
        return _electionVoters[electionId][voterAddress].isRegistered;
    }

    function hasVoted(uint256 electionId, address voterAddress) external view returns (bool) {
        return _electionVoters[electionId][voterAddress].hasVoted;
    }

    function totalVotes(uint256 electionId) external view returns (uint256) {
        return _elections[electionId].totalVotes;
    }

    function totalCandidates(uint256 electionId) external view returns (uint256) {
        return _elections[electionId].candidateIds.length;
    }
}
