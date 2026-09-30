-- PostgreSQL 15+. Execute somente em projeto Supabase dedicado.
create table public.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
grant all on public.admin_users to service_role;
create policy admin_self on public.admin_users for select to authenticated using (user_id=(select auth.uid()));

create function public.is_admin() returns boolean language sql stable security invoker set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.admin_users where user_id=auth.uid())
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

create table public.leads (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(name) between 2 and 120),
 email text not null check(char_length(email)<=254),
 whatsapp text,
 role text not null check(role in ('Pastor titular','Pastor auxiliar','Presbítero','Líder de ministério','Outro')),
 city text not null check(char_length(city) between 1 and 120),
 state text not null check(state in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
 church_size text not null check(church_size in ('Até 50 pessoas','51 a 100','101 a 250','251 a 500','Mais de 500')),
 privacy_consent boolean not null check(privacy_consent),
 marketing_consent boolean not null default false,
 whatsapp_consent boolean not null default false,
 consent_at timestamptz not null default now(),
 consent_version text not null,
 privacy_policy_url text not null,
 utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text, referrer text,
 created_at timestamptz not null default now(),
 check(not whatsapp_consent or nullif(whatsapp,'') is not null)
);
create index leads_created_idx on public.leads(created_at);
create index leads_email_idx on public.leads(email);
create index leads_source_idx on public.leads(utm_source);

-- Nenhuma resposta, contato ou texto é enviado no início.
create table public.quiz_sessions (
 id uuid primary key default gen_random_uuid(),
 token_hash text not null unique,
 started_at timestamptz not null default now(),
 completed_at timestamptz
);
create index sessions_started_idx on public.quiz_sessions(started_at);
create table public.submissions (
 id uuid primary key default gen_random_uuid(),
 lead_id uuid not null unique references public.leads(id) on delete cascade,
 session_id uuid unique references public.quiz_sessions(id) on delete set null,
 vision_no_count int not null check(vision_no_count between 0 and 3),
 diagnosis_no_count int not null check(diagnosis_no_count between 0 and 3),
 simplification_no_count int not null check(simplification_no_count between 0 and 3),
 discipleship_no_count int not null check(discipleship_no_count between 0 and 3),
 change_no_count int not null check(change_no_count between 0 and 3),
 conflict_no_count int not null check(conflict_no_count between 0 and 3),
 priority_pillars jsonb not null,
 secondary_pillars jsonb not null,
 challenge_90_days text not null check(char_length(challenge_90_days) between 1 and 3000),
 started_at timestamptz not null,
 completed_at timestamptz not null default now(),
 duration_seconds int not null check(duration_seconds>=0),
 result_version text not null default '2026-09-29-v1'
);
create index submissions_started_idx on public.submissions(started_at);
create index submissions_priority_idx on public.submissions using gin(priority_pillars);
create table public.answers (
 id uuid primary key default gen_random_uuid(),
 submission_id uuid not null references public.submissions(id) on delete cascade,
 question_id int not null check(question_id between 1 and 18),
 pillar text not null check(pillar in ('vision','diagnosis','simplification','discipleship','change','conflict')),
 answer boolean not null,
 comment text check(char_length(comment)<=2000),
 created_at timestamptz not null default now(),
 unique(submission_id,question_id)
);
create index answers_submission_idx on public.answers(submission_id);
-- Caixa de saída: preparada, sem envio automático. Somente IDs e autorizações.
create table public.marketing_outbox (
 id uuid primary key default gen_random_uuid(),
 lead_id uuid not null references public.leads(id) on delete cascade,
 submission_id uuid not null unique references public.submissions(id) on delete cascade,
 email_allowed boolean not null,
 whatsapp_allowed boolean not null,
 status text not null default 'pending' check(status in ('pending','sent','cancelled','failed')),
 created_at timestamptz not null default now(),
 processed_at timestamptz
);
create table public.rate_limits (
 bucket text primary key,
 hits int not null default 1,
 expires_at timestamptz not null
);
create index rate_limits_expiry_idx on public.rate_limits(expires_at);

do $$ declare t text; begin
 foreach t in array array['leads','submissions','answers','quiz_sessions','marketing_outbox','rate_limits'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
 foreach t in array array['leads','submissions','answers','quiz_sessions'] loop
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy admin_read on public.%I for select to authenticated using ((select public.is_admin()))',t);
 end loop;
end $$;

create function public.consume_rate_limit(p_bucket text,p_max int,p_seconds int)
returns boolean language plpgsql security invoker set search_path='' as $$
declare n int;
begin
 insert into public.rate_limits(bucket,hits,expires_at) values(p_bucket,1,now()+make_interval(secs=>p_seconds))
 on conflict(bucket) do update set
 hits=case when rate_limits.expires_at<now() then 1 else rate_limits.hits+1 end,
 expires_at=case when rate_limits.expires_at<now() then now()+make_interval(secs=>p_seconds) else rate_limits.expires_at end
 returning hits into n;
 return n<=p_max;
end $$;
revoke all on function public.consume_rate_limit(text,int,int) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,int,int) to service_role;

create function public.complete_diagnostic(p_token_hash text,p_payload jsonb,p_policy_url text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 session_row public.quiz_sessions;
 existing public.submissions;
 lead_uuid uuid; submission_uuid uuid;
 names text[]:=array['vision','diagnosis','simplification','discipleship','change','conflict'];
 counts int[]:=array[0,0,0,0,0,0];
 max_count int; priorities jsonb:='[]'; secondaries jsonb:='[]';
 contact jsonb:=p_payload->'contact'; a jsonb:=p_payload->'attribution';
 i int; p int; result jsonb;
begin
 select * into session_row from public.quiz_sessions where token_hash=p_token_hash for update;
 if not found then raise exception 'invalid_session'; end if;
 if session_row.completed_at is not null then
 select * into existing from public.submissions where session_id=session_row.id;
 return jsonb_build_object('counts',jsonb_build_object('vision',existing.vision_no_count,'diagnosis',existing.diagnosis_no_count,'simplification',existing.simplification_no_count,'discipleship',existing.discipleship_no_count,'change',existing.change_no_count,'conflict',existing.conflict_no_count),'priority_pillars',existing.priority_pillars,'secondary_pillars',existing.secondary_pillars);
 end if;
 if session_row.started_at<now()-interval '7 days' then raise exception 'expired_session'; end if;
 if session_row.started_at>now()-interval '5 seconds' then raise exception 'too_fast'; end if;
 if p_policy_url is null or p_policy_url not like 'https://%' then raise exception 'policy_not_configured'; end if;
 if jsonb_typeof(p_payload->'answers') is distinct from 'object' then raise exception 'invalid_answers'; end if;
 if (select count(*) from jsonb_object_keys(p_payload->'answers'))<>18 then raise exception 'invalid_answers'; end if;
 for i in 1..18 loop
 if jsonb_typeof(p_payload->'answers'->i::text) is distinct from 'boolean' then raise exception 'invalid_answer'; end if;
 p:=(i-1)/3+1;
 if not (p_payload->'answers'->>i::text)::boolean then counts[p]:=counts[p]+1; end if;
 end loop;
 select max(x) into max_count from unnest(counts) x;
 for p in 1..6 loop
 if max_count>0 and counts[p]=max_count then priorities:=priorities||jsonb_build_array(names[p]);
 elsif counts[p]>0 then secondaries:=secondaries||jsonb_build_array(names[p]); end if;
 end loop;
 insert into public.leads(name,email,whatsapp,role,city,state,church_size,privacy_consent,marketing_consent,whatsapp_consent,consent_version,privacy_policy_url,utm_source,utm_medium,utm_campaign,utm_content,utm_term,referrer)
 values(contact->>'name',contact->>'email',nullif(contact->>'whatsapp',''),contact->>'role',contact->>'city',contact->>'state',contact->>'church_size',(contact->>'privacy_consent')::boolean,(contact->>'marketing_consent')::boolean,(contact->>'whatsapp_consent')::boolean,p_payload->>'consent_version',p_policy_url,a->>'utm_source',a->>'utm_medium',a->>'utm_campaign',a->>'utm_content',a->>'utm_term',a->>'referrer')
 returning id into lead_uuid;
 insert into public.submissions(lead_id,session_id,vision_no_count,diagnosis_no_count,simplification_no_count,discipleship_no_count,change_no_count,conflict_no_count,priority_pillars,secondary_pillars,challenge_90_days,started_at,duration_seconds)
 values(lead_uuid,session_row.id,counts[1],counts[2],counts[3],counts[4],counts[5],counts[6],priorities,secondaries,p_payload->>'challenge_90_days',session_row.started_at,greatest(0,floor(extract(epoch from now()-session_row.started_at)))::int)
 returning id into submission_uuid;
 for i in 1..18 loop
 p:=(i-1)/3+1;
 insert into public.answers(submission_id,question_id,pillar,answer,comment)
 values(submission_uuid,i,names[p],(p_payload->'answers'->>i::text)::boolean,case when (i-1)%3=0 then nullif(p_payload->'comments'->>names[p],'') else null end);
 end loop;
 update public.quiz_sessions set completed_at=now() where id=session_row.id;
 if (contact->>'marketing_consent')::boolean or (contact->>'whatsapp_consent')::boolean then
 insert into public.marketing_outbox(lead_id,submission_id,email_allowed,whatsapp_allowed)
 values(lead_uuid,submission_uuid,(contact->>'marketing_consent')::boolean,(contact->>'whatsapp_consent')::boolean);
 end if;
 result:=jsonb_build_object('counts',jsonb_build_object('vision',counts[1],'diagnosis',counts[2],'simplification',counts[3],'discipleship',counts[4],'change',counts[5],'conflict',counts[6]),'priority_pillars',priorities,'secondary_pillars',secondaries);
 return result;
end $$;
revoke all on function public.complete_diagnostic(text,jsonb,text) from public,anon,authenticated;
grant execute on function public.complete_diagnostic(text,jsonb,text) to service_role;

create view public.admin_records with(security_invoker=true) as
 select l.*,s.id as submission_id,s.priority_pillars,s.secondary_pillars,s.started_at,s.completed_at,
 s.vision_no_count,s.diagnosis_no_count,s.simplification_no_count,s.discipleship_no_count,s.change_no_count,s.conflict_no_count
 from public.leads l join public.submissions s on s.lead_id=l.id;
revoke all on public.admin_records from anon,authenticated;
grant select on public.admin_records to authenticated,service_role;

-- Filtros e paginação aplicados no banco; sem limite silencioso de 1000 linhas.
create function public.admin_report(filters jsonb default '{}',page_number int default 0,page_size int default 25)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare output jsonb;
begin
 if not public.is_admin() then raise exception 'forbidden'; end if;
 with cohort as (
 select * from public.quiz_sessions
 where started_at>=coalesce(nullif(filters->>'from','')::timestamptz,now()-interval '30 days')
 and started_at<coalesce(nullif(filters->>'to','')::timestamptz,'infinity'::timestamptz)
 ), filtered as (
 select * from public.admin_records r
 where r.started_at>=coalesce(nullif(filters->>'from','')::timestamptz,now()-interval '30 days')
 and r.started_at<coalesce(nullif(filters->>'to','')::timestamptz,'infinity'::timestamptz)
 and (coalesce(filters->>'search','')='' or strpos(lower(r.name||' '||r.email),lower(filters->>'search'))>0)
 and (coalesce(filters->>'role','')='' or r.role=filters->>'role')
 and (coalesce(filters->>'church_size','')='' or r.church_size=filters->>'church_size')
 and (coalesce(filters->>'state','')='' or r.state=filters->>'state')
 and (coalesce(filters->>'city','')='' or strpos(lower(r.city),lower(filters->>'city'))>0)
 and (coalesce(filters->>'source','')='' or strpos(lower(coalesce(r.utm_source,'')),lower(filters->>'source'))>0)
 and (coalesce(filters->>'priority','')='' or r.priority_pillars ? (filters->>'priority'))
 and (coalesce(filters->>'marketing','')='' or r.marketing_consent=(filters->>'marketing')::boolean)
 ), paged as (
 select * from filtered order by created_at desc,id desc
 limit least(greatest(page_size,1),500) offset greatest(page_number,0)*least(greatest(page_size,1),500)
 ), dimensions as (
 select 'role' as kind,role as label,count(*) as count from filtered group by role
 union all select 'size',church_size,count(*) from filtered group by church_size
 union all select 'location',city||' / '||state,count(*) from filtered group by city,state
 union all select 'source',coalesce(nullif(utm_source,''),'Direto / não informado'),count(*) from filtered group by coalesce(nullif(utm_source,''),'Direto / não informado')
 union all select 'priority',v,count(*) from filtered cross join lateral jsonb_array_elements_text(priority_pillars) v group by v
 )
 select jsonb_build_object(
 'total',(select count(*) from filtered),
 'marketing',(select count(*) from filtered where marketing_consent),
 'cohort_complete',coalesce(nullif(filters->>'from','')::timestamptz,now()-interval '30 days')>=now()-interval '90 days',
 'starts',(select count(*) from cohort),
 'completed',(select count(*) from cohort where completed_at is not null),
 'rows',coalesce((select jsonb_agg(to_jsonb(p)) from paged p),'[]'::jsonb),
 'distributions',coalesce((select jsonb_agg(to_jsonb(d) order by count desc,label) from dimensions d),'[]'::jsonb)
 ) into output;
 return output;
end $$;
revoke all on function public.admin_report(jsonb,int,int) from public,anon;
grant execute on function public.admin_report(jsonb,int,int) to authenticated;

-- Uso operacional pelo servidor, sem acesso público. Preserva dados finais.
create function public.purge_ephemeral_data() returns void language sql security invoker set search_path='' as $$
 delete from public.rate_limits where expires_at<now()-interval '1 day';
 delete from public.quiz_sessions where started_at<now()-interval '90 days';
$$;
revoke all on function public.purge_ephemeral_data() from public,anon,authenticated;
grant execute on function public.purge_ephemeral_data() to service_role;
