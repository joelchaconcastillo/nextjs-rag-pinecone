import { DataProcessor, Document, ChunkedDocument } from './rag/data-processor';
import { Embedder } from './rag/embedder';
import { Indexer } from './rag/indexer';
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
}

/**
 * Main RAG class that orchestrates all components
 */
export class RAG {
  private dataProcessor: DataProcessor;
  private embedder: Embedder;
  private indexer: Indexer;
  private assistant: Assistant;
  private config: RAGConfig;

  constructor(config: RAGConfig) {
    this.config = config;

    // Initialize components
    this.dataProcessor = new DataProcessor(
      config.chunkSize || 1000,
      config.chunkOverlap || 200
    );

    this.embedder = new Embedder(config.geminiApiKey);

    this.indexer = new Indexer(
      config.pineconeApiKey,
      config.pineconeIndexName,
      this.embedder,
      config.namespace
    );

    const llmProvider =
      config.llmProvider || new GeminiProvider(config.geminiApiKey);

    this.assistant = new Assistant(
      config.pineconeApiKey,
      config.pineconeIndexName,
      this.embedder,
      llmProvider,
      config.namespace,
      config.topK || 5
    );
  }

  /**
   * Initialize the RAG system (creates index if needed)
   */
  async initialize(): Promise<void> {
    const dimension = await this.embedder.getDimension();
    await this.indexer.initializeIndex(dimension);
  }

  /**
   * Add documents to the RAG system
   */
  async addDocuments(documents: Document[]): Promise<void> {
    // Process and chunk documents
    const chunks = this.dataProcessor.processAndChunk(documents);

    // Index the chunks
    await this.indexer.indexDocuments(chunks);
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
    await this.indexer.indexDocuments(chunks);
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
    await this.indexer.deleteDocuments(ids);
  }

  /**
   * Delete all documents
   */
  async deleteAll(): Promise<void> {
    await this.indexer.deleteAll();
  }

  /**
   * Get index statistics
   */
  async getStats() {
    return await this.indexer.getStats();
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
   * Get the embedder instance
   */
  getEmbedder(): Embedder {
    return this.embedder;
  }

  /**
   * Get the indexer instance
   */
  getIndexer(): Indexer {
    return this.indexer;
  }

  /**
   * Get the assistant instance
   */
  getAssistant(): Assistant {
    return this.assistant;
  }
}
