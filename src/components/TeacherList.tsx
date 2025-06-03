import { Teacher } from "../types";

interface TeacherListProps {
  teachers: Teacher[];
}

export default function TeacherList({ teachers }: TeacherListProps) {
  return (
    <div
      className="bg-white p-6 rounded shadow-md mt-6"
      style={{ color: "black" }}
    >
      <h2 className="text-xl font-bold mb-4">Teachers</h2>
      {teachers.length === 0 ? (
        <p>No teachers found.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Name</th>
              <th className="border p-2">Subject</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="hover:bg-gray-100">
                <td className="border p-2">{teacher.full_name}</td>
                <td className="border p-2">{teacher.subject_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
