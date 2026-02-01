# RSU Islam Group Slideshow - Complete Implementation Guide

## 📦 Quick Start Guide for macOS with Docker

### Prerequisites
1. **Install Docker Desktop for Mac**
   ```bash
   # Download from: https://www.docker.com/products/docker-desktop/
   # Or install via Homebrew:
   brew install --cask docker
   ```

2. **Verify Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

---

## 🏗️ Project Structure

Create the following directory structure:

```
rsu-slideshow/
├── docker-compose.yml
├── .env
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── .dockerignore
│   └── src/
│       ├── server.js
│       ├── db.js
│       ├── db-init.sql
│       ├── seed.sql
│       ├── middleware/
│       │   └── authMiddleware.js
│       └── routes/
│           ├── auth.js
│           ├── users.js
│           ├── slideshows.js
│           ├── stats.js
│           └── settings.js
├── frontend/
│   └── public/
│       ├── index.html
│       ├── admin.html
│       ├── css/
│       │   ├── slideshow.css
│       │   └── admin.css
│       ├── js/
│       │   ├── slideshow.js
│       │   └── admin.js
│       └── assets/
│           ├── placeholder.png
│           ├── logo-sample.png
│           └── sample/
│               ├── laser-hemorrhidoplasty/
│               │   ├── lh1.jpg
│               │   ├── lh2.jpg
│               │   └── lh3.jpg
│               └── emergency-services/
│                   ├── er1.jpg
│                   ├── er2.jpg
│                   └── er3.jpg
└── data/
    ├── db/          (auto-created by Docker)
    └── uploads/     (auto-created by Docker)
```

---

## 🚀 Step-by-Step Implementation

### Step 1: Create Project Directory

```bash
# Create main project directory
mkdir -p ~/rsu-slideshow
cd ~/rsu-slideshow

# Create all subdirectories
mkdir -p backend/src/middleware backend/src/routes
mkdir -p frontend/public/css frontend/public/js frontend/public/assets/sample
mkdir -p frontend/public/assets/sample/laser-hemorrhidoplasty
mkdir -p frontend/public/assets/sample/emergency-services
mkdir -p data/uploads
```

### Step 2: Copy All Files

**Use the files from the previous documents:**

1. **BACKEND-FILES.md** - Contains all backend files
2. **FRONTEND-FILES-PART1.md** - Contains HTML files
3. **FRONTEND-FILES-PART2.md** - Contains JS and CSS files

Copy each file to its respective location as shown in the project structure above.

### Step 3: Create Environment File

Create `.env` in the project root:

```bash
cat > .env << 'EOF'
# Database Configuration
POSTGRES_DB=rsu_slideshow
POSTGRES_USER=rsu_admin
POSTGRES_PASSWORD=ChangeThisSecurePassword123!

# Backend Configuration
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost

# Database URL (internal Docker network)
DATABASE_URL=postgresql://rsu_admin:ChangeThisSecurePassword123!@postgres:5432/rsu_slideshow
EOF
```

**⚠️ IMPORTANT:** Change the passwords and JWT_SECRET before deploying to production!

### Step 4: Add Sample Images

**Option A: Download Free Medical Images**

```bash
# Install wget if not available
brew install wget

# Download sample images (example from Unsplash)
cd frontend/public/assets/sample/laser-hemorrhidoplasty
wget -O lh1.jpg "https://source.unsplash.com/800x600/?hospital,medical"
wget -O lh2.jpg "https://source.unsplash.com/800x600/?doctor,healthcare"
wget -O lh3.jpg "https://source.unsplash.com/800x600/?medical,equipment"

cd ../emergency-services
wget -O er1.jpg "https://source.unsplash.com/800x600/?emergency,hospital"
wget -O er2.jpg "https://source.unsplash.com/800x600/?ambulance,medical"
wget -O er3.jpg "https://source.unsplash.com/800x600/?hospital,emergency"

cd ../../..
```

**Option B: Create Placeholder Images with ImageMagick**

```bash
# Install ImageMagick
brew install imagemagick

# Create placeholder images
cd frontend/public/assets

# Logo placeholder
convert -size 200x200 xc:#16a34a -gravity center \
  -pointsize 40 -fill white -annotate +0+0 "RSU\nIslam" logo-sample.png

# General placeholder
convert -size 800x600 xc:#6b7280 -gravity center \
  -pointsize 60 -fill white -annotate +0+0 "No Image" placeholder.png

# Sample images for laser hemorrhidoplasty
cd sample/laser-hemorrhidoplasty
convert -size 1920x1080 xc:#3b82f6 -gravity center \
  -pointsize 80 -fill white -annotate +0+0 "Laser\nHemorrhidoplasty\nService" lh1.jpg
convert -size 1920x1080 xc:#8b5cf6 -gravity center \
  -pointsize 80 -fill white -annotate +0+0 "Modern\nEquipment" lh2.jpg
convert -size 1920x1080 xc:#06b6d4 -gravity center \
  -pointsize 80 -fill white -annotate +0+0 "Expert\nMedical Team" lh3.jpg

# Sample images for emergency services
cd ../emergency-services
convert -size 1920x1080 xc:#dc2626 -gravity center \
  -pointsize 80 -fill white -annotate +0+0 "24/7\nEmergency\nServices" er1.jpg
convert -size 1920x1080 xc:#ea580c -gravity center \
  -pointsize 80 -fill white -annotate +0+0 "Rapid\nResponse" er2.jpg
convert -size 1920x1080 xc:#f59e0b -gravity center \
  -pointsize 80 -fill white -annotate +0+0 "Advanced\nLife Support" er3.jpg

cd ../../../../..
```

**Option C: Use Your Own Images**

Simply copy your actual hospital images to the respective folders.

### Step 5: Build and Run with Docker

```bash
# Make sure you're in the project root
cd ~/rsu-slideshow

# Build and start containers
docker-compose up --build -d

# Check if containers are running
docker-compose ps

# Expected output:
# NAME                    STATUS    PORTS
# rsu-slideshow-backend   running   0.0.0.0:3000->3000/tcp
# rsu-slideshow-postgres  running   5432/tcp
```

### Step 6: View Logs (Troubleshooting)

```bash
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# View database logs only
docker-compose logs -f postgres
```

### Step 7: Access the Application

**TV Slideshow Display:**
- Open browser: http://localhost:3000
- Press F11 for fullscreen
- Slideshow will auto-start with sample images

**Admin Panel:**
- Open browser: http://localhost:3000/admin.html
- Default credentials:
  - Email: `admin@rsuislam.com`
  - Password: `admin123`

**⚠️ CHANGE DEFAULT PASSWORD IMMEDIATELY!**

---

## 🔧 Common Docker Commands

### Start/Stop Application

```bash
# Start containers
docker-compose up -d

# Stop containers (keeps data)
docker-compose down

# Stop and remove all data (⚠️ WARNING: Deletes database!)
docker-compose down -v
```

### Restart After Code Changes

```bash
# Restart backend only
docker-compose restart backend

# Rebuild and restart everything
docker-compose up --build -d
```

### Database Management

```bash
# Connect to PostgreSQL directly
docker-compose exec postgres psql -U rsu_admin -d rsu_slideshow

# Run SQL commands (example: list tables)
docker-compose exec postgres psql -U rsu_admin -d rsu_slideshow -c '\dt'

# Backup database
docker-compose exec postgres pg_dump -U rsu_admin rsu_slideshow > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U rsu_admin rsu_slideshow
```

### View Backend Files

```bash
# List uploaded files
docker-compose exec backend ls -la /app/uploads

# Check backend logs in real-time
docker-compose logs -f backend
```

---

## 📱 Using the Admin Panel

### 1. Login
- Navigate to http://localhost:3000/admin.html
- Enter credentials
- Click "Sign In"

### 2. Create a Slideshow
- Go to "Slideshow Management" tab
- Click "New Slideshow" button
- Enter:
  - Title: "Cardiology Services"
  - Description: "Advanced cardiac care"
  - Folder Name: "cardiology-services"
- Click Create

### 3. Add Slides
- Click on the slideshow to select it
- In "Add New Slides" section:
  - Enter Title: "Cardiac Catheterization"
  - Enter Description: "State-of-the-art cath lab facility"
  - Choose file(s) or enter image URL
- Click "Upload Slides"

### 4. Activate Slideshow
- Toggle the green/gray switch next to slideshow name
- Green = Active (will appear in TV display)
- Gray = Inactive

### 5. Manage Slide Order
- Use the "Order" input to change display sequence
- Lower numbers appear first
- Changes save automatically

### 6. Configure Display Settings
- Go to "Settings" tab
- Adjust:
  - Font family (e.g., "Arial, sans-serif")
  - Title font size (default: 48px)
  - Description font size (default: 24px)
  - Slide interval (default: 8000ms = 8 seconds)
  - Upload company logo
  - Choose logo position
- Click "Save Settings"

### 7. User Management (Admin Only)
- Go to "Users" tab
- Click "New User"
- Enter email, password, name
- Choose role: Admin or User
- Admins can manage users; Users can only manage slideshows

### 8. View Statistics
- Go to "Stats" tab
- See:
  - Total slideshows
  - Active/inactive counts
  - Total slides
  - View counts per slide
  - Top viewed slides

---

## 🖥️ Setting Up TV Displays

### For macOS TV Display

```bash
# Create a startup script
cat > ~/start-slideshow.sh << 'EOF'
#!/bin/bash
# Start Docker containers
cd ~/rsu-slideshow
docker-compose up -d

# Wait for backend to be ready
sleep 5

# Open slideshow in full screen (using Chrome)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --start-fullscreen \
  --kiosk \
  --app=http://localhost:3000

EOF

chmod +x ~/start-slideshow.sh
```

**To auto-start on login:**
1. Open System Preferences → Users & Groups → Login Items
2. Click "+" button
3. Add `start-slideshow.sh`

### For Linux TV Display (Ubuntu/Debian)

```bash
# Install chromium in kiosk mode
sudo apt update
sudo apt install chromium-browser unclutter

# Create autostart script
mkdir -p ~/.config/autostart

cat > ~/.config/autostart/slideshow.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=RSU Slideshow
Exec=/usr/bin/chromium-browser --start-fullscreen --kiosk http://localhost:3000
EOF
```

### For Raspberry Pi

```bash
# Install chromium
sudo apt install chromium-browser

# Edit autostart
nano ~/.config/lxsession/LXDE-pi/autostart

# Add line:
@chromium-browser --start-fullscreen --kiosk http://YOUR_SERVER_IP:3000
```

---

## 🌐 Deploying to Production Server

### Option 1: Deploy on Ubuntu Server

```bash
# On your server, install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone or copy project files
scp -r ~/rsu-slideshow user@server:/home/user/

# On server, start application
cd /home/user/rsu-slideshow
docker-compose up -d
```

### Option 2: Use Nginx Reverse Proxy (Recommended)

```bash
# Install Nginx
sudo apt install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/rsu-slideshow

# Add configuration:
server {
    listen 80;
    server_name slideshow.rsuislam.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/rsu-slideshow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 3: Enable HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d slideshow.rsuislam.com

# Auto-renewal is configured automatically
```

---

## 🔒 Security Checklist

- [ ] Change default admin password
- [ ] Change JWT_SECRET in .env
- [ ] Change database passwords
- [ ] Enable HTTPS in production
- [ ] Configure firewall (allow only 80/443)
- [ ] Set up regular database backups
- [ ] Disable debug mode (NODE_ENV=production)
- [ ] Review CORS settings
- [ ] Set up monitoring/logging

---

## 🐛 Troubleshooting

### Problem: Backend won't start

```bash
# Check logs
docker-compose logs backend

# Common fix: Remove and rebuild
docker-compose down
docker-compose up --build
```

### Problem: Database connection failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart database
docker-compose restart postgres

# Check environment variables
docker-compose exec backend env | grep DATABASE
```

### Problem: Images not loading

```bash
# Check uploads directory permissions
docker-compose exec backend ls -la /app/uploads

# Create uploads directory if missing
docker-compose exec backend mkdir -p /app/uploads
docker-compose exec backend chmod 755 /app/uploads
```

### Problem: Can't login to admin panel

```bash
# Reset admin password via database
docker-compose exec postgres psql -U rsu_admin -d rsu_slideshow

# In psql:
UPDATE users SET password = '$2b$10$XZkV3kJYL0YQsZQIZ5X0KO7y5H0vKGQxKRHW6J5FhQPJX8X0K0K0K' WHERE email = 'admin@rsuislam.com';
-- Password is now: admin123
\q
```

### Problem: Port 3000 already in use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process or change port in docker-compose.yml
# Change "3000:3000" to "8080:3000" for port 8080
```

---

## 📊 Monitoring and Maintenance

### View Application Status

```bash
# Check container health
docker-compose ps

# Check disk usage
docker system df

# Check logs for errors
docker-compose logs --tail=100 backend | grep -i error
```

### Backup Strategy

```bash
# Create backup script
cat > ~/backup-slideshow.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/rsu-backups

mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U rsu_admin rsu_slideshow > $BACKUP_DIR/db_$DATE.sql

# Backup uploaded files
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz data/uploads/

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x ~/backup-slideshow.sh

# Schedule daily backups with cron
crontab -e
# Add line:
0 2 * * * ~/backup-slideshow.sh
```

---

## 🎉 Success Checklist

- [ ] Docker Desktop installed and running
- [ ] Project structure created
- [ ] All files copied correctly
- [ ] .env file configured
- [ ] Sample images added
- [ ] `docker-compose up -d` successful
- [ ] Slideshow accessible at http://localhost:3000
- [ ] Admin panel accessible at http://localhost:3000/admin.html
- [ ] Successfully logged in as admin
- [ ] Created test slideshow
- [ ] Uploaded test slides
- [ ] Slides display correctly in TV view
- [ ] Settings can be changed
- [ ] Statistics showing correctly

---

## 📚 Additional Resources

- Docker Documentation: https://docs.docker.com
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
- Alpine.js Documentation: https://alpinejs.dev

---

## 💡 Next Steps

1. **Customize Design**: Modify CSS files to match RSU Islam branding
2. **Add More Features**: Consider adding video support, custom animations
3. **Set Up Multiple Displays**: Deploy to different hospital locations
4. **Mobile App**: Create mobile admin app with React Native or Flutter
5. **Analytics**: Add Google Analytics or custom tracking
6. **Backup Automation**: Set up automated cloud backups

---

## 🆘 Support

For issues or questions:
1. Check troubleshooting section above
2. Review Docker logs: `docker-compose logs -f`
3. Check GitHub issues (if applicable)
4. Contact system administrator

---

**Created for RSU Islam Group**
**Version 1.0 - February 2026**
