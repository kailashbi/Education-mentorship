# MentorHub — Complete Production Deployment Guide

This guide explains step-by-step how to deploy **MentorHub** to production:
- **Frontend**: Deployed on **Vercel** (Global Edge CDN, automatic HTTPS, SPA routing).
- **Backend + SQLite**: Deployed on **Render** (Python Web Service with Gunicorn & WhiteNoise).
- **Secret Keys & Environment Variables**: Complete guide on how to configure and update all secrets on both platforms.

---

## 📑 Table of Contents
1. [Prerequisites & Repository Preparation](#1-prerequisites--repository-preparation)
2. [Backend Deployment on Render (Django + SQLite)](#2-backend-deployment-on-render-django--sqlite)
3. [Frontend Deployment on Vercel (React + Vite)](#3-frontend-deployment-on-vercel-react--vite)
4. [How to Configure & Update Secret Keys on Render and Vercel](#4-how-to-configure--update-secret-keys-on-render-and-vercel)
5. [CORS & Domain Linking Configuration](#5-cors--domain-linking-configuration)
6. [Post-Deployment Seeding & Verification Checklist](#6-post-deployment-seeding--verification-checklist)

---

## 1. Prerequisites & Repository Preparation

Ensure your Git repository is pushed to **GitHub**, **GitLab**, or **Bitbucket**.

The repository root must contain:
- `build.sh` (Backend build and migration script)
- `render.yaml` (Render service definition)
- `requirements.txt` (Python packages)
- `Procfile` (Gunicorn web runner)
- `frontend/` (React application folder with `vercel.json` and `package.json`)

---

## 2. Backend Deployment on Render (Django + SQLite)

### Step 1: Create a New Web Service on Render
1. Log in to [Render.com](https://render.com/).
2. In your Dashboard, click **New +** ➡️ Select **Web Service**.
3. Connect your GitHub / GitLab repository containing `mentor_hub`.

---

### Step 2: Configure Service Settings
Fill in the following fields:

| Field | Value |
| :--- | :--- |
| **Name** | `mentorhub-backend` (or your chosen name) |
| **Region** | `Oregon (US West)` or closest to your users |
| **Branch** | `main` (or `master`) |
| **Root Directory** | *(Leave blank - root of repo)* |
| **Runtime** | `Python 3` |
| **Build Command** | `./build.sh` (or `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate`) |
| **Start Command** | `gunicorn mentor_hub.wsgi:application --bind 0.0.0.0:$PORT` |
| **Instance Type** | `Free` (or Starter for production persistent disk) |

---

### Step 3: Add Backend Environment Variables on Render
Under the **Environment Variables** section on Render, add:

| Key | Value | Explanation |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.10.12` | Ensures Python 3.10 runtime on Render. |
| `SECRET_KEY` | *(Click "Generate" or paste a 50-char random string)* | Django cryptographic signing key. |
| `DEBUG` | `False` | Disables debug mode for production security. |
| `ALLOWED_HOSTS` | `.onrender.com,localhost,127.0.0.1` | Permits Render backend URLs. |
| `CORS_ALLOW_ALL_ORIGINS` | `True` *(or your Vercel URL)* | Allows frontend to make cross-origin API calls. |
| `CORS_ALLOWED_ORIGINS` | `https://your-mentorhub-frontend.vercel.app` | Comma-separated list of allowed frontend URLs. |
| `JWT_SECRET_KEY` | *(Click "Generate" or paste a random secret)* | Key for signing JWT authentication tokens. |
| `RAZORPAY_KEY_ID` | `rzp_test_YourTestKey` | Your Razorpay API Key ID. |
| `RAZORPAY_KEY_SECRET` | `YourRazorpaySecret` | Your Razorpay API Key Secret. |

Click **Create Web Service**. Render will execute `build.sh`, run migrations, and launch Gunicorn.

---

### Step 4: (Optional) Attach a Persistent Disk for SQLite on Render
> [!TIP]
> If you are on Render's Starter plan and want `db.sqlite3` and user uploaded files to persist across redeploys, attach a **Persistent Disk**:
> 1. Go to your Web Service ➡️ Click **Disks** ➡️ **Add Disk**.
> 2. Set **Mount Path** to `/data`.
> 3. Set **Size** to `1 GB`.

---

## 3. Frontend Deployment on Vercel (React + Vite)

### Step 1: Import Project on Vercel
1. Log in to [Vercel.com](https://vercel.com/).
2. Click **Add New...** ➡️ Select **Project**.
3. Select your `mentor_hub` repository.

---

### Step 2: Configure Build & Output Settings
1. In the **Root Directory** field, click **Edit** ➡️ Select the `frontend` folder.
2. Vercel will automatically detect **Vite** as the framework preset:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

---

### Step 3: Add Frontend Environment Variables on Vercel
Expand the **Environment Variables** section and add:

| Key | Value | Explanation |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://mentorhub-backend.onrender.com` | **Your deployed Render Backend URL** (without trailing slash). |
| `VITE_RAZORPAY_KEY_ID` | `rzp_test_YourTestKey` | Your Razorpay Key ID for client-side checkout. |

Click **Deploy**. Vercel will build the React bundle and deploy your site to a global URL (e.g. `https://mentorhub-frontend.vercel.app`).

---

### Step 4: Verify Single-Page Application (SPA) Routing
The `frontend/vercel.json` file in your repository contains the rewrite rule:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This ensures that refreshing deep links like `/chat`, `/mentors`, or `/admin/dashboard` never returns a 404 error on Vercel.

---

## 4. How to Configure & Update Secret Keys on Render and Vercel

### 🔄 Updating Secret Keys on Render (Backend)
1. Log in to **Render Dashboard** ➡️ Select your **`mentorhub-backend`** Web Service.
2. In the left navigation menu, click **Environment**.
3. You will see the list of all environment variables.
4. To update a key (e.g. `RAZORPAY_KEY_SECRET` or `SECRET_KEY`):
   - Click the value box next to the key name.
   - Enter the new secret value.
5. Click **Save Changes** at the bottom of the page.
6. Render will automatically trigger a **zero-downtime redeployment** with your updated secret keys.

---

### 🔄 Updating Environment Variables on Vercel (Frontend)
1. Log in to **Vercel Dashboard** ➡️ Select your **`mentorhub-frontend`** project.
2. Click the **Settings** tab at the top ➡️ Click **Environment Variables** in the left sidebar.
3. Find `VITE_API_URL` or `VITE_RAZORPAY_KEY_ID`:
   - Click the **•••** (options) menu next to the variable ➡️ Click **Edit**.
   - Enter the new URL or Key ID.
   - Click **Save**.
4. To apply the new environment variable, trigger a redeploy:
   - Go to the **Deployments** tab ➡️ Click the latest deployment ➡️ Click **Redeploy**.

---

## 5. CORS & Domain Linking Configuration

To ensure the Vercel frontend can securely communicate with the Render backend without CORS errors:

1. Copy your Vercel live URL (e.g. `https://mentorhub-frontend.vercel.app`).
2. Go to **Render** ➡️ Environment Variables:
   - Set `CORS_ALLOWED_ORIGINS` = `https://mentorhub-frontend.vercel.app`
   - Set `ALLOWED_HOSTS` = `.onrender.com,localhost,127.0.0.1,mentorhub-frontend.vercel.app`
3. Save changes on Render.

---

## 6. Post-Deployment Seeding & Verification Checklist

### 1. Seed Demo Data on Render
To populate your production database with pre-configured mentors, mentees, reviews, sessions, and incident reports:

1. In Render Dashboard, open your `mentorhub-backend` service.
2. Click the **Shell** tab in the left sidebar to open the live terminal.
3. Run the following command:
   ```bash
   python manage.py seed_demo_data
   ```
4. You will see the success output listing all demo credentials:
   - **Admin**: `admin` / `admin123`
   - **Mentor 1**: `mentor_ankit` / `ankit123` (Approved)
   - **Mentor 2**: `mentor_yanshu` / `yanshu123` (Approved)
   - **Mentor 3**: `mentor_amit` / `amit123` (Approved)
   - **Mentor 4**: `mentor_pankaj` / `pankaj123` (Pending Review)
   - **Mentee 1**: `mentee_dholi` / `dholi123`
   - **Mentee 2**: `mentee_rohit` / `rohit123`
   - **Reported Actor**: `crypto_spammer` / `spammer123`

---

### 2. Verification Checklist
- [x] **Frontend Loads**: Visit your Vercel URL and verify the Landing Page renders.
- [x] **Authentication**: Log in with `mentee_dholi` / `dholi123` and `admin` / `admin123`.
- [x] **Mentor Video Pitch**: Click "Demo Pitch" on mentor cards to verify video playback.
- [x] **Razorpay Checkout**: Test booking a session and verify signature validation.
- [x] **WebRTC Video Call**: Open `/sessions/live/1` on two tabs and verify peer video, audio waveforms, and screen sharing.
- [x] **Notifications**: Verify the bell icon displays unread alerts and "Mark all read" clears counts.
- [x] **Admin Actions**: Verify approving mentors and inspecting report chat logs in the Admin Dashboard.
