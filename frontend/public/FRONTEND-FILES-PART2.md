# FRONTEND FILES - Part 2 (JavaScript & CSS)

## FILE 4: frontend/public/css/admin.css
**Purpose**: Additional styles for admin panel

```css
/* Alpine.js cloak utility */
[x-cloak] { 
  display: none !important; 
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #1f2937;
}

::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Smooth transitions */
* {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Focus states */
input:focus, textarea:focus, select:focus {
  outline: none;
  ring: 2px;
}

/* Loading spinner */
.loading-spinner {
  border: 3px solid #f3f4f6;
  border-top: 3px solid #16a34a;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Toast notification */
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast.success {
  border-left: 4px solid #16a34a;
}

.toast.error {
  border-left: 4px solid #dc2626;
}
```

---

## FILE 5: frontend/public/js/slideshow.js
**Purpose**: TV Slideshow Logic (separate JavaScript file)

```javascript
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
```

---

## FILE 6: frontend/public/js/admin.js
**Purpose**: Admin Panel Logic (Alpine.js app)

```javascript
/**
 * RSU Islam Group Slideshow - Admin Panel
 * Alpine.js Application State and Methods
 */

function adminApp() {
  const API = '/api';

  return {
    // Auth state
    token: null,
    userEmail: null,
    userRole: null,
    
    // UI state
    tab: 'slideshows',
    mobileMenuOpen: false,
    showNotifications: false,
    brokenImagesCount: 0,

    // Login form
    loginEmail: '',
    loginPassword: '',

    // Data
    slideshows: [],
    selectedSlideshow: null,
    slides: [],
    stats: {},
    settings: {},
    users: [],

    // Forms
    newSlideTitle: '',
    newSlideDesc: '',
    newSlideUrl: '',
    newSlideFiles: [],

    /**
     * Initialize app on mount
     */
    init() {
      // Load saved token
      const saved = localStorage.getItem('rsu_token');
      if (saved) {
        this.token = saved;
        this.loadUserData();
        this.fetchSlideshows();
        this.fetchStats();
        this.fetchSettings();
        if (this.userRole === 'admin') {
          this.fetchUsers();
        }
      }
    },

    /**
     * Get current tab title
     */
    tabTitle() {
      if (!this.token) return 'Sign In';
      const titles = {
        slideshows: 'Slideshow Management',
        stats: 'Statistics Dashboard',
        settings: 'Display Settings',
        users: 'User Management'
      };
      return titles[this.tab] || 'Admin Panel';
    },

    /**
     * Login user
     */
    async login() {
      try {
        const response = await fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: this.loginEmail,
            password: this.loginPassword
          })
        });

        if (!response.ok) {
          const error = await response.json();
          alert(error.message || 'Login failed');
          return;
        }

        const data = await response.json();
        this.token = data.token;
        this.userEmail = data.user.email;
        this.userRole = data.user.role;
        
        localStorage.setItem('rsu_token', this.token);

        this.fetchSlideshows();
        this.fetchStats();
        this.fetchSettings();
        
        if (this.userRole === 'admin') {
          this.fetchUsers();
        }

        this.showToast('Login successful', 'success');
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
      }
    },

    /**
     * Load user data from token
     */
    loadUserData() {
      try {
        const payload = JSON.parse(atob(this.token.split('.')[1]));
        this.userEmail = payload.email;
        this.userRole = payload.role;
      } catch (e) {
        this.logout();
      }
    },

    /**
     * Logout user
     */
    logout() {
      this.token = null;
      this.userEmail = null;
      this.userRole = null;
      localStorage.removeItem('rsu_token');
      this.tab = 'slideshows';
    },

    /**
     * Fetch all slideshows
     */
    async fetchSlideshows() {
      try {
        const response = await fetch(`${API}/slideshows`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch');

        this.slideshows = await response.json();
      } catch (error) {
        console.error('Error fetching slideshows:', error);
      }
    },

    /**
     * Select slideshow and load its slides
     */
    async selectSlideshow(slideshow) {
      this.selectedSlideshow = slideshow;
      
      try {
        const response = await fetch(`${API}/slideshows/${slideshow.id}/slides`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch slides');

        this.slides = await response.json();
        this.brokenImagesCount = 0; // Reset broken images counter
      } catch (error) {
        console.error('Error fetching slides:', error);
      }
    },

    /**
     * Toggle slideshow active status
     */
    async toggleSlideshowActive(slideshow) {
      try {
        const response = await fetch(`${API}/slideshows/${slideshow.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`
          },
          body: JSON.stringify({ is_active: !slideshow.is_active })
        });

        if (!response.ok) throw new Error('Failed to update');

        const updated = await response.json();
        slideshow.is_active = updated.is_active;
        
        this.showToast(
          `Slideshow ${updated.is_active ? 'activated' : 'deactivated'}`,
          'success'
        );
      } catch (error) {
        console.error('Error toggling slideshow:', error);
        alert('Failed to update slideshow status');
      }
    },

    /**
     * Open new slideshow modal
     */
    openNewSlideshowModal() {
      const title = prompt('Enter slideshow title:');
      if (!title) return;

      const description = prompt('Enter description (optional):') || '';
      const folderName = prompt('Enter folder name (lowercase, hyphens only):', 
        title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      
      if (!folderName) return;

      this.createSlideshow(title, description, folderName);
    },

    /**
     * Create new slideshow
     */
    async createSlideshow(title, description, folderName) {
      try {
        const response = await fetch(`${API}/slideshows`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`
          },
          body: JSON.stringify({ title, description, folder_name: folderName })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create');
        }

        const slideshow = await response.json();
        this.slideshows.unshift(slideshow);
        
        this.showToast('Slideshow created successfully', 'success');
      } catch (error) {
        console.error('Error creating slideshow:', error);
        alert(error.message || 'Failed to create slideshow');
      }
    },

    /**
     * Handle file input change
     */
    handleFileChange(event) {
      this.newSlideFiles = Array.from(event.target.files);
    },

    /**
     * Upload slides (multiple files or URL)
     */
    async uploadSlides() {
      if (!this.selectedSlideshow) {
        alert('Please select a slideshow first');
        return;
      }

      try {
        const formData = new FormData();
        
        // Add metadata
        if (this.newSlideTitle) formData.append('title', this.newSlideTitle);
        if (this.newSlideDesc) formData.append('description', this.newSlideDesc);

        // Add files if selected
        if (this.newSlideFiles.length > 0) {
          this.newSlideFiles.forEach(file => {
            formData.append('images', file);
          });

          const response = await fetch(
            `${API}/slideshows/${this.selectedSlideshow.id}/slides`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${this.token}` },
              body: formData
            }
          );

          if (!response.ok) throw new Error('Upload failed');

          this.showToast(`Uploaded ${this.newSlideFiles.length} slide(s)`, 'success');
        }
        // Add URL-based slide
        else if (this.newSlideUrl) {
          const response = await fetch(
            `${API}/slideshows/${this.selectedSlideshow.id}/slides`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.token}`
              },
              body: JSON.stringify({
                title: this.newSlideTitle,
                description: this.newSlideDesc,
                file_url: this.newSlideUrl
              })
            }
          );

          if (!response.ok) throw new Error('Failed to add slide');

          this.showToast('Slide added successfully', 'success');
        } else {
          alert('Please select files or enter an image URL');
          return;
        }

        // Reset form
        this.newSlideTitle = '';
        this.newSlideDesc = '';
        this.newSlideUrl = '';
        this.newSlideFiles = [];

        // Reload slides
        await this.selectSlideshow(this.selectedSlideshow);
        
      } catch (error) {
        console.error('Error uploading slides:', error);
        alert('Failed to upload slides');
      }
    },

    /**
     * Toggle slide active status
     */
    async toggleSlideActive(slide) {
      try {
        const response = await fetch(`${API}/slideshows/slide/${slide.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`
          },
          body: JSON.stringify({ is_active: !slide.is_active })
        });

        if (!response.ok) throw new Error('Failed to update');

        const updated = await response.json();
        slide.is_active = updated.is_active;
      } catch (error) {
        console.error('Error toggling slide:', error);
      }
    },

    /**
     * Update slide display order
     */
    async updateSlideOrder(slide, newOrder) {
      try {
        const order = parseInt(newOrder) || 0;

        const response = await fetch(`${API}/slideshows/slide/${slide.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`
          },
          body: JSON.stringify({ display_order: order })
        });

        if (!response.ok) throw new Error('Failed to update');

        slide.display_order = order;
        
        // Re-sort slides
        this.slides.sort((a, b) => a.display_order - b.display_order);
      } catch (error) {
        console.error('Error updating slide order:', error);
      }
    },

    /**
     * Delete a slide
     */
    async deleteSlide(slideId) {
      if (!confirm('Are you sure you want to delete this slide?')) return;

      try {
        const response = await fetch(`${API}/slideshows/slide/${slideId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${this.token}` }
        });

        if (!response.ok) throw new Error('Failed to delete');

        this.slides = this.slides.filter(s => s.id !== slideId);
        this.showToast('Slide deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting slide:', error);
        alert('Failed to delete slide');
      }
    },

    /**
     * Track broken image in preview
     */
    notifyBrokenImage() {
      this.brokenImagesCount++;
    },

    /**
     * Fetch statistics
     */
    async fetchStats() {
      try {
        const response = await fetch(`${API}/stats`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch');

        this.stats = await response.json();
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    },

    /**
     * Fetch settings
     */
    async fetchSettings() {
      try {
        const response = await fetch(`${API}/settings`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch');

        this.settings = await response.json();
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    },

    /**
     * Save settings
     */
    async saveSettings() {
      try {
        const response = await fetch(`${API}/settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`
          },
          body: JSON.stringify(this.settings)
        });

        if (!response.ok) throw new Error('Failed to save');

        this.showToast('Settings saved successfully', 'success');
      } catch (error) {
        console.error('Error saving settings:', error);
        alert('Failed to save settings');
      }
    },

    /**
     * Fetch users (admin only)
     */
    async fetchUsers() {
      try {
        const response = await fetch(`${API}/users`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch');

        this.users = await response.json();
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    },

    /**
     * Open new user modal
     */
    openNewUserModal() {
      const email = prompt('Enter email address:');
      if (!email) return;

      const password = prompt('Enter password (min 8 characters):');
      if (!password || password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
      }

      const fullName = prompt('Enter full name (optional):') || '';
      const role = confirm('Admin user?') ? 'admin' : 'user';

      this.createUser(email, password, fullName, role);
    },

    /**
     * Create new user
     */
    async createUser(email, password, fullName, role) {
      try {
        const response = await fetch(`${API}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`
          },
          body: JSON.stringify({ email, password, full_name: fullName, role })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create');
        }

        const user = await response.json();
        this.users.unshift(user);
        
        this.showToast('User created successfully', 'success');
      } catch (error) {
        console.error('Error creating user:', error);
        alert(error.message || 'Failed to create user');
      }
    },

    /**
     * Toggle user active status
     */
    async toggleUserStatus(user) {
      try {
        const response = await fetch(`${API}/users/${user.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`
          },
          body: JSON.stringify({ is_active: !user.is_active })
        });

        if (!response.ok) throw new Error('Failed to update');

        const updated = await response.json();
        user.is_active = updated.is_active;
        
        this.showToast(
          `User ${updated.is_active ? 'activated' : 'deactivated'}`,
          'success'
        );
      } catch (error) {
        console.error('Error updating user:', error);
        alert('Failed to update user status');
      }
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.remove();
      }, 3000);
    }
  };
}
```

---

## Sample Images Setup

Create placeholder images and sample images in these locations:

### frontend/public/assets/placeholder.png
Use any gray placeholder image (800x600px recommended)

### frontend/public/assets/logo-sample.png  
Use your RSU Islam logo (transparent PNG, 200x200px recommended)

### frontend/public/assets/sample/laser-hemorrhidoplasty/
- lh1.jpg (medical equipment image)
- lh2.jpg (doctor consultation image)
- lh3.jpg (facility image)

### frontend/public/assets/sample/emergency-services/
- er1.jpg (emergency room image)
- er2.jpg (ambulance or medical staff)
- er3.jpg (medical equipment)

You can use free medical stock photos from:
- Unsplash: https://unsplash.com/s/photos/hospital
- Pexels: https://www.pexels.com/search/medical/
- Pixabay: https://pixabay.com/images/search/hospital/

Or create simple colored rectangles as placeholders for testing.

---

## Complete File Checklist

✅ docker-compose.yml
✅ .env.example
✅ backend/Dockerfile
✅ backend/package.json
✅ backend/.dockerignore
✅ backend/src/server.js
✅ backend/src/db.js
✅ backend/src/db-init.sql
✅ backend/src/seed.sql
✅ backend/src/middleware/authMiddleware.js
✅ backend/src/routes/auth.js
✅ backend/src/routes/users.js
✅ backend/src/routes/slideshows.js
✅ backend/src/routes/stats.js
✅ backend/src/routes/settings.js
✅ frontend/public/index.html
✅ frontend/public/admin.html
✅ frontend/public/css/slideshow.css
✅ frontend/public/css/admin.css
✅ frontend/public/js/slideshow.js
✅ frontend/public/js/admin.js
✅ frontend/public/assets/ (placeholder.png, logo-sample.png, sample images)
