import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db, queries } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directories exist
const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${nanoid()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(uploadsDir));


app.use(session({
  secret: process.env.SESSION_SECRET || 'rsu-islam-slideshow-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,           // HTTP works
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    sameSite: 'lax'          // Important for cookies
  }
}));

// Initialize default admin user
const initializeAdmin = () => {
  try {
    const existingAdmin = queries.getUserByUsername.get('admin');
    if (!existingAdmin) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      queries.createUser.run(nanoid(), 'admin', hashedPassword, 'admin');
      console.log('Default admin user created (username: admin, password: admin123)');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
};

initializeAdmin();

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.session.userId && req.session.userRole === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
};

// ==================== AUTH ROUTES ====================

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = queries.getUserByUsername.get(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.userRole = user.role;

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    id: req.session.userId,
    username: req.session.username,
    role: req.session.userRole
  });
});

// ==================== USER ROUTES ====================

app.get('/api/users', requireAdmin, (req, res) => {
  try {
    const users = queries.getAllUsers.all();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', requireAdmin, (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = nanoid();

    queries.createUser.run(userId, username, hashedPassword, role);

    res.status(201).json({
      message: 'User created successfully',
      user: { id: userId, username, role }
    });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { username, role } = req.body;

    if (!username || !role) {
      return res.status(400).json({ error: 'Username and role required' });
    }

    queries.updateUser.run(username, role, id);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.put('/api/users/:id/password', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Users can only change their own password unless they're admin
    if (req.session.userId !== id && req.session.userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!newPassword) {
      return res.status(400).json({ error: 'New password required' });
    }

    // If not admin, verify current password
    if (req.session.userRole !== 'admin') {
      const user = queries.getUserById.get(id);
      if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    queries.updatePassword.run(hashedPassword, id);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

app.delete('/api/users/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (req.session.userId === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    queries.deleteUser.run(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==================== SLIDESHOW ROUTES ====================

app.get('/api/slideshows', requireAuth, (req, res) => {
  try {
    let slideshows;
    if (req.session.userRole === 'admin') {
      slideshows = queries.getAllSlideshows.all();
    } else {
      slideshows = queries.getSlideshowsByUser.all(req.session.userId);
    }
    res.json(slideshows);
  } catch (error) {
    console.error('Get slideshows error:', error);
    res.status(500).json({ error: 'Failed to fetch slideshows' });
  }
});

app.get('/api/slideshows/active', (req, res) => {
  try {
    const slideshows = queries.getActiveSlideshows.all();
    res.json(slideshows);
  } catch (error) {
    console.error('Get active slideshows error:', error);
    res.status(500).json({ error: 'Failed to fetch active slideshows' });
  }
});

app.get('/api/slideshows/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const slideshow = queries.getSlideshow.get(id);

    if (!slideshow) {
      return res.status(404).json({ error: 'Slideshow not found' });
    }

    const slides = queries.getSlidesBySlideshow.all(id);

    res.json({ ...slideshow, slides });
  } catch (error) {
    console.error('Get slideshow error:', error);
    res.status(500).json({ error: 'Failed to fetch slideshow' });
  }
});

app.post('/api/slideshows', requireAuth, (req, res) => {
  try {
    const { title, description, status } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const slideshowId = nanoid();
    queries.createSlideshow.run(
      slideshowId,
      title,
      description || '',
      status || 'active',
      req.session.userId
    );

    res.status(201).json({
      message: 'Slideshow created successfully',
      slideshow: { id: slideshowId, title, description, status }
    });
  } catch (error) {
    console.error('Create slideshow error:', error);
    res.status(500).json({ error: 'Failed to create slideshow' });
  }
});

app.put('/api/slideshows/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    queries.updateSlideshow.run(title, description || '', status || 'active', id);
    res.json({ message: 'Slideshow updated successfully' });
  } catch (error) {
    console.error('Update slideshow error:', error);
    res.status(500).json({ error: 'Failed to update slideshow' });
  }
});

app.delete('/api/slideshows/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;

    // Delete associated slides first
    queries.deleteSlidesBySlideshow.run(id);
    queries.deleteSlideshow.run(id);

    res.json({ message: 'Slideshow deleted successfully' });
  } catch (error) {
    console.error('Delete slideshow error:', error);
    res.status(500).json({ error: 'Failed to delete slideshow' });
  }
});

app.post('/api/slideshows/:id/increment', (req, res) => {
  try {
    const { id } = req.params;
    queries.incrementDisplayCount.run(id);
    res.json({ message: 'Display count incremented' });
  } catch (error) {
    console.error('Increment display count error:', error);
    res.status(500).json({ error: 'Failed to increment display count' });
  }
});

// ==================== SLIDE ROUTES ====================

app.post('/api/slides', requireAuth, upload.array('images', 10), async (req, res) => {
  try {
    const { slideshow_id, titles, descriptions, image_urls } = req.body;

    if (!slideshow_id) {
      return res.status(400).json({ error: 'Slideshow ID is required' });
    }

    const slideshow = queries.getSlideshow.get(slideshow_id);
    if (!slideshow) {
      return res.status(404).json({ error: 'Slideshow not found' });
    }

    const existingSlides = queries.getSlidesBySlideshow.all(slideshow_id);
    let sortOrder = existingSlides.length;

    const createdSlides = [];

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      const titlesArray = Array.isArray(titles) ? titles : [titles];
      const descriptionsArray = Array.isArray(descriptions) ? descriptions : [descriptions];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const slideId = nanoid();
        const imagePath = `/uploads/${file.filename}`;

        queries.createSlide.run(
          slideId,
          slideshow_id,
          imagePath,
          '',
          titlesArray[i] || `Slide ${sortOrder + 1}`,
          descriptionsArray[i] || '',
          sortOrder
        );

        createdSlides.push({ id: slideId, image_path: imagePath });
        sortOrder++;
      }
    }

    // Handle image URLs
    if (image_urls) {
      const urlsArray = Array.isArray(image_urls) ? image_urls : [image_urls];
      const titlesArray = Array.isArray(titles) ? titles : [titles];
      const descriptionsArray = Array.isArray(descriptions) ? descriptions : [descriptions];

      for (let i = 0; i < urlsArray.length; i++) {
        if (urlsArray[i]) {
          const slideId = nanoid();

          queries.createSlide.run(
            slideId,
            slideshow_id,
            '',
            urlsArray[i],
            titlesArray[i + (req.files?.length || 0)] || `Slide ${sortOrder + 1}`,
            descriptionsArray[i + (req.files?.length || 0)] || '',
            sortOrder
          );

          createdSlides.push({ id: slideId, image_url: urlsArray[i] });
          sortOrder++;
        }
      }
    }

    res.status(201).json({
      message: 'Slides created successfully',
      slides: createdSlides
    });
  } catch (error) {
    console.error('Create slide error:', error);
    res.status(500).json({ error: 'Failed to create slides' });
  }
});

app.put('/api/slides/:id', requireAuth, upload.single('image'), (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image_url } = req.body;

    const slide = queries.getSlide.get(id);
    if (!slide) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    let imagePath = slide.image_path;
    let imageUrl = slide.image_url;
    let isLoaded = 1;

    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
      imageUrl = '';
    } else if (image_url !== undefined) {
      imageUrl = image_url;
      imagePath = '';
    }

    queries.updateSlide.run(
      title || slide.title,
      description !== undefined ? description : slide.description,
      imagePath,
      imageUrl,
      isLoaded,
      id
    );

    res.json({ message: 'Slide updated successfully' });
  } catch (error) {
    console.error('Update slide error:', error);
    res.status(500).json({ error: 'Failed to update slide' });
  }
});

app.delete('/api/slides/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    queries.deleteSlide.run(id);
    res.json({ message: 'Slide deleted successfully' });
  } catch (error) {
    console.error('Delete slide error:', error);
    res.status(500).json({ error: 'Failed to delete slide' });
  }
});

app.post('/api/slides/:id/mark-not-loaded', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    queries.markSlideAsNotLoaded.run(id);
    res.json({ message: 'Slide marked as not loaded' });
  } catch (error) {
    console.error('Mark slide error:', error);
    res.status(500).json({ error: 'Failed to mark slide' });
  }
});

// ==================== SETTINGS ROUTES ====================

app.get('/api/settings', requireAuth, (req, res) => {
  try {
    const settings = queries.getAllSettings.all();
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', requireAdmin, (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      queries.updateSetting.run(key, value.toString());
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.post('/api/settings/logo', requireAdmin, upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No logo file uploaded' });
    }

    const logoPath = `/uploads/${req.file.filename}`;
    queries.updateSetting.run('company_logo', logoPath);

    res.json({
      message: 'Logo uploaded successfully',
      path: logoPath
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// ==================== STATS ROUTES ====================

app.get('/api/stats', requireAuth, (req, res) => {
  try {
    const stats = queries.getStats.get();
    const slideshowStats = queries.getSlideshowStats.all();
    const notLoadedSlides = queries.getNotLoadedSlides.all();

    res.json({
      ...stats,
      total_displays: stats.total_displays || 0,
      slideshow_details: slideshowStats,
      not_loaded_count: notLoadedSlides.length,
      not_loaded_slides: notLoadedSlides
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ==================== SERVE HTML PAGES ====================

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'admin.html'));
});

app.get('/slideshow', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'slideshow.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`RSU Islam Slideshow app running on http://localhost:${PORT}`);
});
