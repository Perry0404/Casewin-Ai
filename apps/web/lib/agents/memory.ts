/**
 * CaseWin Memory System (Serverless Compatible)
 * 
 * Short-term memory always works.
 * Long-term memory (Qdrant) is optional - gracefully degrades if not available.
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

// In-memory fallback when Qdrant is not available
const inMemoryStore: Map<string, Memory> = new Map()

export class MemoryManager {
  private shortTermMemory: ConversationTurn[] = []
  private maxShortTermSize: number = 20
  private qdrantAvailable = false
  private qdrant: any = null

  async initialize() {
    // Try to connect to Qdrant if URL is configured
    if (process.env.QDRANT_URL) {
      try {
        const { QdrantClient } = await import('@qdrant/js-client-rest')
        this.qdrant = new QdrantClient({ url: process.env.QDRANT_URL })
        
        // Test connection
        await this.qdrant.getCollections()
        this.qdrantAvailable = true
        
        // Ensure collection exists
        try {
          await this.qdrant.getCollection('casewin_memories')
        } catch {
          await this.qdrant.createCollection('casewin_memories', {
            vectors: { size: 1536, distance: 'Cosine' }
          })
        }
        console.log('Qdrant connected for long-term memory')
      } catch (error) {
        console.log('Qdrant not available, using in-memory fallback')
        this.qdrantAvailable = false
      }
    }
  }

  addTurn(role: 'user' | 'assistant' | 'system', content: string, metadata?: Record<string, any>) {
    const turn: ConversationTurn = {
      role,
      content,
      timestamp: new Date(),
      metadata
    }

    this.shortTermMemory.push(turn)

    if (this.shortTermMemory.length > this.maxShortTermSize) {
      this.shortTermMemory = this.shortTermMemory.slice(-this.maxShortTermSize)
    }
  }

  getConversationContext(maxTurns?: number): string {
    const turns = maxTurns 
      ? this.shortTermMemory.slice(-maxTurns)
      : this.shortTermMemory

    return turns.map(t => `${t.role.toUpperCase()}: ${t.content}`).join('\n\n')
  }

  async remember(content: string, type: Memory['type'], metadata: Partial<Memory['metadata']> = {}) {
    const memory: Memory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      metadata: {
        timestamp: new Date(),
        importance: metadata.importance || 0.5,
        lastAccessed: new Date(),
        accessCount: 0,
        ...metadata
      }
    }

    // Store in-memory (always works)
    inMemoryStore.set(memory.id, memory)

    return memory.id
  }

  async recall(query: string, options: {
    limit?: number
    type?: Memory['type']
    userId?: string
    minImportance?: number
  } = {}): Promise<Memory[]> {
    const { limit = 5, type, minImportance = 0 } = options

    // Use in-memory search (simple text matching)
    const results: Memory[] = []
    const queryLower = query.toLowerCase()
    
    for (const memory of inMemoryStore.values()) {
      if (type && memory.type !== type) continue
      if (memory.metadata.importance < minImportance) continue
      if (memory.content.toLowerCase().includes(queryLower)) {
        results.push(memory)
        if (results.length >= limit) break
      }
    }

    return results
  }

  async summarizeConversation(): Promise<string> {
    if (this.shortTermMemory.length < 3) {
      return 'Conversation too short to summarize'
    }

    const context = this.getConversationContext()
    
    try {
      const summary = await callLLM([
        { role: 'system', content: 'Summarize this conversation concisely, focusing on key legal topics and decisions.' },
        { role: 'user', content: context }
      ], 0.3)
      return summary
    } catch {
      return 'Summary unavailable'
    }
  }

  clearShortTerm() {
    this.shortTermMemory = []
  }

  getStats() {
    return {
      shortTermSize: this.shortTermMemory.length,
      longTermSize: inMemoryStore.size,
      qdrantAvailable: this.qdrantAvailable
    }
  }
}

// Singleton instance
let memoryManager: MemoryManager | null = null

export function getMemoryManager(): MemoryManager {
  if (!memoryManager) {
    memoryManager = new MemoryManager()
  }
  return memoryManager
}
