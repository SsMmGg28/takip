-- Güvenlik düzeltmesi: profiles yetki yükseltme (privilege escalation) kapatılır.
--
-- 0002'deki "profiles_update_self_or_teacher" politikası kullanıcının KENDİ
-- satırını güncellemesine izin veriyor ama `with check` / kolon kısıtı yok.
-- Bu yüzden bir öğrenci/veli tarayıcıdan (anon key + kendi JWT'si)
--   update profiles set role = 'teacher' where id = auth.uid()
-- çalıştırıp öğretmene yükselebiliyordu. RLS `with check` yalnız NEW satırı
-- gördüğünden OLD↔NEW kıyası ancak trigger ile yapılabilir.
--
-- Bu trigger, çağıran öğretmen DEĞİLSE ayrıcalıklı kolonların değişmesini
-- engeller. Tek istisna: kullanıcı kendi `must_change_password` alanını
-- yalnızca true -> false yönünde değiştirebilir (set-password akışı bunu
-- tarayıcıdan yapıyor). role / username / id her koşulda kilitlidir.

create or replace function public.enforce_profile_privilege_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
