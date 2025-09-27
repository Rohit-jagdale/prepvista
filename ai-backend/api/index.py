from main import app as fastapi_app

# Expose the FastAPI ASGI app to Vercel's Python runtime
app = fastapi_app


