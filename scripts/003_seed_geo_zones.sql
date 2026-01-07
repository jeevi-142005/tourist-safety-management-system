-- Seed some initial geo-zones for testing
-- These are sample zones for major Indian tourist destinations

INSERT INTO public.geo_zones (name, zone_type, coordinates, description, risk_level) VALUES
(
  'Red Fort Area - Safe Zone',
  'safe',
  '{"type": "Polygon", "coordinates": [[[77.2395, 28.6562], [77.2420, 28.6562], [77.2420, 28.6580], [77.2395, 28.6580], [77.2395, 28.6562]]]}',
  'Well-patrolled tourist area around Red Fort, Delhi',
  2
),
(
  'Connaught Place - Caution Zone',
  'caution',
  '{"type": "Polygon", "coordinates": [[[77.2167, 28.6289], [77.2200, 28.6289], [77.2200, 28.6320], [77.2167, 28.6320], [77.2167, 28.6289]]]}',
  'Busy commercial area, watch for pickpockets',
  4
),
(
  'Taj Mahal Complex - Safe Zone',
  'safe',
  '{"type": "Polygon", "coordinates": [[[78.0421, 27.1750], [78.0430, 27.1750], [78.0430, 27.1760], [78.0421, 27.1760], [78.0421, 27.1750]]]}',
  'Heavily secured UNESCO World Heritage site',
  1
),
(
  'Gateway of India - Safe Zone',
  'safe',
  '{"type": "Polygon", "coordinates": [[[72.8347, 18.9220], [72.8360, 18.9220], [72.8360, 18.9235], [72.8347, 18.9235], [72.8347, 18.9220]]]}',
  'Popular tourist destination with good security',
  2
),
(
  'Isolated Highway Section - Danger Zone',
  'danger',
  '{"type": "Polygon", "coordinates": [[[77.1000, 28.5000], [77.1100, 28.5000], [77.1100, 28.5100], [77.1000, 28.5100], [77.1000, 28.5000]]]}',
  'Remote highway section with limited police presence',
  8
);
