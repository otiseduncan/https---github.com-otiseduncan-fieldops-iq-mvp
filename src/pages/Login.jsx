import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("Signing in...");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("");
    navigate("/dashboard");
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Login</h1>
      <p className="text-slate-400 mb-6">Sign in to FieldOps IQ</p>

      <div className="max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <form onSubmit={handleLogin} className="grid gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-slate-500"
            />
          </div>

          {message && <p className="text-sm text-slate-300">{message}</p>}

          <button
            type="submit"
            className="rounded-xl bg-blue-600 hover:bg-blue-500 transition px-4 py-3 font-semibold"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;