"use client";

import { useLayoutEffect } from "react";
import { DEFAULT_THEME_COLOR, isThemeColor, type ThemeColor } from "@/lib/theme-colors";

/**
 * Seçili aksan tema rengini `<html data-color="...">` üzerine uygular.
 *
 * İki parça birlikte çalışır:
 *  - `NoFlashThemeColorScript`: kabuk HTML'i parse edilirken çalışan inline script;
 *    içerik boyanmadan önce özniteliği kurar (yenilemede renk sıçraması olmaz).
 *  - `ThemeColorSync`: hidrasyon sonrası özniteliği korur ve prop değişince günceller;
 *    böylece kullanıcı profilden rengi değiştirince tüm arayüz (portallar dahil, çünkü
 *    öznitelik <html> üzerindedir) anında yeni rengi alır.
 *
 * Renk sabit bir enum olduğundan inline script'te enjeksiyon riski yoktur; yine de
 * `isThemeColor` ile doğrulanır.
 */

export function NoFlashThemeColorScript({ color }: { color: string }) {
  const safe: ThemeColor = isThemeColor(color) ? color : DEFAULT_THEME_COLOR;
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.setAttribute('data-color','${safe}')`,
      }}
    />
  );
}

export function ThemeColorSync({ color }: { color: ThemeColor }) {
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-color", color);
  }, [color]);
  return null;
}
