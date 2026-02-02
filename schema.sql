-- ParPass Database Schema v1

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Plan Tiers (Core vs Premium)
CREATE TABLE plan_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    monthly_rounds INTEGER NOT NULL DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Plans (Insurance companies/employers)
CREATE TABLE health_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    plan_tier_id UUID NOT NULL REFERENCES plan_tiers(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members (People with the benefit)
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    health_plan_id UUID NOT NULL REFERENCES health_plans(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    parpass_code VARCHAR(8) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Golf Courses (Courses in the network)
CREATE TABLE golf_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    holes INTEGER DEFAULT 18 CHECK (holes IN (9, 18)),
    tier_required VARCHAR(20) DEFAULT 'core' CHECK (tier_required IN ('core', 'premium')),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Golf Utilization (Check-ins / rounds played)
CREATE TABLE golf_utilization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id),
    course_id UUID NOT NULL REFERENCES golf_courses(id),
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    holes_played INTEGER DEFAULT 18 CHECK (holes_played IN (9, 18)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites (Member's saved courses)
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id),
    course_id UUID NOT NULL REFERENCES golf_courses(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, course_id)
);

-- Indexes for performance
CREATE INDEX idx_members_health_plan ON members(health_plan_id);
CREATE INDEX idx_members_parpass_code ON members(parpass_code);
CREATE INDEX idx_golf_utilization_member ON golf_utilization(member_id);
CREATE INDEX idx_golf_utilization_course ON golf_utilization(course_id);
CREATE INDEX idx_golf_utilization_checked_in ON golf_utilization(checked_in_at);
CREATE INDEX idx_favorites_member ON favorites(member_id);
CREATE INDEX idx_golf_courses_tier ON golf_courses(tier_required);
CREATE INDEX idx_golf_courses_location ON golf_courses(state, city);
