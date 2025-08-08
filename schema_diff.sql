drop function if exists "public"."get_auth_user_id"();

drop function if exists "public"."is_admin"();

create table "public"."food_drink_categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "icon" text,
    "sort_order" integer default 0,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."food_drink_categories" enable row level security;

create table "public"."food_drink_items" (
    "id" uuid not null default gen_random_uuid(),
    "category_id" uuid not null,
    "name" text not null,
    "description" text,
    "price" numeric(10,2) not null,
    "image_url" text,
    "is_available" boolean default true,
    "is_featured" boolean default false,
    "ingredients" text[],
    "allergens" text[],
    "nutritional_info" jsonb,
    "preparation_time" integer,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."food_drink_items" enable row level security;

create table "public"."notification_topics" (
    "id" uuid not null default gen_random_uuid(),
    "topic_key" text not null,
    "display_name" text not null,
    "description" text,
    "is_active" boolean default true,
    "requires_role" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."notification_topics" enable row level security;

create table "public"."user_fcm_tokens" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "token" text not null,
    "device_info" text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_fcm_tokens" enable row level security;

create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "auth_id" uuid not null,
    "email" text not null,
    "first_name" text,
    "last_name" text,
    "display_name" text,
    "avatar_url" text,
    "role" text default 'user'::text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."users" enable row level security;

create table "public"."wolfpack_activity_notifications" (
    "id" uuid not null default gen_random_uuid(),
    "recipient_id" uuid not null,
    "message" text not null,
    "type" text not null default 'info'::text,
    "status" text not null default 'unread'::text,
    "created_at" timestamp with time zone not null default now(),
    "link" text,
    "metadata" jsonb default '{}'::jsonb,
    "updated_at" timestamp with time zone default now(),
    "notification_type" character varying(50),
    "related_video_id" uuid,
    "related_user_id" uuid
);


alter table "public"."wolfpack_activity_notifications" enable row level security;

CREATE UNIQUE INDEX food_drink_categories_pkey ON public.food_drink_categories USING btree (id);

CREATE UNIQUE INDEX food_drink_items_pkey ON public.food_drink_items USING btree (id);

CREATE INDEX idx_food_drink_items_category_id ON public.food_drink_items USING btree (category_id);

CREATE INDEX idx_notifications_created_at ON public.wolfpack_activity_notifications USING btree (created_at DESC);

CREATE INDEX idx_notifications_recipient_id ON public.wolfpack_activity_notifications USING btree (recipient_id);

CREATE INDEX idx_notifications_status ON public.wolfpack_activity_notifications USING btree (status);

CREATE INDEX idx_user_fcm_tokens_active ON public.user_fcm_tokens USING btree (is_active);

CREATE INDEX idx_user_fcm_tokens_user_id ON public.user_fcm_tokens USING btree (user_id);

CREATE INDEX idx_users_auth_id ON public.users USING btree (auth_id);

CREATE UNIQUE INDEX notification_topics_pkey ON public.notification_topics USING btree (id);

CREATE UNIQUE INDEX notification_topics_topic_key_key ON public.notification_topics USING btree (topic_key);

CREATE UNIQUE INDEX notifications_pkey ON public.wolfpack_activity_notifications USING btree (id);

CREATE UNIQUE INDEX user_fcm_tokens_pkey ON public.user_fcm_tokens USING btree (id);

CREATE UNIQUE INDEX user_fcm_tokens_token_key ON public.user_fcm_tokens USING btree (token);

CREATE UNIQUE INDEX users_auth_id_key ON public.users USING btree (auth_id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."food_drink_categories" add constraint "food_drink_categories_pkey" PRIMARY KEY using index "food_drink_categories_pkey";

alter table "public"."food_drink_items" add constraint "food_drink_items_pkey" PRIMARY KEY using index "food_drink_items_pkey";

alter table "public"."notification_topics" add constraint "notification_topics_pkey" PRIMARY KEY using index "notification_topics_pkey";

alter table "public"."user_fcm_tokens" add constraint "user_fcm_tokens_pkey" PRIMARY KEY using index "user_fcm_tokens_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."wolfpack_activity_notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."food_drink_items" add constraint "food_drink_items_category_id_fkey" FOREIGN KEY (category_id) REFERENCES food_drink_categories(id) ON DELETE CASCADE not valid;

alter table "public"."food_drink_items" validate constraint "food_drink_items_category_id_fkey";

alter table "public"."notification_topics" add constraint "notification_topics_requires_role_check" CHECK ((requires_role = ANY (ARRAY['admin'::text, 'bartender'::text, 'dj'::text, 'user'::text, NULL::text]))) not valid;

alter table "public"."notification_topics" validate constraint "notification_topics_requires_role_check";

alter table "public"."notification_topics" add constraint "notification_topics_topic_key_key" UNIQUE using index "notification_topics_topic_key_key";

alter table "public"."user_fcm_tokens" add constraint "user_fcm_tokens_token_key" UNIQUE using index "user_fcm_tokens_token_key";

alter table "public"."user_fcm_tokens" add constraint "user_fcm_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_fcm_tokens" validate constraint "user_fcm_tokens_user_id_fkey";

alter table "public"."users" add constraint "users_auth_id_key" UNIQUE using index "users_auth_id_key";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."wolfpack_activity_notifications" add constraint "notifications_status_check" CHECK ((status = ANY (ARRAY['unread'::text, 'read'::text, 'dismissed'::text]))) not valid;

alter table "public"."wolfpack_activity_notifications" validate constraint "notifications_status_check";

alter table "public"."wolfpack_activity_notifications" add constraint "notifications_type_check" CHECK ((type = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'order_new'::text, 'order_ready'::text]))) not valid;

alter table "public"."wolfpack_activity_notifications" validate constraint "notifications_type_check";

alter table "public"."wolfpack_activity_notifications" add constraint "wolfpack_activity_notifications_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."wolfpack_activity_notifications" validate constraint "wolfpack_activity_notifications_recipient_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.fetch_notifications(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, recipient_id uuid, type text, title text, message text, link text, read boolean, data jsonb, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.recipient_id,
        n.type,
        n.message as title,  -- Using message as title
        n.message,
        n.link,
        (n.status = 'read') as read,
        n.metadata as data,
        n.created_at,
        n.updated_at
    FROM public.wolfpack_activity_notifications n
    WHERE n.recipient_id = (
        SELECT u.id FROM public.users u WHERE u.auth_id = auth.uid()
    )
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE public.wolfpack_activity_notifications
    SET status = 'read',
        updated_at = NOW()
    WHERE id = p_notification_id
    AND recipient_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid());
END;
$function$
;

grant delete on table "public"."food_drink_categories" to "anon";

grant insert on table "public"."food_drink_categories" to "anon";

grant references on table "public"."food_drink_categories" to "anon";

grant select on table "public"."food_drink_categories" to "anon";

grant trigger on table "public"."food_drink_categories" to "anon";

grant truncate on table "public"."food_drink_categories" to "anon";

grant update on table "public"."food_drink_categories" to "anon";

grant delete on table "public"."food_drink_categories" to "authenticated";

grant insert on table "public"."food_drink_categories" to "authenticated";

grant references on table "public"."food_drink_categories" to "authenticated";

grant select on table "public"."food_drink_categories" to "authenticated";

grant trigger on table "public"."food_drink_categories" to "authenticated";

grant truncate on table "public"."food_drink_categories" to "authenticated";

grant update on table "public"."food_drink_categories" to "authenticated";

grant delete on table "public"."food_drink_categories" to "service_role";

grant insert on table "public"."food_drink_categories" to "service_role";

grant references on table "public"."food_drink_categories" to "service_role";

grant select on table "public"."food_drink_categories" to "service_role";

grant trigger on table "public"."food_drink_categories" to "service_role";

grant truncate on table "public"."food_drink_categories" to "service_role";

grant update on table "public"."food_drink_categories" to "service_role";

grant delete on table "public"."food_drink_items" to "anon";

grant insert on table "public"."food_drink_items" to "anon";

grant references on table "public"."food_drink_items" to "anon";

grant select on table "public"."food_drink_items" to "anon";

grant trigger on table "public"."food_drink_items" to "anon";

grant truncate on table "public"."food_drink_items" to "anon";

grant update on table "public"."food_drink_items" to "anon";

grant delete on table "public"."food_drink_items" to "authenticated";

grant insert on table "public"."food_drink_items" to "authenticated";

grant references on table "public"."food_drink_items" to "authenticated";

grant select on table "public"."food_drink_items" to "authenticated";

grant trigger on table "public"."food_drink_items" to "authenticated";

grant truncate on table "public"."food_drink_items" to "authenticated";

grant update on table "public"."food_drink_items" to "authenticated";

grant delete on table "public"."food_drink_items" to "service_role";

grant insert on table "public"."food_drink_items" to "service_role";

grant references on table "public"."food_drink_items" to "service_role";

grant select on table "public"."food_drink_items" to "service_role";

grant trigger on table "public"."food_drink_items" to "service_role";

grant truncate on table "public"."food_drink_items" to "service_role";

grant update on table "public"."food_drink_items" to "service_role";

grant delete on table "public"."notification_topics" to "anon";

grant insert on table "public"."notification_topics" to "anon";

grant references on table "public"."notification_topics" to "anon";

grant select on table "public"."notification_topics" to "anon";

grant trigger on table "public"."notification_topics" to "anon";

grant truncate on table "public"."notification_topics" to "anon";

grant update on table "public"."notification_topics" to "anon";

grant delete on table "public"."notification_topics" to "authenticated";

grant insert on table "public"."notification_topics" to "authenticated";

grant references on table "public"."notification_topics" to "authenticated";

grant select on table "public"."notification_topics" to "authenticated";

grant trigger on table "public"."notification_topics" to "authenticated";

grant truncate on table "public"."notification_topics" to "authenticated";

grant update on table "public"."notification_topics" to "authenticated";

grant delete on table "public"."notification_topics" to "service_role";

grant insert on table "public"."notification_topics" to "service_role";

grant references on table "public"."notification_topics" to "service_role";

grant select on table "public"."notification_topics" to "service_role";

grant trigger on table "public"."notification_topics" to "service_role";

grant truncate on table "public"."notification_topics" to "service_role";

grant update on table "public"."notification_topics" to "service_role";

grant delete on table "public"."user_fcm_tokens" to "anon";

grant insert on table "public"."user_fcm_tokens" to "anon";

grant references on table "public"."user_fcm_tokens" to "anon";

grant select on table "public"."user_fcm_tokens" to "anon";

grant trigger on table "public"."user_fcm_tokens" to "anon";

grant truncate on table "public"."user_fcm_tokens" to "anon";

grant update on table "public"."user_fcm_tokens" to "anon";

grant delete on table "public"."user_fcm_tokens" to "authenticated";

grant insert on table "public"."user_fcm_tokens" to "authenticated";

grant references on table "public"."user_fcm_tokens" to "authenticated";

grant select on table "public"."user_fcm_tokens" to "authenticated";

grant trigger on table "public"."user_fcm_tokens" to "authenticated";

grant truncate on table "public"."user_fcm_tokens" to "authenticated";

grant update on table "public"."user_fcm_tokens" to "authenticated";

grant delete on table "public"."user_fcm_tokens" to "service_role";

grant insert on table "public"."user_fcm_tokens" to "service_role";

grant references on table "public"."user_fcm_tokens" to "service_role";

grant select on table "public"."user_fcm_tokens" to "service_role";

grant trigger on table "public"."user_fcm_tokens" to "service_role";

grant truncate on table "public"."user_fcm_tokens" to "service_role";

grant update on table "public"."user_fcm_tokens" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."wolfpack_activity_notifications" to "anon";

grant insert on table "public"."wolfpack_activity_notifications" to "anon";

grant references on table "public"."wolfpack_activity_notifications" to "anon";

grant select on table "public"."wolfpack_activity_notifications" to "anon";

grant trigger on table "public"."wolfpack_activity_notifications" to "anon";

grant truncate on table "public"."wolfpack_activity_notifications" to "anon";

grant update on table "public"."wolfpack_activity_notifications" to "anon";

grant delete on table "public"."wolfpack_activity_notifications" to "authenticated";

grant insert on table "public"."wolfpack_activity_notifications" to "authenticated";

grant references on table "public"."wolfpack_activity_notifications" to "authenticated";

grant select on table "public"."wolfpack_activity_notifications" to "authenticated";

grant trigger on table "public"."wolfpack_activity_notifications" to "authenticated";

grant truncate on table "public"."wolfpack_activity_notifications" to "authenticated";

grant update on table "public"."wolfpack_activity_notifications" to "authenticated";

grant delete on table "public"."wolfpack_activity_notifications" to "service_role";

grant insert on table "public"."wolfpack_activity_notifications" to "service_role";

grant references on table "public"."wolfpack_activity_notifications" to "service_role";

grant select on table "public"."wolfpack_activity_notifications" to "service_role";

grant trigger on table "public"."wolfpack_activity_notifications" to "service_role";

grant truncate on table "public"."wolfpack_activity_notifications" to "service_role";

grant update on table "public"."wolfpack_activity_notifications" to "service_role";

create policy "Everyone can view food/drink categories"
on "public"."food_drink_categories"
as permissive
for select
to public
using ((is_active = true));


create policy "Everyone can view food/drink items"
on "public"."food_drink_items"
as permissive
for select
to public
using ((is_available = true));


create policy "Everyone can view active notification topics"
on "public"."notification_topics"
as permissive
for select
to public
using ((is_active = true));


create policy "Users can delete their own FCM tokens"
on "public"."user_fcm_tokens"
as permissive
for delete
to public
using ((user_id = auth.uid()));


create policy "Users can insert their own FCM tokens"
on "public"."user_fcm_tokens"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "Users can update their own FCM tokens"
on "public"."user_fcm_tokens"
as permissive
for update
to public
using ((user_id = auth.uid()));


create policy "Users can view their own FCM tokens"
on "public"."user_fcm_tokens"
as permissive
for select
to public
using ((user_id = auth.uid()));


create policy "Users can insert their own profile"
on "public"."users"
as permissive
for insert
to public
with check ((auth_id = auth.uid()));


create policy "Users can update their own profile"
on "public"."users"
as permissive
for update
to public
using ((auth_id = auth.uid()));


create policy "Users can view their own profile"
on "public"."users"
as permissive
for select
to public
using ((auth_id = auth.uid()));


create policy "Users can update their own notifications"
on "public"."wolfpack_activity_notifications"
as permissive
for update
to public
using ((recipient_id IN ( SELECT users.id
   FROM users
  WHERE (users.auth_id = auth.uid()))));


create policy "Users can view their own notifications"
on "public"."wolfpack_activity_notifications"
as permissive
for select
to public
using ((recipient_id IN ( SELECT users.id
   FROM users
  WHERE (users.auth_id = auth.uid()))));


CREATE TRIGGER update_food_drink_categories_updated_at BEFORE UPDATE ON public.food_drink_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_drink_items_updated_at BEFORE UPDATE ON public.food_drink_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_topics_updated_at BEFORE UPDATE ON public.notification_topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_fcm_tokens_updated_at BEFORE UPDATE ON public.user_fcm_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.wolfpack_activity_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



