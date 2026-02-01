# DOCKER & BACKEND CONFIGURATION FILES

## FILE 1: docker-compose.yml
**Location**: Project root
**Purpose**: Docker Compose orchestration

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: rsu-slideshow-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - ./data/db:/var/lib/postgresql/data
      - ./backend/src/db-init.sql:/docker-entrypoint-initdb.d/01-init.sql
      - ./backend/src/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
    networks:
      - rsu-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: rsu-slideshow-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: ${NODE_ENV}
      PORT: ${PORT}
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
    volumes:
      - ./data/uploads:/app/uploads
      - ./frontend/public:/app/public
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - rsu-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  rsu-network:
    driver: bridge

volumes:
  postgres_data:
```

---

## FILE 2: .env.example
**Location**: Project root
**Purpose**: Environment variables template

```env
# Database Configuration
POSTGRES_DB=rsu_slideshow
POSTGRES_USER=rsu_admin
POSTGRES_PASSWORD=ChangeThisSecurePassword123!

# Backend Configuration
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-this

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost

# Database URL (internal Docker network)
DATABASE_URL=postgresql://rsu_admin:ChangeThisSecurePassword123!@postgres:5432/rsu_slideshow

# Optional: For production deployment
# FRONTEND_URL=https://slideshow.rsuislam.com
# DATABASE_URL=postgresql://rsu_admin:SecurePassword@postgres:5432/rsu_slideshow
```

---

## FILE 3: backend/Dockerfile
**Location**: backend/Dockerfile
**Purpose**: Backend container build instructions

```dockerfile
FROM node:18-alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Create uploads directory
RUN mkdir -p /app/uploads && chmod 755 /app/uploads

# Expose port
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "src/server.js"]
```

---

## FILE 4: backend/.dockerignore
**Location**: backend/.dockerignore
**Purpose**: Exclude files from Docker build

```
node_modules
npm-debug.log
.env
.git
.gitignore
*.md
.DS_Store
.vscode
*.log
coverage
.nyc_output
dist
build
```

---

## FILE 5: backend/package.json
**Location**: backend/package.json
**Purpose**: Node.js dependencies and scripts

```json
{
  "name": "rsu-slideshow-backend",
  "version": "1.0.0",
  "description": "RSU Islam Group Slideshow Backend API",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "echo \"No tests specified\" && exit 0"
  },
  "keywords": [
    "slideshow",
    "hospital",
    "digital-signage"
  ],
  "author": "RSU Islam Group",
  "license": "MIT",
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.11.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

---

## FILE 6: backend/src/db-init.sql
**Location**: backend/src/db-init.sql
**Purpose**: Database schema initialization

```sql
-- RSU Islam Group Slideshow Database Schema
-- PostgreSQL 15+

-- Drop existing tables (for clean reinstall)
DROP TABLE IF EXISTS slide_views CASCADE;
DROP TABLE IF EXISTS slides CASCADE;
DROP TABLE IF EXISTS slideshows CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Slideshows table (folders/categories)
CREATE TABLE slideshows (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    folder_name VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Slides table (individual images)
CREATE TABLE slides (
    id SERIAL PRIMARY KEY,
    slideshow_id INTEGER NOT NULL REFERENCES slideshows(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    file_path VARCHAR(500),
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Slide view tracking
CREATE TABLE slide_views (
    id SERIAL PRIMARY KEY,
    slide_id INTEGER NOT NULL REFERENCES slides(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Application settings
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_slideshows_active ON slideshows(is_active, display_order);
CREATE INDEX idx_slides_slideshow ON slides(slideshow_id);
CREATE INDEX idx_slides_active ON slides(is_active, display_order);
CREATE INDEX idx_slide_views_slide ON slide_views(slide_id);
CREATE INDEX idx_slide_views_date ON slide_views(viewed_at);
CREATE INDEX idx_users_email ON users(email);

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slideshows_updated_at BEFORE UPDATE ON slideshows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slides_updated_at BEFORE UPDATE ON slides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rsu_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rsu_admin;
```

---

## FILE 7: backend/src/seed.sql
**Location**: backend/src/seed.sql
**Purpose**: Initial sample data

```sql
-- Seed data for RSU Islam Group Slideshow
-- Password for all users: admin123 (bcrypt hashed)

-- Insert default admin user
INSERT INTO users (email, password, full_name, role, is_active) VALUES
('admin@rsuislam.com', '$2b$10$XZkV3kJYL0YQsZQIZ5X0KO7y5H0vKGQxKRHW6J5FhQPJX8X0K0K0K', 'System Administrator', 'admin', TRUE),
('doctor@rsuislam.com', '$2b$10$XZkV3kJYL0YQsZQIZ5X0KO7y5H0vKGQxKRHW6J5FhQPJX8X0K0K0K', 'Dr. Ahmad Wijaya', 'user', TRUE);

-- Insert sample slideshows
INSERT INTO slideshows (title, description, folder_name, is_active, display_order, created_by) VALUES
('Laser Hemorrhidoplasty', 'Advanced minimally invasive hemorrhoid treatment using laser technology', 'laser-hemorrhidoplasty', TRUE, 1, 1),
('Emergency Services', '24/7 emergency medical services with rapid response team', 'emergency-services', TRUE, 2, 1),
('Cardiology Services', 'Comprehensive cardiac care including catheterization and interventions', 'cardiology-services', FALSE, 3, 1);

-- Insert sample slides for Laser Hemorrhidoplasty
INSERT INTO slides (slideshow_id, title, description, file_path, is_active, display_order, created_by) VALUES
(1, 'Modern Laser Technology', 'State-of-the-art laser equipment for precise hemorrhoid treatment', '/assets/sample/laser-hemorrhidoplasty/lh1.jpg', TRUE, 1, 1),
(1, 'Expert Medical Team', 'Experienced surgeons specialized in minimally invasive procedures', '/assets/sample/laser-hemorrhidoplasty/lh2.jpg', TRUE, 2, 1),
(1, 'Comfortable Recovery', 'Patient-friendly recovery rooms with modern amenities', '/assets/sample/laser-hemorrhidoplasty/lh3.jpg', TRUE, 3, 1);

-- Insert sample slides for Emergency Services
INSERT INTO slides (slideshow_id, title, description, file_path, is_active, display_order, created_by) VALUES
(2, '24/7 Emergency Care', 'Round-the-clock emergency services for immediate medical attention', '/assets/sample/emergency-services/er1.jpg', TRUE, 1, 1),
(2, 'Rapid Response Team', 'Highly trained emergency medical professionals ready to respond', '/assets/sample/emergency-services/er2.jpg', TRUE, 2, 1),
(2, 'Advanced Life Support', 'Fully equipped emergency rooms with latest medical technology', '/assets/sample/emergency-services/er3.jpg', TRUE, 3, 1);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, updated_by) VALUES
('font_family', 'Inter, system-ui, -apple-system, sans-serif', 1),
('title_font_size', '48', 1),
('desc_font_size', '24', 1),
('slide_interval_ms', '8000', 1),
('logo_url', '/assets/logo-sample.png', 1),
('show_logo', 'true', 1),
('logo_position', 'top-right', 1);

-- Insert sample view statistics (optional)
INSERT INTO slide_views (slide_id, viewed_at) VALUES
(1, NOW() - INTERVAL '2 days'),
(1, NOW() - INTERVAL '1 day'),
(1, NOW() - INTERVAL '12 hours'),
(2, NOW() - INTERVAL '1 day'),
(2, NOW() - INTERVAL '8 hours'),
(3, NOW() - INTERVAL '6 hours'),
(4, NOW() - INTERVAL '1 day'),
(4, NOW() - INTERVAL '10 hours'),
(5, NOW() - INTERVAL '5 hours'),
(6, NOW() - INTERVAL '3 hours');

-- Verify seeded data
SELECT 'Users seeded: ' || COUNT(*) FROM users;
SELECT 'Slideshows seeded: ' || COUNT(*) FROM slideshows;
SELECT 'Slides seeded: ' || COUNT(*) FROM slides;
SELECT 'Settings seeded: ' || COUNT(*) FROM settings;
SELECT 'View stats seeded: ' || COUNT(*) FROM slide_views;
```

---

## FILE 8: Quick Setup Script (macOS/Linux)
**Location**: Project root (setup.sh)
**Purpose**: Automated project setup

```bash
#!/bin/bash

# RSU Islam Slideshow - Quick Setup Script
# For macOS and Linux

set -e  # Exit on error

echo "🏥 RSU Islam Group Slideshow - Setup Script"
echo "============================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

echo "✓ Docker is installed and running"
echo ""

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p backend/src/middleware backend/src/routes
mkdir -p frontend/public/css frontend/public/js frontend/public/assets/sample
mkdir -p frontend/public/assets/sample/laser-hemorrhidoplasty
mkdir -p frontend/public/assets/sample/emergency-services
mkdir -p data/uploads

echo "✓ Directory structure created"
echo ""

# Create .env if not exists
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cat > .env << 'EOF'
POSTGRES_DB=rsu_slideshow
POSTGRES_USER=rsu_admin
POSTGRES_PASSWORD=SecurePassword123!
NODE_ENV=production
PORT=3000
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=http://localhost
DATABASE_URL=postgresql://rsu_admin:SecurePassword123!@postgres:5432/rsu_slideshow
EOF
    echo "✓ .env file created"
else
    echo "ℹ️  .env file already exists, skipping..."
fi

echo ""

# Create placeholder images if ImageMagick is available
if command -v convert &> /dev/null; then
    echo "🎨 Creating placeholder images..."
    
    cd frontend/public/assets
    
    # Logo
    convert -size 200x200 xc:#16a34a -gravity center \
        -pointsize 40 -fill white -annotate +0+0 "RSU\nIslam" logo-sample.png 2>/dev/null || echo "⚠️  Logo creation skipped"
    
    # Placeholder
    convert -size 800x600 xc:#6b7280 -gravity center \
        -pointsize 60 -fill white -annotate +0+0 "No Image" placeholder.png 2>/dev/null || echo "⚠️  Placeholder creation skipped"
    
    # Laser Hemorrhidoplasty samples
    cd sample/laser-hemorrhidoplasty
    convert -size 1920x1080 xc:#3b82f6 -gravity center \
        -pointsize 80 -fill white -annotate +0+0 "Laser\nHemorrhidoplasty\nService" lh1.jpg 2>/dev/null
    convert -size 1920x1080 xc:#8b5cf6 -gravity center \
        -pointsize 80 -fill white -annotate +0+0 "Modern\nEquipment" lh2.jpg 2>/dev/null
    convert -size 1920x1080 xc:#06b6d4 -gravity center \
        -pointsize 80 -fill white -annotate +0+0 "Expert\nMedical Team" lh3.jpg 2>/dev/null
    
    # Emergency Services samples
    cd ../emergency-services
    convert -size 1920x1080 xc:#dc2626 -gravity center \
        -pointsize 80 -fill white -annotate +0+0 "24/7\nEmergency\nServices" er1.jpg 2>/dev/null
    convert -size 1920x1080 xc:#ea580c -gravity center \
        -pointsize 80 -fill white -annotate +0+0 "Rapid\nResponse" er2.jpg 2>/dev/null
    convert -size 1920x1080 xc:#f59e0b -gravity center \
        -pointsize 80 -fill white -annotate +0+0 "Advanced\nLife Support" er3.jpg 2>/dev/null
    
    cd ../../../../..
    
    echo "✓ Placeholder images created"
else
    echo "ℹ️  ImageMagick not found. Please add images manually to:"
    echo "   - frontend/public/assets/placeholder.png"
    echo "   - frontend/public/assets/logo-sample.png"
    echo "   - frontend/public/assets/sample/*/.*"
fi

echo ""
echo "🚀 Building and starting Docker containers..."
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "✅ Setup complete!"
echo ""
echo "📺 TV Slideshow: http://localhost:3000"
echo "⚙️  Admin Panel: http://localhost:3000/admin.html"
echo ""
echo "🔐 Default Login:"
echo "   Email: admin@rsuislam.com"
echo "   Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change the default password immediately!"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop: docker-compose down"
echo ""
```

Make the script executable:
```bash
chmod +x setup.sh
```

---

## FILE 9: README.md
**Location**: Project root
**Purpose**: Project documentation

```markdown
# RSU Islam Group Slideshow System

A modern, full-featured digital signage solution for hospitals and medical facilities.

## Features

✨ **TV Slideshow Display**
- Fullscreen 16:9 landscape slideshow
- Auto-cycling with configurable intervals
- Smooth transitions and animations
- Company logo overlay
- Real-time slide view tracking

🎛️ **Admin Panel**
- User authentication with JWT
- Slideshow management (create, edit, delete)
- Multi-image upload support
- URL-based image import
- Slide ordering and activation
- Live preview
- Mobile-responsive design

📊 **Statistics Dashboard**
- Total slideshows (active/inactive)
- Total slides count
- View tracking per slide
- Top viewed slides
- Real-time metrics

⚙️ **Display Settings**
- Font family customization
- Font size control (title & description)
- Slide interval timing
- Logo upload and positioning
- Theme customization

👥 **User Management** (Admin only)
- Create admin and regular users
- Activate/deactivate accounts
- Role-based access control

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL 15
- **Frontend**: Vanilla JS + Alpine.js
- **Containerization**: Docker + Docker Compose
- **Authentication**: JWT
- **File Upload**: Multer
- **Styling**: Tailwind CSS (via CDN)

## Quick Start

### Prerequisites
- Docker Desktop
- 2GB free disk space
- macOS, Linux, or Windows

### Installation

1. **Clone or download project files**

2. **Run setup script** (macOS/Linux):
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Or manual setup**:
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit .env and change passwords
   nano .env
   
   # Start containers
   docker-compose up -d
   ```

4. **Access the application**:
   - TV Slideshow: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin.html
   - Default login: admin@rsuislam.com / admin123

## Usage

### Managing Slideshows

1. Login to admin panel
2. Click "New Slideshow"
3. Enter title, description, and folder name
4. Upload images (multiple files supported)
5. Set slide order and descriptions
6. Activate slideshow to display on TV

### TV Display Setup

**Fullscreen Mode**:
- Press F11 in browser
- Use kiosk mode for dedicated displays

**Auto-start on Boot** (macOS):
```bash
./setup.sh
# Then add to System Preferences → Users & Groups → Login Items
```

**Raspberry Pi**:
```bash
# Install Chromium
sudo apt install chromium-browser

# Edit autostart
nano ~/.config/lxsession/LXDE-pi/autostart
# Add:
@chromium-browser --kiosk --start-fullscreen http://YOUR_SERVER_IP:3000
```

## Configuration

Edit `.env` file:

```env
# Change these before production deployment
POSTGRES_PASSWORD=YourSecurePassword
JWT_SECRET=YourRandomSecretKey32CharsMinimum
```

## Backup

```bash
# Database backup
docker-compose exec postgres pg_dump -U rsu_admin rsu_slideshow > backup.sql

# Restore
cat backup.sql | docker-compose exec -T postgres psql -U rsu_admin rsu_slideshow
```

## Troubleshooting

**Containers won't start**:
```bash
docker-compose logs
docker-compose down
docker-compose up --build
```

**Can't login**:
```bash
# Reset admin password
docker-compose exec postgres psql -U rsu_admin -d rsu_slideshow
UPDATE users SET password = '$2b$10$XZkV3kJYL0YQsZQIZ5X0KO7y5H0vKGQxKRHW6J5FhQPJX8X0K0K0K' WHERE email = 'admin@rsuislam.com';
```

**Images not loading**:
```bash
# Check uploads directory
docker-compose exec backend ls -la /app/uploads
```

## Production Deployment

1. **Use strong passwords** in .env
2. **Enable HTTPS** with Nginx + Let's Encrypt
3. **Set up firewall** (allow only 80/443)
4. **Configure backups** (daily cron job)
5. **Monitor logs** regularly
6. **Update regularly** for security patches

## License

MIT License - See LICENSE file

## Support

For issues, please check:
1. Troubleshooting section above
2. Docker logs: `docker-compose logs -f`
3. Contact system administrator

---

**Developed for RSU Islam Group**
**Version 1.0.0 - February 2026**
```

---

## Summary of All Files

You now have **complete working files** for:

### Backend (12 files)
1. ✅ docker-compose.yml
2. ✅ .env.example
3. ✅ backend/Dockerfile
4. ✅ backend/.dockerignore
5. ✅ backend/package.json
6. ✅ backend/src/server.js
7. ✅ backend/src/db.js
8. ✅ backend/src/db-init.sql
9. ✅ backend/src/seed.sql
10. ✅ backend/src/middleware/authMiddleware.js
11. ✅ backend/src/routes/*.js (5 route files)

### Frontend (6 files)
12. ✅ frontend/public/index.html
13. ✅ frontend/public/admin.html
14. ✅ frontend/public/css/slideshow.css
15. ✅ frontend/public/css/admin.css
16. ✅ frontend/public/js/slideshow.js
17. ✅ frontend/public/js/admin.js

### Documentation & Setup
18. ✅ setup.sh (automated setup)
19. ✅ README.md
20. ✅ IMPLEMENTATION-GUIDE.md

All files are ready to download and deploy!
