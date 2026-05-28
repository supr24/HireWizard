# =====================================================
# HireWizard - Job Aggregator Platform - Urvashi Kashyap
# =====================================================
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import json, os, uuid
from datetime import datetime
from scraper import JobScraper
from apscheduler.schedulers.background import BackgroundScheduler
import atexit

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

UPLOAD_FOLDER = '../uploads'
DATA_FOLDER = '../data'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

USERS_FILE = os.path.join(DATA_FOLDER, 'users.json')
JOBS_FILE = os.path.join(DATA_FOLDER, 'jobs.json')
APPLICATIONS_FILE = os.path.join(DATA_FOLDER, 'applications.json')
SAVED_JOBS_FILE = os.path.join(DATA_FOLDER, 'saved_jobs.json')

scraper = JobScraper()

def init_data_files():
    for f in [USERS_FILE, JOBS_FILE, APPLICATIONS_FILE, SAVED_JOBS_FILE]:
        if not os.path.exists(f):
            with open(f, 'w') as file:
                json.dump([], file)

init_data_files()

def load_data(filename):
    try:
        with open(os.path.join(DATA_FOLDER, filename), 'r') as f:
            return json.load(f)
    except:
        return []

def save_data(filename, data):
    with open(os.path.join(DATA_FOLDER, filename), 'w') as f:
        json.dump(data, f, indent=2)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# =====================================================
# SECTION 1: AUTO SCRAPING SCHEDULER - Urvashi Kashyap
# =====================================================
def auto_scrape_jobs():
    """Load job data from all 5 cities"""
    print("\n" + "="*50)
    print("Loading job data from 5 cities...")
    print("="*50)
    
    cities = ['bangalore', 'dehradun', 'gurgaon', 'noida', 'delhi']
    keywords = ['software engineer', 'developer', 'data analyst']
    
    all_jobs = []
    seen_jobs = set()
    
    for city in cities:
        for keyword in keywords:
            try:
                jobs = scraper.scrape_all(keyword=keyword, location=city)
                
                for job in jobs:
                    job_key = (job['title'].lower(), job['company'].lower(), job['salary'], job['experience'], job['source'])
                    if job_key not in seen_jobs:
                        seen_jobs.add(job_key)
                        all_jobs.append(job)
                
            except Exception as e:
                print(f"Error: {e}")
                continue
    
    for idx, job in enumerate(all_jobs, 1):
        job['id'] = idx
    
    save_data('jobs.json', all_jobs)
    print("="*50)
    print(f"✅ Total jobs loaded: {len(all_jobs)}")
    print("="*50 + "\n")
    return all_jobs

scheduler = BackgroundScheduler()
scheduler.add_job(func=auto_scrape_jobs, trigger="interval", hours=6)
scheduler.start()

print("Initial loading...")
auto_scrape_jobs()
