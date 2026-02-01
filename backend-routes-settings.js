const express = require('express');
const db = require('../db');
const { authRequired, adminRequired } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/settings
 * Get all application settings (AUTH REQUIRED)
 */
router.get('/', authRequired, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM settings ORDER BY key');
    
    // Convert to key-value object
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * POST /api/settings
 * Update application settings (ADMIN ONLY)
 */
router.post('/', authRequired, adminRequired, async (req, res) => {
  try {
    const updates = req.body;

    // Update each setting
    for (const [key, value] of Object.entries(updates)) {
      await db.query(
        `INSERT INTO settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) 
         DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
        [key, String(value)]
      );
    }

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * GET /api/settings/:key
 * Get a specific setting (AUTH REQUIRED)
 */
router.get('/:key', authRequired, async (req, res) => {
  try {
    const { key } = req.params;
    
    const result = await db.query(
      'SELECT * FROM settings WHERE key = $1',
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

module.exports = router;
