import { Router, Request, Response } from "express";
import supabase from "../supabaseClient";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "StronGSecreTKey123";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  const { email, pass } = req.body;

  if (!email || !pass) {
    return res.status(400).json({ error: "Email and name are required." });
  }

  try {
    // Check if user exists
    const { data: existingUsers, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (selectError) {
      return res.status(500).json({ error: selectError.message });
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

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (error) {
    res.status(500).json({ error: "Unexpected server error" });
  }
});

router.post("/signup", async (req: Request, res: Response) => {
  const { email, name, pass } = req.body;

  if (!email || !name || !pass) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  try {
    // Check if user already exists
    const { data: existingUsers, error: selectError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .limit(1);

    if (selectError) return res.status(500).json({ error: selectError.message });

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPass = await bcrypt.hash(pass, 10);

    const { data: user, error: insertError } = await supabase
      .from("users")
      .insert([{ email, name, pass: hashedPass }])
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({ message: "User created", user, token });
  } catch (error) {
    res.status(500).json({ error: "Unexpected server error", details: error });
  }
});

export default router;
