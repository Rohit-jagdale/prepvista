# PrepVista AI Backend - Poetry Setup

This project has been migrated from `pip` to [Poetry](https://python-poetry.org/) for dependency management.

## What is Poetry?

Poetry is a modern dependency management and packaging tool for Python. It provides:

- **Dependency resolution**: Automatically resolves and installs compatible package versions
- **Virtual environment management**: Creates and manages isolated Python environments
- **Lock file**: Ensures reproducible builds across different environments
- **Build system**: Simplifies packaging and distribution

## Prerequisites

- Python 3.11 or higher
- Git

## Quick Start

### 1. Install Poetry

```bash
curl -sSL https://install.python-poetry.org | python3 -
```

**Note**: On macOS, you might need to add Poetry to your PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### 2. Setup the Project

```bash
cd ai-backend
./setup-poetry.sh
```

This script will:

- Install Poetry (if not already installed)
- Install all project dependencies
- Create a `.env` file from the template

### 3. Run the Application

```bash
./run-dev.sh
```

Or manually:

```bash
poetry run uvicorn main:app --reload
```

## Poetry Commands

### Basic Commands

```bash
# Install dependencies
poetry install

# Add a new dependency
poetry add package-name

# Add a development dependency
poetry add --group dev package-name

# Remove a dependency
poetry remove package-name

# Update all dependencies
poetry update

# Show installed packages
poetry show

# Activate virtual environment
poetry shell

# Run a command in virtual environment
poetry run python script.py
```

### Development Workflow

```bash
# Start development server
poetry run uvicorn main:app --reload

# Run tests
poetry run pytest

# Format code
poetry run black .

# Lint code
poetry run flake8

# Type checking
poetry run mypy .
```

## Project Structure

```
ai-backend/
├── pyproject.toml      # Poetry configuration and dependencies
├── poetry.lock         # Locked dependency versions
├── main.py            # Main application file
├── setup-poetry.sh    # Setup script
├── run-dev.sh         # Development server script
├── regenerate-lock.sh # Lock file regeneration script
├── .dockerignore      # Docker build exclusions
├── Dockerfile         # Container configuration
└── env.example        # Environment variables template
```

## Docker with Poetry

The Dockerfile has been updated to use Poetry:

```dockerfile
# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
RUN poetry install --no-dev --no-interaction --no-ansi

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t prepvista-ai-backend .
docker run -p 8000:8000 prepvista-ai-backend
```

## Migration from pip

If you were previously using `pip` and `requirements.txt`:

1. **Remove old files**:

   ```bash
   rm requirements.txt
   rm -rf venv/  # if you had a virtual environment
   ```

2. **Install Poetry** (see above)

3. **Setup with Poetry**:

   ```bash
   ./setup-poetry.sh
   ```

4. **Regenerate lock file** (if needed):
   ```bash
   ./regenerate-lock.sh
   ```

## Troubleshooting

### Poetry not found

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### Permission denied on scripts

```bash
chmod +x setup-poetry.sh run-dev.sh
```

### Virtual environment issues

```bash
poetry env remove python
poetry install
```

### Dependency conflicts

```bash
poetry update
poetry lock --no-update
```

## Benefits of Poetry over pip

1. **Better dependency resolution**: Handles complex dependency trees
2. **Lock file**: Ensures reproducible builds
3. **Virtual environment management**: Automatic creation and activation
4. **Modern packaging**: Built-in support for modern Python packaging standards
5. **Development dependencies**: Separate groups for dev and production dependencies
6. **Scripts**: Easy definition of project scripts in `pyproject.toml`

## Next Steps

- Update your CI/CD pipelines to use Poetry
- Consider using Poetry for other Python projects
- Explore Poetry's advanced features like dependency groups and scripts

For more information, visit [Poetry's official documentation](https://python-poetry.org/docs/).
