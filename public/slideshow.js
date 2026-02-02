/* Slideshow Display JavaScript - FIXED VERSION */

let allSlides = [];
let currentIndex = 0;
let isPlaying = true;
let slideInterval = null;
let transitionDuration = 5000; // Default 5 seconds

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadSlides();
  setupControls();
  setupKeyboardNavigation();

  if (allSlides.length > 0) {
    showSlide(0);
    startAutoplay();

    // Increment display count for all active slideshows
    await incrementDisplayCounts();
  } else {
    showNoSlidesMessage();
  }

  // Try to enter fullscreen
  requestFullscreen();
});

// Load settings
async function loadSettings() {
  try {
    const response = await fetch('/api/settings', {
      credentials: 'same-origin'  // ✅ CRITICAL FIX
    });

    if (response.ok) {
      const settings = await response.json();
      transitionDuration = parseInt(settings.transition_duration) || 5000;

      // Apply font settings
      if (settings.font_family) {
        document.documentElement.style.setProperty('--font-family', settings.font_family);
      }
      if (settings.title_font_size) {
        document.documentElement.style.setProperty('--title-font-size', settings.title_font_size + 'px');
      }
      if (settings.description_font_size) {
        document.documentElement.style.setProperty('--description-font-size', settings.description_font_size + 'px');
      }
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

// Load slides from all active slideshows
async function loadSlides() {
  try {
    const response = await fetch('/api/slideshows/active', {
      credentials: 'same-origin'  // ✅ CRITICAL FIX
    });

    if (!response.ok) {
      throw new Error('Failed to fetch active slideshows');
    }

    const slideshows = await response.json();
    console.log('Loaded slideshows:', slideshows);

    // Collect all slides from all active slideshows
    for (const slideshow of slideshows) {
      try {
        const slidesResponse = await fetch(`/api/slideshows/${slideshow.id}`, {
          credentials: 'same-origin'  // ✅ CRITICAL FIX
        });

        if (slidesResponse.ok) {
          const data = await slidesResponse.json();
          if (data.slides && data.slides.length > 0) {
            allSlides = allSlides.concat(data.slides.map(slide => ({
              ...slide,
              slideshowTitle: slideshow.title
            })));
          }
        }
      } catch (error) {
        console.error(`Failed to load slides for slideshow ${slideshow.id}:`, error);
      }
    }

    console.log('Total slides loaded:', allSlides.length);

    // Update UI
    updateSlideCounter();
  } catch (error) {
    console.error('Failed to load slides:', error);
    showErrorMessage();
  }
}

// Increment display count for active slideshows
async function incrementDisplayCounts() {
  try {
    const response = await fetch('/api/slideshows/active', {
      credentials: 'same-origin'  // ✅ CRITICAL FIX
    });

    if (response.ok) {
      const slideshows = await response.json();

      for (const slideshow of slideshows) {
        fetch(`/api/slideshows/${slideshow.id}/increment`, {
          method: 'POST',
          credentials: 'same-origin'  // ✅ CRITICAL FIX
        }).catch(err => console.error('Failed to increment display count:', err));
      }
    }
  } catch (error) {
    console.error('Failed to increment display counts:', error);
  }
}

// Show slide
function showSlide(index) {
  if (allSlides.length === 0) return;

  currentIndex = (index + allSlides.length) % allSlides.length;
  const slide = allSlides[currentIndex];

  const container = document.getElementById('slideshow-container');
  const imageUrl = slide.image_path || slide.image_url;

  container.innerHTML = `
    <div class="slide active">
      <img src="${imageUrl}" alt="${escapeHtml(slide.title)}" class="slide-image">
      <div class="slide-content">
        <h1 class="slide-title">${escapeHtml(slide.title)}</h1>
        ${slide.description ? `<p class="slide-description">${escapeHtml(slide.description)}</p>` : ''}
        ${slide.slideshowTitle ? `<p class="slideshow-title">${escapeHtml(slide.slideshowTitle)}</p>` : ''}
      </div>
    </div>
  `;

  updateSlideCounter();
}

// Navigation
function nextSlide() {
  showSlide(currentIndex + 1);
  resetAutoplay();
}

function prevSlide() {
  showSlide(currentIndex - 1);
  resetAutoplay();
}

// Autoplay
function startAutoplay() {
  if (slideInterval) clearInterval(slideInterval);

  slideInterval = setInterval(() => {
    if (isPlaying && allSlides.length > 0) {
      nextSlide();
    }
  }, transitionDuration);
}

function stopAutoplay() {
  if (slideInterval) {
    clearInterval(slideInterval);
    slideInterval = null;
  }
}

function resetAutoplay() {
  if (isPlaying) {
    stopAutoplay();
    startAutoplay();
  }
}

function togglePlayPause() {
  isPlaying = !isPlaying;

  const btn = document.getElementById('playPauseBtn');
  if (isPlaying) {
    btn.textContent = '⏸ Pause';
    startAutoplay();
  } else {
    btn.textContent = '▶ Play';
    stopAutoplay();
  }
}

// Controls
function setupControls() {
  document.getElementById('prevBtn').addEventListener('click', prevSlide);
  document.getElementById('nextBtn').addEventListener('click', nextSlide);
  document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
}

function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowLeft':
        prevSlide();
        break;
      case 'ArrowRight':
        nextSlide();
        break;
      case ' ':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
      case 'Escape':
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        break;
    }
  });
}

// UI Updates
function updateSlideCounter() {
  const current = document.getElementById('currentSlide');
  const total = document.getElementById('totalSlides');

  if (current) current.textContent = allSlides.length > 0 ? currentIndex + 1 : 0;
  if (total) total.textContent = allSlides.length;
}

function showNoSlidesMessage() {
  const container = document.getElementById('slideshow-container');
  container.innerHTML = `
    <div class="no-slides-message">
      <h1>No Active Slideshows</h1>
      <p>Please create a slideshow and add slides in the admin panel.</p>
      <p style="margin-top: 20px; font-size: 18px;">
        <a href="/admin" style="color: #667eea; text-decoration: underline;">Go to Admin Panel</a>
      </p>
    </div>
  `;

  // Hide controls
  document.querySelector('.controls').style.display = 'none';
  document.querySelector('.slide-counter').style.display = 'none';
}

function showErrorMessage() {
  const container = document.getElementById('slideshow-container');
  container.innerHTML = `
    <div class="no-slides-message">
      <h1>Error Loading Slideshows</h1>
      <p>Unable to load slideshows. Please check your connection and try again.</p>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
        Reload Page
      </button>
    </div>
  `;
}

// Fullscreen
function requestFullscreen() {
  const elem = document.documentElement;

  if (elem.requestFullscreen) {
    elem.requestFullscreen().catch(err => {
      console.log('Fullscreen request failed:', err);
    });
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

// Utility
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle visibility changes (pause when tab not visible)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAutoplay();
  } else if (isPlaying) {
    startAutoplay();
  }
});
