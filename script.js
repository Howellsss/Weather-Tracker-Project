 /* ============================================================
   WEATHER APP - script.js
   Uses the free Open-Meteo API (no API key needed).
   Flow:  city name  ->  coordinates  ->  weather data  ->  screen
   ============================================================ */

/* Grab the HTML elements we need to read from or write to.
   Doing this once at the top keeps the rest of the code tidy. */
const cityInput    = document.getElementById("cityInput");
const searchBtn    = document.getElementById("searchBtn");
const loadingEl    = document.getElementById("loading");
const errorEl      = document.getElementById("error");
const forecastList = document.getElementById("forecastList");


/* ------------------------------------------------------------
   getCoordinates(city)
   Turns a city name (e.g. "Lagos") into latitude & longitude
   using the Geocoding API. Returns the first matching result,
   or null if the city was not found.
   ------------------------------------------------------------ */
async function getCoordinates(city) {
  // encodeURIComponent makes city names with spaces (e.g. "New York") safe in a URL
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

  const response = await fetch(url);   // wait for the network request
  const data = await response.json();  // wait for the JSON to be parsed

  // If there are no results, the city does not exist
  if (!data.results || data.results.length === 0) {
    return null;
  }

  // Return only the bits we need from the first result
  return {
    name: data.results[0].name,
    country: data.results[0].country,
    latitude: data.results[0].latitude,
    longitude: data.results[0].longitude,
  };
}


/* ------------------------------------------------------------
   getWeather(lat, lon)
   Uses the coordinates to fetch the current weather plus the
   5-day forecast. Returns the full weather data object.
   ------------------------------------------------------------ */
async function getWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,uv_index_max` +
    `&timezone=auto`;

  const response = await fetch(url);
  const data = await response.json();
  return data;
}


/* ------------------------------------------------------------
   getWeatherDescription(code)
   Converts a WMO weather_code number into a readable
   description and a matching emoji icon (from the brief's table).
   ------------------------------------------------------------ */
function getWeatherDescription(code) {
  if (code === 0)                  return { text: "Clear sky",     icon: "☀️" };
  if ([1, 2, 3].includes(code))    return { text: "Partly cloudy", icon: "⛅" };
  if ([45, 48].includes(code))     return { text: "Foggy",         icon: "🌫️" };
  if ([51, 53, 55].includes(code)) return { text: "Drizzle",       icon: "🌦️" };
  if ([61, 63, 65].includes(code)) return { text: "Rain",          icon: "🌧️" };
  if ([71, 73, 75].includes(code)) return { text: "Snow",          icon: "❄️" };
  if ([80, 81, 82].includes(code)) return { text: "Rain showers",  icon: "🌦️" };
  if (code === 95)                 return { text: "Thunderstorm",  icon: "⛈️" };
  return { text: "Unknown", icon: "❓" }; // fallback for any other code
}


/* ------------------------------------------------------------
   getUvLabel(value)
   Helper: turns a UV index number into a simple word
   (Low / Moderate / High / Very High) for the stats row.
   ------------------------------------------------------------ */
function getUvLabel(value) {
  if (value < 3) return "Low";
  if (value < 6) return "Moderate";
  if (value < 8) return "High";
  return "Very High";
}


/* ------------------------------------------------------------
   getDayName(dateString, index)
   Helper: turns an API date like "2026-06-12" into a weekday
   name. The first day (index 0) is always shown as "Today".
   ------------------------------------------------------------ */
function getDayName(dateString, index) {
  if (index === 0) return "Today";
  // Adding "T00:00:00" keeps the date on the correct day in every timezone
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "long" }); // e.g. "Tuesday"
}


/* ------------------------------------------------------------
   displayCurrentWeather(data, cityName, country)
   Writes the current weather into the teal hero panel and
   the stats row.
   ------------------------------------------------------------ */
function displayCurrentWeather(data, cityName, country) {
  const current = data.current;

  // Convert the weather code into description + icon
  const weather = getWeatherDescription(current.weather_code);

  // Fill in the hero panel
  document.getElementById("heroIcon").textContent = weather.icon;
  document.getElementById("heroCity").textContent = `${cityName}, ${country}`;
  document.getElementById("heroTemp").textContent = `${Math.round(current.temperature_2m)}°C`;
  document.getElementById("heroDesc").textContent =
    `${weather.text} · Feels like ${Math.round(current.apparent_temperature)}°C`;

  // Fill in the three stats
  document.getElementById("humidity").textContent = `${current.relative_humidity_2m}%`;
  document.getElementById("wind").textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  document.getElementById("uv").textContent = getUvLabel(data.daily.uv_index_max[0]);
}


/* ------------------------------------------------------------
   displayForecast(daily)
   Builds the 5 forecast rows (day name, icon, high & low)
   and inserts them into the page.
   ------------------------------------------------------------ */
function displayForecast(daily) {
  forecastList.innerHTML = ""; // clear any previous forecast first

  // Loop through the first 5 days the API returned
  for (let i = 0; i < 5; i++) {
    const dayName = getDayName(daily.time[i], i);          // "Today", "Tuesday", ...
    const weather = getWeatherDescription(daily.weather_code[i]); // icon for the day
    const high = Math.round(daily.temperature_2m_max[i]);  // high temperature
    const low  = Math.round(daily.temperature_2m_min[i]);  // low temperature

    // Build one row of HTML (high temp on top, low temp underneath)
    const row = document.createElement("div");
    row.className = "forecast-row";
    row.innerHTML = `
      <span class="forecast-day">${dayName}</span>
      <span class="forecast-icon">${weather.icon}</span>
      <span class="forecast-temps">
        <span class="forecast-high">${high}°</span>
        <span class="forecast-low">${low}°</span>
      </span>
    `;
    forecastList.appendChild(row); // add the finished row to the page
  }
}


/* ------------------------------------------------------------
   showError(message)
   Shows a red error message and hides the loading text.
   ------------------------------------------------------------ */
function showError(message) {
  loadingEl.classList.add("hidden");
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}


/* ------------------------------------------------------------
   handleSearch()
   Main function, runs when the Search button is clicked.
   It ties everything together and handles any errors.
   ------------------------------------------------------------ */
async function handleSearch() {
  const city = cityInput.value.trim();

  // Stop if the box is empty
  if (city === "") {
    showError("Please enter a city name.");
    return;
  }

  // Reset messages and show the loading state
  errorEl.classList.add("hidden");
  loadingEl.classList.remove("hidden");

  try {
    // Step 1: city name -> coordinates
    const location = await getCoordinates(city);

    // If the city was not found, show an error and stop
    if (location === null) {
      showError("City not found. Please check the spelling and try again.");
      return;
    }

    // Step 2: coordinates -> weather data
    const weatherData = await getWeather(location.latitude, location.longitude);

    // Step 3: put the data on the screen
    displayCurrentWeather(weatherData, location.name, location.country);
    displayForecast(weatherData.daily);

    // Done loading successfully
    loadingEl.classList.add("hidden");

  } catch (error) {
    // Runs if the network fails or something unexpected breaks
    showError("Something went wrong. Please try again.");
    console.error(error); // extra detail for us in the dev console
  }
}


/* ------------------------------------------------------------
   EVENT LISTENERS
   ------------------------------------------------------------ */
// Run the search when the button is clicked
searchBtn.addEventListener("click", handleSearch);

// Also run the search when the user presses Enter in the input
cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});

// Load weather for the default city as soon as the page opens
handleSearch();