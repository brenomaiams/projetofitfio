import React, { useState, useEffect } from "react";
import "./Agendamento.css";
import { useNavigate } from "react-router-dom";
import treinosPorGrupo from "./treinos/treinos";

export default function Agendamento() {
  const [nome, setNome] = useState("");
  const [ra, setRa] = useState("");
  const [selecionado, setSelecionado] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [todosAgendamentos, setTodosAgendamentos] = useState([]);
  const [ocupacaoPorSlot, setOcupacaoPorSlot] = useState({});

  const [showTreinoModal, setShowTreinoModal] = useState(false);
  const [grupoSelecionado, setGrupoSelecionado] = useState("");
  const [treinoGerado, setTreinoGerado] = useState(null);

  const [showOpcoesModal, setShowOpcoesModal] = useState(false);
  const [pessoasNoHorario, setPessoasNoHorario] = useState([]);
  const [carregandoPessoas, setCarregandoPessoas] = useState(false);

  const navigate = useNavigate();

  const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
  const horarios = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);

  // ========================= UTILIDADES =========================
  function normalizarGrupo(g) {
    if (!g) return "";
    const s = g.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    if (["bracos","costas","pernas","peito","ombros","triceps","gluteos"].includes(s))
      return s === "bracos" ? "braços" : s === "triceps" ? "tríceps" : s === "gluteos" ? "glúteos" : s;
    const direto = ["braços","costas","pernas","peito","ombros","tríceps","glúteos"];
    if (direto.includes(g.toLowerCase())) return g.toLowerCase();
    return "";
  }

  const opcoesTreino = ["braços","costas","pernas","peito","ombros","tríceps","glúteos"];

  function lotacaoDoSlot(dia, hora) {
    return ocupacaoPorSlot[`${dia}_${hora}`] || 0;
  }

  // ========================= CARREGAR OCUPAÇÃO =========================
  async function atualizarOcupacaoSlot(dia, hora) {
    try {
      const res = await fetch(`http://localhost:5000/agendamentos/${dia}/${hora}`);
      const data = await res.json();
      if (data.success) setOcupacaoPorSlot(prev => ({ ...prev, [`${dia}_${hora}`]: data.ocupacao || 0 }));
    } catch (err) {
      console.error(err);
    }
  }

  async function atualizarOcupacaoTodosSlots() {
    for (let dia of diasSemana) {
      for (let hora of horarios) {
        await atualizarOcupacaoSlot(dia, hora);
      }
    }
  }

  async function carregarPessoasDoHorario(diaParam, horaParam) {
    const dia = diaParam || selecionado?.dia;
    const hora = horaParam || selecionado?.hora;
    if (!dia || !hora) return;

    setCarregandoPessoas(true);
    try {
      const res = await fetch(`http://localhost:5000/agendamentos/${dia}/${hora}`);
      const data = await res.json();
      if (data.success) setPessoasNoHorario(data.pessoas || []);
      else setPessoasNoHorario([]);
    } catch (err) {
      console.error(err);
      setPessoasNoHorario([]);
    } finally {
      setCarregandoPessoas(false);
    }
  }

  // ========================= USE EFFECT =========================
  useEffect(() => {
    const nomeSalvo = localStorage.getItem("nomeUsuario");
    const raSalvo = localStorage.getItem("raUsuario");
    if (nomeSalvo) setNome(nomeSalvo.split(" ")[0]);
    if (raSalvo) {
      setRa(raSalvo);
      fetch(`http://localhost:5000/agendamentos/${raSalvo}`)
        .then(res => res.json())
        .then(data => { if (data.success && data.agendamento) setConfirmado(data.agendamento); });

      const treinoLocal = localStorage.getItem(`treinoGerado_${raSalvo}`);
      if (treinoLocal) {
        try { setTreinoGerado(JSON.parse(treinoLocal)); } catch {}
      }
    }

    atualizarOcupacaoTodosSlots();
  }, []);

  // ========================= AGENDAMENTO =========================
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
        setShowOpcoesModal(false);
        setTodosAgendamentos(prev => [...prev, { ra, dia: selecionado.dia, hora: selecionado.hora }]);
        await atualizarOcupacaoSlot(selecionado.dia, selecionado.hora);
      } else alert(data.error);
    } catch (err) { console.error(err); }
  }

  async function cancelarAgendamento() {
    if (!confirmado) return;
    try {
      const res = await fetch("http://localhost:5000/agendamentos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ra }),
      });
      const data = await res.json();
      if (data.success) {
        // Atualiza ocupação do slot do agendamento cancelado
        await atualizarOcupacaoSlot(confirmado.dia, confirmado.hora);
        setConfirmado(null);
        setTodosAgendamentos(prev => prev.filter(a => a.ra !== ra));
      } else alert(data.error);
    } catch (err) { console.error(err); }
  }

  // ========================= MODAIS =========================
  function abrirTreinoModal() { setGrupoSelecionado(""); setShowTreinoModal(true); }
  function fecharTreinoModal() { setShowTreinoModal(false); }
  function abrirOpcoes(dia, hora) { setSelecionado({ dia, hora }); setPessoasNoHorario([]); setShowOpcoesModal(true); carregarPessoasDoHorario(dia, hora); }

  function gerarTreino() {
    const chave = normalizarGrupo(grupoSelecionado);
    if (!chave || !treinosPorGrupo[chave]) return;
    const plano = { grupo: grupoSelecionado, itens: treinosPorGrupo[chave] };
    setTreinoGerado(plano);
    if (ra) localStorage.setItem(`treinoGerado_${ra}`, JSON.stringify(plano));
  }

  function handleLogout() {
    localStorage.removeItem("nomeUsuario");
    localStorage.removeItem("raUsuario");
    navigate("/");
  }

  // ========================= RENDER =========================
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
                    const desabilitado = confirmado ? true : lotacaoDoSlot(dia, hora) >= 10;
                    return (
                      <button
                        key={hora}
                        disabled={desabilitado}
                        className={`hora-btn ${desabilitado ? "ocupado" : "disponivel"} ${isSelecionado ? "selecionado" : ""}`}
                        onClick={() => abrirOpcoes(dia, hora)}
                        title={`${lotacaoDoSlot(dia, hora)}/10 agendados`}
                      >
                        {hora} <span className="badge-ocupacao">{lotacaoDoSlot(dia, hora)}/10</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
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
                <ul>{treinoGerado.itens.map((t, idx) => <li key={idx}><strong>{t.exercicio}</strong> — {t.series}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de opções */}
      {showOpcoesModal && selecionado && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowOpcoesModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selecionado.dia} — {selecionado.hora}</h3>
              <button className="modal-close" onClick={() => setShowOpcoesModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="acao-grid">
                <button className="confirmar" onClick={confirmarAgendamento} disabled={lotacaoDoSlot(selecionado.dia, selecionado.hora) >= 10 || !!confirmado}>Agendar</button>
                <button className="sobre" onClick={() => carregarPessoasDoHorario()}>Ver agendamentos</button>
              </div>
              <p className="ocupacao-info">Ocupação: <strong>{lotacaoDoSlot(selecionado.dia, selecionado.hora)}/10</strong></p>
              <div className="treino-preview">
                {carregandoPessoas && <p>Carregando...</p>}
                {!carregandoPessoas && pessoasNoHorario.length > 0 && (
                  <>
                    <h4>Já agendados:</h4>
                    <ul>{pessoasNoHorario.map((p, i) => <li key={i}><strong>{p.nome}</strong> ({p.ra})</li>)}</ul>
                  </>
                )}
                {!carregandoPessoas && pessoasNoHorario.length === 0 && <p>Nenhum agendamento neste horário ainda.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Treino */}
      {showTreinoModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={fecharTreinoModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Gerar treino</h3>
              <button className="modal-close" onClick={fecharTreinoModal}>×</button>
            </div>
            <div className="modal-body">
              <p>Selecione o grupo muscular:</p>
              <div className="opcoes-treino">
                {opcoesTreino.map(opt => (
                  <button key={opt} className={`opcao-btn ${grupoSelecionado === opt ? "opcao-selecionada" : ""}`} onClick={() => setGrupoSelecionado(opt)}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
              <button className="confirmar" disabled={!grupoSelecionado} onClick={gerarTreino}>Gerar treino</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
