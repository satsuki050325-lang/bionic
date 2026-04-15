-- Atomic claim functions for the heartbeat runner.
-- Mirrors the uptime claim pattern (see 20260413000005): a single UPDATE
-- ... WHERE (flag still false AND miss condition) inside a SECURITY DEFINER
-- function guarantees at most one concurrent caller observes row_count > 0.

create or replace function public.claim_heartbeat_missing(
  p_target_id text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows int;
begin
  update public.heartbeat_targets
  set
    missed_event_emitted = true,
    updated_at = now()
  where id = p_target_id
    and missed_event_emitted = false
    and enabled = true
    and (
      coalesce(last_ping_at, created_at)
        + make_interval(secs => expected_interval_seconds + grace_seconds)
    ) < now();
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

create or replace function public.claim_heartbeat_recovery(
  p_target_id text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows int;
begin
  update public.heartbeat_targets
  set
    missed_event_emitted = false,
    updated_at = now()
  where id = p_target_id
    and missed_event_emitted = true;
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

grant execute on function public.claim_heartbeat_missing(text) to service_role;
grant execute on function public.claim_heartbeat_recovery(text) to service_role;
