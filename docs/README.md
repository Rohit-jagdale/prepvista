# Aptitude Prep - AI-Powered Exam Preparation Platform

An intelligent aptitude exam preparation platform that uses Gemini AI to generate personalized questions, provide instant feedback, and offer shortcut tricks for competitive exams like UPSC, MPSC, College Placements, IBPS, SSC, and CAT.

## 🚀 Features

- **Multiple Exam Types**: Support for UPSC, MPSC, College Placements, IBPS, SSC, and CAT
- **Topic-wise Practice**: Organized questions by subject and difficulty level
- **AI-Powered Questions**: Gemini AI generates contextual questions for each exam type
- **Instant Feedback**: AI analyzes answers and provides detailed explanations
- **Shortcut Tricks**: Learn time-saving techniques and strategies
- **Progress Tracking**: Monitor your performance across topics
- **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: FastAPI with Python
- **AI Integration**: Google Gemini AI for question generation and feedback
- **Real-time Communication**: RESTful API with CORS support

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Python 3.8+
- Google Gemini AI API key

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd BuddiBaaz
```

### 2. Install Frontend Dependencies

```bash
pnpm install
```

### 3. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Environment Setup

```bash
cd backend
cp env.example .env
```

Edit `.env` and add your Google Gemini AI API key:

```env
GOOGLE_API_KEY=your_actual_api_key_here
```

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## 🚀 Running the Application

### Start the Backend (FastAPI)

```bash
cd backend
python main.py
```

The backend will run on `http://localhost:8000`

### Start the Frontend (Next.js)

```bash
# In a new terminal
pnpm dev
```

The frontend will run on `http://localhost:3000`

## 📱 Usage

1. **Select Exam Type**: Choose from UPSC, MPSC, College Placements, IBPS, SSC, or CAT
2. **Choose Topic**: Select a specific subject area (Mathematics, Reasoning, English, etc.)
3. **Practice Questions**: Answer AI-generated questions with timer
4. **Get Feedback**: Receive instant AI-powered feedback with explanations and shortcuts
5. **Track Progress**: Monitor your performance and improvement

## 🔧 API Endpoints

### Questions

- `POST /api/questions` - Generate AI-powered questions
- `GET /api/exam-types` - Get available exam types
- `GET /api/topics/{exam_type}` - Get topics for specific exam

### Feedback

- `POST /api/feedback` - Generate AI-powered feedback for answers

## 🎯 Exam Types & Topics

### UPSC Civil Services

- Mathematics, Logical Reasoning, English Language, General Awareness

### MPSC

- Mathematics, Reasoning Ability, English, Marathi

### College Placements

- Quantitative Aptitude, Logical Reasoning, Verbal Ability, Data Interpretation

### IBPS

- Quantitative Aptitude, Reasoning, English Language, Computer Knowledge

### SSC

- Mathematics, General Intelligence, English Language, General Knowledge

### CAT

- Quantitative Aptitude, Verbal Ability, Data Interpretation, Logical Reasoning

## 🧠 AI Features

- **Smart Question Generation**: Context-aware questions based on exam type and topic
- **Personalized Feedback**: Tailored explanations and improvement tips
- **Shortcut Learning**: Time-saving techniques and strategies
- **Adaptive Difficulty**: Questions adjust based on performance

## 🎨 UI Components

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern Interface**: Clean, intuitive design with smooth animations
- **Progress Tracking**: Visual progress bars and score indicators
- **Interactive Elements**: Hover effects and smooth transitions

## 🔒 Security Features

- CORS configuration for secure API communication
- Environment variable management for sensitive data
- Input validation and sanitization

## 🚀 Deployment

### Frontend (Vercel)

```bash
pnpm build
# Deploy to Vercel or your preferred hosting platform
```

### Backend (Docker)

```bash
cd backend
docker build -t aptitude-prep-api .
docker run -p 8000:8000 aptitude-prep-api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the API documentation at `http://localhost:8000/docs`

## 🔮 Future Enhancements

- User authentication and progress saving
- More exam types and topics
- Advanced analytics and performance insights
- Mobile app development
- Offline question bank
- Collaborative study groups

---

**Built with ❤️ using Next.js, FastAPI, and Gemini AI**
