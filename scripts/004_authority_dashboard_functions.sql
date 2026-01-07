-- Function to get tourist heatmap data
CREATE OR REPLACE FUNCTION get_tourist_heatmap_data(hours_back integer DEFAULT 24)
RETURNS TABLE (
  lat numeric,
  lng numeric,
  intensity integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ST_Y(lt.location) as lat,
    ST_X(lt.location) as lng,
    COUNT(*)::integer as intensity
  FROM public.location_tracks lt
  JOIN public.profiles p ON lt.user_id = p.id
  WHERE lt.timestamp >= NOW() - INTERVAL '1 hour' * hours_back
    AND p.role = 'tourist'
  GROUP BY ST_Y(lt.location), ST_X(lt.location)
  HAVING COUNT(*) >= 2
  ORDER BY intensity DESC
  LIMIT 1000;
END;
$$ LANGUAGE plpgsql;

-- Function to get safety score statistics
CREATE OR REPLACE FUNCTION get_safety_score_statistics()
RETURNS TABLE (
  score_range text,
  tourist_count integer,
  percentage numeric
) AS $$
DECLARE
  total_tourists integer;
BEGIN
  -- Get total count of tourists with safety scores
  SELECT COUNT(DISTINCT ss.user_id) INTO total_tourists
  FROM public.safety_scores ss
  JOIN public.profiles p ON ss.user_id = p.id
  WHERE p.role = 'tourist'
    AND ss.calculated_at >= NOW() - INTERVAL '7 days';

  IF total_tourists = 0 THEN
    total_tourists := 1; -- Avoid division by zero
  END IF;

  RETURN QUERY
  WITH latest_scores AS (
    SELECT DISTINCT ON (ss.user_id) 
      ss.user_id,
      ss.score
    FROM public.safety_scores ss
    JOIN public.profiles p ON ss.user_id = p.id
    WHERE p.role = 'tourist'
      AND ss.calculated_at >= NOW() - INTERVAL '7 days'
    ORDER BY ss.user_id, ss.calculated_at DESC
  )
  SELECT 
    CASE 
      WHEN ls.score >= 80 THEN 'High (80-100)'
      WHEN ls.score >= 60 THEN 'Medium (60-79)'
      WHEN ls.score >= 40 THEN 'Low (40-59)'
      ELSE 'Critical (0-39)'
    END as score_range,
    COUNT(*)::integer as tourist_count,
    ROUND((COUNT(*) * 100.0 / total_tourists), 1) as percentage
  FROM latest_scores ls
  GROUP BY 
    CASE 
      WHEN ls.score >= 80 THEN 'High (80-100)'
      WHEN ls.score >= 60 THEN 'Medium (60-79)'
      WHEN ls.score >= 40 THEN 'Low (40-59)'
      ELSE 'Critical (0-39)'
    END
  ORDER BY 
    CASE 
      WHEN score_range = 'Critical (0-39)' THEN 1
      WHEN score_range = 'Low (40-59)' THEN 2
      WHEN score_range = 'Medium (60-79)' THEN 3
      ELSE 4
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to generate E-FIR automatically
CREATE OR REPLACE FUNCTION generate_efir(
  alert_id_param uuid,
  incident_description text
)
RETURNS uuid AS $$
DECLARE
  fir_id uuid;
  fir_number text;
  alert_data record;
BEGIN
  -- Get alert details
  SELECT a.*, p.full_name, p.email, p.phone
  INTO alert_data
  FROM public.alerts a
  JOIN public.profiles p ON a.user_id = p.id
  WHERE a.id = alert_id_param;

  -- Generate FIR number
  fir_number := 'FIR-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                LPAD(EXTRACT(DOY FROM NOW())::text, 3, '0') || '-' ||
                LPAD(EXTRACT(HOUR FROM NOW())::text, 2, '0') ||
                LPAD(EXTRACT(MINUTE FROM NOW())::text, 2, '0');

  -- Insert E-FIR record
  INSERT INTO public.efir_records (
    alert_id,
    fir_number,
    complainant_details,
    incident_details,
    location
  ) VALUES (
    alert_id_param,
    fir_number,
    jsonb_build_object(
      'name', alert_data.full_name,
      'email', alert_data.email,
      'phone', alert_data.phone,
      'alert_type', alert_data.alert_type,
      'severity', alert_data.severity
    ),
    incident_description,
    alert_data.location
  ) RETURNING id INTO fir_id;

  RETURN fir_id;
END;
$$ LANGUAGE plpgsql;
