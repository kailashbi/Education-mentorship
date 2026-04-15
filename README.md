# Mentorship platform

A web-based platform built using **Django** that connects mentors and mentees for learning, guidance, and collaboration. The system allows users to search mentors, communicate via chat, and request live sessions.

---

## Features

* 🔐 User Authentication (Signup/Login for Mentor & Mentee)
* 👨‍🏫 Mentor & Mentee Profile Management
* 🔍 Mentor Search (by skills and name)
* 💬 Chat System (message storage & retrieval)
* 📅 Session Request & Management
* ⭐ Rating System (post-session feedback)
* 🎥 Video Call Interface (session-based)

---

## 🛠️ Technologies Used

### 🔹 Backend

* Django (Python Web Framework)

### 🔹 Frontend

* HTML, CSS, Bootstrap
* JavaScript

### 🔹 Database

* SQLite (Relational Database)

---

## 🧠 Project Architecture

The project follows **Django MVT (Model–View–Template)** architecture:

* **Models** → Define database structure
* **Views** → Handle business logic
* **Templates** → Render UI

---

## 🗄️ Database Information

* Database used: **SQLite**
* File location:

  ```
  db.sqlite3
  ```
* Data is stored in relational tables such as:

  * `auth_user` (users)
  * `accounts_mentorprofile`
  * `accounts_menteeprofile`
  * `chat_message`
  * `sessions`

---

## 💬 Chat System (Current Implementation)

The chat system is implemented using **Django views and SQLite database**.

* Messages are:

  * Stored in the database
  * Retrieved via HTTP requests
* Communication follows a **request-response cycle**

⚠️ **Note:**
This is **not a real-time chat system**. Messages are updated only on page reload.

### 🔄 Future Enhancement

The chat system can be upgraded to real-time using:

* WebSockets
* Django Channels
* Redis

---

## 📹 Video Calling (Current Implementation)

The video calling feature is designed as a **session-based interaction system**:

* Mentee sends a session request
* Mentor accepts/rejects
* Both users are redirected to a video call interface

⚠️ **Note:**
Real-time peer-to-peer video communication is **not fully implemented**.

### 🔄 Future Enhancement

To enable real-time video calling, the following technologies can be integrated:

* WebRTC (for peer-to-peer communication)
* STUN/TURN servers (network handling)
* WebSockets (signaling server)

OR use APIs like:

* Agora
* Twilio Video
* Jitsi Meet

---

## ⚠️ Known Limitations

* Chat is not real-time (requires refresh)
* Video calling is UI-based (not full WebRTC)
* SQLite is not ideal for large-scale production

---

## 🚀 Future Improvements

* ✅ Real-time chat using Django Channels
* ✅ Video calling using WebRTC or Agora
* ✅ Upgrade database to PostgreSQL
* ✅ Add notifications system
* ✅ Deploy on cloud (AWS / Heroku)

---


## 🎯 Conclusion

This project demonstrates a **full-stack Django application** with modular architecture, user interaction features, and scalable design. While the current implementation uses HTTP-based communication, it is designed to be extended into a **real-time system using WebSockets and WebRTC technologies**.

---

---

## 📌 Note

This project is developed for **learning and demonstration purposes** and can be extended into a production-ready system with real-time capabilities.
