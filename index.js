const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'ParPass API is running' });
});

// Get all courses (with optional tier filter)
app.get('/api/courses', async (req, res) => {
  try {
    const { tier } = req.query;
    let query = 'SELECT * FROM golf_courses WHERE is_active = true';
    const params = [];
    
    if (tier) {
      query += ' AND tier_required = $1';
      params.push(tier);
    }
    
    query += ' ORDER BY name';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single course by ID
app.get('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM golf_courses WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get member by ParPass code (for check-in)
app.get('/api/members/code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await db.query(`
      SELECT 
        m.*,
        hp.name as health_plan_name,
        pt.name as tier,
        pt.monthly_rounds
      FROM members m
      JOIN health_plans hp ON m.health_plan_id = hp.id
      JOIN plan_tiers pt ON hp.plan_tier_id = pt.id
      WHERE m.parpass_code = $1
    `, [code]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get member's rounds used this month
app.get('/api/members/:id/usage', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT COUNT(*) as rounds_used
      FROM golf_utilization
      WHERE member_id = $1
      AND checked_in_at >= DATE_TRUNC('month', NOW())
    `, [id]);
    
    res.json({ rounds_used: parseInt(result.rows[0].rounds_used) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check in to a course
app.post('/api/check-in', async (req, res) => {
  try {
    const { member_id, course_id, holes_played = 18 } = req.body;
    
    // Verify member exists and is active
    const memberResult = await db.query(`
      SELECT m.*, pt.name as tier, pt.monthly_rounds
      FROM members m
      JOIN health_plans hp ON m.health_plan_id = hp.id
      JOIN plan_tiers pt ON hp.plan_tier_id = pt.id
      WHERE m.id = $1
    `, [member_id]);
    
    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    const member = memberResult.rows[0];
    
    if (member.status !== 'active') {
      return res.status(403).json({ error: 'Member is not active' });
    }
    
    // Check rounds used this month
    const usageResult = await db.query(`
      SELECT COUNT(*) as rounds_used
      FROM golf_utilization
      WHERE member_id = $1
      AND checked_in_at >= DATE_TRUNC('month', NOW())
    `, [member_id]);
    
    const roundsUsed = parseInt(usageResult.rows[0].rounds_used);
    
    if (roundsUsed >= member.monthly_rounds) {
      return res.status(403).json({ error: 'Monthly round limit reached' });
    }
    
    // Verify course exists and member has access
    const courseResult = await db.query('SELECT * FROM golf_courses WHERE id = $1', [course_id]);
    
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const course = courseResult.rows[0];
    
    if (course.tier_required === 'premium' && member.tier === 'core') {
      return res.status(403).json({ error: 'Premium course requires premium membership' });
    }
    
    // Create check-in
    const checkInResult = await db.query(`
      INSERT INTO golf_utilization (member_id, course_id, holes_played)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [member_id, course_id, holes_played]);
    
    res.status(201).json({
      check_in: checkInResult.rows[0],
      rounds_remaining: member.monthly_rounds - roundsUsed - 1
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get member's favorites
app.get('/api/members/:id/favorites', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT gc.*
      FROM favorites f
      JOIN golf_courses gc ON f.course_id = gc.id
      WHERE f.member_id = $1
      ORDER BY gc.name
    `, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a favorite
app.post('/api/members/:id/favorites', async (req, res) => {
  try {
    const { id } = req.params;
    const { course_id } = req.body;
    
    const result = await db.query(`
      INSERT INTO favorites (member_id, course_id)
      VALUES ($1, $2)
      ON CONFLICT (member_id, course_id) DO NOTHING
      RETURNING *
    `, [id, course_id]);
    
    res.status(201).json(result.rows[0] || { message: 'Already favorited' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove a favorite
app.delete('/api/members/:id/favorites/:courseId', async (req, res) => {
  try {
    const { id, courseId } = req.params;
    
    await db.query(`
      DELETE FROM favorites
      WHERE member_id = $1 AND course_id = $2
    `, [id, courseId]);
    
    res.json({ message: 'Favorite removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ParPass API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
