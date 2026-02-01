const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../db');
const { authRequired } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const slideshowId = req.params.id;
      const result = await db.query(
        'SELECT folder_name FROM slideshows WHERE id = $1',
        [slideshowId]
      );
      
      if (result.rows.length === 0) {
        return cb(new Error('Slideshow not found'));
      }

      const folderName = result.rows[0].folder_name;
      const uploadPath = path.join(
        __dirname,
        '../../frontend/public/assets/sample',
        folderName
      );

      // Create directory if it doesn't exist
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'slide-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
  }
});

/**
 * GET /api/slideshows/public/active
 * Get all active slideshows and slides for TV display (NO AUTH REQUIRED)
 */
router.get('/public/active', async (req, res) => {
  try {
    const slideshowsResult = await db.query(
      'SELECT id, title, description, folder_name, display_order FROM slideshows WHERE is_active = true ORDER BY display_order, id ASC'
    );

    const slidesResult = await db.query(
      `SELECT s.id, s.slideshow_id, s.title, s.description, s.file_path, s.display_order,
              COALESCE(st.display_count, 0) as display_count
       FROM slides s
       LEFT JOIN slide_stats st ON s.id = st.slide_id
       WHERE s.is_active = true
       ORDER BY s.slideshow_id, s.display_order, s.id ASC`
    );

    res.json({
      slideshows: slideshowsResult.rows,
      slides: slidesResult.rows
    });
  } catch (error) {
    console.error('Error fetching active content:', error);
    res.status(500).json({ error: 'Failed to fetch slideshow data' });
  }
});

/**
 * POST /api/slideshows/public/slide-view/:id
 * Increment slide view count (NO AUTH REQUIRED)
 */
router.post('/public/slide-view/:id', async (req, res) => {
  try {
    const slideId = parseInt(req.params.id);

    await db.query(
      `INSERT INTO slide_stats (slide_id, display_count, last_displayed)
       VALUES ($1, 1, CURRENT_TIMESTAMP)
       ON CONFLICT (slide_id) 
       DO UPDATE SET 
         display_count = slide_stats.display_count + 1,
         last_displayed = CURRENT_TIMESTAMP`,
      [slideId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating slide stats:', error);
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

/**
 * GET /api/slideshows
 * List all slideshows with metadata (AUTH REQUIRED)
 */
router.get('/', authRequired, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, 
              COUNT(sl.id) FILTER (WHERE sl.is_active = true) as active_slide_count,
              COUNT(sl.id) as total_slide_count,
              u.full_name as creator_name
       FROM slideshows s
       LEFT JOIN slides sl ON s.id = sl.slideshow_id
       LEFT JOIN users u ON s.created_by = u.id
       GROUP BY s.id, u.full_name
       ORDER BY s.display_order, s.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching slideshows:', error);
    res.status(500).json({ error: 'Failed to fetch slideshows' });
  }
});

/**
 * POST /api/slideshows
 * Create new slideshow (AUTH REQUIRED)
 */
router.post('/', authRequired, async (req, res) => {
  try {
    const { title, description, folder_name, is_active = true } = req.body;

    if (!title || !folder_name) {
      return res.status(400).json({ error: 'Title and folder_name are required' });
    }

    // Validate folder_name format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(folder_name)) {
      return res.status(400).json({ 
        error: 'Folder name must contain only lowercase letters, numbers, and hyphens' 
      });
    }

    const result = await db.query(
      `INSERT INTO slideshows (title, description, folder_name, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, folder_name, is_active, req.user.id]
    );

    // Create folder on filesystem
    const folderPath = path.join(
      __dirname,
      '../../frontend/public/assets/sample',
      folder_name
    );
    await fs.mkdir(folderPath, { recursive: true });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Folder name already exists' });
    }
    console.error('Error creating slideshow:', error);
    res.status(500).json({ error: 'Failed to create slideshow' });
  }
});

/**
 * PATCH /api/slideshows/:id
 * Update slideshow details (AUTH REQUIRED)
 */
router.patch('/:id', authRequired, async (req, res) => {
  try {
    const { title, description, is_active, display_order } = req.body;
    const slideshowId = parseInt(req.params.id);

    const result = await db.query(
      `UPDATE slideshows SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         is_active = COALESCE($3, is_active),
         display_order = COALESCE($4, display_order)
       WHERE id = $5
       RETURNING *`,
      [title, description, is_active, display_order, slideshowId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Slideshow not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating slideshow:', error);
    res.status(500).json({ error: 'Failed to update slideshow' });
  }
});

/**
 * DELETE /api/slideshows/:id
 * Delete slideshow and all its slides (AUTH REQUIRED)
 */
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const slideshowId = parseInt(req.params.id);

    // Get folder name before deleting
    const slideshow = await db.query(
      'SELECT folder_name FROM slideshows WHERE id = $1',
      [slideshowId]
    );

    if (slideshow.rows.length === 0) {
      return res.status(404).json({ error: 'Slideshow not found' });
    }

    // Delete from database (CASCADE will delete slides)
    await db.query('DELETE FROM slideshows WHERE id = $1', [slideshowId]);

    // Optionally delete folder (commented out for safety)
    // const folderPath = path.join(__dirname, '../../frontend/public/assets/sample', slideshow.rows[0].folder_name);
    // await fs.rm(folderPath, { recursive: true, force: true });

    res.json({ success: true, message: 'Slideshow deleted successfully' });
  } catch (error) {
    console.error('Error deleting slideshow:', error);
    res.status(500).json({ error: 'Failed to delete slideshow' });
  }
});

/**
 * GET /api/slideshows/:id/slides
 * Get all slides for a specific slideshow (AUTH REQUIRED)
 */
router.get('/:id/slides', authRequired, async (req, res) => {
  try {
    const slideshowId = parseInt(req.params.id);

    const result = await db.query(
      `SELECT s.*, COALESCE(st.display_count, 0) as display_count
       FROM slides s
       LEFT JOIN slide_stats st ON s.id = st.slide_id
       WHERE s.slideshow_id = $1
       ORDER BY s.display_order, s.created_at`,
      [slideshowId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching slides:', error);
    res.status(500).json({ error: 'Failed to fetch slides' });
  }
});

/**
 * POST /api/slideshows/:id/slides
 * Add slide to slideshow with file upload or URL (AUTH REQUIRED)
 */
router.post('/:id/slides', authRequired, upload.array('images', 10), async (req, res) => {
  try {
    const slideshowId = parseInt(req.params.id);
    const { title, description, file_url, display_order } = req.body;

    const createdSlides = [];

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const folderName = path.basename(path.dirname(file.path));
        const filePath = `/assets/sample/${folderName}/${file.filename}`;

        const result = await db.query(
          `INSERT INTO slides (slideshow_id, title, description, file_path, file_type, file_size, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [slideshowId, title || file.originalname, description, filePath, file.mimetype, file.size, display_order || 0]
        );

        // Initialize stats
        await db.query(
          'INSERT INTO slide_stats (slide_id, display_count) VALUES ($1, 0) ON CONFLICT DO NOTHING',
          [result.rows[0].id]
        );

        createdSlides.push(result.rows[0]);
      }
    }
    // Handle URL-based slide
    else if (file_url) {
      const result = await db.query(
        `INSERT INTO slides (slideshow_id, title, description, file_path, display_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [slideshowId, title, description, file_url, display_order || 0]
      );

      await db.query(
        'INSERT INTO slide_stats (slide_id, display_count) VALUES ($1, 0) ON CONFLICT DO NOTHING',
        [result.rows[0].id]
      );

      createdSlides.push(result.rows[0]);
    }
    else {
      return res.status(400).json({ error: 'Either upload images or provide file_url' });
    }

    res.status(201).json(createdSlides);
  } catch (error) {
    console.error('Error creating slide:', error);
    res.status(500).json({ error: error.message || 'Failed to create slide' });
  }
});

/**
 * PATCH /api/slideshows/slide/:slideId
 * Update slide details (AUTH REQUIRED)
 */
router.patch('/slide/:slideId', authRequired, async (req, res) => {
  try {
    const slideId = parseInt(req.params.slideId);
    const { title, description, is_active, display_order, file_path } = req.body;

    const result = await db.query(
      `UPDATE slides SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         is_active = COALESCE($3, is_active),
         display_order = COALESCE($4, display_order),
         file_path = COALESCE($5, file_path)
       WHERE id = $6
       RETURNING *`,
      [title, description, is_active, display_order, file_path, slideId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating slide:', error);
    res.status(500).json({ error: 'Failed to update slide' });
  }
});

/**
 * DELETE /api/slideshows/slide/:slideId
 * Delete a slide (AUTH REQUIRED)
 */
router.delete('/slide/:slideId', authRequired, async (req, res) => {
  try {
    const slideId = parseInt(req.params.slideId);

    // Get file path before deleting
    const slide = await db.query(
      'SELECT file_path FROM slides WHERE id = $1',
      [slideId]
    );

    if (slide.rows.length === 0) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    // Delete from database
    await db.query('DELETE FROM slides WHERE id = $1', [slideId]);

    // Optionally delete file (commented out for safety)
    // if (slide.rows[0].file_path.startsWith('/assets/')) {
    //   const filePath = path.join(__dirname, '../../frontend/public', slide.rows[0].file_path);
    //   await fs.unlink(filePath).catch(() => {});
    // }

    res.json({ success: true, message: 'Slide deleted successfully' });
  } catch (error) {
    console.error('Error deleting slide:', error);
    res.status(500).json({ error: 'Failed to delete slide' });
  }
});

module.exports = router;
