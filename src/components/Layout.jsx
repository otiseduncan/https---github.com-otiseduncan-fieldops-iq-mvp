import { NavLink } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function Layout({ children, role, setRole }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="font-bold text-xl">FieldOps IQ</div>

            <div className="flex flex-wrap gap-3 text-sm">
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? "text-white font-semibold" : "text-slate-300 hover:text-white"}>
                Dashboard
              </NavLink>

              {role === "tech" && (
                <NavLink to="/jobs/new" className={({ isActive }) => isActive ? "text-white font-semibold" : "text-slate-300 hover:text-white"}>
                  New Job
                </NavLink>
              )}

              {role === "manager" && (
                <NavLink to="/analytics" className={({ isActive }) => isActive ? "text-white font-semibold" : "text-slate-300 hover:text-white"}>
                  Analytics
                </NavLink>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white"
            >
              <option value="manager">Manager</option>
              <option value="tech">Tech</option>
            </select>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}

export default Layout;