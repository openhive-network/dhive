/**
 * @file Node health tracking for smart failover.
 * @license BSD-3-Clause-No-Military-License
 *
 * Tracks per-node, per-API health to enable intelligent failover decisions.
 * Nodes that fail for specific APIs are deprioritized for those APIs while
 * remaining available for others. Stale nodes (behind on head block) are
 * also deprioritized.
 */

interface ApiFailure {
  count: number
  lastFailure: number
}

interface NodeState {
  /** Per-API failure tracking (api name → failure info) */
  apiFailures: Map<string, ApiFailure>
  /** Consecutive failures across all APIs */
  consecutiveFailures: number
  /** Timestamp of last failure */
  lastFailure: number
  /** Last known head block number from this node */
  headBlock: number
  /** When headBlock was last updated */
  headBlockUpdatedAt: number
}

export interface HealthTrackerOptions {
  /**
   * How long (ms) to deprioritize a node after consecutive failures.
   * Default: 30 seconds.
   */
  nodeCooldownMs?: number
  /**
   * How long (ms) to deprioritize a node for a specific API after failures.
   * Default: 60 seconds.
   */
  apiCooldownMs?: number
  /**
   * Number of consecutive failures before a node enters cooldown.
   * Default: 3.
   */
  maxFailuresBeforeCooldown?: number
  /**
   * Number of API-specific failures before deprioritizing for that API.
   * Default: 2.
   */
  maxApiFailuresBeforeCooldown?: number
  /**
   * How many blocks behind the best known head block a node can be
   * before being considered stale. Default: 30.
   */
  staleBlockThreshold?: number
  /**
   * How long (ms) head block data remains valid for staleness checks.
   * Default: 2 minutes.
   */
  headBlockTtlMs?: number
}

export class NodeHealthTracker {
  private health: Map<string, NodeState> = new Map()
  private bestKnownHeadBlock: number = 0
  private bestKnownHeadBlockTime: number = 0

  private readonly nodeCooldownMs: number
  private readonly apiCooldownMs: number
  private readonly maxFailuresBeforeCooldown: number
  private readonly maxApiFailuresBeforeCooldown: number
  private readonly staleBlockThreshold: number
  private readonly headBlockTtlMs: number

  constructor(options: HealthTrackerOptions = {}) {
    this.nodeCooldownMs = options.nodeCooldownMs ?? 30_000
    this.apiCooldownMs = options.apiCooldownMs ?? 60_000
    this.maxFailuresBeforeCooldown = options.maxFailuresBeforeCooldown ?? 3
    this.maxApiFailuresBeforeCooldown = options.maxApiFailuresBeforeCooldown ?? 2
    this.staleBlockThreshold = options.staleBlockThreshold ?? 30
    this.headBlockTtlMs = options.headBlockTtlMs ?? 120_000
  }

  private getOrCreate(node: string): NodeState {
    let state = this.health.get(node)
    if (!state) {
      state = {
        apiFailures: new Map(),
        consecutiveFailures: 0,
        lastFailure: 0,
        headBlock: 0,
        headBlockUpdatedAt: 0,
      }
      this.health.set(node, state)
    }
    return state
  }

  /**
   * Record a successful call to a node for a specific API.
   * Clears consecutive failure counter and API-specific failures for this API.
   */
  recordSuccess(node: string, api: string): void {
    const state = this.getOrCreate(node)
    state.consecutiveFailures = 0
    state.apiFailures.delete(api)
  }

  /**
   * Record a network-level failure (timeout, connection refused, HTTP error).
   * Increments both the global consecutive failure counter and the API-specific counter.
   */
  recordFailure(node: string, api: string): void {
    const state = this.getOrCreate(node)
    state.consecutiveFailures++
    state.lastFailure = Date.now()

    this.incrementApiFailure(state, api)
  }

  /**
   * Record an API/plugin-specific failure (e.g. "method not found", "plugin not enabled").
   * Only increments the per-API counter, NOT the global consecutive failure counter.
   * This prevents a node with a disabled plugin from being penalized for all APIs.
   */
  recordApiFailure(node: string, api: string): void {
    const state = this.getOrCreate(node)
    this.incrementApiFailure(state, api)
  }

  private incrementApiFailure(state: NodeState, api: string): void {
    const apiState = state.apiFailures.get(api) || { count: 0, lastFailure: 0 }
    apiState.count++
    apiState.lastFailure = Date.now()
    state.apiFailures.set(api, apiState)
  }

  /**
   * Update head block number for a node.
   * Called passively when get_dynamic_global_properties responses are observed.
   */
  updateHeadBlock(node: string, headBlock: number): void {
    if (!headBlock || headBlock <= 0) return
    const state = this.getOrCreate(node)
    state.headBlock = headBlock
    state.headBlockUpdatedAt = Date.now()
    if (headBlock > this.bestKnownHeadBlock) {
      this.bestKnownHeadBlock = headBlock
      this.bestKnownHeadBlockTime = Date.now()
    }
  }

  /**
   * Check if a node is considered healthy for a given API.
   */
  isNodeHealthy(node: string, api?: string): boolean {
    const state = this.health.get(node)
    if (!state) return true // Unknown nodes are assumed healthy

    const now = Date.now()

    // Check overall node health (consecutive failures)
    if (state.consecutiveFailures >= this.maxFailuresBeforeCooldown) {
      if (now - state.lastFailure < this.nodeCooldownMs) {
        return false
      }
    }

    // Check API-specific health
    if (api) {
      const apiState = state.apiFailures.get(api)
      if (apiState && apiState.count >= this.maxApiFailuresBeforeCooldown) {
        if (now - apiState.lastFailure < this.apiCooldownMs) {
          return false
        }
      }
    }

    // Check head block staleness
    if (
      state.headBlock > 0 &&
      this.bestKnownHeadBlock > 0 &&
      now - state.headBlockUpdatedAt < this.headBlockTtlMs &&
      now - this.bestKnownHeadBlockTime < this.headBlockTtlMs
    ) {
      if (this.bestKnownHeadBlock - state.headBlock > this.staleBlockThreshold) {
        return false
      }
    }

    return true
  }

  /**
   * Return nodes ordered by health for a specific API call.
   * Healthy nodes come first (preserving original order), then unhealthy nodes as fallback.
   */
  getOrderedNodes(allNodes: string[], api?: string): string[] {
    const healthy: string[] = []
    const unhealthy: string[] = []

    for (const node of allNodes) {
      if (this.isNodeHealthy(node, api)) {
        healthy.push(node)
      } else {
        unhealthy.push(node)
      }
    }

    return [...healthy, ...unhealthy]
  }

  /**
   * Reset all health tracking data.
   */
  reset(): void {
    this.health.clear()
    this.bestKnownHeadBlock = 0
    this.bestKnownHeadBlockTime = 0
  }

  /**
   * Get a snapshot of current health state for diagnostics.
   */
  getHealthSnapshot(): Map<string, {
    consecutiveFailures: number
    headBlock: number
    apiFailures: Record<string, { count: number }>
    healthy: boolean
  }> {
    const snapshot = new Map<string, any>()
    for (const [node, state] of this.health) {
      const apiFailures: Record<string, { count: number }> = {}
      for (const [api, failure] of state.apiFailures) {
        apiFailures[api] = { count: failure.count }
      }
      snapshot.set(node, {
        consecutiveFailures: state.consecutiveFailures,
        headBlock: state.headBlock,
        apiFailures,
        healthy: this.isNodeHealthy(node),
      })
    }
    return snapshot
  }
}
