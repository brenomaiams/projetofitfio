import React, { useState } from "react";
import fitfio from "../../assets/fitfio.png";
import { useNavigate } from "react-router-dom";

export default function LoginFitFIO() {
  const navigate = useNavigate();

  const [ra, setRa] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  function validar() {
    if (!ra.trim() || !senha) {
      return "Preencha RA e Senha.";
    }
    if (!/^\d{5,12}$/.test(ra.trim())) {
      return "RA deve conter apenas números (5 a 12 dígitos).";
    }
    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErro("");
    const msg = validar();
    if (msg) {
      setErro(msg);
      return;
    }
    try {
      setLoading(true);
      const resp = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ra, senha }),
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        console.log("Usuário logado:", data.nome);
         localStorage.setItem("nomeUsuario", data.nome);
         localStorage.setItem("raUsuario", ra); 
        navigate("/agendamento"); 
      } else {
        setErro(data.error || "Falha na autenticação");
      }
    } catch (e) {
      setErro("Erro de conexão com servidor");
    } finally {
      setLoading(false);
    }
  }

  
  return (
    <div style={styles.page}>
      <style>{css}</style>

      <img src={fitfio} alt="Logo FitFIO" className="logo float" />

      <form onSubmit={onSubmit} className="form">
        <div className="field">
          <input
            id="ra"
            className="input"
            placeholder="RA"
            value={ra}
            onChange={(e) => setRa(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="field">
          <input
            id="senha"
            type={mostrarSenha ? "text" : "password"}
            className="input"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="toggle"
            onClick={() => setMostrarSenha((s) => !s)}
          >
            {mostrarSenha ? "🙈" : "👁️"}
          </button>
        </div>

        {erro && <div className="error">{erro}</div>}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Aguarde…" : "Acessar"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, #ffffff, #f5f5f5)",
    padding: "16px",
  },
};

const css = `
  body { margin: 0; font-family: "Segoe UI", Roboto, sans-serif; }
  .logo { width: 150px; margin-bottom: 40px; }
  
  /* Animação de flutuação */
  .float {
    animation: float 3s ease-in-out infinite;
  }
  @keyframes float {
    0%   { transform: translateY(0px); }
    50%  { transform: translateY(-12px); }
    100% { transform: translateY(0px); }
  }

  .form { width: 100%; max-width: 320px; display: grid; gap: 25px; }
  .field { position: relative; }
  
  .input {
    width: 100%;
    padding: 12px 8px;
    border: none;
    border-bottom: 2px solid #ccc;
    font-size: 15px;
    background: transparent;
    outline: none;
    transition: border-color 0.3s;
  }
  .input:focus {
    border-bottom-color: #2563eb;
  }

  .toggle {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
  }

  .btn {
    padding: 14px;
    border-radius: 25px;
    background: #2563eb;
    border: none;
    color: #fff;
    font-weight: bold;
    cursor: pointer;
    font-size: 16px;
    transition: background 0.3s;
  }
  .btn:hover {
    background: #1e4ecf;
  }
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error { text-align: center; color: #e63946; font-size: 14px; }
`;
