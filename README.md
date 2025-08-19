# 🚀 PrepVista - AI-Powered Aptitude Exam Preparation Platform

## 📁 Project Structure

```
PrepVista/
├── 🧠 ai-backend/          # Python AI backend with Gemini integration
│   ├── main.py             # FastAPI server with session management
│   ├── pyproject.toml      # Poetry configuration and dependencies
│   ├── poetry.lock         # Locked dependency versions
│   └── Dockerfile          # Backend containerization
├── 🎨 frontend/            # Next.js React frontend
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── lib/              # API utilities and types
│   ├── config/           # Configuration files
│   └── package.json      # Node.js dependencies
├── 📚 docs/               # Documentation and guides
│   ├── README.md         # This file
│   ├── SETUP.md          # Setup instructions
│   ├── SESSION_SYSTEM_README.md  # Session system documentation
│   ├── DEPLOYMENT.md     # Deployment guide
│   ├── DEPLOYMENT_CHECKLIST.md # Deployment checklist
│   └── TROUBLESHOOTING.md # Troubleshooting guide
├── 🛠️ scripts/            # Utility and startup scripts
│   ├── start-system.sh   # Start both backend and frontend
│   ├── deploy.sh         # Automated deployment script
│   ├── setup-backend.sh  # Backend setup script
│   ├── start-backend.sh  # Backend startup script
│   ├── start-frontend.sh # Frontend startup script
│   ├── quick-start.sh    # Quick setup script
│   └── docker-compose.yml # Docker orchestration
├── 🧪 tests/              # Test files and scripts
│   ├── test-session.py   # Session system tests
│   ├── test-api.py       # API endpoint tests
│   └── test-setup.py     # Setup validation tests
└── 📋 .gitignore          # Git ignore patterns
```

## 🎯 Features

### ✨ **Session-Based Practice System**

- **10 questions per session** with 2-minute timer
- **Real-time progress tracking** and countdown
- **Comprehensive feedback** on wrong answers after completion
- **AI-powered question generation** using Google Gemini

### 🧠 **AI Integration**

- **Gemini 1.5 Flash** for fast, free question generation
- **Fallback questions** when AI is unavailable
- **Smart prompt engineering** for exam-specific content
- **Multiple exam types** (IBPS, UPSC, SSC, CAT, etc.)

### 🎨 **Modern Frontend**

- **Next.js 14** with React and TypeScript
- **Tailwind CSS** for beautiful, responsive design
- **Real-time updates** and smooth animations
- **Mobile-optimized** interface

## 🚀 Quick Start

### **Option 1: Automated Startup**

```bash
# Make script executable and start
chmod +x scripts/start-system.sh
./scripts/start-system.sh
```

### **Option 2: Manual Startup**

```bash
# Terminal 1: Start AI Backend
cd ai-backend
poetry run uvicorn main:app --reload

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

### **Option 3: Docker (Coming Soon)**

```bash
docker-compose up
```

## 🌐 **Deployment**

### **🚀 Quick Deployment**

```bash
# Run automated deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### **📋 Deployment Options**

- **Frontend**: Deploy to [Vercel](https://vercel.com) (Next.js optimized) or [Netlify](https://netlify.com)
- **Backend**: Deploy to [Railway](https://railway.app) or [Render](https://render.com)
- **Database**: Use [Supabase](https://supabase.com) for session storage (optional)

### **📚 Deployment Guides**

- **Complete Guide**: `docs/DEPLOYMENT.md`
- **Step-by-Step Checklist**: `docs/DEPLOYMENT_CHECKLIST.md`
- **Automated Script**: `scripts/deploy.sh`

## 🧪 Testing

### **Test the Session System**

```bash
cd ai-backend
poetry run python ../tests/test-session.py
```

### **Test API Endpoints**

```bash
cd ai-backend
poetry run python ../tests/test-api.py
```

### **Validate Setup**

```bash
cd ai-backend
poetry run python ../tests/test-setup.py
```

## 📊 API Endpoints

### **Session Management**

- `POST /api/session` - Create practice session
- `POST /api/session/{id}/answer` - Submit answer
- `POST /api/session/{id}/complete` - Complete session
- `GET /api/session/{id}/status` - Session status

### **Question Generation**

- `POST /api/questions` - Generate AI questions
- `POST /api/feedback` - Generate AI feedback

### **System Health**

- `GET /health` - System health check
- `GET /model-info` - AI model information
- `GET /test-ai` - Test AI connection

## 🛠️ Development

### **Backend Development**

```bash
cd ai-backend
# Install dependencies
poetry install
# Run with auto-reload
poetry run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### **Frontend Development**

```bash
cd frontend
# Install dependencies
npm install
# Run development server
npm run dev
```

### **Environment Setup**

```bash
# Copy environment template
cp ai-backend/env.example ai-backend/.env
# Edit with your Google API key
nano ai-backend/.env
```

## 🔧 Configuration

### **Required Environment Variables**

```bash
# AI Backend (.env)
GOOGLE_API_KEY=your_gemini_api_key_here
```

### **Optional Configuration**

- **Question count**: Default 10 per session
- **Time limit**: Default 2 minutes per session
- **AI model**: Default gemini-1.5-flash
- **Fallback questions**: Available for all topics

## 📈 Performance Features

- **Session caching** with automatic cleanup
- **Batch answer processing** for better performance
- **Fallback question system** for reliability
- **Real-time progress tracking** with minimal API calls

## 🎓 Supported Exam Types

- **IBPS** - Banking Personnel Selection
- **UPSC** - Civil Services Examination
- **SSC** - Staff Selection Commission
- **CAT** - Common Admission Test
- **MPSC** - Maharashtra Public Service Commission
- **College Placements** - Campus Recruitment Tests

## 🧠 Supported Topics

- **Quantitative Aptitude** - Numbers, algebra, geometry
- **Logical Reasoning** - Puzzles, blood relations, coding
- **English Language** - Grammar, vocabulary, comprehension
- **General Awareness** - Current affairs, static GK
- **Computer Knowledge** - Basic concepts and applications

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests** for new functionality
5. **Submit a pull request**

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the `docs/` folder
- **Troubleshooting**: See `docs/TROUBLESHOOTING.md`
- **Deployment**: See `docs/DEPLOYMENT.md`
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions

## 🎉 Acknowledgments

- **Google Gemini AI** for question generation
- **FastAPI** for high-performance backend
- **Next.js** for modern frontend framework
- **Tailwind CSS** for beautiful styling

---

**Made with ❤️ for better exam preparation**
