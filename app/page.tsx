export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Next.js RAG with Pinecone
        </h1>
        <div className="bg-white/10 rounded-lg p-8 backdrop-blur-sm">
          <p className="text-lg mb-4">
            A Retrieval-Augmented Generation (RAG) system built with:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li>Next.js for the web framework</li>
            <li>Pinecone for embeddings and vector storage</li>
            <li>Gemini AI for LLM responses</li>
            <li>TypeScript for type safety</li>
          </ul>
          <h2 className="text-2xl font-semibold mb-4">Features:</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>DataProcessor class for document processing and chunking</li>
            <li>PineconeService class for embeddings and vector storage</li>
            <li>Assistant class for querying and generating responses</li>
            <li>LLM abstraction layer (default: Gemini AI)</li>
            <li>Conversation memory stored by ID</li>
          </ul>
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm opacity-70">
            Check the <code className="bg-black/20 px-2 py-1 rounded">examples</code> directory for usage examples
          </p>
        </div>
      </div>
    </main>
  );
}
