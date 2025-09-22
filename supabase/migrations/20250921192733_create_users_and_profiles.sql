-- Create the public Users table
CREATE TABLE public."User" (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY, 
  full_name TEXT
);

-- Function to create a public user profile upon new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN 
  INSERT INTO public."User" (id, full_name) 
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger to execute the function after a new user is created
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
