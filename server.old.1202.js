const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { runQuery, getOne, getAll } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'assets/images/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/svg+xml';
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

// ============ API ROUTES ============

// User Authentication
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await getOne(
            'SELECT * FROM users WHERE username = ? AND password = ? AND status = ?',
            [username, password, 'active']
        );
        
        if (user) {
            // Log activity
            await runQuery(
                'INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
                [user.id, 'LOGIN', 'User logged in', req.ip]
            );
            
            res.json({ 
                success: true, 
                user: {
                    id: user.id,
                    username: user.username,
                    fullName: user.full_name,
                    role: user.role
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await getAll('SELECT id, username, full_name, role, status FROM users');
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create user
app.post('/api/users', async (req, res) => {
    try {
        const { username, fullName, password, role } = req.body;
        const result = await runQuery(
            'INSERT INTO users (username, full_name, password, role) VALUES (?, ?, ?, ?)',
            [username, fullName, password, role]
        );
        res.json({ success: true, userId: result.id });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
    try {
        await runQuery('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all slideshows
app.get('/api/slideshows', async (req, res) => {
    try {
        const slideshows = await getAll(`
            SELECT s.*, 
                   GROUP_CONCAT(i.id) as image_ids,
                   GROUP_CONCAT(i.file_path) as image_paths,
                   GROUP_CONCAT(i.caption) as image_captions
            FROM slideshows s
            LEFT JOIN images i ON s.id = i.slideshow_id
            GROUP BY s.id
            ORDER BY s.created_at DESC
        `);
        
        // Format the response
        const formattedSlideshows = slideshows.map(s => ({
            id: s.id,
            title: s.title,
            description: s.description,
            status: s.status,
            createdBy: s.created_by,
            displayCount: s.display_count,
            lastDisplayed: s.last_displayed,
            createdAt: s.created_at,
            images: s.image_ids ? s.image_ids.split(',').map((id, idx) => ({
                id: parseInt(id),
                url: '/assets/images/uploads/' + path.basename(s.image_paths.split(',')[idx]),
                caption: s.image_captions.split(',')[idx]
            })) : []
        }));
        
        res.json({ success: true, slideshows: formattedSlideshows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get active slideshows (for display)
app.get('/api/slideshows/active', async (req, res) => {
    try {
        const slideshows = await getAll(`
            SELECT s.*, 
                   GROUP_CONCAT(i.id) as image_ids,
                   GROUP_CONCAT(i.file_path) as image_paths,
                   GROUP_CONCAT(i.caption) as image_captions
            FROM slideshows s
            LEFT JOIN images i ON s.id = i.slideshow_id
            WHERE s.status = 'active'
            GROUP BY s.id
            ORDER BY s.created_at DESC
        `);
        
        const formattedSlideshows = slideshows.map(s => ({
            id: s.id,
            title: s.title,
            description: s.description,  // FIXED: Include description for subtitle
            images: s.image_ids ? s.image_ids.split(',').map((id, idx) => ({
                id: parseInt(id),
                url: '/assets/images/uploads/' + path.basename(s.image_paths.split(',')[idx]),
                caption: s.image_captions.split(',')[idx]
            })) : []
        }));
        
        res.json({ success: true, slideshows: formattedSlideshows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create slideshow
app.post('/api/slideshows', upload.array('images'), async (req, res) => {
    try {
        const { title, description, status, createdBy, captions } = req.body;
        
        // Create slideshow
        const result = await runQuery(
            'INSERT INTO slideshows (title, description, status, created_by) VALUES (?, ?, ?, ?)',
            [title, description, status, createdBy]
        );
        
        const slideshowId = result.id;
        
        // Add images
        if (req.files && req.files.length > 0) {
            const captionArray = JSON.parse(captions || '[]');
            
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                await runQuery(
                    'INSERT INTO images (slideshow_id, filename, caption, file_path, file_size, mime_type, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                        slideshowId,
                        file.originalname,
                        captionArray[i] || `Slide ${i + 1}`,
                        file.path,
                        file.size,
                        file.mimetype,
                        i
                    ]
                );
            }
        }
        
        res.json({ success: true, slideshowId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update slideshow
app.put('/api/slideshows/:id', upload.array('images'), async (req, res) => {
    try {
        const { title, description, status, deletedImageIds } = req.body;
        
        // Update slideshow metadata
        await runQuery(
            'UPDATE slideshows SET title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [title, description, status, req.params.id]
        );
        
        // Handle deleted images
        if (deletedImageIds) {
            const idsToDelete = JSON.parse(deletedImageIds);
            console.log('Deleting images with IDs:', idsToDelete);
            
            for (const imageId of idsToDelete) {
                // Get file path before deleting from database
                const image = await getOne('SELECT file_path FROM images WHERE id = ?', [imageId]);
                
                if (image && image.file_path) {
                    // Delete physical file
                    if (fs.existsSync(image.file_path)) {
                        fs.unlinkSync(image.file_path);
                        console.log('Deleted file:', image.file_path);
                    }
                    
                    // Delete from database
                    await runQuery('DELETE FROM images WHERE id = ?', [imageId]);
                    console.log('Deleted image record:', imageId);
                }
            }
        }
        
        // Handle new images if uploaded
        if (req.files && req.files.length > 0) {
            const captions = JSON.parse(req.body.captions || '[]');
            
            // Get current max display_order
            const maxOrder = await getOne(
                'SELECT COALESCE(MAX(display_order), -1) as max_order FROM images WHERE slideshow_id = ?',
                [req.params.id]
            );
            const startOrder = (maxOrder?.max_order ?? -1) + 1;
            
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                await runQuery(
                    'INSERT INTO images (slideshow_id, filename, caption, file_path, file_size, mime_type, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                        req.params.id,
                        file.originalname,
                        captions[i] || `Slide ${i + 1}`,
                        file.path,
                        file.size,
                        file.mimetype,
                        startOrder + i
                    ]
                );
            }
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Update slideshow error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete slideshow
app.delete('/api/slideshows/:id', async (req, res) => {
    try {
        // Delete associated images from filesystem
        const images = await getAll('SELECT file_path FROM images WHERE slideshow_id = ?', [req.params.id]);
        images.forEach(img => {
            if (fs.existsSync(img.file_path)) {
                fs.unlinkSync(img.file_path);
            }
        });
        
        // Delete from database (cascade will handle images table)
        await runQuery('DELETE FROM slideshows WHERE id = ?', [req.params.id]);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update display count
app.post('/api/slideshows/:id/display', async (req, res) => {
    try {
        await runQuery(
            'UPDATE slideshows SET display_count = display_count + 1, last_displayed = CURRENT_TIMESTAMP WHERE id = ?',
            [req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Dashboard statistics
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const activeCount = await getOne('SELECT COUNT(*) as count FROM slideshows WHERE status = ?', ['active']);
        const totalCount = await getOne('SELECT COUNT(*) as count FROM slideshows');
        const userCount = await getOne('SELECT COUNT(*) as count FROM users WHERE status = ?', ['active']);
        const displayCount = await getOne('SELECT SUM(display_count) as total FROM slideshows');
        
        res.json({
            success: true,
            stats: {
                activeSlides: activeCount.count,
                totalSlides: totalCount.count,
                activeUsers: userCount.count,
                totalDisplays: displayCount.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Logo upload endpoint
app.post('/api/settings/logo', upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        // Delete old logo if it exists
        const logoPattern = /^logo-\d+-\d+\.(jpg|jpeg|png|gif|webp|svg)$/;
        const files = fs.readdirSync(uploadsDir);
        
        files.forEach(file => {
            if (logoPattern.test(file)) {
                const oldLogoPath = path.join(uploadsDir, file);
                if (fs.existsSync(oldLogoPath)) {
                    fs.unlinkSync(oldLogoPath);
                    console.log('Deleted old logo:', oldLogoPath);
                }
            }
        });
        
        // Rename uploaded file to follow logo pattern
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        const ext = path.extname(req.file.originalname);
        const newFilename = `logo-${timestamp}-${random}${ext}`;
        const oldPath = req.file.path;
        const newPath = path.join(uploadsDir, newFilename);
        
        fs.renameSync(oldPath, newPath);
        
        const logoPath = `/assets/images/uploads/${newFilename}`;
        
        res.json({ 
            success: true, 
            logoPath: logoPath,
            message: 'Logo uploaded successfully'
        });
    } catch (error) {
        console.error('Logo upload error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🏥 RSU Islam Group Digital Signage Server running on http://localhost:${PORT}`);
});
