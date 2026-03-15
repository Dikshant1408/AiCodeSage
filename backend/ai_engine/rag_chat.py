"""
RAG (Retrieval Augmented Generation) — Chat with your codebase.
Embeds code chunks, stores in ChromaDB, retrieves relevant context for queries.
"""
import hashlib
from typing import List, Dict

# In-memory store per session (replace with persistent ChromaDB for production)
_sessions: Dict[str, List[Dict]] = {}

def _chunk_code(files: Dict[str, str], chunk_size: int = 60) -> List[Dict]:
    """Split files into overlapping chunks for embedding."""
    chunks = []
    for filename, code in files.items():
        lines = code.splitlines()
        for i in range(0, len(lines), chunk_size - 10):
            chunk_lines = lines[i:i + chunk_size]
            chunks.append({
                "id": hashlib.md5(f"{filename}:{i}".encode()).hexdigest(),
                "filename": filename,
                "start_line": i + 1,
                "content": "\n".join(chunk_lines),
            })
    return chunks

def index_codebase(session_id: str, files: Dict[str, str]):
    """Index a set of files for a session."""
    try:
        import chromadb
        from chromadb.utils import embedding_functions

        client = chromadb.Client()
        ef = embedding_functions.DefaultEmbeddingFunction()

        # Delete existing collection if present
        try:
            client.delete_collection(f"code_{session_id}")
        except Exception:
            pass

        collection = client.create_collection(
            name=f"code_{session_id}",
            embedding_function=ef,
        )
        chunks = _chunk_code(files)
        if not chunks:
            return

        collection.add(
            ids=[c["id"] for c in chunks],
            documents=[c["content"] for c in chunks],
            metadatas=[{"filename": c["filename"], "start_line": c["start_line"]} for c in chunks],
        )
        # Store collection reference
        _sessions[session_id] = {"client": client, "collection": collection}

    except ImportError:
        # Fallback: store raw chunks in memory
        _sessions[session_id] = {"chunks": _chunk_code(files)}

def query_codebase(session_id: str, question: str) -> str:
    """Find relevant code chunks and answer the question using AI."""
    from ai_engine.groq_client import ask_ai

    session = _sessions.get(session_id)
    if not session:
        return "No codebase indexed for this session. Upload a project first."

    context_chunks = []

    if "collection" in session:
        results = session["collection"].query(query_texts=[question], n_results=5)
        for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
            context_chunks.append(f"# {meta['filename']} (line {meta['start_line']})\n{doc}")
    else:
        # Fallback: keyword search
        q_lower = question.lower()
        for chunk in session.get("chunks", []):
            if any(word in chunk["content"].lower() for word in q_lower.split()):
                context_chunks.append(f"# {chunk['filename']} (line {chunk['start_line']})\n{chunk['content']}")
            if len(context_chunks) >= 5:
                break

    if not context_chunks:
        return "No relevant code found for your question."

    context = "\n\n---\n\n".join(context_chunks)
    prompt = f"""You are an expert code assistant. A developer is asking about their codebase.

Relevant code from the codebase:
{context}

Developer's question: {question}

Answer clearly and reference specific files and line numbers where relevant."""

    return ask_ai(prompt)
