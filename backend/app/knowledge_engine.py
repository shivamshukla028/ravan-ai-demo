"""
Ravan AI — Knowledge Engine
PDF Processing Pipeline:
  1. Extract text from PDF (pdfplumber, PyPDF2 fallback)
  2. Smart chunking with page tracking
  3. Embed chunks (sentence-transformers local, OpenAI fallback)
  4. Store in ChromaDB (user-isolated collections)
  5. Semantic search with source citations
  6. RAG Q&A with streaming
"""
import os
import uuid
import json
import asyncio
from typing import List, Dict, Optional, Tuple, AsyncGenerator
from pathlib import Path

# ─── Config ───────────────────────────────────────────────────────────────────

CHROMA_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
UPLOADS_PATH = os.path.join(os.path.dirname(__file__), "..", "uploads")
CHUNK_SIZE = 800           # Characters per chunk
CHUNK_OVERLAP = 100        # Character overlap between chunks
MAX_FILE_SIZE = 52_428_800 # 50MB
ALLOWED_TYPES = {".pdf"}

# Ensure directories exist
Path(CHROMA_DB_PATH).mkdir(parents=True, exist_ok=True)
Path(UPLOADS_PATH).mkdir(parents=True, exist_ok=True)

# ─── ChromaDB Client ──────────────────────────────────────────────────────────

_chroma_client = None

def get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        import chromadb
        _chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    return _chroma_client


def get_user_collection(user_id: int):
    """Each user gets their own ChromaDB collection for complete isolation."""
    client = get_chroma_client()
    collection_name = f"user_{user_id}_knowledge"
    return client.get_or_create_collection(
        name=collection_name,
        metadata={"user_id": str(user_id)},
    )


# ─── Embedding Engine ─────────────────────────────────────────────────────────

_embedding_model = None
_embedding_type = None

def get_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings. Uses sentence-transformers (local, free) as primary.
    Falls back to OpenAI if OPENAI_API_KEY is set and sentence-transformers fails.
    """
    global _embedding_model, _embedding_type

    # Try sentence-transformers (local, no API key needed)
    if _embedding_type != "openai":
        try:
            if _embedding_model is None:
                from sentence_transformers import SentenceTransformer
                _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
                _embedding_type = "local"
            embeddings = _embedding_model.encode(texts, normalize_embeddings=True)
            return embeddings.tolist()
        except Exception as e:
            print(f"[KB] sentence-transformers failed: {e}, trying OpenAI...")

    # Fallback: OpenAI embeddings
    openai_key = os.getenv("OPENAI_API_KEY", "")
    if openai_key and not openai_key.startswith("your-"):
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=texts,
            )
            _embedding_type = "openai"
            return [item.embedding for item in response.data]
        except Exception as e:
            raise RuntimeError(f"Both embedding methods failed. Last error: {e}")

    raise RuntimeError(
        "No embedding model available. Install sentence-transformers or set OPENAI_API_KEY."
    )


# ─── PDF Text Extraction ──────────────────────────────────────────────────────

def extract_pdf_text(file_path: str) -> Tuple[List[Dict], int]:
    """
    Extract text from PDF page by page.
    Returns: (pages_data, total_pages)
    pages_data: [{"page": 1, "text": "..."}]
    """
    pages_data = []

    # Try pdfplumber first (better layout detection)
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            total_pages = len(pdf.pages)
            for i, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                if text.strip():
                    pages_data.append({"page": i + 1, "text": text})
        if pages_data:
            return pages_data, total_pages
    except Exception as e:
        print(f"[KB] pdfplumber failed: {e}")

    # Fallback: PyPDF2
    try:
        import PyPDF2
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            total_pages = len(reader.pages)
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    pages_data.append({"page": i + 1, "text": text})
        return pages_data, total_pages
    except Exception as e:
        raise RuntimeError(f"PDF text extraction failed: {e}")


# ─── Text Chunking ────────────────────────────────────────────────────────────

def chunk_pages(pages_data: List[Dict]) -> List[Dict]:
    """
    Split page text into overlapping chunks, preserving page number metadata.
    Returns: [{"chunk_index": 0, "content": "...", "page_number": 1}]
    """
    chunks = []
    chunk_index = 0

    for page in pages_data:
        text = page["text"]
        page_num = page["page"]
        start = 0

        while start < len(text):
            end = start + CHUNK_SIZE
            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append({
                    "chunk_index": chunk_index,
                    "content": chunk_text,
                    "page_number": page_num,
                })
                chunk_index += 1
            start = end - CHUNK_OVERLAP
            if start >= len(text):
                break

    return chunks


# ─── Main Processing Pipeline ─────────────────────────────────────────────────

def process_pdf_sync(
    file_path: str,
    document_id: int,
    user_id: int,
    db_session,
) -> Dict:
    """
    Synchronous PDF processing pipeline. Run this in a background thread.
    Updates document status in the DB.
    """
    from .models import Document, DocumentChunk

    doc = db_session.query(Document).filter(Document.id == document_id).first()
    if not doc:
        return {"error": "Document not found"}

    try:
        # Step 1: Extract text
        print(f"[KB] Extracting text from {file_path}")
        pages_data, total_pages = extract_pdf_text(file_path)
        doc.page_count = total_pages

        if not pages_data:
            doc.status = "failed"
            doc.error_message = "No readable text found in PDF (may be image-only)"
            db_session.commit()
            return {"error": doc.error_message}

        # Step 2: Chunk text
        print(f"[KB] Chunking {len(pages_data)} pages")
        chunks = chunk_pages(pages_data)

        if not chunks:
            doc.status = "failed"
            doc.error_message = "Text extraction produced no usable chunks"
            db_session.commit()
            return {"error": doc.error_message}

        # Step 3: Generate embeddings (batch)
        print(f"[KB] Generating embeddings for {len(chunks)} chunks")
        texts = [c["content"] for c in chunks]
        embeddings = get_embeddings(texts)

        # Step 4: Store in ChromaDB
        print(f"[KB] Storing in ChromaDB for user {user_id}")
        collection = get_user_collection(user_id)

        chroma_ids = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chroma_id = f"doc_{document_id}_chunk_{i}_{uuid.uuid4().hex[:8]}"
            collection.add(
                ids=[chroma_id],
                embeddings=[embedding],
                documents=[chunk["content"]],
                metadatas=[{
                    "document_id": document_id,
                    "user_id": user_id,
                    "chunk_index": chunk["chunk_index"],
                    "page_number": chunk.get("page_number", 1),
                    "filename": doc.filename,
                }],
            )
            chroma_ids.append(chroma_id)
            chunk["chroma_id"] = chroma_id

        # Step 5: Save chunks to relational DB
        print(f"[KB] Saving {len(chunks)} chunks to database")
        for chunk in chunks:
            db_chunk = DocumentChunk(
                document_id=document_id,
                chunk_index=chunk["chunk_index"],
                content=chunk["content"],
                page_number=chunk.get("page_number"),
                chroma_id=chunk.get("chroma_id"),
                token_count=len(chunk["content"].split()),
            )
            db_session.add(db_chunk)

        # Step 6: Update document record
        doc.chunk_count = len(chunks)
        doc.chroma_collection = f"user_{user_id}_knowledge"
        doc.status = "ready"
        doc.error_message = None
        db_session.commit()

        print(f"[KB] ✓ Document {document_id} processed: {len(chunks)} chunks, {total_pages} pages")
        return {"success": True, "chunks": len(chunks), "pages": total_pages}

    except Exception as e:
        import traceback
        error_msg = f"Processing error: {str(e)}"
        print(f"[KB] ERROR: {error_msg}")
        print(traceback.format_exc())
        try:
            doc.status = "failed"
            doc.error_message = error_msg[:500]
            db_session.commit()
        except Exception:
            db_session.rollback()
        return {"error": error_msg}


# ─── Semantic Search ──────────────────────────────────────────────────────────

def semantic_search(
    query: str,
    user_id: int,
    limit: int = 5,
    document_ids: Optional[List[int]] = None,
) -> List[Dict]:
    """
    Semantic search in user's knowledge base.
    Returns ranked results with source metadata.
    """
    collection = get_user_collection(user_id)
    collection_count = collection.count()
    if collection_count == 0:
        return []

    # Generate query embedding
    query_embedding = get_embeddings([query])[0]

    # Build where filter
    where = {"user_id": user_id}
    if document_ids:
        where = {"$and": [{"user_id": user_id}, {"document_id": {"$in": document_ids}}]}

    # Query ChromaDB
    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(limit, collection_count),
            where=where if not document_ids else None,
            include=["documents", "metadatas", "distances"],
        )
    except Exception:
        # Retry without filter if filter fails (e.g., no matching docs)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(limit, collection_count),
            include=["documents", "metadatas", "distances"],
        )

    if not results["ids"] or not results["ids"][0]:
        return []

    search_results = []
    for i, (doc_text, metadata, distance) in enumerate(zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    )):
        # Filter by user_id and optional document_ids
        if metadata.get("user_id") != user_id:
            continue
        if document_ids and metadata.get("document_id") not in document_ids:
            continue

        # Convert distance to relevance score (0-1, higher = more relevant)
        relevance = max(0.0, 1.0 - float(distance))

        search_results.append({
            "document_id": metadata.get("document_id"),
            "filename": metadata.get("filename", "Unknown"),
            "chunk_content": doc_text,
            "page_number": metadata.get("page_number"),
            "chunk_index": metadata.get("chunk_index", i),
            "relevance_score": round(relevance, 3),
        })

    # Sort by relevance
    search_results.sort(key=lambda x: x["relevance_score"], reverse=True)
    return search_results


# ─── RAG Query ────────────────────────────────────────────────────────────────

async def rag_query_stream(
    question: str,
    user_id: int,
    model: str = "gpt-4o",
    document_ids: Optional[List[int]] = None,
    max_context_chunks: int = 5,
) -> AsyncGenerator[str, None]:
    """
    RAG Q&A: retrieve context → inject into prompt → stream answer.
    Yields SSE-style chunks.
    """
    # 1. Retrieve relevant chunks
    context_chunks = semantic_search(
        query=question,
        user_id=user_id,
        limit=max_context_chunks,
        document_ids=document_ids,
    )

    if not context_chunks:
        yield json.dumps({"type": "error", "content": "No relevant documents found in your knowledge base."})
        return

    # 2. Build context string with citations
    context_parts = []
    citations = []
    for i, chunk in enumerate(context_chunks, 1):
        citation_ref = f"[Source {i}: {chunk['filename']}, Page {chunk.get('page_number', '?')}]"
        context_parts.append(f"{citation_ref}\n{chunk['chunk_content']}")
        citations.append({
            "ref": i,
            "filename": chunk["filename"],
            "page_number": chunk.get("page_number"),
            "chunk_content": chunk["chunk_content"][:200] + "..." if len(chunk["chunk_content"]) > 200 else chunk["chunk_content"],
            "relevance_score": chunk["relevance_score"],
            "document_id": chunk["document_id"],
        })

    context_text = "\n\n---\n\n".join(context_parts)

    # 3. Build RAG system prompt
    rag_system_prompt = f"""You are Ravan AI, an expert cybersecurity intelligence assistant by Qyntraix Cyber Defence.
Answer the user's question ONLY using the provided document context below.
Always cite your sources using [Source N] notation inline.
If the answer is not in the provided context, clearly state that.

DOCUMENT CONTEXT:
{context_text}"""

    # 4. Stream AI response using the existing ai_router
    from .ai_router import stream_chat

    # Send citations metadata first
    yield json.dumps({"type": "citations", "citations": citations})
    yield "\n\n"

    messages = [{"role": "user", "content": question}]
    async for chunk in stream_chat(messages=messages, model=model, system_prompt=rag_system_prompt):
        yield json.dumps({"type": "chunk", "content": chunk})
        yield "\n\n"

    yield json.dumps({"type": "done"})
    yield "\n\n"


# ─── Cleanup ──────────────────────────────────────────────────────────────────

def delete_document_vectors(document_id: int, user_id: int) -> bool:
    """Remove all ChromaDB entries for a document."""
    try:
        collection = get_user_collection(user_id)
        # Get all IDs for this document
        results = collection.get(
            where={"document_id": document_id},
            include=[],
        )
        if results["ids"]:
            collection.delete(ids=results["ids"])
            print(f"[KB] Deleted {len(results['ids'])} vectors for document {document_id}")
        return True
    except Exception as e:
        print(f"[KB] Error deleting vectors for document {document_id}: {e}")
        return False
