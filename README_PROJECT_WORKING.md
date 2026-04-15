# MentorHub — Project Working & Architecture

## Overview

MentorHub is a full-stack web application built with **Django** (backend) and **MongoDB** (database via djongo). It connects mentors and mentees for live 1-on-1 learning sessions, real-time chat, note sharing, and video calls.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend Framework | Django 4.2 |
| Database | MongoDB (via djongo ORM) |
| Video Calls | Agora RTC SDK (Web) |
| PDF Export | ReportLab |
| Image Handling | Pillow |
| Frontend | Bootstrap 5, Vanilla JS |
| Fonts | Google Fonts (Syne + DM Sans) |

---

## Application Modules

### 1. `accounts` — User Management
Handles all authentication, user profiles, and mentor discovery.

**Models:**
- `User` — Extended Django AbstractUser with `role` field (mentor / mentee / admin), `is_suspended`, `profile_picture`
- `MentorProfile` — Skills, experience, hourly rate, availability, ratings, total sessions
- `MenteeProfile` — Interests, learning goals, education

**Key Features:**
- Role-based signup (separate mentor/mentee registration forms)
- Login with suspension check — suspended users are blocked at login
- Mentor search by name or skill with rating-based sorting
- Mentor detail page with full profile and reviews

**URLs:**
```
/accounts/login/              → Login
/accounts/logout/             → Logout
/accounts/signup/             → Choose role
/accounts/signup/mentor/      → Mentor registration
/accounts/signup/mentee/      → Mentee registration
/accounts/profile/edit/       → Edit profile
/accounts/mentors/            → Search mentors
/accounts/mentors/<id>/       → Mentor detail
```

---

### 2. `sessions_app` — Session Management
Handles the complete lifecycle of a mentoring session.

**Models:**
- `SessionRequest` — Mentee requests a session with a mentor (topic, proposed date, duration, status)
- `LiveSession` — Created when mentor accepts a request; holds Agora channel name
- `Review` — Submitted by mentee after a completed session (1-5 stars + comment)

**Session Lifecycle:**
```
Mentee sends request → Mentor reviews → Accept/Reject
         ↓ (if accepted)
   LiveSession created with unique channel name
         ↓
   Mentor starts video call → Mentee joins
         ↓
   Mentor ends call → Status = "completed"
         ↓
   Mentee submits review → MentorProfile rating updated
```

**Status Flow:**
```
pending → accepted → completed
       ↘ rejected
```

**URLs:**
```
/sessions/request/<mentor_id>/    → Request session (mentee only)
/sessions/requests/               → View & manage requests (mentor only)
/sessions/accept/<id>/            → Accept request (mentor only)
/sessions/reject/<id>/            → Reject request (mentor only)
/sessions/video/<id>/             → Join video call
/sessions/video/<id>/end/         → End call (mentor only)
/sessions/review/<id>/            → Submit review (mentee only)
/sessions/my/                     → All my sessions
```

---

### 3. `chat` — Real-Time Chat & Notes
Provides 1-on-1 chat between any mentor-mentee pair with note sharing and PDF export.

**Models:**
- `ChatRoom` — One room per mentor-mentee pair (unique_together constraint)
- `Message` — Text, note, or file attachment; `is_note` flag distinguishes notes from regular messages

**Message Types:**
| Type | Description |
|------|-------------|
| `text` | Regular chat message |
| `note` | Highlighted note (yellow border) — for sharing important info |
| `file` | File attachment (PDF, images, docs) |

**Real-time Polling:**
The chat uses JavaScript `setInterval` polling every 3 seconds to fetch new messages via `/chat/messages/<room_id>/?last_id=<N>` — lightweight and works without WebSockets.

**PDF Export:**
Uses **ReportLab** to generate a full PDF transcript of the chat conversation (including notes). Accessible via the "Export PDF" button in the chat room.

**URLs:**
```
/chat/                        → List all chats
/chat/room/<room_id>/         → Open a chat room
/chat/with/<user_id>/         → Open/create chat with a specific user
/chat/send/<room_id>/         → POST: send a message (AJAX)
/chat/messages/<room_id>/     → GET: fetch new messages (AJAX polling)
/chat/export/<room_id>/       → Download chat as PDF
```

---

### 4. `dashboard` — Role-Based Dashboards
Renders the correct dashboard based on user role after login.

**Mentor Dashboard:**
- Pending request count (highlighted if > 0)
- Live session status with rejoin/end buttons
- Upcoming accepted sessions
- Recent reviews received

**Mentee Dashboard:**
- All session history with status
- Pending review alerts
- Live session join button if a session is active
- Quick links to find mentors

**Admin Dashboard:**
- Platform stats (total mentors, mentees, sessions)
- Full user management (suspend / unsuspend / delete)
- All sessions overview
- Violations tab — lists all suspended users

**URLs:**
```
/dashboard/mentor/            → Mentor dashboard
/dashboard/mentee/            → Mentee dashboard
/dashboard/admin/             → Admin panel
/dashboard/admin/suspend/<id>/  → Toggle user suspension
/dashboard/admin/delete/<id>/   → Delete user permanently
```

---

## Video Call Architecture

```
Mentee (Browser)                    Mentor (Browser)
      |                                    |
      |  --- Join Agora Channel ---→       |
      |                                    |
      |  ←--- Agora RTC SDK (WebRTC) ---→  |
      |        (Audio + Video Tracks)      |
      |                                    |
      |         Agora Cloud Relay          |
```

**How it works:**
1. When mentor accepts a session request, a `LiveSession` is created with a unique `channel_name` (UUID-based)
2. Both mentor and mentee navigate to `/sessions/video/<id>/`
3. The Agora Web SDK initializes with `APP_ID` and the shared `channel_name`
4. Users publish local audio/video tracks; remote tracks auto-subscribe
5. Mentor clicks "End Call" → Django marks session as `completed` → mentee is redirected

**Demo Mode (without Agora):**
If `APP_ID` is not set, the page shows a local camera preview using the browser `getUserMedia` API — useful for testing UI without Agora setup.

---

## Database Schema (MongoDB Collections)

```
accounts_user
  ├── username, email, first_name, last_name
  ├── role: "mentor" | "mentee" | "admin"
  ├── is_suspended, is_verified
  └── profile_picture, bio, phone

accounts_mentorprofile
  ├── user_id (→ accounts_user)
  ├── skills (comma-separated string)
  ├── experience_years, hourly_rate, availability
  ├── linkedin_url, github_url
  └── average_rating, total_reviews, total_sessions

accounts_menteeprofile
  ├── user_id (→ accounts_user)
  ├── interests, learning_goals, education

sessions_app_sessionrequest
  ├── mentee_id, mentor_id
  ├── topic, description
  ├── proposed_date, duration_minutes
  ├── status: pending|accepted|rejected|completed|cancelled
  └── mentor_note

sessions_app_livesession
  ├── session_request_id (1-to-1)
  ├── mentee_id, mentor_id
  ├── channel_name (unique Agora channel)
  ├── is_active, started_at, ended_at

sessions_app_review
  ├── session_id (1-to-1)
  ├── mentee_id, mentor_id
  ├── rating (1–5), comment

chat_chatroom
  ├── mentor_id, mentee_id (unique pair)
  └── last_message_at

chat_message
  ├── room_id, sender_id
  ├── content, message_type: text|note|file
  ├── attachment (file path)
  ├── is_note, is_read
  └── created_at
```

---

## Security & Access Control

| Feature | Implementation |
|---------|---------------|
| Login required | `@login_required` decorator on all protected views |
| Role checks | Every view checks `request.user.role` before acting |
| Suspension | Suspended users blocked at login; cannot access any page |
| CSRF protection | Django CSRF middleware on all POST requests |
| Admin-only actions | Superuser or `role == 'admin'` check on all admin views |
| Chat access | Users can only read/write in rooms they belong to |
| Session access | Only mentor/mentee of that session can join the call |

---

## User Roles Summary

| Action | Mentee | Mentor | Admin |
|--------|--------|--------|-------|
| Search mentors | ✅ | ✅ | ✅ |
| Request session | ✅ | ❌ | ❌ |
| Accept/Reject session | ❌ | ✅ | ❌ |
| Start video call | ❌ | ✅ | ❌ |
| Join video call | ✅ | ✅ | ❌ |
| End video call | ❌ | ✅ | ❌ |
| Submit review | ✅ | ❌ | ❌ |
| Chat | ✅ | ✅ | ❌ |
| Export chat PDF | ✅ | ✅ | ❌ |
| Suspend users | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ✅ |
| View all sessions | ❌ | ❌ | ✅ |

---

## Folder Structure

```
mentor_hub/
├── manage.py
├── requirements.txt
├── README_HOW_TO_RUN.md
├── README_PROJECT_WORKING.md
│
├── mentor_hub/              # Django project config
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
│
├── accounts/                # User auth & profiles
│   ├── models.py            # User, MentorProfile, MenteeProfile
│   ├── views.py             # Login, signup, search, profile
│   ├── forms.py             # Signup & edit forms
│   └── urls.py
│
├── sessions_app/            # Session lifecycle
│   ├── models.py            # SessionRequest, LiveSession, Review
│   ├── views.py             # Request, accept, video call, review
│   └── urls.py
│
├── chat/                    # Chat system
│   ├── models.py            # ChatRoom, Message
│   ├── views.py             # Chat, send, poll, PDF export
│   └── urls.py
│
├── dashboard/               # Dashboards
│   ├── views.py             # Mentor, mentee, admin dashboards
│   └── urls.py
│
├── templates/               # All HTML templates
│   ├── base.html            # Master layout with navbar
│   ├── accounts/            # Login, signup, mentor list/detail
│   ├── sessions/            # Request, video call, review, list
│   ├── chat/                # Chat list, chat room
│   └── dashboard/           # Mentor, mentee, admin dashboards
│
├── static/                  # Static assets
│   ├── css/
│   ├── js/
│   └── images/
│
└── media/                   # Uploaded files (auto-created)
    ├── profiles/
    └── chat_files/
```
