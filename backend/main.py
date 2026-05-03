import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import review, analyze, security, github, advanced, analytics, polyglot, extras, pipeline_api, auth

app = FastAPI(title="AiCodeSage", version="5.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# System-level intelligence — things no AI chat tool can do
app.include_router(auth.router,         prefix="/api/auth",      tags=["Auth"])        # login / signup / JWT
app.include_router(pipeline_api.router, prefix="/api/pipeline",  tags=["Pipeline"])   # 4-agent autonomous loop
app.include_router(advanced.router,     prefix="/api/advanced",  tags=["Advanced"])   # AST control flow, taint, duplicates, graph
app.include_router(security.router,     prefix="/api/security",  tags=["Security"])   # bandit + taint tracking
app.include_router(analytics.router,    prefix="/api/analytics", tags=["Analytics"])  # SQLite quality history
app.include_router(polyglot.router,     prefix="/api/polyglot",  tags=["Polyglot"])   # multi-language static engines
app.include_router(extras.router,       prefix="/api/extras",    tags=["Extras"])     # CVE scan, incremental, confidence, plugins
app.include_router(review.router,       prefix="/api/review",    tags=["Review"])     # static + single AI call pipeline
app.include_router(analyze.router,      prefix="/api/analyze",   tags=["Analyze"])    # ZIP upload, RAG chat
app.include_router(github.router,       prefix="/api/github",    tags=["GitHub"])     # repo clone + RAG

@app.get("/")
def root():
    return {"message": "AiCodeSage v5.0 — Multi-Agent Code Intelligence Platform"}

@app.get("/api/models")
def list_models():
    from ai_engine.ollama_client import list_available_models
    return {"models": list_available_models()}
