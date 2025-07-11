import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { Router } from "express";

const FACTS_FILE = path.join(__dirname, "fun-facts.json");

// Load facts from file or use default
function loadFacts() {
  if (fs.existsSync(FACTS_FILE)) {
    return JSON.parse(fs.readFileSync(FACTS_FILE, "utf-8"));
  }
  return [
    { id: uuidv4(), text: "Honey never spoils.", addedBy: "system" },
    { id: uuidv4(), text: "Bananas are berries, but strawberries aren't.", addedBy: "system" },
    { id: uuidv4(), text: "Octopuses have three hearts.", addedBy: "system" },
  ];
}

function saveFacts(facts: any[]) {
  fs.writeFileSync(FACTS_FILE, JSON.stringify(facts, null, 2));
}

let facts = loadFacts();

const funFactRouter = Router();

// GET /fun-fact: return a random fun fact
funFactRouter.get("/fun-fact", (req, res) => {
  if (!facts.length) return res.status(404).json({ error: "No facts available" });
  const fact = facts[Math.floor(Math.random() * facts.length)];
  res.json(fact);
});

// POST /add-fact: add a new fun fact
funFactRouter.post("/add-fact", (req, res) => {
  const { text, addedBy } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'text' field" });
  }
  const newFact = { id: uuidv4(), text, addedBy: addedBy || undefined };
  facts.push(newFact);
  saveFacts(facts);
  res.json(newFact);
});

export default funFactRouter;
