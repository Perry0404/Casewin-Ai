/**
 * CaseWin Memory System
 */
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

export class MemoryManager {
  private shortTermMemory: ConversationTurn[] = []
  private maxShortTermSize: number = 20
  private qdrant: any
  private ollama: any
  private collectionName = 'casewin_memories'
  private initialized = false

  async initialize() {
    if (this.initialized) return
    try {
      const { QdrantClient } = await import('@qdrant/js-client-rest')
      const { Ollama } = await import('ollama')
      this.qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' })
      this.ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' })
      this.initialized = true
    } catch (error) {
      console.log('Memory system running in fallback mode')
      this.initialized = true
    }
  }

  addTurn(role: 'user' | 'assistant' | 'system', content: string, metadata?: Record<string, any>) {
    const turn: ConversationTurn = { role, content, timestamp: new Date(), metadata }
    this.shortTermMemory.push(turn)
    if (this.shortTermMemory.length > this.maxShortTermSize) {
      this.shortTermMemory = this.shortTermMemory.slice(-this.maxShortTermSize)
    }
  }

  getConversationContext(maxTurns?: number): string {
    const turns = maxTurns ? this.shortTermMemory.slice(-maxTurns) : this.shortTermMemory
    return turns.map(t => `${t.role.toUpperCase()}: ${t.content}`).join('\n\n')
  }

  async remember(content: string, type: Memory['type'], metadata: Partial<Memory['metadata']> = {}) {
    await this.initialize()
    const memory: Memory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      metadata: { timestamp: new Date(), importance: metadata.importance || 0.5, ...metadata }
    }
    // Store in Qdrant if available
    return memory.id
  }

  async recall(query: string, options: { limit?: number; type?: Memory['type']; userId?: string } = {}): Promise<Memory[]> {
    await this.initialize()
    return []
  }

  async buildContext(query: string, userId?: string): Promise<{
    recentConversation: string
    relevantMemories: Memory[]
    combinedContext: string
  }> {
    const recentConversation = this.getConversationContext(10)
    const relevantMemories = await this.recall(query, { limit: 5, userId })
    return {
      recentConversation,
      relevantMemories,
      combinedContext: `=== Recent Conversation ===\n${recentConversation || 'None'}`
    }
  }

  clearShortTerm() { this.shortTermMemory = [] }

  async exportMemories(userId?: string): Promise<Memory[]> { return [] }
}

let memoryManagerInstance: MemoryManager | null = null

export function getMemoryManager(): MemoryManager {
  if (!memoryManagerInstance) memoryManagerInstance = new MemoryManager()
  return memoryManagerInstance
}

export default MemoryManager
