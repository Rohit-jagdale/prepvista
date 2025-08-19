# 🚀 PrepVista Deployment Checklist

## 📋 **Pre-Deployment Checklist**

### **Prerequisites**

- [ ] Node.js 18+ installed
- [ ] Python 3.8+ installed
- [ ] Git repository set up
- [ ] Google Gemini API key obtained
- [ ] GitHub account connected to hosting platforms

### **Code Preparation**

- [ ] All tests passing locally
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Backend runs locally (`poetry run uvicorn main:app --reload`)
- [ ] Environment variables documented
- [ ] CORS configuration tested

## 🌐 **Frontend Deployment (Vercel)**

### **Step 1: Deploy Frontend**

```bash
# Run deployment script
./scripts/deploy.sh

# Or manually:
cd frontend
npm run build
vercel --prod
```

### **Step 2: Configure Vercel**

- [ ] Project created and linked
- [ ] Custom domain configured (optional)
- [ ] Environment variables set:
  - `NEXT_PUBLIC_API_URL` = `https://your-backend-url.railway.app`

### **Step 3: Verify Frontend**

- [ ] Frontend accessible at Vercel URL
- [ ] No build errors in Vercel dashboard
- [ ] Environment variables loading correctly

## 🧠 **Backend Deployment (Railway)**

### **Step 1: Prepare Backend**

```bash
cd ai-backend
poetry lock
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### **Step 2: Configure Railway**

- [ ] Account created at [railway.app](https://railway.app)
- [ ] GitHub repository connected
- [ ] New project created from GitHub
- [ ] Environment variables set:
  - `GOOGLE_API_KEY` = `your_gemini_api_key_here`
  - `PORT` = `8000`

### **Step 3: Verify Backend**

- [ ] Backend accessible at Railway URL
- [ ] Health check endpoint responding (`/health`)
- [ ] AI service working (`/model-info`)
- [ ] Session endpoints functional

## 🔧 **Environment Configuration**

### **Frontend (.env.local)**

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### **Production (Vercel Dashboard)**

```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

### **Backend (.env)**

```bash
GOOGLE_API_KEY=your_gemini_api_key_here
PORT=8000
```

### **Production (Railway Dashboard)**

```bash
GOOGLE_API_KEY=your_gemini_api_key_here
PORT=8000
```

## 🧪 **Post-Deployment Testing**

### **Backend Health Check**

```bash
curl https://your-backend-url.railway.app/health
```

**Expected Response:**

```json
{
  "status": "healthy",
  "ai_service": "gemini-1.5-flash",
  "mode": "ai_enabled"
}
```

### **Frontend Connection Test**

- [ ] Open deployed frontend URL
- [ ] Check browser console for errors
- [ ] Verify API calls to backend
- [ ] Test session creation and completion

### **Session System Test**

```bash
# Test session creation
curl -X POST https://your-backend-url.railway.app/api/session \
  -H "Content-Type: application/json" \
  -d '{"exam_type":"ibps","topic":"quantitative","difficulty":"medium"}'
```

## 🛠️ **Troubleshooting Common Issues**

### **Frontend Issues**

- [ ] Build errors: Clear `.next` cache and rebuild
- [ ] Environment variables: Check Vercel dashboard
- [ ] API connection: Verify `NEXT_PUBLIC_API_URL` is correct

### **Backend Issues**

- [ ] Deployment failures: Check Railway logs
- [ ] Environment variables: Verify in Railway dashboard
- [ ] CORS errors: Check allowed origins configuration

### **Connection Issues**

- [ ] Frontend can't reach backend: Verify URLs and CORS
- [ ] API timeouts: Check backend health and logs
- [ ] Environment mismatch: Confirm dev vs production variables

## 📊 **Monitoring & Maintenance**

### **Health Monitoring**

- [ ] Set up health check alerts
- [ ] Monitor Railway usage and costs
- [ ] Track Vercel analytics and performance
- [ ] Set up error logging and notifications

### **Regular Maintenance**

- [ ] Update dependencies monthly
- [ ] Monitor API usage and limits
- [ ] Backup important data
- [ ] Review and optimize performance

## 🎯 **Success Criteria**

### **Functional Requirements**

- [ ] Frontend loads without errors
- [ ] Backend responds to health checks
- [ ] Session system creates and manages practice sessions
- [ ] AI question generation works
- [ ] User can complete practice sessions
- [ ] Results and feedback display correctly

### **Performance Requirements**

- [ ] Frontend loads in <3 seconds
- [ ] API responses in <2 seconds
- [ ] Session creation in <5 seconds
- [ ] No timeout errors during normal usage

### **Security Requirements**

- [ ] HTTPS enabled on all endpoints
- [ ] CORS properly configured
- [ ] API keys secured in environment variables
- [ ] No sensitive data exposed in client code

## 🔄 **Continuous Deployment**

### **GitHub Actions (Optional)**

- [ ] Workflow file created (`.github/workflows/deploy.yml`)
- [ ] Secrets configured in GitHub repository
- [ ] Auto-deployment on push to main branch
- [ ] Deployment notifications set up

### **Manual Deployment Process**

- [ ] Test changes locally
- [ ] Commit and push to GitHub
- [ ] Monitor deployment in hosting dashboards
- [ ] Verify functionality post-deployment

## 💰 **Cost Management**

### **Free Tier Limits**

- [ ] Vercel: 100GB bandwidth/month
- [ ] Railway: $5 credit/month
- [ ] Monitor usage in dashboards
- [ ] Set up usage alerts

### **Optimization Tips**

- [ ] Use CDN for static assets
- [ ] Implement caching strategies
- [ ] Optimize images and bundle sizes
- [ ] Monitor and optimize API calls

---

## 🎉 **Deployment Complete!**

Once all items are checked, your PrepVista platform will be live and accessible to users worldwide!

**🌐 Live URLs:**

- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.railway.app`
- Health Check: `https://your-backend.railway.app/health`

**📚 Documentation:**

- Full Guide: `docs/DEPLOYMENT.md`
- Project Structure: `docs/PROJECT_STRUCTURE.md`
- Session System: `docs/SESSION_SYSTEM_README.md`

**🆘 Support:**

- Check `docs/TROUBLESHOOTING.md` for common issues
- Review hosting platform dashboards for errors
- Test all functionality thoroughly before going live
