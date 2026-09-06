import os
import uvicorn
from server import app

if __name__ == "__main__":
    # Railway provides the port via the PORT environment variable.
    # Default to 8000 for local development.
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
