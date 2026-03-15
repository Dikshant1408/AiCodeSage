import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import review, analyze, explain, docs_gen, security, github, tests_gen, advanced, analytics, polyglot, extras

app = FastAPI(title="AI Code Assistant", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(review.router,    prefix="/api/review",    tags=["Review"])
app.include_router(analyze.router,   prefix="/api/analyze",   tags=["Analyze"])
app.include_router(explain.router,   prefix="/api/explain",   tags=["Explain"])
app.include_router(docs_gen.router,  prefix="/api/docs",      tags=["Docs"])
app.include_router(security.router,  prefix="/api/security",  tags=["Security"])
app.include_router(github.router,    prefix="/api/github",    tags=["GitHub"])
app.include_router(tests_gen.router, prefix="/api/tests",     tags=["Tests"])
app.include_router(advanced.router,  prefix="/api/advanced",  tags=["Advanced"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(polyglot.router,  prefix="/api/polyglot",  tags=["Polyglot"])
app.include_router(extras.router,    prefix="/api/extras",    tags=["Extras"])

@app.get("/")
def root():
    return {"message": "AI Code Assistant API v4.0"}

@app.get("/api/models")
def list_models():
    from ai_engine.ollama_client import list_available_models
    return {"models": list_available_models()}
