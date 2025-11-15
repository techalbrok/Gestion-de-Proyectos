/*
  # Add User Profile Auto-Creation Trigger

  1. New Functions
    - `handle_new_user()` - Automatically creates a public.users record when a new user signs up

  2. Changes
    - Creates a trigger on auth.users that fires after insert
    - Syncs user data from auth.users to public.users
    - Includes email, full_name, and avatar_url from metadata

  3. Security
    - Function runs with security definer privileges
    - Only creates profile, does not modify existing data
*/

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
