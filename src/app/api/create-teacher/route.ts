import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

import { z } from "zod";

const VALID_CLASSES = [
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
];

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    full_name: z.string().min(1),
    subjectId: z.string().uuid(),
    is_class_teacher: z.boolean().default(false),
    class_assigned: z
      .string()
      .nullable()
      .refine((val) => !val || VALID_CLASSES.includes(val), {
        message: "Invalid class assigned",
      }),
  })
  .refine(
    (data) =>
      !data.is_class_teacher || (data.is_class_teacher && data.class_assigned),
    {
      message: "Class must be assigned if teacher is a class teacher",
      path: ["class_assigned"],
    }
  );

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
    }

    const {
      email,
      password,
      subjectId,
      full_name,
      is_class_teacher,
      class_assigned,
    } = parsed.data;
    let authUser = null;
    let authError = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(token);
      authUser = user;
      authError = error;
    } else {
      // Fallback to default getUser (relies on cookies or context)
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser();
      authUser = user;
      authError = error;
    }

    if (authError) {
      console.error("Auth Error:", authError.message, authError);
    }

    if (!authUser) {
      console.log("No authenticated user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role from users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("role, school_id")
      .eq("id", authUser.id)
      .single();

    if (userError) {
      console.error("User Query Error:", userError.message, userError);
    }

    if (userError || userData?.role !== "admin") {
      console.log(
        "Unauthorized: Role=",
        userData?.role,
        "Error=",
        userError?.message
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = userData.school_id;

    // Verify subject exists
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from("subjects")
      .select("id")
      .eq("id", subjectId)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: "Invalid subject ID" },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: newUser, error: createAuthError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { full_name, school_id: schoolId },
      });

    if (createAuthError) {
      return NextResponse.json(
        { error: createAuthError.message },
        { status: 400 }
      );
    }

    // Update users table
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        role: "teacher",
        school_id: schoolId,
        full_name,
      })
      .eq("id", newUser!.user.id);

    if (updateError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser!.user.id);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Insert teacher into teachers table
    const { error: teacherError } = await supabaseAdmin
      .from("teachers")
      .insert({
        user_id: newUser!.user.id,
        school_id: schoolId,
        subject_id: subjectId,
        is_class_teacher,
        class_assigned: is_class_teacher ? class_assigned : null,
      });

    if (teacherError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser!.user.id);
      await supabaseAdmin.from("users").delete().eq("id", newUser!.user.id);
      return NextResponse.json(
        { error: teacherError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create Teacher Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
