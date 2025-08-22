import React, { useState, useEffect } from "react";
import "./Agendamento.css";
import { useNavigate } from "react-router-dom";

// importa os treinos do arquivo separado
import treinosPorGrupo from "./treinos/treinos";

export default function Agendamento() {
  const [nome, setNome] = useState("");
  const [ra, setRa] = useState("");
  const [selecionado, setSelecionado] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [todosAgendamentos, setTodosAgendamentos] = useState([]);

  // estados do popup de treino
  const [showTreinoModal, setShowTreinoModal] = useState(false);
  const [grupoSelecionado, setGrupoSelecionado] = useState("");
  const [treinoGerado, setTreinoGerado] = useState(null);

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
        .then(data => {
          if (data.success && data.agendamento) setConfirmado(data.agendamento);
        });
  
      // 🔑 carrega o treino do usuário específico
      const treinoLocal = localStorage.getItem(`treinoGerado_${raSalvo}`);
      if (treinoLocal) {
        try { setTreinoGerado(JSON.parse(treinoLocal)); } catch {}
      }
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
        setTodosAgendamentos([...todosAgendamentos, { ra, dia: selecionado.dia, hora: selecionado.hora }]);
      } else {
        alert(data.error);
      }
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
      } else {
        alert(data.error);
      }
    } catch (err) { console.error(err); }
  }

  // --- lógica do popup de treino ---
  function abrirTreinoModal() {
    setGrupoSelecionado("");
    setShowTreinoModal(true);
  }

  function fecharTreinoModal() {
    setShowTreinoModal(false);
  }

  function gerarTreino() {
    const chave = normalizarGrupo(grupoSelecionado);
    if (!chave || !treinosPorGrupo[chave]) return;
  
    const plano = {
      grupo: grupoSelecionado,
      itens: treinosPorGrupo[chave],
    };
    setTreinoGerado(plano);
  
    // salva o treino separado por RA
    if (ra) {
      localStorage.setItem(`treinoGerado_${ra}`, JSON.stringify(plano));
    }
  }
  

  function normalizarGrupo(g) {
    if (!g) return "";
    const s = g
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
    if (["bracos","costas","pernas","peito","ombros","triceps","gluteos"].includes(s))
      return s === "bracos" ? "braços" : s === "triceps" ? "tríceps" : s === "gluteos" ? "glúteos" : s;
    const direto = ["braços","costas","pernas","peito","ombros","tríceps","glúteos"];
    if (direto.includes(g.toLowerCase())) return g.toLowerCase();
    return "";
  }

  const opcoesTreino = ["braços","costas","pernas","peito","ombros","tríceps","glúteos"];

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <h1>Agendamento de Horário</h1>
          <div className="botoes">
            <button className="sobre" onClick={() => navigate("/perfil")}>Perfil</button>
            <button className="sobre" onClick={abrirTreinoModal}>Treino</button>
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

            {treinoGerado && (
              <div className="treino-card">
                <h3>Seu treino de <span className="badge">{treinoGerado.grupo}</span></h3>
                <ul>
                  {treinoGerado.itens.map((t, idx) => (
                    <li key={idx}><strong>{t.exercicio}</strong> — {t.series}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Treino */}
      {showTreinoModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={fecharTreinoModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Gerar treino</h3>
              <button className="modal-close" onClick={fecharTreinoModal} aria-label="Fechar">×</button>
            </div>

            <div className="modal-body">
              <p>Selecione o grupo muscular:</p>
              <div className="opcoes-treino">
                {opcoesTreino.map((opt) => (
                  <button
                    key={opt}
                    className={`opcao-btn ${grupoSelecionado === opt ? "opcao-selecionada" : ""}`}
                    onClick={() => setGrupoSelecionado(opt)}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>

              <button
                className="confirmar"
                disabled={!grupoSelecionado}
                onClick={gerarTreino}
              >
                Gerar treino
              </button>

              {treinoGerado && grupoSelecionado && normalizarGrupo(grupoSelecionado) === normalizarGrupo(treinoGerado.grupo) && (
                <div className="treino-preview">
                  <h4>Treino gerado: {treinoGerado.grupo}</h4>
                  <ul>
                    {treinoGerado.itens.map((t, i) => (
                      <li key={i}><strong>{t.exercicio}</strong> — {t.series}</li>
                    ))}
                  </ul>
                  <p className="obs">Dica: aqueça por 5–10 min e ajuste a carga para terminar cada série perto da falha técnica.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="fechar" onClick={fecharTreinoModal}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
