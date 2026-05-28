# =========================================
# SECTION 1: IMPORTS AND SETUP - Urvashi Kashyap
# =========================================
import requests
from bs4 import BeautifulSoup
import time
import random

# =========================================
# SECTION 2: JOBSCRAPER CLASS INITIALIZATION - Urvashi Kashyap
# =========================================
class JobScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.jobs = []
 # =========================================
    # SECTION 3: GENERATE COMPLETE SEED DATA - Ridham Singh
    # =========================================
    def generate_seed_jobs(self, keyword, location):
        """Generate seed data with ALL salary/experience combinations"""
        companies = ['Google', 'Microsoft', 'Amazon', 'TCS', 'Infosys', 'Wipro', 'HCL', 'Tech Mahindra', 'Accenture', 'Cognizant', 'Deloitte', 'Capgemini', 'Oracle', 'Salesforce']
        
        salaries = ['3-5 LPA', '5-10 LPA', '10-15 LPA', '15-20 LPA', '20+ LPA']
        experiences = ['0-2 years', '2-4 years', '4-6 years', '6+ years']
        
        all_jobs = []
        job_id = 0
        
        # Create jobs for EVERY combination of salary + experience
        for salary in salaries:
            for experience in experiences:
                company = companies[job_id % len(companies)]
                
                all_jobs.append({
                    'title': f"{keyword.title()}",
                    'company': company,
                    'location': location.capitalize(),
                    'experience': experience,
                    'salary': salary,
                    'source': 'naukri',
                    'url': f"https://www.naukri.com/jobs/{keyword.replace(' ', '-')}-jobs-{location}",
                    'posted': f'{random.randint(1, 7)} days ago',
                    'description': f'{keyword.title()} at {company}',
                    'skills': ['Python', 'JavaScript', 'React']
                })
                
                all_jobs.append({
                    'title': f"{keyword.title()}",
                    'company': company,
                    'location': location.capitalize(),
                    'experience': experience,
                    'salary': salary,
                    'source': 'indeed',
                    'url': f"https://in.indeed.com/jobs?q={keyword.replace(' ', '+')}&l={location}",
                    'posted': f'{random.randint(1, 7)} days ago',
                    'description': f'{keyword.title()} at {company}',
                    'skills': ['Java', 'Spring', 'Docker']
                })
                
                job_id += 1
        
        return all_jobs
    
    # =========================================
    # SECTION 4: NAUKRI SCRAPING - Ridham Singh
    # =========================================
    def scrape_naukri(self, keyword="software engineer", location="bangalore", max_jobs=20):
        """Scrape Naukri (seed data)"""
        try:
            all_seed = self.generate_seed_jobs(keyword, location)
            naukri_jobs = [j for j in all_seed if j['source'] == 'naukri'][:max_jobs]
            self.jobs.extend(naukri_jobs)
        except Exception as e:
            print(f"Naukri error: {e}")
        return self.jobs
