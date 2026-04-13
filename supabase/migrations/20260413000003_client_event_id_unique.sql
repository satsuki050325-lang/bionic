-- 重複するclient_event_idを削除してからunique indexを作成する
delete from public.engine_events e1
  using public.engine_events e2
  where e1.client_event_id = e2.client_event_id
    and e1.client_event_id is not null
    and e1.id > e2.id;

create unique index if not exists engine_events_client_event_id_unique
  on public.engine_events(client_event_id)
  where client_event_id is not null;
