"use client";

import { useState } from "react";
import { Subject } from "../types";
import { supabase } from "@/lib/supabase-client";

interface CreateTeacherFormProps {
  subjects: Subject[];
  onTeacherCreated: () => void;
}

export default function CreateTeacherForm({
  subjects,
  onTeacherCreated,
}: CreateTeacherFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("Client-side user:", user?.email);
    console.log("Client-side session:", !!session);

    const response = await fetch("/api/create-teacher", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ email, password, subjectId, full_name: fullName }),
    });

    const result = await response.json();
    if (result.error) {
      setError(result.error);
    } else {
      setEmail("");
      setPassword("");
      setFullName("");
      setSubjectId("");
      onTeacherCreated();
    }
  };

  return (
    <div
      className="bg-white p-6 rounded shadow-md mb-6"
      style={{ color: "black" }}
    >
      <h2 className="text-xl font-bold mb-4">Create Teacher</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 p-2 w-full border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 p-2 w-full border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 p-2 w-full border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium">
            Subject
          </label>
          <select
            id="subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="mt-1 p-2 w-full border rounded"
            required
          >
            <option value="">Select a subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Create Teacher
        </button>
      </form>
    </div>
  );
}
