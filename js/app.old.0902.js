// RSU Islam Group Digital Signage - COMPLETE WORKING VERSION
const API_BASE = '';

const app = {
    currentUser: null,
    slideshows: [],
    users: [],
    settings: {
        slideshowTiming: 5,
        siteLogo: null,
        hospitalName: 'RSU Islam Group',
        hospitalTagline: 'Healthcare Excellence'
    },
    currentView: 'dashboard',
    selectedImages: [],     // For preview (base64 for display)
    selectedFiles: [],      // CRITICAL FIX: Actual File objects for upload
    deletedImageIds: [],    // NEW: Track which existing images to delete
    currentEditId: null,
    currentSlideIndex: 0,
    slideshowInterval: null,
    isPaused: false,
    chartInstance: null,
    chartPeriod: '24h',

    async init() {
        this.loadSettings();
        this.checkAuth();
    },

    checkAuth() {
        const storedUser = localStorage.getItem('rsu_current_user');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
            this.showAdminPanel();
        } else {
            this.showLoginPage();
        }
    },

    showLoginPage() {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('adminPanel').classList.add('hidden');
    },

    async showAdminPanel() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('adminPanel').classList.remove('hidden');
        document.getElementById('currentUserName').textContent = this.currentUser.fullName;
        
        if (this.currentUser.role === 'operator') {
            const addUserBtn = document.getElementById('addUserBtn');
            if (addUserBtn) addUserBtn.style.display = 'none';
        }
        
        await this.switchView('dashboard');
    },

    async login(username, password) {
        try {
            const response = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('rsu_current_user', JSON.stringify(data.user));
                this.showAdminPanel();
            } else {
                alert(data.message || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    },

    logout() {
        localStorage.removeItem('rsu_current_user');
        this.currentUser = null;
        this.showLoginPage();
    },

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        sidebar.classList.toggle('show');
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    },

    async switchView(view) {
        this.currentView = view;
        
        document.querySelectorAll('.sidebar-menu li').forEach(li => {
            li.classList.remove('active');
            if (li.getAttribute('onclick')?.includes(view)) {
                li.classList.add('active');
            }
        });

        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${view}Section`).classList.add('active');

        if (view === 'dashboard') {
            await this.updateDashboard();
            this.renderChart();
        } else if (view === 'slideshows') {
            await this.loadSlideshows();
            this.renderSlideshows();
        } else if (view === 'users') {
            await this.loadUsers();
            this.renderUsers();
        } else if (view === 'settings') {
            this.loadSettingsForm();
        }
    },

    async updateDashboard() {
        try {
            const response = await fetch(`${API_BASE}/api/dashboard/stats`);
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('activeSlidesCount').textContent = data.stats.activeSlides;
                document.getElementById('totalSlidesCount').textContent = data.stats.totalSlides;
                document.getElementById('totalUsersCount').textContent = data.stats.activeUsers;
                document.getElementById('totalDisplaysCount').textContent = data.stats.totalDisplays;
            }
        } catch (error) {
            console.error('Dashboard error:', error);
        }
    },

    renderChart() {
        const canvas = document.getElementById('displayChart');
        if (!canvas || typeof Chart === 'undefined') return;
        
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
        
        const data = this.generateChartData(this.chartPeriod);
        const ctx = canvas.getContext('2d');
        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Slideshow Displays',
                    data: data.values,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#2563eb'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, color: '#6b7280' } },
                    x: { ticks: { color: '#6b7280' } }
                }
            }
        });
    },

    generateChartData(period) {
        let labels = [];
        let values = [];
        
        switch(period) {
            case '24h':
                for (let i = 23; i >= 0; i--) {
                    labels.push(`${23-i}:00`);
                    values.push(Math.floor(Math.random() * 10));
                }
                break;
            case 'week':
                ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
                    labels.push(day);
                    values.push(Math.floor(Math.random() * 20));
                });
                break;
            default:
                labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                values = [5, 8, 12, 15, 10, 18];
        }
        
        return { labels, values };
    },

    updateChart(period) {
        this.chartPeriod = period;
        document.querySelectorAll('.chart-toggle-buttons button').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        this.renderChart();
    },

    async loadSlideshows() {
        try {
            const response = await fetch(`${API_BASE}/api/slideshows`);
            const data = await response.json();
            if (data.success) {
                this.slideshows = data.slideshows;
            }
        } catch (error) {
            console.error('Load slideshows error:', error);
        }
    },

    renderSlideshows() {
        const tbody = document.getElementById('slideshowsTableBody');
        tbody.innerHTML = this.slideshows.map(slideshow => `
            <tr>
                <td>
                    <strong>${slideshow.title}</strong>
                    <div class="expandable-text collapsed" onclick="app.toggleDescription(event)">
                        <small style="color: var(--text-light);">${slideshow.description || 'No description'}</small>
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        ${slideshow.images.length > 0 ? `
                            <div class="image-counter">
                                <img src="${slideshow.images[0].url}" 
                                     onerror="this.onerror=null; this.src='/assets/images/placeholder.jpg'"
                                     alt="${slideshow.images[0].caption}" 
                                     style="width: 80px; height: 60px; object-fit: cover; border-radius: 0.25rem;">
                                ${slideshow.images.length > 1 ? `<span class="image-counter-badge">+${slideshow.images.length - 1}</span>` : ''}
                            </div>
                        ` : '<img src="/assets/images/placeholder.jpg" style="width: 80px; height: 60px; object-fit: cover; border-radius: 0.25rem;">'}
                        <small style="color: var(--text-light);">${slideshow.images.length} total</small>
                    </div>
                </td>
                <td>
                    <label class="toggle-switch">
                        <input type="checkbox" ${slideshow.status === 'active' ? 'checked' : ''} 
                               onchange="app.toggleSlideshowStatus(${slideshow.id}, this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <small style="display: block; margin-top: 4px; color: var(--text-light);">
                        ${slideshow.status === 'active' ? 'Active' : 'Inactive'}
                    </small>
                </td>
                <td>${slideshow.createdBy}</td>
                <td>${new Date(slideshow.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="app.editSlideshow(${slideshow.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteSlideshow(${slideshow.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    toggleDescription(event) {
        event.currentTarget.classList.toggle('collapsed');
        event.currentTarget.classList.toggle('expanded');
    },

    async toggleSlideshowStatus(id, isActive) {
        try {
            const slideshow = this.slideshows.find(s => s.id === id);
            if (slideshow) {
                const response = await fetch(`${API_BASE}/api/slideshows/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: slideshow.title,
                        description: slideshow.description,
                        status: isActive ? 'active' : 'inactive'
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    slideshow.status = isActive ? 'active' : 'inactive';
                    await this.updateDashboard();
                }
            }
        } catch (error) {
            console.error('Toggle status error:', error);
        }
    },

    openSlideshowModal() {
        this.currentEditId = null;
        this.selectedImages = [];
        this.selectedFiles = [];  // CRITICAL: Clear both arrays
        this.deletedImageIds = []; // NEW: Clear deleted IDs
        document.getElementById('slideshowForm').reset();
        document.getElementById('imagePreviewGrid').innerHTML = '';
        document.querySelector('#slideshowModal h2').textContent = 'Create New Slideshow';
        document.querySelector('#slideshowForm button[type="submit"]').textContent = 'Create Slideshow';
        document.getElementById('slideshowModal').classList.add('active');
    },

    closeSlideshowModal() {
        document.getElementById('slideshowModal').classList.remove('active');
    },

    async editSlideshow(id) {
        const slideshow = this.slideshows.find(s => s.id === id);
        if (slideshow) {
            this.currentEditId = id;
            this.deletedImageIds = []; // NEW: Clear deleted IDs for this edit session
            document.getElementById('slideshowTitle').value = slideshow.title;
            document.getElementById('slideshowDescription').value = slideshow.description;
            document.getElementById('slideshowStatus').value = slideshow.status;
            
            this.selectedImages = [...slideshow.images];
            this.selectedFiles = [];
            this.renderImagePreviews();
            
            document.querySelector('#slideshowModal h2').textContent = 'Edit Slideshow';
            document.querySelector('#slideshowForm button[type="submit"]').textContent = 'Update Slideshow';
            document.getElementById('slideshowModal').classList.add('active');
        }
    },

    renderImagePreviews() {
        const previewGrid = document.getElementById('imagePreviewGrid');
        previewGrid.innerHTML = '';
        previewGrid.className = 'image-preview-grid';
        
        // Filter out any undefined or null entries first
        this.selectedImages = this.selectedImages.filter(img => img && img.url);
        this.selectedFiles = this.selectedFiles.filter(file => file);
        
        this.selectedImages.forEach((img, index) => {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.draggable = true;
            preview.dataset.index = index;
            
            // Create image element
            const imgElement = document.createElement('img');
            imgElement.src = img.url || '';
            imgElement.alt = img.caption || 'Preview';
            imgElement.onerror = function() {
                this.onerror = null;
                this.src = '/assets/images/placeholder.jpg';
            };
            
            // Create drag handle
            const dragHandle = document.createElement('div');
            dragHandle.className = 'drag-handle';
            dragHandle.textContent = `☰ ${index + 1}`;
            
            // Create remove button with proper event listener
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.textContent = '×';
            removeBtn.type = 'button';  // Prevent form submission
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.removeImage(index);
            });
            
            preview.appendChild(dragHandle);
            preview.appendChild(imgElement);
            preview.appendChild(removeBtn);
            
            preview.addEventListener('dragstart', (e) => this.handleDragStart(e));
            preview.addEventListener('dragend', (e) => this.handleDragEnd(e));
            preview.addEventListener('dragover', (e) => this.handleDragOver(e));
            preview.addEventListener('drop', (e) => this.handleDrop(e));
            preview.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            
            previewGrid.appendChild(preview);
        });
    },

    handleDragStart(e) {
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('index', e.target.dataset.index);
    },

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.image-preview').forEach(el => el.classList.remove('drag-over'));
    },

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const target = e.target.closest('.image-preview');
        if (target) target.classList.add('drag-over');
        return false;
    },

    handleDragLeave(e) {
        const target = e.target.closest('.image-preview');
        if (target) target.classList.remove('drag-over');
    },

    handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        
        const fromIndex = parseInt(e.dataTransfer.getData('index'));
        const toElement = e.target.closest('.image-preview');
        
        if (toElement) {
            const toIndex = parseInt(toElement.dataset.index);
            
            if (fromIndex !== toIndex) {
                // Reorder preview images
                const [movedImage] = this.selectedImages.splice(fromIndex, 1);
                this.selectedImages.splice(toIndex, 0, movedImage);
                
                // CRITICAL: Also reorder actual files
                if (this.selectedFiles.length > fromIndex) {
                    const [movedFile] = this.selectedFiles.splice(fromIndex, 1);
                    this.selectedFiles.splice(toIndex, 0, movedFile);
                }
                
                this.renderImagePreviews();
            }
        }
        
        return false;
    },

    removeImage(index) {
        console.log('Removing image at index:', index);
        console.log('Before - Images:', this.selectedImages.length, 'Files:', this.selectedFiles.length);
        
        // Validate index
        if (index < 0 || index >= this.selectedImages.length) {
            console.error('Invalid index:', index);
            return;
        }
        
        // CRITICAL: If this is an existing image (has an ID), track it for deletion
        const imageToRemove = this.selectedImages[index];
        if (imageToRemove.id) {
            console.log('Tracking image ID for deletion:', imageToRemove.id);
            this.deletedImageIds.push(imageToRemove.id);
        }
        
        // Remove from both arrays
        this.selectedImages.splice(index, 1);
        
        // Only remove from selectedFiles if it exists at that index
        if (index < this.selectedFiles.length) {
            this.selectedFiles.splice(index, 1);
        }
        
        console.log('After - Images:', this.selectedImages.length, 'Files:', this.selectedFiles.length);
        console.log('Deleted IDs:', this.deletedImageIds);
        
        // Re-render
        this.renderImagePreviews();
    },

    async deleteSlideshow(id) {
        if (confirm('Are you sure you want to delete this slideshow?')) {
            try {
                const response = await fetch(`${API_BASE}/api/slideshows/${id}`, { method: 'DELETE' });
                const data = await response.json();
                
                if (data.success) {
                    await this.loadSlideshows();
                    this.renderSlideshows();
                    await this.updateDashboard();
                }
            } catch (error) {
                console.error('Delete error:', error);
            }
        }
    },

    async loadUsers() {
        try {
            const response = await fetch(`${API_BASE}/api/users`);
            const data = await response.json();
            if (data.success) {
                this.users = data.users;
            }
        } catch (error) {
            console.error('Load users error:', error);
        }
    },

    renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        let usersToShow = this.currentUser.role === 'operator' 
            ? this.users.filter(u => u.id === this.currentUser.id)
            : this.users;
        
        tbody.innerHTML = usersToShow.map(user => `
            <tr>
                <td><strong>${user.full_name}</strong></td>
                <td>${user.username}</td>
                <td><span class="badge badge-info">${user.role}</span></td>
                <td><span class="badge badge-${user.status === 'active' ? 'success' : 'danger'}">${user.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="app.openChangePasswordModal(${user.id})">Change Password</button>
                        ${(this.currentUser.role === 'admin' && user.id !== 1) ? `
                            <button class="btn btn-sm btn-danger" onclick="app.deleteUser(${user.id})">Delete</button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    },

    openUserModal() {
        document.getElementById('userForm').reset();
        document.getElementById('userModal').classList.add('active');
    },

    closeUserModal() {
        document.getElementById('userModal').classList.remove('active');
    },

    async addUser(username, fullName, password, role) {
        try {
            const response = await fetch(`${API_BASE}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, fullName, password, role })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('User added successfully!');
                this.closeUserModal();
                await this.loadUsers();
                this.renderUsers();
            } else {
                alert(data.message || 'Failed to add user');
            }
        } catch (error) {
            console.error('Add user error:', error);
            alert('Failed to add user');
        }
    },

    async deleteUser(id) {
        if (confirm('Are you sure?')) {
            try {
                const response = await fetch(`${API_BASE}/api/users/${id}`, { method: 'DELETE' });
                const data = await response.json();
                if (data.success) {
                    await this.loadUsers();
                    this.renderUsers();
                }
            } catch (error) {
                console.error('Delete user error:', error);
            }
        }
    },

    openChangePasswordModal(userId) {
        this.currentEditUserId = userId;
        const user = this.users.find(u => u.id === userId);
        document.getElementById('changePasswordUsername').textContent = user.username;
        document.getElementById('changePasswordModal').classList.add('active');
    },

    closeChangePasswordModal() {
        document.getElementById('changePasswordModal').classList.remove('active');
        document.getElementById('changePasswordForm').reset();
    },

    async changePassword(newPassword) {
        alert('Password change feature requires additional API endpoint');
        this.closeChangePasswordModal();
    },

    loadSettings() {
        const storedSettings = localStorage.getItem('rsu_settings');
        if (storedSettings) {
            this.settings = JSON.parse(storedSettings);
            this.applySettings();
        }
    },

    saveSettings() {
        localStorage.setItem('rsu_settings', JSON.stringify(this.settings));
    },

    applySettings() {
        if (this.settings.siteLogo) {
            let favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }
            favicon.href = this.settings.siteLogo;
        }
    },

    loadSettingsForm() {
        document.getElementById('slideshowTiming').value = this.settings.slideshowTiming;
        document.getElementById('hospitalName').value = this.settings.hospitalName;
        document.getElementById('hospitalTagline').value = this.settings.hospitalTagline;
        
        if (this.settings.siteLogo) {
            document.getElementById('logoPreview').innerHTML = `
                <img src="${this.settings.siteLogo}" class="logo-preview" alt="Site Logo">
            `;
        }
    },

    saveGeneralSettings(timing, logo, hospitalName, hospitalTagline) {
        this.settings.slideshowTiming = parseInt(timing);
        this.settings.hospitalName = hospitalName;
        this.settings.hospitalTagline = hospitalTagline;
        if (logo) this.settings.siteLogo = logo;
        this.saveSettings();
        this.applySettings();
        alert('Settings saved successfully!');
    },

    async showPublicSlideshow() {
        try {
            const response = await fetch(`${API_BASE}/api/slideshows/active`);
            const data = await response.json();
            
            if (!data.success || data.slideshows.length === 0) {
                alert('No active slideshows');
                return;
            }
            
            const activeSlides = data.slideshows.flatMap(s => 
                s.images.map(img => ({ 
                    ...img, 
                    slideshowTitle: s.title,
                    slideshowDescription: s.description || s.title,
                    slideshowId: s.id 
                }))
            );

            const container = document.getElementById('slideshowContainer');
            const wrapper = document.getElementById('slidesWrapper');
            const paginationDots = document.getElementById('paginationDots');
            
            const badge = container.querySelector('.hospital-badge');
            badge.innerHTML = `
                ${this.settings.siteLogo ? `<img src="${this.settings.siteLogo}" alt="Logo">` : ''}
                <div>
                    <h1>${this.settings.hospitalName}</h1>
                    <p>${this.settings.hospitalTagline}</p>
                </div>
            `;
            
            wrapper.innerHTML = activeSlides.map((slide, index) => `
                <div class="slide ${index === 0 ? 'active' : ''}">
                    <img src="${slide.url}" 
                         onerror="this.onerror=null; this.src='/assets/images/placeholder.jpg'"
                         alt="${slide.slideshowTitle}">
                    <div class="slide-caption">
                        <h2>${slide.slideshowTitle}</h2>
                        <p>${slide.slideshowDescription}</p>
                    </div>
                </div>
            `).join('');
            
            paginationDots.innerHTML = activeSlides.map((_, index) => 
                `<div class="dot ${index === 0 ? 'active' : ''}"></div>`
            ).join('');

            container.classList.add('active');
            this.currentSlideIndex = 0;
            this.isPaused = false;
            this.startSlideshow(activeSlides);

            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            }

            const uniqueIds = [...new Set(activeSlides.map(s => s.slideshowId))];
            uniqueIds.forEach(id => {
                fetch(`${API_BASE}/api/slideshows/${id}/display`, { method: 'POST' });
            });
        } catch (error) {
            console.error('Slideshow error:', error);
            alert('Failed to load slideshow');
        }
    },

    startSlideshow(slides) {
        const timing = (this.settings.slideshowTiming || 5) * 1000;
        this.slideshowInterval = setInterval(() => {
            if (!this.isPaused) {
                const slideElements = document.querySelectorAll('.slide');
                const dotElements = document.querySelectorAll('.pagination-dots .dot');
                
                slideElements[this.currentSlideIndex]?.classList.remove('active');
                dotElements[this.currentSlideIndex]?.classList.remove('active');
                
                this.currentSlideIndex = (this.currentSlideIndex + 1) % slides.length;
                
                slideElements[this.currentSlideIndex]?.classList.add('active');
                dotElements[this.currentSlideIndex]?.classList.add('active');
            }
        }, timing);
    },

    pauseSlideshow() {
        this.isPaused = !this.isPaused;
        event.target.textContent = this.isPaused ? 'Resume' : 'Pause';
    },

    closeSlideshow() {
        clearInterval(this.slideshowInterval);
        document.getElementById('slideshowContainer').classList.remove('active');
        if (document.exitFullscreen) document.exitFullscreen();
        this.updateDashboard();
    }
};

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        app.login(
            document.getElementById('loginUsername').value,
            document.getElementById('loginPassword').value
        );
    });

    // CRITICAL FIX #1: Proper file handling in form submission
    document.getElementById('slideshowForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', document.getElementById('slideshowTitle').value);
        formData.append('description', document.getElementById('slideshowDescription').value);
        formData.append('status', document.getElementById('slideshowStatus').value);
        formData.append('createdBy', app.currentUser.username);
        
        // CRITICAL FIX: Use selectedFiles array (not fileInput.files which is empty!)
        if (app.selectedFiles.length > 0) {
            app.selectedFiles.forEach(file => {
                formData.append('images', file);
            });
        }
        
        const captions = app.selectedImages.map((img, i) => img.caption || `Slide ${i + 1}`);
        formData.append('captions', JSON.stringify(captions));
        
        // NEW: Send deleted image IDs for server-side deletion
        if (app.deletedImageIds.length > 0) {
            formData.append('deletedImageIds', JSON.stringify(app.deletedImageIds));
            console.log('Sending deleted image IDs:', app.deletedImageIds);
        }
        
        try {
            const url = app.currentEditId 
                ? `${API_BASE}/api/slideshows/${app.currentEditId}` 
                : `${API_BASE}/api/slideshows`;
            const method = app.currentEditId ? 'PUT' : 'POST';
            
            const response = await fetch(url, { method, body: formData });
            const data = await response.json();
            
            if (data.success) {
                alert(app.currentEditId ? 'Slideshow updated!' : 'Slideshow created!');
                app.closeSlideshowModal();
                await app.loadSlideshows();
                app.renderSlideshows();
                await app.updateDashboard();
            } else {
                alert(data.message || 'Failed to save');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save slideshow');
        }
    });

    document.getElementById('userForm').addEventListener('submit', (e) => {
        e.preventDefault();
        app.addUser(
            document.getElementById('newUsername').value,
            document.getElementById('newFullName').value,
            document.getElementById('newPassword').value,
            document.getElementById('newUserRole').value
        );
    });

    // CRITICAL FIX #2: Keep File objects when images are selected
    document.getElementById('slideshowImages').addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        const startIndex = app.selectedImages.length;

        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const actualIndex = startIndex + index;
                // Add preview
                app.selectedImages.push({
                    url: event.target.result,
                    caption: `Slide ${actualIndex + 1}`
                });
                // CRITICAL: Keep actual File object
                app.selectedFiles.push(file);
                app.renderImagePreviews();
            };
            reader.readAsDataURL(file);
        });
        
        e.target.value = '';
    });

    document.getElementById('settingsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        app.saveGeneralSettings(
            document.getElementById('slideshowTiming').value,
            app.settings.siteLogo,
            document.getElementById('hospitalName').value,
            document.getElementById('hospitalTagline').value
        );
    });

    document.getElementById('siteLogo').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                app.settings.siteLogo = event.target.result;
                document.getElementById('logoPreview').innerHTML = `
                    <img src="${event.target.result}" class="logo-preview" alt="Logo">
                `;
            };
            reader.readAsDataURL(file);
        }
    });

    const cpForm = document.getElementById('changePasswordForm');
    if (cpForm) {
        cpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('newPasswordInput').value;
            const confirmPassword = document.getElementById('confirmPasswordInput').value;
            
            if (newPassword !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            app.changePassword(newPassword);
        });
    }

    app.init();
});
