import React, { useState, useEffect  } from "react";
import "./Agendamento.css";
import { useNavigate } from "react-router-dom"; 




export default function Agendamento() {
  const [nome, setNome] = useState("");
  const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
  const horarios = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);
    const navigate = useNavigate(); 


  const indisponiveis = {
    Segunda: ["10:00", "15:00"],
    Terça: ["09:00", "11:00", "14:00"],
    Quarta: [],
    Quinta: ["13:00", "17:00"],
    Sexta: ["08:00", "16:00"],
  };

  useEffect(() => {
    const nomeSalvo = localStorage.getItem("nomeUsuario");
    if (nomeSalvo) {
      setNome(nomeSalvo.split(" ")[0])
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("nomeUsuario");     
    navigate("/"); 
  }

  const [selecionado, setSelecionado] = useState(null);

  return (
    <div className="container">
      <div className="card">
        {/* Header */}
        <div className="header">
          <h1>Agendamento de Horário</h1>
          <button className="sobre" onClick={() => navigate("/perfil")}>Perfil</button>
          <button className="sobre" onClick={handleLogout}>Sair</button>
          
        </div>

        {/* Conteúdo */}
        <div className="content">
          {/* Painel de agendamento */}
          <div className="formulario">
            <h2>Escolha um dia e horário</h2>
            <div className="grade-dias">
              {diasSemana.map((dia) => (
                <div key={dia} className="dia-coluna">
                  <h3>{dia}</h3>
                  {horarios.map((hora) => {
                    const ocupado = indisponiveis[dia]?.includes(hora);
                    const isSelecionado = selecionado?.dia === dia && selecionado?.hora === hora;

                    return (
                      <button
                        key={hora}
                        disabled={ocupado}
                        className={`hora-btn 
                          ${ocupado ? "ocupado" : "disponivel"} 
                          ${isSelecionado ? "selecionado" : ""}`}
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
                <p>
                  Você selecionou: <strong>{selecionado.dia} - {selecionado.hora}</strong>
                </p>
                <button className="confirmar">Confirmar Agendamento</button>
              </div>
            )}
          </div>

          {/* Mensagem lateral */}
          <div className="mensagem">
            <div className="icone">🏋️</div>
            <h2>Bem-vindo{nome ? `, ${nome}` : "!"}</h2>
            <p>Use este sistema para agendar o uso da academia da faculdade</p>
          </div>
        </div>
      </div>
    </div>
  );
}
