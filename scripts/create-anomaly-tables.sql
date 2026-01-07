-- Create tables for AI anomaly detection system

-- Device metrics table for storing sensor data
CREATE TABLE IF NOT EXISTS device_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  battery_level INTEGER NOT NULL,
  connection_strength INTEGER NOT NULL,
  location_accuracy INTEGER NOT NULL,
  movement_pattern TEXT NOT NULL,
  ambient_light REAL NOT NULL,
  noise_level REAL NOT NULL,
  location_lat REAL NOT NULL,
  location_lng REAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anomaly patterns table for storing detected anomalies
CREATE TABLE IF NOT EXISTS anomaly_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('behavioral', 'location', 'device', 'environmental', 'temporal')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence REAL NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
  description TEXT NOT NULL,
  risk_factors TEXT[] NOT NULL DEFAULT '{}',
  recommendations TEXT[] NOT NULL DEFAULT '{}',
  location_lat REAL NOT NULL,
  location_lng REAL NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- AI learning patterns table for storing behavioral baselines
CREATE TABLE IF NOT EXISTS ai_learning_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  confidence_score REAL NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Threat assessment history table
CREATE TABLE IF NOT EXISTS threat_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  threat_level TEXT NOT NULL CHECK (threat_level IN ('safe', 'low', 'medium', 'high', 'critical')),
  analysis_confidence REAL NOT NULL,
  contributing_factors TEXT[] NOT NULL DEFAULT '{}',
  location_lat REAL NOT NULL,
  location_lng REAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_metrics_user_id ON device_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_device_metrics_created_at ON device_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_anomaly_patterns_user_id ON anomaly_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_patterns_severity ON anomaly_patterns(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_patterns_resolved ON anomaly_patterns(resolved);
CREATE INDEX IF NOT EXISTS idx_ai_learning_patterns_user_id ON ai_learning_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_threat_assessments_user_id ON threat_assessments(user_id);

-- Enable Row Level Security
ALTER TABLE device_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_assessments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own device metrics" ON device_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device metrics" ON device_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own anomaly patterns" ON anomaly_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own anomaly patterns" ON anomaly_patterns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert anomaly patterns" ON anomaly_patterns
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own learning patterns" ON ai_learning_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage learning patterns" ON ai_learning_patterns
  FOR ALL WITH CHECK (true);

CREATE POLICY "Users can view their own threat assessments" ON threat_assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert threat assessments" ON threat_assessments
  FOR INSERT WITH CHECK (true);

-- Authorities can view all data for monitoring
CREATE POLICY "Authorities can view all device metrics" ON device_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'authority'
    )
  );

CREATE POLICY "Authorities can view all anomaly patterns" ON anomaly_patterns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'authority'
    )
  );

CREATE POLICY "Authorities can update anomaly patterns" ON anomaly_patterns
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'authority'
    )
  );
