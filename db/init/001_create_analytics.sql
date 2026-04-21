create table if not exists analytics_event (
                                               id bigserial primary key,
                                               ts timestamptz not null default now(),
    app text not null,
    type text not null,
    path text null,
    element text null,
    tenant text null,
    meta jsonb null
    );

create index if not exists analytics_event_ts_idx on analytics_event (ts);
create index if not exists analytics_event_app_ts_idx on analytics_event (app, ts);
create index if not exists analytics_event_type_ts_idx on analytics_event (type, ts);
create index if not exists analytics_event_path_idx on analytics_event (path);