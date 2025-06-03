"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Teacher, Subject } from "../../types";
import CreateTeacherForm from "@/components/CreateTeacherForm";
import TeacherList from "@/components/TeacherList";

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

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch user data
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
        // Fetch teachers
        const { data: teacherData } = await supabase
          .from("teachers")
          .select("id, user_id, school_id, subject_id")
          .eq("school_id", school_id);

        if (teacherData) {
          // Fetch subject names and user full names
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
          }));

          setTeachers(teachersWithDetails);
        }

        // Fetch all subjects for the form
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">
        {userRole === "super_admin"
          ? `Super Admin Dashboard - ${fullName}`
          : `Admin Dashboard - ${fullName}`}
      </h1>
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.push("/login");
        }}
        className="bg-red-500 text-white p-2 rounded hover:bg-red-600 mb-6"
      >
        Logout
      </button>

      {userRole === "admin" && (
        <>
          <CreateTeacherForm
            subjects={subjects}
            onTeacherCreated={() => {
              supabase
                .from("teachers")
                .select("id, user_id, school_id, subject_id")
                .eq("school_id", schoolId)
                .then(({ data }) => {
                  if (data) {
                    const teacherIds = data.map((t) => t.user_id);
                    const subjectIds = data.map((t) => t.subject_id);

                    Promise.all([
                      supabase
                        .from("users")
                        .select("id, full_name")
                        .in("id", teacherIds),
                      supabase
                        .from("subjects")
                        .select("id, name")
                        .in("id", subjectIds),
                    ]).then(([userRes, subjectRes]) => {
                      const teachersWithDetails = data.map((t) => ({
                        id: t.id,
                        user_id: t.user_id,
                        school_id: t.school_id,
                        subject_id: t.subject_id,
                        subject_name:
                          subjectRes.data?.find((s) => s.id === t.subject_id)
                            ?.name || "Unknown",
                        full_name:
                          userRes.data?.find((u) => u.id === t.user_id)
                            ?.full_name || "Unknown",
                      }));
                      setTeachers(teachersWithDetails);
                    });
                  }
                });
            }}
          />
          <TeacherList teachers={teachers} />
        </>
      )}
    </div>
  );
}
