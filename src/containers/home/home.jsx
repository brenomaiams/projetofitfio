import React, { useState, useEffect } from "react";
import "./Agendamento.css";
import { useNavigate } from "react-router-dom";

export default function Agendamento() {
  const [nome, setNome] = useState("");
  const [ra, setRa] = useState("");
  const [selecionado, setSelecionado] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [todosAgendamentos, setTodosAgendamentos] = useState([]);
  const navigate = useNavigate();

  const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
  const horarios = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);

  useEffect(() => {
    const nomeSalvo = localStorage.getItem("nomeUsuario");
    const raSalvo = localStorage.getItem("raUsuario");
    if (nomeSalvo) setNome(nomeSalvo.split(" ")[0]);
    if (raSalvo) {
      setRa(raSalvo);
      fetch(`http://localhost:5000/agendamentos/${raSalvo}`)
        .then(res => res.json())
        .then(data => { if (data.success && data.agendamento) setConfirmado(data.agendamento); });
    }

    fetch("http://localhost:5000/agendamentos")
      .then(res => res.json())
      .then(data => { if (data.success) setTodosAgendamentos(data.agendamentos); });
  }, []);

  function handleLogout() {
    localStorage.removeItem("nomeUsuario");
    localStorage.removeItem("raUsuario");
    navigate("/");
  }

  async function confirmarAgendamento() {
    if (!selecionado) return;

    try {
      const res = await fetch("http://localhost:5000/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ra, dia: selecionado.dia, hora: selecionado.hora }),
      });

      const data = await res.json();
      if (data.success) {
        setConfirmado(selecionado);
        setSelecionado(null);
        setTodosAgendamentos([...todosAgendamentos, { ra, dia: confirmado?.dia, hora: confirmado?.hora }]);
      } else alert(data.error);
    } catch (err) { console.error(err); }
  }

  async function cancelarAgendamento() {
    if (!confirmado) return;

    try {
      const res = await fetch("http://localhost:5000/agendamentos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ra, dia: confirmado.dia, hora: confirmado.hora }),
      });

      const data = await res.json();
      if (data.success) {
        setConfirmado(null);
        setTodosAgendamentos(todosAgendamentos.filter(a => !(a.ra === ra)));
      } else alert(data.error);
    } catch (err) { console.error(err); }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <h1>Agendamento de Horário</h1>
          <div className="botoes">
            <button className="sobre" onClick={() => navigate("/perfil")}>Perfil</button>
            <button className="sobre" onClick={handleLogout}>Sair</button>
          </div>
        </div>

        <div className="content">
          <div className="formulario">
            <h2>Escolha um dia e horário</h2>
            <div className="grade-dias">
              {diasSemana.map(dia => (
                <div key={dia} className="dia-coluna">
                  <h3>{dia}</h3>
                  {horarios.map(hora => {
                    const isSelecionado = selecionado?.dia === dia && selecionado?.hora === hora;
                    const ocupado = todosAgendamentos.some(a => a.dia === dia && a.hora === hora);
                    const desabilitado = confirmado ? true : ocupado;
                    return (
                      <button
                        key={hora}
                        disabled={desabilitado}
                        className={`hora-btn ${desabilitado ? "ocupado" : "disponivel"} ${isSelecionado ? "selecionado" : ""}`}
                        onClick={() => setSelecionado({ dia, hora })}
                      >
                        {hora}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {selecionado && (
              <div className="resumo">
                <p>Você selecionou: <strong>{selecionado.dia} - {selecionado.hora}</strong></p>
                <button className="confirmar" onClick={confirmarAgendamento}>Confirmar Agendamento</button>
              </div>
            )}
          </div>

          <div className="mensagem">
            <div className="icone">🏋️</div>
            <h2>Bem-vindo{nome ? `, ${nome}` : "!"}</h2>
            <p>Use este sistema para agendar o uso da academia da faculdade</p>

            {confirmado && (
              <div className="aviso">
                <p>✅ Agendamento confirmado para <strong>{confirmado.dia} - {confirmado.hora}</strong></p>
                <button className="cancelar" onClick={cancelarAgendamento}>Cancelar Agendamento</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
