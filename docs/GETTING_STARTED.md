# Getting Started with Next.js RAG Pinecone

This guide will help you get started with the RAG (Retrieval-Augmented Generation) system.

## Prerequisites

- Node.js 18+ installed
- A Pinecone account and API key ([Get one here](https://www.pinecone.io/))
- A Google AI API key for Gemini ([Get one here](https://makersuite.google.com/app/apikey))

## Installation

1. Clone the repository:
```bash
git clone https://github.com/joelchaconcastillo/nextjs-rag-pinecone.git
cd nextjs-rag-pinecone
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=rag-index
GEMINI_API_KEY=your_gemini_api_key_here
```

## Quick Start

### 1. Basic Usage

Create a simple RAG system:

```typescript
import { RAG } from './lib/rag-system';
import { Document } from './lib/rag';

// Initialize
const rag = new RAG({
  pineconeApiKey: process.env.PINECONE_API_KEY!,
  pineconeIndexName: process.env.PINECONE_INDEX_NAME!,
  geminiApiKey: process.env.GEMINI_API_KEY!,
});

// Setup
await rag.initialize();

// Add documents
await rag.addDocuments([
  {
    id: 'doc1',
    content: 'Your document content here...',
    metadata: { source: 'documentation' },
  },
]);

// Ask questions
const response = await rag.ask('What is in the documents?');
console.log(response.answer);
```

### 2. Conversation Memory

Maintain context across multiple questions:

```typescript
const userId = 'user-123';

// First question
const response1 = await rag.ask('What is machine learning?', userId);

// Follow-up question - AI remembers the context
const response2 = await rag.ask('Can you explain more?', userId);

// View conversation history
const history = rag.getHistory(userId);

// Clear when done
rag.clearHistory(userId);
```

### 3. Advanced: Individual Classes

For more control, use the classes individually:

```typescript
import { DataProcessor, Embedder, Indexer, Assistant } from './lib/rag';
import { GeminiProvider } from './lib/llm';

// Step 1: Process documents
const processor = new DataProcessor(1000, 200);
const chunks = processor.processAndChunk(documents);

// Step 2: Create embedder
const embedder = new Embedder(geminiApiKey);

// Step 3: Index documents
const indexer = new Indexer(pineconeApiKey, indexName, embedder);
await indexer.initializeIndex(768); // Gemini embedding dimension
await indexer.indexDocuments(chunks);

// Step 4: Create assistant
const llm = new GeminiProvider(geminiApiKey);
const assistant = new Assistant(pineconeApiKey, indexName, embedder, llm);

// Step 5: Query
const response = await assistant.ask('Your question here');
```

### 4. Custom LLM Provider

Use a different LLM (OpenAI, Claude, etc.):

```typescript
import { LLMProvider, Message } from './lib/llm';

class OpenAIProvider implements LLMProvider {
  async generateResponse(prompt: string, conversationId?: string): Promise<string> {
    // Your OpenAI implementation here
    return await callOpenAI(prompt);
  }

  async generateResponseWithHistory(messages: Message[], conversationId?: string): Promise<string> {
    // Implementation with conversation history
    return await callOpenAIWithHistory(messages);
  }

  clearHistory(conversationId: string): void { /* ... */ }
  getHistory(conversationId: string): Message[] { /* ... */ }
}

// Use with RAG
const rag = new RAG({
  pineconeApiKey: process.env.PINECONE_API_KEY!,
  pineconeIndexName: process.env.PINECONE_INDEX_NAME!,
  geminiApiKey: process.env.GEMINI_API_KEY!, // Still needed for embeddings
  llmProvider: new OpenAIProvider(), // Your custom provider
});
```

## Configuration Options

### RAG Configuration

```typescript
const rag = new RAG({
  pineconeApiKey: string,          // Required: Pinecone API key
  pineconeIndexName: string,       // Required: Index name
  geminiApiKey: string,            // Required: Gemini API key
  namespace?: string,              // Optional: Pinecone namespace
  chunkSize?: number,              // Optional: Default 1000
  chunkOverlap?: number,           // Optional: Default 200
  topK?: number,                   // Optional: Number of results, default 5
  llmProvider?: LLMProvider,       // Optional: Custom LLM provider
});
```

### DataProcessor Configuration

```typescript
const processor = new DataProcessor(
  chunkSize,      // Characters per chunk (default: 1000)
  chunkOverlap    // Overlap between chunks (default: 200)
);
```

### Embedder Configuration

```typescript
const embedder = new Embedder(
  apiKey,         // Gemini API key
  modelName       // Optional: Default 'text-embedding-004'
);
```

## Running Examples

The `examples/` directory contains working examples:

```bash
# Basic usage example
npx tsx examples/basic-usage.ts

# Advanced usage with individual classes
npx tsx examples/advanced-usage.ts

# Custom LLM provider example
npx tsx examples/custom-llm-provider.ts
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## Common Issues

### Issue: "Index not found"

**Solution:** Make sure the index name in your `.env` file matches the one you created in Pinecone, or let the system create it for you by calling `await rag.initialize()`.

### Issue: "API key invalid"

**Solution:** Verify your API keys in the `.env` file. Make sure there are no extra spaces or quotes.

### Issue: "Dimension mismatch"

**Solution:** If you're switching embedding models, you may need to delete and recreate your Pinecone index with the correct dimension.

## Next Steps

- Read the full [API Reference](../README.md#api-reference)
- Explore the [Examples](../examples/)
- Check the [Architecture](../README.md#architecture) section

## Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/joelchaconcastillo/nextjs-rag-pinecone/issues)
- Check the [README](../README.md) for more information
