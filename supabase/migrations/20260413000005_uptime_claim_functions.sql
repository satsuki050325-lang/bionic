-- Atomic claim functions for the uptime runner.
--
-- Why RPC: a single Postgres UPDATE statement runs under MVCC row locks,
-- so the WHERE clause is evaluated against committed state at lock time.
-- By expressing the "I won the race" check as a single UPDATE ... WHERE
-- ... flag-still-false inside a SECURITY DEFINER function, we do not rely
-- on any PostgREST client-side OR-filter syntax and we can guarantee that
-- at most one concurrent caller observes row_count > 0 per state
-- transition.

create or replace function public.claim_uptime_degraded(
  p_target_id text,
  p_threshold int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows int;
begin
  update public.uptime_targets
  set
    degraded_event_emitted = true,
    updated_at = now()
  where id = p_target_id
    and degraded_event_emitted = false
    and consecutive_failures >= p_threshold;
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

create or replace function public.claim_uptime_recovery(
  p_target_id text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows int;
begin
  update public.uptime_targets
  set
    last_status = 'up',
    degraded_event_emitted = false,
    last_failure_reason = null,
    consecutive_failures = 0,
    updated_at = now()
  where id = p_target_id
    and (degraded_event_emitted = true or last_status = 'down');
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

-- Engine runs as service_role; grant execute so the RPC is reachable.
grant execute on function public.claim_uptime_degraded(text, int) to service_role;
grant execute on function public.claim_uptime_recovery(text) to service_role;
