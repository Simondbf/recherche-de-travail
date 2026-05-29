import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "souverain-europe-protrack-secret-key-998822";
const DB_FILE = path.join(process.cwd(), "db.json");

// Define in-memory storage synced to a database file
interface UserData {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  photoURL?: string;
  lastActive: string;
}

interface ApplicationData {
  id: string;
  userId: string;
  title: string;
  company: string;
  status: string;
  location?: string;
  url?: string;
  salary?: string;
  contacts?: { id: string; name: string; email?: string; phone?: string; role?: string }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SchemaDB {
  users: UserData[];
  applications: ApplicationData[];
}

// Ensure database file exists
function initDb(): SchemaDB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Database file read error, recreating:", e);
  }
  const defaultDb: SchemaDB = { users: [], applications: [] };
  fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
  return defaultDb;
}

let dbCache = initDb();

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), "utf-8");
  } catch (e) {
    console.error("Database write error: ", e);
  }
}

// Initialize GoogleGenAI SDK safely
const aiHost = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json({ limit: '10mb' }));

// Middleware for auth verification
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    email: string;
    displayName: string;
  };
}

const verifyToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Session expirée ou connexion requise. Veuillez vous authentifier." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; displayName: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session invalide. Veuillez vous reconnecter." });
  }
};

// 1. Authentification Sovereign API Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Tous les champs (email, mot de passe, prénom) sont requis." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = dbCache.users.find(u => u.email === normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: "Cet email est déjà enregistré." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = "ur-" + Math.random().toString(36).substring(2, 9);
    
    const newUser: UserData = {
      id,
      email: normalizedEmail,
      passwordHash,
      displayName: displayName.trim(),
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${id}`,
      lastActive: new Date().toISOString()
    };

    dbCache.users.push(newUser);
    saveDb();

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, displayName: newUser.displayName },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      token,
      user: {
        uid: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        photoURL: newUser.photoURL
      }
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Erreur lors de la création de votre espace" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = dbCache.users.find(u => u.email === normalizedEmail);
    if (!user) {
      return res.status(400).json({ error: "Identifiants inconnus ou invalides." });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: "Identifiants inconnus ou invalides." });
    }

    user.lastActive = new Date().toISOString();
    saveDb();

    const token = jwt.sign(
      { id: user.id, email: user.email, displayName: user.displayName },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      token,
      user: {
        uid: user.id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }
    });
  } catch (error) {
    console.error("Login Error: ", error);
    res.status(500).json({ error: "Erreur de connexion" });
  }
});

app.get("/api/auth/me", verifyToken, (req: AuthenticatedRequest, res) => {
  const user = dbCache.users.find(u => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur introuvable" });
  }
  res.json({
    user: {
      uid: user.id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    }
  });
});

app.delete("/api/auth/me", verifyToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  dbCache.applications = dbCache.applications.filter(app => app.userId !== userId);
  dbCache.users = dbCache.users.filter(u => u.id !== userId);
  saveDb();
  res.json({ success: true });
});

// 2. Job Applications: STRICT INDIVIDUAL USER ISOLATION
app.get("/api/applications", verifyToken, (req: AuthenticatedRequest, res) => {
  // Return applications where userId exactly equals the authenticated userId
  const userApps = dbCache.applications.filter(app => app.userId === req.user?.id);
  // Sort by date created decrescendo
  userApps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(userApps);
});

app.post("/api/applications", verifyToken, (req: AuthenticatedRequest, res) => {
  const { title, company, status, location, url, salary, contacts, notes } = req.body;
  if (!title || !company || !status) {
    return res.status(400).json({ error: "Le titre, l'entreprise et l'état sont obligatoires." });
  }

  const id = "job-" + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const newApp: ApplicationData = {
    id,
    userId: req.user!.id,
    title: title.trim(),
    company: company.trim(),
    status,
    location: location?.trim(),
    url: url?.trim(),
    salary: salary?.trim(),
    contacts: contacts || [],
    notes: notes?.trim(),
    createdAt: now,
    updatedAt: now
  };

  dbCache.applications.push(newApp);
  
  // Update last active
  const user = dbCache.users.find(u => u.id === req.user?.id);
  if (user) user.lastActive = now;

  saveDb();
  res.status(201).json(newApp);
});

app.put("/api/applications/:id", verifyToken, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const appIndex = dbCache.applications.findIndex(app => app.id === id);

  if (appIndex === -1) {
    return res.status(404).json({ error: "Candidature introuvable." });
  }

  // Double check authorization: MUST belong to the authenticated client
  const targetApp = dbCache.applications[appIndex];
  if (targetApp.userId !== req.user!.id) {
    return res.status(403).json({ error: "Action non autorisée. Vous ne pouvez modifier que votre propre contenu." });
  }

  const { title, company, status, location, url, salary, contacts, notes } = req.body;
  const now = new Date().toISOString();

  dbCache.applications[appIndex] = {
    ...targetApp,
    title: title !== undefined ? title.trim() : targetApp.title,
    company: company !== undefined ? company.trim() : targetApp.company,
    status: status !== undefined ? status : targetApp.status,
    location: location !== undefined ? location.trim() : targetApp.location,
    url: url !== undefined ? url.trim() : targetApp.url,
    salary: salary !== undefined ? salary.trim() : targetApp.salary,
    contacts: contacts !== undefined ? contacts : targetApp.contacts,
    notes: notes !== undefined ? notes.trim() : targetApp.notes,
    updatedAt: now
  };

  // Update last active
  const user = dbCache.users.find(u => u.id === req.user?.id);
  if (user) user.lastActive = now;

  saveDb();
  res.json(dbCache.applications[appIndex]);
});

app.delete("/api/applications/:id", verifyToken, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const appIndex = dbCache.applications.findIndex(app => app.id === id);

  if (appIndex === -1) {
    return res.status(404).json({ error: "Candidature introuvable." });
  }

  // Validate owner bounds
  const targetApp = dbCache.applications[appIndex];
  if (targetApp.userId !== req.user!.id) {
    return res.status(403).json({ error: "Action non autorisée." });
  }

  dbCache.applications.splice(appIndex, 1);
  saveDb();
  res.json({ success: true, message: "Candidature supprimée avec succès." });
});

// 3. Stats Aggregation: Anonymized counts compiled on the fly for motivation and group metrics
app.get("/api/stats", verifyToken, (req: AuthenticatedRequest, res) => {
  // Construct user aggregations dynamically from our stored local database
  const list = dbCache.users.map(u => {
    const uApps = dbCache.applications.filter(a => a.userId === u.id);
    const totalApplied = uApps.filter(a => ['applied', 'interviewing', 'offer'].includes(a.status)).length;
    const totalInterviewing = uApps.filter(a => a.status === "interviewing").length;
    const totalOffers = uApps.filter(a => a.status === "offer").length;

    return {
      userId: u.id,
      displayName: u.displayName,
      photoURL: u.photoURL,
      totalApplied,
      totalInterviewing,
      totalOffers,
      lastActive: u.lastActive
    };
  });

  res.json(list);
});

// 4. Secure API route for Cover Letter generation
app.post("/api/gemini/letter", async (req, res) => {
  try {
    const { role, company, description, bulletPoints } = req.body;
    
    if (!role || !company) {
      return res.status(400).json({ error: "Le rôle et l'entreprise sont requis." });
    }

    const prompt = `Formate une lettre de motivation professionnelle et percutante en Français pour le poste suivant:
Poste: ${role}
Entreprise: ${company}
Description du poste: ${description || "Non fournie"}
Points forts du candidat: ${bulletPoints || "Non fournis"}

Règles de style:
- Écris dans un Français impeccable et professionnel.
- Reste moderne, évite les formulations trop anciennes ou mielleuses, privilégie l'enthousiasme et le professionnalisme.
- Structure claire en 3 sections: Pourquoi cette entreprise, pourquoi moi pour ce rôle, et un appel à l'action pour un entretien.
- Laisse des espaces réservés comme [Votre Nom] pour personnalisation.`;

    const response = await aiHost.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Tu es un consultant en recrutement d'élite et un rédacteur expert en lettres de motivation professionnelles.",
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Cover Letter Error:", error);
    if (error.message?.includes('503') || error.status === 503) {
      return res.status(503).json({ error: "L'IA est très sollicitée en ce moment (forte demande temporaire chez Google). Veuillez réessayer dans quelques secondes." });
    }
    res.status(500).json({ error: error.message || "Erreur interne de génération" });
  }
});

// 5. Secure API route for Interview Prep advice
app.post("/api/gemini/prep", async (req, res) => {
  try {
    const { role, company, description } = req.body;

    if (!role || !company) {
      return res.status(400).json({ error: "Le rôle et l'entreprise sont requis." });
    }

    const prompt = `Génère 3 questions d'entretien d'embauche extrêmement pertinentes avec leurs réponses suggérées adaptées pour ce poste de façon à maximiser mes chances de recrutement:
Poste: ${role}
Entreprise: ${company}
Description du poste: ${description || "Non fournie"}

Donne également 3 conseils stratégiques spécifiques à cette entreprise (culture, défis, ou technologies).`;

    const response = await aiHost.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Tu es un coach d'entretien d'embauche d'élite qui aide les candidats à briller lors des entretiens de recrutement.",
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Interview Prep Error:", error);
    if (error.message?.includes('503') || error.status === 503) {
      return res.status(503).json({ error: "L'IA est très sollicitée en ce moment (forte demande temporaire chez Google). Veuillez réessayer dans un instant." });
    }
    res.status(500).json({ error: error.message || "Erreur interne de génération de préparation" });
  }
});

// Set up Vite development server or production static files
async function initializeUi() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Enabling Vite development server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production static assets...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully operational on http://0.0.0.0:${PORT}`);
  });
}

initializeUi().catch((err) => {
  console.error("Vite/Express initialization failed: ", err);
});

// Déclencheur de synchronisation pour forcer GitHub à prendre ce fichier complet
