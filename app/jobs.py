import time
import logging
import random
import aiohttp
import json
import asyncio
import pandas as pd
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium_stealth import stealth
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from urllib.request import Request, urlopen
import urllib.request
import numpy as np
import tempfile
from jobspy import scrape_jobs
from typing import List, Dict, Optional, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger('job_scraper')

class JobScraper:
    """A class for scraping job listings from various job boards."""
    def __init__(self, headless: bool = True):
        """
        Initialize the job scraper with browser settings.
        
        Args:
            headless: Whether to run the browser in headless mode
        """
        self.headers = {
            'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) '
                         'AppleWebKit/537.36 (KHTML, like Gecko) '
                         'Chrome/92.0.4515.107 Mobile Safari/537.36'
        }
        
        # Create a unique temporary directory for user data
        self.user_data_dir = tempfile.mkdtemp()
        
        
        self.chrome_options = webdriver.ChromeOptions()
        if headless:
            pass
            # self.chrome_options.add_argument("--headless")
            
        self.chrome_options.binary_location = "/usr/bin/google-chrome-stable"  # Set correct path
        self.chrome_options.add_argument(f"--user-data-dir={self.user_data_dir}")
        self.chrome_options.add_argument("--no-sandbox")
        self.chrome_options.add_argument("--disable-dev-shm-usage")


        self.driver = None
        self._initialize_driver()
        
    def _initialize_driver(self):
        """Initialize and configure the Chrome WebDriver with stealth settings."""
        try:
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=self.chrome_options)
            
            stealth(
                self.driver,
                languages=["en-US", "en"],
                vendor="Google Inc.",
                platform="Win32",
                webgl_vendor="Intel Inc.",
                renderer="Intel Iris OpenGL Engine",
                fix_hairline=True,
            )
            logger.info("WebDriver initialized successfully")
        
        except Exception as e:
            logger.error(f"Failed to initialize WebDriver: {e}")
            raise

    def __del__(self):
        """Clean up resources when the object is destroyed."""
        if self.driver:
            self.driver.quit()
            
    
    def _check_next_page_exists(self, url: str, method: str = "default") -> bool:
        """
        Check if a next page exists for pagination.
        
        Args:
            url: The URL to check
            method: The method to use for checking ("default", "indeed", or "linkedin")
            
        Returns:
            True if next page exists, False otherwise
        """
        try:
            if method == "default":
                req = urllib.request.Request(url, headers=self.headers)
                time.sleep(1)  # Avoid rate limiting
                with urlopen(req) as webUrl:
                    html = webUrl.read()
                soup = BeautifulSoup(html, 'html.parser')
                return not bool(soup.find('div', {'class': 'noResults'}))
                
            elif method in ("indeed", "linkedin"):
                self.driver.get(url)
                html = self.driver.page_source
                soup = BeautifulSoup(html, 'html.parser')
                
                if method == "indeed":
                    return bool(soup.find('div', id='mosaic-provider-jobcards'))
                else:  # linkedin
                    return bool(soup.find('li'))
                    
            else:
                logger.warning(f"Unknown method: {method}")
                return False
                
        except Exception as e:
            logger.error(f"Error checking next page: {e}")
            return False
    
    
    
    def search_linkedin(self, skill: str, place: str, page: int = 0, max_pages: int = 5) -> List[List[str]]:
        """
        Search for jobs on LinkedIn.
        
        Args:
            skill: The job skill to search for
            place: The location to search in
            page: The starting page number
            max_pages: Maximum number of pages to scrape
            
        Returns:
            A list of job listings
        """
        linkedin_list = []
        current_page = page
        
        try:
            while current_page < (page + max_pages):
                url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={skill}&location={place}&start={current_page}&f_TPR=r86400&&sortBy=DD"
                logger.info(f"Scraping LinkedIn page {current_page}: {url}")
                
                self.driver.get(url)
                html = self.driver.page_source
                soup = BeautifulSoup(html, 'html.parser')
                
                list_items = soup.find('body').find_all('li') if soup.find('body') else []
                
                if not list_items:
                    logger.info("No more jobs found on LinkedIn")
                    break
                
                for item in list_items:
                    
                    job_data = {
                        'company': 'No Company',
                        'job': 'No Job Title',
                        'link': 'No Link',
                        'salary': 'No Salary',
                        'post_date': 'No Date'
                    }
                    
                    # Job Title
                    job_title = item.find('h3', class_='base-search-card__title')
                    if job_title:
                        job_data['job'] = job_title.get_text(strip=True)
                    
                    # Company Name
                    company_elem = item.find('h4', class_='base-search-card__subtitle')
                    if company_elem:
                        job_data['company'] = company_elem.get_text(strip=True)
                    
                    # Link
                    link_elem = item.find('a', class_='base-card__full-link')
                    if link_elem and link_elem.has_attr('href'):
                        job_data['link'] = link_elem['href']
                    
                    # Salary
                    salary_elem = item.find('div', class_='job-salary')
                    if salary_elem:
                        job_data['salary'] = salary_elem.get_text(strip=True)
                    
                    # Post Date
                    post_date_elem = item.find('time', class_=lambda c: c and ('job-search-card__listdate' in c or 'job-search-card__listdate--new' in c))
                    if post_date_elem:
                        job_data['post_date'] = post_date_elem.get_text(strip=True)
                    
                    linkedin_list.append([
                        job_data['company'], 
                        job_data['job'], 
                        job_data['link'], 
                        job_data['salary'], 
                        job_data['post_date']
                    ])
                
                current_page += 25  # LinkedIn pagination typically uses 25 job increments
                
                
                if not self._check_next_page_exists(url, "linkedin"):
                    break
                    
                time.sleep(random.uniform(1.5, 3.0))  
            
            logger.info(f"Found {len(linkedin_list)} jobs on LinkedIn")
            return linkedin_list
            
        except Exception as e:
            logger.error(f"Error searching LinkedIn: {e}")
            return linkedin_list
    
    def search_with_jobspy(self, site_name: str, search_term: str, 
                      google_search_term: str, location: str = "newyork",
                      results_wanted: int = 30, hours_old: int = 72,
                      country: str = "usa") -> List[List[str]]:
        """
        Search for jobs using jobspy with robust salary handling
        """
        try:
            logger.info(f"Searching {site_name} using jobspy")
            
            
            jobs = scrape_jobs(
                site_name=site_name,
                search_term=search_term,
                google_search_term=google_search_term,
                location=location,
                results_wanted=results_wanted,
                hours_old=hours_old,
                country_indeed=country,
            )
            
            logger.info(f"Found {len(jobs)} jobs using jobspy")

            
            columns_needed = ["company", "title", "job_url", "date_posted"]
            salary_columns = ["min_amount", "max_amount", "currency"]
            
            
            for col in salary_columns:
                if col not in jobs.columns:
                    jobs[col] = None

           
            if "min_amount" in jobs.columns:
                jobs["min_amount"] = jobs["min_amount"].fillna(0).astype(int)
            if "max_amount" in jobs.columns:
                jobs["max_amount"] = jobs["max_amount"].fillna(0).astype(int)

           
            jobs["salary_info"] = jobs.apply(
                lambda row: f"{row['min_amount']}-{row['max_amount']} {row['currency']}"
                if pd.notnull(row["min_amount"]) and pd.notnull(row["max_amount"])
                else "Not disclosed",
                axis=1
            )

           
            final_columns = columns_needed + ["salary_info"]
            df_clean = jobs[final_columns].replace({np.nan: None})

            
            return df_clean.values.tolist()

        except KeyError as ke:
            logger.error(f"Missing column in results: {ke}")
            return []
        except Exception as e:
            logger.error(f"Error in jobspy search: {str(e)}")
            return []

    def search_with_jobspy_ziprecuiter(self,site_name:List[str],search_term: str, 
                       google_search_term: str, location: str = "San Francisco, CA",
                       results_wanted: int = 20, hours_old: int = 72,
                       country: str = "USA") -> List[Dict[str, Any]]:
        """
        Search for jobs using jobspy and return results in JSON-friendly format
        """
        try:
            logger.info(f"Searching zip_recruiter using jobspy")
            
           
            jobs = scrape_jobs(
                site_name=site_name,
                search_term=search_term,
                google_search_term=google_search_term,
                location=location,
                results_wanted=results_wanted,
                hours_old=hours_old,
                country_indeed=country,
                proxies=["161.97.136.251:3128"]
            )
            
            logger.info(f"Found {len(jobs)} jobs using jobspy")

            
            columns_needed = ["company", "title", "job_url", "date_posted", "location"]
            salary_columns = ["min_amount", "max_amount", "currency"]
            
            
            for col in columns_needed + salary_columns:
                if col not in jobs.columns:
                    jobs[col] = None

           
            jobs["min_amount"] = jobs["min_amount"].fillna(0).astype(float)
            jobs["max_amount"] = jobs["max_amount"].fillna(0).astype(float)
            
           
            jobs["currency"] = jobs["currency"].fillna("").astype(str)

            
            jobs["salary_info"] = jobs.apply(
                lambda row: (
                    f"{row['min_amount']:.0f}-{row['max_amount']:.0f} {row['currency']}"
                    if pd.notnull(row["min_amount"]) and pd.notnull(row["max_amount"])
                    else "Not disclosed"
                ),
                axis=1
            )

            
            final_columns = columns_needed + ["salary_info", "description"]
            jobs_clean = jobs[final_columns].replace({np.nan: None})
            
            
            return jobs_clean.to_dict(orient='records')

        except Exception as e:
            logger.error(f"Error in jobspy search: {str(e)}")
            return []


    async def search_on_hireBase(self, search_term:str, location:str):
        url = "https://www.hirebase.org/api"
        headers = {"Content-Type": "application/json"}
        payload = [
            {
                "KeywordsData": [],
                "experienceData": [],
                "locationData": [location],
                "locationTypeData": [],
                "salaryData": [],
                "titleData": [search_term],
                "EmploymentTypeData": [],
                "include_yoe": [],
                "include_no_salary": [],
                "industry": [],
                "jobCategory": [],
                "visa": [],
                "hideSeenJobs": [],
                "datePosted": [2],
                "include_remote": [],
                "currency": ""
            },
            1,
            "Relevance-and-Date",
            ""
        ]
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {"error": f"Request failed with status {response.status}"}
                
    def search_dice(self, skill: str, location: str, max_results: int = 50) -> List[Dict[str, str]]:
        """
        Search Dice.com for jobs and return structured results - optimized version
        """
        dice_list = []
        try:
            logger.info(f"Searching Dice.com for {skill} jobs in {location}")
            
            
            encoded_skill = urllib.parse.quote(skill)
            encoded_location = urllib.parse.quote(location)
            search_url = f"https://www.dice.com/jobs?q={encoded_skill}&location={encoded_location}"
            
            
            self.driver.get(search_url)
            
            
            wait = WebDriverWait(self.driver, 10)
            
            
            try:
                cookie_accept = wait.until(EC.element_to_be_clickable(
                    (By.XPATH, '//*[@id="truste-show-consent"]')
                ))
                cookie_accept.click()
            except:
                pass  
                
           
            try:
                wait.until(EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "div.search-card")
                ))
            except:
                logger.warning("No job cards found or page structure changed")
                return []
                
            
            if max_results > 20:  
                try:
                    today_filter = wait.until(EC.element_to_be_clickable((
                        By.XPATH, '//*[@id="facets"]/dhi-accordion[1]/div[2]/div/js-single-select-filter/div/div/button[2]'
                    )))
                    today_filter.click()
                    
                    time.sleep(1)
                except:
                    pass  
                    
            
            page = 1
            max_pages = (max_results // 20) + 1  
            
            while len(dice_list) < max_results and page <= max_pages:
                
                html = self.driver.page_source
                soup = BeautifulSoup(html, "html.parser")
                job_cards = soup.find_all('div', class_='card search-card')
                
                
                for card in job_cards:
                    if len(dice_list) >= max_results:
                        break
                        
                    try:
                        
                        job_info = {
                            'company': 'N/A',
                            'title': 'N/A',
                            'url': 'N/A',
                            'location': 'N/A',
                            'post_date': 'N/A',
                            'employment_type': 'Not specified',
                            'salary': 'Not disclosed'
                        }
                        
                        
                        # Company Name
                        company_elem = card.find('a', {'data-cy': 'search-result-company-name'})
                        if company_elem:
                            job_info['company'] = company_elem.get_text(strip=True)
                        
                        # Job Title and URL
                        title_elem = card.find('a', {'data-cy': 'card-title-link'})
                        if title_elem:
                            job_info['title'] = title_elem.get_text(strip=True)
                            job_info['url'] = title_elem['href'] if title_elem.has_attr('href') else 'N/A'
                        
                        # Location
                        location_elem = card.find('span', {'data-cy': 'search-result-location'})
                        if location_elem:
                            job_info['location'] = location_elem.get_text(strip=True)
                        
                        # Post Date
                        date_elem = card.find('span', class_='posted-date')
                        if date_elem:
                            job_info['post_date'] = date_elem.get_text(strip=True)
                        
                        # Employment Type
                        employment_elem = card.find('span', {'data-cy': 'search-result-employment-type'})
                        if employment_elem:
                            job_info['employment_type'] = employment_elem.get_text(strip=True)
                        
                        # Salary Information
                        salary_elem = card.find('span', {'data-cy': 'compensationText'})
                        if salary_elem:
                            job_info['salary'] = salary_elem.get_text(strip=True)
                        
                        dice_list.append(job_info)
                        
                    except Exception as e:
                        logger.warning(f"Error parsing job card: {str(e)}")
                        continue
                
                
                if len(dice_list) < max_results and page < max_pages:
                    try:
                        next_button = self.driver.find_element(By.CSS_SELECTOR, "button[data-cy='pagination-next-page']")
                        if next_button.is_enabled():
                            next_button.click()
                            page += 1
                            
                            time.sleep(1.5)
                            wait.until(EC.staleness_of(job_cards[0]))
                        else:
                            break  
                    except:
                        break  
                else:
                    break
                    
            logger.info(f"Successfully extracted {len(dice_list)} jobs from Dice")
            return dice_list
            
        except Exception as e:
            logger.error(f"Dice.com search failed: {str(e)}")
            return []

        




def random_delay(min_seconds: float = 1.0, max_seconds: float = 3.0):
    """Add a random delay to avoid detection."""
    time.sleep(random.uniform(min_seconds, max_seconds))


if __name__ == "__main__":
    pass
    
