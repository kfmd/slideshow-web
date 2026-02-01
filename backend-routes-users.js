const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authRequired, adminRequired } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/users
 * List all users (ADMIN ONLY)
 */
router.get('/', authRequired, adminRequired, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, role, full_name, is_active, created_at, last_login
       FROM users
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * POST /api/users
 * Create new user (ADMIN ONLY)
 */
router.post('/', authRequired, adminRequired, async (req, res) => {
  try {
    const { email, password, full_name, role = 'user' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user exists
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, full_name, is_active, created_at`,
      [email.toLowerCase().trim(), passwordHash, full_name || null, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PATCH /api/users/:id/role
 * Update user role (ADMIN ONLY)
 */
router.patch('/:id/role', authRequired, adminRequired, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Prevent admin from changing their own role
    if (userId === req.user.id) {
      return res.status(403).json({ error: 'Cannot change your own role' });
    }

    const result = await db.query(
      `UPDATE users SET role = $1 WHERE id = $2
       RETURNING id, email, role, full_name, is_active`,
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

/**
 * PATCH /api/users/:id/status
 * Activate/deactivate user (ADMIN ONLY)
 */
router.patch('/:id/status', authRequired, adminRequired, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { is_active } = req.body;

    // Prevent admin from deactivating themselves
    if (userId === req.user.id) {
      return res.status(403).json({ error: 'Cannot change your own status' });
    }

    const result = await db.query(
      `UPDATE users SET is_active = $1 WHERE id = $2
       RETURNING id, email, role, full_name, is_active`,
      [!!is_active, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (ADMIN ONLY)
 */
router.delete('/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(403).json({ error: 'Cannot delete your own account' });
    }

    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
