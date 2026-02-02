/**
 * RSU Islam Group Slideshow - TV Display Script
 * Handles slide cycling, stats tracking, and display settings
 */

const API_BASE = '/api';
const PLACEHOLDER = '/assets/placeholder.png';

// Global state
let slides = [];
let currentIndex = 0;
let intervalMs = 8000;
let timer = null;
let settings = {};

/**
 * Initialize slideshow on page load
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎬 RSU Islam Slideshow initializing...');

  await loadSettings();
  await loadSlides();

  if (slides.length === 0) {
    showPlaceholder();
    console.warn('No slides available');
    return;
  }

  applySettings();
  showSlide(currentIndex);
  startAutoPlay();

  console.log(`✓ Slideshow started with ${slides.length} slides`);
});

/**
 * Load application settings from API
 */
async function loadSettings() {
  try {
    const response = await fetch(`${API_BASE}/slideshows/public/active`);

    // Try to get settings (public endpoint may not have this)
    try {
      const settingsResponse = await fetch(`${API_BASE}/settings`);
      if (settingsResponse.ok) {
        settings = await settingsResponse.json();
      }
    } catch (e) {
      // Use defaults if settings endpoint requires auth
      settings = {
        font_family: 'Inter, system-ui, sans-serif',
        title_font_size: '48',
        desc_font_size: '24',
        slide_interval_ms: '8000',
        logo_url: '/assets/logo-sample.png',
        show_logo: 'false',
        logo_position: 'top-right'
      };
    }

    intervalMs = parseInt(settings.slide_interval_ms) || 8000;
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

/**
 * Load all active slides from API
 */
async function loadSlides() {
  try {
    const response = await fetch(`${API_BASE}/slideshows/public/active`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Flatten slides array and add slideshow info
    const slideshowsMap = new Map();
    data.slideshows.forEach(s => slideshowsMap.set(s.id, s));

    slides = data.slides
      .filter(s => s.is_active)
      .map(slide => ({
        ...slide,
        slideshow: slideshowsMap.get(slide.slideshow_id)
      }))
      .sort((a, b) => {
        // Sort by slideshow order, then slide order
        const slideshowOrder = a.slideshow.display_order - b.slideshow.display_order;
        if (slideshowOrder !== 0) return slideshowOrder;
        return a.display_order - b.display_order;
      });

    console.log(`Loaded ${slides.length} slides`);
  } catch (error) {
    console.error('Error loading slides:', error);
    slides = [];
  }
}

/**
 * Apply settings to slideshow elements
 */
function applySettings() {
  const root = document.documentElement;

  // Apply font settings
  if (settings.font_family) {
    root.style.setProperty('font-family', settings.font_family);
  }

  const titleEl = document.getElementById('slide-title');
  const descEl = document.getElementById('slide-description');

  if (titleEl && settings.title_font_size) {
    titleEl.style.fontSize = `${settings.title_font_size}px`;
  }

  if (descEl && settings.desc_font_size) {
    descEl.style.fontSize = `${settings.desc_font_size}px`;
  }

  // Show/hide logo
  const logoContainer = document.getElementById('company-logo');
  if (logoContainer) {
    const showLogo = settings.show_logo === 'true' || settings.show_logo === true;

    if (showLogo && settings.logo_url) {
      const logoImg = document.getElementById('logo-img');
      logoImg.src = settings.logo_url;

      // Remove old position classes
      logoContainer.className = 'company-logo';

      // Add new position
      const position = settings.logo_position || 'top-right';
      logoContainer.classList.add(position);

      logoContainer.style.display = 'block';
    } else {
      logoContainer.style.display = 'none';
    }
  }
}

/**
 * Render pagination dots
 */
function renderPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;

  container.innerHTML = '';

  slides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = 'pagination-dot';

    if (index === currentIndex) {
      dot.classList.add('active');
    }

    dot.addEventListener('click', () => {
      showSlide(index);
      resetTimer();
    });

    container.appendChild(dot);
  });
}

/**
 * Display a slide at given index
 */
async function showSlide(index) {
  if (!slides.length) return;

  currentIndex = index % slides.length;
  const slide = slides[currentIndex];

  const imgEl = document.getElementById('slide-image');
  const titleEl = document.getElementById('slide-title');
  const descEl = document.getElementById('slide-description');

  // Fade out current image
  imgEl.classList.remove('visible');

  // Wait for fade out
  await new Promise(resolve => setTimeout(resolve, 200));

  // Update content
  const imageSrc = slide.file_path || PLACEHOLDER;

  // Set up error handler for missing images
  imgEl.onerror = () => {
    console.warn(`Image failed to load: ${imageSrc}`);
    imgEl.src = PLACEHOLDER;
  };

  imgEl.src = imageSrc;

  titleEl.textContent = slide.title || slide.slideshow?.title || 'RSU Islam Group';
  descEl.textContent = slide.description || slide.slideshow?.description || '';

  // Fade in new image
  requestAnimationFrame(() => {
    imgEl.classList.add('visible');
  });

  renderPagination();

  // Track view stats (fire and forget)
  trackSlideView(slide.id);
}

/**
 * Send view tracking to API
 */
async function trackSlideView(slideId) {
  try {
    await fetch(`${API_BASE}/slideshows/public/slide-view/${slideId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Silently fail - don't interrupt slideshow
    console.warn('Failed to track slide view:', error);
  }
}

/**
 * Start automatic slide cycling
 */
function startAutoPlay() {
  if (timer) clearInterval(timer);

  timer = setInterval(() => {
    const nextIndex = (currentIndex + 1) % slides.length;
    showSlide(nextIndex);
  }, intervalMs);
}

/**
 * Reset timer (e.g., after manual navigation)
 */
function resetTimer() {
  startAutoPlay();
}

/**
 * Show placeholder when no slides available
 */
function showPlaceholder() {
  const imgEl = document.getElementById('slide-image');
  const titleEl = document.getElementById('slide-title');
  const descEl = document.getElementById('slide-description');

  imgEl.src = PLACEHOLDER;
  imgEl.classList.add('visible');
  titleEl.textContent = 'RSU Islam Group';
  descEl.textContent = 'Slideshow will start when slides are added';
}

/**
 * Handle keyboard navigation (optional)
 */
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') {
    const nextIndex = (currentIndex + 1) % slides.length;
    showSlide(nextIndex);
    resetTimer();
  } else if (e.key === 'ArrowLeft') {
    const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
    showSlide(prevIndex);
    resetTimer();
  } else if (e.key === 'r' || e.key === 'R') {
    // Reload slides
    location.reload();
  }
});
