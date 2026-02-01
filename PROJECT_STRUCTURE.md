# RSU Islam Group Slideshow - Project Structure

```
rsu-islam-slideshow/
├── docker-compose.yml
├── .env.example
├── README.md
├── INSTALLATION.md
│
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
│
└── frontend/
    └── public/
        ├── index.html              # TV Slideshow Page
        ├── admin.html              # Admin Panel
        ├── css/
        │   ├── slideshow.css       # Separate slideshow CSS
        │   └── admin.css           # Separate admin CSS
        ├── js/
        │   ├── slideshow.js        # Separate slideshow JS
        │   └── admin.js            # Separate admin JS
        └── assets/
            ├── placeholder.png
            ├── logo-sample.png
            └── sample/
                ├── laser-hemorrhidoplasty/
                │   ├── lh1.jpg
                │   ├── lh2.jpg
                │   └── lh3.jpg
                └── emergency-services/
                    ├── er1.jpg
                    ├── er2.jpg
                    └── er3.jpg
```

## File Descriptions

### Configuration Files
- **docker-compose.yml**: Orchestrates PostgreSQL and Node.js containers
- **.env.example**: Environment variables template
- **README.md**: Project overview and features
- **INSTALLATION.md**: Complete setup instructions

### Backend Files
- **Dockerfile**: Node.js container configuration
- **package.json**: Node.js dependencies and scripts
- **server.js**: Express server setup
- **db.js**: PostgreSQL connection pool
- **db-init.sql**: Database schema initialization
- **seed.sql**: Sample data for testing
- **authMiddleware.js**: JWT authentication middleware
- **routes/*.js**: API endpoints for each feature

### Frontend Files
- **index.html**: Fullscreen TV slideshow (16:9 ratio)
- **admin.html**: Admin dashboard with all management features
- **slideshow.css**: Dedicated styles for TV display (object-fit, transitions)
- **admin.css**: Admin panel custom styles (extends Tailwind)
- **slideshow.js**: Slideshow logic, transitions, stats tracking
- **admin.js**: Admin panel functionality (Alpine.js app)
- **assets/**: Images storage with folder structure

## Key Features Implemented

### 1. User Management ✓
- Admin and regular user roles
- JWT authentication
- User CRUD operations

### 2. Slideshow Management ✓
- Create/edit/delete slideshows
- Folder-based organization
- Multiple file upload support
- URL-based image support
- Active/inactive toggle

### 3. Statistics Dashboard ✓
- Total slides (active/inactive)
- Total slideshows (active/inactive)
- Display count per slide
- Most displayed slides ranking

### 4. Administrator Settings ✓
- Font family selection
- Title font size
- Description font size
- Slide transition interval
- Company logo upload/URL
- Edit modal with image preview

### 5. Database Storage ✓
- PostgreSQL for persistent data
- File system for uploaded images
- Volume mounting for data persistence

### 6. Dedicated Slideshow Page ✓
- Fullscreen 16:9 ratio
- Automatic pagination dots
- Smooth transitions
- Logo overlay support

### 7. Admin Preview ✓
- Embedded slideshow preview in admin panel
- Real-time updates

### 8. Mobile Responsive ✓
- Toggle menu for mobile devices
- Responsive admin layout
- Touch-friendly controls

### 9. Image Handling ✓
- Placeholder for missing images
- Error notification system
- Object-fit: contain for aspect ratio preservation

### 10. Code Organization ✓
- Separate CSS files (slideshow.css, admin.css)
- Separate JS files (slideshow.js, admin.js)
- Modular backend routes

### 11. Notification System ✓
- Top-right notification icon
- Broken image alerts
- Loading error tracking
