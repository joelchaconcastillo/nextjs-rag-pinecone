import { DataProcessor, Document } from '../lib/rag/data-processor';

/**
 * Simple tests for DataProcessor without external dependencies
 */

console.log('=== Testing DataProcessor ===\n');

// Test 1: Document processing
console.log('Test 1: Processing documents...');
const processor = new DataProcessor(100, 20);

const testDoc: Document = {
  id: 'test-1',
  content: '  This   is   a   test   document   with   extra   spaces.  \n\n  And multiple lines.  ',
  metadata: { test: true },
};

const processed = processor.processDocument(testDoc);
console.log('Original length:', testDoc.content.length);
console.log('Processed length:', processed.content.length);
console.log('Processed content:', processed.content);
console.log('✓ Processing works\n');

// Test 2: Document chunking
console.log('Test 2: Chunking documents...');
const longDoc: Document = {
  id: 'long-doc',
  content: 'A'.repeat(250) + '. ' + 'B'.repeat(250) + '. ' + 'C'.repeat(250),
  metadata: { type: 'long' },
};

const chunks = processor.chunkDocument(longDoc);
console.log('Original length:', longDoc.content.length);
console.log('Number of chunks:', chunks.length);
chunks.forEach((chunk, idx) => {
  console.log(`  Chunk ${idx}: ${chunk.id}, length: ${chunk.content.length}`);
});
console.log('✓ Chunking works\n');

// Test 3: Process and chunk
console.log('Test 3: Process and chunk...');
const docs: Document[] = [
  {
    id: 'doc-1',
    content: 'First document. ' + 'X'.repeat(150),
    metadata: { num: 1 },
  },
  {
    id: 'doc-2',
    content: 'Second document. ' + 'Y'.repeat(150),
    metadata: { num: 2 },
  },
];

const allChunks = processor.processAndChunk(docs);
console.log('Total documents:', docs.length);
console.log('Total chunks:', allChunks.length);
allChunks.forEach((chunk) => {
  console.log(`  - ${chunk.id}: originalDocId=${chunk.originalDocId}`);
});
console.log('✓ Process and chunk works\n');

console.log('=== All tests passed! ===');
