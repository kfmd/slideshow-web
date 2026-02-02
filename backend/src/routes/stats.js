const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/stats
 * Get dashboard statistics (AUTH REQUIRED)
 */
router.get('/', authRequired, async (req, res) => {
  try {
    // Get slide counts
    const slideCounts = await db.query(
      `SELECT 
         COUNT(*) FILTER (WHERE is_active = true) as active,
         COUNT(*) FILTER (WHERE is_active = false) as inactive,
         COUNT(*) as total
       FROM slides`
    );

    // Get slideshow counts
    const slideshowCounts = await db.query(
      `SELECT 
         COUNT(*) FILTER (WHERE is_active = true) as active,
         COUNT(*) FILTER (WHERE is_active = false) as inactive,
         COUNT(*) as total
       FROM slideshows`
    );

    // Get top displayed slides
    const topSlides = await db.query(
      `SELECT 
         s.id,
         s.title,
         s.slideshow_id,
         ss.title as slideshow_title,
         COALESCE(st.display_count, 0) as display_count,
         st.last_displayed
       FROM slides s
       LEFT JOIN slide_stats st ON s.id = st.slide_id
       LEFT JOIN slideshows ss ON s.slideshow_id = ss.id
       ORDER BY st.display_count DESC NULLS LAST
       LIMIT 20`
    );

    // Get total display count
    const totalViews = await db.query(
      'SELECT COALESCE(SUM(display_count), 0) as total FROM slide_stats'
    );

    // Get recent activity
    const recentActivity = await db.query(
      `SELECT 
         s.id,
         s.title,
         ss.title as slideshow_title,
         st.last_displayed
       FROM slides s
       LEFT JOIN slide_stats st ON s.id = st.slide_id
       LEFT JOIN slideshows ss ON s.slideshow_id = ss.id
       WHERE st.last_displayed IS NOT NULL
       ORDER BY st.last_displayed DESC
       LIMIT 10`
    );

    res.json({
      slides: {
        active: parseInt(slideCounts.rows[0].active),
        inactive: parseInt(slideCounts.rows[0].inactive),
        total: parseInt(slideCounts.rows[0].total)
      },
      slideshows: {
        active: parseInt(slideshowCounts.rows[0].active),
        inactive: parseInt(slideshowCounts.rows[0].inactive),
        total: parseInt(slideshowCounts.rows[0].total)
      },
      totalViews: parseInt(totalViews.rows[0].total),
      topSlides: topSlides.rows,
      recentActivity: recentActivity.rows
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/stats/slideshow/:id
 * Get statistics for a specific slideshow (AUTH REQUIRED)
 */
router.get('/slideshow/:id', authRequired, async (req, res) => {
  try {
    const slideshowId = parseInt(req.params.id);

    const stats = await db.query(
      `SELECT 
         s.id,
         s.title,
         s.is_active,
         COALESCE(st.display_count, 0) as display_count,
         st.last_displayed
       FROM slides s
       LEFT JOIN slide_stats st ON s.id = st.slide_id
       WHERE s.slideshow_id = $1
       ORDER BY st.display_count DESC NULLS LAST`,
      [slideshowId]
    );

    const totalViews = await db.query(
      `SELECT COALESCE(SUM(st.display_count), 0) as total
       FROM slides s
       LEFT JOIN slide_stats st ON s.id = st.slide_id
       WHERE s.slideshow_id = $1`,
      [slideshowId]
    );

    res.json({
      slides: stats.rows,
      totalViews: parseInt(totalViews.rows[0].total)
    });

  } catch (error) {
    console.error('Error fetching slideshow stats:', error);
    res.status(500).json({ error: 'Failed to fetch slideshow statistics' });
  }
});

module.exports = router;
