# Next.js RAG with Pinecone

A comprehensive Retrieval-Augmented Generation (RAG) system built with Next.js, Pinecone, and Gemini AI. This project demonstrates a modular, class-based architecture for building production-ready RAG applications.

## Features

- **Modular Architecture**: Separate classes for data processing, embedding, indexing, and querying
- **LLM Abstraction Layer**: Use any LLM provider (Gemini AI by default)
- **Conversation Memory**: Maintain conversation history by user ID
- **Document Processing**: Automatic text chunking with overlap for better context
- **Vector Storage**: Efficient storage and retrieval using Pinecone
- **TypeScript**: Full type safety throughout the codebase

## Architecture

The system is organized into the following main components:

### Core Classes

1. **DataProcessor** (`lib/rag/data-processor.ts`)
   - Processes and cleans document text
   - Chunks documents into smaller pieces with configurable size and overlap
   - Preserves metadata throughout processing

2. **Embedder** (`lib/rag/embedder.ts`)
   - Generates embeddings using Gemini AI's embedding model
   - Supports batch processing for efficiency
   - Handles rate limiting automatically

3. **Indexer** (`lib/rag/indexer.ts`)
   - Manages Pinecone index creation and configuration
   - Stores document embeddings with metadata
   - Supports batch upserts for performance

4. **Assistant** (`lib/rag/assistant.ts`)
   - Queries the vector database for relevant documents
   - Generates AI responses using context from retrieved documents
   - Maintains conversation history by ID

### LLM Layer

5. **LLM Provider Interface** (`lib/llm/provider.ts`)
   - Abstract interface for LLM providers
   - Supports conversation history management
   - Easy to implement custom providers

6. **Gemini Provider** (`lib/llm/gemini.ts`)
   - Default implementation using Google's Gemini AI
   - Manages conversation memory by ID
   - Supports both simple and history-aware generation

### Main RAG System

7. **RAG** (`lib/rag-system.ts`)
   - Orchestrates all components
   - Provides high-level API for common operations
   - Simplifies initialization and usage

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env

# Edit .env with your API keys
# PINECONE_API_KEY=your_pinecone_api_key
# PINECONE_INDEX_NAME=your_index_name
# GEMINI_API_KEY=your_gemini_api_key
```

## Usage

### Basic Usage

```typescript
import { RAG } from './lib/rag-system';
import { Document } from './lib/rag';

// Initialize RAG system
const rag = new RAG({
  pineconeApiKey: process.env.PINECONE_API_KEY!,
  pineconeIndexName: process.env.PINECONE_INDEX_NAME!,
  geminiApiKey: process.env.GEMINI_API_KEY!,
  namespace: 'my-documents',
  chunkSize: 1000,
  chunkOverlap: 200,
  topK: 5,
});

// Initialize the index
await rag.initialize();

// Add documents
const documents: Document[] = [
  {
    id: 'doc1',
    content: 'Your document content here...',
    metadata: { title: 'Document 1' },
  },
];

await rag.addDocuments(documents);

// Query the system
const response = await rag.ask('What is in the documents?');
console.log(response.answer);

// Query with conversation memory
const conversationId = 'user-123';
const response1 = await rag.ask('What is AI?', conversationId);
const response2 = await rag.ask('Tell me more about it', conversationId);

// Get conversation history
const history = rag.getHistory(conversationId);

// Clear conversation
rag.clearHistory(conversationId);
```

### Advanced Usage with Individual Classes

```typescript
import { DataProcessor, Embedder, Indexer, Assistant } from './lib/rag';
import { GeminiProvider } from './lib/llm';

// Initialize components separately
const dataProcessor = new DataProcessor(1000, 200);
const embedder = new Embedder(geminiApiKey);
const indexer = new Indexer(pineconeApiKey, indexName, embedder);
const llmProvider = new GeminiProvider(geminiApiKey);
const assistant = new Assistant(pineconeApiKey, indexName, embedder, llmProvider);

// Process documents
const processed = dataProcessor.processDocuments(documents);
const chunks = dataProcessor.chunkDocuments(processed);

// Index chunks
await indexer.indexDocuments(chunks);

// Query
const response = await assistant.ask('Your question here');
```

### Custom LLM Provider

```typescript
import { LLMProvider, Message } from './lib/llm';

class CustomProvider implements LLMProvider {
  async generateResponse(prompt: string, conversationId?: string): Promise<string> {
    // Your custom implementation
    return 'Response from custom LLM';
  }

  async generateResponseWithHistory(messages: Message[], conversationId?: string): Promise<string> {
    // Your custom implementation with history
    return 'Response with history';
  }

  clearHistory(conversationId: string): void {
    // Clear conversation history
  }

  getHistory(conversationId: string): Message[] {
    // Return conversation history
    return [];
  }
}

// Use custom provider
const rag = new RAG({
  pineconeApiKey: process.env.PINECONE_API_KEY!,
  pineconeIndexName: process.env.PINECONE_INDEX_NAME!,
  geminiApiKey: process.env.GEMINI_API_KEY!, // Still needed for embeddings
  llmProvider: new CustomProvider(), // Your custom LLM
});
```

## Examples

See the `examples/` directory for complete working examples:

- `basic-usage.ts` - Simple RAG usage with the main RAG class
- `advanced-usage.ts` - Using individual classes for fine-grained control
- `custom-llm-provider.ts` - Implementing and using a custom LLM provider

## Running Examples

```bash
# Run basic example
npx tsx examples/basic-usage.ts

# Run advanced example
npx tsx examples/advanced-usage.ts

# Run custom provider example
npx tsx examples/custom-llm-provider.ts
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## API Reference

### RAG Class

- `initialize()` - Initialize the Pinecone index
- `addDocuments(documents)` - Add and index documents
- `ask(question, conversationId?)` - Ask a question and get an AI response
- `search(query, topK?)` - Search for similar documents
- `clearHistory(conversationId)` - Clear conversation history
- `getHistory(conversationId)` - Get conversation history
- `deleteDocuments(ids)` - Delete specific documents
- `deleteAll()` - Delete all documents
- `getStats()` - Get index statistics

### DataProcessor Class

- `processDocument(document)` - Clean and normalize a document
- `processDocuments(documents)` - Process multiple documents
- `chunkDocument(document)` - Chunk a document
- `chunkDocuments(documents)` - Chunk multiple documents
- `processAndChunk(documents)` - Process and chunk in one step

### Embedder Class

- `embedText(text)` - Generate embedding for text
- `embedTexts(texts)` - Generate embeddings for multiple texts
- `getDimension()` - Get embedding dimension

### Indexer Class

- `initializeIndex(dimension)` - Initialize Pinecone index
- `indexDocument(document)` - Index a single document
- `indexDocuments(documents)` - Index multiple documents
- `deleteDocuments(ids)` - Delete documents by IDs
- `deleteAll()` - Delete all documents
- `getStats()` - Get index statistics

### Assistant Class

- `ask(question, conversationId?, topK?)` - Ask a question
- `search(query, topK?)` - Search for similar documents
- `clearHistory(conversationId)` - Clear conversation history
- `getHistory(conversationId)` - Get conversation history

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
