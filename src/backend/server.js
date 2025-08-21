import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do banco
const db = await mysql.createPool({
  host: "localhost",
  user: "root",       // ajuste para seu user
  password: "lili1215",       // ajuste para sua senha
  database: "fitfio"
});

// Rota de login
app.post("/login", async (req, res) => {
  const { ra, senha } = req.body;
  if (!ra || !senha) {
    return res.status(400).json({ error: "Preencha RA e Senha." });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM usuarios WHERE ra = ? AND senha = ?",
      [ra, senha]
    );

    if (rows.length > 0) {
      return res.json({ success: true, message: "Login realizado!", nome: rows[0].nome, });
    } else {
      return res.status(401).json({ success: false, error: "RA ou Senha inválidos." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor." });
  }
});



// Rota para pegar dados do usuário pelo RA
app.get("/perfil/:ra", async (req, res) => {
  const { ra } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT nome, ra, curso, semestre FROM usuarios WHERE ra = ?",
      [ra]
    );

    if (rows.length > 0) {
      return res.json({ success: true, usuario: rows[0] });
    } else {
      return res.status(404).json({ success: false, error: "Usuário não encontrado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor." });
  }
});


const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
