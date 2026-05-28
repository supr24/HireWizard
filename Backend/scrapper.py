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
