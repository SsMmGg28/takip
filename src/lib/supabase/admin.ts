import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role istemci. Sadece şu işlemler için kullanılır:
 * - öğretmenin öğrenci/veli hesabı oluşturması
 * - öğretmenin bir kullanıcının şifresini sıfırlaması
 * Bu dosya hiçbir şekilde client bundle'a dahil edilmemeli ("server-only" bunu derleme zamanında garantiler).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
