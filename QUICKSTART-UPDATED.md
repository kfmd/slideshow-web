# 🚀 QUICK START GUIDE - UPDATED

## Method 1: Quick Deploy (Recommended)

```bash
# 1. Navigate to project
cd rsu-slideshow-webapp

# 2. Rebuild container with sqlite3 tools
docker-compose down
docker-compose up -d --build

# 3. Wait for it to start (about 10 seconds)
docker-compose logs -f

# 4. Load sample data (Now with sqlite3 installed!)
docker-compose exec rsu-slideshow sqlite3 database/rsu_slideshow.db < database/sample-data.sql

# 5. Done! Access application
```

**Access:**
- **Admin:** http://localhost:3000/index.html
- **Display:** http://localhost:3000/slideshow.html
- **Login:** admin / admin123

---

## Method 2: Using Node.js Script (No sqlite3 needed)

```bash
# Start container
docker-compose up -d

# Run Node.js script to load samples
docker-compose exec rsu-slideshow node load-sample-data.js

# OR run locally (if you have Node.js)
npm run load-samples
```

---

## Method 3: Manual via API (Test API endpoints)

```bash
# Start container
docker-compose up -d

# Login and create slideshows via admin panel
# 1. Go to http://localhost:3000/index.html
# 2. Login: admin / admin123
# 3. Click "Create Slideshow"
# 4. Upload the sample images from assets/images/uploads/
```

---

## 🧪 Verify Everything Works

### Test 1: Check Database
```bash
docker-compose exec rsu-slideshow sqlite3 database/rsu_slideshow.db "SELECT * FROM slideshows;"
```

**Expected:** 2 rows (Sirkumsisi and Homecare)

### Test 2: Check Images
```bash
docker-compose exec rsu-slideshow ls -la assets/images/uploads/
```

**Expected:** 4 files (circ-1.jpg, circ-2.jpg, hc-1.jpg, hc-2.jpg)

### Test 3: Check API
```bash
curl http://localhost:3000/api/slideshows/active
```

**Expected:** JSON with 2 active slideshows

---

## 🔧 Troubleshooting

### Issue: "sqlite3: not found"

**Solution:** Rebuild container with updated Dockerfile
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Issue: "version is obsolete" warning

**Fixed!** The warning is harmless and has been removed in the updated docker-compose.yml

### Issue: Sample data already loaded

**Solution:** Clear and reload
```bash
# Enter container
docker-compose exec rsu-slideshow sh

# Delete existing data
sqlite3 database/rsu_slideshow.db "DELETE FROM images; DELETE FROM slideshows WHERE id > 0;"

# Exit and reload
exit
docker-compose exec rsu-slideshow node load-sample-data.js
```

### Issue: Port 3000 already in use

**Solution:** Use different port
```bash
# Edit docker-compose.yml
ports:
  - "3001:3000"  # Change to 3001

# Restart
docker-compose down
docker-compose up -d

# Access at http://localhost:3001
```

---

## ✅ Complete Setup Checklist

- [ ] Docker container running
- [ ] No errors in logs
- [ ] Sample data loaded (2 slideshows)
- [ ] 4 sample images in uploads/
- [ ] Can access http://localhost:3000
- [ ] Can login with admin/admin123
- [ ] Can see 2 sample slideshows
- [ ] Can create new slideshow
- [ ] Images upload successfully
- [ ] Hot reload working (edit CSS → see changes)

---

## 🎯 All Loading Methods Compared

| Method | Speed | Requires | Best For |
|--------|-------|----------|----------|
| Node.js Script | ⚡ Fast | Nothing | First time setup |
| SQLite CLI | ⚡ Fast | Rebuild | Multiple reloads |
| Manual API | 🐌 Slow | Browser | Testing uploads |

**Recommendation:** Use Node.js script for easiest setup!

---

## 📝 Commands Reference

```bash
# Start
docker-compose up -d

# Stop  
docker-compose down

# Restart
docker-compose restart

# Rebuild (after Dockerfile changes)
docker-compose up -d --build

# View logs
docker-compose logs -f

# Enter container
docker-compose exec rsu-slideshow sh

# Load samples (Node.js)
docker-compose exec rsu-slideshow node load-sample-data.js

# Load samples (SQLite - after rebuild)
docker-compose exec rsu-slideshow sqlite3 database/rsu_slideshow.db < database/sample-data.sql

# Check database
docker-compose exec rsu-slideshow sqlite3 database/rsu_slideshow.db "SELECT COUNT(*) FROM slideshows;"

# Reset database
docker-compose exec rsu-slideshow rm -f database/rsu_slideshow.db
docker-compose restart
```

---

## 🚀 Recommended First-Time Setup

```bash
# Complete setup in 4 commands:

# 1. Start
docker-compose up -d --build

# 2. Wait 10 seconds
sleep 10

# 3. Load samples
docker-compose exec rsu-slideshow node load-sample-data.js

# 4. Open browser
open http://localhost:3000/index.html

# Done! Login with admin/admin123
```

---

## 💡 Pro Tips

1. **Hot Reload:** Edit any file → changes appear instantly!
2. **Database Persistence:** Data stays even after restart
3. **File Uploads:** Images save to assets/images/uploads/
4. **Drag & Drop:** Reorder images in edit mode
5. **Gradient Fade:** Long descriptions look professional

---

**Everything should work perfectly now!** 🎉

If you still see errors, check:
1. Docker is running
2. Port 3000 is free
3. You're in the right directory
4. Container is healthy: `docker-compose ps`
