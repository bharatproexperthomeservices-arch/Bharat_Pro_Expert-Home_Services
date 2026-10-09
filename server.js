import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import createOrderHandler from "./api/create-order.js";
import verifyPaymentHandler from "./api/verify-payment.js";

dotenv.config();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(",").map((value) => value.trim())
    : true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.get("/api/health", (_req, res) => res.status(200).json({ ok: true }));

// Keep local Express and Vercel serverless routes on the same trusted pricing
// and payment-verification implementation to prevent security drift.
app.post("/api/create-order", (req, res) => createOrderHandler(req, res));
app.post("/api/verify-payment", (req, res) => verifyPaymentHandler(req, res));

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`Bharat Pro Expert API listening on port ${port}`));
