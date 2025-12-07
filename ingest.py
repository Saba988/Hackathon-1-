import os
import glob
from typing import List, Dict
from dotenv import load_dotenv

# LangChain / AI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# Vector DB
from pinecone import Pinecone

# Load environment variables from .env file
load_dotenv()

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "hackathon-chatbot")

def load_docs(docs_dir: str) -> List[Dict]:
    """
    Walks through the directory and loads all Markdown files.
    """
    documents = []
    print(f"Scanning directory: {docs_dir}")
    
    if not os.path.exists(docs_dir):
        raise FileNotFoundError(f"Directory not found: {docs_dir}")

    for root, _, files in os.walk(docs_dir):
        for file in files:
            if file.endswith(".md") or file.endswith(".mdx"):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                        # Relative path for citation/metadata
                        relative_path = os.path.relpath(file_path, docs_dir)
                        documents.append({
                            "content": content,
                            "source": relative_path,
                            "filename": file
                        })
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
    
    print(f"Loaded {len(documents)} documents.")
    return documents

def chunk_text(documents: List[Dict]) -> List[Dict]:
    """
    Splits documents into smaller chunks for embedding.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""]
    )
    
    chunks = []
    for doc in documents:
        # Split the content
        splits = text_splitter.split_text(doc["content"])
        
        for i, text in enumerate(splits):
            chunks.append({
                "id": f"{doc['source']}#{i}".replace("\\", "/"), # Normalize paths
                "text": text,
                "source": doc["source"],
                "filename": doc["filename"]
            })
            
    print(f"Created {len(chunks)} chunks from {len(documents)} documents.")
    return chunks

def ingest_data():
    # 1. Check Keys
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY is missing in .env")
    if not PINECONE_API_KEY:
        raise ValueError("PINECONE_API_KEY is missing in .env")

    # 2. Setup Clients
    print("Initializing AI models...")
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004",
        google_api_key=GOOGLE_API_KEY
    )
    
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX_NAME)

    # 3. Load Data
    # Assuming script is in backend/ingest.py and docs are in ../my-website/docs
    base_dir = os.path.dirname(os.path.abspath(__file__))
    docs_path = os.path.join(base_dir, "../my-website/docs")
    
    docs = load_docs(docs_path)
    if not docs:
        print("No documents found. Exiting.")
        return

    # 4. Chunk Data
    chunks = chunk_text(docs)

    # 5. Embed and Upsert (Batching)
    batch_size = 50
    total_batches = (len(chunks) + batch_size - 1) // batch_size
    
    print(f"Starting upload to Pinecone index '{PINECONE_INDEX_NAME}'...")
    
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        
        # Prepare data for embedding
        texts = [c["text"] for c in batch]
        
        # Generate Embeddings
        try:
            vectors = embeddings.embed_documents(texts)
        except Exception as e:
            print(f"Error embedding batch {i}: {e}")
            continue

        # Prepare vectors for Pinecone: (id, vector, metadata)
        to_upsert = []
        for j, vector in enumerate(vectors):
            item = batch[j]
            metadata = {
                "text": item["text"],
                "source": item["source"],
                "filename": item["filename"]
            }
            to_upsert.append((item["id"], vector, metadata))
        
        # Upsert
        try:
            index.upsert(vectors=to_upsert)
            print(f"Uploaded batch {i // batch_size + 1}/{total_batches}")
        except Exception as e:
             print(f"Error uploading batch {i}: {e}")

    print("Ingestion complete!")

if __name__ == "__main__":
    ingest_data()
