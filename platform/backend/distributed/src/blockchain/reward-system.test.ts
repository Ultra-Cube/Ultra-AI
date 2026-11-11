import {
  BlockchainRewardManager,
  RewardDistributionEngine,
} from './reward-system';

describe('Blockchain Rewards System', () => {
  const config = {
    baseRewardPerTask: 100,
    successMultiplier: 1.5,
    reputationMultiplier: 0.5,
    minReputationForRewards: 30,
  };

  describe('BlockchainRewardManager', () => {
    let manager: BlockchainRewardManager;

    beforeEach(() => {
      manager = new BlockchainRewardManager(config);
    });

    it('should register new user with initial reputation', () => {
      manager.registerUser('user-1', 50);
      const rewards = manager.getUserRewards('user-1');

      expect(rewards).toBeDefined();
      expect(rewards?.reputationScore).toBe(50);
      expect(rewards?.totalEarned).toBe(0);
      expect(rewards?.tasksCompleted).toBe(0);
    });

    it('should calculate reward based on reputation', () => {
      manager.registerUser('user-1', 80);

      // Base: 100 * 1 = 100
      // Success bonus: 100 * 1.5 = 150
      // Reputation bonus: 100 * 80 * 0.5 / 100 = 40
      // Total: 100 + 150 + 40 = 290
      const reward = manager.calculateReward('user-1', 1);

      expect(reward).toBeGreaterThan(0);
      expect(reward).toBe(290);
    });

    it('should not reward user with low reputation', () => {
      manager.registerUser('user-2', 20); // Below min 30

      const reward = manager.calculateReward('user-2', 1);
      expect(reward).toBe(0);
    });

    it('should track completed task and update pending rewards', () => {
      manager.registerUser('user-3', 60);

      const reward = manager.completeTask('task-1', 'user-3', true);

      expect(reward).toBeGreaterThan(0);

      const rewards = manager.getUserRewards('user-3');
      expect(rewards?.pendingRewards).toBe(reward);
      expect(rewards?.tasksCompleted).toBe(1);
    });

    it('should not reward failed tasks', () => {
      manager.registerUser('user-4', 70);

      const reward = manager.completeTask('task-2', 'user-4', false);

      expect(reward).toBe(0);

      const rewards = manager.getUserRewards('user-4');
      expect(rewards?.pendingRewards).toBe(0);
    });

    it('should claim pending rewards', () => {
      manager.registerUser('user-5', 75);
      manager.completeTask('task-3', 'user-5', true);

      const rewards1 = manager.getUserRewards('user-5');
      const pending = rewards1?.pendingRewards || 0;

      const claimed = manager.claimRewards('user-5');

      expect(claimed).toBe(pending);

      const rewards2 = manager.getUserRewards('user-5');
      expect(rewards2?.pendingRewards).toBe(0);
      expect(rewards2?.claimedRewards).toBe(pending);
      expect(rewards2?.totalEarned).toBe(pending);
    });

    it('should update reputation score', () => {
      manager.registerUser('user-6', 50);

      const updated = manager.updateReputation('user-6', 20);

      expect(updated).toBe(70);

      const rewards = manager.getUserRewards('user-6');
      expect(rewards?.reputationScore).toBe(70);
    });

    it('should cap reputation at 100', () => {
      manager.registerUser('user-7', 90);

      const updated = manager.updateReputation('user-7', 50);

      expect(updated).toBe(100);
    });

    it('should not allow negative reputation', () => {
      manager.registerUser('user-8', 20);

      const updated = manager.updateReputation('user-8', -50);

      expect(updated).toBe(0);
    });

    it('should return null for unregistered user', () => {
      const rewards = manager.getUserRewards('nonexistent');
      expect(rewards).toBeNull();
    });

    it('should track task rewards', () => {
      manager.registerUser('user-9', 60);
      manager.completeTask('task-4', 'user-9', true);

      const taskReward = manager.getTaskReward('task-4');

      expect(taskReward).toBeDefined();
      expect(taskReward?.completedBy).toBe('user-9');
      expect(taskReward?.status).toBe('pending');
    });

    it('should update task status when claiming rewards', () => {
      manager.registerUser('user-10', 65);
      manager.completeTask('task-5', 'user-10', true);

      manager.claimRewards('user-10');

      const taskReward = manager.getTaskReward('task-5');
      expect(taskReward?.status).toBe('claimed');
      expect(taskReward?.claimedAt).toBeDefined();
    });

    it('should generate leaderboard', () => {
      for (let i = 1; i <= 5; i++) {
        manager.registerUser(`user-lb-${i}`, 50 + i * 5);
        manager.completeTask(`task-lb-${i}`, `user-lb-${i}`, true);
      }

      for (let i = 1; i <= 5; i++) {
        manager.claimRewards(`user-lb-${i}`);
      }

      const leaderboard = manager.getLeaderboard(3);

      expect(leaderboard.length).toBe(3);
      expect(leaderboard[0].totalEarned).toBeGreaterThanOrEqual(
        leaderboard[1].totalEarned
      );
    });

    it('should generate reputation leaderboard', () => {
      manager.registerUser('user-rep-1', 40);
      manager.registerUser('user-rep-2', 80);
      manager.registerUser('user-rep-3', 60);

      const leaderboard = manager.getReputationLeaderboard();

      expect(leaderboard[0].reputationScore).toBe(80);
      expect(leaderboard[1].reputationScore).toBe(60);
      expect(leaderboard[2].reputationScore).toBe(40);
    });

    it('should penalize user for failed tasks', () => {
      manager.registerUser('user-penalize', 75);

      const updated = manager.penalizeUser('user-penalize', 15);

      expect(updated).toBe(60);
    });

    it('should award bonus for successful streak', () => {
      manager.registerUser('user-streak', 50);

      const updated = manager.bonusForStreak('user-streak', 5);

      expect(updated).toBe(55);
    });

    it('should cap streak bonus at 30', () => {
      manager.registerUser('user-streak-max', 70);

      const updated = manager.bonusForStreak('user-streak-max', 50);

      expect(updated).toBe(100); // 70 + 30 capped
    });

    it('should handle multiple tasks per user', () => {
      manager.registerUser('user-multi', 65);

      manager.completeTask('task-m1', 'user-multi', true);
      manager.completeTask('task-m2', 'user-multi', true);
      manager.completeTask('task-m3', 'user-multi', true);

      const rewards = manager.getUserRewards('user-multi');

      expect(rewards?.tasksCompleted).toBe(3);
    });
  });

  describe('RewardDistributionEngine', () => {
    let manager: BlockchainRewardManager;
    let engine: RewardDistributionEngine;

    beforeEach(() => {
      manager = new BlockchainRewardManager(config);
      engine = new RewardDistributionEngine(manager);

      // Register test users
      for (let i = 1; i <= 3; i++) {
        manager.registerUser(`user-dist-${i}`, 60);
      }
    });

    it('should distribute rewards to multiple users', () => {
      const distributions = [
        { userId: 'user-dist-1', taskId: 'task-d1', success: true },
        { userId: 'user-dist-2', taskId: 'task-d2', success: true },
        { userId: 'user-dist-3', taskId: 'task-d3', success: false },
      ];

      const result = engine.distributeRewards(distributions);

      expect(result.totalDistributed).toBeGreaterThan(0);
      expect(result.distributionDetails.length).toBe(3);
      expect(result.distributionDetails[0].success).toBe(true);
      expect(result.distributionDetails[2].success).toBe(false);
    });

    it('should schedule reward distribution', (done) => {
      let callCount = 0;

      engine.scheduleDistribution('test-schedule', 50, () => {
        callCount++;
      });

      setTimeout(() => {
        expect(callCount).toBeGreaterThan(0);
        done();
      }, 150);
    });

    it('should get schedule information', () => {
      const intervalMs = 60000;
      engine.scheduleDistribution('info-test', intervalMs, () => {});

      const info = engine.getScheduleInfo('info-test');
      expect(info).toBeDefined();
      expect(info?.interval).toBe(intervalMs);
      expect(info?.lastRun).toBeDefined();
    });

    it('should penalize users for failed tasks in distribution', () => {
      const distributions = [
        { userId: 'user-dist-1', taskId: 'task-fail-1', success: false },
      ];

      engine.distributeRewards(distributions);

      const rewards = manager.getUserRewards('user-dist-1');
      expect(rewards?.reputationScore).toBeLessThan(60); // Should be penalized
    });
  });

  describe('Reward Calculation Edge Cases', () => {
    let manager: BlockchainRewardManager;

    beforeEach(() => {
      manager = new BlockchainRewardManager(config);
    });

    it('should calculate reward with complexity multiplier', () => {
      manager.registerUser('user-complex', 75);

      const reward1 = manager.calculateReward('user-complex', 1);
      const reward2 = manager.calculateReward('user-complex', 2);

      expect(reward2).toBeGreaterThan(reward1);
      // Complexity multiplier scales the base amount
      expect(reward2).toBeGreaterThanOrEqual(reward1 * 1.8);
    });

    it('should handle edge case: max reputation bonus', () => {
      manager.registerUser('user-max-rep', 100);

      const reward = manager.calculateReward('user-max-rep', 1);

      expect(reward).toBeGreaterThan(0);
      // Ensure formula includes reputation bonus (should be significant)
      expect(reward).toBeGreaterThan(config.baseRewardPerTask);
    });

    it('should process min reputation correctly', () => {
      manager.registerUser('user-min-rep', 30);

      const reward = manager.calculateReward('user-min-rep', 1);

      expect(reward).toBeGreaterThan(config.baseRewardPerTask);
    });
  });
});
