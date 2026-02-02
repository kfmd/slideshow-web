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
        const payload = JSON.parse(atob(this.token.split('.')));
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
