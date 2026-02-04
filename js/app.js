// RSU Islam Group Slideshow App - Enhanced Version
const app = {
    currentUser: null,
    users: [],
    slideshows: [],
    settings: {
        slideshowTiming: 5,
        siteLogo: null,
        hospitalName: 'RSU Islam Group',
        hospitalTagline: 'Healthcare Excellence'
    },
    currentView: 'dashboard',
    selectedImages: [],
    currentEditId: null,
    currentSlideIndex: 0,
    slideshowInterval: null,
    isPaused: false,
    chartInstance: null,
    chartPeriod: '24h',

    init() {
        this.loadFromStorage();
        this.checkAuth();
        this.loadSettings();
    },

    loadFromStorage() {
        const storedUsers = localStorage.getItem('rsu_users');
        const storedSlideshows = localStorage.getItem('rsu_slideshows');

        if (storedUsers) {
            this.users = JSON.parse(storedUsers);
        } else {
            // Default admin user
            this.users = [{
                id: 1,
                username: 'admin',
                fullName: 'Administrator',
                password: 'admin123',
                role: 'admin',
                status: 'active'
            }];
            this.saveToStorage();
        }

        if (storedSlideshows) {
            this.slideshows = JSON.parse(storedSlideshows);
        }
    },

    saveToStorage() {
        localStorage.setItem('rsu_users', JSON.stringify(this.users));
        localStorage.setItem('rsu_slideshows', JSON.stringify(this.slideshows));
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
        // Apply logo to favicon
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

    showAdminPanel() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('adminPanel').classList.remove('hidden');
        document.getElementById('currentUserName').textContent = this.currentUser.fullName;
        
        // Hide add user button for operators
        if (this.currentUser.role === 'operator') {
            const addUserBtn = document.getElementById('addUserBtn');
            if (addUserBtn) addUserBtn.style.display = 'none';
        }
        
        this.switchView('dashboard');
    },

    login(username, password) {
        const user = this.users.find(u => u.username === username && u.password === password && u.status === 'active');
        if (user) {
            this.currentUser = user;
            localStorage.setItem('rsu_current_user', JSON.stringify(user));
            this.showAdminPanel();
        } else {
            alert('Invalid credentials or inactive account');
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

    switchView(view) {
        this.currentView = view;
        
        // Update sidebar
        document.querySelectorAll('.sidebar-menu li').forEach(li => {
            li.classList.remove('active');
            if (li.getAttribute('onclick').includes(view)) {
                li.classList.add('active');
            }
        });

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${view}Section`).classList.add('active');

        // Render appropriate content
        if (view === 'dashboard') {
            this.updateDashboard();
            this.renderChart();
        } else if (view === 'slideshows') {
            this.renderSlideshows();
        } else if (view === 'users') {
            this.renderUsers();
        } else if (view === 'settings') {
            this.loadSettingsForm();
        }
    },

    updateDashboard() {
        const activeSlides = this.slideshows.filter(s => s.status === 'active').length;
        const totalSlides = this.slideshows.length;
        const totalDisplays = this.slideshows.reduce((sum, s) => sum + (s.displayCount || 0), 0);

        document.getElementById('activeSlidesCount').textContent = activeSlides;
        document.getElementById('totalSlidesCount').textContent = totalSlides;
        document.getElementById('totalUsersCount').textContent = this.users.filter(u => u.status === 'active').length;
        document.getElementById('totalDisplaysCount').textContent = totalDisplays;
    },

    renderChart() {
        // This will use Chart.js when we add the library
        console.log('Chart rendering for period:', this.chartPeriod);
        // For now, placeholder
    },

    renderSlideshows() {
        const tbody = document.getElementById('slideshowsTableBody');
        tbody.innerHTML = this.slideshows.map(slideshow => `
            <tr>
                <td>
                    <strong>${slideshow.title}</strong>
                    <div class="expandable-text collapsed" onclick="app.toggleDescription(event)">
                        <small style="color: var(--text-light);">${slideshow.description}</small>
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        ${slideshow.images.length > 0 ? `
                            <div class="image-counter">
                                <img src="${slideshow.images[0].url}" alt="${slideshow.images[0].caption}" 
                                     style="width: 80px; height: 60px; object-fit: cover; border-radius: 0.25rem;">
                                ${slideshow.images.length > 1 ? `
                                    <span class="image-counter-badge">+${slideshow.images.length - 1}</span>
                                ` : ''}
                            </div>
                        ` : '<span style="color: var(--text-light);">No images</span>'}
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
        const element = event.currentTarget;
        element.classList.toggle('collapsed');
        element.classList.toggle('expanded');
    },

    toggleSlideshowStatus(id, isActive) {
        const slideshow = this.slideshows.find(s => s.id === id);
        if (slideshow) {
            slideshow.status = isActive ? 'active' : 'inactive';
            this.saveToStorage();
            this.updateDashboard();
        }
    },

    renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        
        // Operators can only see themselves
        let usersToShow = this.users;
        if (this.currentUser.role === 'operator') {
            usersToShow = this.users.filter(u => u.id === this.currentUser.id);
        }
        
        tbody.innerHTML = usersToShow.map(user => `
            <tr>
                <td><strong>${user.fullName}</strong></td>
                <td>${user.username}</td>
                <td><span class="badge badge-info">${user.role}</span></td>
                <td><span class="badge badge-${user.status === 'active' ? 'success' : 'danger'}">${user.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="app.openChangePasswordModal(${user.id})">
                            Change Password
                        </button>
                        ${(this.currentUser.role === 'admin' && user.id !== 1) ? `
                            <button class="btn btn-sm btn-danger" onclick="app.deleteUser(${user.id})">Delete</button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
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

    changePassword(newPassword) {
        const user = this.users.find(u => u.id === this.currentEditUserId);
        if (user) {
            user.password = newPassword;
            this.saveToStorage();
            this.closeChangePasswordModal();
            alert('Password changed successfully!');
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
        
        if (logo) {
            this.settings.siteLogo = logo;
        }
        
        this.saveSettings();
        this.applySettings();
        alert('Settings saved successfully!');
    },

    openSlideshowModal() {
        this.currentEditId = null;
        this.selectedImages = [];
        document.getElementById('slideshowForm').reset();
        document.getElementById('imagePreviewGrid').innerHTML = '';
        document.querySelector('#slideshowModal h2').textContent = 'Create New Slideshow';
        document.querySelector('#slideshowForm button[type="submit"]').textContent = 'Create Slideshow';
        document.getElementById('slideshowModal').classList.add('active');
    },

    closeSlideshowModal() {
        document.getElementById('slideshowModal').classList.remove('active');
    },

    openUserModal() {
        document.getElementById('userForm').reset();
        document.getElementById('userModal').classList.add('active');
    },

    closeUserModal() {
        document.getElementById('userModal').classList.remove('active');
    },

    createSlideshow(title, description, status, images) {
        if (this.currentEditId) {
            // Update existing slideshow
            const slideshow = this.slideshows.find(s => s.id === this.currentEditId);
            if (slideshow) {
                slideshow.title = title;
                slideshow.description = description;
                slideshow.status = status;
                slideshow.images = images;
                alert('Slideshow updated successfully!');
            }
        } else {
            // Create new slideshow
            const newSlideshow = {
                id: this.slideshows.length + 1,
                title,
                description,
                status,
                createdBy: this.currentUser.username,
                createdAt: new Date(),
                displayCount: 0,
                lastDisplayed: new Date(),
                images
            };
            this.slideshows.push(newSlideshow);
            alert('Slideshow created successfully!');
        }
        this.saveToStorage();
        this.closeSlideshowModal();
        this.renderSlideshows();
        this.updateDashboard();
    },

    // Add user
    addUser(username, fullName, password, role) {
        const newUser = {
            id: this.users.length + 1,
            username,
            fullName,
            password,
            role,
            status: 'active'
        };
        this.users.push(newUser);
        this.saveToStorage();
        this.closeUserModal();
        this.renderUsers();
        alert('User added successfully!');
    },

    deleteUser(id) {
        if (confirm('Are you sure you want to delete this user?')) {
            this.users = this.users.filter(u => u.id !== id);
            this.saveToStorage();
            this.renderUsers();
        }
    },

    deleteSlideshow(id) {
        if (confirm('Are you sure you want to delete this slideshow?')) {
            this.slideshows = this.slideshows.filter(s => s.id !== id);
            this.saveToStorage();
            this.renderSlideshows();
            this.updateDashboard();
        }
    },

    // Public slideshow
    showPublicSlideshow() {
        const activeSlides = this.slideshows
            .filter(s => s.status === 'active')
            .flatMap(s => s.images.map(img => ({ ...img, slideshowTitle: s.title, slideshowDescription: s.description, slideshowId: s.id })));

        if (activeSlides.length === 0) {
            alert('No active slideshows available');
            return;
        }

        const container = document.getElementById('slideshowContainer');
        const wrapper = document.getElementById('slidesWrapper');
        const paginationDots = document.getElementById('paginationDots');
        
        // Update hospital badge
        const badge = container.querySelector('.hospital-badge');
        badge.innerHTML = `
            ${this.settings.siteLogo ? `<img src="${this.settings.siteLogo}" alt="Logo">` : ''}
            <div>
                <h1>${this.settings.hospitalName}</h1>
                <p>${this.settings.hospitalTagline}</p>
            </div>
        `;
        
        // Render slides
        wrapper.innerHTML = activeSlides.map((slide, index) => `
            <div class="slide ${index === 0 ? 'active' : ''}">
                <img src="${slide.url}" alt="${slide.slideshowTitle}">
                <div class="slide-caption">
                    <h2>${slide.slideshowTitle}</h2>
                    <p>${slide.slideshowDescription}</p>
                </div>
            </div>
        `).join('');
        
        // Render pagination dots
        paginationDots.innerHTML = activeSlides.map((_, index) => 
            `<div class="dot ${index === 0 ? 'active' : ''}"></div>`
        ).join('');

        container.classList.add('active');
        this.currentSlideIndex = 0;
        this.isPaused = false;
        this.startSlideshow(activeSlides);

        // Enter fullscreen
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        }

        // Update display counts
        const uniqueIds = [...new Set(activeSlides.map(s => s.slideshowId))];
        uniqueIds.forEach(id => {
            const slideshow = this.slideshows.find(s => s.id === id);
            if (slideshow) {
                slideshow.displayCount++;
                slideshow.lastDisplayed = new Date();
            }
        });
        this.saveToStorage();
    },

    startSlideshow(slides) {
        const timing = (this.settings.slideshowTiming || 5) * 1000;
        this.slideshowInterval = setInterval(() => {
            if (!this.isPaused) {
                const slideElements = document.querySelectorAll('.slide');
                const dotElements = document.querySelectorAll('.pagination-dots .dot');
                
                // Remove active from current
                slideElements[this.currentSlideIndex].classList.remove('active');
                if (dotElements[this.currentSlideIndex]) {
                    dotElements[this.currentSlideIndex].classList.remove('active');
                }
                
                // Move to next
                this.currentSlideIndex = (this.currentSlideIndex + 1) % slides.length;
                
                // Add active to new
                slideElements[this.currentSlideIndex].classList.add('active');
                if (dotElements[this.currentSlideIndex]) {
                    dotElements[this.currentSlideIndex].classList.add('active');
                }
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
        
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }

        this.updateDashboard();
    },

    editSlideshow(id) {
        const slideshow = this.slideshows.find(s => s.id === id);
        if (slideshow) {
            this.currentEditId = id;
            document.getElementById('slideshowTitle').value = slideshow.title;
            document.getElementById('slideshowDescription').value = slideshow.description;
            document.getElementById('slideshowStatus').value = slideshow.status;
            
            // Show existing images
            const previewGrid = document.getElementById('imagePreviewGrid');
            previewGrid.innerHTML = '';
            this.selectedImages = [...slideshow.images];
            
            slideshow.images.forEach((img, index) => {
                const preview = document.createElement('div');
                preview.className = 'image-preview';
                preview.innerHTML = `
                    <img src="${img.url}" alt="${img.caption}">
                    <button class="remove-btn" onclick="app.selectedImages.splice(${index}, 1); event.target.parentElement.remove();">&times;</button>
                    <input type="text" value="${img.caption}" 
                           onchange="app.selectedImages[${index}].caption = this.value"
                           style="position: absolute; bottom: 0; left: 0; right: 0; padding: 4px; font-size: 11px; border: none; background: rgba(0,0,0,0.7); color: white;">
                `;
                previewGrid.appendChild(preview);
            });
            
            document.querySelector('#slideshowModal h2').textContent = 'Edit Slideshow';
            document.querySelector('#slideshowForm button[type="submit"]').textContent = 'Update Slideshow';
            document.getElementById('slideshowModal').classList.add('active');
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        app.login(username, password);
    });

    document.getElementById('slideshowForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('slideshowTitle').value;
        const description = document.getElementById('slideshowDescription').value;
        const status = document.getElementById('slideshowStatus').value;
        
        if (app.selectedImages.length === 0) {
            alert('Please upload at least one image');
            return;
        }

        app.createSlideshow(title, description, status, app.selectedImages);
    });

    document.getElementById('userForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('newUsername').value;
        const fullName = document.getElementById('newFullName').value;
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newUserRole').value;
        app.addUser(username, fullName, password, role);
    });

    document.getElementById('slideshowImages').addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        app.selectedImages = [];
        const previewGrid = document.getElementById('imagePreviewGrid');
        previewGrid.innerHTML = '';

        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageData = {
                    url: event.target.result,
                    caption: `${document.getElementById('slideshowTitle').value || 'Image'} - Slide ${index + 1}`
                };
                app.selectedImages.push(imageData);

                const preview = document.createElement('div');
                preview.className = 'image-preview';
                preview.innerHTML = `
                    <img src="${event.target.result}" alt="Preview">
                    <button class="remove-btn" onclick="app.selectedImages.splice(${index}, 1); this.parentElement.remove();">&times;</button>
                `;
                previewGrid.appendChild(preview);
            };
            reader.readAsDataURL(file);
        });
    });

    // Settings form
    document.getElementById('settingsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const timing = document.getElementById('slideshowTiming').value;
        const hospitalName = document.getElementById('hospitalName').value;
        const hospitalTagline = document.getElementById('hospitalTagline').value;
        app.saveGeneralSettings(timing, app.settings.siteLogo, hospitalName, hospitalTagline);
    });

    // Logo upload
    document.getElementById('siteLogo').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                app.settings.siteLogo = event.target.result;
                document.getElementById('logoPreview').innerHTML = `
                    <img src="${event.target.result}" class="logo-preview" alt="Site Logo">
                `;
            };
            reader.readAsDataURL(file);
        }
    });

    // Change password form
    if (document.getElementById('changePasswordForm')) {
        document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
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

    // Initialize app
    app.init();
});
