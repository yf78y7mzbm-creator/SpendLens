# Quick Cloud Deployment Guide

Deploy SpendLens to the cloud in **5 minutes** with zero local setup.

## Fastest Path: Railway.app (Backend + Database + Frontend)

Railway handles everything in one place, free tier included.

### Step 1: Push Code to GitHub

```bash
cd /Users/rr/Documents/SpendLens

# Initialize git repo (if not already done)
git init
git add .
git commit -m "Initial SpendLens commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/spendlens.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend + Database on Railway

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Select your `spendlens` repository
4. Railway will auto-detect it's a Node.js project
5. Click **"Deploy"**

Railway automatically:
- Detects `backend/package.json`
- Builds with `npm install && npm run build`
- Starts with `npm start`
- Creates a PostgreSQL database automatically
- Sets `DATABASE_URL` environment variable

**Your backend is now live!** Railway gives you a URL like: `https://spendlens-api-production.up.railway.app`

### Step 3: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"** → **"Import Git Repository"**
3. Select your `spendlens` repository
4. Vercel auto-detects it's a Vite/React project
5. In settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Add environment variable:
   - `VITE_API_URL=https://spendlens-api-production.up.railway.app/api`
7. Click **"Deploy"**

Vercel automatically:
- Builds your frontend with Vite
- Deploys to global CDN
- Gives you a live URL like: `https://spendlens.vercel.app`

### Step 4: Update Frontend to Use Live API

Edit `frontend/src/services/api.ts`:

```typescript
const API_BASE = process.env.VITE_API_URL || '/api'
```

This uses the environment variable for production, local proxy for development.

### Done! 🎉

Your app is now live:
- **Frontend:** https://spendlens.vercel.app
- **Backend API:** https://spendlens-api-production.up.railway.app
- **Database:** Managed by Railway (private)

---

## Alternative: Vercel + Render (Better Separation)

If you prefer separate services:

### Frontend: Vercel (Same as above)

1. [vercel.com](https://vercel.com) → New Project → Import repo
2. Set root directory to `frontend`
3. Deploy

### Backend: Render.com

1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub, select repo
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Add environment variables:
   - `DATABASE_URL=postgresql://...` (from step below)
   - `NODE_ENV=production`
   - `PORT=3000`
6. Deploy

### Database: Neon.tech (Free PostgreSQL)

1. Go to [neon.tech](https://neon.tech)
2. Sign up, create a project
3. Copy the connection string (looks like `postgresql://user:pass@host/db`)
4. Paste into Render's `DATABASE_URL` environment variable
5. Done!

---

## What You Get After Deployment

✅ **Live Application**
- Users can access https://your-domain.vercel.app
- Plan budgets, upload CSV, view analytics
- No local setup needed

✅ **Production Database**
- Hosted PostgreSQL
- Auto-backups
- Scalable

✅ **Automatic Redeploys**
- Push to GitHub → Auto-deploy
- Zero downtime

✅ **Custom Domain** (Optional)
- Vercel: Add domain in settings
- Railway: Add custom domain

---

## Cost

**Free tier covers:**
- Vercel: Unlimited deployments, 100GB bandwidth/month
- Railway: $5/month free credit (covers small app)
- Neon: Free PostgreSQL up to 3 projects

**For production scale:** ~$20-50/month for both services

---

## Monitoring & Logs

**Vercel Logs:**
- Dashboard → Project → Logs tab
- See build and runtime errors

**Railway Logs:**
- Dashboard → Project → Logs
- Real-time server output

**Database:**
- Neon → Connect → Query Database in browser
- Or use psql command line

---

## Troubleshooting Deployment

**"Build failed"**
- Check build command output in dashboard logs
- Verify `package.json` exists in root of selected directory
- Check for missing dependencies

**"Cannot connect to database"**
- Verify `DATABASE_URL` environment variable is set
- Check PostgreSQL is initialized (should happen auto)
- Restart service after adding env vars

**"Frontend can't reach backend API"**
- Verify `VITE_API_URL` points to correct backend URL
- Check backend service is running (green status in dashboard)
- Check CORS is enabled in backend (it is by default)

---

## Next Steps

After deployment:

1. **Test the app:** Go to your Vercel URL
2. **Customize domain:** Buy a domain, connect to Vercel
3. **Add features:**
   - User authentication
   - Email notifications
   - Mobile app
4. **Scale up:**
   - Upgrade Railway/Render tiers
   - Add CDN
   - Database optimization

---

## Rollback / Updates

**Push new code:**
```bash
git commit -m "Your changes"
git push origin main
```

Vercel & Railway automatically redeploy. Takes 2-3 minutes.

**Rollback:**
- Vercel: Dashboard → Deployments → Select previous → "Redeploy"
- Railway: Dashboard → Deployments → Select previous → "Redeploy"

---

**That's it! Your budget app is live and accessible worldwide.** 🌍

Questions? Check service dashboards or documentation:
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Neon Docs](https://neon.tech/docs)
