import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, Message } from './provider';

/**
 * Gemini AI provider implementation with conversation memory
 */
export class GeminiProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;
  private conversationHistory: Map<string, Message[]>;

  constructor(apiKey: string, modelName: string = 'gemini-2.0-flash-exp') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
    this.conversationHistory = new Map();
  }

  /**
   * Generate a response from Gemini
   */
  async generateResponse(
    prompt: string,
    conversationId?: string
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });

    if (conversationId) {
      // Add user message to history
      this.addToHistory(conversationId, { role: 'user', content: prompt });

      // Get conversation history
      const history = this.getHistory(conversationId);

      // Convert history to Gemini format
      const chatHistory = history.slice(0, -1).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      // Start chat with history
      const chat = model.startChat({
        history: chatHistory,
      });

      const result = await chat.sendMessage(prompt);
      const response = result.response.text();

      // Add assistant response to history
      this.addToHistory(conversationId, {
        role: 'assistant',
        content: response,
      });

      return response;
    } else {
      // Simple generation without history
      const result = await model.generateContent(prompt);
      return result.response.text();
    }
  }

  /**
   * Generate a response with explicit conversation history
   */
  async generateResponseWithHistory(
    messages: Message[],
    conversationId?: string
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });

    // Store history if conversationId is provided
    if (conversationId) {
      this.conversationHistory.set(conversationId, [...messages]);
    }

    // Convert messages to Gemini format
    const lastMessage = messages[messages.length - 1];
    const chatHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response.text();

    // Add assistant response to history if conversationId is provided
    if (conversationId) {
      this.addToHistory(conversationId, {
        role: 'assistant',
        content: response,
      });
    }

    return response;
  }

  /**
   * Add a message to conversation history
   */
  private addToHistory(conversationId: string, message: Message): void {
    const history = this.conversationHistory.get(conversationId) || [];
    history.push(message);
    this.conversationHistory.set(conversationId, history);
  }

  /**
   * Clear conversation history for a specific ID
   */
  clearHistory(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
  }

  /**
   * Get conversation history for a specific ID
   */
  getHistory(conversationId: string): Message[] {
    return this.conversationHistory.get(conversationId) || [];
  }
}
