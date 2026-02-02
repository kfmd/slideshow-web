/* Admin Panel JavaScript - FIXED VERSION */
let currentUser = null;
let currentView = 'dashboard';
let allSlideshows = [];
let allUsers = [];
let stats = null;
let settings = null;
let currentSlideshowId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  await loadInitialData();
  setupEventListeners();
  showView('dashboard');
});

// Authentication
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      console.log('Not authenticated, redirecting to login');
      window.location.href = '/';
      return;
    }
    
    currentUser = await response.json();
    
    // Update UI - check if element exists before setting
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl) {
      userInfoEl.textContent = `${currentUser.username} (${currentUser.role})`;
    }
    
    // Hide admin-only features for regular users
    if (currentUser.role !== 'admin') {
      const usersNav = document.querySelector('[data-view="users"]');
      const settingsNav = document.querySelector('[data-view="settings"]');
      if (usersNav) usersNav.style.display = 'none';
      if (settingsNav) settingsNav.style.display = 'none';
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = '/';
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin'
    });
    window.location.href = '/';
  } catch (error) {
    console.error('Logout failed:', error);
    window.location.href = '/';
  }
}

// Data Loading
async function loadInitialData() {
  await Promise.all([
    loadStats(),
    loadSlideshows(),
    loadSettings(),
    currentUser.role === 'admin' ? loadUsers() : Promise.resolve()
  ]);
}

async function loadStats() {
  try {
    const response = await fetch('/api/stats', {
      credentials: 'same-origin'
    });
    stats = await response.json();
    renderStats();
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

async function loadSlideshows() {
  try {
    const response = await fetch('/api/slideshows', {
      credentials: 'same-origin'
    });
    allSlideshows = await response.json();
    renderSlideshows();
  } catch (error) {
    console.error('Failed to load slideshows:', error);
    showError('Failed to load slideshows');
  }
}

async function loadUsers() {
  try {
    const response = await fetch('/api/users', {
      credentials: 'same-origin'
    });
    allUsers = await response.json();
    renderUsers();
  } catch (error) {
    console.error('Failed to load users:', error);
  }
}

async function loadSettings() {
  try {
    const response = await fetch('/api/settings', {
      credentials: 'same-origin'
    });
    settings = await response.json();
    renderSettings();
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

// Event Listeners
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const view = e.currentTarget.dataset.view;
      showView(view);
    });
  });

  // Forms
  const createSlideshowForm = document.getElementById('createSlideshowForm');
  if (createSlideshowForm) {
    createSlideshowForm.addEventListener('submit', handleCreateSlideshow);
  }

  const addSlidesForm = document.getElementById('addSlidesForm');
  if (addSlidesForm) {
    addSlidesForm.addEventListener('submit', handleAddSlides);
  }

  const createUserForm = document.getElementById('createUserForm');
  if (createUserForm) {
    createUserForm.addEventListener('submit', handleCreateUser);
  }

  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', handleUpdateSettings);
  }
}

// View Management
function showView(viewName) {
  currentView = viewName;

  // Update navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.view === viewName) {
      item.classList.add('active');
    }
  });

  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.style.display = 'none';
  });

  // Show selected view
  const selectedView = document.getElementById(`${viewName}View`);
  if (selectedView) {
    selectedView.style.display = 'block';
  }
}

// Render Functions
function renderStats() {
  if (!stats) return;

  const updates = {
    'totalSlideshows': stats.total_slideshows || 0,
    'activeSlideshows': stats.active_slideshows || 0,
    'totalDisplays': stats.total_displays || 0,
    'totalSlides': stats.total_slides || 0
  };

  Object.entries(updates).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

function renderSlideshows() {
  const tbody = document.querySelector('#slideshowsTable tbody');
  if (!tbody) return;

  if (allSlideshows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No slideshows yet. Create your first one!</td></tr>';
    return;
  }

  tbody.innerHTML = allSlideshows.map(s => `
    <tr>
      <td>${escapeHtml(s.title)}</td>
      <td><span class="status ${s.status}">${s.status}</span></td>
      <td>${s.slide_count || 0}</td>
      <td>${s.display_count || 0}</td>
      <td>${new Date(s.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="manageSlides('${s.id}')">Manage Slides</button>
        <button class="btn btn-sm btn-secondary" onclick="editSlideshow('${s.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteSlideshow('${s.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderUsers() {
  const tbody = document.querySelector('#usersTable tbody');
  if (!tbody) return;

  if (allUsers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px;">No users found.</td></tr>';
    return;
  }

  tbody.innerHTML = allUsers.map(u => `
    <tr>
      <td>${escapeHtml(u.username)}</td>
      <td><span class="status ${u.role}">${u.role}</span></td>
      <td>${new Date(u.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="editUser('${u.id}')">Edit</button>
        ${u.username !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}')">Delete</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function renderSettings() {
  if (!settings) return;

  const fields = {
    'font_family': settings.font_family || 'Arial, sans-serif',
    'title_font_size': settings.title_font_size || '48',
    'description_font_size': settings.description_font_size || '24',
    'transition_duration': settings.transition_duration || '5000'
  };

  Object.entries(fields).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
}

// Modal Functions
function showCreateSlideshow() {
  openModal('createSlideshowModal');
}

function showCreateUser() {
  openModal('createUserModal');
}

function showAddSlides() {
  openModal('addSlidesModal');
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    // Reset form
    const form = modal.querySelector('form');
    if (form) form.reset();
  }
}

// Close modal on background click
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
};

// Slideshow Functions
async function handleCreateSlideshow(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  try {
    const response = await fetch('/api/slideshows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData)),
      credentials: 'same-origin'
    });

    if (response.ok) {
      await loadSlideshows();
      await loadStats();
      closeModal('createSlideshowModal');
      showSuccess('Slideshow created successfully!');
    } else {
      const data = await response.json();
      showError(data.error || 'Failed to create slideshow');
    }
  } catch (error) {
    console.error('Create slideshow error:', error);
    showError('Failed to create slideshow');
  }
}

async function manageSlides(slideshowId) {
  currentSlideshowId = slideshowId;
  
  try {
    const response = await fetch(`/api/slideshows/${slideshowId}`, {
      credentials: 'same-origin'
    });
    const slideshow = await response.json();
    
    renderSlides(slideshow.slides || []);
    openModal('manageSlidesModal');
  } catch (error) {
    console.error('Load slides error:', error);
    showError('Failed to load slides');
  }
}

function renderSlides(slides) {
  const container = document.getElementById('slidesContainer');
  if (!container) return;

  if (slides.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 40px;">No slides yet. Add some!</p>';
    return;
  }

  container.innerHTML = slides.map(slide => `
    <div class="slide-card">
      <img src="${slide.image_path || slide.image_url}" alt="${escapeHtml(slide.title)}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">
      <h4>${escapeHtml(slide.title)}</h4>
      <p>${escapeHtml(slide.description || '')}</p>
      <button class="btn btn-sm btn-danger" onclick="deleteSlide('${slide.id}')">Delete</button>
    </div>
  `).join('');
}

async function handleAddSlides(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  formData.append('slideshow_id', currentSlideshowId);

  try {
    const response = await fetch('/api/slides', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });

    if (response.ok) {
      await manageSlides(currentSlideshowId);
      await loadSlideshows();
      await loadStats();
      closeModal('addSlidesModal');
      showSuccess('Slides added successfully!');
    } else {
      const data = await response.json();
      showError(data.error || 'Failed to add slides');
    }
  } catch (error) {
    console.error('Add slides error:', error);
    showError('Failed to add slides');
  }
}

async function deleteSlide(slideId) {
  if (!confirm('Are you sure you want to delete this slide?')) return;

  try {
    const response = await fetch(`/api/slides/${slideId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });

    if (response.ok) {
      await manageSlides(currentSlideshowId);
      await loadSlideshows();
      await loadStats();
      showSuccess('Slide deleted successfully!');
    } else {
      showError('Failed to delete slide');
    }
  } catch (error) {
    console.error('Delete slide error:', error);
    showError('Failed to delete slide');
  }
}

async function deleteSlideshow(slideshowId) {
  if (!confirm('Are you sure you want to delete this slideshow and all its slides?')) return;

  try {
    const response = await fetch(`/api/slideshows/${slideshowId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });

    if (response.ok) {
      await loadSlideshows();
      await loadStats();
      showSuccess('Slideshow deleted successfully!');
    } else {
      showError('Failed to delete slideshow');
    }
  } catch (error) {
    console.error('Delete slideshow error:', error);
    showError('Failed to delete slideshow');
  }
}

// User Functions
async function handleCreateUser(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData)),
      credentials: 'same-origin'
    });

    if (response.ok) {
      await loadUsers();
      closeModal('createUserModal');
      showSuccess('User created successfully!');
    } else {
      const data = await response.json();
      showError(data.error || 'Failed to create user');
    }
  } catch (error) {
    console.error('Create user error:', error);
    showError('Failed to create user');
  }
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) return;

  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });

    if (response.ok) {
      await loadUsers();
      showSuccess('User deleted successfully!');
    } else {
      showError('Failed to delete user');
    }
  } catch (error) {
    console.error('Delete user error:', error);
    showError('Failed to delete user');
  }
}

// Settings Functions
async function handleUpdateSettings(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  try {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData)),
      credentials: 'same-origin'
    });

    if (response.ok) {
      await loadSettings();
      showSuccess('Settings updated successfully!');
    } else {
      showError('Failed to update settings');
    }
  } catch (error) {
    console.error('Update settings error:', error);
    showError('Failed to update settings');
  }
}

async function uploadLogo() {
  const fileInput = document.getElementById('logoFile');
  if (!fileInput.files || !fileInput.files[0]) {
    showError('Please select a logo file');
    return;
  }

  const formData = new FormData();
  formData.append('logo', fileInput.files[0]);

  try {
    const response = await fetch('/api/settings/logo', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });

    if (response.ok) {
      showSuccess('Logo uploaded successfully!');
      fileInput.value = '';
    } else {
      showError('Failed to upload logo');
    }
  } catch (error) {
    console.error('Upload logo error:', error);
    showError('Failed to upload logo');
  }
}

// Utility Functions
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showSuccess(message) {
  alert('✅ ' + message);
}

function showError(message) {
  alert('❌ ' + message);
}

// Edit functions (stubs - implement as needed)
function editSlideshow(id) {
  // TODO: Implement edit functionality
  alert('Edit functionality coming soon!');
}

function editUser(id) {
  // TODO: Implement edit functionality
  alert('Edit functionality coming soon!');
}
