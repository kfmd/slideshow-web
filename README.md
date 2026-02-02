# RSU Islam Group Slideshow Web Application

A modern, full-featured web application for displaying hospital services and programs on TVs throughout your facilities. Built with Node.js, Express, SQLite, and modern web technologies.

## ✨ Features

- 🖼️ **Full Slideshow Management** - Create, edit, and organize multiple slideshows
- 👥 **User Management** - Role-based access control (Admin/User)
- 📊 **Statistics Dashboard** - Track slideshow displays and usage
- ⚙️ **Customizable Settings** - Configure fonts, timing, and branding
- 🎨 **Modern UI** - Clean, responsive design with smooth transitions
- 🐳 **Docker Support** - Easy deployment with Docker Compose
- 💾 **File-Based Database** - SQLite for reliable, portable data storage
- 📱 **Responsive Design** - Works on TVs, desktops, tablets, and phones
- 🔒 **Secure** - Session-based authentication with bcrypt password hashing

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (for local) OR Docker Desktop (for Docker)
- macOS, Linux, or Windows

### Local Installation

```bash
# 1. Clone or download project files
mkdir rsu-islam-slideshow && cd rsu-islam-slideshow

# 2. Copy all project files to this directory

# 3. Run setup script
chmod +x setup.sh
./setup.sh

# 4. Start application
npm start

# 5. Open browser
open http://localhost:3000
```

### Docker Installation (Recommended)

```bash
# 1. Ensure Docker Desktop is running

# 2. Navigate to project directory
cd rsu-islam-slideshow

# 3. Start with Docker Compose
docker-compose up -d

# 4. Open browser
open http://localhost:3000
```

## 🔑 Default Credentials

```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT: Change the password immediately after first login!**

## 📖 Documentation

- **IMPLEMENTATION-GUIDE.md** - Complete setup and usage guide
- **COMPLETE-SETUP-GUIDE.md** - Detailed technical documentation
- **ALL-HTML-FILES.md** - HTML file contents (extract to public/)

## 📁 Project Structure

```
rsu-islam-slideshow/
├── database/              # SQLite database (auto-created)
├── uploads/               # Uploaded images (auto-created)
├── public/                # Frontend files
│   ├── *.css             # Stylesheets
│   ├── *.js              # JavaScript files
│   └── *.html            # HTML pages
├── sample-images/         # Sample images
├── database.js            # Database configuration
├── server.js              # Express server
├── package.json           # Dependencies
├── Dockerfile             # Docker image
└── docker-compose.yml     # Docker orchestration
```

## 🎯 Usage

### 1. Login
Navigate to http://localhost:3000 and login with default credentials

### 2. Create Slideshow
- Click "Slideshows" in sidebar
- Click "Create New Slideshow"
- Enter title and description
- Set status to "Active"

### 3. Add Slides
- Click "Manage Slides" on your slideshow
- Click "Add Slides"
- Upload images (JPG, PNG, WebP, GIF)
- Add titles and descriptions

### 4. Display on TV
- Navigate to http://localhost:3000/slideshow on your TV browser
- Slideshow auto-starts in fullscreen
- Shows all active slideshows

## 🔧 Configuration

### Settings Panel (Admin Only)
- **Font Settings** - Choose font family and sizes
- **Transition Duration** - Set how long each slide displays (1-30 seconds)
- **Company Logo** - Upload logo to display on slideshows

### Environment Variables
```bash
PORT=3000                    # Server port
SESSION_SECRET=your-secret   # Session encryption key
NODE_ENV=production          # Production mode
```

## 🐳 Docker Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose stop

# Restart
docker-compose restart

# View logs
docker-compose logs -f

# Remove
docker-compose down
```

## 📊 Features Breakdown

### User Roles
- **Admin** - Full access to all features
- **User** - Can manage own slideshows only

### Slideshow Features
- Multiple slideshows support
- Active/inactive status
- Display count tracking
- Preview functionality
- Bulk image upload (up to 10 images)
- Image URL support

### Display Features
- Fullscreen mode (auto-enabled)
- 16:9 landscape aspect ratio
- Smooth fade transitions
- Pagination controls
- Keyboard navigation
- Touch/swipe support
- Play/pause controls

## 🛠️ Technology Stack

**Backend:**
- Node.js 20+
- Express.js
- SQLite (better-sqlite3)
- bcryptjs (password hashing)
- express-session
- multer (file uploads)

**Frontend:**
- Vanilla JavaScript (ES6+)
- Modern CSS3
- Responsive design
- No framework dependencies

## 🔒 Security

- Session-based authentication
- bcrypt password hashing
- SQL injection prevention (prepared statements)
- File upload validation
- CSRF protection
- XSS prevention

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Slideshows
- `GET /api/slideshows` - Get all slideshows
- `GET /api/slideshows/active` - Get active slideshows
- `POST /api/slideshows` - Create slideshow
- `PUT /api/slideshows/:id` - Update slideshow
- `DELETE /api/slideshows/:id` - Delete slideshow

### Slides
- `POST /api/slides` - Upload slides
- `PUT /api/slides/:id` - Update slide
- `DELETE /api/slides/:id` - Delete slide

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/logo` - Upload logo

### Users (Admin Only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Statistics
- `GET /api/stats` - Get comprehensive stats

## 🐛 Troubleshooting

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9
```

### Database Locked
```bash
rm database/*.db-wal database/*.db-shm
npm start
```

### Docker Issues
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

See **COMPLETE-SETUP-GUIDE.md** for detailed troubleshooting.

## 📦 File List

**Download these files:**
1. package.json
2. server.js
3. database.js
4. Dockerfile
5. docker-compose.yml
6. setup.sh
7. public/styles.css (rename from public-styles.css)
8. public/admin.css (rename from public-admin.css)
9. public/slideshow.css (rename from public-slideshow.css)
10. public/login.js (rename from public-login.js)
11. public/admin.js (rename from public-admin.js)
12. public/slideshow.js (rename from public-slideshow.js)
13. Extract HTML files from ALL-HTML-FILES.md:
    - public/login.html
    - public/admin.html
    - public/slideshow.html

## 🎨 Customization

### Change Colors
Edit `public/styles.css`:
```css
:root {
  --primary-color: #2c7a7b;
  --secondary-color: #f6ad55;
}
```

### Change Transition Speed
In Admin Panel → Settings → Transition Duration

### Add Custom Fonts
Edit font selection in Settings section of `public/admin.html`

## 📄 License

MIT License - Feel free to use for your hospital or organization

## 👤 Author

Built for RSU Islam Group
Version 1.0.0 - February 2026

## 🙏 Support

For detailed instructions, see:
- **IMPLEMENTATION-GUIDE.md** - Step-by-step implementation
- **COMPLETE-SETUP-GUIDE.md** - Comprehensive technical guide

---

**⭐ Remember to change the default admin password after first login!**
