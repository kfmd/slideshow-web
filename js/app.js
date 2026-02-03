// RSU Islam Group Slideshow App
const app = {
    currentUser: null,
    users: [],
    slideshows: [],
    currentView: 'dashboard',
    selectedImages: [],
    currentEditId: null,
    currentSlideIndex: 0,
    slideshowInterval: null,
    isPaused: false,

    init() {
        this.loadFromStorage();
        this.checkAuth();
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
        } else if (view === 'slideshows') {
            this.renderSlideshows();
        } else if (view === 'users') {
            this.renderUsers();
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

    renderSlideshows() {
        const tbody = document.getElementById('slideshowsTableBody');
        tbody.innerHTML = this.slideshows.map(slideshow => `
            <tr>
                <td>
                    <strong>${slideshow.title}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-light);">${slideshow.description}</div>
                </td>
                <td>
                    <div class="thumbnail-grid">
                        ${slideshow.images.slice(0, 4).map(img => `
                            <img src="${img.url}" alt="${img.caption}">
                        `).join('')}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.5rem;">
                        ${slideshow.images.length} images
                    </div>
                </td>
                <td><span class="badge badge-${slideshow.status === 'active' ? 'success' : 'warning'}">${slideshow.status}</span></td>
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

    renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td><strong>${user.fullName}</strong></td>
                <td>${user.username}</td>
                <td><span class="badge badge-info">${user.role}</span></td>
                <td><span class="badge badge-${user.status === 'active' ? 'success' : 'danger'}">${user.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-danger" onclick="app.deleteUser(${user.id})" 
                                ${user.id === 1 ? 'disabled' : ''}>Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
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
            .flatMap(s => s.images.map(img => ({ ...img, slideshowTitle: s.title, slideshowId: s.id })));

        if (activeSlides.length === 0) {
            alert('No active slideshows available');
            return;
        }

        const container = document.getElementById('slideshowContainer');
        const wrapper = document.getElementById('slidesWrapper');
        
        wrapper.innerHTML = activeSlides.map((slide, index) => `
            <div class="slide ${index === 0 ? 'active' : ''}">
                <img src="${slide.url}" alt="${slide.caption}">
                <div class="slide-caption">
                    <h2>${slide.slideshowTitle}</h2>
                    <p>${slide.caption}</p>
                </div>
            </div>
        `).join('');

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
        this.slideshowInterval = setInterval(() => {
            if (!this.isPaused) {
                const slideElements = document.querySelectorAll('.slide');
                slideElements[this.currentSlideIndex].classList.remove('active');
                this.currentSlideIndex = (this.currentSlideIndex + 1) % slides.length;
                slideElements[this.currentSlideIndex].classList.add('active');
            }
        }, 5000);
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

    // Initialize app
    app.init();
});
