import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("VoteChain", function () {
  let VoteChain;
  let voteChain;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    VoteChain = await hre.ethers.getContractFactory("VoteChain");
    [owner, addr1, addr2, ...addrs] = await hre.ethers.getSigners();
    voteChain = await VoteChain.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right roles for the deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await voteChain.DEFAULT_ADMIN_ROLE();
      const ELECTION_MANAGER_ROLE = await voteChain.ELECTION_MANAGER_ROLE();

      expect(await voteChain.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await voteChain.hasRole(ELECTION_MANAGER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Elections", function () {
    it("Should create an election successfully", async function () {
      const startTime = (await time.latest()) + 60;
      const endTime = startTime + 3600;

      await expect(voteChain.createElection("Test Election", "Description", startTime, endTime))
        .to.emit(voteChain, "ElectionCreated")
        .withArgs(1, "Test Election", startTime, endTime);
        
      const election = await voteChain.getElectionDetails(1);
      expect(election.title).to.equal("Test Election");
      expect(election.status).to.equal(0); // NotStarted
    });

    it("Should fail if start time is in the past", async function () {
      const startTime = (await time.latest()) - 60;
      const endTime = startTime + 3600;

      await expect(voteChain.createElection("Test Election", "Description", startTime, endTime))
        .to.be.revertedWithCustomError(voteChain, "VoteChain__InvalidTime");
    });
  });

  describe("Candidates and Voters", function () {
    beforeEach(async function () {
      const startTime = (await time.latest()) + 60;
      const endTime = startTime + 3600;
      await voteChain.createElection("Test Election", "Desc", startTime, endTime);
    });

    it("Should add a candidate", async function () {
      await expect(voteChain.addCandidate(1, "Alice", "Party A", "url1"))
        .to.emit(voteChain, "CandidateAdded")
        .withArgs(1, 1, "Alice");
        
      const candidates = await voteChain.getAllCandidates(1);
      expect(candidates.length).to.equal(1);
      expect(candidates[0].name).to.equal("Alice");
    });

    it("Should register a voter", async function () {
      await expect(voteChain.registerVoter(1, addr1.address))
        .to.emit(voteChain, "VoterRegistered")
        .withArgs(1, addr1.address);
        
      expect(await voteChain.isRegisteredVoter(1, addr1.address)).to.be.true;
    });

    it("Should fail unauthorized actions", async function () {
      await expect(voteChain.connect(addr1).addCandidate(1, "Bob", "Party B", "url2"))
        .to.be.revertedWithCustomError(voteChain, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Voting Process", function () {
    let startTime, endTime;

    beforeEach(async function () {
      startTime = (await time.latest()) + 60;
      endTime = startTime + 3600;
      await voteChain.createElection("Test Election", "Desc", startTime, endTime);
      await voteChain.addCandidate(1, "Alice", "Party A", "url1");
      await voteChain.addCandidate(1, "Bob", "Party B", "url2");
      await voteChain.registerVoter(1, addr1.address);
      await voteChain.registerVoter(1, addr2.address);
    });

    it("Should vote successfully", async function () {
      await voteChain.startElection(1);
      await time.increaseTo(startTime + 10); // Ensure time has passed if we added time checks

      await expect(voteChain.connect(addr1).vote(1, 1))
        .to.emit(voteChain, "VoteCast")
        .withArgs(1, addr1.address, 1);

      expect(await voteChain.getCandidateVotes(1, 1)).to.equal(1);
      expect(await voteChain.hasVoted(1, addr1.address)).to.be.true;
    });

    it("Should fail double voting", async function () {
      await voteChain.startElection(1);
      await voteChain.connect(addr1).vote(1, 1);

      await expect(voteChain.connect(addr1).vote(1, 2))
        .to.be.revertedWithCustomError(voteChain, "VoteChain__AlreadyVoted");
    });

    it("Should prevent voting before active", async function () {
      await expect(voteChain.connect(addr1).vote(1, 1))
        .to.be.revertedWithCustomError(voteChain, "VoteChain__ElectionNotActive");
    });

    it("Should prevent voting after election ended", async function () {
      await voteChain.startElection(1);
      await voteChain.endElection(1);

      await expect(voteChain.connect(addr1).vote(1, 1))
        .to.be.revertedWithCustomError(voteChain, "VoteChain__ElectionNotActive");
    });

    it("Should correctly calculate the winner", async function () {
      await voteChain.startElection(1);
      await voteChain.connect(addr1).vote(1, 2); // Bob gets 1 vote
      await voteChain.connect(addr2).vote(1, 2); // Bob gets 2 votes

      const winner = await voteChain.getWinner(1);
      expect(winner.name).to.equal("Bob");
      expect(winner.voteCount).to.equal(2);
    });
  });

  describe("Emergency Pause", function () {
    it("Should pause and unpause the contract", async function () {
      const startTime = (await time.latest()) + 60;
      const endTime = startTime + 3600;
      await voteChain.createElection("Test", "Desc", startTime, endTime);
      await voteChain.addCandidate(1, "Alice", "P", "url");
      await voteChain.registerVoter(1, addr1.address);
      await voteChain.startElection(1);

      await voteChain.pause();
      
      await expect(voteChain.connect(addr1).vote(1, 1))
        .to.be.revertedWithCustomError(voteChain, "EnforcedPause");

      await voteChain.unpause();
      
      await voteChain.connect(addr1).vote(1, 1); // Should succeed now
      expect(await voteChain.hasVoted(1, addr1.address)).to.be.true;
    });
  });
});
