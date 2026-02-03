# RSU SLIDESHOW - ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                     RSU ISLAM GROUP SLIDESHOW                        │
│                    Digital Signage Web Application                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐              ┌──────────────────┐            │
│  │  index.html      │              │  slideshow.html  │            │
│  │  (Admin Panel)   │              │  (TV Display)    │            │
│  ├──────────────────┤              ├──────────────────┤            │
│  │ • Login Page     │              │ • Auto-play      │            │
│  │ • Dashboard      │              │ • Fullscreen     │            │
│  │ • Manage Users   │              │ • Auto-refresh   │            │
│  │ • Manage Shows   │              │ • No controls    │            │
│  │ • Upload Images  │              │                  │            │
│  └────────┬─────────┘              └─────────┬────────┘            │
│           │                                    │                     │
│           └────────────┬───────────────────────┘                     │
│                        │                                             │
│              ┌─────────▼──────────┐                                 │
│              │   css/styles.css   │                                 │
│              │  (EXACT ORIGINAL)  │                                 │
│              └─────────┬──────────┘                                 │
│                        │                                             │
│              ┌─────────▼──────────┐                                 │
│              │    js/app.js       │                                 │
│              │  (Frontend Logic)  │                                 │
│              └─────────┬──────────┘                                 │
└─────────────────────────┼──────────────────────────────────────────┘
                          │
                          │ HTTP Requests (REST API)
                          │
┌─────────────────────────▼──────────────────────────────────────────┐
│                       SERVER LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                     server.js                               │    │
│  │                  (Express.js Backend)                       │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                              │    │
│  │  API ENDPOINTS:                                             │    │
│  │  ┌─────────────────────────────────────────────────────┐   │    │
│  │  │ POST   /api/login                - Authentication   │   │    │
│  │  │ GET    /api/users                - List users       │   │    │
│  │  │ POST   /api/users                - Create user      │   │    │
│  │  │ DELETE /api/users/:id            - Delete user      │   │    │
│  │  │ GET    /api/slideshows           - List shows       │   │    │
│  │  │ GET    /api/slideshows/active    - Active shows     │   │    │
│  │  │ POST   /api/slideshows           - Create show      │   │    │
│  │  │ PUT    /api/slideshows/:id       - Update show      │   │    │
│  │  │ DELETE /api/slideshows/:id       - Delete show      │   │    │
│  │  │ GET    /api/dashboard/stats      - Statistics       │   │    │
│  │  └─────────────────────────────────────────────────────┘   │    │
│  │                                                              │    │
│  │  FEATURES:                                                  │    │
│  │  • Static file serving                                      │    │
│  │  • File upload (Multer)                                     │    │
│  │  • CORS enabled                                             │    │
│  │  • JSON parsing                                             │    │
│  │                                                              │    │
│  └───────┬──────────────────────────────────┬──────────────────┘    │
│          │                                   │                       │
│          │                                   │                       │
│   ┌──────▼────────┐                  ┌──────▼────────┐             │
│   │ config/       │                  │ Multer        │             │
│   │ database.js   │                  │ File Upload   │             │
│   └──────┬────────┘                  └──────┬────────┘             │
│          │                                   │                       │
└──────────┼───────────────────────────────────┼──────────────────────┘
           │                                   │
           │                                   │
┌──────────▼───────────────────────────────────▼──────────────────────┐
│                     STORAGE LAYER                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────┐    ┌────────────────────────────┐  │
│  │    SQLite Database         │    │    File System             │  │
│  │  (database/schema.sql)     │    │  (assets/images/uploads/)  │  │
│  ├────────────────────────────┤    ├────────────────────────────┤  │
│  │                            │    │                            │  │
│  │  TABLES:                   │    │  STORAGE:                  │  │
│  │  ┌──────────────────┐     │    │  • Uploaded images         │  │
│  │  │ users            │     │    │  • Original filenames      │  │
│  │  ├──────────────────┤     │    │  • Unique names (hash)     │  │
│  │  │ • id             │     │    │  • Max 10MB per file       │  │
│  │  │ • username       │     │    │  • JPEG, PNG, GIF, WEBP   │  │
│  │  │ • full_name      │     │    │                            │  │
│  │  │ • password       │     │    │  PATHS STORED IN DB:       │  │
│  │  │ • role           │     │    │  /assets/images/uploads/   │  │
│  │  │ • status         │     │    │   [timestamp]-[random].jpg │  │
│  │  └──────────────────┘     │    │                            │  │
│  │                            │    └────────────────────────────┘  │
│  │  ┌──────────────────┐     │                                    │
│  │  │ slideshows       │     │                                    │
│  │  ├──────────────────┤     │                                    │
│  │  │ • id             │     │                                    │
│  │  │ • title          │     │                                    │
│  │  │ • description    │     │                                    │
│  │  │ • status         │     │                                    │
│  │  │ • created_by     │     │                                    │
│  │  │ • display_count  │     │                                    │
│  │  │ • last_displayed │     │                                    │
│  │  └──────────────────┘     │                                    │
│  │                            │                                    │
│  │  ┌──────────────────┐     │                                    │
│  │  │ images           │     │                                    │
│  │  ├──────────────────┤     │                                    │
│  │  │ • id             │     │                                    │
│  │  │ • slideshow_id   │─────┼────> Links to File System         │
│  │  │ • filename       │     │                                    │
│  │  │ • caption        │     │                                    │
│  │  │ • file_path      │─────┼────> /assets/images/uploads/...   │
│  │  │ • file_size      │     │                                    │
│  │  │ • display_order  │     │                                    │
│  │  └──────────────────┘     │                                    │
│  │                            │                                    │
│  │  ┌──────────────────┐     │                                    │
│  │  │ activity_logs    │     │                                    │
│  │  ├──────────────────┤     │                                    │
│  │  │ • id             │     │                                    │
│  │  │ • user_id        │     │                                    │
│  │  │ • action         │     │                                    │
│  │  │ • description    │     │                                    │
│  │  │ • ip_address     │     │                                    │
│  │  └──────────────────┘     │                                    │
│  │                            │                                    │
│  └────────────────────────────┘                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    Docker Container                         │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                              │    │
│  │  FROM node:18-alpine                                        │    │
│  │                                                              │    │
│  │  VOLUMES:                                                   │    │
│  │  • /app/database          → Host: ./database               │    │
│  │  • /app/assets/images     → Host: ./assets/images          │    │
│  │                                                              │    │
│  │  PORTS:                                                     │    │
│  │  • 3000:3000              → Host: localhost:3000           │    │
│  │                                                              │    │
│  │  COMMAND:                                                   │    │
│  │  npm start                                                  │    │
│  │                                                              │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  USER AUTHENTICATION:                                                │
│  1. User enters credentials → index.html                            │
│  2. app.js sends POST /api/login                                    │
│  3. server.js validates against users table                         │
│  4. Returns user object if valid                                    │
│  5. app.js stores user, shows admin panel                           │
│                                                                       │
│  SLIDESHOW CREATION:                                                 │
│  1. User fills form → index.html                                    │
│  2. User uploads images → File input                                │
│  3. app.js converts to FormData                                     │
│  4. POST /api/slideshows with multipart data                        │
│  5. server.js (Multer) saves files to uploads/                      │
│  6. server.js creates slideshow in database                         │
│  7. server.js creates image records with file paths                 │
│  8. Returns success → app.js refreshes list                         │
│                                                                       │
│  SLIDESHOW DISPLAY:                                                  │
│  1. slideshow.html loads                                            │
│  2. JavaScript calls GET /api/slideshows/active                     │
│  3. server.js queries active slideshows + images                    │
│  4. Returns JSON with image URLs                                    │
│  5. JavaScript renders slides                                       │
│  6. Auto-advances every 5 seconds                                   │
│  7. Auto-refreshes every 5 minutes                                  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     KEY DIFFERENCES                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ORIGINAL (rsu-slideshow-v3.html):                                  │
│  • Single HTML file                                                 │
│  • localStorage only                                                │
│  • Base64 image storage                                             │
│  • Client-side only                                                 │
│  • Lost on browser clear                                            │
│                                                                       │
│  NEW SYSTEM (rsu-slideshow-webapp):                                 │
│  • Separated architecture                                           │
│  • SQLite database                                                  │
│  • File system storage                                              │
│  • Client-server model                                              │
│  • Persistent storage                                               │
│  • Multi-device access                                              │
│  • Production ready                                                 │
│                                                                       │
│  WHAT STAYED THE SAME:                                              │
│  ✓ CSS (exact copy)                                                 │
│  ✓ UI elements                                                      │
│  ✓ User experience                                                  │
│  ✓ Functionality                                                    │
│  ✓ Feature set                                                      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
