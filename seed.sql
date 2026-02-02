-- ParPass Seed Data - Jacksonville, Florida Market

-- Insert Plan Tiers
INSERT INTO plan_tiers (id, name, monthly_rounds) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'core', 4),
    ('b2222222-2222-2222-2222-222222222222', 'premium', 4);

-- Insert Health Plans (Real Jacksonville Employers)
INSERT INTO health_plans (id, name, plan_tier_id) VALUES
    ('c3333333-3333-3333-3333-333333333333', 'Florida Blue Employee Wellness', 'b2222222-2222-2222-2222-222222222222'),
    ('d4444444-4444-4444-4444-444444444444', 'Baptist Health Team Member Benefits', 'a1111111-1111-1111-1111-111111111111'),
    ('e5555555-5555-5555-5555-555555555555', 'Mayo Clinic Jacksonville Wellness', 'b2222222-2222-2222-2222-222222222222'),
    ('f6666666-6666-6666-6666-666666666666', 'Bank of America Jax Benefits', 'a1111111-1111-1111-1111-111111111111');

-- Insert Golf Courses (Real Jacksonville Area Courses)
INSERT INTO golf_courses (id, name, city, state, zip, latitude, longitude, holes, tier_required, phone) VALUES
    -- Premium Courses
    ('11111111-aaaa-1111-aaaa-111111111111', 'TPC Sawgrass - Stadium Course', 'Ponte Vedra Beach', 'FL', '32082', 30.1975, -81.3959, 18, 'premium', '904-273-3235'),
    ('22222222-bbbb-2222-bbbb-222222222222', 'TPC Sawgrass - Dyes Valley Course', 'Ponte Vedra Beach', 'FL', '32082', 30.1980, -81.3950, 18, 'premium', '904-273-3235'),
    ('33333333-cccc-3333-cccc-333333333333', 'Queens Harbour Yacht & Country Club', 'Jacksonville', 'FL', '32225', 30.3847, -81.4389, 18, 'premium', '904-220-2118'),
    ('44444444-dddd-4444-dddd-444444444444', 'Timuquana Country Club', 'Jacksonville', 'FL', '32210', 30.2891, -81.7341, 18, 'premium', '904-388-1234'),
    
    -- Core Courses
    ('55555555-eeee-5555-eeee-555555555555', 'Windsor Parke Golf Club', 'Jacksonville', 'FL', '32224', 30.2941, -81.4589, 18, 'core', '904-223-4653'),
    ('66666666-ffff-6666-ffff-666666666666', 'Jacksonville Beach Golf Club', 'Jacksonville Beach', 'FL', '32250', 30.2766, -81.4012, 18, 'core', '904-247-6184'),
    ('77777777-aaaa-7777-aaaa-777777777777', 'Blue Sky Golf Club', 'Jacksonville', 'FL', '32216', 30.2589, -81.5456, 18, 'core', '904-641-2653'),
    ('88888888-bbbb-8888-bbbb-888888888888', 'Hidden Hills Golf Club', 'Jacksonville', 'FL', '32218', 30.4512, -81.6234, 18, 'core', '904-757-2655'),
    ('99999999-cccc-9999-cccc-999999999999', 'Bent Creek Golf Course', 'Jacksonville', 'FL', '32222', 30.2234, -81.7012, 18, 'core', '904-779-0800');

-- Insert Members (Mix of employees from local companies)
INSERT INTO members (id, health_plan_id, first_name, last_name, email, parpass_code, status) VALUES
    -- Florida Blue employees (Premium)
    ('aaaaaaaa-0001-0001-0001-000000000001', 'c3333333-3333-3333-3333-333333333333', 'Marcus', 'Thompson', 'marcus.t@floridablue.com', 'PP100001', 'active'),
    ('aaaaaaaa-0002-0002-0002-000000000002', 'c3333333-3333-3333-3333-333333333333', 'Rachel', 'Gonzalez', 'rachel.g@floridablue.com', 'PP100002', 'active'),
    ('aaaaaaaa-0003-0003-0003-000000000003', 'c3333333-3333-3333-3333-333333333333', 'Derek', 'Washington', 'derek.w@floridablue.com', 'PP100003', 'active'),
    
    -- Baptist Health employees (Core)
    ('aaaaaaaa-0004-0004-0004-000000000004', 'd4444444-4444-4444-4444-444444444444', 'Amanda', 'Chen', 'amanda.c@baptistjax.com', 'PP100004', 'active'),
    ('aaaaaaaa-0005-0005-0005-000000000005', 'd4444444-4444-4444-4444-444444444444', 'Carlos', 'Rivera', 'carlos.r@baptistjax.com', 'PP100005', 'active'),
    ('aaaaaaaa-0006-0006-0006-000000000006', 'd4444444-4444-4444-4444-444444444444', 'Brittany', 'Moore', 'brittany.m@baptistjax.com', 'PP100006', 'inactive'),
    
    -- Mayo Clinic employees (Premium)
    ('aaaaaaaa-0007-0007-0007-000000000007', 'e5555555-5555-5555-5555-555555555555', 'Kevin', 'Patel', 'kevin.p@mayo.edu', 'PP100007', 'active'),
    ('aaaaaaaa-0008-0008-0008-000000000008', 'e5555555-5555-5555-5555-555555555555', 'Stephanie', 'Williams', 'stephanie.w@mayo.edu', 'PP100008', 'active'),
    
    -- Bank of America employees (Core)
    ('aaaaaaaa-0009-0009-0009-000000000009', 'f6666666-6666-6666-6666-666666666666', 'Michael', 'Johnson', 'michael.j@bofa.com', 'PP100009', 'active'),
    ('aaaaaaaa-0010-0010-0010-000000000010', 'f6666666-6666-6666-6666-666666666666', 'Jessica', 'Davis', 'jessica.d@bofa.com', 'PP100010', 'active');

-- Insert Golf Utilization (check-ins over the past 2 months)
INSERT INTO golf_utilization (member_id, course_id, checked_in_at, holes_played) VALUES
    -- Marcus Thompson (Florida Blue - Premium) - plays premium courses
    ('aaaaaaaa-0001-0001-0001-000000000001', '11111111-aaaa-1111-aaaa-111111111111', NOW() - INTERVAL '45 days', 18),
    ('aaaaaaaa-0001-0001-0001-000000000001', '22222222-bbbb-2222-bbbb-222222222222', NOW() - INTERVAL '30 days', 18),
    ('aaaaaaaa-0001-0001-0001-000000000001', '33333333-cccc-3333-cccc-333333333333', NOW() - INTERVAL '12 days', 18),
    ('aaaaaaaa-0001-0001-0001-000000000001', '55555555-eeee-5555-eeee-555555555555', NOW() - INTERVAL '5 days', 18),
    
    -- Rachel Gonzalez (Florida Blue - Premium) - occasional player
    ('aaaaaaaa-0002-0002-0002-000000000002', '11111111-aaaa-1111-aaaa-111111111111', NOW() - INTERVAL '20 days', 18),
    ('aaaaaaaa-0002-0002-0002-000000000002', '66666666-ffff-6666-ffff-666666666666', NOW() - INTERVAL '8 days', 18),
    
    -- Derek Washington (Florida Blue - Premium) - heavy user
    ('aaaaaaaa-0003-0003-0003-000000000003', '11111111-aaaa-1111-aaaa-111111111111', NOW() - INTERVAL '50 days', 18),
    ('aaaaaaaa-0003-0003-0003-000000000003', '44444444-dddd-4444-dddd-444444444444', NOW() - INTERVAL '38 days', 18),
    ('aaaaaaaa-0003-0003-0003-000000000003', '33333333-cccc-3333-cccc-333333333333', NOW() - INTERVAL '25 days', 18),
    ('aaaaaaaa-0003-0003-0003-000000000003', '22222222-bbbb-2222-bbbb-222222222222', NOW() - INTERVAL '18 days', 18),
    ('aaaaaaaa-0003-0003-0003-000000000003', '55555555-eeee-5555-eeee-555555555555', NOW() - INTERVAL '10 days', 18),
    ('aaaaaaaa-0003-0003-0003-000000000003', '11111111-aaaa-1111-aaaa-111111111111', NOW() - INTERVAL '3 days', 18),
    
    -- Amanda Chen (Baptist Health - Core) - plays core courses only
    ('aaaaaaaa-0004-0004-0004-000000000004', '55555555-eeee-5555-eeee-555555555555', NOW() - INTERVAL '35 days', 18),
    ('aaaaaaaa-0004-0004-0004-000000000004', '66666666-ffff-6666-ffff-666666666666', NOW() - INTERVAL '21 days', 18),
    ('aaaaaaaa-0004-0004-0004-000000000004', '77777777-aaaa-7777-aaaa-777777777777', NOW() - INTERVAL '7 days', 18),
    
    -- Carlos Rivera (Baptist Health - Core) - avid golfer, maxes out rounds
    ('aaaaaaaa-0005-0005-0005-000000000005', '88888888-bbbb-8888-bbbb-888888888888', NOW() - INTERVAL '52 days', 18),
    ('aaaaaaaa-0005-0005-0005-000000000005', '99999999-cccc-9999-cccc-999999999999', NOW() - INTERVAL '45 days', 18),
    ('aaaaaaaa-0005-0005-0005-000000000005', '55555555-eeee-5555-eeee-555555555555', NOW() - INTERVAL '38 days', 18),
    ('aaaaaaaa-0005-0005-0005-000000000005', '66666666-ffff-6666-ffff-666666666666', NOW() - INTERVAL '30 days', 18),
    ('aaaaaaaa-0005-0005-0005-000000000005', '77777777-aaaa-7777-aaaa-777777777777', NOW() - INTERVAL '23 days', 18),
    ('aaaaaaaa-0005-0005-0005-000000000005', '88888888-bbbb-8888-bbbb-888888888888', NOW() - INTERVAL '16 days', 18),
    ('aaaaaaaa-0005-0005-0005-000000000005', '99999999-cccc-9999-cccc-999999999999', NOW() - INTERVAL '9 days', 18),
    ('aaaaaaaa-0005-0005-0005-000000000005', '55555555-eeee-5555-eeee-555555555555', NOW() - INTERVAL '2 days', 18),
    
    -- Kevin Patel (Mayo Clinic - Premium) - weekend golfer
    ('aaaaaaaa-0007-0007-0007-000000000007', '11111111-aaaa-1111-aaaa-111111111111', NOW() - INTERVAL '28 days', 18),
    ('aaaaaaaa-0007-0007-0007-000000000007', '44444444-dddd-4444-dddd-444444444444', NOW() - INTERVAL '14 days', 18),
    
    -- Stephanie Williams (Mayo Clinic - Premium) - new member, just started
    ('aaaaaaaa-0008-0008-0008-000000000008', '66666666-ffff-6666-ffff-666666666666', NOW() - INTERVAL '5 days', 18),
    
    -- Michael Johnson (Bank of America - Core) - regular player
    ('aaaaaaaa-0009-0009-0009-000000000009', '77777777-aaaa-7777-aaaa-777777777777', NOW() - INTERVAL '40 days', 18),
    ('aaaaaaaa-0009-0009-0009-000000000009', '55555555-eeee-5555-eeee-555555555555', NOW() - INTERVAL '26 days', 18),
    ('aaaaaaaa-0009-0009-0009-000000000009', '99999999-cccc-9999-cccc-999999999999', NOW() - INTERVAL '12 days', 18),
    
    -- Jessica Davis (Bank of America - Core) - light user
    ('aaaaaaaa-0010-0010-0010-000000000010', '66666666-ffff-6666-ffff-666666666666', NOW() - INTERVAL '18 days', 9);

-- Insert Favorites
INSERT INTO favorites (member_id, course_id) VALUES
    -- Marcus loves TPC
    ('aaaaaaaa-0001-0001-0001-000000000001', '11111111-aaaa-1111-aaaa-111111111111'),
    ('aaaaaaaa-0001-0001-0001-000000000001', '22222222-bbbb-2222-bbbb-222222222222'),
    -- Rachel likes the beach course
    ('aaaaaaaa-0002-0002-0002-000000000002', '66666666-ffff-6666-ffff-666666666666'),
    -- Derek favorites multiple premium courses
    ('aaaaaaaa-0003-0003-0003-000000000003', '11111111-aaaa-1111-aaaa-111111111111'),
    ('aaaaaaaa-0003-0003-0003-000000000003', '33333333-cccc-3333-cccc-333333333333'),
    ('aaaaaaaa-0003-0003-0003-000000000003', '44444444-dddd-4444-dddd-444444444444'),
    -- Amanda likes Windsor Parke
    ('aaaaaaaa-0004-0004-0004-000000000004', '55555555-eeee-5555-eeee-555555555555'),
    -- Carlos favorites all the courses he plays
    ('aaaaaaaa-0005-0005-0005-000000000005', '88888888-bbbb-8888-bbbb-888888888888'),
    ('aaaaaaaa-0005-0005-0005-000000000005', '99999999-cccc-9999-cccc-999999999999'),
    ('aaaaaaaa-0005-0005-0005-000000000005', '77777777-aaaa-7777-aaaa-777777777777'),
    -- Kevin loves Timuquana
    ('aaaaaaaa-0007-0007-0007-000000000007', '44444444-dddd-4444-dddd-444444444444'),
    -- Michael likes Blue Sky
    ('aaaaaaaa-0009-0009-0009-000000000009', '77777777-aaaa-7777-aaaa-777777777777');
