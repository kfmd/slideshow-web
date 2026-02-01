# RSU Islam Group Slideshow Web App

A modern, fullscreen slideshow application for displaying hospital services and programs on TV screens throughout RSU Islam Group facilities.

## Features

- **Fullscreen 16:9 Slideshow Display** - Perfect for TV screens with automatic cycling
- **Admin Dashboard** - Complete management interface with Tailwind CSS + Alpine.js
- **User Management** - Admin and regular user roles with JWT authentication
- **Statistics Tracking** - Monitor slide views and activity
- **Multi-Image Upload** - Support for various image formats and sizes
- **Aspect Ratio Preservation** - Images display correctly without stretching using CSS object-fit
- **Mobile Responsive** - Admin panel works on all devices
- **Database Persistence** - PostgreSQL storage for all data
- **Docker Containerized** - Easy deployment with Docker Compose

## Tech Stack

- **Backend**: Node.js 20 + Express 4
- **Database**: PostgreSQL 16
- **Frontend**: HTML5, CSS3, Tailwind CSS 3, Alpine.js 3
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Containerization**: Docker + Docker Compose

## Quick Start

See [INSTALLATION.md](INSTALLATION.md) for complete setup instructions.

```bash
# Clone or download the project
cd rsu-islam-slideshow

# Start with Docker
docker-compose up --build

# Access the application
# Admin Panel: http://localhost:8080/admin.html
# TV Slideshow: http://localhost:8080/index.html
```

## Default Admin Credentials

After first run, create admin user (see INSTALLATION.md):
- **Email**: admin@rsuislam.local
- **Password**: AdminPassword123

## Directory Structure

```
rsu-islam-slideshow/
├── backend/          # Node.js Express API
├── frontend/public/  # Static HTML, CSS, JS files
└── docker-compose.yml
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)

### Slideshows
- `GET /api/slideshows` - List all slideshows
- `POST /api/slideshows` - Create new slideshow
- `PATCH /api/slideshows/:id/active` - Toggle active status
- `GET /api/slideshows/:id/slides` - Get slides for slideshow
- `POST /api/slideshows/:id/slides` - Upload slide image
- `PATCH /api/slideshows/slide/:id` - Update slide
- `DELETE /api/slideshows/slide/:id` - Delete slide

### Public (No Auth Required)
- `GET /api/slideshows/public/active` - Get active slideshows and slides
- `POST /api/slideshows/public/slide-view/:id` - Increment view count

### Statistics
- `GET /api/stats` - Get dashboard statistics

### Settings
- `GET /api/settings` - Get all settings
- `POST /api/settings` - Update settings (admin only)

### Users
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user (admin only)
- `PATCH /api/users/:id/role` - Update user role (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - Free for personal and commercial use

## Support

For issues or questions, please refer to the INSTALLATION.md file for troubleshooting.

## Credits

Developed for RSU Islam Group
