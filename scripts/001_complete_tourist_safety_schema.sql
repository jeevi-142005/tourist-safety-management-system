-- Complete Tourist Safety Database Schema
-- This creates all necessary tables for the tourist safety system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    role TEXT DEFAULT 'tourist' CHECK (role IN ('tourist', 'admin', 'authority')),
    blockchain_id TEXT UNIQUE,
    qr_code_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Countries table
CREATE TABLE IF NOT EXISTS public.countries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    safety_level INTEGER DEFAULT 3 CHECK (safety_level BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geo zones for geofencing
CREATE TABLE IF NOT EXISTS public.geo_zones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    zone_type TEXT NOT NULL CHECK (zone_type IN ('safe', 'caution', 'high_risk', 'restricted')),
    country_id UUID REFERENCES public.countries(id),
    coordinates JSONB NOT NULL, -- GeoJSON polygon
    center_lat REAL NOT NULL,
    center_lng REAL NOT NULL,
    radius INTEGER, -- in meters
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location tracking
CREATE TABLE IF NOT EXISTS public.location_tracks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy REAL,
    altitude REAL,
    speed REAL,
    heading REAL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    battery_level INTEGER,
    is_emergency BOOLEAN DEFAULT false,
    zone_id UUID REFERENCES public.geo_zones(id)
);

-- Safety alerts
CREATE TABLE IF NOT EXISTS public.safety_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('weather', 'security', 'health', 'transport', 'general')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    country_id UUID REFERENCES public.countries(id),
    zone_id UUID REFERENCES public.geo_zones(id),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- User alerts (notifications sent to users)
CREATE TABLE IF NOT EXISTS public.user_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES public.safety_alerts(id),
    message TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_acknowledged BOOLEAN DEFAULT false,
    location_lat REAL,
    location_lng REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Emergency contacts
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    relationship TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Travel plans
CREATE TABLE IF NOT EXISTS public.travel_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    destination_country_id UUID REFERENCES public.countries(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    planned_route JSONB, -- Array of coordinates
    accommodation_details TEXT,
    emergency_plan TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safety scores (AI-generated)
CREATE TABLE IF NOT EXISTS public.safety_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    factors JSONB NOT NULL, -- Detailed breakdown
    recommendations TEXT[],
    analysis_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anomaly detection patterns
CREATE TABLE IF NOT EXISTS public.anomaly_patterns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('route_deviation', 'unusual_location', 'extended_stay', 'rapid_movement', 'communication_loss')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    location_lat REAL NOT NULL,
    location_lng REAL NOT NULL,
    confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    risk_factors TEXT[],
    recommendations TEXT[],
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device metrics for AI analysis
CREATE TABLE IF NOT EXISTS public.device_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    battery_level INTEGER CHECK (battery_level BETWEEN 0 AND 100),
    connection_strength INTEGER CHECK (connection_strength BETWEEN 0 AND 100),
    location_accuracy INTEGER,
    ambient_light REAL,
    noise_level REAL,
    movement_pattern TEXT,
    location_lat REAL,
    location_lng REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Travel tips
CREATE TABLE IF NOT EXISTS public.travel_tips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('safety', 'health', 'culture', 'transport', 'communication', 'emergency')),
    country_id UUID REFERENCES public.countries(id),
    created_by UUID REFERENCES public.profiles(id),
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blockchain transactions for tourist IDs
CREATE TABLE IF NOT EXISTS public.blockchain_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_hash TEXT UNIQUE NOT NULL,
    contract_address TEXT NOT NULL,
    token_id TEXT NOT NULL,
    blockchain_network TEXT DEFAULT 'polygon',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    gas_used BIGINT,
    transaction_fee DECIMAL(20, 8),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Admin notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('emergency_alert', 'anomaly_detected', 'user_registration', 'system_alert')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    user_id UUID REFERENCES public.profiles(id),
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_location_tracks_user_timestamp ON public.location_tracks(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_location_tracks_coordinates ON public.location_tracks(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_created ON public.user_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_active ON public.safety_alerts(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_geo_zones_type ON public.geo_zones(zone_type, is_active);
CREATE INDEX IF NOT EXISTS idx_anomaly_patterns_user ON public.anomaly_patterns(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_user ON public.blockchain_transactions(user_id, status);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'authority')
        )
    );

-- RLS Policies for location tracking
CREATE POLICY "Users can insert own location" ON public.location_tracks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own location" ON public.location_tracks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all locations" ON public.location_tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'authority')
        )
    );

-- RLS Policies for user alerts
CREATE POLICY "Users can view own alerts" ON public.user_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.user_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert alerts" ON public.user_alerts
    FOR INSERT WITH CHECK (true);

-- RLS Policies for safety alerts (public read, admin write)
CREATE POLICY "Anyone can view active safety alerts" ON public.safety_alerts
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage safety alerts" ON public.safety_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'authority')
        )
    );

-- RLS Policies for other tables (similar pattern)
CREATE POLICY "Users can manage own emergency contacts" ON public.emergency_contacts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own travel plans" ON public.travel_plans
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own safety scores" ON public.safety_scores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own anomaly patterns" ON public.anomaly_patterns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own device metrics" ON public.device_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own blockchain transactions" ON public.blockchain_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view admin notifications" ON public.admin_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'authority')
        )
    );

-- Public read policies for reference data
CREATE POLICY "Anyone can view countries" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Anyone can view geo zones" ON public.geo_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view travel tips" ON public.travel_tips FOR SELECT USING (true);
