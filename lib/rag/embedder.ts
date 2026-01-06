import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Embedding result interface
 */
export interface Embedding {
  values: number[];
  dimension: number;
}

/**
 * Embedder class for generating text embeddings
 */
export class Embedder {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(
    apiKey: string,
    modelName: string = 'text-embedding-004'
  ) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  /**
   * Generate embedding for a single text
   */
  async embedText(text: string): Promise<Embedding> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    const result = await model.embedContent(text);
    const values = result.embedding.values;

    return {
      values,
      dimension: values.length,
    };
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embedTexts(texts: string[]): Promise<Embedding[]> {
    const embeddings: Embedding[] = [];

    // Process in batches to avoid rate limits
    const batchSize = 100;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map((text) => this.embedText(text))
      );
      embeddings.push(...batchEmbeddings);
    }

    return embeddings;
  }

  /**
   * Get the dimension of embeddings produced by this embedder
   */
  async getDimension(): Promise<number> {
    // Generate a test embedding to get dimension
    const testEmbedding = await this.embedText('test');
    return testEmbedding.dimension;
  }
}
