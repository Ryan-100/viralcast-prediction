# ViralCast Render Deployment - Step-by-Step Guide

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- [ ] GitHub account (free)
- [ ] Render account (sign up at render.com - free)
- [ ] Git installed on your computer
- [ ] All project files ready

---

## 🚀 STEP 1: Prepare Your GitHub Repository

### 1.1 Initialize Git (if not already done)

Open terminal in your project directory and run:

```bash
cd "c:\My stuff\Machine Learning\FTL Machine Learning Bootcamp\group-work"
git init
```

### 1.2 Create .gitignore file

This prevents unnecessary files from being uploaded:

```bash
# Create .gitignore in viralcast_ui directory
cd viralcast_ui
```

The `.gitignore` file has been created for you with:
```
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info/
.env
.venv
venv/
*.log
.DS_Store
```

### 1.3 Add and Commit Files

```bash
git add .
git commit -m "Initial commit - ViralCast Airborne Disease Platform"
```

### 1.4 Create GitHub Repository

1. Go to https://github.com
2. Click the **"+"** icon (top right) → **"New repository"**
3. Repository name: `viralcast-platform`
4. Description: `Real-time Airborne Disease Intelligence Platform`
5. Choose **Public** (required for Render free tier)
6. **DO NOT** initialize with README (you already have files)
7. Click **"Create repository"**

### 1.5 Push to GitHub

Copy the commands from GitHub (they'll look like this):

```bash
git remote add origin https://github.com/YOUR-USERNAME/viralcast-platform.git
git branch -M main
git push -u origin main
```

**✅ Checkpoint:** Your code should now be visible on GitHub!

---

## 🎨 STEP 2: Deploy Backend API to Render

### 2.1 Sign Up for Render

1. Go to https://render.com
2. Click **"Get Started"**
3. Sign up with GitHub (recommended) or email
4. Authorize Render to access your GitHub

### 2.2 Create New Web Service

1. Click **"New +"** (top right)
2. Select **"Web Service"**
3. Click **"Connect a repository"**
4. Find and select **`viralcast-platform`**
5. Click **"Connect"**

### 2.3 Configure Web Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `viralcast-api` |
| **Region** | Choose closest to you |
| **Root Directory** | `viralcast_ui` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn api_server:app` |

### 2.4 Set Environment Variables (Optional)

Scroll down to **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.11.0` |
| `FLASK_ENV` | `production` |

### 2.5 Choose Free Plan

1. Scroll to **"Instance Type"**
2. Select **"Free"** ($0/month)
3. Click **"Create Web Service"**

### 2.6 Wait for Deployment

- Render will now build and deploy your API
- This takes **5-10 minutes** (TensorFlow is large)
- Watch the logs in real-time
- Look for: `"Your service is live 🎉"`

### 2.7 Copy Your API URL

Once deployed, you'll see your API URL at the top:
```
https://viralcast-api.onrender.com
```

**✅ Checkpoint:** Test your API by visiting:
```
https://viralcast-api.onrender.com/health
```

You should see: `{"status": "healthy", "service": "ViralCast API"}`

---

## 🌐 STEP 3: Deploy Frontend to Render

### 3.1 Update Frontend API URL

**IMPORTANT:** Before deploying frontend, update the API URL in `app.js`:

1. Open `viralcast_ui/app.js`
2. Find line 4: `const API_BASE_URL = 'http://localhost:5000/api';`
3. Replace with your Render API URL:

```javascript
const API_BASE_URL = 'https://viralcast-api.onrender.com/api';
```

4. Save the file

### 3.2 Commit and Push Changes

```bash
git add viralcast_ui/app.js
git commit -m "Update API URL for production"
git push
```

### 3.3 Create Static Site on Render

1. Go back to Render dashboard
2. Click **"New +"** → **"Static Site"**
3. Select your **`viralcast-platform`** repository
4. Click **"Connect"**

### 3.4 Configure Static Site

| Setting | Value |
|---------|-------|
| **Name** | `viralcast-frontend` |
| **Root Directory** | `viralcast_ui` |
| **Build Command** | (leave empty) |
| **Publish Directory** | `.` |

### 3.5 Deploy

1. Click **"Create Static Site"**
2. Wait 1-2 minutes for deployment
3. Your frontend URL will be shown:
   ```
   https://viralcast-frontend.onrender.com
   ```

**✅ Checkpoint:** Visit your frontend URL and test the app!

---

## 🎉 STEP 4: Test Your Deployed App

### 4.1 Open Your App

Visit: `https://viralcast-frontend.onrender.com`

### 4.2 Test Custom Prediction

1. Click **"Custom Location"**
2. Enter:
   - Location: `United States`
   - Cases: `50000`
   - Hospitalizations: `5000`
   - Stringency: `30`
   - Mobility: `10`
   - Vaccination: `70`
3. Click **"Generate Prediction"**
4. Verify the dashboard updates

### 4.3 Check All Features

- [ ] Location validation works
- [ ] Predictions display correctly
- [ ] Charts render properly
- [ ] Stats panel updates
- [ ] Key Drivers cards update
- [ ] Executive summary shows

---

## 🔧 STEP 5: Optional Enhancements

### 5.1 Custom Domain (Optional)

1. In Render dashboard, go to your static site
2. Click **"Settings"** → **"Custom Domain"**
3. Add your domain (e.g., `viralcast.yourdomain.com`)
4. Follow DNS instructions

### 5.2 Enable HTTPS (Automatic)

Render automatically provides SSL certificates - your site is already HTTPS! 🔒

### 5.3 Monitor Your App

1. Go to Render dashboard
2. Click on your service
3. View **"Logs"** tab for real-time monitoring
4. Check **"Metrics"** for performance

---

## 🐛 Troubleshooting

### Issue 1: API Returns 404

**Solution:** Check that your API URL in `app.js` is correct:
```javascript
const API_BASE_URL = 'https://YOUR-API-NAME.onrender.com/api';
```

### Issue 2: CORS Error

**Solution:** The API already has CORS enabled. If you still see errors:
1. Check browser console for exact error
2. Verify API is running (visit `/health` endpoint)

### Issue 3: Build Failed

**Solution:** Check Render logs for errors. Common fixes:
- Ensure `requirements.txt` is in `viralcast_ui` directory
- Verify Python version compatibility
- Check that model files exist

### Issue 4: App is Slow on First Load

**Explanation:** Render free tier spins down after 15 minutes of inactivity.
**Solution:** 
- First load takes 30-60 seconds (cold start)
- Subsequent loads are fast
- Upgrade to paid tier ($7/month) for always-on

### Issue 5: Model File Too Large

**Solution:** If Git refuses to push large model files:
```bash
# Install Git LFS
git lfs install
git lfs track "*.keras"
git add .gitattributes
git commit -m "Add Git LFS"
git push
```

---

## 📊 Deployment Summary

After completing all steps, you'll have:

✅ **Backend API**: `https://viralcast-api.onrender.com`
- Serves predictions
- Handles custom inputs
- Health monitoring

✅ **Frontend**: `https://viralcast-frontend.onrender.com`
- Beautiful UI
- Interactive predictions
- Real-time updates

✅ **Features**:
- Custom location input
- Multi-factor predictions
- Dynamic visualizations
- Risk assessment

---

## 🚀 Next Steps

### Share Your App
- Share the frontend URL with others
- Add to your portfolio
- Include in your resume

### Monitor Usage
- Check Render dashboard for metrics
- View logs for errors
- Monitor response times

### Future Improvements
- Add Google Analytics
- Implement caching
- Add more diseases
- Create mobile app

---

## 📞 Quick Commands Reference

### Local Development
```bash
# Run API locally
cd viralcast_ui
python api_server.py

# Test locally
# Open index.html in browser
```

### Git Commands
```bash
# Check status
git status

# Add changes
git add .

# Commit
git commit -m "Your message"

# Push to GitHub
git push

# View remote
git remote -v
```

### Render CLI (Optional)
```bash
# Install Render CLI
npm install -g render-cli

# Login
render login

# View services
render services list

# View logs
render logs -s viralcast-api
```

---

## ✅ Final Checklist

Before sharing your app, verify:

- [ ] GitHub repository is public
- [ ] Backend API is deployed and healthy
- [ ] Frontend is deployed and accessible
- [ ] API URL in app.js is updated
- [ ] Test prediction works end-to-end
- [ ] All features are functional
- [ ] No console errors in browser
- [ ] Mobile responsive (test on phone)

---

## 🎓 What You've Accomplished

You've successfully:
1. ✅ Created a production-ready ML web application
2. ✅ Deployed backend API to the cloud
3. ✅ Deployed frontend to the cloud
4. ✅ Connected frontend and backend
5. ✅ Made it accessible worldwide

**Congratulations! Your ViralCast platform is now live! 🎉**

---

## 📚 Additional Resources

- **Render Docs**: https://render.com/docs
- **Flask Deployment**: https://flask.palletsprojects.com/en/latest/deploying/
- **Git Tutorial**: https://git-scm.com/book/en/v2

---

**Need Help?**

If you encounter issues:
1. Check the troubleshooting section above
2. Review Render logs for error messages
3. Verify all files are committed to GitHub
4. Test API health endpoint
5. Check browser console for frontend errors

**Your app is ready to impress! 🚀**
