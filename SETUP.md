# PrepVista Setup Guide

## Backend Setup

### 1. Environment Configuration

The backend requires a Google Gemini AI API key to function. Follow these steps:

1. **Get a Google Gemini API Key:**

   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key

2. **Create Environment File:**

   ```bash
   cd backend
   cp env.example .env
   ```

3. **Edit the .env file:**
   ```bash
   # Replace 'your_gemini_api_key_here' with your actual API key
   GOOGLE_API_KEY=your_actual_api_key_here
   ```

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Start Backend Server

```bash
python3 main.py
```

The backend will start on `http://localhost:8000`

## Frontend Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Development Server

```bash
pnpm dev
```

The frontend will start on `http://localhost:3000`

## API Configuration

The frontend is configured to connect to the backend at `http://localhost:8000`. If you need to change this:

1. Edit `config/api.ts`
2. Update the `BACKEND_URL` value
3. Restart the frontend server

## Troubleshooting

### Backend 500 Errors

If you see 500 Internal Server Error responses:

1. Check that your `.env` file exists in the backend directory
2. Verify your Google API key is correct
3. Ensure the backend server is running on port 8000

### CORS Issues

The backend is configured to allow requests from `http://localhost:3000`. If you change the frontend port, update the CORS configuration in `backend/main.py`.

### API Connection Issues

- Verify both frontend and backend are running
- Check that the backend URL in `config/api.ts` matches your backend server
- Ensure no firewall is blocking the connection
