-- Function to get a shuffle by ID directly
CREATE OR REPLACE FUNCTION get_shuffle_by_id(shuffle_id_param UUID)
RETURNS SETOF shuffles AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM shuffles
  WHERE id = shuffle_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 