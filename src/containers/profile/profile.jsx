import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  if (!usuario) return <p>Carregando...</p>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Perfil do Usuário</h1>
        <div style={styles.info}>
          <p><strong>Nome:</strong> {usuario.nome}</p>
          <p><strong>RA:</strong> {usuario.ra}</p>
          <p><strong>Curso:</strong> {usuario.curso}</p>
          <p><strong>Semestre:</strong> {usuario.semestre}</p>
        </div>
        <button style={styles.btn} onClick={() => navigate("/agendamento")}>
          Voltar
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(180deg, #f0f4f8, #d9e2ec)",
    padding: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "15px",
    padding: "30px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
  },
  info: {
    textAlign: "left",
    marginTop: "20px",
    marginBottom: "30px",
    lineHeight: "1.8",
    fontSize: "16px",
  },
  btn: {
    padding: "12px 25px",
    borderRadius: "25px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background 0.3s",
  },
};
