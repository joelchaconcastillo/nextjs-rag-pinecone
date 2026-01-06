/**
 * Document interface for processing
 */
export interface Document {
  id: string;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Chunked document interface
 */
export interface ChunkedDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  chunkIndex: number;
  originalDocId: string;
}

/**
 * DataProcessor class for processing and chunking documents
 */
export class DataProcessor {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(chunkSize: number = 1000, chunkOverlap: number = 200) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  /**
   * Process a single document
   */
  processDocument(document: Document): Document {
    // Clean and normalize the document
    const cleanedContent = this.cleanText(document.content);
    return {
      ...document,
      content: cleanedContent,
    };
  }

  /**
   * Process multiple documents
   */
  processDocuments(documents: Document[]): Document[] {
    return documents.map((doc) => this.processDocument(doc));
  }

  /**
   * Clean text content
   */
  private cleanText(text: string): string {
    // Remove extra whitespace
    let cleaned = text.replace(/\s+/g, ' ');
    // Trim
    cleaned = cleaned.trim();
    // Remove special characters that might cause issues
    cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    return cleaned;
  }

  /**
   * Chunk a single document into smaller pieces
   */
  chunkDocument(document: Document): ChunkedDocument[] {
    const chunks: ChunkedDocument[] = [];
    const content = document.content;
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < content.length) {
      // Calculate end index
      const endIndex = Math.min(startIndex + this.chunkSize, content.length);

      // Extract chunk
      let chunk = content.substring(startIndex, endIndex);

      // Try to break at sentence or word boundary if not at the end
      if (endIndex < content.length) {
        // Try to find last sentence boundary
        const lastPeriod = chunk.lastIndexOf('. ');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);

        if (breakPoint > this.chunkSize / 2) {
          // Break at sentence boundary
          chunk = chunk.substring(0, breakPoint + 1);
        } else {
          // Try to break at word boundary
          const lastSpace = chunk.lastIndexOf(' ');
          if (lastSpace > this.chunkSize / 2) {
            chunk = chunk.substring(0, lastSpace);
          }
        }
      }

      // Create chunked document
      chunks.push({
        id: `${document.id}_chunk_${chunkIndex}`,
        content: chunk.trim(),
        metadata: {
          ...document.metadata,
          originalDocId: document.id,
          chunkIndex,
          totalChunks: 0, // Will be updated after
        },
        chunkIndex,
        originalDocId: document.id,
      });

      // Move to next chunk with overlap
      startIndex += chunk.length - this.chunkOverlap;
      chunkIndex++;
    }

    // Update total chunks
    chunks.forEach((chunk) => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }

  /**
   * Chunk multiple documents
   */
  chunkDocuments(documents: Document[]): ChunkedDocument[] {
    const allChunks: ChunkedDocument[] = [];
    documents.forEach((doc) => {
      const chunks = this.chunkDocument(doc);
      allChunks.push(...chunks);
    });
    return allChunks;
  }

  /**
   * Process and chunk documents in one step
   */
  processAndChunk(documents: Document[]): ChunkedDocument[] {
    const processed = this.processDocuments(documents);
    return this.chunkDocuments(processed);
  }
}
