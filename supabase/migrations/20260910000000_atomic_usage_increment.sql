-- ==============================================================================
-- Migration: Atomic Usage Increment Function
-- Prevents lost updates and eliminates duplicate key 23505 race conditions.
-- ==============================================================================

CREATE OR REPLACE FUNCTION increment_user_usage(
  p_user_id UUID,
  p_metric TEXT,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO public.usage_tracking (user_id, metric, count, period_start, period_end)
  VALUES (p_user_id, p_metric, 1, p_period_start, p_period_end)
  ON CONFLICT (user_id, metric, period_start)
  DO UPDATE SET count = usage_tracking.count + 1
  RETURNING count INTO v_count;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
