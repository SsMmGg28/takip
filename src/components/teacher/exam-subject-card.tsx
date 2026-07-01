"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createExamTopic,
  deleteExamSubject,
  deleteExamTopic,
} from "@/app/teacher/exams/actions";
import type { ExamSubject, ExamTopic } from "@/lib/types";

export function ExamSubjectCard({
  subject,
  topics,
  examId,
  studentId,
}: {
  subject: ExamSubject;
  topics: ExamTopic[];
  examId: string;
  studentId: string;
}) {
  const [showTopicForm, setShowTopicForm] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">
          {subject.subject_name}{" "}
          <span className="block text-xs font-normal text-muted-foreground sm:inline sm:text-sm">
            (D: {subject.correct_count} Y: {subject.incorrect_count} B: {subject.blank_count})
          </span>
        </CardTitle>
        <form action={deleteExamSubject} className="self-start sm:self-auto">
          <input type="hidden" name="id" value={subject.id} />
          <input type="hidden" name="exam_id" value={examId} />
          <input type="hidden" name="student_id" value={studentId} />
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Dersi Sil
          </Button>
        </form>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Desktop table */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Konu</TableHead>
                <TableHead>Doğru</TableHead>
                <TableHead>Yanlış</TableHead>
                <TableHead>Boş</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.topic_name}</TableCell>
                  <TableCell>{t.correct_count}</TableCell>
                  <TableCell>{t.incorrect_count}</TableCell>
                  <TableCell>{t.blank_count}</TableCell>
                  <TableCell className="text-right">
                    <form action={deleteExamTopic}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="exam_id" value={examId} />
                      <input type="hidden" name="student_id" value={studentId} />
                      <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                        Sil
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {topics.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Henüz konu eklenmedi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card list */}
        <div className="flex flex-col gap-2 sm:hidden">
          {topics.length === 0 && (
            <p className="rounded-md border border-dashed py-4 text-center text-sm text-muted-foreground">
              Henüz konu eklenmedi.
            </p>
          )}
          {topics.map((t) => (
            <div key={t.id} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 font-medium">{t.topic_name}</p>
                <form action={deleteExamTopic} className="shrink-0">
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="exam_id" value={examId} />
                  <input type="hidden" name="student_id" value={studentId} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="xs"
                    className="text-destructive"
                  >
                    Sil
                  </Button>
                </form>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded bg-muted/50 p-1.5 text-center">
                  <p className="text-muted-foreground">Doğru</p>
                  <p className="font-semibold">{t.correct_count}</p>
                </div>
                <div className="rounded bg-muted/50 p-1.5 text-center">
                  <p className="text-muted-foreground">Yanlış</p>
                  <p className="font-semibold">{t.incorrect_count}</p>
                </div>
                <div className="rounded bg-muted/50 p-1.5 text-center">
                  <p className="text-muted-foreground">Boş</p>
                  <p className="font-semibold">{t.blank_count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showTopicForm ? (
          <form
            action={async (formData) => {
              await createExamTopic(formData);
              setShowTopicForm(false);
            }}
            className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end"
          >
            <input type="hidden" name="exam_subject_id" value={subject.id} />
            <input type="hidden" name="exam_id" value={examId} />
            <input type="hidden" name="student_id" value={studentId} />
            <Input
              name="topic_name"
              placeholder="Konu adı"
              required
              className="col-span-2 sm:w-40"
            />
            <Input
              name="correct_count"
              type="number"
              min={0}
              defaultValue={0}
              placeholder="Doğru"
              className="sm:w-20"
            />
            <Input
              name="incorrect_count"
              type="number"
              min={0}
              defaultValue={0}
              placeholder="Yanlış"
              className="sm:w-20"
            />
            <Input
              name="blank_count"
              type="number"
              min={0}
              defaultValue={0}
              placeholder="Boş"
              className="sm:w-20"
            />
            <div className="col-span-2 flex gap-2 sm:contents">
              <Button type="submit" size="sm" className="flex-1 sm:flex-none">
                Ekle
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => setShowTopicForm(false)}
              >
                Vazgeç
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setShowTopicForm(true)}
          >
            Konu Ekle
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
