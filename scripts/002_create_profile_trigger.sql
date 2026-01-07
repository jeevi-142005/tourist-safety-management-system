-- Auto-create profile trigger with blockchain ID generation
-- This trigger automatically creates a profile when a user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  blockchain_id_value TEXT;
BEGIN
  -- Generate unique blockchain ID
  blockchain_id_value := 'TID_' || UPPER(SUBSTRING(MD5(NEW.id::text || EXTRACT(EPOCH FROM NOW())::text) FROM 1 FOR 12));
  
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role,
    blockchain_id,
    qr_code_data
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'tourist'),
    blockchain_id_value,
    jsonb_build_object(
      'tourist_id', blockchain_id_value,
      'email', NEW.email,
      'created_at', NOW(),
      'verification_url', 'https://touristsafety.app/verify/' || blockchain_id_value
    )::text
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
