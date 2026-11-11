export { Chunker } from './chunking/chunker';
export type { Chunk } from './chunking/chunker';

export { Orchestrator } from './orchestration/orchestrator';
export type { NodeAssignment } from './orchestration/orchestrator';

export { P2PNode, NetworkCoordinator } from './p2p-node';
export type {
  NodeConfig,
  PeerInfo,
  DistributedTask,
  TaskChunk,
  NodeHealth,
} from './p2p-node';

export { DataEncryption, SecureChunker } from './encryption/data-encryption';
export type {
  EncryptedChunk,
  EncryptionKey,
  DecryptionResult,
} from './encryption/data-encryption';

export {
  BlockchainRewardManager,
  RewardDistributionEngine,
} from './blockchain/reward-system';
export type {
  RewardConfig,
  UserReward,
  TaskReward,
  SmartContractConfig,
} from './blockchain/reward-system';
