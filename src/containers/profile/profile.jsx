import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Perfil.css";

export default function Perfil() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const raUsuario = localStorage.getItem("raUsuario");

  useEffect(() => {
    if (!raUsuario) return;

    fetch(`http://localhost:5000/perfil/${raUsuario}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsuario(data.usuario);
        } else {
          alert(data.error);
        }
      })
      .catch(() => alert("Erro de conexão com servidor"));
  }, [raUsuario]);

  if (!usuario) return <p style={{ textAlign: "center" }}>Carregando...</p>;

  return (
    <div className="perfil-container">
      <div className="perfil-card">
        {/* Header */}
        <div className="perfil-header">
          <h1>Perfil do Usuário</h1>
          <button className="btn-voltar" onClick={() => navigate("/agendamento")}>
            Voltar
          </button>
        </div>

        {/* Dados */}
        <div className="perfil-info">
          <p><strong>Nome:</strong> {usuario.nome}</p>
          <p><strong>RA:</strong> {usuario.ra}</p>
          <p><strong>Curso:</strong> {usuario.curso}</p>
          <p><strong>Semestre:</strong> {usuario.semestre}</p>
        </div>
      </div>
    </div>
  );
}
