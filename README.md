# 🎯 HireWizard - Your AI Job Hunt

A full-stack job aggregator platform that scrapes job listings from multiple job portals and provides an intuitive dashboard for job seekers to search, filter, apply, and track job applications.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Filters Guide](#filters-guide)
- [Team Work Distribution](#team-work-distribution)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)

---

## ✨ Features

### 🔐 Authentication
- User signup with email and password
- Secure login with password hashing
- Session management with localStorage
- Profile completion flow

### 💼 Job Browsing
- Unified dashboard showing jobs from multiple sources
- Real job listings from Naukri, Indeed, and LinkedIn
- Detailed job information with company, salary, experience, and skills
- Job detail modal with full description
- Load more pagination (6 jobs per load)

### 🔍 Advanced Filtering
- **Location Filter**: Bangalore, Dehradun, Gurgaon, Noida, Delhi
- **Salary Filter**: 3-5 LPA, 5-10 LPA, 10-15 LPA, 15-20 LPA, 20+ LPA
- **Experience Filter**: 0-2 years, 2-4 years, 4-6 years, 6+ years
- **Source Filter**: Naukri, Indeed, LinkedIn
- **Search Bar**: Search by job title or company name
- Combined filtering support

### 📝 Job Application Tracking
- Apply to jobs with one click
- Track application status
- View all applied jobs
- Application history

### 💾 Save Jobs
- Save favorite jobs for later
- Saved jobs dashboard
- Quick unsave functionality

### 📊 Analytics
- Platform statistics
- Jobs by source breakdown
- Jobs by location distribution
- Total users, applications, and saved jobs

### 👤 User Profile
- Profile setup with experience, skills, education
- Resume upload (PDF, DOC, DOCX)
- Drag-and-drop resume upload

### 🎨 UI/UX
- Modern glassmorphism design
- Animated particle background
- Responsive layout
- Toast notifications
- Modal dialogs for job details and profile setup
- Professional color scheme (purple/indigo)

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Glassmorphism, backdrop-filter effects
- **JavaScript (Vanilla)** - No frameworks, pure ES6+
- **Canvas API** - Particle animation system
- **FontAwesome** - Icons
- **Google Fonts (Poppins)** - Typography

### Backend
- **Python 3** - Server language
- **Flask 3.0** - Web framework
- **Flask-CORS** - Cross-origin requests
- **BeautifulSoup4** - Web scraping
- **Requests** - HTTP library
- **APScheduler** - Background job scheduling
- **Werkzeug** - Password hashing

### Data Storage
- **JSON** - User data, jobs, applications, saved jobs
- **Local File System** - File uploads

---

## 📁 Project Structure

```
webscrapper/
├── backend/
│   ├── app.py                 # Flask application
│   ├── scraper.py             # Job scraping logic
│   └── requirements.txt        # Python dependencies
│
├── frontend/
│   ├── index.html             # Main HTML
│   ├── styles.css             # Styling
│   └── app.js                 # Frontend logic
│
├── data/
│   ├── users.json             # User accounts
│   ├── jobs.json              # Job listings
│   ├── applications.json       # User applications
│   └── saved_jobs.json        # Saved jobs
│
├── uploads/
│   └── [resume files]         # User uploaded resumes
│
├── QUICK_START.md             # Quick start guide
├── FILTER_FIX_SUMMARY.md      # Filter technical details
├── FILTER_VALUES_REFERENCE.md # Filter value matching
├── README.md                  # This file
└── other documentation files
```

---

## 📦 Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser

### Step 1: Navigate to Project
```bash
cd webscrapper
```

### Step 2: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 3: Create Required Directories
```bash
cd ..
mkdir -p data
mkdir -p uploads
```

---

## 🚀 Running the Application

### Start Backend Server

```powershell
cd backend
python app.py
```

**Expected Output:**
```
==================================================
HireWizard - Job Aggregator Platform
==================================================
Server: http://localhost:5000
Auto-loading: Every 6 hours
==================================================
```

### Access Application
```
http://localhost:5000
```

---

## 📊 Filter Values Reference

### ✅ Salary Options
- `3-5 LPA`
- `5-10 LPA`
- `10-15 LPA`
- `15-20 LPA`
- `20+ LPA`

### ✅ Experience Options
- `0-2 years`
- `2-4 years`
- `4-6 years`
- `6+ years`

### ✅ Location Options
- `Bangalore`
- `Dehradun`
- `Gurgaon`
- `Noida`
- `Delhi NCR`

### ✅ Source Options
- `Naukri`
- `Indeed`
- `LinkedIn`

---

## 🔄 API Endpoints

### Authentication
```
POST /api/auth/signup     - User registration
POST /api/auth/login      - User login
```

### Jobs
```
GET  /api/jobs            - Get all jobs
POST /api/jobs/filter     - Filter jobs by criteria
GET  /api/jobs/<id>       - Get job details
POST /api/jobs/scrape     - Manual job scraping
```

### Applications
```
POST /api/applications/apply              - Apply to job
GET  /api/applications/user/<user_id>     - Get user applications
```

### Saved Jobs
```
POST /api/saved/add                - Save job
GET  /api/saved/user/<user_id>     - Get saved jobs
POST /api/saved/remove             - Remove saved job
```

### Analytics
```
GET /api/analytics/stats   - Get platform statistics
```

---

## 👥 Team Work Distribution

### Team: Kishori
**Members:**
- Urvashi Kashyap (Team Lead) - 30%
- Supriya Rawat - 40%
- Ridham Singh - 30%

### Responsibility Areas

**Urvashi Kashyap (30%)**
- Backend: scraper.py (web scraping)
- Backend: app.py (scheduler, resume upload, applications, server)
- Frontend: HTML structure and API integration

**Supriya Rawat (40%)**
- Backend: app.py (profile, saved jobs, error handling)
- Backend: scraper.py (LinkedIn scraping, skills extraction)
- Frontend: Complete CSS styling (1457+ lines)

**Ridham Singh (30%)**
- Backend: app.py (frontend serving, auth, jobs, analytics)
- Backend: scraper.py (Indeed scraping, orchestration, fallback)
- Frontend: app.js (all JavaScript logic, particle system, filtering)

---

## 🐛 Troubleshooting

### "Connection refused" error
```
Solution:
1. Ensure backend is running: python app.py
2. Check port 5000 is available
3. Try http://127.0.0.1:5000
```

### Salary/Experience filter showing 0 jobs
```
Solution:
1. Delete old data: del data\jobs.json
2. Restart server
3. Wait for initial scraping
4. Try filter again
```

### Can't upload resume
```
Solution:
1. Use PDF, DOC, or DOCX format only
2. File size must be < 16MB
3. Check uploads folder permissions
```

### Port 5000 already in use
```
Solution:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## ✨ Key Features Implemented

✅ Full-stack web development  
✅ Real web scraping  
✅ RESTful API design  
✅ Advanced filtering system  
✅ User authentication  
✅ File upload handling  
✅ Background job scheduling  
✅ Modern UI with animations  
✅ Responsive design  
✅ Error handling  

---

## 📈 Performance

- Initial load: ~5-10 seconds
- Filter application: Instant
- Auto-scraping: Every 6 hours (background)
- Total jobs loaded: 1500+

---

## 📞 Support

### Check These Files:
- `QUICK_START.md` - Fast setup guide
- `FILTER_FIX_SUMMARY.md` - Filter details
- `FILTER_VALUES_REFERENCE.md` - Value matching

### Debug:
1. Open browser DevTools (F12)
2. Check Console tab for error messages
3. Check terminal for server logs

---

## 🚀 Quick Start

```powershell
# 1. Delete old data
del data\jobs.json

# 2. Start server
cd backend
python app.py

# 3. Open browser
http://localhost:5000

# 4. Test filters
- Select "5-10 LPA" salary
- Click Apply
- Should show ~40 jobs
```

---

## 📝 Notes

- First run will take 5-10 seconds for initial scraping
- Jobs auto-update every 6 hours
- All user data stored locally in JSON files
- No database server required
- Passwords securely hashed

---

## ✨ Credits

**Team Kishori**
- Urvashi Kashyap (Team Lead)
- Supriya Rawat
- Ridham Singh

**Version:** 1.0.0  
**Status:** ✅ Fully Functional  
**Last Updated:** May 2026

---

**Happy Job Hunting! 🎯**
