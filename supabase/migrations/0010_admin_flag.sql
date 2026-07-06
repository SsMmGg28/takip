-- 0010: Gömülü yönetici (admin) hesabı altyapısı.
-- Admin ayrı bir rol DEĞİLDİR: role='teacher' + is_admin=true bayrağıdır;
-- böylece mevcut RLS politikalarına ve rol CHECK'ine dokunulmaz. Ek yetkiler
-- (öğretmen şifresi sıfırlama vb.) API katmanında is_admin ile denetlenir.

alter table public.profiles add column is_admin boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- Yetki bekçisi güncellemesi: mevcut üretim tanımı (role/username/id koruması
-- ve must_change_password kuralı) aynen korunur; üzerine is_admin kilidi
-- eklenir. is_admin'i JWT'li HİÇBİR kullanıcı (öğretmen dahil) değiştiremez —
-- yalnızca service-role (auth.uid() null) değiştirebilir. Aksi hâlde
-- profiles_update_self_or_teacher politikası nedeniyle herhangi bir öğretmen
-- kendini admin yapabilirdi.
create or replace function public.enforce_profile_privilege_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- is_admin: yalnızca service-role değiştirebilir.
  if auth.uid() is not null and new.is_admin is distinct from old.is_admin then
    raise exception 'Yönetici yetkisi bu şekilde değiştirilemez.';
  end if;

  -- Yalnızca JWT ile kimliği doğrulanmış (auth.uid() dolu) kullanıcıları
  -- kısıtlarız. Service-role sunucu işlemleri (ör. öğretmenin şifre sıfırlaması
  -- must_change_password'u tekrar true yapar) RLS'i zaten atlar ve güvenilir
  -- olduğundan bu bekçiden muaftır; aksi halde auth.uid() null olduğu için
  -- meşru service-role güncellemeleri yanlışlıkla reddedilirdi.
  if auth.uid() is not null and public.current_role() is distinct from 'teacher' then
    -- role / username / id: öğretmen olmayan hiç kimse değiştiremez.
    if new.role is distinct from old.role then
      raise exception 'Rol yalnızca öğretmen tarafından değiştirilebilir.';
    end if;
    if new.username is distinct from old.username then
      raise exception 'Kullanıcı adı yalnızca öğretmen tarafından değiştirilebilir.';
    end if;
    if new.id is distinct from old.id then
      raise exception 'Profil kimliği değiştirilemez.';
    end if;

    -- must_change_password: kullanıcı yalnızca kendi satırında ve yalnızca
    -- true -> false yönünde kapatabilir (ilk giriş şifre belirleme akışı).
    if new.must_change_password is distinct from old.must_change_password then
      if not (old.id = auth.uid() and old.must_change_password and not new.must_change_password) then
        raise exception 'Şifre değiştirme zorunluluğu bu şekilde değiştirilemez.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_profile_privilege_guard on public.profiles;
create trigger enforce_profile_privilege_guard
  before update on public.profiles
  for each row execute function public.enforce_profile_privilege_guard();
