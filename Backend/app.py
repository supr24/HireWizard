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

# =====================================================
# SECTION 2: FRONTEND SERVING - Ridham Singh
# =====================================================
@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# =====================================================
# SECTION 3: AUTHENTICATION ENDPOINTS - Ridham Singh
# =====================================================
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """User registration"""
    data = request.json
    if not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Missing fields'}), 400
    users = load_data('users.json')
    if any(u['email'] == data['email'] for u in users):
        return jsonify({'success': False, 'message': 'Email exists'}), 400
    new_user = {
        'id': str(uuid.uuid4()),
        'name': data['name'],
        'email': data['email'],
        'password': generate_password_hash(data['password']),
        'profileComplete': False,
        'createdAt': datetime.now().isoformat()
    }
    users.append(new_user)
    save_data('users.json', users)
    user_data = {k: v for k, v in new_user.items() if k != 'password'}
    return jsonify({'success': True, 'user': user_data}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login"""
    data = request.json
    if not data.get('email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Missing email or password'}), 400
    users = load_data('users.json')
    user = next((u for u in users if u['email'] == data['email']), None)
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    user_data = {k: v for k, v in user.items() if k != 'password'}
    return jsonify({'success': True, 'user': user_data}), 200

# =====================================================
# SECTION 4: PROFILE MANAGEMENT - Supriya Rawat
# =====================================================
@app.route('/api/profile/update', methods=['POST'])
def update_profile():
    """Update user profile"""
    data = request.json
    user_id = data.get('userId')
    if not user_id:
        return jsonify({'success': False, 'message': 'User ID required'}), 400
    users = load_data('users.json')
    user_index = next((i for i, u in enumerate(users) if u['id'] == user_id), None)
    if user_index is None:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    for field in ['phone', 'location', 'experience', 'salary', 'skills', 'education', 'linkedin']:
        if field in data:
            users[user_index][field] = data[field]
    users[user_index]['profileComplete'] = True
    users[user_index]['updatedAt'] = datetime.now().isoformat()
    save_data('users.json', users)
    user_data = {k: v for k, v in users[user_index].items() if k != 'password'}
    return jsonify({'success': True, 'user': user_data}), 200

# =====================================================
# SECTION 5: RESUME UPLOAD - Urvashi Kashyap
# =====================================================
@app.route('/api/profile/upload-resume', methods=['POST'])
def upload_resume():
    """Upload resume"""
    if 'resume' not in request.files:
        return jsonify({'success': False, 'message': 'No file'}), 400
    file = request.files['resume']
    user_id = request.form.get('userId')
    if not user_id or file.filename == '':
        return jsonify({'success': False, 'message': 'Missing data'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(f"{user_id}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        users = load_data('users.json')
        user_index = next((i for i, u in enumerate(users) if u['id'] == user_id), None)
        if user_index is not None:
            users[user_index]['resumeFile'] = filename
            users[user_index]['resumeUploaded'] = True
            users[user_index]['profileComplete'] = True
            users[user_index]['updatedAt'] = datetime.now().isoformat()
            save_data('users.json', users)
        return jsonify({'success': True, 'filename': filename}), 200
    return jsonify({'success': False, 'message': 'Invalid file'}), 400

# =====================================================
# SECTION 6: JOBS ENDPOINTS - Ridham Singh
# =====================================================
@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    """Get all jobs"""
    jobs = load_data('jobs.json')
    return jsonify({'success': True, 'jobs': jobs, 'count': len(jobs)}), 200

@app.route('/api/jobs/scrape', methods=['POST'])
def scrape_jobs():
    """Manual scrape trigger"""
    data = request.json or {}
    keyword = data.get('keyword', 'software engineer')
    location = data.get('location', 'bangalore')
    try:
        jobs = scraper.scrape_all(keyword=keyword, location=location)
        for idx, job in enumerate(jobs, 1):
            job['id'] = idx
        save_data('jobs.json', jobs)
        return jsonify({'success': True, 'jobs': jobs, 'count': len(jobs)}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/jobs/filter', methods=['POST'])
def filter_jobs():
    """Filter jobs by multiple criteria"""
    filters = request.json
    jobs = load_data('jobs.json')
    filtered = jobs
    
    print(f"DEBUG: Filters received = {filters}")
    
    # Search filter
    if filters.get('search') and filters['search'].strip():
        s = filters['search'].lower()
        filtered = [j for j in filtered if s in j.get('title', '').lower() or s in j.get('company', '').lower()]
        print(f"  After search: {len(filtered)} jobs")
    
    # Location filter
    if filters.get('location') and filters['location'].strip():
        loc = filters['location'].lower()
        filtered = [j for j in filtered if j.get('location', '').lower() == loc]
        print(f"  After location: {len(filtered)} jobs")
    
    # Experience filter - STRICT EXACT MATCH
    if filters.get('experience') and filters['experience'].strip():
        exp_filter = filters['experience'].strip()
        filtered = [j for j in filtered if j.get('experience', '').strip() == exp_filter]
        print(f"  After experience ({exp_filter}): {len(filtered)} jobs")
    
    # Salary filter - STRICT EXACT MATCH
    if filters.get('salary') and filters['salary'].strip():
        sal_filter = filters['salary'].strip()
        filtered = [j for j in filtered if j.get('salary', '').strip() == sal_filter]
        print(f"  After salary ({sal_filter}): {len(filtered)} jobs")
    
    # Source filter
    if filters.get('source') and filters['source'].strip():
        src = filters['source'].lower()
        filtered = [j for j in filtered if j.get('source', '').lower() == src]
        print(f"  After source: {len(filtered)} jobs")
    
    print(f"FINAL: {len(filtered)} jobs")
    return jsonify({'success': True, 'jobs': filtered, 'count': len(filtered)}), 200

@app.route('/api/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Get job details"""
    jobs = load_data('jobs.json')
    job = next((j for j in jobs if j.get('id') == job_id), None)
    if not job:
        return jsonify({'success': False, 'message': 'Job not found'}), 404
    return jsonify({'success': True, 'job': job}), 200

# =====================================================
# SECTION 7: APPLICATIONS ENDPOINTS - Urvashi Kashyap
# =====================================================
@app.route('/api/applications/apply', methods=['POST'])
def apply_job():
    """Apply to job"""
    data = request.json
    if not data.get('userId') or not data.get('jobId'):
        return jsonify({'success': False, 'message': 'Missing fields'}), 400
    apps = load_data('applications.json')
    if any(a['userId'] == data['userId'] and a['jobId'] == data['jobId'] for a in apps):
        return jsonify({'success': False, 'message': 'Already applied'}), 400
    new_app = {
        'id': str(uuid.uuid4()),
        'userId': data['userId'],
        'jobId': data['jobId'],
        'status': 'applied',
        'appliedAt': datetime.now().isoformat()
    }
    apps.append(new_app)
    save_data('applications.json', apps)
    return jsonify({'success': True, 'application': new_app}), 201

@app.route('/api/applications/user/<user_id>', methods=['GET'])
def get_user_applications(user_id):
    """Get user applications"""
    apps = load_data('applications.json')
    jobs = load_data('jobs.json')
    user_apps = [a for a in apps if a['userId'] == user_id]
    job_ids = [a['jobId'] for a in user_apps]
    applied_jobs = [j for j in jobs if j.get('id') in job_ids]
    return jsonify({'success': True, 'applications': user_apps, 'jobs': applied_jobs, 'count': len(user_apps)}), 200

# =====================================================
# SECTION 8: SAVED JOBS ENDPOINTS - Supriya Rawat
# =====================================================
@app.route('/api/saved/add', methods=['POST'])
def save_job():
    """Save job"""
    data = request.json
    if not data.get('userId') or not data.get('jobId'):
        return jsonify({'success': False, 'message': 'Missing fields'}), 400
    saved = load_data('saved_jobs.json')
    if any(s['userId'] == data['userId'] and s['jobId'] == data['jobId'] for s in saved):
        return jsonify({'success': False, 'message': 'Already saved'}), 400
    saved_entry = {
        'id': str(uuid.uuid4()),
        'userId': data['userId'],
        'jobId': data['jobId'],
        'savedAt': datetime.now().isoformat()
    }
    saved.append(saved_entry)
    save_data('saved_jobs.json', saved)
    return jsonify({'success': True, 'saved': saved_entry}), 201

@app.route('/api/saved/user/<user_id>', methods=['GET'])
def get_saved_jobs(user_id):
    """Get saved jobs"""
    saved = load_data('saved_jobs.json')
    jobs = load_data('jobs.json')
    user_saved = [s for s in saved if s['userId'] == user_id]
    job_ids = [s['jobId'] for s in user_saved]
    saved_jobs_full = [j for j in jobs if j.get('id') in job_ids]
    return jsonify({'success': True, 'jobs': saved_jobs_full, 'count': len(saved_jobs_full)}), 200

@app.route('/api/saved/remove', methods=['POST'])
def unsave_job():
    """Unsave job"""
    data = request.json
    saved = load_data('saved_jobs.json')
    saved = [s for s in saved if not (s['userId'] == data['userId'] and s['jobId'] == data['jobId'])]
    save_data('saved_jobs.json', saved)
    return jsonify({'success': True}), 200

# =====================================================
# SECTION 9: ANALYTICS ENDPOINT - Ridham Singh
# =====================================================
@app.route('/api/analytics/stats', methods=['GET'])
def get_stats():
    """Get analytics"""
    jobs = load_data('jobs.json')
    users = load_data('users.json')
    apps = load_data('applications.json')
    saved = load_data('saved_jobs.json')
    stats = {
        'totalJobs': len(jobs),
        'totalUsers': len(users),
        'totalApplications': len(apps),
        'totalSaved': len(saved),
        'jobsBySource': {},
        'jobsByLocation': {}
    }
    for job in jobs:
        source = job.get('source', 'unknown')
        stats['jobsBySource'][source] = stats['jobsBySource'].get(source, 0) + 1
        location = job.get('location', 'unknown')
        stats['jobsByLocation'][location] = stats['jobsByLocation'].get(location, 0) + 1
    return jsonify({'success': True, 'stats': stats}), 200

