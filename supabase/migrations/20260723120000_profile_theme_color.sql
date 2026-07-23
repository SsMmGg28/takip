-- Kullanıcı seçebilen aksan tema rengi. Cihazlar arası senkron için profilde tutulur.
-- Light/dark tonları globals.css'teki [data-color] bloklarındadır; burada yalnız
-- izinli değer kümesi zorlanır. theme_color ayrıcalıklı alan değildir; mevcut
-- profiles RLS UPDATE politikası ve 0007b ayrıcalık trigger'ı self-update'e izin verir.

alter table public.profiles
  add column if not exists theme_color text not null default 'blue';

alter table public.profiles
  drop constraint if exists profiles_theme_color_check;

alter table public.profiles
  add constraint profiles_theme_color_check
  check (theme_color in ('blue', 'green', 'purple', 'rose', 'orange'));
