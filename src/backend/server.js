import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
app.use(cors());
app.use(express.json());

const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456789",
  database: "fitfio"
});

// ======================= LOGIN =======================
app.post("/login", async (req, res) => {
  const { ra, senha } = req.body;
  if (!ra || !senha) return res.status(400).json({ error: "Preencha RA e Senha." });

  try {
    const [rows] = await db.query("SELECT * FROM usuarios WHERE ra = ? AND senha = ?", [ra, senha]);
    if (rows.length > 0) return res.json({ success: true, nome: rows[0].nome });
    else return res.status(401).json({ success: false, error: "RA ou Senha inválidos." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor." });
  }
});

// ======================= PERFIL =======================
app.get("/perfil/:ra", async (req, res) => {
  const { ra } = req.params;
  try {
    const [rows] = await db.query("SELECT nome, ra, curso, semestre FROM usuarios WHERE ra = ?", [ra]);
    if (rows.length > 0) return res.json({ success: true, usuario: rows[0] });
    else return res.status(404).json({ success: false, error: "Usuário não encontrado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor." });
  }
});

// ======================= AGENDAMENTOS =======================

// Listar todos os agendamentos
app.get("/agendamentos", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT ra, dia, hora FROM agendamentos");
    res.json({ success: true, agendamentos: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agendamentos." });
  }
});

// Buscar agendamento de um usuário
app.get("/agendamentos/:ra", async (req, res) => {
  const { ra } = req.params;
  try {
    const [rows] = await db.query("SELECT dia, hora FROM agendamentos WHERE ra = ?", [ra]);
    if (rows.length > 0) return res.json({ success: true, agendamento: rows[0] });
    else return res.json({ success: true, agendamento: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agendamento." });
  }
});

// Buscar agendamentos de um horário específico (quantidade + lista de usuários)
app.get("/agendamentos/:dia/:hora", async (req, res) => {
  const { dia, hora } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT u.nome, a.ra
       FROM agendamentos a
       JOIN usuarios u ON u.ra = a.ra
       WHERE a.dia = ? AND a.hora = ?
       ORDER BY u.nome ASC`,
      [dia, hora]
    );

    const ocupacao = rows.length; // número de pessoas agendadas
    res.json({ success: true, pessoas: rows, ocupacao });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agendamentos do horário." });
  }
});

// Criar agendamento (máximo 10 pessoas por horário)
app.post("/agendamentos", async (req, res) => {
  const { ra, dia, hora } = req.body;
  if (!ra || !dia || !hora) return res.status(400).json({ error: "Preencha RA, dia e hora." });

  try {
    // Verifica se o usuário já tem um agendamento
    const [usuarioAgendamento] = await db.query("SELECT * FROM agendamentos WHERE ra = ?", [ra]);
    if (usuarioAgendamento.length > 0) return res.status(400).json({ error: "Você já possui um agendamento." });

    // Limite de 10 pessoas por horário
    const [horarioOcupado] = await db.query("SELECT COUNT(*) AS qtd FROM agendamentos WHERE dia = ? AND hora = ?", [dia, hora]);
    if (horarioOcupado[0].qtd >= 10) return res.status(400).json({ error: "Limite de 10 pessoas atingido para este horário." });

    // Inserir agendamento
    await db.query("INSERT INTO agendamentos (ra, dia, hora) VALUES (?, ?, ?)", [ra, dia, hora]);
    
    // Retorna a lista atualizada do horário
    const [listaAtualizada] = await db.query(
      `SELECT u.nome, a.ra
       FROM agendamentos a
       JOIN usuarios u ON u.ra = a.ra
       WHERE a.dia = ? AND a.hora = ?
       ORDER BY u.nome ASC`,
      [dia, hora]
    );

    // Log da ocupação após o agendamento
    console.log(`Ocupação após agendamento: ${listaAtualizada.length}`);

    res.json({ success: true, message: "Agendamento realizado!", agendamento: { ra, dia, hora }, pessoas: listaAtualizada });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao salvar agendamento." });
  }
});

// Cancelar agendamento
app.delete("/agendamentos", async (req, res) => {
  const { ra } = req.body;
  if (!ra) return res.status(400).json({ error: "Informe RA." });

  try {
    const [result] = await db.query("DELETE FROM agendamentos WHERE ra = ?", [ra]);
    if (result.affectedRows > 0) return res.json({ success: true, message: "Agendamento cancelado!" });
    else return res.status(404).json({ error: "Nenhum agendamento encontrado para cancelar." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao cancelar agendamento." });
  }
});

// ======================= SERVIDOR =======================
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
