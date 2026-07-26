-- Nova migration 017: edit a member's or coach's login details.
--
-- Email and password live in auth.users, not in public.profiles, so changing
-- them normally needs the service-role key — which a static browser app must
-- never hold. These definer functions do the write instead, the same approach
-- migration_002 used to seed the original admin and coach accounts.
--
-- SECURITY NOTE: admin_update_account is callable by anyone holding the anon
-- key, exactly like the other admin_* functions, because the admin panel's
-- login is hardcoded in the app rather than being a real session. That is a
-- deliberate trade for a private deployment. Before this is exposed publicly,
-- put a real admin session in front of it (or move it behind an edge function
-- holding the service key) — the coach equivalent below is already scoped.
create extension if not exists pgcrypto;

/**
 * Applies whichever of the four fields were supplied; nulls are left alone.
 * Returns nothing — callers surface unique-violation errors on email.
 */
create or replace function public.admin_update_account(
  p_id uuid,
  p_full_name text default null,
  p_email text default null,
  p_password text default null,
  p_must_change_password boolean default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalised_email text := lower(trim(p_email));
begin
  update public.profiles
  set full_name = coalesce(nullif(trim(p_full_name), ''), full_name),
      must_change_password = coalesce(p_must_change_password, must_change_password)
  where id = p_id;

  if normalised_email is not null and normalised_email <> '' then
    if exists (
      select 1 from auth.users where lower(email) = normalised_email and id <> p_id
    ) then
      raise exception 'That email is already in use';
    end if;

    update auth.users
    set email = normalised_email,
        -- Staff set this deliberately, so treat it as already verified;
        -- otherwise the account could no longer sign in.
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = p_id;

    -- The identity row carries its own copy of the address; leaving it stale
    -- makes the account inconsistent for anything reading identities.
    update auth.identities
    set identity_data = jsonb_set(identity_data, '{email}', to_jsonb(normalised_email)),
        updated_at = now()
    where user_id = p_id and provider = 'email';
  end if;

  if p_password is not null and length(p_password) >= 6 then
    update auth.users
    set encrypted_password = crypt(p_password, gen_salt('bf')),
        updated_at = now()
    where id = p_id;
  end if;
end;
$$;

-- The coach equivalent, restricted to their own roster. A coach can fix a
-- client's typo'd email or reset a forgotten password without being able to
-- touch another coach's clients — or another coach.
create or replace function public.coach_update_client(
  p_client_id uuid,
  p_full_name text default null,
  p_email text default null,
  p_password text default null,
  p_must_change_password boolean default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_active_admin() or (public.is_active_coach() and public.is_my_client(p_client_id))) then
    raise exception 'You can only edit your own clients';
  end if;

  perform public.admin_update_account(
    p_client_id, p_full_name, p_email, p_password, p_must_change_password
  );
end;
$$;
