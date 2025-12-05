from fastapi import FastAPI

app = FastAPI(title="Talaria API")


@app.get("/")
def read_root():
    return {"message": "Welcome to Talaria API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
