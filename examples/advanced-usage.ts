import { DataProcessor, PineconeService, Assistant } from '../lib/rag';
import { GeminiProvider } from '../lib/llm';
import { Document } from '../lib/rag';

/**
 * Advanced example showing individual class usage
 */
async function advancedExample() {
  console.log('=== Advanced RAG Example ===\n');

  // Step 1: Initialize components individually
  console.log('Step 1: Initializing components...');

  const dataProcessor = new DataProcessor(500, 100);
  
  // PineconeService handles both embedding and indexing
  const pineconeService = new PineconeService(
    process.env.PINECONE_API_KEY!,
    process.env.PINECONE_INDEX_NAME!,
    'advanced-example'
  );
  
  const llmProvider = new GeminiProvider(process.env.GEMINI_API_KEY!);
  const assistant = new Assistant(
    pineconeService,
    llmProvider,
    3
  );

  // Step 2: Process documents
  console.log('\nStep 2: Processing documents...');

  const rawDocuments: Document[] = [
    {
      id: 'python-intro',
      content: `
        Python is a high-level, interpreted programming language known for its simplicity and
        readability. Created by Guido van Rossum and first released in 1991, Python emphasizes
        code readability with its use of significant indentation. It supports multiple programming
        paradigms including procedural, object-oriented, and functional programming. Python has
        a comprehensive standard library and is widely used in web development, data science,
        artificial intelligence, scientific computing, and automation.
      `,
      metadata: {
        language: 'Python',
        topic: 'Introduction',
      },
    },
    {
      id: 'javascript-intro',
      content: `
        JavaScript is a high-level, interpreted programming language that conforms to the
        ECMAScript specification. JavaScript is a core technology of the World Wide Web,
        alongside HTML and CSS. It enables interactive web pages and is an essential part
        of web applications. Most websites use it for client-side page behavior, and all
        major web browsers have a dedicated JavaScript engine to execute it. JavaScript
        is also used on the server-side through platforms like Node.js.
      `,
      metadata: {
        language: 'JavaScript',
        topic: 'Introduction',
      },
    },
  ];

  const processedDocs = dataProcessor.processDocuments(rawDocuments);
  console.log(`Processed ${processedDocs.length} documents`);

  // Step 3: Chunk documents
  console.log('\nStep 3: Chunking documents...');

  const chunks = dataProcessor.chunkDocuments(processedDocs);
  console.log(`Created ${chunks.length} chunks`);
  chunks.forEach((chunk) => {
    console.log(`  - ${chunk.id}: ${chunk.content.length} characters`);
  });

  // Step 4: Initialize index
  console.log('\nStep 4: Initializing Pinecone index...');

  const dimension = await pineconeService.getDimension();
  console.log(`Embedding dimension: ${dimension}`);
  await pineconeService.initializeIndex(dimension);

  // Step 5: Index chunks (PineconeService handles both embedding and indexing)
  console.log('\nStep 5: Indexing chunks...');

  await pineconeService.indexDocuments(chunks);
  console.log('Chunks indexed successfully');

  // Step 6: Query using Assistant
  console.log('\nStep 6: Querying the system...');

  const conversationId = 'advanced-user-456';

  // First query
  const response1 = await assistant.ask(
    'What programming languages are mentioned?',
    conversationId
  );
  console.log('\nQ: What programming languages are mentioned?');
  console.log('A:', response1.answer);
  console.log('Sources used:', response1.sources.length);

  // Follow-up query with conversation memory
  const response2 = await assistant.ask(
    'Which one is better for web development?',
    conversationId
  );
  console.log('\nQ: Which one is better for web development?');
  console.log('A:', response2.answer);

  // Step 7: Direct search without LLM
  console.log('\nStep 7: Direct similarity search...');

  const searchResults = await assistant.search('Python features', 2);
  console.log('Search results:');
  searchResults.forEach((result, idx) => {
    console.log(`\n${idx + 1}. Score: ${result.score.toFixed(4)}`);
    console.log(`   Content: ${result.content.substring(0, 150)}...`);
  });

  // Step 8: Check conversation history
  console.log('\nStep 8: Conversation history...');

  const history = assistant.getHistory(conversationId);
  console.log(`Total messages: ${history.length}`);
  history.forEach((msg, idx) => {
    console.log(`  ${idx + 1}. ${msg.role}: ${msg.content.substring(0, 80)}...`);
  });

  // Step 9: Get index stats
  console.log('\nStep 9: Index statistics...');

  const stats = await pineconeService.getStats();
  console.log('Index stats:', JSON.stringify(stats, null, 2));

  // Step 10: Cleanup
  console.log('\nStep 10: Cleaning up...');

  assistant.clearHistory(conversationId);
  console.log('Conversation history cleared');

  console.log('\nAdvanced example completed!');
}

// Run the example
if (require.main === module) {
  advancedExample().catch(console.error);
}

export { advancedExample };
