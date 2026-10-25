-- Awards points through the ledger and keeps contributors.points in step with
-- it, so a contributor's balance can always be explained line by line.
CREATE OR REPLACE FUNCTION award_points(p_contributor UUID, p_delta INT, p_reason TEXT, p_submission UUID)
RETURNS INT
LANGUAGE sql
AS $$
  INSERT INTO points_ledger (contributor_id, delta, reason, submission_id) VALUES (p_contributor, p_delta, p_reason, p_submission);
  UPDATE contributors
     SET points = (SELECT coalesce(sum(delta), 0) FROM points_ledger WHERE contributor_id = p_contributor)
   WHERE id = p_contributor
  RETURNING points;
$$;

REVOKE ALL ON FUNCTION award_points FROM anon, authenticated;
REVOKE ALL ON FUNCTION find_existing_case FROM anon, authenticated;

NOTIFY pgrst, 'reload schema';
