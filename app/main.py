
from fastapi import FastAPI,Request, Response
from fastapi.middleware.cors import CORSMiddleware
import logging
from . import schemas
from . import jobs

app=FastAPI()

origins = [
      "https://job-hub-rho.vercel.app/",
      "https://ubgry5tetyhn.share.zrok.io",
      "http://localhost:3000",
      "*"
]

app.add_middleware(
      CORSMiddleware,
      allow_origins=origins,
      allow_methods=["*"], 
      allow_headers=["*"],
)


jobscr = jobs.JobScraper()



logging.basicConfig(level=logging.INFO)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    response: Response = await call_next(request)
    logging.info(f"Response Headers: {dict(response.headers)}")
    return response

@app.get("/") 
async def root():
    return {"message": f"The API is working ! "}

@app.post("/linkdin/get")
def get_LIposts(title:schemas.userInput):
    linkdin=jobscr.search_linkedin(title.skill,title.location,title.pagenumber)

    return linkdin

@app.post("/ziprecuter/get")
def get_zip(title:schemas.indeedInput):
    site = "zip_recruiter"
    term = title.search_term
    google_st = title.google_search_term
    loc = title.location
    res = title.results_wanted
    hr = title.hours_old
    country = title.country_indeed
    
    
    ziprecuter = jobscr.search_with_jobspy_ziprecuiter(
        site_name = ["zip_recruiter"],
        search_term=term,
        google_search_term=google_st,
        location=loc,
        results_wanted=res,
        hours_old=hr,
        country=country
        )

    return ziprecuter




@app.post('/indeed/get')
def get_indeed(title:schemas.indeedInput):

    site = "indeed"
    
    term = title.search_term
    google_st = title.google_search_term
    loc = title.location
    res = title.results_wanted
    hr = title.hours_old
    country = title.country_indeed
    indeed = jobscr.search_with_jobspy(
        site_name = site,
        search_term=term,
        google_search_term=google_st,
        location=loc,
        results_wanted=res,
        hours_old=hr,
        country=country
        )
    return indeed

