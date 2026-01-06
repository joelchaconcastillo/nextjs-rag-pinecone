import 'dotenv/config';
import { RAG } from '../lib/rag-system';
import { Document } from '../lib/rag';

/**
 * Basic RAG usage example
 */
async function basicExample() {
  // Initialize RAG system
  const rag = new RAG({
    pineconeApiKey: process.env.PINECONE_API_KEY!,
    pineconeIndexName: process.env.PINECONE_INDEX_NAME!,
    geminiApiKey: process.env.GEMINI_API_KEY!,
    namespace: 'example',
    chunkSize: 1000,
    chunkOverlap: 200,
    topK: 5,
  });

  // Initialize the index
  console.log('Initializing RAG system...');
  await rag.initialize();

  // Create some sample documents
  const documents: Document[] = [
    {
      id: 'doc1',
      content: `
        Artificial Intelligence (AI) is the simulation of human intelligence processes by machines,
        especially computer systems. These processes include learning (the acquisition of information
        and rules for using the information), reasoning (using rules to reach approximate or definite
        conclusions), and self-correction. AI has applications in various fields including healthcare,
        finance, transportation, and entertainment.
      `,
      metadata: {
        title: 'Introduction to AI',
        category: 'technology',
      },
    },
    {
      id: 'doc2',
      content: `
        Machine Learning (ML) is a subset of AI that focuses on the development of algorithms and
        statistical models that enable computer systems to improve their performance on a specific
        task through experience. ML algorithms build a model based on sample data, known as training
        data, to make predictions or decisions without being explicitly programmed to do so.
      `,
      metadata: {
        title: 'Machine Learning Basics',
        category: 'technology',
      },
    },
    {
      id: 'doc3',
      content: `
        Natural Language Processing (NLP) is a branch of AI that helps computers understand,
        interpret, and manipulate human language. NLP draws from many disciplines, including
        computer science and computational linguistics, to bridge the gap between human
        communication and computer understanding. Common NLP applications include chatbots,
        sentiment analysis, language translation, and text summarization.
      `,
      metadata: {
        title: 'Natural Language Processing',
        category: 'technology',
      },
    },
  ];

  // Add documents to the RAG system
  //console.log('Adding documents...');
  await rag.addDocuments(documents);

  console.log('Documents indexed successfully!');

  // Query the system
  console.log('\n--- Querying without conversation ---');
  const response1 = await rag.ask('What is Machine Learning?');
  console.log('Answer:', response1.answer);
  console.log('Sources:', response1.sources.length);

  // Query with conversation ID to maintain context
  console.log('\n--- Querying with conversation ID ---');
  const conversationId = 'user-123';

  const response2 = await rag.ask(
    'What is Artificial Intelligence?',
    conversationId
  );
  console.log('Answer:', response2.answer);

  const response3 = await rag.ask(
    'Can you tell me more about its applications?',
    conversationId
  );
  console.log('Follow-up Answer:', response3.answer);

  // Get conversation history
  console.log('\n--- Conversation History ---');
  const history = rag.getHistory(conversationId);
  console.log('Messages:', history.length);

  // Search for similar documents
  console.log('\n--- Searching for similar documents ---');
  const searchResults = await rag.search('NLP applications', 3);
  console.log('Search results:', searchResults.length);
  searchResults.forEach((result, idx) => {
    console.log(`Result ${idx + 1}:`, result.content.substring(0, 100) + '...');
  });

  // Get statistics
  console.log('\n--- Index Statistics ---');
  const stats = await rag.getStats();
  console.log('Stats:', JSON.stringify(stats, null, 2));

  // Clear conversation history
  rag.clearHistory(conversationId);
  console.log('\nConversation history cleared');

  console.log('\nExample completed!');
}

// Run the example
if (require.main === module) {
  basicExample().catch(console.error);
}

export { basicExample };
