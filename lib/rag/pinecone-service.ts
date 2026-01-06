import { Pinecone, RecordMetadata } from '@pinecone-database/pinecone';
import { ChunkedDocument } from './data-processor';

/**
 * Embedding result interface
 */
export interface Embedding {
  values: number[];
  dimension: number;
}

/**
 * Vector record interface
 */
export interface VectorRecord {
  id: string;
  values: number[];
  metadata: RecordMetadata;
}

/**
 * PineconeService class for both embedding generation and vector storage
 * Combines embedding and indexing functionality using Pinecone
 */
export class PineconeService {
  private pinecone: Pinecone;
  private indexName: string;
  private namespace?: string;
  private embeddingModel: string;

  constructor(
    apiKey: string,
    indexName: string,
    namespace?: string,
    embeddingModel: string = 'multilingual-e5-large'
  ) {
    this.pinecone = new Pinecone({ apiKey });
    this.indexName = indexName;
    this.namespace = namespace;
    this.embeddingModel = embeddingModel;
  }

  /**
   * Generate embedding for a single text using Pinecone Inference API
   */
  async embedText(text: string): Promise<Embedding> {
    const result = await this.pinecone.inference.embed(
      this.embeddingModel,
      [text],
      { inputType: 'passage' }
    );

    // Access the data property which contains the array of embeddings
    const embeddingData = result.data?.[0];
    if (!embeddingData) {
      throw new Error('No embedding data returned from Pinecone');
    }

    // Check if this is a dense embedding (which has values)
    const values = 'values' in embeddingData ? embeddingData.values : [];
    if (!values || values.length === 0) {
      throw new Error('No embedding values returned from Pinecone');
    }

    return {
      values,
      dimension: values.length,
    };
  }

  /**
   * Generate embeddings for multiple texts using Pinecone Inference API
   */
  async embedTexts(texts: string[]): Promise<Embedding[]> {
    // Process in batches to avoid rate limits
    const batchSize = 96; // Pinecone's batch limit
    const allEmbeddings: Embedding[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const result = await this.pinecone.inference.embed(
        this.embeddingModel,
        batch,
        { inputType: 'passage' }
      );

      // Access the data property which contains the array of embeddings
      if (!result.data) {
        throw new Error('No embedding data returned from Pinecone');
      }

      const batchEmbeddings = result.data.map((emb) => {
        const values = 'values' in emb ? emb.values : [];
        return {
          values: values || [],
          dimension: values?.length || 0,
        };
      });

      allEmbeddings.push(...batchEmbeddings);
    }

    return allEmbeddings;
  }

  /**
   * Get the dimension of embeddings produced by this model
   */
  async getDimension(): Promise<number> {
    // Generate a test embedding to get dimension
    const testEmbedding = await this.embedText('test');
    return testEmbedding.dimension;
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
   * Index a single document (embed and store)
   */
  async indexDocument(document: ChunkedDocument): Promise<void> {
    const embedding = await this.embedText(document.content);
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
   * Index multiple documents (embed and store)
   */
  async indexDocuments(documents: ChunkedDocument[]): Promise<void> {
    if (documents.length === 0) {
      return;
    }

    // Generate embeddings for all documents
    const embeddings = await this.embedTexts(
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
   * Query the index for similar vectors
   */
  async query(
    queryText: string,
    topK: number = 5
  ): Promise<Array<{
    id: string;
    score: number;
    metadata?: RecordMetadata;
  }>> {
    // Generate embedding for query
    const queryEmbedding = await this.embedText(queryText);

    // Query Pinecone
    const index = this.pinecone.index(this.indexName);
    const queryResponse = await index.namespace(this.namespace || '').query({
      vector: queryEmbedding.values,
      topK,
      includeMetadata: true,
    });

    return (queryResponse.matches || []).map((match) => ({
      id: match.id,
      score: match.score || 0,
      metadata: match.metadata,
    }));
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

  /**
   * Get the Pinecone client instance
   */
  getPineconeClient(): Pinecone {
    return this.pinecone;
  }

  /**
   * Get the index name
   */
  getIndexName(): string {
    return this.indexName;
  }

  /**
   * Get the namespace
   */
  getNamespace(): string | undefined {
    return this.namespace;
  }
}
