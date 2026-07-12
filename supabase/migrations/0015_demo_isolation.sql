-- Demo (önizleme) dünyasını gerçek veriden ayır
-- Sorun: can_access_student() öğretmene koşulsuz erişim verir → demo öğretmen
-- (preview.teacher) gerçek öğrencileri de görür.
-- Çözüm: profiles.is_demo bayrağı + simetrik kural. Öğretmen ancak kendisiyle
-- AYNI is_demo değerine sahip öğrencilere erişebilir:
--   - demo öğretmen (is_demo=true)  ↔ yalnız demo öğrenciler
--   - gerçek öğretmen (is_demo=false) ↔ yalnız gerçek öğrenciler
-- Öğrenci/veli zaten kendi kimliği / parent_student_links ile izole; değişmez.
-- Gerçek kullanıcıların tümü is_demo=false olduğundan davranışları AYNEN korunur.

alter table public.profiles add column is_demo boolean not null default false;

create or replace function public.can_access_student(target_student uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_student = auth.uid()
    or public.is_parent_of(target_student)
    or (
      public.current_role() = 'teacher'
      and (select p.is_demo from public.profiles p where p.id = auth.uid())
        is not distinct from
          (select s.is_demo from public.profiles s where s.id = target_student)
    );
$$;

-- Mevcut önizleme hesaplarını demo olarak işaretle (varsa).
update public.profiles set is_demo = true where username like 'preview.%';
