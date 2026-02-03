const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'ParPass API is running', docs: '/docs' });
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         zip:
 *           type: string
 *         holes:
 *           type: integer
 *         tier_required:
 *           type: string
 *           enum: [core, premium]
 *         phone:
 *           type: string
 *     Member:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         email:
 *           type: string
 *         parpass_code:
 *           type: string
 *         status:
 *           type: string
 *         health_plan_name:
 *           type: string
 *         tier:
 *           type: string
 *         monthly_rounds:
 *           type: integer
 */

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: tier
 *         schema:
 *           type: string
 *           enum: [core, premium]
 *         description: Filter by tier
 *     responses:
 *       200:
 *         description: List of courses
 *   post:
 *     summary: Add a new course
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - city
 *               - state
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zip:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               holes:
 *                 type: integer
 *                 default: 18
 *               tier_required:
 *                 type: string
 *                 enum: [core, premium]
 *                 default: core
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course created
 */
app.get('/api/courses', async (req, res) => {
  try {
    const { tier } = req.query;
    let query = `
      SELECT
        gc.*,
        ROUND(AVG(r.rating)::numeric, 1) as average_rating,
        COUNT(r.id) as review_count
      FROM golf_courses gc
      LEFT JOIN reviews r ON gc.id = r.course_id
      WHERE gc.is_active = true
    `;
    const params = [];

    if (tier) {
      query += ' AND gc.tier_required = $1';
      params.push(tier);
    }

    query += ' GROUP BY gc.id ORDER BY gc.name';
    const result = await db.query(query, params);

    // Convert types
    const courses = result.rows.map(row => ({
      ...row,
      average_rating: row.average_rating ? parseFloat(row.average_rating) : null,
      review_count: parseInt(row.review_count)
    }));

    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const { name, address, city, state, zip, latitude, longitude, holes = 18, tier_required = 'core', phone } = req.body;
    
    const result = await db.query(`
      INSERT INTO golf_courses (name, address, city, state, zip, latitude, longitude, holes, tier_required, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [name, address, city, state, zip, latitude, longitude, holes, tier_required, phone]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get a course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
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

/**
 * @swagger
 * /api/members:
 *   post:
 *     summary: Add a new member
 *     tags: [Members]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - health_plan_id
 *               - first_name
 *               - last_name
 *               - email
 *             properties:
 *               health_plan_id:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Member created
 */
app.post('/api/members', async (req, res) => {
  try {
    const { health_plan_id, first_name, last_name, email } = req.body;
    
    // Generate a unique ParPass code
    const codeResult = await db.query('SELECT COUNT(*) FROM members');
    const count = parseInt(codeResult.rows[0].count) + 1;
    const parpass_code = `PP${String(100000 + count).slice(1)}`;
    
    const result = await db.query(`
      INSERT INTO members (health_plan_id, first_name, last_name, email, parpass_code)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [health_plan_id, first_name, last_name, email, parpass_code]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/members/code/{code}:
 *   get:
 *     summary: Get member by ParPass code
 *     tags: [Members]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         example: PP100001
 *     responses:
 *       200:
 *         description: Member details
 *       404:
 *         description: Member not found
 */
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

/**
 * @swagger
 * /api/members/{id}/usage:
 *   get:
 *     summary: Get member's rounds used this month
 *     tags: [Members]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usage info
 */
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

/**
 * @swagger
 * /api/check-in:
 *   post:
 *     summary: Check in a member at a course
 *     tags: [Check-in]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - member_id
 *               - course_id
 *             properties:
 *               member_id:
 *                 type: string
 *               course_id:
 *                 type: string
 *               holes_played:
 *                 type: integer
 *                 default: 18
 *     responses:
 *       201:
 *         description: Check-in successful
 *       403:
 *         description: Not allowed (inactive, limit reached, or tier mismatch)
 */
app.post('/api/check-in', async (req, res) => {
  try {
    const { member_id, course_id, holes_played = 18 } = req.body;
    
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
    
    const courseResult = await db.query('SELECT * FROM golf_courses WHERE id = $1', [course_id]);
    
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const course = courseResult.rows[0];
    
    if (course.tier_required === 'premium' && member.tier === 'core') {
      return res.status(403).json({ error: 'Premium course requires premium membership' });
    }
    
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

/**
 * @swagger
 * /api/members/{id}/favorites:
 *   get:
 *     summary: Get member's favorite courses
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of favorite courses
 *   post:
 *     summary: Add a course to favorites
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - course_id
 *             properties:
 *               course_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Favorite added
 */
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

/**
 * @swagger
 * /api/members/{id}/favorites/{courseId}:
 *   delete:
 *     summary: Remove a course from favorites
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favorite removed
 */
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

/**
 * @swagger
 * /api/health-plans:
 *   get:
 *     summary: Get all health plans
 *     tags: [Health Plans]
 *     responses:
 *       200:
 *         description: List of health plans
 */
app.get('/api/health-plans', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT hp.*, pt.name as tier_name, pt.monthly_rounds
      FROM health_plans hp
      JOIN plan_tiers pt ON hp.plan_tier_id = pt.id
      WHERE hp.is_active = true
      ORDER BY hp.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/members/{id}/history:
 *   get:
 *     summary: Get member's round history
 *     tags: [Members]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of rounds played
 */
app.get('/api/members/:id/history', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query(`
        SELECT 
          gu.id,
          gu.checked_in_at,
          gu.holes_played,
          gc.name as course_name,
          gc.city,
          gc.state,
          gc.tier_required
        FROM golf_utilization gu
        JOIN golf_courses gc ON gu.course_id = gc.id
        WHERE gu.member_id = $1
        ORDER BY gu.checked_in_at DESC
        LIMIT 50
      `, [id]);
      
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
/**
 * @swagger
 * /api/stats/overview:
 *   get:
 *     summary: Get overall platform stats
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Platform statistics
 */
app.get('/api/stats/overview', async (req, res) => {
    try {
      const stats = await db.query(`
        SELECT
          (SELECT COUNT(*) FROM members WHERE status = 'active') as active_members,
          (SELECT COUNT(*) FROM golf_courses WHERE is_active = true) as total_courses,
          (SELECT COUNT(*) FROM golf_utilization) as total_rounds,
          (SELECT COUNT(*) FROM golf_utilization WHERE checked_in_at >= DATE_TRUNC('month', NOW())) as rounds_this_month
      `);
      res.json(stats.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  /**
   * @swagger
   * /api/stats/popular-courses:
   *   get:
   *     summary: Get most popular courses
   *     tags: [Stats]
   *     responses:
   *       200:
   *         description: List of courses by popularity
   */
  app.get('/api/stats/popular-courses', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT 
          gc.id,
          gc.name,
          gc.city,
          gc.tier_required,
          COUNT(gu.id) as total_rounds,
          COUNT(DISTINCT gu.member_id) as unique_members
        FROM golf_courses gc
        LEFT JOIN golf_utilization gu ON gc.id = gu.course_id
        WHERE gc.is_active = true
        GROUP BY gc.id, gc.name, gc.city, gc.tier_required
        ORDER BY total_rounds DESC
        LIMIT 10
      `);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  /**
   * @swagger
   * /api/stats/rounds-by-month:
   *   get:
   *     summary: Get rounds played by month
   *     tags: [Stats]
   *     responses:
   *       200:
   *         description: Monthly round counts
   */
  app.get('/api/stats/rounds-by-month', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', checked_in_at), 'Mon YYYY') as month,
          DATE_TRUNC('month', checked_in_at) as month_date,
          COUNT(*) as rounds
        FROM golf_utilization
        WHERE checked_in_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', checked_in_at)
        ORDER BY month_date ASC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  /**
   * @swagger
   * /api/stats/tier-breakdown:
   *   get:
   *     summary: Get rounds by tier
   *     tags: [Stats]
   *     responses:
   *       200:
   *         description: Tier usage breakdown
   */
  app.get('/api/stats/tier-breakdown', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT 
          gc.tier_required as tier,
          COUNT(gu.id) as rounds
        FROM golf_utilization gu
        JOIN golf_courses gc ON gu.course_id = gc.id
        GROUP BY gc.tier_required
      `);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  /**
   * @swagger
   * /api/stats/top-members:
   *   get:
   *     summary: Get most active members
   *     tags: [Stats]
   *     responses:
   *       200:
   *         description: List of top members by usage
   */
  app.get('/api/stats/top-members', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT 
          m.id,
          m.first_name,
          m.last_name,
          hp.name as health_plan,
          pt.name as tier,
          COUNT(gu.id) as total_rounds
        FROM members m
        JOIN health_plans hp ON m.health_plan_id = hp.id
        JOIN plan_tiers pt ON hp.plan_tier_id = pt.id
        LEFT JOIN golf_utilization gu ON m.id = gu.member_id
        WHERE m.status = 'active'
        GROUP BY m.id, m.first_name, m.last_name, hp.name, pt.name
        ORDER BY total_rounds DESC
        LIMIT 10
      `);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  /**
 * @swagger
 * /api/members/{id}/recommendations:
 *   get:
 *     summary: Get personalized course recommendations
 *     tags: [Members]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of recommended courses
 */
app.get('/api/members/:id/recommendations', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get member's tier
      const memberResult = await db.query(`
        SELECT m.id, pt.name as tier
        FROM members m
        JOIN health_plans hp ON m.health_plan_id = hp.id
        JOIN plan_tiers pt ON hp.plan_tier_id = pt.id
        WHERE m.id = $1
      `, [id]);
      
      if (memberResult.rows.length === 0) {
        return res.status(404).json({ error: 'Member not found' });
      }
      
      const member = memberResult.rows[0];
      const isPremium = member.tier === 'premium';
      
      // Get courses the member has already played
      const playedResult = await db.query(`
        SELECT DISTINCT course_id FROM golf_utilization WHERE member_id = $1
      `, [id]);
      const playedIds = playedResult.rows.map(r => r.course_id);
      
      // Get cities the member has played in
      const citiesResult = await db.query(`
        SELECT DISTINCT gc.city 
        FROM golf_utilization gu
        JOIN golf_courses gc ON gu.course_id = gc.id
        WHERE gu.member_id = $1
      `, [id]);
      const playedCities = citiesResult.rows.map(r => r.city);
      
      // Build recommendation query
      // Prioritize: 
      // 1. Courses in cities they've played (familiar area)
      // 2. Popular courses among same-tier members
      // 3. Courses they haven't played yet
      const recommendations = await db.query(`
        WITH course_popularity AS (
          SELECT 
            gc.id,
            gc.name,
            gc.city,
            gc.state,
            gc.tier_required,
            gc.holes,
            gc.phone,
            COUNT(gu.id) as total_plays,
            COUNT(DISTINCT gu.member_id) as unique_players
          FROM golf_courses gc
          LEFT JOIN golf_utilization gu ON gc.id = gu.course_id
          WHERE gc.is_active = true
          ${isPremium ? '' : "AND gc.tier_required = 'core'"}
          GROUP BY gc.id
        )
        SELECT 
          *,
          CASE 
            WHEN city = ANY($2) THEN 30
            ELSE 0
          END +
          CASE 
            WHEN total_plays > 5 THEN 20
            WHEN total_plays > 2 THEN 10
            ELSE 0
          END +
          CASE
            WHEN unique_players > 3 THEN 15
            WHEN unique_players > 1 THEN 8
            ELSE 0
          END as score
        FROM course_popularity
        WHERE id != ALL($1)
        ORDER BY score DESC, total_plays DESC
        LIMIT 5
      `, [playedIds.length > 0 ? playedIds : ['00000000-0000-0000-0000-000000000000'], playedCities]);
      
      // Add recommendation reasons
      const withReasons = recommendations.rows.map(course => {
        const reasons = [];
        if (playedCities.includes(course.city)) {
          reasons.push(`You've played in ${course.city} before`);
        }
        if (parseInt(course.unique_players) > 1) {
          reasons.push(`Popular with ${course.unique_players} members`);
        }
        if (course.tier_required === 'premium') {
          reasons.push('Premium course');
        }
        if (reasons.length === 0) {
          reasons.push('Recommended for you');
        }
        
        return {
          ...course,
          reason: reasons[0]
        };
      });
      
      res.json(withReasons);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

/**
 * @swagger
 * /api/courses/{id}/reviews:
 *   get:
 *     summary: Get all reviews for a course
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews
 *   post:
 *     summary: Add or update a review for a course
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - member_id
 *               - rating
 *             properties:
 *               member_id:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created/updated
 *       403:
 *         description: Member has not played this course
 */
app.get('/api/courses/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        m.first_name as member_first_name
      FROM reviews r
      JOIN members m ON r.member_id = m.id
      WHERE r.course_id = $1
      ORDER BY r.created_at DESC
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/courses/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { member_id, rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if member has played this course
    const playedResult = await db.query(`
      SELECT id FROM golf_utilization
      WHERE member_id = $1 AND course_id = $2
      LIMIT 1
    `, [member_id, id]);

    if (playedResult.rows.length === 0) {
      return res.status(403).json({ error: 'You must play this course before leaving a review' });
    }

    // Upsert review
    const result = await db.query(`
      INSERT INTO reviews (member_id, course_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (member_id, course_id)
      DO UPDATE SET rating = $3, comment = $4, created_at = NOW()
      RETURNING *
    `, [member_id, id, rating, comment || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/courses/{id}/rating:
 *   get:
 *     summary: Get average rating for a course
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course rating summary
 */
app.get('/api/courses/:id/rating', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT
        ROUND(AVG(rating)::numeric, 1) as average_rating,
        COUNT(*) as review_count
      FROM reviews
      WHERE course_id = $1
    `, [id]);

    const row = result.rows[0];
    res.json({
      average_rating: row.average_rating ? parseFloat(row.average_rating) : null,
      review_count: parseInt(row.review_count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`ParPass API running on http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/docs`);
});

