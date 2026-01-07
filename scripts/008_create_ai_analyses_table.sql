-- Create AI analyses table for storing comprehensive Gemini AI analysis results
CREATE TABLE IF NOT EXISTS ai_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL,
    results JSONB NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    threat_level VARCHAR(20) CHECK (threat_level IN ('safe', 'low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_analyses_user_id ON ai_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_threat_level ON ai_analyses(threat_level);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at ON ai_analyses(created_at);

-- Enable RLS
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own AI analyses" ON ai_analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI analyses" ON ai_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authorities can view all AI analyses" ON ai_analyses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'authority'
        )
    );

-- Grant permissions
GRANT ALL ON ai_analyses TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
