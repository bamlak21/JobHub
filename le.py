from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time
import logging
import random

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Random delay function
def random_delay(min_delay=0.5, max_delay=1.5):
    time.sleep(random.uniform(min_delay, max_delay))

# Initialize Chrome driver
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)

try:
    # Open Dice.com
    driver.get("https://www.dice.com/")
    time.sleep(1)

    # Find elements
    input_box = driver.find_element(By.ID, "typeaheadInput")
    location_box = driver.find_element(By.ID, "google-location-search")
    submit = driver.find_element(By.ID, "submitSearch-button")

    # Search for job
    input_box.send_keys("software engineer")
    location_box.send_keys("canada")
    submit.send_keys(Keys.ENTER)

    time.sleep(3)

    # Click on "Today" filter
    today = driver.find_element(
        By.XPATH,
        '//*[@id="facets"]/dhi-accordion[1]/div[2]/div/js-single-select-filter/div/div/button[2]'
    )
    today.send_keys(Keys.ENTER)

    time.sleep(3)

    # Parse page content
    html = driver.page_source
    soup = BeautifulSoup(html, "html.parser")

    job_cards = soup.find_all('div', class_='card search-card')
    company_list = []

    for card in job_cards:
        company_info = {
            'company': 'N/A',
            'job_title': 'N/A',
            'location': 'N/A',
            'job_url': 'N/A',
            'post_date': 'N/A'
        }

        # Extract company name
        company_elem = card.find('a', {'data-cy': 'search-result-company-name'})
        if company_elem:
            company_info['company'] = company_elem.get_text(strip=True)

        # Extract job title and URL
        job_title_elem = card.find('a', {'data-cy': 'card-title-link'})
        if job_title_elem:
            company_info['job_title'] = job_title_elem.get_text(strip=True)
            company_info['job_url'] = job_title_elem.get('href', 'N/A')

        # Extract location
        location_elem = card.find('span', {'data-cy': 'search-result-location'})
        if location_elem:
            company_info['location'] = location_elem.get_text(strip=True)

        # Extract post date
        date_elem = card.find('span', class_='posted-date')
        if date_elem:
            company_info['post_date'] = date_elem.get_text(strip=True)

        company_list.append(company_info)
        random_delay()

    logger.info(f"Extracted {len(company_list)} companies from Dice.com")

except Exception as e:
    logger.error(f"Error extracting Dice.com companies: {str(e)}")

finally:
    # Keep browser open for review
    time.sleep(10)
    driver.quit()


print(company_list)