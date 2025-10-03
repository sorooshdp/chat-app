import { Router, Request, Response } from 'express';
import supabase from '../supabaseClient';

const router = Router();

router.post('/signin', async (req: Request, res: Response) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required.' });
  }

  try {
    // Optional: create table if not exists -- recommended to handle this in Supabase Dashboard or migrations
    // Here, we'll skip automatic creation and assume table 'users' exists.

    // Check if user exists
    const { data: existingUsers, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (selectError) {
      return res.status(500).json({ error: selectError.message });
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(200).json({ message: 'User already exists', user: existingUsers[0] });
    }

    // Insert new user
    const { data, error: insertError } = await supabase
      .from('users')
      .insert([
        { email, name }
      ])
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    res.status(201).json({ message: 'User created', user: data });
  } catch (error) {
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

router.post('/signup', async (req: Request, res: Response) => {
  const { email, name, pass } = req.body;

  if (!email || !name || !pass) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    // Check if user already exists
    const { data: existingUsers, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (selectError) {
      return res.status(500).json({ error: selectError.message });
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ message: 'User already exists', user: existingUsers[0] });
    }

    // Insert new user (IMPORTANT: hash the password before storing in production)
    const { data, error: insertError } = await supabase
      .from('users')
      .insert([{ email, name, pass }])
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    res.status(201).json({ message: 'User created', user: data });
  } catch (error) {
    res.status(500).json({ error: 'Unexpected server error', details: error });
  }
});

export default router;
