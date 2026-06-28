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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          {subject.subject_name}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            (D: {subject.correct_count} Y: {subject.incorrect_count} B: {subject.blank_count})
          </span>
        </CardTitle>
        <form action={deleteExamSubject}>
          <input type="hidden" name="id" value={subject.id} />
          <input type="hidden" name="exam_id" value={examId} />
          <input type="hidden" name="student_id" value={studentId} />
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Dersi Sil
          </Button>
        </form>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
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

        {showTopicForm ? (
          <form
            action={async (formData) => {
              await createExamTopic(formData);
              setShowTopicForm(false);
            }}
            className="flex flex-wrap items-end gap-2"
          >
            <input type="hidden" name="exam_subject_id" value={subject.id} />
            <input type="hidden" name="exam_id" value={examId} />
            <input type="hidden" name="student_id" value={studentId} />
            <Input name="topic_name" placeholder="Konu adı" required className="w-40" />
            <Input name="correct_count" type="number" min={0} defaultValue={0} placeholder="Doğru" className="w-20" />
            <Input name="incorrect_count" type="number" min={0} defaultValue={0} placeholder="Yanlış" className="w-20" />
            <Input name="blank_count" type="number" min={0} defaultValue={0} placeholder="Boş" className="w-20" />
            <Button type="submit" size="sm">
              Ekle
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowTopicForm(false)}>
              Vazgeç
            </Button>
          </form>
        ) : (
          <Button variant="outline" size="sm" className="self-start" onClick={() => setShowTopicForm(true)}>
            Konu Ekle
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
