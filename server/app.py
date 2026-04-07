from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .environment import env, Action, EnvironmentState
from typing import Dict, Optional
import os

app = FastAPI(title="OpenEnv Project API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"message": "OpenEnv Backend is live!"}

@app.get("/state", response_model=EnvironmentState)
async def get_state():
    """Returns the current environment state."""
    return env.state()

@app.post("/reset", response_model=EnvironmentState)
async def reset_env(task_id: Optional[int] = 0):
    """Resets the environment with an optional task_id (1=Easy, 2=Medium, 3=Hard)."""
    return env.reset(task_id=task_id)

@app.post("/step")
async def step_env(action: Action):
    """Executes an action in the environment and returns new state and reward."""
    try:
        result = env.step(action)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/reward")
async def get_reward():
    """Calculates and returns the current reward/score."""
    return {"reward": env.get_reward()}

# Serve Static Frontend if exists
static_dir = "../static" if os.path.exists("../static") else "./static"
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

def main():
    import uvicorn
    # Use port 7860 as requested for Hugging Face Spaces
    uvicorn.run(app, host="0.0.0.0", port=7860)

if __name__ == "__main__":
    main()
