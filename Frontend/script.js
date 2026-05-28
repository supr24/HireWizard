// Particle System
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particles-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 50;
        this.resize();
        this.init();
        this.animate();
        window.addEventListener('resize', () => this.resize());
    }
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    init() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1
            });
        }
    }
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(124, 58, 237, 0.5)';
            this.ctx.fill();
            this.particles.forEach((op, j) => {
                if (i !== j) {
                    const dx = p.x - op.x, dy = p.y - op.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(p.x, p.y);
                        this.ctx.lineTo(op.x, op.y);
                        this.ctx.strokeStyle = `rgba(124, 58, 237, ${0.2 * (1 - dist / 150)})`;
                        this.ctx.lineWidth = 1;
                        this.ctx.stroke();
                    }
                }
            });
        });
        requestAnimationFrame(() => this.animate());
    }
}

const API_BASE = 'http://localhost:5000/api';

const AppState = {
    currentUser: null,
    jobs: [],
    filteredJobs: [],
    savedJobs: [],
    applications: [],
    currentView: 'jobs',
    displayedJobsCount: 6,
    
    async init() {
        this.checkAuth();
        await this.loadJobs();
    },
    
    checkAuth() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.showDashboard();
        } else {
            this.showLanding();
        }
    },
    
    async login(email, password) {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email, password})
            });
            const data = await res.json();
            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                return {success: true};
            }
            return data;
        } catch (e) {
            return {success: false, message: 'Connection error'};
        }
    },
    
    async signup(userData) {
        try {
            const res = await fetch(`${API_BASE}/auth/signup`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            }
            return data;
        } catch (e) {
            return {success: false, message: 'Connection error'};
        }
    },
    
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showLanding();
        showToast('Logged out successfully');
    },
    
    async updateProfile(profileData) {
        if (!this.currentUser) return;
        try {
            const res = await fetch(`${API_BASE}/profile/update`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({...profileData, userId: this.currentUser.id})
            });
            const data = await res.json();
            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            }
        } catch (e) {
            console.error(e);
        }
    },
    
    showLanding() {
        document.getElementById('landing-page').style.display = 'block';
        document.getElementById('dashboard-page').style.display = 'none';
    },
    
    showDashboard() {
        document.getElementById('landing-page').style.display = 'none';
        document.getElementById('dashboard-page').style.display = 'block';
        this.renderDashboard();
        this.loadSavedJobs();
        this.loadApplications();
    },
    
    async loadJobs() {
        try {
            const res = await fetch(`${API_BASE}/jobs`);
            const data = await res.json();
            if (data.success) {
                this.jobs = data.jobs;
                this.filteredJobs = data.jobs;
                console.log(`Loaded ${data.jobs.length} jobs`);
                if (this.currentUser) this.updateJobCount();
            }
        } catch (e) {
            console.error('Load jobs error:', e);
        }
    },
    
    async refreshJobs() {
        showLoading();
        try {
            const res = await fetch(`${API_BASE}/jobs/scrape`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({keyword: 'software engineer', location: 'bangalore'})
            });
            const data = await res.json();
            if (data.success) {
                this.jobs = data.jobs;
                this.filteredJobs = data.jobs;
                this.renderJobs();
                this.updateJobCount();
                showToast(`Scraped ${data.count} fresh jobs!`);
            }
        } catch (e) {
            showToast('Scraping failed');
        }
        hideLoading();
    },
    
    async loadSavedJobs() {
        if (!this.currentUser) return;
        try {
            const res = await fetch(`${API_BASE}/saved/user/${this.currentUser.id}`);
            const data = await res.json();
            if (data.success) {
                this.savedJobs = data.jobs.map(j => j.id);
            }
        } catch (e) {
            console.error(e);
        }
    },
    
    async loadApplications() {
        if (!this.currentUser) return;
        try {
            const res = await fetch(`${API_BASE}/applications/user/${this.currentUser.id}`);
            const data = await res.json();
            if (data.success) {
                this.applications = data.jobs;
            }
        } catch (e) {
            console.error(e);
        }
    },
    
    async saveJob(jobId) {
        if (!this.currentUser) return;
        try {
            const res = await fetch(`${API_BASE}/saved/add`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({userId: this.currentUser.id, jobId})
            });
            const data = await res.json();
            if (data.success) {
                this.savedJobs.push(jobId);
                showToast('Job saved!');
                this.renderCurrentView();
            }
        } catch (e) {
            showToast('Failed to save');
        }
    },
    
    async unsaveJob(jobId) {
        if (!this.currentUser) return;
        try {
            await fetch(`${API_BASE}/saved/remove`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({userId: this.currentUser.id, jobId})
            });
            this.savedJobs = this.savedJobs.filter(id => id !== jobId);
            showToast('Job removed from saved');
            this.renderCurrentView();
        } catch (e) {}
    },
    
    async applyJob(jobId) {
        if (!this.currentUser) return;
        try {
            const res = await fetch(`${API_BASE}/applications/apply`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({userId: this.currentUser.id, jobId})
            });
            const data = await res.json();
            showToast(data.success ? 'Application submitted successfully!' : data.message);
            if (data.success) {
                await this.loadApplications();
            }
        } catch (e) {
            showToast('Failed to apply');
        }
    },
    
    filterJobs(filters) {
        console.log('=== FILTER DEBUG ===');
        console.log('Filters:', filters);
        console.log('Total jobs:', this.jobs.length);
        
        // If all filters are empty, show all jobs
        const hasFilters = filters.search || filters.location || filters.experience || filters.salary || filters.source;
        
        if (!hasFilters) {
            this.filteredJobs = [...this.jobs];
            console.log('No filters - showing all jobs');
        } else {
            this.filteredJobs = this.jobs.filter(job => {
                // Search filter
                if (filters.search && filters.search.trim() !== '') {
                    if (!this.matchesSearch(job, filters.search)) {
                        return false;
                    }
                }
                
                // Location filter
                if (filters.location && filters.location.trim() !== '') {
                    const jobLoc = (job.location || '').toLowerCase().trim();
                    const filterLoc = filters.location.toLowerCase().trim();
                    if (jobLoc !== filterLoc) {
                        return false;
                    }
                }
                
                // Experience filter - EXACT MATCH
                if (filters.experience && filters.experience.trim() !== '') {
                    const jobExp = (job.experience || '').trim();
                    const filterExp = filters.experience.trim();
                    console.log(`Experience - Job: "${jobExp}" vs Filter: "${filterExp}"`);
                    if (jobExp !== filterExp) {
                        return false;
                    }
                }
                
                // Salary filter - EXACT MATCH
                if (filters.salary && filters.salary.trim() !== '') {
                    const jobSal = (job.salary || '').trim();
                    const filterSal = filters.salary.trim();
                    console.log(`Salary - Job: "${jobSal}" vs Filter: "${filterSal}"`);
                    if (jobSal !== filterSal) {
                        return false;
                    }
                }
                
                // Source filter
                if (filters.source && filters.source.trim() !== '') {
                    const jobSrc = (job.source || '').toLowerCase().trim();
                    const filterSrc = filters.source.toLowerCase().trim();
                    if (jobSrc !== filterSrc) {
                        return false;
                    }
                }
                
                return true;
            });
        }
        
        console.log('Filtered jobs count:', this.filteredJobs.length);
        console.log('Sample filtered job:', this.filteredJobs[0]);
        
        this.displayedJobsCount = 6;
        this.updateJobCount();
        this.renderJobs();
        console.log('=== FILTER COMPLETE ===');
    },
    
    matchesSearch(job, search) {
        const s = search.toLowerCase();
        return job.title.toLowerCase().includes(s) ||
               job.company.toLowerCase().includes(s) ||
               (job.skills && job.skills.some(sk => sk.toLowerCase().includes(s)));
    },
    
    updateJobCount() {
        const el = document.getElementById('new-jobs-count');
        if (el) el.textContent = `${this.filteredJobs.length} jobs`;
    },
    
    renderDashboard() {
        if (!this.currentUser) return;
        const init = this.currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('user-initials').textContent = init;
        document.getElementById('user-initials-dropdown').textContent = init;
        document.getElementById('user-name-nav').textContent = this.currentUser.name.split(' ')[0];
        document.getElementById('user-name-dropdown').textContent = this.currentUser.name;
        document.getElementById('user-email-dropdown').textContent = this.currentUser.email;
        document.getElementById('user-name-welcome').textContent = this.currentUser.name.split(' ')[0];
        this.updateJobCount();
        this.showView('jobs');
    },
    
    showView(view) {
        this.currentView = view;
        ['jobs-container', 'applications-container', 'saved-container', 'analytics-container'].forEach(id => {
            document.getElementById(id).style.display = 'none';
        });
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        
        if (view === 'jobs') {
            document.getElementById('jobs-container').style.display = 'grid';
            document.getElementById('nav-jobs').classList.add('active');
            document.querySelector('.welcome-banner').style.display = 'flex';
            document.querySelector('.search-section').style.display = 'block';
            this.renderJobs();
        } else if (view === 'applications') {
            document.getElementById('applications-container').style.display = 'block';
            document.getElementById('nav-applications').classList.add('active');
            document.querySelector('.welcome-banner').style.display = 'none';
            document.querySelector('.search-section').style.display = 'none';
            this.renderApplications();
        } else if (view === 'saved') {
            document.getElementById('saved-container').style.display = 'block';
            document.getElementById('nav-saved').classList.add('active');
            document.querySelector('.welcome-banner').style.display = 'none';
            document.querySelector('.search-section').style.display = 'none';
            this.renderSaved();
        } else if (view === 'analytics') {
            document.getElementById('analytics-container').style.display = 'block';
            document.getElementById('nav-analytics').classList.add('active');
            document.querySelector('.welcome-banner').style.display = 'none';
            document.querySelector('.search-section').style.display = 'none';
            this.renderAnalytics();
        }
    },
    
    renderCurrentView() {
        this.showView(this.currentView);
    },
    
    renderJobs() {
        const container = document.getElementById('jobs-container');
        const jobsToShow = this.filteredJobs.slice(0, this.displayedJobsCount);
        
        if (jobsToShow.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:4rem;color:var(--color-text-muted);"><i class="fas fa-briefcase" style="font-size:4rem;margin-bottom:1rem;"></i><h3>No jobs found</h3><p>Try adjusting your filters or refresh jobs</p></div>';
            return;
        }
        
        container.innerHTML = jobsToShow.map(job => `
            <div class="job-card" onclick="AppState.viewJobDetails(${job.id})">
                <div class="job-header">
                    <div class="job-logo"><i class="fas fa-building"></i></div>
                    <div class="job-info">
                        <h3 class="job-title">${job.title}</h3>
                        <p class="job-company">${job.company}</p>
                        <div class="job-tags">
                            <span class="job-tag" style="background:${this.getSourceColor(job.source)};">${job.source.toUpperCase()}</span>
                            <span class="job-tag">${job.posted || '1 day ago'}</span>
                        </div>
                    </div>
                </div>
                <div class="job-details">
                    <div class="job-detail"><i class="fas fa-map-marker-alt"></i><span>${job.location}</span></div>
                    <div class="job-detail"><i class="fas fa-rupee-sign"></i><span>${job.salary || 'Not disclosed'}</span></div>
                    <div class="job-detail"><i class="fas fa-briefcase"></i><span>${job.experience || '0-2 years'}</span></div>
                    <div class="job-detail"><i class="fas fa-clock"></i><span>${job.posted || '1 day ago'}</span></div>
                </div>
                ${job.skills && job.skills.length ? `<div class="job-skills">${job.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>` : ''}
                <p style="color:var(--color-text-muted);margin:1rem 0;">${job.description || 'Click to view details'}</p>
                <div class="job-actions" onclick="event.stopPropagation()">
                    <button class="btn-apply" onclick="AppState.applyJob(${job.id})"><i class="fas fa-paper-plane"></i> Apply Now</button>
                    <button class="btn-save" onclick="${this.savedJobs.includes(job.id) ? 'AppState.unsaveJob' : 'AppState.saveJob'}(${job.id})">
                        <i class="fas fa-bookmark"></i> ${this.savedJobs.includes(job.id) ? 'Saved' : 'Save'}
                    </button>
                </div>
            </div>
        `).join('');
        
        document.getElementById('load-more').style.display = this.displayedJobsCount >= this.filteredJobs.length ? 'none' : 'inline-flex';
    },
    
    renderApplications() {
        const container = document.getElementById('applications-list');
        if (this.applications.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:4rem;color:var(--color-text-muted);"><i class="fas fa-file-alt" style="font-size:4rem;margin-bottom:1rem;"></i><h3>No applications yet</h3><p>Apply to jobs to see them here</p></div>';
            return;
        }
        
        container.innerHTML = '<div class="jobs-container">' + this.applications.map(job => `
            <div class="job-card">
                <div class="job-header">
                    <div class="job-logo"><i class="fas fa-building"></i></div>
                    <div class="job-info">
                        <h3 class="job-title">${job.title}</h3>
                        <p class="job-company">${job.company}</p>
                        <span class="job-tag" style="background:rgba(76,175,80,0.3);">APPLIED</span>
                    </div>
                </div>
                <div class="job-details">
                    <div class="job-detail"><i class="fas fa-map-marker-alt"></i><span>${job.location}</span></div>
                    <div class="job-detail"><i class="fas fa-rupee-sign"></i><span>${job.salary || 'Not disclosed'}</span></div>
                </div>
            </div>
        `).join('') + '</div>';
    },
    
    renderSaved() {
        const container = document.getElementById('saved-list');
        const savedJobsData = this.jobs.filter(j => this.savedJobs.includes(j.id));
        
        if (savedJobsData.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:4rem;color:var(--color-text-muted);"><i class="fas fa-bookmark" style="font-size:4rem;margin-bottom:1rem;"></i><h3>No saved jobs</h3><p>Save jobs to view them later</p></div>';
            return;
        }
        
        container.innerHTML = '<div class="jobs-container">' + savedJobsData.map(job => `
            <div class="job-card" onclick="AppState.viewJobDetails(${job.id})">
                <div class="job-header">
                    <div class="job-logo"><i class="fas fa-building"></i></div>
                    <div class="job-info">
                        <h3 class="job-title">${job.title}</h3>
                        <p class="job-company">${job.company}</p>
                    </div>
                </div>
                <div class="job-details">
                    <div class="job-detail"><i class="fas fa-map-marker-alt"></i><span>${job.location}</span></div>
                    <div class="job-detail"><i class="fas fa-rupee-sign"></i><span>${job.salary || 'Not disclosed'}</span></div>
                </div>
                <div class="job-actions" onclick="event.stopPropagation()">
                    <button class="btn-apply" onclick="AppState.applyJob(${job.id})">Apply</button>
                    <button class="btn-save" onclick="AppState.unsaveJob(${job.id})"><i class="fas fa-trash"></i> Remove</button>
                </div>
            </div>
        `).join('') + '</div>';
    },
    
    async renderAnalytics() {
        try {
            const res = await fetch(`${API_BASE}/analytics/stats`);
            const data = await res.json();
            if (data.success) {
                const stats = data.stats;
                document.getElementById('analytics-content').innerHTML = `
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:2rem;margin-bottom:3rem;">
                        <div class="glass-card" style="padding:2rem;text-align:center;">
                            <div style="font-size:3rem;font-weight:700;color:var(--color-primary);">${stats.totalJobs}</div>
                            <div style="color:var(--color-text-muted);margin-top:0.5rem;">Total Jobs</div>
                        </div>
                        <div class="glass-card" style="padding:2rem;text-align:center;">
                            <div style="font-size:3rem;font-weight:700;color:var(--color-secondary);">${stats.totalApplications}</div>
                            <div style="color:var(--color-text-muted);margin-top:0.5rem;">Applications</div>
                        </div>
                        <div class="glass-card" style="padding:2rem;text-align:center;">
                            <div style="font-size:3rem;font-weight:700;color:var(--color-accent);">${stats.totalSaved}</div>
                            <div style="color:var(--color-text-muted);margin-top:0.5rem;">Saved Jobs</div>
                        </div>
                        <div class="glass-card" style="padding:2rem;text-align:center;">
                            <div style="font-size:3rem;font-weight:700;color:var(--color-success);">${stats.totalUsers}</div>
                            <div style="color:var(--color-text-muted);margin-top:0.5rem;">Total Users</div>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;">
                        <div class="glass-card" style="padding:2rem;">
                            <h3 style="margin-bottom:1.5rem;">Jobs by Source</h3>
                            ${Object.entries(stats.jobsBySource).map(([source, count]) => `
                                <div style="display:flex;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid var(--glass-border);">
                                    <span style="text-transform:uppercase;">${source}</span>
                                    <strong>${count}</strong>
                                </div>
                            `).join('')}
                        </div>
                        <div class="glass-card" style="padding:2rem;">
                            <h3 style="margin-bottom:1.5rem;">Top Locations</h3>
                            ${Object.entries(stats.jobsByLocation).slice(0, 5).map(([location, count]) => `
                                <div style="display:flex;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid var(--glass-border);">
                                    <span>${location}</span>
                                    <strong>${count}</strong>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        } catch (e) {
            console.error(e);
        }
    },
    
    viewJobDetails(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-container glass-card" style="max-width:800px;">
                <button class="modal-close" onclick="this.parentElement.parentElement.remove()"><i class="fas fa-times"></i></button>
                <div class="modal-header">
                    <h2>${job.title}</h2>
                    <p>${job.company} • ${job.location}</p>
                </div>
                <div style="padding:2rem 0;">
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:2rem;">
                        <div><strong>Experience:</strong> ${job.experience || 'Not specified'}</div>
                        <div><strong>Salary:</strong> ${job.salary || 'Not disclosed'}</div>
                        <div><strong>Source:</strong> ${job.source}</div>
                    </div>
                    ${job.skills && job.skills.length ? `
                        <div style="margin-bottom:1.5rem;">
                            <strong>Skills:</strong><br>
                            <div class="job-skills" style="margin-top:0.5rem;">${job.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
                        </div>
                    ` : ''}
                    <div><strong>Description:</strong><br><p style="margin-top:0.5rem;line-height:1.7;">${job.description || 'No details available'}</p></div>
                    ${job.url ? `<div style="margin-top:1.5rem;"><a href="${job.url}" target="_blank" class="btn-primary" style="display:inline-block;padding:0.75rem 1.5rem;text-decoration:none;">View on ${job.source}</a></div>` : ''}
                </div>
            </div>
        `;
        modal.onclick = e => { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    },
    
    getSourceColor(source) {
        const colors = {naukri: 'rgba(76,175,80,0.3)', linkedin: 'rgba(0,119,181,0.3)', indeed: 'rgba(45,96,254,0.3)'};
        return colors[source] || 'rgba(255,255,255,0.1)';
    },
    
    loadMore() {
        this.displayedJobsCount += 6;
        this.renderJobs();
    }
};

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function showLoading() { document.getElementById('loading').classList.add('active'); }
function hideLoading() { document.getElementById('loading').classList.remove('active'); }
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

document.addEventListener('DOMContentLoaded', () => {
    new ParticleSystem();
    AppState.init();
    
    document.getElementById('btn-open-login')?.addEventListener('click', () => openModal('login-modal'));
    document.getElementById('btn-open-signup')?.addEventListener('click', () => openModal('signup-modal'));
    document.getElementById('btn-hero-signup')?.addEventListener('click', () => openModal('signup-modal'));
    document.getElementById('close-login')?.addEventListener('click', () => closeModal('login-modal'));
    document.getElementById('close-signup')?.addEventListener('click', () => closeModal('signup-modal'));
    document.getElementById('switch-to-signup')?.addEventListener('click', e => { e.preventDefault(); closeModal('login-modal'); openModal('signup-modal'); });
    document.getElementById('switch-to-login')?.addEventListener('click', e => { e.preventDefault(); closeModal('signup-modal'); openModal('login-modal'); });
    
    document.getElementById('login-form')?.addEventListener('submit', async e => {
        e.preventDefault();
        const result = await AppState.login(document.getElementById('login-email').value, document.getElementById('login-password').value);
        if (result.success) {
            closeModal('login-modal');
            if (!AppState.currentUser.profileComplete) openModal('profile-setup-modal');
            else AppState.showDashboard();
        } else showToast(result.message);
    });
    
    document.getElementById('signup-form')?.addEventListener('submit', async e => {
        e.preventDefault();
        const pwd = document.getElementById('signup-password').value;
        if (pwd !== document.getElementById('signup-confirm').value) { showToast('Passwords do not match'); return; }
        const result = await AppState.signup({
            name: document.getElementById('signup-name').value,
            email: document.getElementById('signup-email').value,
            password: pwd
        });
        if (result.success) { closeModal('signup-modal'); openModal('profile-setup-modal'); }
        else showToast(result.message);
    });
    
    document.getElementById('upload-resume-option')?.addEventListener('click', () => {
        document.querySelector('.profile-options').style.display = 'none';
        document.getElementById('resume-upload-section').style.display = 'block';
    });
    document.getElementById('manual-form-option')?.addEventListener('click', () => {
        document.querySelector('.profile-options').style.display = 'none';
        document.getElementById('manual-form-section').style.display = 'block';
    });
    document.getElementById('back-from-upload')?.addEventListener('click', () => {
        document.getElementById('resume-upload-section').style.display = 'none';
        document.querySelector('.profile-options').style.display = 'grid';
    });
    document.getElementById('back-from-manual')?.addEventListener('click', () => {
        document.getElementById('manual-form-section').style.display = 'none';
        document.querySelector('.profile-options').style.display = 'grid';
    });
    
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('resume-file');
    document.getElementById('btn-browse')?.addEventListener('click', () => fileInput.click());
    uploadArea?.addEventListener('click', () => fileInput.click());
    fileInput?.addEventListener('change', e => {
        if (e.target.files.length) {
            document.getElementById('upload-area').style.display = 'none';
            document.getElementById('file-preview').style.display = 'flex';
            document.getElementById('file-name').textContent = e.target.files[0].name;
            document.getElementById('submit-resume').style.display = 'flex';
        }
    });
    document.getElementById('remove-file')?.addEventListener('click', () => {
        document.getElementById('file-preview').style.display = 'none';
        document.getElementById('upload-area').style.display = 'block';
        document.getElementById('submit-resume').style.display = 'none';
        fileInput.value = '';
    });
    document.getElementById('submit-resume')?.addEventListener('click', async () => {
        showLoading();
        await AppState.updateProfile({resumeUploaded: true});
        hideLoading();
        closeModal('profile-setup-modal');
        AppState.showDashboard();
        showToast('Resume uploaded!');
    });
    
    document.getElementById('profile-form')?.addEventListener('submit', async e => {
        e.preventDefault();
        await AppState.updateProfile({
            phone: document.getElementById('profile-phone').value,
            location: document.getElementById('profile-location').value,
            experience: document.getElementById('profile-experience').value,
            salary: document.getElementById('profile-salary').value,
            skills: document.getElementById('profile-skills').value.split(',').map(s => s.trim()),
            education: document.getElementById('profile-education').value,
            linkedin: document.getElementById('profile-linkedin').value
        });
        closeModal('profile-setup-modal');
        AppState.showDashboard();
        showToast('Profile completed!');
    });
    
    // Navigation
    document.getElementById('nav-jobs')?.addEventListener('click', e => { e.preventDefault(); AppState.showView('jobs'); });
    document.getElementById('nav-applications')?.addEventListener('click', e => { e.preventDefault(); AppState.showView('applications'); });
    document.getElementById('nav-saved')?.addEventListener('click', e => { e.preventDefault(); AppState.showView('saved'); });
    document.getElementById('nav-analytics')?.addEventListener('click', e => { e.preventDefault(); AppState.showView('analytics'); });
    
    document.getElementById('btn-profile')?.addEventListener('click', () => 
        document.getElementById('profile-dropdown').classList.toggle('active'));
    document.getElementById('btn-logout')?.addEventListener('click', e => { e.preventDefault(); AppState.logout(); });
    document.getElementById('btn-refresh-jobs')?.addEventListener('click', () => AppState.refreshJobs());
    
    document.getElementById('apply-filters')?.addEventListener('click', () => {
        AppState.filterJobs({
            search: document.getElementById('job-search').value,
            location: document.getElementById('filter-location').value,
            salary: document.getElementById('filter-salary').value,
            experience: document.getElementById('filter-experience').value,
            source: document.getElementById('filter-source').value
        });
        showToast(`Found ${AppState.filteredJobs.length} jobs`);
    });
    
    document.getElementById('clear-filters')?.addEventListener('click', () => {
        ['job-search', 'filter-location', 'filter-salary', 'filter-experience', 'filter-source'].forEach(id => 
            document.getElementById(id).value = '');
        AppState.filterJobs({});
        showToast('Filters cleared');
    });
    
    document.getElementById('load-more')?.addEventListener('click', () => AppState.loadMore());
    
    document.querySelectorAll('.modal-overlay').forEach(m => 
        m.addEventListener('click', e => { if (e.target === m) m.classList.remove('active'); }));
    
    document.addEventListener('click', e => {
        const dd = document.getElementById('profile-dropdown');
        const bp = document.getElementById('btn-profile');
        if (dd && !dd.contains(e.target) && !bp?.contains(e.target)) dd.classList.remove('active');
    });
});
