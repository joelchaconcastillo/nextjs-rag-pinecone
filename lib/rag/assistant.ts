import { PineconeService } from './pinecone-service';
import { LLMProvider, Message } from '../llm';

/**
 * Query result interface
 */
export interface QueryResult {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
}

/**
 * Assistant response interface
 */
export interface AssistantResponse {
  answer: string;
  sources: QueryResult[];
  conversationId?: string;
}

/**
 * Assistant class for querying and generating responses
 */
export class Assistant {
  private pineconeService: PineconeService;
  private llmProvider: LLMProvider;
  private topK: number;

  constructor(
    pineconeService: PineconeService,
    llmProvider: LLMProvider,
    topK: number = 5
  ) {
    this.pineconeService = pineconeService;
    this.llmProvider = llmProvider;
    this.topK = topK;
  }

  /**
   * Query the vector database
   */
  async query(queryText: string, topK?: number): Promise<QueryResult[]> {
    // Query using PineconeService (which handles embedding internally)
    const matches = await this.pineconeService.query(
      queryText,
      topK || this.topK
    );

    // Format results
    const results: QueryResult[] = matches.map((match) => ({
      id: match.id,
      score: match.score || 0,
      content: (match.metadata?.content as string) || '',
      metadata: match.metadata || {},
    }));

    return results;
  }

  /**
   * Ask a question and get an AI-generated answer with sources
   */
  async ask(
    question: string,
    conversationId?: string,
    topK?: number
  ): Promise<AssistantResponse> {
    // Query relevant documents
    const sources = await this.query(question, topK);

    // Build context from sources
    const context = sources
      .map(
        (source, idx) =>
          `[Source ${idx + 1}] ${source.content}`
      )
      .join('\n\n');

    // Build prompt
    const prompt = this.buildPrompt(question, context);

    // Generate response using LLM
    const answer = await this.llmProvider.generateResponse(
      prompt,
      conversationId
    );

    return {
      answer,
      sources,
      conversationId,
    };
  }

  /**
   * Ask a question with explicit conversation history
   */
  async askWithHistory(
    question: string,
    messages: Message[],
    conversationId?: string,
    topK?: number
  ): Promise<AssistantResponse> {
    // Query relevant documents
    const sources = await this.query(question, topK);

    // Build context from sources
    const context = sources
      .map(
        (source, idx) =>
          `[Source ${idx + 1}] ${source.content}`
      )
      .join('\n\n');

    // Add system message with context if not already present
    const systemMessage: Message = {
      role: 'system',
      content: `You are a helpful assistant. Answer questions based on the following context:\n\n${context}\n\nIf the answer cannot be found in the context, say so.`,
    };

    // Combine with user messages
    const allMessages: Message[] = [systemMessage, ...messages];

    // Generate response
    const answer = await this.llmProvider.generateResponseWithHistory(
      allMessages,
      conversationId
    );

    return {
      answer,
      sources,
      conversationId,
    };
  }

  /**
   * Build prompt for the LLM
   */
  private buildPrompt(question: string, context: string): string {
    return `You are a helpful assistant. Answer the following question based on the provided context. If the answer cannot be found in the context, say so.

Context:
${context}

Question: ${question}

Answer:`;
  }

  /**
   * Clear conversation history
   */
  clearHistory(conversationId: string): void {
    this.llmProvider.clearHistory(conversationId);
  }

  /**
   * Get conversation history
   */
  getHistory(conversationId: string): Message[] {
    return this.llmProvider.getHistory(conversationId);
  }

  /**
   * Search for similar documents without generating an answer
   */
  async search(queryText: string, topK?: number): Promise<QueryResult[]> {
    return this.query(queryText, topK);
  }
}
