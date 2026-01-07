-- Insert sample countries
INSERT INTO public.countries (name, code, safety_level) VALUES
('United States', 'US', 4),
('United Kingdom', 'GB', 4),
('France', 'FR', 4),
('Germany', 'DE', 4),
('Japan', 'JP', 5),
('Thailand', 'TH', 3),
('India', 'IN', 2),
('Brazil', 'BR', 2),
('South Africa', 'ZA', 2),
('Australia', 'AU', 5)
ON CONFLICT (code) DO NOTHING;

-- Insert sample safety alerts
INSERT INTO public.safety_alerts (country_id, title, description, severity, alert_type) 
SELECT 
  c.id,
  'Health Advisory',
  'Travelers should be aware of seasonal flu outbreaks. Vaccination recommended.',
  'medium',
  'health'
FROM public.countries c WHERE c.code = 'TH';

INSERT INTO public.safety_alerts (country_id, title, description, severity, alert_type)
SELECT 
  c.id,
  'Weather Warning',
  'Monsoon season approaching. Heavy rainfall expected in coastal areas.',
  'high',
  'weather'
FROM public.countries c WHERE c.code = 'IN';

-- Insert sample travel tips
INSERT INTO public.travel_tips (country_id, title, content, category)
SELECT 
  c.id,
  'Currency Exchange Tips',
  'Use official exchange counters at airports or banks. Avoid street money changers.',
  'general'
FROM public.countries c WHERE c.code = 'TH';

INSERT INTO public.travel_tips (country_id, title, content, category)
SELECT 
  c.id,
  'Transportation Safety',
  'Use registered taxi services or ride-sharing apps. Avoid unmarked vehicles.',
  'transport'
FROM public.countries c WHERE c.code = 'IN';
