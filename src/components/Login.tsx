// "use client";
// import { useState } from "react";
// import { supabase } from "../supabase-client";
// import { useRouter } from "next/navigation";

// export default function LoginPage() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const router = useRouter();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError("");
//     const { error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });
//     if (error) {
//       setError(error.message);
//     } else {
//       router.push("/"); // Redirect to home page
//     }
//   };

//   const handleSignUp = async (e) => {
//     e.preventDefault();
//     setError("");
//     const { error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: {
//           role: "super_admin",
//         },
//       },
//     });
//     if (error) {
//       setError(error.message);
//     } else {
//       setError("Signup successful! Please check your email to confirm.");
//     }
//   };

//   return (
//     <div
//       style={{
//         maxWidth: 350,
//         margin: "100px auto",
//         padding: 32,
//         border: "1px solid #eaeaea",
//         borderRadius: 10,
//         boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
//         background: "#fff",
//         color: "#000000",
//       }}
//     >
//       <h2 style={{ textAlign: "center", marginBottom: 24 }}>Login</h2>
//       <form onSubmit={handleLogin}>
//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//           style={{
//             width: "100%",
//             padding: 10,
//             marginBottom: 16,
//             borderRadius: 5,
//             border: "1px solid #ccc",
//             fontSize: 16,
//           }}
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//           style={{
//             width: "100%",
//             padding: 10,
//             marginBottom: 16,
//             borderRadius: 5,
//             border: "1px solid #ccc",
//             fontSize: 16,
//           }}
//         />
//         <div style={{ display: "flex", justifyContent: "space-between" }}>
//           <button
//             type="submit"
//             style={{
//               flex: 1,
//               padding: 10,
//               borderRadius: 5,
//               border: "none",
//               background: "#0070f3",
//               color: "#fff",
//               fontWeight: "bold",
//               cursor: "pointer",
//               marginRight: 8,
//             }}
//           >
//             Log In
//           </button>
//           <button
//             type="button"
//             onClick={handleSignUp}
//             style={{
//               flex: 1,
//               padding: 10,
//               borderRadius: 5,
//               border: "none",
//               background: "#eaeaea",
//               color: "#333",
//               fontWeight: "bold",
//               cursor: "pointer",
//               marginLeft: 8,
//             }}
//           >
//             Sign Up
//           </button>
//         </div>
//         {error && (
//           <p style={{ color: "red", marginTop: 16, textAlign: "center" }}>
//             {error}
//           </p>
//         )}
//       </form>
//     </div>
//   );
// }
