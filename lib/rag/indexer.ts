import { Pinecone, RecordMetadata } from '@pinecone-database/pinecone';
import { ChunkedDocument } from './data-processor';
import { Embedder } from './embedder';

/**
 * Vector record interface
 */
export interface VectorRecord {
  id: string;
  values: number[];
  metadata: RecordMetadata;
}

/**
 * Indexer class for indexing and storing documents in Pinecone
 */
export class Indexer {
  private pinecone: Pinecone;
  private indexName: string;
  private embedder: Embedder;
  private namespace?: string;

  constructor(
    apiKey: string,
    indexName: string,
    embedder: Embedder,
    namespace?: string
  ) {
    this.pinecone = new Pinecone({ apiKey });
    this.indexName = indexName;
    this.embedder = embedder;
    this.namespace = namespace;
  }

  /**
   * Initialize the index (create if doesn't exist)
   */
  async initializeIndex(dimension: number): Promise<void> {
    try {
      const existingIndexes = await this.pinecone.listIndexes();
      const indexExists = existingIndexes.indexes?.some(
        (index) => index.name === this.indexName
      );

      if (!indexExists) {
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
            },
          },
        });

        // Wait for index to be ready
        await this.waitForIndexReady();
      }
    } catch (error) {
      console.error('Error initializing index:', error);
      throw error;
    }
  }

  /**
   * Wait for index to be ready
   */
  private async waitForIndexReady(maxWaitTime: number = 60000): Promise<void> {
    const startTime = Date.now();
    const index = this.pinecone.index(this.indexName);

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const stats = await index.describeIndexStats();
        if (stats) {
          return;
        }
      } catch (error) {
        // Index not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error('Index initialization timeout');
  }

  /**
   * Index a single document
   */
  async indexDocument(document: ChunkedDocument): Promise<void> {
    const embedding = await this.embedder.embedText(document.content);
    const index = this.pinecone.index(this.indexName);

    const vector: VectorRecord = {
      id: document.id,
      values: embedding.values,
      metadata: {
        ...document.metadata,
        content: document.content,
      } as RecordMetadata,
    };

    await index.namespace(this.namespace || '').upsert([vector]);
  }

  /**
   * Index multiple documents
   */
  async indexDocuments(documents: ChunkedDocument[]): Promise<void> {
    if (documents.length === 0) {
      return;
    }

    // Generate embeddings for all documents
    const embeddings = await this.embedder.embedTexts(
      documents.map((doc) => doc.content)
    );

    // Create vector records
    const vectors: VectorRecord[] = documents.map((doc, idx) => ({
      id: doc.id,
      values: embeddings[idx].values,
      metadata: {
        ...doc.metadata,
        content: doc.content,
      } as RecordMetadata,
    }));

    // Upsert in batches
    const batchSize = 100;
    const index = this.pinecone.index(this.indexName);

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.namespace(this.namespace || '').upsert(batch);
    }
  }

  /**
   * Delete documents by IDs
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    const index = this.pinecone.index(this.indexName);
    await index.namespace(this.namespace || '').deleteMany(ids);
  }

  /**
   * Delete all documents in namespace
   */
  async deleteAll(): Promise<void> {
    const index = this.pinecone.index(this.indexName);
    await index.namespace(this.namespace || '').deleteAll();
  }

  /**
   * Get index statistics
   */
  async getStats(): Promise<any> {
    const index = this.pinecone.index(this.indexName);
    return await index.describeIndexStats();
  }
}
