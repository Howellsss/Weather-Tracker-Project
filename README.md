Name: Howells Henry
Student ID: ALT/SOE/BAR/026/0261
How I built the Weather Tracker : I built this weather app using three files — index.html for the structure, styles.css for the styling, and script.js for the logic.
In the HTML I used semantic tags like <header>, <main>, and <section> to lay out the search bar, the current-weather panel, the stats row, and an empty container for the forecast. 
I styled everything in CSS to match the design brief, using the navy #1A3C5E header and teal #2E86AB hero, with a media query so it still works on smaller screens, plus hover effects and smooth transitions on the search button and forecast rows.
The JavaScript is where the app comes to life: it uses the free Open-Meteo API in two steps — first the Geocoding endpoint turns the city name into latitude and longitude, then the Forecast endpoint uses those coordinates to fetch the current conditions and the five-day outlook. 
I wrote the fetch logic with async/await and a try/catch so it shows a clear "city not found" message when something goes wrong, mapped the API's WMO weather codes to readable descriptions and emoji icons, and built the forecast rows dynamically so the day names always reflect the real current day. 
I split the code into small, clearly named functions and commented each one so it's easy to follow.
