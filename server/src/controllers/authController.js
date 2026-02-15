import { supabaseAdmin } from '../config/supabase.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, full_name, phone } = req.validatedBody;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: data.user.id,
        email,
        full_name,
        phone: phone || null,
        role: 'user',
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    // Sign in to get session
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return res.status(400).json({ error: signInError.message });
    }

    res.status(201).json({
      user: data.user,
      session: signInData.session,
      message: 'Registration successful',
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Fetch profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      user: { ...data.user, ...profile },
      session: data.session,
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res) => {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single();

  res.json({ user: profile });
};

export const updateMe = async (req, res, next) => {
  try {
    const updates = req.validatedBody;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ user: data });
  } catch (err) {
    next(err);
  }
};
