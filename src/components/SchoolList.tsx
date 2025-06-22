"use client";

import { School } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface SchoolListProps {
  schools: School[];
  onAddAdmin: (schoolId: string) => void;
}

export default function SchoolList({ schools, onAddAdmin }: SchoolListProps) {
  return (
    <div>
      {schools.length === 0 ? (
        <p className="text-muted-foreground">
          No schools found. Add a school to get started.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schools.map((school) => (
              <TableRow key={school.id}>
                <TableCell>{school.name}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddAdmin(school.id)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Admin
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
