# 🚀 GitHub Push & Easy Deployment Guide

This guide gives the exact step-by-step commands to push your updated **MentorHub** code to your GitHub repository so that **Render (Backend)** and **Vercel (Frontend)** can build and deploy automatically.

---

## 📑 Table of Contents
1. [Repository Root Structure Checklist](#1-repository-root-structure-checklist)
2. [Step-by-Step Git Commands to Push to GitHub](#2-step-by-step-git-commands-to-push-to-github)
3. [Connecting a Brand New / Existing GitHub Repo](#3-connecting-a-brand-new--existing-github-repo)
4. [How Render & Vercel Automatically Deploy on Push](#4-how-render--vercel-automatically-deploy-on-push)
5. [Troubleshooting Common Git Push Issues](#5-troubleshooting-common-git-push-issues)

---

## 1. Repository Root Structure Checklist

When you push this repository to GitHub, your root directory will contain all required deployment files:

```
mentor_hub/ (Repository Root)
├── build.sh                   # ✅ Render build script (pip, collectstatic, migrate & seed_demo_data)
├── render.yaml                # ✅ Render infrastructure definition
├── requirements.txt           # ✅ Python production packages
├── Procfile                   # ✅ Gunicorn web server runner
├── manage.py                  # ✅ Django CLI entrypoint
├── mentor_hub/                # ✅ Django core settings, urls, wsgi
├── accounts/                  # ✅ Auth, profiles, notifications, report moderation & seed script
├── sessions_app/              # ✅ Sessions, multi-month plans, Razorpay, WebRTC signaling
├── chat/                      # ✅ Chat rooms, notes mode, ReportLab PDF generator
├── dashboard/                 # ✅ Admin approvals & analytics
├── docs/                      # ✅ Architecture & deployment documentation
├── .gitignore                 # ✅ Protects secrets, node_modules, and binaries
├── .env.example               # ✅ Environment variables reference template
└── frontend/                  # ✅ React 18 + Vite Frontend
    ├── package.json           # ✅ Frontend dependencies & build script (npm run build)
    ├── vercel.json            # ✅ Vercel SPA rewrite rule (prevents 404s)
    ├── vite.config.js         # ✅ Vite bundler configuration
    └── src/                   # ✅ React source code, components & pages
```

---

## 2. Step-by-Step Git Commands to Push to GitHub

Open **PowerShell** or your terminal inside the project root:

```powershell
# 1. Navigate to your project folder
cd "c:\Users\kaila\OneDrive\Desktop\guidance hub\mentor_hub"

# 2. Check the modified and new files (verified by .gitignore)
git status

# 3. Stage all updated files (documentation, build.sh, seed script, components)
git add .

# 4. Commit your changes with a descriptive message
git commit -m "feat: complete MentorHub with auto-seeding, WebRTC, Razorpay, notifications, and docs"

# 5. Ensure your primary branch is named 'main'
git branch -M main

# 6. Push to your GitHub repository
git push origin main
```

---

## 3. Connecting a Brand New / Existing GitHub Repo

If you have a newly created empty GitHub repository and haven't linked it yet:

```powershell
# 1. Initialize git if not already initialized
git init

# 2. Add your GitHub repository as remote origin (replace with your actual GitHub repo URL)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git

# 3. Stage and commit all files
git add .
git commit -m "feat: initial commit with full MentorHub codebase and deployment configs"

# 4. Set main branch and push
git branch -M main
git push -u origin main
```

> [!TIP]
> If your remote GitHub repository already has an initial `README.md` or license file created on GitHub and rejects the push, use:
> ```powershell
> git push -u origin main --force
> ```

---

## 4. How Render & Vercel Automatically Deploy on Push

Once your code is pushed to GitHub, continuous deployment takes over:

### ⚙️ 1. Render (Backend Deployment):
1. Render detects the new commit on `main`.
2. Render automatically triggers [`build.sh`](../build.sh):
   - Installs all Python dependencies from `requirements.txt`.
   - Compiles static files with `collectstatic`.
   - Creates database tables with `migrate`.
   - **Automatically seeds all demo mentors, mentees, reviews & admin accounts with `seed_demo_data`!**
3. Gunicorn starts the web service on `0.0.0.0:$PORT`.

---

### 🌐 2. Vercel (Frontend Deployment):
1. Vercel detects the new commit on `main`.
2. It detects the `frontend/` folder (configured as Root Directory).
3. Vercel runs `npm install` and `npm run build`.
4. The site is published globally with automatic HTTPS.
5. [`frontend/vercel.json`](../frontend/vercel.json) rewrites all deep URLs (`/chat`, `/mentors`, `/admin/dashboard`) to `/index.html`, ensuring 0 broken links.

---

## 5. Troubleshooting Common Git Push Issues

### Issue 1: `fatal: not a git repository`
Run `git init` in the root folder, then `git remote add origin <your-repo-url>`.

### Issue 2: `error: failed to push some refs to ...`
Your GitHub repository might have remote commits you don't have locally. Run:
```powershell
git pull origin main --rebase
git push origin main
```
Or force push if it is a brand new repo:
```powershell
git push origin main --force
```

### Issue 3: `.env` file was committed previously
If you committed `.env` in an older commit before `.gitignore` was updated:
```powershell
git rm --cached .env
git commit -m "chore: remove tracked .env file"
git push origin main
```
