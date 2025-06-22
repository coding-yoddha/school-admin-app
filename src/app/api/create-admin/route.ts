import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  school_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  console.log("Authorization Header:", authHeader);

  if (!authHeader?.startsWith("Bearer ")) {
    console.error("Missing or invalid Authorization header");
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }

  const token = authHeader.replace("Bearer ", "");
  console.log("Extracted Token:", token.slice(0, 20) + "...");

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    console.error("Auth Error:", authError?.message || "No user found");
    return NextResponse.json(
      { error: `Unauthorized: ${authError?.message || "Invalid token"}` },
      { status: 401 }
    );
  }

  console.log("Authenticated User:", user.id, user.user_metadata);

  const { user_metadata } = user;
  if (!user_metadata?.roles?.includes("super_admin")) {
    console.error("User is not super_admin:", user_metadata?.roles);
    return NextResponse.json(
      { error: "Forbidden: Not a super admin" },
      { status: 403 }
    );
  }

  const body = await request.json();
  console.log("Request Body:", body);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error("Validation Errors:", parsed.error.errors);
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const { email, password, full_name, school_id } = parsed.data;

  const { data: schoolData, error: schoolError } = await supabaseAdmin
    .from("schools")
    .select("id")
    .eq("id", school_id)
    .single();

  if (schoolError || !schoolData) {
    console.error("School Error:", schoolError?.message || "School not found");
    return NextResponse.json({ error: "School not found" }, { status: 400 });
  }

  const { data: signupData, error: signupError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, roles: ["admin"], school_id },
      app_metadata: { roles: ["admin"], school_id },
    });

  if (signupError || !signupData.user) {
    console.error(
      "Signup Error:",
      signupError?.message || "Failed to create admin"
    );
    return NextResponse.json(
      { error: signupError?.message || "Failed to create admin" },
      { status: 400 }
    );
  }

  console.log("Admin Created:", signupData.user.id, signupData.user.email);
  return NextResponse.json(
    { message: "Admin created successfully" },
    { status: 201 }
  );
}
