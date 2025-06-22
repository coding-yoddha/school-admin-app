import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "School name is required"),
});

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    console.error("Missing or invalid Authorization header");
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }

  const token = authHeader.replace("Bearer ", "");

  // Validate user with supabaseAdmin
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

  console.log("Authenticated User:", user.id, user.user_metadata); // Debug

  const { user_metadata } = user;
  if (!user_metadata?.roles?.includes("super_admin")) {
    console.error("User is not super_admin:", user_metadata?.roles);
    return NextResponse.json(
      { error: "Forbidden: Not a super admin" },
      { status: 403 }
    );
  }

  const body = await request.json();

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error("Validation Errors:", parsed.error.errors);
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const { name } = parsed.data;

  const { data: schoolData, error: schoolError } = await supabaseAdmin
    .from("schools")
    .insert({ name })
    .select("id, name")
    .single();

  if (schoolError) {
    console.error("School Insert Error:", schoolError.message);
    return NextResponse.json({ error: schoolError.message }, { status: 400 });
  }

  console.log("School Created:", schoolData);
  return NextResponse.json(
    { message: "School created successfully", school: schoolData },
    { status: 201 }
  );
}
