"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addBookSection } from "@/lib/actions/resources";

export function SectionForm({ bookId, nextOrder }: { bookId: string; nextOrder: number }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addBookSection(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3 sm:p-4"
    >
      <input type="hidden" name="book_id" value={bookId} />
      <input type="hidden" name="order_index" value={nextOrder} />
      <div className="flex flex-1 flex-col gap-1.5 sm:min-w-[200px]">
        <Label htmlFor="section-name">Bölüm adı</Label>
        <Input id="section-name" name="name" placeholder="Örn: Çarpanlar ve Katlar" required />
      </div>
      <div className="flex flex-col gap-1.5 sm:w-32">
        <Label htmlFor="test-count">Test sayısı</Label>
        <Input
          id="test-count"
          name="test_count"
          type="number"
          min={1}
          max={200}
          defaultValue={10}
          required
        />
      </div>
      <Button type="submit" className="w-full sm:w-auto">
        Bölüm Ekle
      </Button>
    </form>
  );
}
