"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import {
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
} from "recharts";
import { supabase } from "@/lib/supabase-client";
import { Teacher } from "../../types";
import CreateTeacherForm from "@/components/CreateTeacherForm";
import TeacherList from "@/components/TeacherList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast, Toaster } from "sonner";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateTeacherOpen, setIsCreateTeacherOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      console.log("User:", user?.id, user?.user_metadata); // Debug
      console.log("User Error:", userError); // Debug

      if (userError || !user) {
        console.error("No user found:", userError?.message);
        router.push("/login");
        return;
      }

      const roles = user.user_metadata?.roles || [];
      const full_name = user.user_metadata?.full_name || "Unknown";
      const school_id = user.user_metadata?.school_id;

      if (!roles.includes("admin")) {
        console.error("User is not admin:", roles);
        router.push("/login");
        return;
      }

      setFullName(full_name);
      setSchoolId(school_id);

      if (school_id) {
        const { data: teacherData, error: teacherError } = await supabase
          .from("teachers")
          .select("id, user_id, school_id, is_class_teacher, class_assigned")
          .eq("school_id", school_id);

        console.log("Teachers Query Error:", teacherError); // Debug
        console.log("Teachers Query Data:", teacherData); // Debug

        if (teacherError) {
          setError(`Failed to fetch teachers: ${teacherError.message}`);
          setLoading(false);
          return;
        }

        if (teacherData) {
          const teacherIds = teacherData.map((t) => t.user_id);
          const { data: authUsersData, error: usersError } = await supabase.rpc(
            "get_users_metadata",
            { user_ids: teacherIds }
          );

          console.log("Users Metadata Error:", usersError); // Debug
          console.log("Users Metadata Data:", authUsersData); // Debug

          if (usersError) {
            setError(`Failed to fetch teacher metadata: ${usersError.message}`);
            setLoading(false);
            return;
          }

          const teachersWithDetails = teacherData.map((t) => ({
            id: t.id,
            user_id: t.user_id,
            school_id: t.school_id,
            full_name:
              authUsersData?.find((u) => u.id === t.user_id)?.user_metadata
                ?.full_name || "Unknown",
            is_class_teacher: t.is_class_teacher,
            class_assigned: t.class_assigned,
          }));

          setTeachers(teachersWithDetails);
        }

        // Removed subjects fetch since no subject_id logic
      } else {
        setError("No school_id found for user");
      }

      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleTeacherCreated = async () => {
    if (schoolId) {
      console.log("schoolId:", schoolId); // Debug
      const { data, error: teacherError } = await supabase
        .from("teachers")
        .select("id, user_id, school_id, is_class_teacher, class_assigned")
        .eq("school_id", schoolId);

      console.log("Teachers Refresh Error:", teacherError); // Debug
      console.log("Teachers Refresh Data:", data); // Debug

      if (teacherError) {
        console.error("Failed to refresh teachers:", teacherError.message);
        toast("Error", {
          description: `Failed to refresh teachers: ${teacherError.message}`,
        });
        return;
      }

      if (data) {
        const teacherIds = data.map((t) => t.user_id);
        const { data: authUsersData, error: usersError } = await supabase.rpc(
          "get_users_metadata",
          { user_ids: teacherIds }
        );

        console.log("Users Metadata Refresh Error:", usersError); // Debug
        console.log("Users Metadata Refresh Data:", authUsersData); // Debug

        if (usersError) {
          console.error(
            "Failed to fetch teacher metadata:",
            usersError.message
          );
          toast("Error", {
            description: `Failed to fetch teacher metadata: ${usersError.message}`,
          });
          return;
        }

        const teachersWithDetails = data.map((t) => ({
          id: t.id,
          user_id: t.user_id,
          school_id: t.school_id,
          full_name:
            authUsersData?.find((u) => u.id === t.user_id)?.user_metadata
              ?.full_name || "Unknown",
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

  const studentEnrollment = [
    { month: "Jan", students: 400 },
    { month: "Feb", students: 420 },
    { month: "Mar", students: 450 },
    { month: "Apr", students: 430 },
    { month: "May", students: 460 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-destructive">
        <p className="text-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <Toaster />
      <SidebarProvider>
        <AppSidebar />
        <SidebarTrigger />
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">
              Admin Dashboard - {fullName || "Unknown"}
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

          <div className="space-y-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Student Enrollment Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
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

          <Card>
            <CardHeader>
              <CardTitle>Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <TeacherList teachers={teachers} />
            </CardContent>
          </Card>

          <CreateTeacherForm
            isOpen={isCreateTeacherOpen}
            onOpenChange={setIsCreateTeacherOpen}
            subjects={[]}
            onTeacherCreated={handleTeacherCreated}
          />
        </div>
      </SidebarProvider>
    </div>
  );
}
