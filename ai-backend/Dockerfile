FROM python:3.11-slim

WORKDIR /app

# Install system dependencies and Poetry
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl -sSL https://install.python-poetry.org | python3 -

# Add Poetry to PATH
ENV PATH="/root/.local/bin:$PATH"

# Copy Poetry configuration files
COPY pyproject.toml poetry.lock ./

# Configure Poetry to not create virtual environment in container
RUN poetry config virtualenvs.create false

# Install dependencies using Poetry
RUN poetry install --no-dev --no-interaction --no-ansi

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
