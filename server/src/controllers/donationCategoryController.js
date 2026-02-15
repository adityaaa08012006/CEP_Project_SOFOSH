import { supabaseAdmin } from '../config/supabase.js';

export const getCategories = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('donation_categories')
      .select('*')
      .order('name');

    if (error) return res.status(400).json({ error: error.message });
    res.json({ categories: data });
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('donation_categories')
      .insert(req.validatedBody)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ category: data });
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('donation_categories')
      .update(req.validatedBody)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ category: data });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('donation_categories')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
};
