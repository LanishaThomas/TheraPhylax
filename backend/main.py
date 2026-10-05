from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="TheraPhylax API",
    description="Wildlife Conflict Intelligence Platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "TheraPhylax API is running!",
        "project": "TheraPhylax",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}