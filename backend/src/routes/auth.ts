import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import supabase from "../supabaseClient";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Require JWT_SECRET - fail fast if not configured
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("CRITICAL: JWT_SECRET environment variable is required");
}

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 signups per hour per IP
  message: { error: "Too many accounts created. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const router: Router = Router();

router.post("/login", authLimiter, async (req: Request, res: Response) => {
  const { email, pass } = req.body;

  if (!email || !pass) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    // Check if user exists
    const { data: existingUsers, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (selectError) {
      console.error("Database error during login:", selectError);
      return res.status(500).json({ error: "An error occurred. Please try again." });
    }

    if (!existingUsers || existingUsers.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = existingUsers[0];

    // Compare password
    const passwordMatches = await bcrypt.compare(pass, user.pass);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ message: 'Login successful', user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (error) {
    res.status(500).json({ error: "Unexpected server error" });
  }
});

router.post("/signup", signupLimiter, async (req: Request, res: Response) => {
  const { email, name, pass } = req.body;

  if (!email || !name || !pass) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  // Server-side password validation
  if (pass.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }
  if (!/[A-Z]/.test(pass)) {
    return res.status(400).json({ error: "Password must contain at least one uppercase letter." });
  }
  if (!/[0-9]/.test(pass)) {
    return res.status(400).json({ error: "Password must contain at least one number." });
  }
  if (!/[^A-Za-z0-9]/.test(pass)) {
    return res.status(400).json({ error: "Password must contain at least one special character." });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  try {
    // Check if user already exists
    const { data: existingUsers, error: selectError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .limit(1);

    if (selectError) {
      console.error("Database error during signup:", selectError);
      return res.status(500).json({ error: "An error occurred. Please try again." });
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPass = await bcrypt.hash(pass, 10);

    const { data: user, error: insertError } = await supabase
      .from("users")
      .insert([{ email, name, pass: hashedPass }])
      .select()
      .single();

    if (insertError) {
      console.error("Database error during user creation:", insertError);
      return res.status(500).json({ error: "Failed to create account. Please try again." });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    // Return only safe user fields (exclude password hash)
    res.status(201).json({
      message: "User created",
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error("Unexpected error during signup:", error);
    res.status(500).json({ error: "Unexpected server error" });
  }
});

router.post("/verify", authLimiter, (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ valid: true, payload: decoded });
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;
