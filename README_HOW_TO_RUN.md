# MentorHub — How to Run

## Prerequisites

- Python 3.10+
- MongoDB 6.0+ (running locally on port 27017)
- pip

---

## Step 1: Install MongoDB

### Ubuntu/Debian
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### macOS (Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Windows
Download and install from: https://www.mongodb.com/try/download/community  
Start MongoDB service from Services panel or run:
```
net start MongoDB
```

---

## Step 2: Setup the Django Project

```bash
# 1. Navigate into project folder
cd mentor_hub

# 2. Create a virtual environment
python -m venv venv

# 3. Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run database migrations
python manage.py makemigrations accounts
python manage.py makemigrations sessions_app
python manage.py makemigrations chat
python manage.py makemigrations dashboard
python manage.py migrate

# 6. Create a superuser (admin account)
python manage.py createsuperuser

# 7. Collect static files (optional for dev)
python manage.py collectstatic --noinput

# 8. Start the development server
python manage.py runserver
```

---

## Step 3: Access the Application

Open your browser and go to:
```
http://127.0.0.1:8000
```

- **Login Page:** http://127.0.0.1:8000/accounts/login/
- **Sign Up:** http://127.0.0.1:8000/accounts/signup/
- **Admin Panel:** http://127.0.0.1:8000/dashboard/admin/ (login with superuser)
- **Django Admin:** http://127.0.0.1:8000/admin/

---

## Step 4: Configure Agora (Video Calls)

For live video calls, you need an Agora account:

1. Sign up free at https://console.agora.io/
2. Create a new project → get your **App ID**
3. Open `mentor_hub/settings.py` and set:
```python
AGORA_APP_ID = 'your_agora_app_id_here'
AGORA_APP_CERTIFICATE = 'your_certificate_here'
```
4. Also update the `APP_ID` in `templates/sessions/video_call.html`:
```javascript
const APP_ID = 'your_agora_app_id_here';
```

> **Note:** Without Agora configured, the video call page will still load and show your local camera in demo mode.

---

## Environment Variables (Optional for Production)

Create a `.env` file:
```
SECRET_KEY=your-secret-key
DEBUG=False
MONGO_HOST=mongodb://localhost:27017
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_certificate
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `djongo` install error | Try `pip install djongo==1.3.6 pymongo==3.12.3` separately |
| MongoDB connection refused | Make sure MongoDB is running: `sudo systemctl status mongodb` |
| `No module named 'PIL'` | Run `pip install Pillow` |
| `No module named 'reportlab'` | Run `pip install reportlab` |
| Migration errors | Delete all `migrations/` folders except `__init__.py` and re-run |

---

## Creating Test Users

After running the server:
1. Go to `/accounts/signup/`
2. Create a **Mentor** account with some skills
3. Create a **Mentee** account
4. Login as mentee → Find Mentors → Request a session
5. Login as mentor → Accept the request → Start video call
