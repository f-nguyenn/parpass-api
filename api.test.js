const request = require('supertest');
const app = require('./index');
const db = require('./db');

// Mock the database
jest.mock('./db');

describe('ParPass API Tests', () => {
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // 1. GET /api/courses - Return active courses with optional tier filter
  // ========================================
  describe('GET /api/courses', () => {
    
    it('should return all active courses without tier filter', async () => {
      const mockCourses = [
        {
          id: '1',
          name: 'Course A',
          tier_required: 'core',
          is_active: true,
          city: 'San Francisco',
          state: 'CA'
        },
        {
          id: '2',
          name: 'Course B',
          tier_required: 'premium',
          is_active: true,
          city: 'Los Angeles',
          state: 'CA'
        }
      ];

      db.query.mockResolvedValue({ rows: mockCourses });

      const response = await request(app).get('/api/courses');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCourses);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM golf_courses WHERE is_active = true ORDER BY name',
        []
      );
    });

    it('should return only core tier courses when tier=core filter is applied', async () => {
      const mockCoreCourses = [
        {
          id: '1',
          name: 'Course A',
          tier_required: 'core',
          is_active: true,
          city: 'San Francisco',
          state: 'CA'
        }
      ];

      db.query.mockResolvedValue({ rows: mockCoreCourses });

      const response = await request(app).get('/api/courses?tier=core');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCoreCourses);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM golf_courses WHERE is_active = true AND tier_required = $1 ORDER BY name',
        ['core']
      );
    });

    it('should return only premium tier courses when tier=premium filter is applied', async () => {
      const mockPremiumCourses = [
        {
          id: '2',
          name: 'Course B',
          tier_required: 'premium',
          is_active: true,
          city: 'Los Angeles',
          state: 'CA'
        }
      ];

      db.query.mockResolvedValue({ rows: mockPremiumCourses });

      const response = await request(app).get('/api/courses?tier=premium');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPremiumCourses);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM golf_courses WHERE is_active = true AND tier_required = $1 ORDER BY name',
        ['premium']
      );
    });

    it('should handle database errors gracefully', async () => {
      db.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/courses');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Server error' });
    });
  });

  // ========================================
  // 2. GET /api/members/code/:code - Return member details
  // ========================================
  describe('GET /api/members/code/:code', () => {
    
    it('should return member details for a valid code', async () => {
      const mockMember = {
        id: 'member-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        parpass_code: 'ABC12345',
        status: 'active',
        health_plan_name: 'Blue Cross',
        tier: 'premium',
        monthly_rounds: 8
      };

      db.query.mockResolvedValue({ rows: [mockMember] });

      const response = await request(app).get('/api/members/code/ABC12345');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMember);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE m.parpass_code = $1'),
        ['ABC12345']
      );
    });

    it('should return 404 for an invalid code', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/api/members/code/INVALID');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Member not found' });
    });

    it('should handle database errors', async () => {
      db.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/members/code/ABC12345');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Server error' });
    });
  });

  // ========================================
  // 3. POST /api/check-in - Successful check-in scenarios
  // ========================================
  describe('POST /api/check-in - Successful scenarios', () => {
    
    it('should successfully check in an active member within monthly limit to an accessible course', async () => {
      const mockMember = {
        id: 'member-123',
        status: 'active',
        tier: 'premium',
        monthly_rounds: 8
      };

      const mockCourse = {
        id: 'course-456',
        name: 'Test Course',
        tier_required: 'core'
      };

      const mockCheckIn = {
        id: 'checkin-789',
        member_id: 'member-123',
        course_id: 'course-456',
        holes_played: 18,
        checked_in_at: new Date().toISOString()
      };

      // Mock sequence: member query, usage query, course query, insert
      db.query
        .mockResolvedValueOnce({ rows: [mockMember] })  // Member lookup
        .mockResolvedValueOnce({ rows: [{ rounds_used: '3' }] })  // Usage check
        .mockResolvedValueOnce({ rows: [mockCourse] })  // Course lookup
        .mockResolvedValueOnce({ rows: [mockCheckIn] });  // Insert check-in

      const response = await request(app)
        .post('/api/check-in')
        .send({
          member_id: 'member-123',
          course_id: 'course-456',
          holes_played: 18
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('check_in');
      expect(response.body).toHaveProperty('rounds_remaining', 4);
      expect(response.body.check_in).toEqual(mockCheckIn);
    });

    it('should successfully check in a premium member to a premium course', async () => {
      const mockMember = {
        id: 'member-123',
        status: 'active',
        tier: 'premium',
        monthly_rounds: 8
      };

      const mockCourse = {
        id: 'course-456',
        tier_required: 'premium'
      };

      const mockCheckIn = {
        id: 'checkin-789',
        member_id: 'member-123',
        course_id: 'course-456'
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockMember] })
        .mockResolvedValueOnce({ rows: [{ rounds_used: '0' }] })
        .mockResolvedValueOnce({ rows: [mockCourse] })
        .mockResolvedValueOnce({ rows: [mockCheckIn] });

      const response = await request(app)
        .post('/api/check-in')
        .send({
          member_id: 'member-123',
          course_id: 'course-456'
        });

      expect(response.status).toBe(201);
      expect(response.body.rounds_remaining).toBe(7);
    });

    it('should successfully check in a core member to a core course', async () => {
      const mockMember = {
        id: 'member-456',
        status: 'active',
        tier: 'core',
        monthly_rounds: 4
      };

      const mockCourse = {
        id: 'course-123',
        tier_required: 'core'
      };

      const mockCheckIn = {
        id: 'checkin-999',
        member_id: 'member-456',
        course_id: 'course-123'
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockMember] })
        .mockResolvedValueOnce({ rows: [{ rounds_used: '2' }] })
        .mockResolvedValueOnce({ rows: [mockCourse] })
        .mockResolvedValueOnce({ rows: [mockCheckIn] });

      const response = await request(app)
        .post('/api/check-in')
        .send({
          member_id: 'member-456',
          course_id: 'course-123'
        });

      expect(response.status).toBe(201);
      expect(response.body.rounds_remaining).toBe(1);
    });
  });

  // ========================================
  // 4. POST /api/check-in - Failure scenarios
  // ========================================
  describe('POST /api/check-in - Failure scenarios', () => {
    
    it('should prevent check-in for inactive members', async () => {
      const mockMember = {
        id: 'member-123',
        status: 'inactive',
        tier: 'premium',
        monthly_rounds: 8
      };

      db.query.mockResolvedValueOnce({ rows: [mockMember] });

      const response = await request(app)
        .post('/api/check-in')
        .send({
          member_id: 'member-123',
          course_id: 'course-456'
        });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Member is not active' });
    });

    it('should prevent check-in for suspended members', async () => {
      const mockMember = {
        id: 'member-123',
        status: 'suspended',
        tier: 'premium',
        monthly_rounds: 8
      };

      db.query.mockResolvedValueOnce({ rows: [mockMember] });

      const response = await request(app)
        .post('/api/check-in')
        .send({
          member_id: 'member-123',
          course_id: 'course-456'
        });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Member is not active' });
    });

    it('should prevent check-in when monthly limit is reached', async () => {
      const mockMember = {
        id: 'member-123',
        status: 'active',
        tier: 'core',
        monthly_rounds: 4
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockMember] })
        .mockResolvedValueOnce({ rows: [{ rounds_used: '4' }] });  // At limit

      const response = await request(app)
        .post('/api/check-in')
        .send({
          member_id: 'member-123',
          course_id: 'course-456'
        });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Monthly round limit reached' });
    });

    it('should prevent check-in when monthly limit is exceeded', async () => {
      const mockMember = {
        id: 'member-123',
        status: 'active',
        tier: 'premium',
        monthly_rounds: 8
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockMember] })
        .mockResolvedValueOnce({ rows: [{ rounds_used: '10' }] });  // Over limit

      const response = await request(app)
        .post('/api/check-in')
        .send({
          member_id: 'member-123',
          course_id: 'course-456'
        });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Monthly round limit reached' });
    });

    it('should prevent core members from accessing premium courses', async () => {
      const mockMember = {
        id: 'member-123',
        status: 'active',
        tier: 'core',
        monthly_rounds: 4
      };

      const mockCourse = {
        id: 'course-456',
        tier_required: 'premium'
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockMember] })
        .mockResolvedValueOnce({ rows: [{ rounds_used: '1' }] })
        .mockResolvedValueOnce({ rows: [mockCourse] });

      const response = await request(app)
        .post('/api/check-in')
        .send({
          member_id: 'member-123',
          course_id: 'course-456'
        });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Premium course requires premium membership' });
    });

    it('should return 404 for non-existent member', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/check-in')
        .send({
          member_id: 'non-existent',
          course_id: 'course-456'
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Member not found' });
    });

    it('should return 404 for non-existent course', async () => {
      const mockMember = {
        id: 'member-123',
        status: 'active',
        tier: 'premium',
        monthly_rounds: 8
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockMember] })
        .mockResolvedValueOnce({ rows: [{ rounds_used: '2' }] })
        .mockResolvedValueOnce({ rows: [] });  // Course not found

      const response = await request(app)
        .post('/api/check-in')
        .send({
          member_id: 'member-123',
          course_id: 'non-existent'
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Course not found' });
    });
  });

  // ========================================
  // 5. Favorites endpoints - GET, POST, DELETE
  // ========================================
  describe('Favorites endpoints', () => {
    
    describe('GET /api/members/:id/favorites', () => {
      
      it('should retrieve all favorites for a member', async () => {
        const mockFavorites = [
          {
            id: 'course-1',
            name: 'Favorite Course A',
            city: 'San Francisco',
            state: 'CA',
            tier_required: 'core'
          },
          {
            id: 'course-2',
            name: 'Favorite Course B',
            city: 'Los Angeles',
            state: 'CA',
            tier_required: 'premium'
          }
        ];

        db.query.mockResolvedValue({ rows: mockFavorites });

        const response = await request(app).get('/api/members/member-123/favorites');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockFavorites);
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('WHERE f.member_id = $1'),
          ['member-123']
        );
      });

      it('should return empty array when member has no favorites', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const response = await request(app).get('/api/members/member-123/favorites');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
      });

      it('should handle database errors', async () => {
        db.query.mockRejectedValue(new Error('Database error'));

        const response = await request(app).get('/api/members/member-123/favorites');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Server error' });
      });
    });

    describe('POST /api/members/:id/favorites', () => {
      
      it('should successfully add a new favorite course', async () => {
        const mockFavorite = {
          id: 'favorite-123',
          member_id: 'member-123',
          course_id: 'course-456',
          created_at: new Date().toISOString()
        };

        db.query.mockResolvedValue({ rows: [mockFavorite] });

        const response = await request(app)
          .post('/api/members/member-123/favorites')
          .send({ course_id: 'course-456' });

        expect(response.status).toBe(201);
        expect(response.body).toEqual(mockFavorite);
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO favorites'),
          ['member-123', 'course-456']
        );
      });

      it('should handle duplicate favorites gracefully', async () => {
        db.query.mockResolvedValue({ rows: [] });  // ON CONFLICT DO NOTHING returns empty

        const response = await request(app)
          .post('/api/members/member-123/favorites')
          .send({ course_id: 'course-456' });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({ message: 'Already favorited' });
      });

      it('should handle database errors', async () => {
        db.query.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .post('/api/members/member-123/favorites')
          .send({ course_id: 'course-456' });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Server error' });
      });
    });

    describe('DELETE /api/members/:id/favorites/:courseId', () => {
      
      it('should successfully remove a favorite course', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const response = await request(app)
          .delete('/api/members/member-123/favorites/course-456');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Favorite removed' });
        expect(db.query).toHaveBeenCalledWith(
          expect.stringContaining('DELETE FROM favorites'),
          ['member-123', 'course-456']
        );
      });

      it('should return success even if favorite does not exist', async () => {
        db.query.mockResolvedValue({ rows: [] });

        const response = await request(app)
          .delete('/api/members/member-123/favorites/non-existent');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Favorite removed' });
      });

      it('should handle database errors', async () => {
        db.query.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
          .delete('/api/members/member-123/favorites/course-456');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Server error' });
      });
    });
  });
});
