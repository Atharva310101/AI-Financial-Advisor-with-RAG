import os
from sqlalchemy.orm import Session
from sqlalchemy import select
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from app.models.domain import Chunk, AuditLog, Company, Document
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
# Configure Gemini
# Ensure GOOGLE_API_KEY is in your .env file
llm = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash", temperature=0)
embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def query_rag(db: Session, query_text: str, company_id: int):
    """
    1. Embeds the user query.
    2. Searches for semantically similar chunks in Postgres (pgvector).
    3. Constructs a context window.
    4. Sends to Gemini for an answer.
    5. Logs the interaction for audit.
    """
    
    # 1. Generate embedding for the question
    query_embedding = embeddings_model.embed_query(query_text)

    # 2. Vector Search in Postgres (L2 Distance)
    # We want chunks that match the company AND are semantically similar
    results = db.scalars(
        select(Chunk)
        .join(Chunk.document)
        .filter(Chunk.document.has(company_id=company_id))
        .order_by(Chunk.embedding.l2_distance(query_embedding))
        .limit(5)
    ).all()

    # 3. Construct Context
    context_str = ""
    chunk_ids = []
    
    if not results:
        return {
            "answer": "I could not find any relevant information in the uploaded 10-K documents for this company.",
            "sources": []
        }

    for chunk in results:
        # Append context for the LLM
        context_str += f"---\nSource: {chunk.document.item_name}\nContent: {chunk.chunk_text}\n"
        # Keep track of IDs for the audit log
        chunk_ids.append(chunk.id)

    # 4. Build Prompt
    system_prompt = (
        "You are a helpful financial assistant for Goldman Sachs advisors. "
        "Use the following SEC 10-K context to answer the user's question. "
        "If the answer is not in the context, say you don't know.\n\n"
        f"Context:\n{context_str}"
    )
    
    # 5. Call LLM
    try:
        response = llm.invoke([
            ("system", system_prompt),
            ("human", query_text)
        ])
        answer_text = response.content
    except Exception as e:
        answer_text = f"Error calling Gemini API: {str(e)}"

    # 6. Audit Logging (Compliance)
    # We log exactly what the advisor asked and what the model replied
    audit = AuditLog(
        company_id=company_id,
        query_text=query_text,
        retrieved_chunk_ids=chunk_ids,
        llm_mode="chat",
        llm_response=answer_text
    )
    db.add(audit)
    db.commit()

    return {
        "answer": answer_text,
        "sources": [c.document.item_name for c in results]
    }

def generate_specialized_content(db: Session, company_id: int, mode: str):
    """
    Bypasses vector search to pull specific full-text documents based on the mode,
    then leverages Gemini's large context window to generate comprehensive outputs.
    """
    
    # 1. Route the logic based on the requested mode
    if mode == "summary":
        item_codes = ["item_1", "item_7"]
        system_prompt = "You are an expert Goldman Sachs financial analyst. Summarize the company's core business and financial discussion based on the provided 10-K sections. Keep it professional, structured, and concise."
    
    elif mode == "risk_note":
        item_codes = ["item_1A"]
        system_prompt = "You are a risk management expert. Extract and summarize the key risk factors from the provided 10-K section. Format the output using clear bullet points."
    
    elif mode == "email":
        item_codes = ["item_1", "item_1A", "item_7"]
        system_prompt = "You are a financial advisor. Draft a professional, client-facing email summarizing this company's business profile, recent performance, and key risks based on the provided 10-K sections. Include a placeholder for the client's name."
    
    else:
        raise ValueError("Invalid generation mode")

    # 2. Fetch exact full-text documents from Postgres (No Vector Search)
    docs = db.query(Document).filter(
        Document.company_id == company_id,
        Document.item_code.in_(item_codes)
    ).all()

    if not docs:
        return {
            "content": f"Required 10-K sections ({', '.join(item_codes)}) not found for this company.", 
            "sources": []
        }

    # 3. Construct the context string
    context_str = "\n\n".join([f"--- {doc.item_name} ---\n{doc.raw_text}" for doc in docs])
    sources = [doc.item_name for doc in docs]

    # 4. Call Gemini
    try:
        response = llm.invoke([
            ("system", system_prompt),
            ("human", f"Please generate the {mode} based on the following SEC filings:\n\n{context_str}")
        ])
        answer_text = response.content
    except Exception as e:
        answer_text = f"Error calling Gemini API: {str(e)}"

    # 5. Audit Logging
    audit = AuditLog(
        company_id=company_id,
        query_text=f"System triggered specialized generation: {mode}",
        retrieved_chunk_ids=[], # We didn't use chunks, we used full docs
        llm_mode=mode,
        llm_response=answer_text
    )
    db.add(audit)
    db.commit()

    return {
        "content": answer_text,
        "sources": sources
    }