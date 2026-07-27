-- Nova migration 019: storage for the assessment's equipment photos.
--
-- The assessment lets a home-training client photograph their setup so the
-- coach can see what they're actually working with. Files land under
--
--   assessment-uploads/<client_id>/<assessment_id>/<timestamp>-<filename>
--
-- The bucket is private: every read goes through a signed URL, so a photo of
-- someone's home is never on a public URL.
--
-- Running this replaces creating the bucket by hand in the dashboard.

insert into storage.buckets (id, name, public)
values ('assessment-uploads', 'assessment-uploads', false)
on conflict (id) do nothing;

-- The first path segment is the owner's user id, which is what every policy
-- below keys off — a client can only ever touch their own folder.
drop policy if exists "assessment uploads: client writes own folder" on storage.objects;
create policy "assessment uploads: client writes own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'assessment-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "assessment uploads: client reads own folder" on storage.objects;
create policy "assessment uploads: client reads own folder" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'assessment-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Clients can remove a photo while the assessment is still a draft; once it's
-- submitted the form is read-only, so there's nothing to delete from.
drop policy if exists "assessment uploads: client deletes own folder" on storage.objects;
create policy "assessment uploads: client deletes own folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'assessment-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Staff read only: admins see everything, a coach sees their own roster.
drop policy if exists "assessment uploads: staff reads" on storage.objects;
create policy "assessment uploads: staff reads" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'assessment-uploads'
    and (
      public.is_active_admin()
      or (
        public.is_active_coach()
        and public.is_my_client(((storage.foldername(name))[1])::uuid)
      )
    )
  );
