/**
 * Blockchain Rewards System
 * Implements CS currency rewards for distributed processing contributions
 */

export interface RewardConfig {
  baseRewardPerTask: number; // Base reward amount in wei
  successMultiplier: number; // Multiplier for successful completions
  reputationMultiplier: number; // Multiplier based on reputation score
  minReputationForRewards: number; // Minimum reputation to earn rewards
}

export interface UserReward {
  userId: string;
  totalEarned: number;
  pendingRewards: number;
  claimedRewards: number;
  reputationScore: number;
  tasksCompleted: number;
  lastRewardDate?: Date;
}

export interface TaskReward {
  taskId: string;
  completedBy: string;
  reward: number;
  status: 'pending' | 'claimed' | 'failed';
  createdAt: Date;
  claimedAt?: Date;
}

export interface SmartContractConfig {
  contractAddress: string;
  tokenAddress: string;
  chainId: number;
  rpcUrl: string;
}

/**
 * Blockchain Reward Manager
 * Handles reward calculation and tracking
 */
export class BlockchainRewardManager {
  private config: RewardConfig;
  private userRewards: Map<string, UserReward> = new Map();
  private taskRewards: Map<string, TaskReward> = new Map();

  constructor(config: RewardConfig) {
    this.config = config;
  }

  /**
   * Calculate reward for completed task
   */
  calculateReward(userId: string, taskComplexity: number = 1): number {
    const user = this.userRewards.get(userId);
    if (!user || user.reputationScore < this.config.minReputationForRewards) {
      return 0; // No reward if reputation too low
    }

    const baseReward = this.config.baseRewardPerTask * taskComplexity;
    const successBonus = baseReward * this.config.successMultiplier;
    const reputationBonus =
      (baseReward * user.reputationScore * this.config.reputationMultiplier) /
      100;

    return Math.floor(baseReward + successBonus + reputationBonus);
  }

  /**
   * Track completed task and award rewards
   */
  completeTask(taskId: string, userId: string, success: boolean): number {
    if (!success) {
      this.taskRewards.set(taskId, {
        taskId,
        completedBy: userId,
        reward: 0,
        status: 'failed',
        createdAt: new Date(),
      });
      return 0;
    }

    const reward = this.calculateReward(userId);

    // Update user rewards
    const user = this.userRewards.get(userId);
    if (user) {
      user.pendingRewards += reward;
      user.tasksCompleted += 1;
      user.lastRewardDate = new Date();
    }

    // Track task reward
    this.taskRewards.set(taskId, {
      taskId,
      completedBy: userId,
      reward,
      status: 'pending',
      createdAt: new Date(),
    });

    return reward;
  }

  /**
   * Claim pending rewards
   */
  claimRewards(userId: string): number {
    const user = this.userRewards.get(userId);
    if (!user || user.pendingRewards === 0) {
      return 0;
    }

    const claimed = user.pendingRewards;
    user.claimedRewards += claimed;
    user.pendingRewards = 0;
    user.totalEarned += claimed;

    // Update task status
    for (const [, task] of this.taskRewards) {
      if (
        task.completedBy === userId &&
        task.status === 'pending' &&
        task.reward > 0
      ) {
        task.status = 'claimed';
        task.claimedAt = new Date();
      }
    }

    return claimed;
  }

  /**
   * Update user reputation score
   */
  updateReputation(userId: string, delta: number): number {
    let user = this.userRewards.get(userId);
    if (!user) {
      user = {
        userId,
        totalEarned: 0,
        pendingRewards: 0,
        claimedRewards: 0,
        reputationScore: 0,
        tasksCompleted: 0,
      };
      this.userRewards.set(userId, user);
    }

    // Cap reputation between 0 and 100
    user.reputationScore = Math.max(
      0,
      Math.min(100, user.reputationScore + delta)
    );

    return user.reputationScore;
  }

  /**
   * Register new user for rewards
   */
  registerUser(userId: string, initialReputation: number = 50): void {
    this.userRewards.set(userId, {
      userId,
      totalEarned: 0,
      pendingRewards: 0,
      claimedRewards: 0,
      reputationScore: Math.max(0, Math.min(100, initialReputation)),
      tasksCompleted: 0,
    });
  }

  /**
   * Get user reward stats
   */
  getUserRewards(userId: string): UserReward | null {
    return this.userRewards.get(userId) || null;
  }

  /**
   * Get task reward info
   */
  getTaskReward(taskId: string): TaskReward | null {
    return this.taskRewards.get(taskId) || null;
  }

  /**
   * Get leaderboard (top earners)
   */
  getLeaderboard(limit: number = 10): UserReward[] {
    return Array.from(this.userRewards.values())
      .sort((a, b) => b.totalEarned - a.totalEarned)
      .slice(0, limit);
  }

  /**
   * Get reputation leaderboard
   */
  getReputationLeaderboard(limit: number = 10): UserReward[] {
    return Array.from(this.userRewards.values())
      .sort((a, b) => b.reputationScore - a.reputationScore)
      .slice(0, limit);
  }

  /**
   * Transfer rewards to blockchain (mock implementation)
   */
  async transferRewardToBlockchain(
    userId: string,
    _contractConfig: SmartContractConfig
  ): Promise<string> {
    const user = this.userRewards.get(userId);
    if (!user || user.pendingRewards === 0) {
      throw new Error('No pending rewards to transfer');
    }

    // In production, this would call actual smart contract
    // For now, generate mock transaction hash
    const txHash = `0x${crypto.getRandomValues(new Uint8Array(32)).toString()}`;

    // Mark rewards as claimed
    this.claimRewards(userId);

    return txHash;
  }

  /**
   * Penalty for failed tasks
   */
  penalizeUser(userId: string, amount: number = 5): number {
    return this.updateReputation(userId, -amount);
  }

  /**
   * Bonus for successful streak
   */
  bonusForStreak(userId: string, streakLength: number): number {
    const bonus = Math.min(30, streakLength); // Max 30 points
    return this.updateReputation(userId, bonus);
  }
}

/**
 * Smart Contract Interface (Solidity-like ABI)
 */
export const REWARD_CONTRACT_ABI = `
pragma solidity ^0.8.0;

contract UltraAIRewards {
    mapping(address => uint256) public userBalances;
    mapping(address => uint256) public userReputation;
    mapping(bytes32 => bool) public taskClaimed;

    event RewardClaimed(address indexed user, uint256 amount);
    event ReputationUpdated(address indexed user, uint256 newReputation);
    event TaskCompleted(address indexed user, bytes32 taskId, uint256 reward);

    function claimReward(uint256 amount) external {
        require(userBalances[msg.sender] >= amount, "Insufficient balance");
        userBalances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit RewardClaimed(msg.sender, amount);
    }

    function completeTask(bytes32 taskId, uint256 reward) external {
        require(!taskClaimed[taskId], "Task already claimed");
        taskClaimed[taskId] = true;
        userBalances[msg.sender] += reward;
        emit TaskCompleted(msg.sender, taskId, reward);
    }

    function updateReputation(uint256 newReputation) external {
        require(newReputation <= 100, "Reputation max is 100");
        userReputation[msg.sender] = newReputation;
        emit ReputationUpdated(msg.sender, newReputation);
    }

    function getBalance(address user) external view returns (uint256) {
        return userBalances[user];
    }

    function getReputation(address user) external view returns (uint256) {
        return userReputation[user];
    }
}
`;

/**
 * Reward Distribution Engine
 */
export class RewardDistributionEngine {
  private rewardManager: BlockchainRewardManager;
  private distributionSchedule: Map<
    string,
    { interval: number; lastRun: Date }
  > = new Map();

  constructor(rewardManager: BlockchainRewardManager) {
    this.rewardManager = rewardManager;
  }

  /**
   * Distribute rewards to multiple users
   */
  distributeRewards(
    distributions: Array<{
      userId: string;
      taskId: string;
      success: boolean;
    }>
  ): { totalDistributed: number; distributionDetails: any[] } {
    let totalDistributed = 0;
    const details: any[] = [];

    for (const dist of distributions) {
      const reward = this.rewardManager.completeTask(
        dist.taskId,
        dist.userId,
        dist.success
      );

      if (!dist.success) {
        this.rewardManager.penalizeUser(dist.userId, 5);
      }

      totalDistributed += reward;
      details.push({
        userId: dist.userId,
        taskId: dist.taskId,
        reward,
        success: dist.success,
      });
    }

    return { totalDistributed, distributionDetails: details };
  }

  /**
   * Schedule periodic reward distribution
   */
  scheduleDistribution(
    name: string,
    intervalMs: number,
    callback: () => void
  ): void {
    this.distributionSchedule.set(name, {
      interval: intervalMs,
      lastRun: new Date(),
    });

    setInterval(callback, intervalMs);
  }

  /**
   * Get distribution schedule info
   */
  getScheduleInfo(name: string): { interval: number; lastRun: Date } | null {
    return this.distributionSchedule.get(name) || null;
  }
}
