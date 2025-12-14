// OMDB API Configuration
const OMDB_API_KEY = 'd7436166';
const OMDB_BASE_URL = 'https://www.omdbapi.com';

// Global Variables
let currentPage = 1;
let currentSearchTerm = '';
let totalResults = 0;
let totalPages = 0;
let favorites = (function () {
    try {
        return JSON.parse(localStorage.getItem('movieFavorites')) || [];
    } catch (e) {
        console.warn('Gagal parse movieFavorites dari localStorage, inisialisasi ulang.', e);
        return [];
    }
})();
let searchHistory = (function () {
    try {
        return JSON.parse(localStorage.getItem('searchHistory')) || [];
    } catch (e) {
        console.warn('Gagal parse searchHistory dari localStorage, inisialisasi ulang.', e);
        return [];
    }
})();
let isGridView = true;
let currentView = 'search'; // 'search', 'favorites'

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchButton = document.getElementById('searchButton');
const favoriteButton = document.getElementById('favoriteButton');
const historyButton = document.getElementById('historyButton');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const movieContainer = document.getElementById('movieContainer');
const welcomeMessage = document.getElementById('welcomeMessage');
const sectionTitle = document.getElementById('sectionTitle');
const gridView = document.getElementById('gridView');
const listView = document.getElementById('listView');
const pagination = document.getElementById('pagination');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

// Modal Elements
const movieModal = document.getElementById('movieModal');
const closeModal = document.getElementById('closeModal');
const modalPoster = document.getElementById('modalPoster');
const modalTitle = document.getElementById('modalTitle');
const modalYear = document.getElementById('modalYear');
const modalDuration = document.getElementById('modalDuration');
const modalRating = document.getElementById('modalRating');
const modalDescription = document.getElementById('modalDescription');
const modalGenre = document.getElementById('modalGenre');
const modalDirector = document.getElementById('modalDirector');
const modalActors = document.getElementById('modalActors');
const favoriteToggle = document.getElementById('favoriteToggle');

// History Modal Elements
const historyModal = document.getElementById('historyModal');
const closeHistoryModal = document.getElementById('closeHistoryModal');
const historyList = document.getElementById('historyList');
const clearHistory = document.getElementById('clearHistory');

// Initialize App
function initializeApp() {
    console.log('Initializing Movie Search App...');
    setupEventListeners();
    updateFavoriteButtonBadge();
    // show welcome on start
    if (welcomeMessage) welcomeMessage.classList.remove('hidden');
}

// Event Listeners
function setupEventListeners() {
    // Search functionality
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    // Action buttons
    if (searchButton) searchButton.addEventListener('click', showSearchView);
    if (favoriteButton) favoriteButton.addEventListener('click', showFavoritesView);
    if (historyButton) historyButton.addEventListener('click', showHistoryModal);

    // View toggle
    if (gridView) gridView.addEventListener('click', function () {
        setViewMode('grid');
    });
    if (listView) listView.addEventListener('click', function () {
        setViewMode('list');
    });

    // Pagination
    if (prevPage) prevPage.addEventListener('click', function () {
        if (currentPage > 1) {
            currentPage--;
            if (currentView === 'search') {
                performSearch(currentSearchTerm, currentPage);
            } else if (currentView === 'favorites') {
                showFavoritesView();
            }
        }
    });

    if (nextPage) nextPage.addEventListener('click', function () {
        if (currentPage < totalPages) {
            currentPage++;
            if (currentView === 'search') {
                performSearch(currentSearchTerm, currentPage);
            } else if (currentView === 'favorites') {
                showFavoritesView();
            }
        }
    });

    // Modal close
    if (closeModal) closeModal.addEventListener('click', closeMovieModal);
    if (closeHistoryModal) closeHistoryModal.addEventListener('click', closeHistoryModalFunc);

    // Close modal when clicking outside
    if (movieModal) {
        movieModal.addEventListener('click', function (e) {
            if (e.target === movieModal) {
                closeMovieModal();
            }
        });
    }

    if (historyModal) {
        historyModal.addEventListener('click', function (e) {
            if (e.target === historyModal) {
                closeHistoryModalFunc();
            }
        });
    }

    // Favorite toggle
    if (favoriteToggle) favoriteToggle.addEventListener('click', toggleFavorite);

    // Clear history
    if (clearHistory) clearHistory.addEventListener('click', clearSearchHistory);

    // Escape key to close modals
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeMovieModal();
            closeHistoryModalFunc();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function (e) {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }

        // Ctrl/Cmd + F to show favorites
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            showFavoritesView();
        }

        // Ctrl/Cmd + H to show history
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            showHistoryModal();
        }
    });
}

// Search Functions
function handleSearch() {
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
        showError('Masukkan kata kunci pencarian');
        return;
    }

    currentSearchTerm = searchTerm;
    currentPage = 1;
    currentView = 'search';

    // Add to search history
    addToSearchHistory(searchTerm);

    // Perform search
    performSearch(searchTerm, 1);
}

function performSearch(searchTerm, page = 1) {
    console.log(`Searching for: ${searchTerm}, Page: ${page}`);

    showLoading();
    hideError();
    hideWelcomeMessage();

    // Use OMDB_API_KEY (tidak hardcode)
    const apiUrl = `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(searchTerm)}&page=${page}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            hideLoading();

            if (data.Response === 'True') {
                totalResults = parseInt(data.totalResults, 10);
                totalPages = Math.ceil(totalResults / 10); // OMDB returns 10 results per page

                displayMovies(data.Search);
                updatePagination();
                updateSectionTitle(`HASIL PENCARIAN "${searchTerm}"`);
            } else {
                showError(data.Error || 'Tidak ada film yang ditemukan');
                movieContainer.innerHTML = '';
                hidePagination();
            }
        })
        .catch(error => {
            console.error('Search error:', error);
            hideLoading();
            showError('Terjadi kesalahan saat mencari film');
        });
}

// Display Functions
function displayMovies(movies) {
    if (!movies || movies.length === 0) {
        movieContainer.innerHTML = '<p class="text-center">Tidak ada film yang ditemukan</p>';
        return;
    }

    const viewClass = isGridView ? 'movie-grid' : 'movie-list';
    movieContainer.className = viewClass;

    movieContainer.innerHTML = movies.map(movie => createMovieCard(movie)).join('');

    // Add click event listeners to movie cards
    const movieCards = movieContainer.querySelectorAll('.movie-card');
    movieCards.forEach((card, index) => {
        const viewButton = card.querySelector('.view-detail-btn');
        if (viewButton) {
            viewButton.addEventListener('click', function (e) {
                e.stopPropagation();
                showMovieDetails(movies[index].imdbID);
            });
        }

        card.addEventListener('click', function () {
            showMovieDetails(movies[index].imdbID);
        });
    });
}

function createMovieCard(movie) {
    const isFavorite = favorites.some(fav => fav.imdbID === movie.imdbID);
    const listViewClass = isGridView ? '' : 'list-view';
    const posterSrc = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : '';

    return `
        <div class="movie-card ${listViewClass}" data-imdb-id="${movie.imdbID}">
            <div class="movie-poster">
                ${posterSrc ?
            `<img src="${posterSrc}" alt="${escapeHtml(movie.Title)}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-film\\'></i>'">` :
            '<i class="fas fa-film"></i>'
        }
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${escapeHtml(movie.Title)}</h3>
                <div class="movie-rating">
                    <i class="fas fa-calendar"></i>
                    ${escapeHtml(movie.Year)}
                </div>
                <p class="movie-description">
                    ${movie.Type ? (movie.Type.charAt(0).toUpperCase() + movie.Type.slice(1)) : ''} • ${escapeHtml(movie.Year)}
                    ${isFavorite ? ' • <i class="fas fa-heart" style="color: #FF6B6B;"></i> Favorit' : ''}
                </p>
                <button class="view-detail-btn">
                    <i class="fas fa-info-circle"></i>
                    View Detail
                </button>
            </div>
        </div>
    `;
}

// Movie Details Modal
function showMovieDetails(imdbID) {
    if (!imdbID) return;
    console.log(`Fetching details for: ${imdbID}`);

    const apiUrl = `${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&i=${encodeURIComponent(imdbID)}&plot=full`;

    showLoading();

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            hideLoading();

            if (data.Response === 'True') {
                populateModal(data);
                showModal();
            } else {
                showError(data.Error || 'Tidak dapat memuat detail film');
            }
        })
        .catch(error => {
            console.error('Detail fetch error:', error);
            hideLoading();
            showError('Terjadi kesalahan saat memuat detail film');
        });
}

function populateModal(movieData) {
    modalTitle.textContent = movieData.Title || 'N/A';
    modalYear.textContent = movieData.Year || 'N/A';
    modalDuration.textContent = (movieData.Runtime && movieData.Runtime !== 'N/A') ? movieData.Runtime : 'N/A';
    modalRating.textContent = (movieData.imdbRating && movieData.imdbRating !== 'N/A') ? `⭐ ${movieData.imdbRating}` : 'N/A';
    modalDescription.textContent = movieData.Plot && movieData.Plot !== 'N/A' ? movieData.Plot : 'Deskripsi tidak tersedia';
    modalGenre.textContent = movieData.Genre && movieData.Genre !== 'N/A' ? movieData.Genre : 'N/A';
    modalDirector.textContent = movieData.Director && movieData.Director !== 'N/A' ? movieData.Director : 'N/A';
    modalActors.textContent = movieData.Actors && movieData.Actors !== 'N/A' ? movieData.Actors : 'N/A';

    // Set poster
    if (movieData.Poster && movieData.Poster !== 'N/A') {
        modalPoster.src = movieData.Poster;
        modalPoster.alt = movieData.Title;
    } else {
        modalPoster.src = '';
        modalPoster.alt = 'No poster available';
    }

    // Update favorite button
    const isFavorite = favorites.some(fav => fav.imdbID === movieData.imdbID);
    favoriteToggle.className = isFavorite ? 'favorite-btn active' : 'favorite-btn';
    favoriteToggle.dataset.imdbId = movieData.imdbID;
    favoriteToggle.dataset.movieData = JSON.stringify(movieData);
}

function showModal() {
    movieModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeMovieModal() {
    movieModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Favorites Functions
function toggleFavorite() {
    const imdbID = favoriteToggle.dataset.imdbId;
    let movieData = {};
    try {
        movieData = JSON.parse(favoriteToggle.dataset.movieData);
    } catch (e) {
        console.warn('Gagal parse movieData dari tombol favoriteToggle', e);
    }

    const existingIndex = favorites.findIndex(fav => fav.imdbID === imdbID);

    if (existingIndex !== -1) {
        // Remove from favorites
        favorites.splice(existingIndex, 1);
        favoriteToggle.classList.remove('active');
        console.log('Removed from favorites:', movieData.Title);
    } else {
        // Add to favorites
        favorites.push({
            imdbID: imdbID,
            Title: movieData.Title || 'Unknown',
            Year: movieData.Year || 'N/A',
            Poster: movieData.Poster || '',
            Type: movieData.Type || '',
            addedDate: new Date().toISOString()
        });
        favoriteToggle.classList.add('active');
        console.log('Added to favorites:', movieData.Title);
    }

    // Save to localStorage
    localStorage.setItem('movieFavorites', JSON.stringify(favorites));
    updateFavoriteButtonBadge();

    // Refresh current view if showing favorites
    if (currentView === 'favorites') {
        showFavoritesView();
    }
}

function showFavoritesView() {
    currentView = 'favorites';
    currentPage = 1;

    if (favorites.length === 0) {
        movieContainer.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-heart"></i>
                <h3>Belum Ada Film Favorit</h3>
                <p>Film yang Anda tandai sebagai favorit akan muncul di sini</p>
            </div>
        `;
        hidePagination();
        updateSectionTitle('FILM FAVORIT');
        return;
    }

    // Pagination for favorites
    const itemsPerPage = 10;
    totalResults = favorites.length;
    totalPages = Math.ceil(totalResults / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFavorites = favorites.slice(startIndex, endIndex);

    displayMovies(paginatedFavorites);
    updatePagination();
    updateSectionTitle('FILM FAVORIT');
    hideWelcomeMessage();
}

function updateFavoriteButtonBadge() {
    const count = favorites.length;
    const button = favoriteButton;

    if (!button) return;

    // Remove existing badge
    const existingBadge = button.querySelector('.badge-count');
    if (existingBadge) {
        existingBadge.remove();
    }

    // Add new badge if there are favorites
    if (count > 0) {
        const badge = document.createElement('span');
        badge.className = 'badge-count';
        badge.textContent = count;
        badge.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background: #FF6B6B;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 0.7rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        `;
        button.style.position = 'relative';
        button.appendChild(badge);
    }
}

// Search History Functions
function addToSearchHistory(searchTerm) {
    // Remove if already exists
    searchHistory = searchHistory.filter(item => item.term !== searchTerm);

    // Add to beginning
    searchHistory.unshift({
        term: searchTerm,
        date: new Date().toISOString(),
        timestamp: Date.now()
    });

    // Keep only last 20 searches
    searchHistory = searchHistory.slice(0, 20);

    // Save to localStorage
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
}

function showHistoryModal() {
    populateHistoryList();
    historyModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeHistoryModalFunc() {
    historyModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function populateHistoryList() {
    if (searchHistory.length === 0) {
        historyList.innerHTML = `
            <div class="text-center" style="padding: 40px; color: var(--text-muted);">
                <i class="fas fa-history" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p>Belum ada riwayat pencarian</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = searchHistory.map((item, index) => `
        <div class="history-item" data-term="${escapeHtml(item.term)}">
            <div>
                <div class="history-item-text">${escapeHtml(item.term)}</div>
                <div class="history-item-date">${formatDate(item.date)}</div>
            </div>
            <button class="history-item-remove" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    // Add event listeners
    const historyItems = historyList.querySelectorAll('.history-item');
    historyItems.forEach(item => {
        item.addEventListener('click', function (e) {
            if (!e.target.closest('.history-item-remove')) {
                const term = this.dataset.term;
                searchInput.value = term;
                closeHistoryModalFunc();
                handleSearch();
            }
        });
    });

    const removeButtons = historyList.querySelectorAll('.history-item-remove');
    removeButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            const index = parseInt(this.dataset.index, 10);
            removeHistoryItem(index);
        });
    });
}

function removeHistoryItem(index) {
    searchHistory.splice(index, 1);
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    populateHistoryList();
}

function clearSearchHistory() {
    if (confirm('Yakin ingin menghapus semua riwayat pencarian?')) {
        searchHistory = [];
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        populateHistoryList();
    }
}

// View Functions
function showSearchView() {
    currentView = 'search';

    if (currentSearchTerm) {
        performSearch(currentSearchTerm, currentPage);
    } else {
        movieContainer.innerHTML = '';
        showWelcomeMessage();
        updateSectionTitle('MOVIE LIST');
        hidePagination();
    }
}

function setViewMode(mode) {
    isGridView = mode === 'grid';

    // Update button states
    if (gridView) gridView.classList.toggle('active', isGridView);
    if (listView) listView.classList.toggle('active', !isGridView);

    // Update container class
    const viewClass = isGridView ? 'movie-grid' : 'movie-list';
    movieContainer.className = viewClass;

    // Update existing movie cards
    const movieCards = movieContainer.querySelectorAll('.movie-card');
    movieCards.forEach(card => {
        if (isGridView) {
            card.classList.remove('list-view');
        } else {
            card.classList.add('list-view');
        }
    });
}

// Utility Functions
function showLoading() {
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    if (loadingSpinner) loadingSpinner.classList.add('hidden');
}

function showError(message) {
    if (!errorMessage || !errorText) return;
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    if (!errorMessage) return;
    errorMessage.classList.add('hidden');
}

function showWelcomeMessage() {
    if (welcomeMessage) welcomeMessage.classList.remove('hidden');
}

function hideWelcomeMessage() {
    if (welcomeMessage) {
        welcomeMessage.classList.add('hidden');
    }
}

function updateSectionTitle(title) {
    if (sectionTitle) sectionTitle.textContent = title;
}

function updatePagination() {
    if (totalPages <= 1) {
        hidePagination();
        return;
    }

    if (pagination) pagination.classList.remove('hidden');
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    if (prevPage) prevPage.disabled = currentPage === 1;
    if (nextPage) nextPage.disabled = currentPage === totalPages;
}

function hidePagination() {
    if (pagination) pagination.classList.add('hidden');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        return 'Hari ini';
    } else if (diffDays === 2) {
        return 'Kemarin';
    } else if (diffDays <= 7) {
        return `${diffDays - 1} hari lalu`;
    } else {
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
}

// Small helper to avoid XSS when injecting text into templates
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Service Worker Registration (Optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js')
            .then(function (registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function (registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Handle online/offline status
window.addEventListener('online', function () {
    hideError();
    console.log('Back online');
});

window.addEventListener('offline', function () {
    showError('Tidak ada koneksi internet');
    console.log('Gone offline');
});
