-- Create function to check geofence violations
CREATE OR REPLACE FUNCTION check_geofence_violations(
  user_location geometry,
  user_id uuid
)
RETURNS TABLE (
  zone_id uuid,
  zone_name text,
  zone_type text,
  risk_level integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gz.id as zone_id,
    gz.name as zone_name,
    gz.zone_type,
    gz.risk_level
  FROM public.geo_zones gz
  WHERE ST_Contains(gz.coordinates, user_location)
    AND gz.zone_type IN ('high_risk', 'restricted');
END;
$$ LANGUAGE plpgsql;

-- Create function to get nearby police stations
CREATE OR REPLACE FUNCTION get_nearby_police_stations(
  user_location geometry,
  radius_km integer DEFAULT 10
)
RETURNS TABLE (
  station_id uuid,
  station_name text,
  phone text,
  distance_km numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id as station_id,
    ps.name as station_name,
    ps.phone,
    ROUND(ST_Distance(ps.location, user_location) / 1000, 2) as distance_km
  FROM public.police_stations ps
  WHERE ST_DWithin(ps.location, user_location, radius_km * 1000)
  ORDER BY ST_Distance(ps.location, user_location)
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate safety score based on location history
CREATE OR REPLACE FUNCTION calculate_location_safety_score(
  user_id uuid,
  days_back integer DEFAULT 7
)
RETURNS integer AS $$
DECLARE
  base_score integer := 100;
  risk_penalty integer := 0;
  location_count integer;
  high_risk_count integer;
BEGIN
  -- Get total location points in the period
  SELECT COUNT(*) INTO location_count
  FROM public.location_tracks lt
  WHERE lt.user_id = calculate_location_safety_score.user_id
    AND lt.timestamp >= NOW() - INTERVAL '1 day' * days_back;

  -- Get count of high-risk area visits
  SELECT COUNT(*) INTO high_risk_count
  FROM public.location_tracks lt
  JOIN public.geo_zones gz ON ST_Contains(gz.coordinates, lt.location)
  WHERE lt.user_id = calculate_location_safety_score.user_id
    AND lt.timestamp >= NOW() - INTERVAL '1 day' * days_back
    AND gz.zone_type IN ('high_risk', 'restricted');

  -- Calculate penalty based on risk exposure
  IF location_count > 0 THEN
    risk_penalty := (high_risk_count * 100 / location_count) * 0.5;
  END IF;

  -- Apply additional penalties for recent alerts
  SELECT COUNT(*) * 10 INTO risk_penalty
  FROM public.alerts a
  WHERE a.user_id = calculate_location_safety_score.user_id
    AND a.created_at >= NOW() - INTERVAL '1 day' * days_back
    AND a.alert_type IN ('geo_fence', 'anomaly');

  RETURN GREATEST(0, base_score - risk_penalty);
END;
$$ LANGUAGE plpgsql;
