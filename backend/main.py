from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# allow local React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    email: str
    password: str | None = None  # if you later add password

@app.post("/auth/login")
async def login(payload: LoginRequest):
    # TODO: replace with real user lookup
    if payload.email.endswith(('@example.com', '@ssfglobal.org', 'srisiddhanta.org')):
        return {"status": "ok", "email": payload.email, "token": "fake-jwt"}
    raise HTTPException(status_code=401, detail="Invalid credentials")
