import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./db.js";

const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN;
if (clientOrigin) {
  app.use(cors({ origin: clientOrigin.split(",") }));
}
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/users", async (_req, res) => {
  res.json(await prisma.user.findMany());
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`API on :${port}`));
