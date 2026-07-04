"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addBookSection,
  deleteBookSection,
  updateBookSection,
} from "@/lib/actions/resources";
import type { ResourceBookSection } from "@/lib/types";

/**
 * Öğretmen: kitabın bölümlerini yönetir — satır içi düzenleme, silme, ekleme.
 * (Onaydan sonra kitap içeriğini yalnızca öğretmen değiştirebilir.)
 */
export function SectionManager({
  bookId,
  sections,
}: {
  bookId: string;
  sections: ResourceBookSection[];
}) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCount, setEditCount] = useState("10");
  const [newName, setNewName] = useState("");
  const [newCount, setNewCount] = useState("10");

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Bir hata oluştu.");
      }
    });
  }

  return (
    <div className="space-y-2">
      {sections.map((s, i) => {
        const editing = editingId === s.id;
        return (
          <div
            key={s.id}
            className="animate-fade-up flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/30"
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
          >
            <span className="gradient-surface flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white">
              {i + 1}
            </span>

            {editing ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-9 flex-1"
                  autoFocus
                />
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={editCount}
                  onChange={(e) => setEditCount(e.target.value)}
                  className="h-9 w-20"
                  aria-label="Test sayısı"
                />
                <Button
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  disabled={pending}
                  aria-label="Kaydet"
                  onClick={() =>
                    run(async () => {
                      const fd = new FormData();
                      fd.set("id", s.id);
                      fd.set("book_id", bookId);
                      fd.set("name", editName);
                      fd.set("test_count", editCount);
                      await updateBookSection(fd);
                      setEditingId(null);
                      toast.success("Bölüm güncellendi.");
                    })
                  }
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setEditingId(null)}
                  aria-label="Vazgeç"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.test_count} test</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0 text-muted-foreground"
                  aria-label="Bölümü düzenle"
                  onClick={() => {
                    setEditingId(s.id);
                    setEditName(s.name);
                    setEditCount(String(s.test_count));
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={pending}
                  aria-label="Bölümü sil"
                  onClick={() =>
                    run(async () => {
                      const fd = new FormData();
                      fd.set("id", s.id);
                      fd.set("book_id", bookId);
                      await deleteBookSection(fd);
                      toast.success("Bölüm silindi.");
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-2 rounded-xl border border-dashed bg-muted/30 p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Plus className="h-4 w-4" />
        </span>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Yeni bölüm adı"
          className="h-9 flex-1 bg-background"
        />
        <Input
          type="number"
          min={1}
          max={200}
          value={newCount}
          onChange={(e) => setNewCount(e.target.value)}
          className="h-9 w-20 bg-background"
          aria-label="Test sayısı"
        />
        <Button
          size="sm"
          disabled={pending || !newName.trim()}
          onClick={() =>
            run(async () => {
              const fd = new FormData();
              fd.set("book_id", bookId);
              fd.set("name", newName);
              fd.set("order_index", String(sections.length));
              fd.set("test_count", newCount);
              await addBookSection(fd);
              setNewName("");
              setNewCount("10");
              toast.success("Bölüm eklendi.");
            })
          }
        >
          Ekle
        </Button>
      </div>
    </div>
  );
}
