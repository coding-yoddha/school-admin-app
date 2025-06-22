"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { School } from "../../types";
import CreateSchoolForm from "@/components/CreateSchoolForm";
import CreateAdminForm from "@/components/CreateAdminForm";
import SchoolList from "@/components/SchoolList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import { Plus } from "lucide-react";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateSchoolOpen, setIsCreateSchoolOpen] = useState(false);
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { user_metadata } = user;
      const roles = user_metadata?.roles || [];
      const full_name = user_metadata?.full_name || "Unknown";

      if (!roles.includes("super_admin")) {
        router.push("/login");
        return;
      }

      setUserRole("super_admin");
      setFullName(full_name);

      const { data: schoolData } = await supabase
        .from("schools")
        .select("id, name");
      setSchools(schoolData || []);

      console.log("schoolData", schoolData);

      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleSchoolCreated = async () => {
    const { data } = await supabase.from("schools").select("id, name");
    setSchools(data || []);
    setIsCreateSchoolOpen(false);
  };

  const handleAdminCreated = async () => {
    setIsCreateAdminOpen(false);
    setSelectedSchoolId(null);
  };

  const handleAddAdmin = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setIsCreateAdminOpen(true);
  };

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
            Super Admin Dashboard - {fullName}
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

        {/* Action Card */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Manage Schools</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setIsCreateSchoolOpen(true)}
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New School
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* School List */}
        <Card>
          <CardHeader>
            <CardTitle>Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <SchoolList schools={schools} onAddAdmin={handleAddAdmin} />
          </CardContent>
        </Card>

        {/* Modals */}
        <CreateSchoolForm
          isOpen={isCreateSchoolOpen}
          onOpenChange={setIsCreateSchoolOpen}
          onSchoolCreated={handleSchoolCreated}
        />
        {selectedSchoolId && (
          <CreateAdminForm
            isOpen={isCreateAdminOpen}
            onOpenChange={setIsCreateAdminOpen}
            schoolId={selectedSchoolId}
            onAdminCreated={handleAdminCreated}
          />
        )}
      </div>
    </div>
  );
}
