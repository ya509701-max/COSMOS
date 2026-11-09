const NASA_API = "https://api.nasa.gov/planetary/apod";
const NASA_KEY = "tH7WzCDkRrCDPPPgnwRDp6Wpkp9PTpbNH7JPGk6n";

const LAUNCHES_API =
  "https://lldev.thespacedevs.com/2.3.0/launches/upcoming/?limit=10";

const PLANETS_API =
  "https://solar-system-opendata-proxy.vercel.app/api/planets";

// Planet images already included in the project
const planetImages = {
  mercury: "./image/mercury.png",
  venus: "./image/venus.png",
  earth: "./image/earth.png",
  mars: "./image/mars.png",
  jupiter: "./image/jupiter.png",
  saturn: "./image/saturn.png",
  uranus: "./image/uranus.png",
  neptune: "./image/neptune.png"
};

const planetColors = {
  mercury: "#eab308",
  venus: "#f97316",
  earth: "#3b82f6",
  mars: "#ef4444",
  jupiter: "#fb923c",
  saturn: "#facc15",
  uranus: "#06b6d4",
  neptune: "#2563eb"
};

let planetsData = [];
let launchesData = [];

function getElement(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const element = getElement(id);

  if (element) {
    element.textContent =
      value === null || value === undefined || value === ""
        ? "N/A"
        : value;
  }
}

function formatNumber(value, digits = 2) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return number.toLocaleString("en-US", {
    maximumFractionDigits: digits
  });
}

function formatDate(dateString) {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function formatShortDate(dateString) {
  if (!dateString) return "TBD";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function showLoading(element, message = "Loading...") {
  if (!element) return;

  element.innerHTML = `
    <div class="col-span-full text-center py-10 text-slate-400">
      <i class="fas fa-spinner fa-spin text-3xl text-blue-400 mb-3"></i>
      <p>${message}</p>
    </div>
  `;
}

function showError(element, message) {
  if (!element) return;

  element.innerHTML = `
    <div class="col-span-full text-center py-10 text-red-400">
      <i class="fas fa-exclamation-circle text-3xl mb-3"></i>
      <p>${message}</p>
      <button
        onclick="location.reload()"
        class="mt-4 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
      >
        Try Again
      </button>
    </div>
  `;
}

async function getJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Request failed (${response.status} ${response.statusText})`
    );
  }

  return await response.json();
}

async function loadAPOD(selectedDate = "") {
  const image = getElement("apod-image");
  const loading = getElement("apod-loading");
  const container = getElement("apod-image-container");

  if (!image) return;

  if (loading) {
    loading.classList.remove("hidden");
  }

  image.style.opacity = "0.4";

  try {
    let url = `${NASA_API}?api_key=${NASA_KEY}`;

    if (selectedDate) {
      url += `&date=${selectedDate}`;
    }

    const data = await getJSON(url);

    setText("apod-title", data.title || "NASA Astronomy Picture");

    setText(
      "apod-explanation",
      data.explanation || "No explanation available."
    );

    setText(
      "apod-copyright",
      data.copyright ? `© ${data.copyright}` : "© NASA"
    );

    setText("apod-date-info", data.date);
    setText("apod-date-detail", data.date);
    setText("apod-media-type", data.media_type);

    setText(
      "apod-date",
      `Astronomy Picture of the Day - ${formatDate(data.date)}`
    );

    if (data.media_type === "image") {
      image.src = data.hdurl || data.url;
      image.alt = data.title || "NASA Picture of the Day";
      image.style.display = "block";

      image.onerror = function () {
        this.src = data.url;
      };

      if (container) {
        const video = container.querySelector("iframe");

        if (video) video.remove();
      }
    } else if (data.media_type === "video") {
      image.style.display = "none";

      if (container) {
        let video = container.querySelector("iframe");

        if (!video) {
          video = document.createElement("iframe");
          video.className = "w-full h-full";
          video.allowFullscreen = true;
          container.appendChild(video);
        }

        video.src = data.url;
        video.title = data.title || "NASA Space Video";
      }
    }

    const viewButton = container?.querySelector("button");

    if (viewButton) {
      viewButton.onclick = () => {
        window.open(data.hdurl || data.url, "_blank");
      };
    }

    const dateInput = getElement("apod-date-input");

    if (dateInput) {
      dateInput.max = new Date().toISOString().split("T")[0];
      dateInput.value = data.date;
    }

  } catch (error) {
    console.error("NASA API Error:", error);

    setText("apod-title", "Unable to load NASA picture");

    setText(
      "apod-explanation",
      "Something went wrong while loading data. Please try again."
    );

  } finally {
    if (loading) {
      loading.classList.add("hidden");
    }

    image.style.opacity = "1";
  }
}

// Load button
getElement("load-date-btn")?.addEventListener("click", () => {
  const dateInput = getElement("apod-date-input");

  if (!dateInput || !dateInput.value) {
    alert("Please select a date first.");
    return;
  }

  loadAPOD(dateInput.value);
});

// Today button
getElement("today-apod-btn")?.addEventListener("click", () => {
  const today = new Date().toISOString().split("T")[0];

  const dateInput = getElement("apod-date-input");

  if (dateInput) {
    dateInput.value = today;
  }

  loadAPOD(today);
});

function getLaunchImage(launch) {
  return (
    launch.image?.image_url ||
    launch.image?.thumbnail_url ||
    launch.rocket?.configuration?.image?.image_url ||
    launch.rocket?.configuration?.image?.thumbnail_url ||
    "./image/placeholder.webp"
  );
}

function getLaunchProvider(launch) {
  return (
    launch.launch_service_provider?.name ||
    launch.launch_service_provider?.abbrev ||
    "Unknown Provider"
  );
}

function getRocketName(launch) {
  return (
    launch.rocket?.configuration?.full_name ||
    launch.rocket?.configuration?.name ||
    "Unknown Rocket"
  );
}

function getLaunchLocation(launch) {
  return (
    launch.pad?.location?.name ||
    launch.pad?.name ||
    "Location not announced"
  );
}

function getLaunchCountry(launch) {
  return (
    launch.pad?.location?.country?.name ||
    "Unknown Country"
  );
}

function getLaunchStatus(launch) {
  return (
    launch.status?.abbrev ||
    launch.status?.name ||
    "TBD"
  );
}

function getLaunchDate(launch) {
  return launch.net || launch.window_start || null;
}

function getDaysUntil(dateString) {
  if (!dateString) return "TBD";

  const launchDate = new Date(dateString);
  const today = new Date();

  if (Number.isNaN(launchDate.getTime())) {
    return "TBD";
  }

  const difference = launchDate.getTime() - today.getTime();

  return Math.max(
    0,
    Math.ceil(difference / (1000 * 60 * 60 * 24))
  );
}

function createFeaturedLaunch(launch) {
  const container = getElement("featured-launch");

  if (!container || !launch) return;

  const date = getLaunchDate(launch);
  const image = getLaunchImage(launch);

  const missionDescription =
    launch.mission?.description ||
    "Mission details are not available yet.";

  container.innerHTML = `
    <div class="relative bg-slate-800/30 border border-slate-700 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all">

      <div class="absolute inset-0 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>

      <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-6 p-5 md:p-8">

        <div class="flex flex-col justify-between">
          <div>

            <div class="flex items-center gap-3 mb-4">

              <span class="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold">
                <i class="fas fa-star mr-2"></i>
                Featured Launch
              </span>

              <span class="px-4 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold">
                ${getLaunchStatus(launch)}
              </span>

            </div>

            <h3 class="text-2xl md:text-3xl font-bold mb-3 leading-tight">
              ${launch.name || "Upcoming Space Launch"}
            </h3>

            <div class="flex flex-col xl:flex-row gap-4 mb-6 text-slate-400">

              <div class="flex items-center gap-2">
                <i class="fas fa-building"></i>
                <span>${getLaunchProvider(launch)}</span>
              </div>

              <div class="flex items-center gap-2">
                <i class="fas fa-rocket"></i>
                <span>${getRocketName(launch)}</span>
              </div>

            </div>

            <div class="inline-flex items-center gap-3 px-6 py-3 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-xl mb-6">

              <i class="fas fa-clock text-2xl text-blue-400"></i>

              <div>
                <p class="text-2xl font-bold text-blue-400">
                  ${getDaysUntil(date)}
                </p>

                <p class="text-xs text-slate-400">
                  Days Until Launch
                </p>
              </div>

            </div>

            <div class="grid xl:grid-cols-2 gap-4 mb-6">

              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1">
                  <i class="fas fa-calendar mr-2"></i>Launch Date
                </p>

                <p class="font-semibold">
                  ${formatDate(date)}
                </p>
              </div>

              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1">
                  <i class="fas fa-clock mr-2"></i>Launch Time
                </p>

                <p class="font-semibold">
                  ${
                    date
                      ? new Date(date).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "UTC",
                          timeZoneName: "short"
                        })
                      : "TBD"
                  }
                </p>
              </div>

              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1">
                  <i class="fas fa-map-marker-alt mr-2"></i>Location
                </p>

                <p class="font-semibold text-sm">
                  ${getLaunchLocation(launch)}
                </p>
              </div>

              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1">
                  <i class="fas fa-globe mr-2"></i>Country
                </p>

                <p class="font-semibold">
                  ${getLaunchCountry(launch)}
                </p>
              </div>

            </div>

            <p class="text-slate-300 leading-relaxed mb-6">
              ${missionDescription}
            </p>

          </div>

          <div class="flex flex-wrap gap-3">

            <button
              class="px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors font-semibold"
              onclick="window.open('${launch.url || "https://thespacedevs.com"}','_blank')"
            >
              <i class="fas fa-info-circle mr-2"></i>
              View Full Details
            </button>

          </div>
        </div>

        <div class="relative min-h-[250px] lg:min-h-full">

          <img
            src="${image}"
            alt="${launch.name || "Rocket launch"}"
            class="w-full h-full min-h-[300px] object-cover rounded-2xl"
            onerror="this.src='./image/placeholder.webp'"
          />

        </div>

      </div>
    </div>
  `;
}

function createLaunchCard(launch) {
  const date = getLaunchDate(launch);
  const image = getLaunchImage(launch);

  return `
    <div class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group">

      <div class="relative h-48 bg-slate-900/50">

        <img
          src="${image}"
          alt="${launch.name || "Rocket launch"}"
          class="w-full h-full object-cover"
          onerror="this.src='./image/placeholder.webp'"
        />

        <div class="absolute top-3 right-3">
          <span class="px-3 py-1 bg-blue-500/90 text-white rounded-full text-xs font-semibold">
            ${getLaunchStatus(launch)}
          </span>
        </div>

      </div>

      <div class="p-5">

        <div class="mb-3">

          <h4 class="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400">
            ${launch.name || "Upcoming Launch"}
          </h4>

          <p class="text-sm text-slate-400">
            <i class="fas fa-building text-xs mr-2"></i>
            ${getLaunchProvider(launch)}
          </p>

        </div>

        <div class="space-y-2 mb-4">

          <div class="flex items-center gap-2 text-sm">
            <i class="fas fa-calendar text-slate-500 w-4"></i>
            <span class="text-slate-300">
              ${formatShortDate(date)}
            </span>
          </div>

          <div class="flex items-center gap-2 text-sm">
            <i class="fas fa-clock text-slate-500 w-4"></i>

            <span class="text-slate-300">
              ${
                date
                  ? new Date(date).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "UTC",
                      timeZoneName: "short"
                    })
                  : "TBD"
              }
            </span>
          </div>

          <div class="flex items-center gap-2 text-sm">
            <i class="fas fa-rocket text-slate-500 w-4"></i>
            <span class="text-slate-300">
              ${getRocketName(launch)}
            </span>
          </div>

          <div class="flex items-center gap-2 text-sm">
            <i class="fas fa-map-marker-alt text-slate-500 w-4"></i>

            <span class="text-slate-300 line-clamp-1">
              ${getLaunchLocation(launch)}
            </span>
          </div>

        </div>

        <div class="flex items-center gap-2 pt-4 border-t border-slate-700">

          <button
            class="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm font-semibold"
            onclick="window.open('${launch.url || "https://thespacedevs.com"}','_blank')"
          >
            Details
          </button>

        </div>

      </div>
    </div>
  `;
}

async function loadLaunches() {
  const grid = getElement("launches-grid");
  const featured = getElement("featured-launch");

  showLoading(grid, "Loading upcoming launches...");

  if (featured) {
    featured.innerHTML = `
      <p class="text-slate-400 text-center py-6">
        Loading featured launch...
      </p>
    `;
  }

  try {
    const data = await getJSON(LAUNCHES_API);

    if (!data || !Array.isArray(data.results)) {
      throw new Error("The launches API returned an unexpected response.");
    }

    launchesData = data.results;

    if (launchesData.length === 0) {
      if (featured) {
        featured.innerHTML = `
          <p class="text-slate-400 text-center py-6">
            No upcoming launches found.
          </p>
        `;
      }

      if (grid) {
        grid.innerHTML = `
          <p class="col-span-full text-center text-slate-400 py-8">
            No upcoming launches are currently available.
          </p>
        `;
      }

      return;
    }

    createFeaturedLaunch(launchesData[0]);

    if (grid) {
      grid.innerHTML = launchesData
        .slice(1)
        .map(createLaunchCard)
        .join("");
    }

    setText(
      "launches-count",
      `${launchesData.length} Launches`
    );

    setText(
      "launches-count-mobile",
      launchesData.length
    );

  } catch (error) {
    console.error("Launches API Error:", error);

    if (featured) {
      featured.innerHTML = `
        <p class="text-red-400 text-center py-6">
          Unable to load featured launch.
        </p>
      `;
    }

    if (grid) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-10">

          <i class="fas fa-exclamation-circle text-3xl text-red-400 mb-3"></i>

          <p class="text-red-400 mb-2">
            Unable to load launches.
          </p>

          <p class="text-slate-400 text-sm mb-4">
            ${error.message}
          </p>

          <button
            id="retry-launches"
            class="px-5 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
            type="button"
          >
            Try Again
          </button>

        </div>
      `;

      getElement("retry-launches")?.addEventListener(
        "click",
        loadLaunches
      );
    }
  }
}

function getPlanetName(planet) {
  return (
    planet.englishName ||
    planet.name ||
    planet.planetName ||
    ""
  );
}

function getPlanetId(planet) {
  return getPlanetName(planet).toLowerCase();
}

function getPlanetMass(planet) {
  if (planet.mass?.massValue !== undefined) {
    return (
      Number(planet.mass.massValue) *
      Math.pow(10, Number(planet.mass.massExponent || 0))
    );
  }

  return Number(planet.mass || 0);
}

function getPlanetDistance(planet) {
  return Number(
    planet.semimajorAxis ||
    planet.distanceFromSun ||
    planet.distance ||
    0
  );
}

function getPlanetMoons(planet) {
  if (Array.isArray(planet.moons)) {
    return planet.moons.length;
  }

  return Number(planet.moons || 0);
}

function getPlanetRadius(planet) {
  return Number(
    planet.meanRadius ||
    planet.mean_radius ||
    planet.radius ||
    0
  );
}

function getPlanetType(planet) {
  const name = getPlanetName(planet).toLowerCase();

  if (["jupiter", "saturn"].includes(name)) {
    return "Gas Giant";
  }

  if (["uranus", "neptune"].includes(name)) {
    return "Ice Giant";
  }

  return "Terrestrial";
}

function getPlanetOrbitalPeriod(planet) {
  const value = Number(
    planet.sideralOrbit ||
    planet.orbitalPeriod ||
    0
  );

  if (!value) return "N/A";

  if (value >= 365) {
    return `${formatNumber(value / 365.25, 1)} years`;
  }

  return `${formatNumber(value, 0)} days`;
}

function getPlanetRotation(planet) {
  const value = Number(
    planet.sideralRotation ||
    planet.rotationPeriod ||
    0
  );

  if (!value) return "N/A";

  return `${formatNumber(value, 2)} hours`;
}

function getPlanetTemperature(planet) {
  const temperature =
    planet.avgTemp ??
    planet.averageTemperature ??
    planet.temperature;

  if (temperature === undefined || temperature === null) {
    return "N/A";
  }

  return `${formatNumber(temperature, 0)}°C`;
}

function getPlanetDiscovery(planet) {
  return planet.discoveredBy || "Known since antiquity";
}

function getPlanetDiscoveryDate(planet) {
  return planet.discoveryDate || "Ancient";
}

function getPlanetVolume(planet) {
  if (planet.vol?.volValue !== undefined) {
    return `${formatNumber(planet.vol.volValue, 2)} × 10^${planet.vol.volExponent} km³`;
  }

  return "N/A";
}

function getPlanetAU(planet) {
  const distance = getPlanetDistance(planet);

  if (!distance) return "N/A";

  // The API provides semimajorAxis in kilometers.
  return formatNumber(distance / 149597870.7, 2);
}

function createPlanetCards() {
  const grid = getElement("planets-grid");

  if (!grid) return;

  const order = [
    "mercury",
    "venus",
    "earth",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune"
  ];

  const sortedPlanets = order
    .map(name => planetsData.find(p => getPlanetId(p) === name))
    .filter(Boolean);

  grid.querySelectorAll(".planet-card").forEach(card => {
    const id = card.dataset.planetId;

    const planet = sortedPlanets.find(
      p => getPlanetId(p) === id
    );

    if (!planet) return;

    const distance = getPlanetAU(planet);

    const distanceText = card.querySelector("p");

    if (distanceText) {
      distanceText.textContent = `${distance} AU`;
    }

    card.onclick = () => showPlanetDetails(planet);
  });
}

function showPlanetDetails(planet) {
  if (!planet) return;

 const name = getPlanetName(planet);
const id = getPlanetId(planet);

const selectedCard = document.querySelector(
  `.planet-card[data-planet-id="${id}"]`
);

const cardImage = selectedCard?.querySelector("img");

const image = cardImage
  ? cardImage.getAttribute("src")
  : planetImages[id];

  const description =
    planet.description ||
    planet.alternativeName ||
    `${name} is one of the eight planets in our Solar System. Explore its physical and orbital characteristics below.`;

  const massKg = getPlanetMass(planet);
  const earthMass = 5.9722e24;

  const massInEarthUnits = massKg
    ? massKg / earthMass
    : null;

  const radius = getPlanetRadius(planet);
  const diameter = radius ? radius * 2 : null;

  setText("planet-detail-name", name);
  setText("planet-detail-description", description);

  const detailImage = getElement("planet-detail-image");

if (detailImage && image) {
  detailImage.src = image;
  detailImage.alt = name;
  detailImage.style.display = "block";

  detailImage.onerror = function () {
    console.error("Image not found:", image);
  };
}
  setText(
    "planet-distance",
    getPlanetDistance(planet)
      ? `${formatNumber(getPlanetDistance(planet) / 1000000, 1)}M km`
      : "N/A"
  );

  setText(
    "planet-radius",
    radius ? `${formatNumber(radius, 0)} km` : "N/A"
  );

  setText(
    "planet-mass",
    massKg
      ? `${formatNumber(massKg, 2)} kg`
      : "N/A"
  );

  setText(
    "planet-density",
    planet.density !== undefined
      ? `${formatNumber(planet.density, 2)} g/cm³`
      : "N/A"
  );

  setText(
    "planet-orbital-period",
    getPlanetOrbitalPeriod(planet)
  );

  setText(
    "planet-rotation",
    getPlanetRotation(planet)
  );

  setText(
    "planet-moons",
    getPlanetMoons(planet)
  );

  setText(
    "planet-gravity",
    planet.gravity !== undefined
      ? `${formatNumber(planet.gravity, 2)} m/s²`
      : "N/A"
  );

  setText(
    "planet-discoverer",
    getPlanetDiscovery(planet)
  );

  setText(
    "planet-discovery-date",
    getPlanetDiscoveryDate(planet)
  );

  setText(
    "planet-body-type",
    planet.bodyType || "Planet"
  );

  setText(
    "planet-volume",
    getPlanetVolume(planet)
  );

  setText(
    "planet-perihelion",
    planet.perihelion
      ? `${formatNumber(planet.perihelion / 1000000, 1)}M km`
      : "N/A"
  );

  setText(
    "planet-aphelion",
    planet.aphelion
      ? `${formatNumber(planet.aphelion / 1000000, 1)}M km`
      : "N/A"
  );

  setText(
    "planet-eccentricity",
    planet.eccentricity !== undefined
      ? formatNumber(planet.eccentricity, 5)
      : "N/A"
  );

  setText(
    "planet-inclination",
    planet.inclination !== undefined
      ? `${formatNumber(planet.inclination, 2)}°`
      : "N/A"
  );

  setText(
    "planet-axial-tilt",
    planet.axialTilt !== undefined
      ? `${formatNumber(planet.axialTilt, 2)}°`
      : "N/A"
  );

  setText(
    "planet-temp",
    getPlanetTemperature(planet)
  );

  setText(
    "planet-escape",
    planet.escape !== undefined
      ? `${formatNumber(planet.escape, 2)} km/s`
      : "N/A"
  );

  const facts = getElement("planet-facts");

  if (facts) {
    const planetFacts = [
      `${name} is part of our Solar System.`,
      `Its orbital period is ${getPlanetOrbitalPeriod(planet)}.`,
      `It has ${getPlanetMoons(planet)} known moons.`,
      `Its gravity is ${
        planet.gravity !== undefined
          ? `${formatNumber(planet.gravity, 2)} m/s²`
          : "not available"
      }.`
    ];

    facts.innerHTML = planetFacts
      .map(fact => `
        <li class="flex items-start">
          <i class="fas fa-check text-green-400 mt-1 mr-2"></i>
          <span class="text-slate-300">${fact}</span>
        </li>
      `)
      .join("");
  }

  // Highlight selected planet
  document.querySelectorAll(".planet-card").forEach(card => {
    card.classList.remove("border-blue-400");

    if (card.dataset.planetId === id) {
      card.classList.add("border-blue-400");
    }
  });
}

function createComparisonTable() {
  const tbody = getElement("planet-comparison-tbody");

  if (!tbody) return;

  const order = [
    "mercury",
    "venus",
    "earth",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune"
  ];

  const sortedPlanets = order
    .map(name => planetsData.find(p => getPlanetId(p) === name))
    .filter(Boolean);

  tbody.innerHTML = sortedPlanets
    .map(planet => {
      const name = getPlanetName(planet);
      const id = getPlanetId(planet);
      const color = planetColors[id] || "#64748b";

      const radius = getPlanetRadius(planet);
      const diameter = radius ? radius * 2 : null;

      const mass = getPlanetMass(planet);

      const earthMass = mass
        ? mass / 5.9722e24
        : null;

      const type = getPlanetType(planet);

      return `
        <tr class="hover:bg-slate-800/30 transition-colors">

          <td class="px-4 md:px-6 py-3 md:py-4 sticky left-0 bg-slate-800 z-10">

            <div class="flex items-center space-x-2 md:space-x-3">

              <div
                class="w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0"
                style="background-color: ${color}"
              ></div>

              <span class="font-semibold text-sm md:text-base whitespace-nowrap">
                ${name}
              </span>

            </div>

          </td>

          <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">
            ${getPlanetAU(planet)}
          </td>

          <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">
            ${diameter ? formatNumber(diameter, 0) : "N/A"}
          </td>

          <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">
            ${mass ? formatNumber(earthMass, 3) : "N/A"}
          </td>

          <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">
            ${getPlanetOrbitalPeriod(planet)}
          </td>

          <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">
            ${getPlanetMoons(planet)}
          </td>

          <td class="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">

            <span class="px-2 py-1 rounded text-xs ${
              type === "Gas Giant"
                ? "bg-purple-500/50 text-purple-200"
                : type === "Ice Giant"
                ? "bg-blue-500/50 text-blue-200"
                : "bg-orange-500/50 text-orange-200"
            }">
              ${type}
            </span>

          </td>

        </tr>
      `;
    })
    .join("");
}

async function loadPlanets() {
  const grid = getElement("planets-grid");

  try {
    const data = await getJSON(PLANETS_API);

    // Support different response formats
    if (Array.isArray(data)) {
      planetsData = data;
    } else if (Array.isArray(data.bodies)) {
      planetsData = data.bodies;
    } else if (Array.isArray(data.planets)) {
      planetsData = data.planets;
    } else if (Array.isArray(data.results)) {
      planetsData = data.results;
    } else {
      throw new Error("Unexpected planets API response.");
    }

    // Keep only the eight main planets
    const mainPlanets = [
      "mercury",
      "venus",
      "earth",
      "mars",
      "jupiter",
      "saturn",
      "uranus",
      "neptune"
    ];

    planetsData = planetsData.filter(planet =>
      mainPlanets.includes(getPlanetId(planet))
    );

    createPlanetCards();
    createComparisonTable();

    // Show Earth details when the page first loads
    const earth = planetsData.find(
      planet => getPlanetId(planet) === "earth"
    );

    if (earth) {
      showPlanetDetails(earth);
    } else if (planetsData.length > 0) {
      showPlanetDetails(planetsData[0]);
    }

  } catch (error) {
    console.error("Planets API Error:", error);

    if (grid) {
      grid.innerHTML = `
        <p class="col-span-full text-center text-red-400 py-6">
          Unable to load planets data. Please check the API connection.
        </p>
      `;
    }
  }
}

function showSection(sectionName) {
  document.querySelectorAll(".app-section").forEach(section => {
    section.classList.add("hidden");
  });

  const selectedSection = getElement(sectionName);

  if (selectedSection) {
    selectedSection.classList.remove("hidden");
  }

  document.querySelectorAll(".nav-link").forEach(link => {
    const isActive = link.dataset.section === sectionName;

    link.classList.toggle(
      "bg-blue-500/10",
      isActive
    );

    link.classList.toggle(
      "text-blue-400",
      isActive
    );

    link.classList.toggle(
      "text-slate-300",
      !isActive
    );
  });

  // Close mobile sidebar after selecting a section
  const sidebar = getElement("sidebar");

  if (sidebar) {
    sidebar.classList.remove("sidebar-open");
  }
}

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();

    const sectionName = link.dataset.section;

    if (sectionName) {
      showSection(sectionName);
    }
  });
});

// Mobile sidebar button
getElement("sidebar-toggle")?.addEventListener("click", () => {
  const sidebar = getElement("sidebar");

  if (sidebar) {
    sidebar.classList.toggle("sidebar-open");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];

  const dateInput = getElement("apod-date-input");

  if (dateInput) {
    dateInput.max = today;
    dateInput.value = today;
  }

  loadAPOD(today);
  loadLaunches();
  loadPlanets();

  showSection("today-in-space");
});