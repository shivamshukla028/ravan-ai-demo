import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
from .. import models
from ..database import get_db
import tempfile
import pdfplumber

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import PGVector
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from pydantic import BaseModel

router = APIRouter()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-openai-key")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/ravan_ai")


class ChatRequest(BaseModel):
    user_id: int
    message: str
    conversation_id: Optional[int] = None


def _get_vectorstore(embeddings):
    """Create PGVector vectorstore with the new langchain-community 0.4.x API."""
    return PGVector(
        embeddings=embeddings,
        collection_name="knowledge_base",
        connection=DATABASE_URL,
    )


def _format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


@router.post("/upload-document")
async def upload_document(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Save to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
        temp_pdf.write(await file.read())
        temp_pdf_path = temp_pdf.name

    try:
        # Extract Text
        text = ""
        with pdfplumber.open(temp_pdf_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"

        # Split Text
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_text(text)

        # Create metadata for each chunk
        metadatas = [{"user_id": user_id, "source": file.filename} for _ in chunks]

        # Generate Embeddings and Store in PGVector
        embeddings = OpenAIEmbeddings(api_key=OPENAI_API_KEY)
        PGVector.from_texts(
            texts=chunks,
            embedding=embeddings,
            metadatas=metadatas,
            connection=DATABASE_URL,
            collection_name="knowledge_base"
        )

        # Save document metadata in our relational table
        new_doc = models.Document(user_id=user_id, filename=file.filename, s3_url="local", status="ready")
        db.add(new_doc)
        db.commit()

        return {"message": "Document processed and added to Knowledge Base successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.remove(temp_pdf_path)


@router.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    # Verify User
    user = db.query(models.User).filter(models.User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # Setup Retrieval Augmented Generation (RAG) using LCEL
        embeddings = OpenAIEmbeddings(api_key=OPENAI_API_KEY)
        vectorstore = _get_vectorstore(embeddings)

        # Filter retriever by user_id so users only search their own docs
        retriever = vectorstore.as_retriever(
            search_kwargs={'filter': {'user_id': request.user_id}}
        )

        # Set up LLM and Prompt
        llm = ChatOpenAI(model="gpt-4-turbo-preview", api_key=OPENAI_API_KEY)

        system_prompt = (
            "You are Ravan AI, an expert cybersecurity intelligence assistant by Qyntraix Cyber Defence. "
            "Use the following pieces of retrieved context to answer the user's question. "
            "If you don't know the answer, just say that you don't know. "
            "Maintain a professional, highly secure, and analytical tone.\n\n"
            "Context: {context}"
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}"),
        ])

        # Modern LCEL chain (replaces create_retrieval_chain)
        rag_chain = (
            {
                "context": retriever | _format_docs,
                "input": RunnablePassthrough()
            }
            | prompt
            | llm
            | StrOutputParser()
        )

        ai_response = rag_chain.invoke(request.message)

        # Save to history (Assuming conversation_id exists)
        if request.conversation_id:
            user_msg = models.Message(conversation_id=request.conversation_id, role="user", content=request.message)
            ai_msg = models.Message(conversation_id=request.conversation_id, role="ai", content=ai_response)
            db.add_all([user_msg, ai_msg])
            db.commit()

        return {"response": ai_response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing error: {str(e)}")
