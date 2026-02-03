-- Seed some sample reviews for testing

INSERT INTO reviews (member_id, course_id, rating, comment) VALUES
    -- TPC Sawgrass Stadium reviews
    ('aaaaaaaa-0001-0001-0001-000000000001', '11111111-aaaa-1111-aaaa-111111111111', 5, 'Absolutely world-class course! The island green on 17 is everything you dream of. Worth every penny.'),
    ('aaaaaaaa-0002-0002-0002-000000000002', '11111111-aaaa-1111-aaaa-111111111111', 5, 'A bucket list course for sure. Conditions were immaculate.'),
    ('aaaaaaaa-0003-0003-0003-000000000003', '11111111-aaaa-1111-aaaa-111111111111', 4, 'Amazing experience but can get very windy. Bring extra balls!'),
    ('aaaaaaaa-0007-0007-0007-000000000007', '11111111-aaaa-1111-aaaa-111111111111', 5, 'Once in a lifetime experience. The staff was incredibly professional.'),

    -- Windsor Parke reviews
    ('aaaaaaaa-0001-0001-0001-000000000001', '55555555-eeee-5555-eeee-555555555555', 4, 'Great local course with well-maintained greens. Good value for the area.'),
    ('aaaaaaaa-0004-0004-0004-000000000004', '55555555-eeee-5555-eeee-555555555555', 4, 'Nice layout through the trees. Staff is friendly.'),
    ('aaaaaaaa-0005-0005-0005-000000000005', '55555555-eeee-5555-eeee-555555555555', 3, 'Decent course but can get crowded on weekends.'),

    -- Jacksonville Beach Golf Club reviews
    ('aaaaaaaa-0002-0002-0002-000000000002', '66666666-ffff-6666-ffff-666666666666', 4, 'Love the ocean breeze! Fun course close to the beach.'),
    ('aaaaaaaa-0008-0008-0008-000000000008', '66666666-ffff-6666-ffff-666666666666', 5, 'Perfect course for a morning round then hitting the beach after.'),

    -- Blue Sky Golf Club reviews
    ('aaaaaaaa-0004-0004-0004-000000000004', '77777777-aaaa-7777-aaaa-777777777777', 4, 'Hidden gem in Jacksonville. Challenging but fair layout.'),
    ('aaaaaaaa-0009-0009-0009-000000000009', '77777777-aaaa-7777-aaaa-777777777777', 4, 'Great course for the price. Will definitely come back.'),

    -- Queens Harbour reviews
    ('aaaaaaaa-0001-0001-0001-000000000001', '33333333-cccc-3333-cccc-333333333333', 5, 'Beautiful private club feel. The views are stunning.'),
    ('aaaaaaaa-0003-0003-0003-000000000003', '33333333-cccc-3333-cccc-333333333333', 4, 'Excellent course conditions. A bit pricey but worth it for special occasions.');
