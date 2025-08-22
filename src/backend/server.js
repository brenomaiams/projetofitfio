import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
app.use(cors());
app.use(express.json());

const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "fitfio"
});

// ======================= LOGIN =======================
app.post("/login", async (req, res) => {
  const { ra, senha } = req.body;
  if (!ra || !senha) return res.status(400).json({ error: "Preencha RA e Senha." });

  try {
    const [rows] = await db.query("SELECT * FROM usuarios WHERE ra = ? AND senha = ?", [ra, senha]);
    if (rows.length > 0) {
      return res.json({ success: true, message: "Login realizado!", nome: rows[0].nome });
    } else {
      return res.status(401).json({ success: false, error: "RA ou Senha inválidos." });
    }
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
// Listar todos
app.get("/agendamentos", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT ra, dia, hora FROM agendamentos");
    res.json({ success: true, agendamentos: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agendamentos." });
  }
});

// Buscar por RA
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

// Criar agendamento
app.post("/agendamentos", async (req, res) => {
  const { ra, dia, hora } = req.body;
  if (!ra || !dia || !hora) return res.status(400).json({ error: "Preencha RA, dia e hora." });

  try {
    // Impedir mais de um agendamento por usuário
    const [usuarioAgendamento] = await db.query("SELECT * FROM agendamentos WHERE ra = ?", [ra]);
    if (usuarioAgendamento.length > 0) {
      return res.status(400).json({ error: "Você já possui um agendamento." });
    }

    // Impedir agendamento no mesmo horário
    const [horarioOcupado] = await db.query("SELECT * FROM agendamentos WHERE dia = ? AND hora = ?", [dia, hora]);
    if (horarioOcupado.length > 0) return res.status(400).json({ error: "Esse horário já está ocupado." });

    // Inserir e retornar o agendamento criado
    await db.query("INSERT INTO agendamentos (ra, dia, hora) VALUES (?, ?, ?)", [ra, dia, hora]);
    res.json({ success: true, message: "Agendamento realizado!", agendamento: { ra, dia, hora } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao salvar agendamento." });
  }
});

// Cancelar agendamento (corrigido)
app.delete("/agendamentos", async (req, res) => {
  const { ra } = req.body;
  if (!ra) return res.status(400).json({ error: "Informe RA." });

  try {
    const [result] = await db.query("DELETE FROM agendamentos WHERE ra = ?", [ra]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: "Agendamento cancelado!" });
    } else {
      res.status(404).json({ error: "Nenhum agendamento encontrado para cancelar." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao cancelar agendamento." });
  }
});

// ======================= INICIAR SERVIDOR =======================
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
