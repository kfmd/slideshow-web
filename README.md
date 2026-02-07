# 🏥 RSU Islam Group - Digital Signage System

**Complete Full-Stack Slideshow Web Application**

A professional digital signage system for hospitals with database persistence, file uploads, drag-drop reordering, and hot reload development.

Developed by KFMD
🌐 [Notion](https://kfmd.notion.site/) 🌐 [GitHub](https://github.com/kfmd)
---

## FEATURES

### ✅ Persistent Database Storage

- **SQLite database**
- Data persists across app updates
- Create/edit slides without data loss
- Professional database schema with foreign keys

### Fix #2: ✅ File Upload to `assets/images/uploads/`

- Images uploaded to proper directory
- Multer handles file processing
- Automatic filename generation
- 10MB file size limit

### ✅ Sample Images Included

- 4 sample images: `circ-1.jpg`, `circ-2.jpg`, `hc-1.jpg`, `hc-2.jpg`
- Sample data SQL script provided
- Ready-to-use slideshow examples

### ✅ Placeholder Image Fallback

- `placeholder.jpg` used when images not found
- `onerror` handlers on all images
- Graceful degradation
- No broken image icons

### ✅ Docker Hot Reload

- Nodemon watches for file changes
- Volume mounting for live updates
- Edit code → see changes immediately
- No container rebuilds needed

### ✅ Drag-Drop Image Reordering

- Drag images to rearrange order
- Visual feedback during drag
- Smooth animations
- Touch-friendly

### ✅ Gradient Fade on Collapsed Text

- Beautiful white gradient fade
- Professional appearance
- Smooth text transitions
- Click to expand/collapse

---

## 📁 Project Structure

```
rsu-slideshow-webapp/
├── index.html              ← Admin panel
├── slideshow.html          ← Display page
├── server.js               ← Express API server
├── package.json            ← Dependencies
├── load-sample-data.js     ← If you want to load sample data to database using node 
├── Dockerfile              ← Docker image
├── docker-compose.yml      ← Hot reload config
│
├── css/
│   └── styles.css          ← All styles with gradients & drag-drop
│
├── js/
│   └── app.js              ← Complete app with all 7 fixes
│
├── config/
│   └── database.js         ← SQLite connection
│
├── database/
│   ├── schema.sql          ← Database structure
│   ├── sample-data.sql     ← Sample slideshows
│   └── rsu_slideshow.db    ← SQLite database (auto-created)
│
└── assets/
    └── images/
        ├── placeholder.jpg      ← Fallback image
        └── uploads/             ← Uploaded files go here
            ├── circ-1.jpg       ← Sample
            ├── circ-2.jpg       ← Sample
            ├── hc-1.jpg         ← Sample
            └── hc-2.jpg         ← Sample
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended - Hot Reload Enabled!)

```bash
# Clone or navigate to project
cd rsu-slideshow-webapp

# Build and start with hot reload
docker-compose up -d

# View logs
docker-compose logs -f

# Access application
# Admin: http://localhost:3000/index.html
# Display: http://localhost:3000/slideshow.html
```

**Hot Reload is ACTIVE!** Edit any file and see changes immediately! No restart needed!

### Option 2: Node.js

```bash
# Install dependencies
npm install

# Start with hot reload
npm run dev

# OR start normally
npm start

# Access at http://localhost:3000
```

---

## 📊 Database Setup

### Automatic Initialization

Database creates automatically on first run with:

- Default admin user (username: `admin`, password: `admin123`)
- Empty slideshows table
- Activity logs

### Load Sample Data

```bash
# Enter Docker container
docker-compose exec rsu-slideshow sh

# Load sample data
sqlite3 database/rsu_slideshow.db < database/sample-data.sql

# Exit
exit
```

**OR using Node:**

```bash
npm run init-db
```

---

## 🎨 Usage Guide

### Creating a Slideshow

1. **Login** to admin panel (admin/admin123)
2. Click **"+ Create Slideshow"**
3. Fill in title and description
4. Click **"Upload Images"** or drag files
5. **Drag images** to reorder them (Fix #6!)
6. Set status to **Active**
7. Click **"Create Slideshow"**
8. Images saved to `assets/images/uploads/` (Fix #2!)
9. Data persists in database (Fix #1!)

### Editing a Slideshow

1. Click **"Edit"** on any slideshow
2. Add more images (they **append**, not replace!)
3. **Drag to reorder** images
4. Click ×  to remove images
5. Click **"Update Slideshow"**
6. Changes saved permanently

### Viewing Slideshow

1. Click **"▶ Start Slideshow"** or
2. Open `http://localhost:3000/slideshow.html`
3. Auto-advance based on settings

---

## ⚙️ Configuration

### Slideshow Timing

Settings → Slideshow Timing → Set seconds (1-60)

### Hospital Branding

Settings → Hospital Name/Tagline → Customize text

### Site Logo

Settings → Upload Logo → Shows in slideshow + favicon

---

## 🔧 Development

### Hot Reload Testing (Fix #5)

```bash
# Start with Docker
docker-compose up

# Edit any file:
# - css/styles.css
# - js/app.js  
# - index.html
# - server.js

# Changes apply INSTANTLY! 
# No restart needed!
```

### File Structure Best Practices

```
✓ HTML in root
✓ CSS in css/
✓ JS in js/
✓ Database in database/
✓ Uploads in assets/images/uploads/
✓ Placeholder in assets/images/
```

---

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Authenticate user |
| GET | `/api/slideshows` | Get all slideshows |
| GET | `/api/slideshows/active` | Get active slideshows |
| POST | `/api/slideshows` | Create slideshow (with files) |
| PUT | `/api/slideshows/:id` | Update slideshow |
| DELETE | `/api/slideshows/:id` | Delete slideshow |
| POST | `/api/slideshows/:id/display` | Increment display count |
| GET | `/api/users` | Get all users |
| POST | `/api/users` | Create user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/dashboard/stats` | Get statistics |

---

## 🐛 Troubleshooting

### Images Not Loading

```bash
# Check uploads directory exists
ls -la assets/images/uploads/

# Check file permissions
chmod -R 755 assets/images/

# Check database has correct paths
sqlite3 database/rsu_slideshow.db "SELECT * FROM images;"
```

### Database Issues

```bash
# Reset database
rm database/rsu_slideshow.db

# Restart app (auto-creates new database)
docker-compose restart

# Load sample data
docker-compose exec rsu-slideshow sh -c \
  "sqlite3 database/rsu_slideshow.db < database/sample-data.sql"
```

### Hot Reload Not Working

```bash
# Check volumes are mounted
docker-compose ps
docker inspect rsu-slideshow-app | grep -A 10 Mounts

# Restart with rebuild
docker-compose down
docker-compose up --build
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5",      // File uploads (Fix #2)
    "sqlite3": "^5.1.6",     // Database (Fix #1)
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"      // Hot reload (Fix #5)
  }
}
```

---

## 🎉 Success Checklist

- [ ] Docker container running
- [ ] Hot reload working (edit file, see changes)
- [ ] Login successful (admin/admin123)
- [ ] Sample images displaying
- [ ] Create slideshow works
- [ ] Images save to assets/images/uploads/
- [ ] Edit slideshow shows existing images
- [ ] Add more images (appends, doesn't replace)
- [ ] Drag-drop reordering works
- [ ] Description has gradient fade
- [ ] Placeholder shows for missing images
- [ ] Data persists after restart

---

## 🚀 Production Deployment

```bash
# Update docker-compose.yml
environment:
  - NODE_ENV=production

# Use production command
command: npm start

# Build and deploy
docker-compose up -d --build
```

---

## 📞 Support

**Default Login:**

- Username: `admin`
- Password: `admin123`

**Change password in Users section!**

---

## 🎯 Summary of ALL 7 Fixes

| # | Fix | Status | Benefit |
|---|-----|--------|---------|
| 1 | Persistent Database | ✅ | Data never lost |
| 2 | Upload to assets/images/uploads | ✅ | Proper file storage |
| 3 | Sample images | ✅ | Ready to demo |
| 4 | Placeholder fallback | ✅ | No broken images |
| 5 | Docker hot reload | ✅ | Instant development |
| 6 | Drag-drop reorder | ✅ | Easy image sorting |
| 7 | Gradient fade | ✅ | Beautiful UI |

**All features working and production-ready!** 🚀

---

**Version:** 2.1.0
**Date:** February 2026
**Status:** ✅ Production Ready
