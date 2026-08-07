"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOwnProfile } from "@/lib/actions/profile";

/** Kullanıcının kendi ad/telefonunu düzenlediği form. */
export function EditProfileForm({
  initialFullName,
  initialPhone,
}: {
  initialFullName: string;
  initialPhone: string | null;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("full_name", fullName);
      fd.set("phone", phone);
      const result = await updateOwnProfile(fd);
      if (!result.ok) {
        toast.error(result.error ?? "Kaydedilemedi.");
        return;
      }
      toast.success("Bilgilerin güncellendi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-full-name">Ad Soyad</Label>
        <Input
          id="profile-full-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-phone">Telefon (isteğe bağlı)</Label>
        <Input
          id="profile-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="05xx xxx xx xx"
          autoComplete="tel"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Kaydediliyor..." : "Bilgileri Kaydet"}
        </Button>
      </div>
    </form>
  );
}
