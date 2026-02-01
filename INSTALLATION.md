# Installation Guide - RSU Islam Group Slideshow

Complete step-by-step instructions for setting up the application locally on macOS and deploying to a server.

## Prerequisites

### For macOS Local Development

1. **Install Docker Desktop for Mac**
   - Download from: https://www.docker.com/products/docker-desktop
   - Install and start Docker Desktop
   - Verify installation:
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Install Git** (if not already installed)
   ```bash
   git --version
   # If not installed, download from https://git-scm.com/download/mac
   ```

3. **Text Editor** (Optional but recommended)
   - VS Code: https://code.visualstudio.com/

## Installation Steps

### Step 1: Create Project Structure

Create a new directory and navigate to it:

```bash
mkdir rsu-islam-slideshow
cd rsu-islam-slideshow
```

### Step 2: Create All Required Files

You'll need to create the following directory structure:

```
rsu-islam-slideshow/
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
└── frontend/
    └── public/
        ├── index.html
        ├── admin.html
        ├── css/
        │   ├── slideshow.css
        │   └── admin.css
        ├── js/
        │   ├── slideshow.js
        │   └── admin.js
        └── assets/
            ├── placeholder.png
            ├── logo-sample.png
            └── sample/
                ├── laser-hemorrhidoplasty/
                └── emergency-services/
```

### Step 3: Copy File Contents

Copy all the file contents provided in the download package into their respective locations.

### Step 4: Add Sample Images

Place sample images in the following directories:
- `frontend/public/assets/sample/laser-hemorrhidoplasty/` (add 2-3 .jpg images)
- `frontend/public/assets/sample/emergency-services/` (add 2-3 .jpg images)

For placeholder.png and logo-sample.png, you can:
- Use any PNG images you have
- Download free images from Unsplash or Pexels
- Create simple colored rectangles in any image editor

### Step 5: Create Environment File

Create a `.env` file in the root directory:

```bash
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=rsu_admin
DB_PASSWORD=SecurePassword123!
DB_NAME=rsu_slideshow

# JWT Secret (change this to a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Application Port
PORT=8080

# Node Environment
NODE_ENV=development
```

### Step 6: Start the Application

```bash
# Build and start all containers
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

Wait for the containers to start. You should see:
```
postgres_1  | database system is ready to accept connections
backend_1   | Server running on port 8080
backend_1   | Database initialized successfully
```

### Step 7: Create Admin User

Open a new terminal window and run:

```bash
# Access the backend container
docker-compose exec backend sh

# Inside the container, run Node.js
node

# Copy and paste this code in the Node REPL:
const bcrypt = require('bcryptjs');
const db = require('./src/db');
(async () => {
  const hash = await bcrypt.hash('AdminPassword123', 10);
  await db.query(
    "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin') ON CONFLICT (email) DO NOTHING",
    ['admin@rsuislam.local', hash]
  );
  console.log('✓ Admin user created');
  process.exit(0);
})();
```

Press Enter, then Ctrl+C to exit Node REPL, then type `exit` to leave the container.

### Step 8: Access the Application

Open your browser and navigate to:

- **Admin Panel**: http://localhost:8080/admin.html
  - Login with: admin@rsuislam.local / AdminPassword123
  
- **TV Slideshow**: http://localhost:8080/index.html

### Step 9: Load Sample Data (Optional)

If you want sample slideshows pre-loaded:

```bash
# Access the backend container
docker-compose exec backend sh

# Run the seed script
node -e "const fs = require('fs'); const db = require('./src/db'); const sql = fs.readFileSync('./src/seed.sql').toString(); db.pool.query(sql).then(() => { console.log('✓ Sample data loaded'); process.exit(0); });"

exit
```

## Using the Application

### Admin Panel Features

1. **Login**
   - Use the credentials created in Step 7
   - JWT token is stored in localStorage

2. **Create a Slideshow**
   - Click "Slideshows" tab
   - Click "+ New" button
   - Enter title, description, and folder name
   - The folder will be created automatically

3. **Upload Images**
   - Select a slideshow from the list
   - Click "Edit" to see details
   - Use the upload form to add multiple images
   - Or enter an image URL
   - Set title and description for each slide

4. **Manage Settings**
   - Click "Settings" tab
   - Adjust font family, sizes, and transition timing
   - Add company logo URL
   - Click "Save Settings"

5. **View Statistics**
   - Click "Stats" tab
   - See slide counts, active slideshows
   - View most displayed slides

6. **User Management**
   - Click "Users" tab
   - Add new users (admin or regular)
   - Assign roles and permissions

### TV Slideshow Page

1. Open http://localhost:8080/index.html in your TV browser
2. Press F11 for fullscreen mode
3. Slideshow will auto-cycle through active slides
4. Pagination dots show progress at bottom-right

## Troubleshooting

### Port Already in Use

If port 8080 or 5432 is already in use:

Edit `docker-compose.yml`:
```yaml
services:
  backend:
    ports:
      - "8081:8080"  # Change 8080 to 8081
  postgres:
    ports:
      - "5433:5432"  # Change 5432 to 5433
```

Then access at http://localhost:8081

### Database Connection Issues

Check if PostgreSQL is running:
```bash
docker-compose ps

# Restart if needed
docker-compose restart postgres
```

### Clear All Data and Restart

```bash
docker-compose down -v  # Removes volumes
docker-compose up --build
```

Then recreate the admin user (Step 7).

### View Logs

```bash
# All logs
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Database only
docker-compose logs -f postgres
```

### File Upload Not Working

Ensure the uploads directory has correct permissions:
```bash
docker-compose exec backend sh
chmod -R 777 /usr/src/app/frontend/public/assets
exit
```

## Deployment to Production Server

### Linux Server with Docker

1. **Install Docker and Docker Compose** on your server:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
```

2. **Copy Project Files** to server:
```bash
# From your Mac
rsync -avz rsu-islam-slideshow/ user@your-server:/opt/rsu-islam-slideshow/
```

3. **Update Environment Variables**:
```bash
cd /opt/rsu-islam-slideshow
nano .env

# Change JWT_SECRET to a secure random string
# Update passwords
```

4. **Start Application**:
```bash
docker-compose up -d --build
```

5. **Set up Nginx Reverse Proxy** (recommended):

```nginx
server {
    listen 80;
    server_name slideshow.rsuislam.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

6. **Set up SSL** with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d slideshow.rsuislam.com
```

### For TV Display

1. Open the slideshow URL on your TV browser
2. Enter fullscreen mode (F11 on most browsers)
3. Disable screensaver/sleep mode on the TV/device
4. Ensure stable network connection

## Maintenance

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U rsu_admin rsu_slideshow > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U rsu_admin rsu_slideshow < backup.sql
```

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

### Monitor Disk Space

Images are stored in `frontend/public/assets/`. Monitor disk usage:
```bash
du -sh frontend/public/assets/
```

## Security Recommendations

1. **Change Default Credentials** immediately after first login
2. **Use Strong JWT_SECRET** in production
3. **Enable HTTPS** with SSL certificate
4. **Regular Backups** of database and images
5. **Update Dependencies** regularly
6. **Firewall Rules** to restrict access to admin panel
7. **Rate Limiting** on login endpoints (implement in production)

## Performance Optimization

### For Large Image Collections

1. **Optimize Images** before upload:
   - Resize to max 1920x1080 for full HD displays
   - Compress with tools like ImageOptim or TinyPNG
   - Use JPEG for photos, PNG for graphics

2. **Implement Image CDN** (optional):
   - Use Cloudinary or AWS S3 for image hosting
   - Update `file_path` to use CDN URLs

3. **Database Indexes** (already included in schema):
   - Indexes on `slideshow_id`, `is_active`
   - Composite index on frequently queried columns

## Support

For additional help:
1. Check application logs: `docker-compose logs -f`
2. Verify Docker status: `docker-compose ps`
3. Test database connection: `docker-compose exec postgres psql -U rsu_admin -d rsu_slideshow`

## Next Steps

After successful installation:
1. ✅ Create your first slideshow
2. ✅ Upload hospital service images
3. ✅ Configure display settings
4. ✅ Set up TVs to display slideshow URL
5. ✅ Train staff on admin panel usage
6. ✅ Set up regular backups
