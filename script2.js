/* =========================================================
   SHARKY MOVIES 2 - SCRIPT
   ========================================================= */

/* -----------------------------
   CONFIG
----------------------------- */

const API_KEY = "47745852f22c21e3362f4907231538e1";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const BACKDROP_URL = "https://image.tmdb.org/t/p/original";

const PLACEHOLDER_POSTER =
  "https://via.placeholder.com/500x750/111111/ffffff?text=No+Poster";

const PLACEHOLDER_BACKDROP =
  "https://via.placeholder.com/1280x720/080808/ffffff?text=Sharky+Movies+2";

/*
  Add your own legal movie embed provider here later.

  Example shape:
  return `https://your-legal-provider.com/embed/movie/${movie.id}`;

  For now it returns an empty string, so the player shows a placeholder.
*/
function getMovieEmbedUrl(movie) {
  return "";
}

/* -----------------------------
   DOM ELEMENTS
----------------------------- */

const navbar = document.getElementById("navbar");

const searchInput = document.getElementById("searchInput");
const searchSection = document.getElementById("searchSection");
const searchGrid = document.getElementById("searchGrid");
const searchTitle = document.getElementById("searchTitle");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const rowsSection = document.getElementById("rowsSection");

const heroBanner = document.getElementById("heroBanner");
const heroTitle = document.getElementById("heroTitle");
const heroMeta = document.getElementById("heroMeta");
const heroDesc = document.getElementById("heroDesc");
const heroPlayBtn = document.getElementById("heroPlayBtn");
const heroListBtn = document.getElementById("heroListBtn");

const detailsModal = document.getElementById("detailsModal");
const detailsBackdrop = document.getElementById("detailsBackdrop");
const detailsCloseBtn = document.getElementById("detailsCloseBtn");
const detailsHero = document.getElementById("detailsHero");
const detailsTitle = document.getElementById("detailsTitle");
const detailsMeta = document.getElementById("detailsMeta");
const detailsPoster = document.getElementById("detailsPoster");
const detailsOverview = document.getElementById("detailsOverview");
const detailsExtra = document.getElementById("detailsExtra");
const detailsPlayBtn = document.getElementById("detailsPlayBtn");
const detailsTrailerBtn = document.getElementById("detailsTrailerBtn");
const detailsListBtn = document.getElementById("detailsListBtn");

const playerModal = document.getElementById("playerModal");
const playerCloseBtn = document.getElementById("playerCloseBtn");
const playerTitle = document.getElementById("playerTitle");
const videoPlayer = document.getElementById("videoPlayer");
const playerPlaceholder = document.getElementById("playerPlaceholder");

const rowMap = {
  trending: document.getElementById("trendingRow"),
  popular: document.getElementById("popularRow"),
  topRated: document.getElementById("topRatedRow"),
  action: document.getElementById("actionRow"),
  horror: document.getElementById("horrorRow"),
  comedy: document.getElementById("comedyRow"),
  recent: document.getElementById("recentRow"),
  myList: document.getElementById("myListRow")
};

const myListBlock = document.getElementById("myListBlock");

/* -----------------------------
   STATE
----------------------------- */

let currentDetailsMovie = null;
let searchTimer = null;

const STORAGE_KEY = "sharky_movies_2_my_list";

/* -----------------------------
   API HELPERS
----------------------------- */

async function fetchTMDB(endpoint) {
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${BASE_URL}${endpoint}${separator}api_key=${API_KEY}&language=en-US`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TMDB error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function getMovies(endpoint) {
  const data = await fetchTMDB(endpoint);
  return data?.results || [];
}

async function getMovieDetails(movieId) {
  return await fetchTMDB(
    `/movie/${movieId}?append_to_response=videos,credits`
  );
}

async function searchMovies(query) {
  const safeQuery = encodeURIComponent(query.trim());
  const data = await fetchTMDB(`/search/movie?query=${safeQuery}`);
  return data?.results || [];
}

/* -----------------------------
   FORMAT HELPERS
----------------------------- */

function getYear(movie) {
  const date = movie.release_date || movie.first_air_date || "";
  return date ? date.slice(0, 4) : "N/A";
}

function getRating(movie) {
  const rating = Number(movie.vote_average || 0);
  return rating > 0 ? rating.toFixed(1) : "N/A";
}

function getPoster(movie) {
  return movie.poster_path ? `${IMG_URL}${movie.poster_path}` : PLACEHOLDER_POSTER;
}

function getBackdrop(movie) {
  return movie.backdrop_path
    ? `${BACKDROP_URL}${movie.backdrop_path}`
    : PLACEHOLDER_BACKDROP;
}

function truncate(text, length = 160) {
  if (!text) return "No overview available.";
  return text.length > length ? `${text.slice(0, length).trim()}...` : text;
}

function getRuntimeText(minutes) {
  if (!minutes) return "Runtime unknown";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours <= 0) return `${mins}m`;

  return `${hours}h ${mins}m`;
}

function getGenreText(movie) {
  if (!movie.genres || movie.genres.length === 0) return "Movie";
  return movie.genres.slice(0, 3).map((genre) => genre.name).join(" • ");
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -----------------------------
   SKELETON LOADING
----------------------------- */

function showSkeletonRow(rowElement, count = 10) {
  rowElement.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton-card";
    rowElement.appendChild(skeleton);
  }
}

function showSkeletonGrid(gridElement, count = 12) {
  gridElement.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton-card";
    gridElement.appendChild(skeleton);
  }
}

/* -----------------------------
   MOVIE CARDS
----------------------------- */

function createMovieCard(movie) {
  const title = movie.title || movie.name || "Untitled";
  const poster = getPoster(movie);
  const year = getYear(movie);
  const rating = getRating(movie);

  const card = document.createElement("article");
  card.className = "movie-card";

  card.innerHTML = `
    <img src="${poster}" alt="${escapeHTML(title)} poster" loading="lazy">

    <div class="card-overlay">
      <h3 class="card-title">${escapeHTML(title)}</h3>

      <div class="card-meta">
        <span class="card-rating">★ ${rating}</span>
        <span>${year}</span>
        <span>HD</span>
      </div>

      <div class="card-play">View Details</div>
    </div>
  `;

  card.addEventListener("click", () => openDetailsModal(movie.id));

  return card;
}

function renderMovieRow(rowElement, movies) {
  rowElement.innerHTML = "";

  if (!movies || movies.length === 0) {
    rowElement.innerHTML = `<p class="empty-message">No movies found.</p>`;
    return;
  }

  movies
    .filter((movie) => movie.poster_path)
    .forEach((movie) => {
      rowElement.appendChild(createMovieCard(movie));
    });
}

function renderSearchResults(movies, query) {
  searchTitle.textContent = `Search Results for "${query}"`;
  searchGrid.innerHTML = "";

  if (!movies || movies.length === 0) {
    searchGrid.innerHTML = `<p class="empty-message">No movies found.</p>`;
    return;
  }

  movies
    .filter((movie) => movie.poster_path)
    .forEach((movie) => {
      searchGrid.appendChild(createMovieCard(movie));
    });
}

/* -----------------------------
   HERO
----------------------------- */

function setHero(movie) {
  if (!movie) return;

  const title = movie.title || "Sharky Movies 2";
  const backdrop = getBackdrop(movie);
  const year = getYear(movie);
  const rating = getRating(movie);

  heroBanner.style.backgroundImage = `url("${backdrop}")`;
  heroTitle.textContent = title;
  heroDesc.textContent = truncate(movie.overview, 180);

  heroMeta.innerHTML = `
    <span>${year}</span>
    <span>HD</span>
    <span>★ ${rating}</span>
    <span>Movie</span>
  `;

  heroPlayBtn.style.display = "inline-block";
  heroListBtn.style.display = "inline-block";

  heroPlayBtn.onclick = () => openPlayer(movie);
  heroListBtn.onclick = () => toggleMyList(movie, heroListBtn);
  updateListButton(heroListBtn, movie);
}

/* -----------------------------
   DETAILS MODAL
----------------------------- */

async function openDetailsModal(movieId) {
  const movie = await getMovieDetails(movieId);

  if (!movie) {
    alert("Could not load movie details.");
    return;
  }

  currentDetailsMovie = movie;

  const title = movie.title || "Untitled";
  const backdrop = getBackdrop(movie);
  const poster = getPoster(movie);

  detailsHero.style.backgroundImage = `url("${backdrop}")`;
  detailsTitle.textContent = title;
  detailsPoster.src = poster;
  detailsPoster.alt = `${title} poster`;
  detailsOverview.textContent = movie.overview || "No overview available.";

  detailsMeta.innerHTML = `
    <span>${getYear(movie)}</span>
    <span>HD</span>
    <span>★ ${getRating(movie)}</span>
    <span>${getRuntimeText(movie.runtime)}</span>
  `;

  const genres = getGenreText(movie);
  const tagline = movie.tagline ? `"${movie.tagline}"` : "";
  detailsExtra.textContent = `${genres}${tagline ? ` • ${tagline}` : ""}`;

  detailsPlayBtn.onclick = () => openPlayer(movie);
  detailsTrailerBtn.onclick = () => openTrailer(movie);
  detailsListBtn.onclick = () => toggleMyList(movie, detailsListBtn);

  updateListButton(detailsListBtn, movie);

  detailsModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeDetailsModal() {
  detailsModal.classList.remove("active");
  document.body.style.overflow = "";
}

detailsCloseBtn.addEventListener("click", closeDetailsModal);
detailsBackdrop.addEventListener("click", closeDetailsModal);

/* -----------------------------
   PLAYER MODAL
----------------------------- */

function openPlayer(movie) {
  const title = movie.title || "Movie";
  const embedUrl = getMovieEmbedUrl(movie);

  playerTitle.textContent = title;
  playerModal.classList.add("active");
  document.body.style.overflow = "hidden";

  if (embedUrl) {
    videoPlayer.src = embedUrl;
    videoPlayer.style.display = "block";
    playerPlaceholder.style.display = "none";
  } else {
    videoPlayer.src = "";
    videoPlayer.style.display = "none";
    playerPlaceholder.style.display = "grid";
  }
}

function closePlayer() {
  videoPlayer.src = "";
  playerModal.classList.remove("active");
  document.body.style.overflow = "";

  if (detailsModal.classList.contains("active")) {
    document.body.style.overflow = "hidden";
  }
}

playerCloseBtn.addEventListener("click", closePlayer);

playerModal.addEventListener("click", (event) => {
  if (event.target === playerModal) {
    closePlayer();
  }
});

/* -----------------------------
   TRAILER
----------------------------- */

function openTrailer(movie) {
  const videos = movie.videos?.results || [];

  const trailer =
    videos.find(
      (video) =>
        video.site === "YouTube" &&
        video.type === "Trailer" &&
        video.key
    ) ||
    videos.find(
      (video) =>
        video.site === "YouTube" &&
        video.key
    );

  if (!trailer) {
    alert("No trailer found for this movie.");
    return;
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
  window.open(youtubeUrl, "_blank", "noopener,noreferrer");
}

/* -----------------------------
   MY LIST
----------------------------- */

function getMyList() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveMyList(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function isInMyList(movieId) {
  return getMyList().some((movie) => Number(movie.id) === Number(movieId));
}

function toggleMyList(movie, button) {
  const list = getMyList();
  const exists = isInMyList(movie.id);

  let updatedList;

  if (exists) {
    updatedList = list.filter((item) => Number(item.id) !== Number(movie.id));
  } else {
    updatedList = [
      ...list,
      {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        overview: movie.overview
      }
    ];
  }

  saveMyList(updatedList);
  updateListButton(button, movie);
  renderMyList();
}

function updateListButton(button, movie) {
  if (!button || !movie) return;

  button.textContent = isInMyList(movie.id) ? "✓ In My List" : "+ My List";
}

function renderMyList() {
  const list = getMyList();

  if (list.length === 0) {
    myListBlock.classList.add("hidden");
    rowMap.myList.innerHTML = "";
    return;
  }

  myListBlock.classList.remove("hidden");
  renderMovieRow(rowMap.myList, list);
}

/* -----------------------------
   SEARCH
----------------------------- */

async function handleSearch() {
  const query = searchInput.value.trim();

  if (query.length < 3) {
    searchSection.classList.add("hidden");
    rowsSection.classList.remove("hidden");
    searchGrid.innerHTML = "";
    return;
  }

  rowsSection.classList.add("hidden");
  searchSection.classList.remove("hidden");

  showSkeletonGrid(searchGrid, 12);

  const results = await searchMovies(query);
  renderSearchResults(results, query);
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(handleSearch, 350);
});

clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  searchSection.classList.add("hidden");
  rowsSection.classList.remove("hidden");
  searchGrid.innerHTML = "";
});

/* -----------------------------
   NAVIGATION
----------------------------- */

document.querySelectorAll(".nav-link").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    const section = button.dataset.section;

    if (section === "mylist") {
      renderMyList();
      myListBlock.classList.remove("hidden");
      myListBlock.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (section === "trending") {
      rowMap.trending.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (section === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    rowsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

/* -----------------------------
   EVENTS
----------------------------- */

window.addEventListener("scroll", () => {
  if (window.scrollY > 40) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePlayer();
    closeDetailsModal();
  }
});

/* -----------------------------
   INIT
----------------------------- */

async function init() {
  Object.values(rowMap).forEach((row) => {
    if (row) showSkeletonRow(row, 10);
  });

  const [
    trending,
    popular,
    topRated,
    action,
    horror,
    comedy,
    recent
  ] = await Promise.all([
    getMovies("/trending/movie/week"),
    getMovies("/movie/popular"),
    getMovies("/movie/top_rated"),
    getMovies("/discover/movie?with_genres=28&sort_by=popularity.desc"),
    getMovies("/discover/movie?with_genres=27&sort_by=popularity.desc"),
    getMovies("/discover/movie?with_genres=35&sort_by=popularity.desc"),
    getMovies("/movie/now_playing")
  ]);

  renderMovieRow(rowMap.trending, trending);
  renderMovieRow(rowMap.popular, popular);
  renderMovieRow(rowMap.topRated, topRated);
  renderMovieRow(rowMap.action, action);
  renderMovieRow(rowMap.horror, horror);
  renderMovieRow(rowMap.comedy, comedy);
  renderMovieRow(rowMap.recent, recent);

  renderMyList();

  if (trending.length > 0) {
    setHero(trending[0]);
  }
}

init();
