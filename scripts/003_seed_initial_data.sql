-- Seed initial data for the tourist safety system

-- Insert sample countries
INSERT INTO public.countries (name, code, safety_level) VALUES
('India', 'IN', 3),
('United States', 'US', 4),
('United Kingdom', 'GB', 4),
('Thailand', 'TH', 3),
('Japan', 'JP', 5),
('France', 'FR', 4),
('Germany', 'DE', 4),
('Australia', 'AU', 4),
('Canada', 'CA', 4),
('Singapore', 'SG', 5)
ON CONFLICT (code) DO NOTHING;

-- Insert sample geo zones for India (focusing on tourist areas)
INSERT INTO public.geo_zones (name, zone_type, country_id, coordinates, center_lat, center_lng, radius, description) VALUES
(
    'Delhi Red Fort Area',
    'safe',
    (SELECT id FROM public.countries WHERE code = 'IN'),
    '{"type":"Polygon","coordinates":[[[77.2380,28.6562],[77.2420,28.6562],[77.2420,28.6602],[77.2380,28.6602],[77.2380,28.6562]]]}',
    28.6582,
    77.2400,
    1000,
    'Tourist-friendly area around Red Fort with good security'
),
(
    'Mumbai Gateway of India',
    'safe',
    (SELECT id FROM public.countries WHERE code = 'IN'),
    '{"type":"Polygon","coordinates":[[[72.8340,18.9200],[72.8380,18.9200],[72.8380,18.9240],[72.8340,18.9240],[72.8340,18.9200]]]}',
    18.9220,
    72.8360,
    800,
    'Well-patrolled tourist area near Gateway of India'
),
(
    'Goa Beach Areas',
    'caution',
    (SELECT id FROM public.countries WHERE code = 'IN'),
    '{"type":"Polygon","coordinates":[[[73.7400,15.2900],[73.7600,15.2900],[73.7600,15.3100],[73.7400,15.3100],[73.7400,15.2900]]]}',
    15.3000,
    73.7500,
    2000,
    'Popular beach area - exercise normal caution, especially at night'
),
(
    'Kashmir Border Region',
    'high_risk',
    (SELECT id FROM public.countries WHERE code = 'IN'),
    '{"type":"Polygon","coordinates":[[[74.8000,34.0000],[75.0000,34.0000],[75.0000,34.2000],[74.8000,34.2000],[74.8000,34.0000]]]}',
    34.1000,
    74.9000,
    5000,
    'High-risk area due to border tensions - avoid unless necessary'
)
ON CONFLICT DO NOTHING;

-- Insert sample safety alerts
INSERT INTO public.safety_alerts (title, description, alert_type, severity, country_id, is_active) VALUES
(
    'Monsoon Weather Advisory',
    'Heavy rainfall expected in coastal areas. Avoid outdoor activities and stay in safe locations.',
    'weather',
    'medium',
    (SELECT id FROM public.countries WHERE code = 'IN'),
    true
),
(
    'Festival Crowd Management',
    'Large crowds expected during Diwali celebrations. Plan alternate routes and stay alert.',
    'general',
    'low',
    (SELECT id FROM public.countries WHERE code = 'IN'),
    true
),
(
    'Health Advisory - Air Quality',
    'Poor air quality in Delhi NCR region. Sensitive individuals should limit outdoor exposure.',
    'health',
    'medium',
    (SELECT id FROM public.countries WHERE code = 'IN'),
    true
)
ON CONFLICT DO NOTHING;

-- Insert sample travel tips
INSERT INTO public.travel_tips (title, content, category, country_id) VALUES
(
    'Emergency Numbers in India',
    'Police: 100, Fire: 101, Ambulance: 108, Tourist Helpline: 1363. Save these numbers in your phone.',
    'emergency',
    (SELECT id FROM public.countries WHERE code = 'IN')
),
(
    'Safe Transportation Tips',
    'Use registered taxis or ride-sharing apps. Avoid traveling alone at night. Keep emergency contacts handy.',
    'transport',
    (SELECT id FROM public.countries WHERE code = 'IN')
),
(
    'Cultural Etiquette',
    'Dress modestly when visiting religious sites. Remove shoes before entering temples. Respect local customs.',
    'culture',
    (SELECT id FROM public.countries WHERE code = 'IN')
),
(
    'Health Precautions',
    'Drink bottled water, avoid street food initially, carry basic medications, and get travel insurance.',
    'health',
    (SELECT id FROM public.countries WHERE code = 'IN')
),
(
    'Money and Safety',
    'Use ATMs in secure locations, don\'t carry large amounts of cash, keep copies of important documents.',
    'safety',
    (SELECT id FROM public.countries WHERE code = 'IN')
)
ON CONFLICT DO NOTHING;
