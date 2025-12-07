import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from collections import deque
from datetime import datetime

# LangChain / AI
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langchain_core.runnables import RunnableLambda
from langchain_core.output_parsers import StrOutputParser

# Vector DB
from pinecone import Pinecone

# Load environment variables
load_dotenv()

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT") # This is needed for Pinecone initialization
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "hackathon-chatbot")

# --- FastAPI App Setup ---
app = FastAPI(
    title="RAG Chatbot Backend",
    description="Backend for the Docusaurus RAG Chatbot using Gemini and Pinecone",
    version="0.0.1",
)

# Allow CORS for local development
origins = [
    "http://localhost",
    "http://localhost:3000", # Default Docusaurus dev server port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AI Model and Pinecone Initialization ---
# These are initialized once when the app starts
embeddings_model = None
llm_model = None
pinecone_index = None

# --- Conversation History Storage ---
# Store last 7 messages (3.5 user-bot exchanges)
conversation_history = deque(maxlen=7)

@app.on_event("startup")
async def startup_event():
    global embeddings_model, llm_model, pinecone_index

    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY is not set.")
    if not PINECONE_API_KEY:
        raise HTTPException(status_code=500, detail="PINECONE_API_KEY is not set.")
    if not PINECONE_ENVIRONMENT:
        raise HTTPException(status_code=500, detail="PINECONE_ENVIRONMENT is not set.")

    try:
        print("Initializing Google Generative AI Embeddings...")
        embeddings_model = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=GOOGLE_API_KEY
        )
        print("Initializing Google Generative AI LLM (Gemini 2.5 Flash)...")
        llm_model = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.3
        )
        
        print("Initializing Pinecone client...")
        pc = Pinecone(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)
        pinecone_index = pc.Index(PINECONE_INDEX_NAME)
        print(f"Connected to Pinecone index: {PINECONE_INDEX_NAME}")

    except Exception as e:
        print(f"Error during startup initialization: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize AI services: {e}")

# --- Pydantic Models ---
class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: str = ""

class ChatRequest(BaseModel):
    query: str
    software: str = None
    hardware: str = None

class PersonalizeRequest(BaseModel):
    chapter_title: str
    chapter_content: str
    software: str
    hardware: str

class TranslateRequest(BaseModel):
    content: str
    target_language: str = "Urdu"

class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict] = []
    conversation_history: List[Dict] = []

# --- Translation Chain ---
async def get_translation_chain(target_language: str):
    if not llm_model:
        raise HTTPException(status_code=500, detail="AI model not initialized.")

    system_prompt = (
        f"You are a professional technical translator. Translate the following Markdown content into **{target_language}**.\n"
        "Rules:\n"
        "1. **Preserve Markdown formatting** exactly (headers, lists, code blocks, bold/italic).\n"
        "2. **Do NOT translate code blocks**, commands, or variable names.\n"
        "3. Keep standard technical terms (like 'ROS 2', 'Python', 'Node', 'API') in English where appropriate for clarity.\n"
        "4. Ensure the tone is professional and educational."
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", "{content}"),
        ]
    )

    chain = (
        prompt
        | llm_model
        | StrOutputParser()
    )

    return chain

# --- Personalization Chain ---
async def get_personalization_chain(chapter_title: str, chapter_content: str, software: str, hardware: str):
    if not llm_model:
        raise HTTPException(status_code=500, detail="AI model not initialized.")

    system_prompt = (
        "You are a technical tutor customizing learning materials for a specific student. "
        f"The student uses **{software}** for software and **{hardware}** for hardware.\n"
        "Your task is to analyze the provided documentation chapter and write a 'Personalized Insight' section.\n"
        "1. Explain briefly how the concepts in this chapter specifically relate to their tech stack.\n"
        "2. Provide a concrete example, command, or configuration tip relevant to their setup if possible.\n"
        "3. Keep it encouraging and concise (under 200 words).\n"
        "4. Do NOT simply summarize the chapter; act as a bridge between the general concept and their specific tools."
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", "Chapter Title: {title}\n\nContent Snippet:\n{content}"),
        ]
    )

    chain = (
        prompt
        | llm_model
        | StrOutputParser()
    )

    return chain

# --- RAG Chain Setup ---
async def get_rag_chain(query: str, software: str = None, hardware: str = None):
    if not embeddings_model or not llm_model or not pinecone_index:
        raise HTTPException(status_code=500, detail="AI models or Pinecone not initialized.")

    # Retrieve from Pinecone
    query_vector = embeddings_model.embed_query(query)
    
    # Perform similarity search
    results = pinecone_index.query(
        vector=query_vector,
        top_k=5,
        include_metadata=True
    )
    
    # Convert Pinecone results to LangChain Document format
    retrieved_docs = []
    sources_list = []
    for match in results.matches:
        content = match.metadata.get("text", "")
        source_path = match.metadata.get("source", "N/A")
        filename = match.metadata.get("filename", "N/A")

        doc_url = f"/docs/{source_path.replace('.md', '').replace('.mdx', '')}"

        retrieved_docs.append(
            Document(
                page_content=content,
                metadata={"source": doc_url, "score": match.score, "filename": filename}
            )
        )
        if {"source": doc_url, "filename": filename} not in sources_list:
            sources_list.append({"source": doc_url, "filename": filename})

    # Build conversation context from history
    conversation_context = ""
    if conversation_history:
        conversation_context = "Recent conversation history:\n"
        for msg in conversation_history:
            role = "User" if msg["role"] == "user" else "Assistant"
            conversation_context += f"{role}: {msg['content']}\n"
        conversation_context += "\n"

    # Personalization Context
    personalization_context = ""
    if software or hardware:
        personalization_context = f"\nUser Background:\n"
        if software:
            personalization_context += f"- Software Experience: {software}\n"
        if hardware:
            personalization_context += f"- Hardware Experience: {hardware}\n"
        personalization_context += "Tailor your answer to be relevant to the user's specific software and hardware background where applicable.\n"

    # If no relevant documents are found, respond without context
    if not retrieved_docs:
        print("No relevant documents found in Pinecone.")
        system_prompt = (
            "You are an expert AI assistant with deep knowledge in robotics, AI systems, and technical documentation. "
            "Provide thoughtful, structured, and comprehensive answers. When information is not available in your knowledge base, "
            "clearly state the limitations and suggest alternative resources or approaches where appropriate. "
            "Take into account the conversation history to maintain context and coherence. "
            "Do not mention sources or documentation references in your response."
            f"{personalization_context}"
        )
        context_str = ""
    else:
        system_prompt = (
            "You are an expert technical documentation assistant specializing in physical AI, humanoid robotics, ROS2, and advanced AI systems. "
            "Your role is to provide accurate, well-structured, and insightful answers based exclusively on the provided documentation."
            "\n\nGuidelines:\n"
            "1. Answer with technical precision and clarity, suitable for both beginners and experts\n"
            "2. Structure complex answers with clear sections, bullet points, or steps\n"
            "3. Provide practical examples or code snippets when relevant\n"
            "4. Do NOT mention sources, references, or documentation names in your response\n"
            "5. If the answer requires information from multiple sources, synthesize them coherently\n"
            "6. Highlight important caveats, prerequisites, or version-specific information\n"
            "7. If the query falls outside the provided documentation scope, explicitly state this and recommend the appropriate resources\n"
            "8. Maintain coherence with the conversation history to provide contextually relevant responses"
            "9. When user asks for any topic just answer it in 5 to 10 lines with summary after that user want more information then give detailed answer.Also suggest the related document to the user."
            "10. Always prioritize clarity and conciseness in your explanations."
            "11. Use 2 to 3 emojis in you answer to make it more engaging."
            f"{personalization_context}"
        )
        context_str = "\n\n".join([f"[Source: {doc.metadata['source']}]\n{doc.page_content}" for doc in retrieved_docs])

    # Build the full context including conversation history
    full_context = conversation_context + context_str

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt + "\n\nContext:\n{context}"),
            ("human", "{input}"),
        ]
    )

    def format_context(x):
        return {"input": x["input"], "context": full_context}

    chain = (
        RunnableLambda(format_context)
        | prompt
        | llm_model
        | StrOutputParser()
    )

    return chain, sources_list

@app.get("/")
async def read_root():
    return {"message": "Welcome to the RAG Chatbot Backend! Use /chat endpoint."}

@app.get("/history")
async def get_history():
    """Get current conversation history"""
    history_list = list(conversation_history)
    return {"conversation_history": history_list}

@app.delete("/history")
async def clear_history():
    """Clear conversation history"""
    conversation_history.clear()
    return {"message": "Conversation history cleared"}

@app.post("/chat", response_model=ChatResponse)

async def chat_endpoint(request: ChatRequest):

    try:

        chain, sources_list = await get_rag_chain(request.query, request.software, request.hardware)

        

        response = chain.invoke({"input": request.query})

        

        # Store user message and assistant response in history

        timestamp = datetime.now().isoformat()

        conversation_history.append({

            "role": "user",

            "content": request.query,

            "timestamp": timestamp

        })

        conversation_history.append({

            "role": "assistant",

            "content": response,

            "timestamp": timestamp

        })

        

        # Convert deque to list (already dicts, no need to convert)

        history_list = list(conversation_history)

        

        return ChatResponse(answer=response, sources=sources_list, conversation_history=history_list)

    except HTTPException as e:

        raise e

    except Exception as e:

        print(f"Error during chat processing: {e}")

        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")



@app.post("/personalize")



async def personalize_endpoint(request: PersonalizeRequest):



    try:



        chain = await get_personalization_chain(



            request.chapter_title, 



            request.chapter_content, 



            request.software, 



            request.hardware



        )



        



        # Truncate content if too long to avoid token limits (pass first 2000 chars)



        content_snippet = request.chapter_content[:2000]



        



        response = chain.invoke({



            "title": request.chapter_title,



            "content": content_snippet



        })



        



        return {"insight": response}



    except Exception as e:



        print(f"Error during personalization: {e}")



        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")







@app.post("/translate")



async def translate_endpoint(request: TranslateRequest):



    try:



        chain = await get_translation_chain(request.target_language)



        



        # Limit content length for the hackathon demo to ensure speed/limit safety



        # In production, you'd chunk this or use a larger context model



        content_snippet = request.content[:4000]



        



        response = chain.invoke({"content": content_snippet})



        



        return {"translated_content": response}



    except Exception as e:



        print(f"Error during translation: {e}")



        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")







