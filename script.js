async function fetchLinkedInJobs(skill, location, pagenumber) {
    try {
      const response = await fetch('https://ubgry5tetyhn.share.zrok.io/linkdin/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skill: skill,
          location: location,
          pagenumber: pagenumber,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return data; // Return the parsed JSON data
    } catch (error) {
      console.error('Error fetching LinkedIn jobs:', error);
      // You might want to handle the error more gracefully, e.g., by returning null or an empty array
      throw error; // re-throw the error, so the calling function also knows about it.
    }
  }
  
  // Example usage:
  async function exampleUsage() {
      try{
          const jobs = await fetchLinkedInJobs('software engineer', 'usa', 2);
          console.log("Fetched Jobs:", jobs);
          // Do something with the jobs data
      } catch(err){
          console.log("There was an error");
      }
  
  }
  
  exampleUsage();