import os
from typing import Any, Dict, List, Optional

import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()


class GoogleSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=256)
    num_results: int = Field(default=5, ge=1, le=10)


def _extract_items(items: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    if not items:
        return []
    return [
        {
            "title": item.get("title", ""),
            "link": item.get("link", ""),
            "snippet": item.get("snippet", ""),
            "display_link": item.get("displayLink", ""),
        }
        for item in items
    ]


@router.post("/")
def google_search(req: GoogleSearchRequest):
    api_key = os.getenv("GOOGLE_SEARCH_API_KEY", "").strip()
    search_engine_id = os.getenv("GOOGLE_SEARCH_ENGINE_ID", "").strip()
    if not api_key or not search_engine_id:
        raise HTTPException(
            status_code=500,
            detail="Google search is not configured. Set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID.",
        )

    try:
        response = requests.get(
            "https://www.googleapis.com/customsearch/v1",
            params={
                "key": api_key,
                "cx": search_engine_id,
                "q": req.query.strip(),
                "num": req.num_results,
            },
            timeout=15,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Google Search request failed: {exc}") from exc

    if response.status_code != 200:
        detail = f"Google Search API error ({response.status_code})"
        try:
            err = response.json().get("error", {})
            message = err.get("message")
            if message:
                detail = f"{detail}: {message}"
        except ValueError:
            pass
        if response.status_code in (403, 429):
            detail = f"{detail}. You may have hit quota/rate limits."
        raise HTTPException(status_code=response.status_code, detail=detail)

    payload = response.json()
    return {
        "query": req.query,
        "total_results": payload.get("searchInformation", {}).get("totalResults", "0"),
        "results": _extract_items(payload.get("items")),
    }
