import os
import subprocess
import tempfile
import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Code Execution Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    code: str

class ExecutionResult(BaseModel):
    output: str | None = None
    error: str | None = None
    timed_out: bool = False
    exit_code: int | None = None

@app.get("/")
def root():
    return {"status": "ok", "message": "Code Execution Engine is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/execute", response_model=ExecutionResult)
def execute_code(request: CodeRequest):
    """
    Execute Python code in a subprocess with a strict 2-second timeout.
    The code is saved to a temporary file, executed, and the output is returned.
    """
    # Write code to a temporary file
    tmp_path = None
    try:
        # Create a uniquely named temporary file
        tmp_fd, tmp_path = tempfile.mkstemp(suffix=".py", prefix=f"exec_{uuid.uuid4().hex}_")
        with os.fdopen(tmp_fd, "w") as f:
            f.write(request.code)

        # Execute with a strict 2-second timeout
        result = subprocess.run(
            ["python3", tmp_path],
            capture_output=True,
            text=True,
            timeout=2,          # <-- strict 2-second timeout
        )

        stdout = result.stdout
        stderr = result.stderr

        if result.returncode != 0:
            return ExecutionResult(
                output=stdout if stdout else None,
                error=stderr if stderr else "An unknown error occurred.",
                timed_out=False,
                exit_code=result.returncode,
            )

        return ExecutionResult(
            output=stdout,
            error=None,
            timed_out=False,
            exit_code=result.returncode,
        )

    except subprocess.TimeoutExpired:
        return ExecutionResult(
            output=None,
            error="⏱️ Timeout: Code execution exceeded the 2-second limit. Check for infinite loops.",
            timed_out=True,
            exit_code=None,
        )
    except Exception as e:
        return ExecutionResult(
            output=None,
            error=f"Server error: {str(e)}",
            timed_out=False,
            exit_code=-1,
        )
    finally:
        # Always clean up the temp file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
