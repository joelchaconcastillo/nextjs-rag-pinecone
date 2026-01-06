import { LLMProvider, Message } from '../lib/llm';
import { RAG } from '../lib/rag-system';
import { Document } from '../lib/rag';

/**
 * Example custom LLM provider implementation
 * This demonstrates how to use a different LLM provider with the RAG system
 */
class CustomLLMProvider implements LLMProvider {
  private conversationHistory: Map<string, Message[]>;
  private apiEndpoint: string;

  constructor(apiEndpoint: string) {
    this.apiEndpoint = apiEndpoint;
    this.conversationHistory = new Map();
  }

  async generateResponse(
    prompt: string,
    conversationId?: string
  ): Promise<string> {
    if (conversationId) {
      this.addToHistory(conversationId, { role: 'user', content: prompt });
    }

    // This is a mock implementation
    // Replace with actual API call to your LLM provider
    const response = `[Custom LLM Response] Processing: "${prompt.substring(0, 50)}..."`;

    if (conversationId) {
      this.addToHistory(conversationId, {
        role: 'assistant',
        content: response,
      });
    }

    return response;
  }

  async generateResponseWithHistory(
    messages: Message[],
    conversationId?: string
  ): Promise<string> {
    if (conversationId) {
      this.conversationHistory.set(conversationId, [...messages]);
    }

    const lastMessage = messages[messages.length - 1];

    // This is a mock implementation
    // Replace with actual API call to your LLM provider
    const response = `[Custom LLM Response] Processing with ${messages.length} messages: "${lastMessage.content.substring(0, 50)}..."`;

    if (conversationId) {
      this.addToHistory(conversationId, {
        role: 'assistant',
        content: response,
      });
    }

    return response;
  }

  clearHistory(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
  }

  getHistory(conversationId: string): Message[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  private addToHistory(conversationId: string, message: Message): void {
    const history = this.conversationHistory.get(conversationId) || [];
    history.push(message);
    this.conversationHistory.set(conversationId, history);
  }
}

/**
 * Example using custom LLM provider
 */
async function customProviderExample() {
  console.log('=== Custom LLM Provider Example ===\n');

  // Create a custom LLM provider
  const customProvider = new CustomLLMProvider('https://api.example.com/llm');

  // Initialize RAG with custom provider
  const rag = new RAG({
    pineconeApiKey: process.env.PINECONE_API_KEY!, // Used for both embeddings and indexing
    pineconeIndexName: process.env.PINECONE_INDEX_NAME!,
    geminiApiKey: process.env.GEMINI_API_KEY!, // Only needed for LLM if not using custom provider
    llmProvider: customProvider, // Use custom provider for text generation
    namespace: 'custom-provider',
  });

  console.log('Initializing RAG with custom LLM provider...');
  await rag.initialize();

  // Add sample documents
  const documents: Document[] = [
    {
      id: 'custom-doc-1',
      content: 'This is a test document for the custom LLM provider example.',
      metadata: { type: 'test' },
    },
  ];

  console.log('Adding documents...');
  await rag.addDocuments(documents);

  // Query using custom provider
  console.log('\nQuerying with custom LLM provider...');
  const response = await rag.ask('What is in the documents?', 'custom-user-1');

  console.log('Response:', response.answer);
  console.log('Sources:', response.sources.length);

  console.log('\nCustom provider example completed!');
}

// Run the example
if (require.main === module) {
  customProviderExample().catch(console.error);
}

export { CustomLLMProvider, customProviderExample };
