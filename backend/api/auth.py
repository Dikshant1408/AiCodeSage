"""
Auth API — JWT-based login/signup
Uses SQLite for user storage, bcrypt for passwords, JWT for tokens
"""
import os, sqlite3, hashlib, hmac, base64, json, time
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

router = APIRouter()
bearer = HTTPBearer(auto_error=False)

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "users.db")
SECRET   = os.environ.get("JWT_SECRET", "aicodesage-secret-change-in-prod")

# ── DB setup ──────────────────────────────────────────────────────────────────

def _db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with _db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                name      TEXT NOT NULL,
                email     TEXT UNIQUE NOT NULL,
                password  TEXT NOT NULL,
                created   TEXT DEFAULT (datetime('now'))
            )
        """)
        conn.commit()

init_db()

# ── Minimal JWT (no extra deps) ───────────────────────────────────────────────

def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _sign(payload: dict, exp_hours: int = 72) -> str:
    payload = {**payload, "exp": int(time.time()) + exp_hours * 3600}
    header  = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    body    = _b64(json.dumps(payload).encode())
    sig     = _b64(hmac.new(SECRET.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest())
    return f"{header}.{body}.{sig}"

def _verify(token: str) -> dict:
    try:
        header, body, sig = token.split(".")
        expected = _b64(hmac.new(SECRET.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            raise ValueError("bad sig")
        payload = json.loads(base64.urlsafe_b64decode(body + "=="))
        if payload.get("exp", 0) < time.time():
            raise ValueError("expired")
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def _hash_pw(pw: str) -> str:
    salt = os.urandom(16).hex()
    h    = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 260000).hex()
    return f"{salt}:{h}"

def _check_pw(pw: str, stored: str) -> bool:
    try:
        salt, h = stored.split(":")
        return hmac.compare_digest(
            hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 260000).hex(), h
        )
    except Exception:
        return False

# ── Dependency ────────────────────────────────────────────────────────────────

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return _verify(creds.credentials)

# ── Routes ────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
def signup(req: SignupRequest):
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if not req.email or "@" not in req.email:
        raise HTTPException(status_code=400, detail="Invalid email")
    try:
        with _db() as conn:
            conn.execute(
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                (req.name.strip(), req.email.lower().strip(), _hash_pw(req.password))
            )
            conn.commit()
            user = conn.execute("SELECT * FROM users WHERE email=?", (req.email.lower().strip(),)).fetchone()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Email already registered")
    token = _sign({"sub": user["id"], "email": user["email"], "name": user["name"]})
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}

@router.post("/login")
def login(req: LoginRequest):
    with _db() as conn:
        user = conn.execute("SELECT * FROM users WHERE email=?", (req.email.lower().strip(),)).fetchone()
    if not user or not _check_pw(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = _sign({"sub": user["id"], "email": user["email"], "name": user["name"]})
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}

@router.get("/me")
def me(user=Depends(get_current_user)):
    return {"user": user}
