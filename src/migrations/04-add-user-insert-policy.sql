-- Add policy to allow users to insert their own profile

-- Creates a policy that allows users to insert their own profile when authenticated
CREATE POLICY "New users can insert their profile" 
  ON public.users FOR INSERT 
  WITH CHECK (auth.uid() = id); 