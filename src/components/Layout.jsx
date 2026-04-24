import { NavLink } from "react-router-dom";

function Layout({ children, role, setRole }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-6">
            <div className="font-bold text-xl text-blue-500">FieldOps IQ</div>

            <div className="flex flex-wrap gap-4 text-sm">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? "text-white font-semibold"
                    : "text-slate-400 hover:text-white transition-colors"
                }
              >
                Login
              </NavLink>

              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive
                    ? "text-white font-semibold"
                    : "text-slate-400 hover:text-white transition-colors"
                }
              >
                Dashboard
              </NavLink>

              {/* Only show New Job to Techs */}
              {role === "tech" && (
                <NavLink
                  to="/jobs/new"
                  className={({ isActive }) =>
                    isActive
                      ? "text-white font-semibold"
                      : "text-slate-400 hover:text-white transition-colors"
                  }
                >
                  New Job
                </NavLink>
              )}

              {/* Only show Analytics to Managers */}
              {role === "manager" && (
                <NavLink
                  to="/analytics"
                  className={({ isActive }) =>
                    isActive
                      ? "text-white font-semibold"
                      : "text-slate-400 hover:text-white transition-colors"
                  }
                >
                  Analytics
                </NavLink>
              )}
            </div>
          </div>

          {/* Role Switcher Widget for MVP Testing */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Role:</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="manager">Manager</option>
                <option value="tech">Tech</option>
              </select>
            </div>
            {/* New UX Subtext */}
            <p className="text-xs text-slate-400 mt-1">
              {role === "manager"
                ? "Full visibility + analytics"
                : "Field technician workflow"}
            </p>
          </div>

        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-6xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
}

export default Layout;