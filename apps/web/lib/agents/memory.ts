/**
 * CaseWin Memory System (Serverless - In-Memory)
 */

import { callLLM } from './base-agent'

export interface Memory {
  id: string
  type: 'conversation' | 'fact' | 'case' | 'solution' | 'user_preference'
  content: string
  metadata: {
    userId?: string
    sessionId?: string
    timestamp: Date
    importance: number
    lastAccessed?: Date
    accessCount?: number
  }
  embedding?: number[]
}

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

const store: Map<string, Memory> = new Map()

export class MemoryManager {
  private shortTermMemory: ConversationTurn[] = []
  private maxShortTermSize = 20
  private initialized = false

  async initialize() { this.initialized = true }

  addTurn(role: 'user' | 'assistant' | 'system', content: string, metadata?: Record<string, any>) {
    this.shortTermMemory.push({ role, content, timestamp: new Date(), metadata })
    if (this.shortTermMemory.length > this.maxShortTermSize)
      this.shortTermMemory = this.shortTermMemory.slice(-this.maxShortTermSize)
  }

  getConversationContext(maxTurns?: number): string {
    const turns = maxTurns ? this.shortTermMemory.slice(-maxTurns) : this.shortTermMemory
    return turns.map(t => `${t.role.toUpperCase()}: ${t.content}`).join('\n\n')
  }

  async remember(content: string, type: Memory['type'], metadata: Partial<Memory['metadata']> = {}) {
    const mem: Memory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type, content,
      metadata: { timestamp: new Date(), importance: metadata.importance || 0.5, lastAccessed: new Date(), accessCount: 0, ...metadata }
    }
    store.set(mem.id, mem)
    return mem.id
  }

  async recall(query: string, options: { limit?: number; type?: Memory['type']; userId?: string; minImportance?: number } = {}): Promise<Memory[]> {
    const { limit = 5, type, minImportance = 0 } = options
    const q = query.toLowerCase()
    const results: Memory[] = []
    for (const m of store.values()) {
      if (type && m.type !== type) continue
      if (m.metadata.importance < minImportance) continue
      if (m.content.toLowerCase().includes(q)) { results.push(m); if (results.length >= limit) break }
    }
    return results
  }

  async buildContext(query: string, userId?: string) {
    const recent = this.getConversationContext(10)
    const memories = await this.recall(query, { limit: 5, userId })
    const memCtx = memories.map(m => `[${m.type.toUpperCase()}] ${m.content}`).join('\n')
    return { recentConversation: recent, relevantMemories: memories, combinedContext: `=== Recent ===\n${recent || 'None'}\n\n=== Knowledge ===\n${memCtx || 'None'}` }
  }

  async exportMemories(userId?: string): Promise<Memory[]> {
    const all = Array.from(store.values())
    return userId ? all.filter(m => m.metadata.userId === userId) : all
  }

  clearShortTerm() { this.shortTermMemory = [] }

  getStats() { return { shortTermSize: this.shortTermMemory.length, longTermSize: store.size } }
}

let instance: MemoryManager | null = null
export function getMemoryManager(): MemoryManager {
  if (!instance) instance = new MemoryManager()
  return instance
}
export default MemoryManager
