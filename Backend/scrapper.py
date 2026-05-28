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

    # =========================================
    # SECTION 5: INDEED SCRAPING - Supriya Rawat
    # =========================================
    def scrape_indeed(self, keyword="software engineer", location="bangalore", max_jobs=20):
        """Scrape Indeed (seed data)"""
        try:
            all_seed = self.generate_seed_jobs(keyword, location)
            indeed_jobs = [j for j in all_seed if j['source'] == 'indeed'][:max_jobs]
            self.jobs.extend(indeed_jobs)
        except Exception as e:
            print(f"Indeed error: {e}")
        return self.jobs
    

# =========================================
    # SECTION 6: LINKEDIN SCRAPING - Urvashi Kashyap
    # =========================================
    def scrape_linkedin(self, keyword="software engineer", location="bangalore", max_jobs=10):
        """Real LinkedIn scraping"""
        try:
            url = f"https://www.linkedin.com/jobs/search?keywords={keyword.replace(' ', '%20')}&location={location}"
            response = requests.get(url, headers=self.headers, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            job_cards = soup.find_all('div', class_='base-card', limit=max_jobs)
            
            for card in job_cards:
                try:
                    title_elem = card.find('h3', class_='base-search-card__title')
                    company_elem = card.find('h4', class_='base-search-card__subtitle')
                    link_elem = card.find('a', class_='base-card__full-link')
                    
                    if title_elem and link_elem:
                        job_url = link_elem.get('href', '')
                        
                        job = {
                            'title': title_elem.text.strip(),
                            'company': company_elem.text.strip() if company_elem else 'Not specified',
                            'location': location.capitalize(),
                            'experience': '0-2 years',
                            'salary': '5-15 LPA',
                            'source': 'linkedin',
                            'url': job_url,
                            'posted': '1-3 days ago',
                            'description': 'Click to view on LinkedIn',
                            'skills': ['Python', 'JavaScript', 'React']
                        }
                        self.jobs.append(job)
                except:
                    continue
                    
        except Exception as e:
            print(f"LinkedIn error: {e}")
        
        return self.jobs
    
    
    # =========================================
    # SECTION 7: ORCHESTRATE ALL SCRAPERS - Supriya Rawat
    # =========================================
    def scrape_all(self, keyword="software engineer", location="bangalore"):
        """Combine all sources"""
        self.jobs = []
        
        print(f"  Scraping {keyword} in {location}...")
        
        self.scrape_naukri(keyword, location, max_jobs=20)
        time.sleep(0.3)
        
        self.scrape_indeed(keyword, location, max_jobs=20)
        time.sleep(0.3)
        
        self.scrape_linkedin(keyword, location, max_jobs=10)
        
        print(f"    ✓ {len(self.jobs)} jobs loaded")
        
        return self.jobs
    
    # =========================================
    # SECTION 8: GET JOB DETAILS - Supriya Rawat
    # =========================================
    def get_job_details(self, job_url, source):
        """Get job details"""
        return {
            'description': 'Click URL to view full details',
            'requirements': [],
            'responsibilities': []
        }
