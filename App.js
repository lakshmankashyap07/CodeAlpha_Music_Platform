// --- LIVE CLOUD DATABASE ---
const initialTracks = [
    {
        title: "Lost in the City",
        artist: "Lo-Fi Beats",
        src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500"
    },
    {
        title: "Neon Horizon",
        artist: "Synthwave Engine",
        src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500"
    },
    {
        title: "Retro Ambient Wave",
        artist: "Cyber Punk Lab",
        src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500"
    }
];

let playlist = [...initialTracks];
let historyPlaylist = [];
let currentTrackIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let currentUser = null;

// --- DOM REGISTRY NODES ---
const audio = document.getElementById('audio-element');
const playBtn = document.getElementById('btn-play');
const prevBtn = document.getElementById('btn-prev');
const nextBtn = document.getElementById('btn-next');
const shuffleBtn = document.getElementById('btn-shuffle');
const repeatBtn = document.getElementById('btn-repeat');

const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volumeSlider = document.getElementById('volume-slider');
const volumeIcon = document.getElementById('volume-icon');

const currentCover = document.getElementById('current-cover');
const currentTitle = document.getElementById('current-title');
const currentArtist = document.getElementById('current-artist');

const playlistContainer = document.getElementById('playlist-container');
const historyContainer = document.getElementById('history-container');
const historyBlock = document.getElementById('history-block');
const searchInput = document.getElementById('search-songs');

// Modal Connectors
const authTriggerBtn = document.getElementById('btn-auth-trigger');
const authModal = document.getElementById('auth-modal');
const closeAuth = document.getElementById('close-auth');
const authFormSubmit = document.getElementById('auth-form-submit');

const uploadBtn = document.getElementById('btn-upload-modal');
const uploadModal = document.getElementById('upload-modal');
const closeUpload = document.getElementById('close-upload');
const uploadForm = document.getElementById('upload-form');
const uploadLinkInput = document.getElementById('upload-link');
const uploadLyricsTextarea = document.getElementById('upload-lyrics');
const fetchLyricsBtn = document.getElementById('btn-fetch-lyrics');

const toggleLyricsBtn = document.getElementById('btn-toggle-lyrics');
const currentLyricsDiv = document.getElementById('current-lyrics');

// By default hide upload button until user logs in
if(uploadBtn) uploadBtn.style.display = 'none';

// --- CONTROLLER LOOPS ---
function loadTrack(index) {
    if(playlist.length === 0) return;
    currentTrackIndex = index;
    const track = playlist[currentTrackIndex];
    
    audio.src = track.src;
    currentTitle.innerText = track.title;
    currentArtist.innerText = track.artist;
    currentCover.src = track.cover;

    // display lyrics if available
    if(typeof currentLyricsDiv !== 'undefined' && currentLyricsDiv) {
        currentLyricsDiv.innerText = track.lyrics || 'Lyrics not available for this track.';
        if(track.lyrics && track.lyrics.trim().length > 0) {
            toggleLyricsBtn.style.display = 'inline-block';
            toggleLyricsBtn.disabled = false;
            toggleLyricsBtn.innerText = 'Show Lyrics';
            currentLyricsDiv.style.display = 'none';
        } else {
            toggleLyricsBtn.style.display = 'none';
            currentLyricsDiv.style.display = 'none';
        }
    }

    updateHighlights();
    
    // Save Tracking History if logged in
    if(currentUser) {
        pushToHistory(track);
    }
}

function playTrack() {
    isPlaying = true;
    playBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
    audio.play().catch(() => {});
}

function pauseTrack() {
    isPlaying = false;
    playBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
    audio.pause();
}

function togglePlay() { if(isPlaying) pauseTrack(); else playTrack(); }

function nextTrack() {
    if (isShuffle) {
        currentTrackIndex = Math.floor(Math.random() * playlist.length);
    } else {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    }
    loadTrack(currentTrackIndex);
    playTrack();
}

function prevTrack() {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    playTrack();
}

// --- RENDERING VIEWS & SEARCH FILTERS ---
function renderPlaylist(tracksToRender = playlist) {
    playlistContainer.innerHTML = '';
    if(tracksToRender.length === 0) {
        playlistContainer.innerHTML = `<p style="font-size:0.85rem;color:#b3b3b3;padding:10px;">No songs found.</p>`;
        return;
    }
    tracksToRender.forEach((track) => {
        const originalIndex = playlist.findIndex(t => t.src === track.src);
        
        const item = document.createElement('div');
        item.className = `playlist-item ${originalIndex === currentTrackIndex ? 'active-track' : ''}`;
        item.innerHTML = `
            <img src="${track.cover}" alt="cover">
            <div class="playlist-meta">
                <h4>${track.title}</h4>
                <p>${track.artist}</p>
            </div>
        `;
        item.addEventListener('click', () => {
            loadTrack(originalIndex);
            playTrack();
        });
        playlistContainer.appendChild(item);
    });
}

searchInput.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase().trim();
    const filteredTracks = playlist.filter(track => 
        track.title.toLowerCase().includes(query) || 
        track.artist.toLowerCase().includes(query)
    );
    renderPlaylist(filteredTracks);
});

// --- HISTORIC QUEUE MANAGER ---
function pushToHistory(track) {
    historyPlaylist = historyPlaylist.filter(t => t.src !== track.src);
    historyPlaylist.unshift(track);
    if(historyPlaylist.length > 5) historyPlaylist.pop();
    renderHistory();
}

function renderHistory() {
    historyContainer.innerHTML = '';
    historyPlaylist.forEach((track) => {
        const originalIndex = playlist.findIndex(t => t.src === track.src);
        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.innerHTML = `
            <img src="${track.cover}" alt="cover">
            <div class="playlist-meta">
                <h4>${track.title}</h4>
                <p>${track.artist}</p>
            </div>
        `;
        item.addEventListener('click', () => {
            if(originalIndex !== -1) {
                loadTrack(originalIndex);
                playTrack();
            }
        });
        historyContainer.appendChild(item);
    });
}

function updateHighlights() {
    const items = document.querySelectorAll('#playlist-container .playlist-item');
    items.forEach((item, index) => {
        if(index === currentTrackIndex) item.classList.add('active-track');
        else item.classList.remove('active-track');
    });
}

// --- LOGIN SYSTEM WITH USERNAME & PASSWORD ---
authTriggerBtn.addEventListener('click', () => {
    if(currentUser) {
        // Logout
        currentUser = null;
        historyPlaylist = [];
        historyBlock.style.display = 'none';
        authTriggerBtn.innerHTML = `<i class="fa-solid fa-user"></i> Login`;
        authTriggerBtn.style.background = 'white';
        authTriggerBtn.style.color = 'black';
        pauseTrack();
        alert("Logged out successfully!");
        if(uploadBtn) uploadBtn.style.display = 'none';
    } else {
        authModal.style.display = 'flex';
    }
});

authFormSubmit.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;

    if(username.length < 3 || password.length < 3) {
        alert("Username and password must be at least 3 characters");
        return;
    }

    currentUser = { username, loginTime: new Date() };
    // mark admin only if exact admin password is provided
    // hardcoded admin credentials: username: admin, password: admin123
    currentUser.isAdmin = (username.toLowerCase() === 'admin' && password === 'admin123');
    authModal.style.display = 'none';
    authFormSubmit.reset();

    // Update UI
    authTriggerBtn.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> Logout`;
    authTriggerBtn.style.background = '#1db954';
    authTriggerBtn.style.color = 'white';
    
    historyBlock.style.display = 'block';
    renderHistory();
    // show upload button for any logged-in user (upload action still restricted to admins)
    if(uploadBtn) uploadBtn.style.display = 'inline-block';
    alert(`Welcome ${username}! Happy listening! 🎵`);
});

// Modal Close Events
closeAuth.addEventListener('click', () => authModal.style.display = 'none');
closeUpload.addEventListener('click', () => uploadModal.style.display = 'none');
// Upload button click handler: require admin password if user isn't admin
if(uploadBtn) {
    uploadBtn.addEventListener('click', () => {
        if(!currentUser) {
            alert('Please login first to upload songs.');
            authModal.style.display = 'flex';
            return;
        }
        if(!currentUser.isAdmin) {
            const attempt = prompt('Enter admin password to allow upload:');
            if(attempt === null) return; // user cancelled
            if(attempt === 'admin123') {
                currentUser.isAdmin = true;
                alert('Admin access granted. You may now upload.');
                uploadModal.style.display = 'flex';
                return;
            } else {
                alert('Incorrect admin password. Upload denied.');
                return;
            }
        }
        uploadModal.style.display = 'flex';
    });
}
window.addEventListener('click', (e) => {
    if(e.target === authModal) authModal.style.display = 'none';
    if(e.target === uploadModal) uploadModal.style.display = 'none';
});

// --- FILE UPLOAD HANDLER ---
uploadForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('upload-title').value;
    const artist = document.getElementById('upload-artist').value;
    const audioFile = document.getElementById('upload-audio').files[0];
    const coverFile = document.getElementById('upload-cover').files[0];
    const externalLink = (uploadLinkInput && uploadLinkInput.value) ? uploadLinkInput.value.trim() : '';
    const lyricsText = (uploadLyricsTextarea && uploadLyricsTextarea.value) ? uploadLyricsTextarea.value.trim() : '';
    // Accept either a local audio file or an external link (external link takes precedence)
    if(!audioFile && !externalLink) {
        alert("Please select an audio file or paste an external link");
        return;
    }

    // Use external link first if provided, else use uploaded file blob URL
    const audioUrl = externalLink || (audioFile ? URL.createObjectURL(audioFile) : '');
    
    // Create cover image - use uploaded image or default
    let coverUrl = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500";
    if(coverFile) {
        coverUrl = URL.createObjectURL(coverFile);
    }

    const newTrack = { 
        title, 
        artist, 
        src: audioUrl, 
        cover: coverUrl
    };
    if(lyricsText) newTrack.lyrics = lyricsText;
    
    playlist.push(newTrack);
    renderPlaylist();
    uploadForm.reset();
    uploadModal.style.display = 'none';
    // clear link and lyrics inputs if present
    if(uploadLinkInput) uploadLinkInput.value = '';
    if(uploadLyricsTextarea) uploadLyricsTextarea.value = '';
    
    loadTrack(playlist.length - 1);
    playTrack();
    alert(`🎵 "${title}" by ${artist} uploaded successfully!`);
});

// --- TRACK MONITOR OPERATIONS ---
function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    if (!duration) return;
    const progressPercent = (currentTime / duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
    currentTimeEl.innerText = formatTime(currentTime);
    durationEl.innerText = formatTime(duration);
}

function setProgressBar(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    if(duration) audio.currentTime = (clickX / width) * duration;
}

function formatTime(time) {
    const mins = Math.floor(time / 60); 
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

shuffleBtn.addEventListener('click', () => { isShuffle = !isShuffle; shuffleBtn.classList.toggle('active', isShuffle); });
repeatBtn.addEventListener('click', () => { isRepeat = !isRepeat; repeatBtn.classList.toggle('active', isRepeat); });
playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);
audio.addEventListener('timeupdate', updateProgress);
progressContainer.addEventListener('click', setProgressBar);
volumeSlider.addEventListener('input', () => audio.volume = volumeSlider.value);
audio.addEventListener('ended', () => { if(isRepeat) { audio.currentTime = 0; playTrack(); } else { nextTrack(); } });

// Initialize
loadTrack(currentTrackIndex);
renderPlaylist();

// Fetch lyrics using a public lyrics API (lyrics.ovh) when requested in upload modal
if(fetchLyricsBtn) {
    fetchLyricsBtn.addEventListener('click', async () => {
        const title = document.getElementById('upload-title').value.trim();
        const artist = document.getElementById('upload-artist').value.trim();
        if(!title || !artist) { alert('Please enter both Title and Artist to fetch lyrics'); return; }
        try {
            const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
            const data = await res.json();
            if(data && data.lyrics) {
                uploadLyricsTextarea.value = data.lyrics;
                alert('Lyrics fetched — you can edit before uploading.');
            } else {
                alert('Lyrics not found for this song.');
            }
        } catch (err) {
            alert('Failed to fetch lyrics. Try again or paste manually.');
        }
    });
}

// Toggle lyrics visibility in player
if(toggleLyricsBtn) {
    toggleLyricsBtn.addEventListener('click', () => {
        if(!currentLyricsDiv) return;
        if(currentLyricsDiv.style.display === 'none' || currentLyricsDiv.style.display === '') {
            currentLyricsDiv.style.display = 'block';
            toggleLyricsBtn.innerText = 'Hide Lyrics';
        } else {
            currentLyricsDiv.style.display = 'none';
            toggleLyricsBtn.innerText = 'Show Lyrics';
        }
    });
}