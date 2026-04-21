import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>404 - Page Not Found</h1>
        <p style={{ marginBottom: "16px" }}>
          Jo page aap dhoondh rahe ho woh available nahi hai.
        </p>
        <Link href="/">Back to Home</Link>
      </div>
    </main>
  );
}
