# 📁 PrepVista Project Structure

## 🎯 Overview

The PrepVista project has been reorganized for better readability, maintainability, and separation of concerns. The new structure clearly separates AI backend logic from frontend components and provides dedicated spaces for documentation, testing, and utilities.

## 🏗️ Directory Structure

```
PrepVista/
├── 🧠 ai-backend/                    # Python AI Backend
│   ├── main.py                      # FastAPI server with session management
│   ├── requirements.txt             # Python dependencies
│   ├── env.example                  # Environment variables template
│   └── Dockerfile                   # Backend containerization
├── 🎨 frontend/                     # Next.js React Frontend
│   ├── app/                         # Next.js 14 app directory
│   │   ├── globals.css             # Global styles
│   │   ├── layout.tsx              # Root layout component
│   │   └── page.tsx                # Home page component
│   ├── components/                  # React components
│   │   ├── Header.tsx              # Navigation header
│   │   ├── ExamSelection.tsx       # Exam type selection
│   │   └── QuestionPractice.tsx    # Session-based practice
│   ├── lib/                         # Utilities and types
│   │   └── api.ts                  # API client and types
│   ├── config/                      # Configuration files
│   │   └── api.ts                  # API configuration
│   ├── package.json                 # Node.js dependencies
│   ├── next.config.js              # Next.js configuration
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   ├── tsconfig.json               # TypeScript configuration
│   ├── postcss.config.js           # PostCSS configuration
│   └── next-env.d.ts               # Next.js type definitions
├── 📚 docs/                         # Documentation
│   ├── README.md                    # Main project documentation
│   ├── PROJECT_STRUCTURE.md         # This file
│   ├── SETUP.md                     # Setup instructions
│   ├── SESSION_SYSTEM_README.md     # Session system documentation
│   └── TROUBLESHOOTING.md           # Troubleshooting guide
├── 🛠️ scripts/                      # Utility Scripts
│   ├── start-system.sh              # Start both backend and frontend
│   ├── setup-backend.sh             # Backend setup script
│   ├── start-backend.sh             # Backend startup script
│   ├── start-frontend.sh            # Frontend startup script
│   ├── quick-start.sh               # Quick setup script
│   ├── docker-compose.yml           # Docker orchestration
│   └── Dockerfile                   # Root Dockerfile
├── 🧪 tests/                        # Test Files
│   ├── test-session.py              # Session system tests
│   ├── test-api.py                  # API endpoint tests
│   └── test-setup.py                # Setup validation tests
├── 📋 .gitignore                    # Git ignore patterns
└── 🚀 README.md                     # Main project README
```

## 🔍 Detailed Breakdown

### 🧠 **ai-backend/** - AI Backend Logic

**Purpose**: Contains all Python-based AI logic, API endpoints, and session management.

**Key Files**:

- `main.py` - FastAPI server with session-based practice system
- `requirements.txt` - Python dependencies (FastAPI, Gemini AI, etc.)
- `env.example` - Environment variables template
- `Dockerfile` - Backend containerization

**Features**:

- Session management with UUID-based identification
- AI question generation using Google Gemini
- Fallback question system
- Automatic session cleanup
- Real-time timer management

### 🎨 **frontend/** - React Frontend

**Purpose**: Contains all Next.js React components, styling, and client-side logic.

**Key Directories**:

- `app/` - Next.js 14 app directory structure
- `components/` - Reusable React components
- `lib/` - Utility functions and API types
- `config/` - Configuration files

**Features**:

- Session-based practice interface
- Real-time timer display
- Progress tracking
- Results dashboard
- Wrong answer review system

### 📚 **docs/** - Documentation

**Purpose**: Centralized location for all project documentation.

**Contents**:

- Project overview and setup guides
- API documentation
- Troubleshooting guides
- Session system documentation

### 🛠️ **scripts/** - Utility Scripts

**Purpose**: Automation scripts for development, deployment, and testing.

**Key Scripts**:

- `start-system.sh` - Automated startup for both services
- `setup-backend.sh` - Backend environment setup
- `docker-compose.yml` - Docker orchestration

### 🧪 **tests/** - Test Files

**Purpose**: Test scripts for validating system functionality.

**Test Coverage**:

- Session system functionality
- API endpoint validation
- Setup verification
- Integration testing

## 🔄 Development Workflow

### **Starting Development**

```bash
# Option 1: Automated startup
./scripts/start-system.sh

# Option 2: Manual startup
cd ai-backend && poetry run uvicorn main:app --reload
cd frontend && npm run dev
```

### **Making Changes**

1. **Backend Changes**: Edit files in `ai-backend/`
2. **Frontend Changes**: Edit files in `frontend/`
3. **Documentation**: Update files in `docs/`
4. **Scripts**: Modify files in `scripts/`

### **Testing Changes**

```bash
# Test session system
cd ai-backend && poetry run python ../tests/test-session.py

# Test API endpoints
cd ai-backend && poetry run python ../tests/test-api.py

# Validate setup
cd ai-backend && poetry run python ../tests/test-setup.py
```

## 🎯 Benefits of New Structure

### **1. Clear Separation of Concerns**

- **AI Backend**: All Python logic in one place
- **Frontend**: All React/Next.js code in one place
- **Documentation**: Centralized knowledge base
- **Scripts**: Organized automation tools

### **2. Improved Maintainability**

- **Easier navigation** through project files
- **Clear ownership** of different components
- **Simplified deployment** processes
- **Better testing** organization

### **3. Enhanced Readability**

- **Logical grouping** of related files
- **Consistent naming** conventions
- **Clear documentation** structure
- **Intuitive file locations**

### **4. Better Collaboration**

- **Frontend developers** focus on `frontend/`
- **Backend developers** focus on `ai-backend/`
- **DevOps engineers** focus on `scripts/`
- **Documentation writers** focus on `docs/`

## 🚀 Migration Notes

### **For Existing Users**

- **Backend location**: Changed from `backend/` to `ai-backend/`
- **Startup scripts**: Updated to reflect new structure
- **Documentation**: Moved to dedicated `docs/` folder
- **Tests**: Organized in `tests/` directory

### **For New Contributors**

- **Clear entry points** for different types of work
- **Organized documentation** for quick onboarding
- **Separated concerns** for focused development
- **Automated scripts** for easy setup

## 🔮 Future Enhancements

### **Planned Improvements**

- **Database integration** for persistent sessions
- **Redis caching** for better performance
- **WebSocket support** for real-time updates
- **Mobile app** development
- **Analytics dashboard** for performance tracking

### **Structure Evolution**

- **Microservices architecture** for scalability
- **API versioning** for backward compatibility
- **Plugin system** for extensibility
- **Multi-tenant support** for organizations

---

**This structure provides a solid foundation for the PrepVista platform's continued growth and development.**
