"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bar, Line } from "recharts";
import {
  BarChart,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase-client";
import { Teacher, Subject } from "../../types";
import CreateTeacherForm from "@/components/CreateTeacherForm";
import TeacherList from "@/components/TeacherList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast, Toaster } from "sonner";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateTeacherOpen, setIsCreateTeacherOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, full_name, school_id")
        .eq("id", user.id)
        .single();

      if (userError || !userData) {
        setError("Failed to fetch user data");
        setLoading(false);
        return;
      }

      const { role, full_name, school_id } = userData;

      if (!["admin", "super_admin"].includes(role)) {
        router.push("/login");
        return;
      }

      setUserRole(role);
      setFullName(full_name || "Unknown");
      setSchoolId(school_id);

      if (role === "admin" && school_id) {
        const { data: teacherData } = await supabase
          .from("teachers")
          .select(
            "id, user_id, school_id, subject_id, is_class_teacher, class_assigned"
          )
          .eq("school_id", school_id);

        if (teacherData) {
          const teacherIds = teacherData.map((t) => t.user_id);
          const subjectIds = teacherData.map((t) => t.subject_id);

          const { data: userData } = await supabase
            .from("users")
            .select("id, full_name")
            .in("id", teacherIds);

          const { data: subjectData } = await supabase
            .from("subjects")
            .select("id, name")
            .in("id", subjectIds);

          const teachersWithDetails = teacherData.map((t) => ({
            id: t.id,
            user_id: t.user_id,
            school_id: t.school_id,
            subject_id: t.subject_id,
            subject_name:
              subjectData?.find((s) => s.id === t.subject_id)?.name ||
              "Unknown",
            full_name:
              userData?.find((u) => u.id === t.user_id)?.full_name || "Unknown",
            is_class_teacher: t.is_class_teacher,
            class_assigned: t.class_assigned,
          }));

          setTeachers(teachersWithDetails);
        }

        const { data: subjectData } = await supabase
          .from("subjects")
          .select("*");
        setSubjects(subjectData || []);
      } else if (role === "super_admin") {
        const { data: schoolData } = await supabase
          .from("schools")
          .select("id, name");
        setSchools(schoolData || []);
      }

      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleTeacherCreated = async () => {
    if (schoolId) {
      const { data } = await supabase
        .from("teachers")
        .select(
          "id, user_id, school_id, subject_id, is_class_teacher, class_assigned"
        )
        .eq("school_id", schoolId);

      if (data) {
        const teacherIds = data.map((t) => t.user_id);
        const subjectIds = data.map((t) => t.subject_id);

        const [userRes, subjectRes] = await Promise.all([
          supabase.from("users").select("id, full_name").in("id", teacherIds),
          supabase.from("subjects").select("id, name").in("id", subjectIds),
        ]);

        const teachersWithDetails = data.map((t) => ({
          id: t.id,
          user_id: t.user_id,
          school_id: t.school_id,
          subject_id: t.subject_id,
          subject_name:
            subjectRes.data?.find((s) => s.id === t.subject_id)?.name ||
            "Unknown",
          full_name:
            userRes.data?.find((u) => u.id === t.user_id)?.full_name ||
            "Unknown",
          is_class_teacher: t.is_class_teacher,
          class_assigned: t.class_assigned,
        }));
        setTeachers(teachersWithDetails);
      }
    }
    setIsCreateTeacherOpen(false);
    toast("Teacher Created", {
      description: "The teacher has been added successfully.",
    });
  };

  // Chart data
  const teacherBySubject = subjects.map((subject) => ({
    name: subject.name,
    count: teachers.filter((t) => t.subject_id === subject.id).length,
  }));

  const studentEnrollment = [
    { month: "Jan", students: 400 },
    { month: "Feb", students: 420 },
    { month: "Mar", students: 450 },
    { month: "Apr", students: 430 },
    { month: "May", students: 460 },
  ];

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg">Loading...</p>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-destructive">
        <p className="text-lg">Error: {error}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <Toaster />
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {userRole === "super_admin"
              ? `Super Admin Dashboard - ${fullName}`
              : `Admin Dashboard - ${fullName}`}
          </h1>
          <Button
            variant="destructive"
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
          >
            Logout
          </Button>
        </div>

        {userRole === "admin" && (
          <>
            {/* School Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Total Teachers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{teachers.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">500</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">20</p>
                </CardContent>
              </Card>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Teachers</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setIsCreateTeacherOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Teacher
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Manage Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => router.push("/dashboard/students")}
                    className="w-full sm:w-auto"
                    disabled
                  >
                    View Students
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Class Schedules</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => router.push("/dashboard/schedules")}
                    className="w-full sm:w-auto"
                    disabled
                  >
                    View Schedules
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="space-y-8 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Teachers by Subject</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={teacherBySubject}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Student Enrollment Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer>
                    <LineChart data={studentEnrollment}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="students"
                        stroke="hsl(var(--primary))"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Teacher List */}
            <Card>
              <CardHeader>
                <CardTitle>Teachers</CardTitle>
              </CardHeader>
              <CardContent>
                <TeacherList teachers={teachers} />
              </CardContent>
            </Card>

            {/* Teacher Creation Modal */}
            <CreateTeacherForm
              isOpen={isCreateTeacherOpen}
              onOpenChange={setIsCreateTeacherOpen}
              subjects={subjects}
              onTeacherCreated={handleTeacherCreated}
            />
          </>
        )}

        {userRole === "super_admin" && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Schools</CardTitle>
            </CardHeader>
            <CardContent>
              {schools.length === 0 ? (
                <p>No schools found.</p>
              ) : (
                <ul className="space-y-2">
                  {schools.map((school) => (
                    <li key={school.id} className="border-b py-2">
                      {school.name}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
