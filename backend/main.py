from fastapi import FastAPI
from pydantic import BaseModel
from ssh_client import run_ssh_command
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# liberar frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SSHRequest(BaseModel):
    host: str
    port: int | None = 22
    user: str
    password: str
    command: str


@app.post("/ssh/run")
def run_command(data: SSHRequest):
    result = run_ssh_command(
        data.host,
        data.port,
        data.user,
        data.password,
        data.command
    )

    return result