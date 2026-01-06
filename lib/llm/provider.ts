/**
 * Base interface for LLM providers
 * This abstraction allows using different LLM providers
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMProvider {
  /**
   * Generate a response from the LLM
   */
  generateResponse(prompt: string, conversationId?: string): Promise<string>;

  /**
   * Generate a response with conversation history
   */
  generateResponseWithHistory(
    messages: Message[],
    conversationId?: string
  ): Promise<string>;

  /**
   * Clear conversation history for a specific ID
   */
  clearHistory(conversationId: string): void;

  /**
   * Get conversation history for a specific ID
   */
  getHistory(conversationId: string): Message[];
}
