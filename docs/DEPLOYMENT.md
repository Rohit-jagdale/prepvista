# 🚀 PrepVista Deployment Guide

## 🎯 **Deployment Overview**

This guide covers deploying PrepVista to free hosting platforms:

- **Frontend**: Vercel or Netlify (Next.js optimized)
- **Backend**: Railway or Render (Python/FastAPI optimized)
- **Database**: Supabase (free tier for session storage)

## 🌐 **Frontend Deployment**

### **Option 1: Vercel (Recommended for Next.js)**

#### **Step 1: Prepare Frontend**

```bash
cd frontend
npm run build  # Test build locally
```

#### **Step 2: Deploy to Vercel**

1. **Install Vercel CLI**:

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy**:

   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend-url.railway.app`

#### **Step 3: Configure Custom Domain (Optional)**

- Vercel Dashboard → Domains → Add Domain
- Point your domain's nameservers to Vercel

### **Option 2: Netlify**

#### **Step 1: Prepare Frontend**

```bash
cd frontend
npm run build
```

#### **Step 2: Deploy to Netlify**

1. **Drag & Drop Method**:

   - Upload `.next` folder to [netlify.com](https://netlify.com)
   - Set build command: `npm run build`
   - Set publish directory: `.next`

2. **Git Integration**:

   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `.next`

3. **Set Environment Variables**:
   - Site Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend-url.railway.app`

## 🧠 **Backend Deployment**

### **Option 1: Railway (Recommended)**

#### **Step 1: Prepare Backend**

```bash
cd ai-backend
# Ensure requirements.txt is up to date
pip freeze > requirements.txt
```

#### **Step 2: Deploy to Railway**

1. **Sign up** at [railway.app](https://railway.app)
2. **Connect GitHub** repository
3. **Create new project** from GitHub
4. **Select repository** and branch
5. **Set environment variables**:
   - `GOOGLE_API_KEY` = Your Gemini API key
   - `PORT` = 8000 (auto-set by Railway)

#### **Step 3: Configure Domain**

- Railway Dashboard → Your Service → Settings → Domains
- Copy the generated URL (e.g., `https://prepvista-backend.railway.app`)

### **Option 2: Render**

#### **Step 1: Prepare Backend**

```bash
cd ai-backend
# Ensure requirements.txt is up to date
pip freeze > requirements.txt
```

#### **Step 2: Deploy to Render**

1. **Sign up** at [render.com](https://render.com)
2. **Connect GitHub** repository
3. **Create new Web Service**
4. **Configure service**:

   - **Name**: `prepvista-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

5. **Set environment variables**:
   - `GOOGLE_API_KEY` = Your Gemini API key
   - `PYTHON_VERSION` = 3.11

## 🗄️ **Database Setup (Optional)**

### **Supabase (Free Tier)**

1. **Sign up** at [supabase.com](https://supabase.com)
2. **Create new project**
3. **Get connection details**:
   - Project URL
   - API Key (anon/public)
4. **Set environment variables** in backend:
   - `SUPABASE_URL` = Your project URL
   - `SUPABASE_ANON_KEY` = Your anon key

## 🔧 **Environment Configuration**

### **Frontend Environment Variables**

```bash
# .env.local (for local development)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Production (set in hosting platform)
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

### **Backend Environment Variables**

```bash
# .env (for local development)
GOOGLE_API_KEY=your_gemini_api_key_here
PORT=8000

# Production (set in hosting platform)
GOOGLE_API_KEY=your_gemini_api_key_here
PORT=8000
SUPABASE_URL=your_supabase_url (optional)
SUPABASE_ANON_KEY=your_supabase_key (optional)
```

## 🚀 **Deployment Commands**

### **Quick Deploy Script**

```bash
#!/bin/bash
# deploy.sh - Quick deployment script

echo "🚀 Deploying PrepVista..."

# Frontend deployment
echo "📱 Deploying frontend..."
cd frontend
npm run build
vercel --prod --yes

# Backend deployment
echo "🧠 Deploying backend..."
cd ../ai-backend
# Railway auto-deploys on push
git add .
git commit -m "Deploy to production"
git push origin main

echo "✅ Deployment complete!"
echo "🌐 Frontend: https://your-app.vercel.app"
echo "🧠 Backend: https://your-backend.railway.app"
```

### **Make it executable**:

```bash
chmod +x deploy.sh
./deploy.sh
```

## 🔍 **Post-Deployment Verification**

### **1. Test Backend Health**

```bash
curl https://your-backend-url.railway.app/health
```

**Expected Response**:

```json
{
  "status": "healthy",
  "ai_service": "gemini-1.5-flash",
  "mode": "ai_enabled"
}
```

### **2. Test Frontend Connection**

- Open your deployed frontend URL
- Check browser console for API connection errors
- Verify environment variables are loaded

### **3. Test Session System**

```bash
# Test session creation
curl -X POST https://your-backend-url.railway.app/api/session \
  -H "Content-Type: application/json" \
  -d '{"exam_type":"ibps","topic":"quantitative","difficulty":"medium"}'
```

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Frontend Build Errors**

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

#### **Backend Deployment Failures**

```bash
# Check logs in Railway/Render dashboard
# Verify requirements.txt is up to date
pip freeze > requirements.txt
```

#### **CORS Issues**

- Backend automatically handles CORS
- Check if frontend URL is in allowed origins

#### **Environment Variables Not Loading**

- Verify variable names match exactly
- Check hosting platform's environment variable section
- Restart deployment after adding variables

### **Debug Commands**

```bash
# Check backend status
curl -v https://your-backend-url.railway.app/health

# Check frontend build
cd frontend
npm run build
npm run start

# Check environment variables
echo $NEXT_PUBLIC_API_URL
```

## 📊 **Monitoring & Analytics**

### **Vercel Analytics**

- Built-in performance monitoring
- Real-time user analytics
- Error tracking

### **Railway Monitoring**

- Resource usage metrics
- Log streaming
- Performance insights

### **Custom Health Checks**

```bash
# Add to your monitoring system
curl -f https://your-backend-url.railway.app/health || echo "Backend down"
curl -f https://your-frontend-url.vercel.app || echo "Frontend down"
```

## 🔄 **Continuous Deployment**

### **GitHub Actions (Optional)**

```yaml
# .github/workflows/deploy.yml
name: Deploy PrepVista
on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          # Railway auto-deploys on push
          echo "Backend deployment triggered"
```

## 💰 **Cost Optimization**

### **Free Tier Limits**

- **Vercel**: 100GB bandwidth/month, 100 serverless function executions/day
- **Netlify**: 100GB bandwidth/month, 125K function invocations/month
- **Railway**: $5 credit/month (usually sufficient for small apps)
- **Render**: 750 hours/month for free tier

### **Cost-Saving Tips**

1. **Use free tiers** for development and small projects
2. **Monitor usage** in hosting dashboards
3. **Optimize images** and assets
4. **Use CDN** for static content
5. **Implement caching** strategies

## 🎉 **Success Checklist**

- [ ] Frontend deployed and accessible
- [ ] Backend deployed and responding to health checks
- [ ] Environment variables configured correctly
- [ ] CORS working between frontend and backend
- [ ] Session system functional
- [ ] Custom domain configured (optional)
- [ ] Monitoring and alerts set up
- [ ] Documentation updated with production URLs

---

**🎯 Your PrepVista platform is now live and ready for users!**
