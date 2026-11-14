import { Link, Route, Routes } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { RepoPage } from "./pages/RepoPage";
import { ReportPage } from "./pages/ReportPage";

export default function App() {
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">♻ AI Trash-Loop</Link>
        <span className="muted">context health analyzer</span>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/repos/:id" element={<RepoPage />} />
          <Route path="/analyses/:id" element={<ReportPage />} />
          <Route path="*" element={<p className="muted">Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
