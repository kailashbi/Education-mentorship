# 📚 MentorHub Documentation Hub

Welcome to the official documentation folder for **MentorHub** — the full-stack 1-on-1 mentorship, career coaching, WebRTC video calling, and marketplace platform.



## ⚡ Quick Start Reference

### Run Locally:
```bash
# 1. Backend (Django)
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py seed_demo_data
.\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000

# 2. Frontend (Vite React)
cd frontend
npm install
npm run dev
```

### Pre-Configured Demo Accounts:
| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `admin` | `admin123` | Full access to mentor approvals, analytics & chat inspector |
| **Approved Mentor** | `mentor_ankit` | `ankit123` | System Design Lead (10 yrs exp, ₹799/hr) |
| **Approved Mentor** | `mentor_yanshu` | `yanshu123` | Staff Frontend Lead (7 yrs exp, ₹599/hr) |
| **Approved Mentor** | `mentor_amit` | `amit123` | AI/ML Lead (9 yrs exp, ₹899/hr) |
| **Pending Mentor** | `mentor_pankaj` | `pankaj123` | DevOps Engineer (Pending Admin Review with Demo Video) |
| **Mentee / Student** | `mentee_dholi` | `dholi123` | Active 3-Month Plan subscriber |
| **Mentee / Student** | `mentee_rohit` | `rohit123` | Booked Mentee |
| **Reported Actor** | `crypto_spammer` | `spammer123` | Reported for off-platform financial promotion |
