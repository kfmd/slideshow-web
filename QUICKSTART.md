# 🚀 QUICK START GUIDE

## Instant Deployment (Copy-Paste)

```bash
# Navigate to project
cd rsu-slideshow-webapp

# Start everything with hot reload
docker-compose up -d

# Watch logs
docker-compose logs -f
```

**Done!** Access at:
- **Admin:** http://localhost:3000/index.html
- **Display:** http://localhost:3000/slideshow.html

**Login:** admin / admin123

---

## Load Sample Data

```bash
# Option 1: Via Docker
docker-compose exec rsu-slideshow sh -c \
  "sqlite3 database/rsu_slideshow.db < database/sample-data.sql"

# Option 2: Direct
sqlite3 database/rsu_slideshow.db < database/sample-data.sql
```

---

## Verify Hot Reload Works

1. Edit `css/styles.css` → Change a color
2. Edit `index.html` → Change a text
3. Refresh browser → See changes **INSTANTLY!**
4. No restart needed! ✨

---

## Test All 7 Fixes

### ✅ Fix #1: Database Persistence
```
1. Create a slideshow
2. docker-compose restart
3. Check slideshow still exists
```

### ✅ Fix #2: File Uploads
```
1. Create slideshow with images
2. Check: ls assets/images/uploads/
3. Files should be there!
```

### ✅ Fix #3: Sample Images
```
1. Check: ls assets/images/uploads/
2. Should see: circ-1.jpg, circ-2.jpg, hc-1.jpg, hc-2.jpg
```

### ✅ Fix #4: Placeholder
```
1. Delete an uploaded image file
2. View slideshow list
3. Should see placeholder.jpg instead
```

### ✅ Fix #5: Hot Reload
```
1. Edit css/styles.css → change color
2. Refresh browser
3. Changes appear instantly!
```

### ✅ Fix #6: Drag-Drop
```
1. Edit a slideshow
2. Drag images to reorder
3. Order changes immediately
```

### ✅ Fix #7: Gradient
```
1. View slideshows list
2. Long descriptions fade with gradient
3. Click to expand
```

---

## Common Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# View logs
docker-compose logs -f

# Access container
docker-compose exec rsu-slideshow sh

# Reset database
rm database/rsu_slideshow.db
docker-compose restart
```

---

## File Locations

```
Configuration:
- docker-compose.yml
- package.json

Code:
- index.html (admin)
- slideshow.html (display)
- js/app.js (all logic)
- css/styles.css (all styles)
- server.js (API)

Database:
- database/rsu_slideshow.db
- database/schema.sql
- database/sample-data.sql

Images:
- assets/images/placeholder.jpg
- assets/images/uploads/*.jpg
```

---

## Troubleshooting One-Liners

```bash
# Can't access? Check if running:
docker ps | grep rsu-slideshow

# Database issues? Reset it:
rm database/rsu_slideshow.db && docker-compose restart

# Permission issues?
chmod -R 755 assets/images/

# Port 3000 busy?
# Edit docker-compose.yml: "3001:3000"

# See all API calls:
docker-compose logs -f | grep POST

# Check database content:
sqlite3 database/rsu_slideshow.db "SELECT * FROM slideshows;"
```

---

## Production Checklist

- [ ] Change admin password
- [ ] Set NODE_ENV=production
- [ ] Configure proper domain
- [ ] Set up SSL/HTTPS
- [ ] Configure firewall
- [ ] Set up backups
- [ ] Test all features
- [ ] Load real hospital images
- [ ] Train users

---

**Everything is ready! Start creating slideshows!** 🎉
