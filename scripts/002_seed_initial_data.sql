-- Seed initial data for Tourist Safety System

-- Insert sample geo zones
INSERT INTO public.geo_zones (name, description, zone_type, coordinates, risk_level) VALUES
('Kaziranga National Park Buffer Zone', 'High wildlife activity area', 'high_risk', ST_GeomFromText('POLYGON((93.3 26.6, 93.4 26.6, 93.4 26.7, 93.3 26.7, 93.3 26.6))', 4326), 7),
('Guwahati City Center', 'Safe tourist area with good connectivity', 'safe', ST_GeomFromText('POLYGON((91.73 26.14, 91.76 26.14, 91.76 26.17, 91.73 26.17, 91.73 26.14))', 4326), 2),
('Majuli Island Ferry Route', 'Weather dependent crossing area', 'high_risk', ST_GeomFromText('POLYGON((94.1 27.0, 94.2 27.0, 94.2 27.1, 94.1 27.1, 94.1 27.0))', 4326), 6),
('Kamakhya Temple Complex', 'Popular tourist destination', 'tourist_spot', ST_GeomFromText('POLYGON((91.70 26.16, 91.71 26.16, 91.71 26.17, 91.70 26.17, 91.70 26.16))', 4326), 3),
('Restricted Military Area', 'No civilian access allowed', 'restricted', ST_GeomFromText('POLYGON((91.8 26.2, 91.9 26.2, 91.9 26.3, 91.8 26.3, 91.8 26.2))', 4326), 10);

-- Insert sample police stations
INSERT INTO public.police_stations (name, location, phone, officer_in_charge) VALUES
('Guwahati Central Police Station', ST_GeomFromText('POINT(91.7362 26.1445)', 4326), '+91-361-2540000', 'Inspector Rajesh Kumar'),
('Kaziranga Police Outpost', ST_GeomFromText('POINT(93.3515 26.6467)', 4326), '+91-3776-268095', 'Sub-Inspector Anita Devi'),
('Majuli Police Station', ST_GeomFromText('POINT(94.1531 27.0103)', 4326), '+91-3775-274001', 'Inspector Bhupen Hazarika'),
('Kamakhya Police Beat', ST_GeomFromText('POINT(91.7035 26.1668)', 4326), '+91-361-2540001', 'Constable Priya Sharma');
