import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username,
          password,
        }),
      });

      if (!res.ok) {
        setError("Usuário ou senha inválidos");
        return;
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const expiresAt = nowInSeconds + 60 * 60; 
      localStorage.setItem("token_exp", expiresAt.toString());
      
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Erro ao conectar à API");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <form
        onSubmit={handleLogin}
        className="bg-gray-800 p-6 rounded-lg shadow-md w-96"
      >
        <h1 className="text-2xl font-bold mb-4 text-center text-white">Login</h1>
        {error && <p className="text-red-400 mb-2">{error}</p>}

        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-gray-700 text-white"
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-gray-700 text-white"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 p-2 rounded text-white font-bold"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}