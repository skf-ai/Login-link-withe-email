import { useEffect, useState } from "react";

function App() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);

  // read ?email= from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("email");
    if (raw) {
      // browser already decodes but let's be safe
      const decoded = decodeURIComponent(raw);
      setEmail(decoded);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Login failed");
      const data = await res.json();
      setStatus(`logged-in-as-${data.email}`);
    } catch (err) {
      console.log(err);
      
      setStatus("error");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "white", borderRadius: "1rem", padding: "2rem", width: "100%", maxWidth: "420px", boxShadow: "0 12px 30px rgba(15,23,42,.12)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>Sign in</h1>
        <p style={{ marginBottom: "1.25rem", color: "#475569" }}>Enter your email to continue.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 500 }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "0.6rem 0.75rem",
              border: "1px solid #cbd5f5".replace("f5","f5"), // just border
              borderRadius: "0.5rem",
              marginBottom: "1rem",
            }}
          />
          <button
            type="submit"
            disabled={!email || status === "loading"}
            style={{
              width: "100%",
              background: "#0f172a",
              color: "white",
              padding: "0.6rem 0.75rem",
              borderRadius: "0.5rem",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {status === "loading" ? "Signing in..." : "Continue"}
          </button>
        </form>
        {status === "error" && (
          <p style={{ color: "red", marginTop: "0.75rem" }}>Login failed.</p>
        )}
        {status && status.startsWith("logged-in") && (
          <p style={{ color: "green", marginTop: "0.75rem" }}>Success ✅</p>
        )}
      </div>
    </div>
  );
}

export default App;
