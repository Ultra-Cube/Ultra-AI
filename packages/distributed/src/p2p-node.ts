/**
 * P2P Network Node Implementation
 * Manages participation in distributed network
 * Handles request chunking, distribution, and result aggregation
 */

import crypto from 'node:crypto';

export interface NodeConfig {
  nodeId: string;
  port: number;
  peers: PeerInfo[];
  processingCapacity: number; // Max concurrent tasks
}

export interface PeerInfo {
  nodeId: string;
  host: string;
  port: number;
  reputation: number;
  available: boolean;
}

export interface DistributedTask {
  taskId: string;
  timestamp: Date;
  input: string;
  chunkCount: number;
  chunks: TaskChunk[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface TaskChunk {
  chunkId: string;
  taskId: string;
  sequence: number;
  data: string;
  encrypted: boolean;
  targetNodeId?: string;
  result?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface NodeHealth {
  nodeId: string;
  uptime: number;
  tasksProcessed: number;
  successRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

export class P2PNode {
  private nodeId: string;
  private port: number;
  private peers: Map<string, PeerInfo> = new Map();
  private activeTasks: Map<string, DistributedTask> = new Map();
  private processedChunks: Map<string, TaskChunk> = new Map();
  private processingCapacity: number;
  private currentLoad: number = 0;
  private startTime: Date;

  // Metrics
  private tasksProcessed: number = 0;
  private successfulTasks: number = 0;

  constructor(config: NodeConfig) {
    this.nodeId = config.nodeId || crypto.randomUUID();
    this.port = config.port;
    this.processingCapacity = config.processingCapacity;
    this.startTime = new Date();

    // Register peers
    for (const peer of config.peers) {
      this.registerPeer(peer);
    }
  }

  /**
   * Register a peer node
   */
  registerPeer(peer: PeerInfo): void {
    this.peers.set(peer.nodeId, peer);
  }

  /**
   * Chunk input data for distributed processing
   */
  chunkData(input: string, chunkSize: number = 1024): TaskChunk[] {
    const taskId = crypto.randomUUID();
    const chunks: TaskChunk[] = [];

    for (let i = 0; i < input.length; i += chunkSize) {
      const chunk: TaskChunk = {
        chunkId: crypto.randomUUID(),
        taskId,
        sequence: chunks.length,
        data: input.slice(i, i + chunkSize),
        encrypted: false,
        status: 'pending',
      };

      chunks.push(chunk);
    }

    return chunks;
  }

  /**
   * Create a distributed task
   */
  createTask(input: string): DistributedTask {
    const taskId = crypto.randomUUID();
    const chunks = this.chunkData(input);

    const task: DistributedTask = {
      taskId,
      timestamp: new Date(),
      input,
      chunkCount: chunks.length,
      chunks,
      status: 'pending',
    };

    this.activeTasks.set(taskId, task);
    return task;
  }

  /**
   * Distribute task chunks to available peers
   */
  async distributeTask(task: DistributedTask): Promise<string> {
    task.status = 'processing';
    const availablePeers = this.getAvailablePeers();

    if (availablePeers.length === 0) {
      task.status = 'failed';
      throw new Error('No available peers for task distribution');
    }

    // Distribute chunks in round-robin fashion
    for (let i = 0; i < task.chunks.length; i++) {
      const chunk = task.chunks[i];
      const targetPeer = availablePeers[i % availablePeers.length];

      chunk.targetNodeId = targetPeer.nodeId;
      chunk.status = 'processing';

      // In real implementation, would make actual network request
      // For now, simulate processing
      await this.simulateChunkProcessing(chunk);
    }

    return task.taskId;
  }

  /**
   * Aggregate results from all chunks
   */
  aggregateResults(taskId: string): string {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Combine chunk results in order
    const results: string[] = [];
    const sortedChunks = [...task.chunks].sort((a, b) => a.sequence - b.sequence);

    for (const chunk of sortedChunks) {
      if (chunk.result) {
        results.push(chunk.result);
      }
    }

    const aggregated = results.join('\n');
    task.status = 'completed';

    return aggregated;
  }

  /**
   * Accept a chunk from another peer for processing
   */
  async acceptChunk(chunk: TaskChunk): Promise<void> {
    if (this.currentLoad >= this.processingCapacity) {
      throw new Error('Node at capacity');
    }

    this.currentLoad++;
    chunk.status = 'processing';

    try {
      // Simulate processing
      await this.simulateChunkProcessing(chunk);
      this.processedChunks.set(chunk.chunkId, chunk);
    } finally {
      this.currentLoad--;
    }
  }

  /**
   * Get current node health status
   */
  getHealth(): NodeHealth {
    const uptime = Date.now() - this.startTime.getTime();
    const successRate =
      this.tasksProcessed > 0 ? this.successfulTasks / this.tasksProcessed : 0;

    return {
      nodeId: this.nodeId,
      uptime,
      tasksProcessed: this.tasksProcessed,
      successRate,
      cpuUsage: Math.random() * 100, // Simulated
      memoryUsage: Math.random() * 100, // Simulated
    };
  }

  /**
   * Get list of available peers
   */
  getAvailablePeers(): PeerInfo[] {
    return Array.from(this.peers.values()).filter((peer) => peer.available);
  }

  /**
   * Update peer reputation based on task result
   */
  updatePeerReputation(peerId: string, success: boolean): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    if (success) {
      peer.reputation = Math.min(100, peer.reputation + 5);
    } else {
      peer.reputation = Math.max(0, peer.reputation - 10);
    }
  }

  /**
   * Disconnect peer if reputation too low
   */
  pruneUnreliablePeers(threshold: number = 20): void {
    for (const [peerId, peer] of this.peers) {
      if (peer.reputation < threshold) {
        peer.available = false;
      }
    }
  }

  /**
   * Simulate chunk processing (placeholder for actual processing)
   */
  private async simulateChunkProcessing(chunk: TaskChunk): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate processing result
        chunk.result = `Processed: ${chunk.data.slice(0, 50)}...`;
        chunk.status = 'completed';
        this.tasksProcessed++;
        this.successfulTasks++;
        resolve();
      }, Math.random() * 100);
    });
  }

  /**
   * Get Node Info
   */
  getNodeInfo() {
    return {
      nodeId: this.nodeId,
      port: this.port,
      peerCount: this.peers.size,
      activeTasks: this.activeTasks.size,
      currentLoad: this.currentLoad,
      capacity: this.processingCapacity,
    };
  }
}

/**
 * Network Coordinator for managing multiple nodes
 */
export class NetworkCoordinator {
  private nodes: Map<string, P2PNode> = new Map();

  addNode(node: P2PNode): void {
    const info = (node as any).getNodeInfo?.();
    if (info) {
      this.nodes.set(info.nodeId, node);
    }
  }

  getNetworkHealth(): any {
    const nodeHealths = Array.from(this.nodes.values()).map((node) =>
      (node as any).getHealth?.(),
    );

    const avgSuccessRate =
      nodeHealths.reduce((sum, h) => sum + (h?.successRate || 0), 0) /
      Math.max(1, nodeHealths.length);

    return {
      totalNodes: this.nodes.size,
      avgSuccessRate,
      nodes: nodeHealths,
    };
  }
}
