import { DataProcessor, Document, ChunkedDocument } from './rag/data-processor';
import { PineconeService } from './rag/pinecone-service';
import { Assistant, AssistantResponse } from './rag/assistant';
import { GeminiProvider } from './llm/gemini';
import { LLMProvider } from './llm/provider';

/**
 * RAG configuration interface
 */
export interface RAGConfig {
  pineconeApiKey: string;
  pineconeIndexName: string;
  geminiApiKey: string;
  namespace?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  topK?: number;
  llmProvider?: LLMProvider;
  embeddingModel?: string;
}

/**
 * Main RAG class that orchestrates all components
 */
export class RAG {
  private dataProcessor: DataProcessor;
  private pineconeService: PineconeService;
  private assistant: Assistant;
  private config: RAGConfig;

  constructor(config: RAGConfig) {
    this.config = config;

    // Initialize components
    this.dataProcessor = new DataProcessor(
      config.chunkSize || 1000,
      config.chunkOverlap || 200
    );

    // Use PineconeService for both embedding and indexing
    this.pineconeService = new PineconeService(
      config.pineconeApiKey,
      config.pineconeIndexName,
      config.namespace,
      config.embeddingModel
    );

    const llmProvider =
      config.llmProvider || new GeminiProvider(config.geminiApiKey);

    this.assistant = new Assistant(
      this.pineconeService,
      llmProvider,
      config.topK || 5
    );
  }

  /**
   * Initialize the RAG system (creates index if needed)
   */
  async initialize(): Promise<void> {
    const dimension = await this.pineconeService.getDimension();
    await this.pineconeService.initializeIndex(dimension);
  }

  /**
   * Add documents to the RAG system
   */
  async addDocuments(documents: Document[]): Promise<void> {
    // Process and chunk documents
    const chunks = this.dataProcessor.processAndChunk(documents);

    // Index the chunks using PineconeService
    await this.pineconeService.indexDocuments(chunks);
  }

  /**
   * Process documents (clean and normalize)
   */
  processDocuments(documents: Document[]): Document[] {
    return this.dataProcessor.processDocuments(documents);
  }

  /**
   * Chunk documents
   */
  chunkDocuments(documents: Document[]): ChunkedDocument[] {
    return this.dataProcessor.chunkDocuments(documents);
  }

  /**
   * Process and chunk documents
   */
  processAndChunk(documents: Document[]): ChunkedDocument[] {
    return this.dataProcessor.processAndChunk(documents);
  }

  /**
   * Index pre-processed chunks
   */
  async indexChunks(chunks: ChunkedDocument[]): Promise<void> {
    await this.pineconeService.indexDocuments(chunks);
  }

  /**
   * Ask a question and get an answer
   */
  async ask(
    question: string,
    conversationId?: string
  ): Promise<AssistantResponse> {
    return await this.assistant.ask(question, conversationId);
  }

  /**
   * Search for similar documents
   */
  async search(queryText: string, topK?: number) {
    return await this.assistant.search(queryText, topK);
  }

  /**
   * Delete documents by IDs
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    await this.pineconeService.deleteDocuments(ids);
  }

  /**
   * Delete all documents
   */
  async deleteAll(): Promise<void> {
    await this.pineconeService.deleteAll();
  }

  /**
   * Get index statistics
   */
  async getStats() {
    return await this.pineconeService.getStats();
  }

  /**
   * Clear conversation history
   */
  clearHistory(conversationId: string): void {
    this.assistant.clearHistory(conversationId);
  }

  /**
   * Get conversation history
   */
  getHistory(conversationId: string) {
    return this.assistant.getHistory(conversationId);
  }

  /**
   * Get the data processor instance
   */
  getDataProcessor(): DataProcessor {
    return this.dataProcessor;
  }

  /**
   * Get the PineconeService instance
   */
  getPineconeService(): PineconeService {
    return this.pineconeService;
  }

  /**
   * Get the assistant instance
   */
  getAssistant(): Assistant {
    return this.assistant;
  }
}
