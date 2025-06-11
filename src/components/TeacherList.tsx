"use client";

import { Teacher } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TeacherListProps {
  teachers: Teacher[];
}

export default function TeacherList({ teachers }: TeacherListProps) {
  return (
    <div>
      {teachers.length === 0 ? (
        <p className="text-muted-foreground">
          No teachers found. Add a teacher to get started.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Class Teacher</TableHead>
              <TableHead>Assigned Class</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell>{teacher.full_name}</TableCell>
                <TableCell>{teacher.subject_name}</TableCell>
                <TableCell>
                  {teacher.is_class_teacher ? (
                    <Badge variant="default">Class Teacher</Badge>
                  ) : (
                    <Badge variant="secondary">-</Badge>
                  )}
                </TableCell>
                <TableCell>{teacher.class_assigned || "-"}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" disabled>
                    Edit (Coming Soon)
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
