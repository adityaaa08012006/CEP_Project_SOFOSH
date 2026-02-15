import { supabaseAdmin } from '../config/supabase.js';
import { parsePdfToItems } from '../services/pdfParser.js';

export const getDonationItems = async (req, res, next) => {
  try {
    const { category_id, active_only } = req.query;

    let query = supabaseAdmin
      .from('donation_items')
      .select('*, category:donation_categories!donation_items_category_id_fkey(name)')
      .order('name');

    if (category_id) query = query.eq('category_id', category_id);
    if (active_only === 'true') query = query.eq('is_active', true);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ items: data });
  } catch (err) {
    next(err);
  }
};

export const getDonationItemById = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('donation_items')
      .select('*, category:donation_categories!donation_items_category_id_fkey(*)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Item not found' });
    res.json({ item: data });
  } catch (err) {
    next(err);
  }
};

export const createDonationItem = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('donation_items')
      .insert({ ...req.validatedBody, fulfilled_qty: 0 })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ item: data });
  } catch (err) {
    next(err);
  }
};

export const updateDonationItem = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('donation_items')
      .update({ ...req.validatedBody, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ item: data });
  } catch (err) {
    next(err);
  }
};

export const deleteDonationItem = async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('donation_items')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
};

export const extractFromPdf = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const items = await parsePdfToItems(req.file.buffer);

    res.json({
      items: items,
      total: items.length,
      message: 'Items extracted. Review and edit before publishing.',
    });
  } catch (err) {
    next(err);
  }
};

export const bulkCreateItems = async (req, res, next) => {
  try {
    const { batch_title, items } = req.validatedBody;

    // Create batch record
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('donation_batches')
      .insert({
        title: batch_title,
        uploaded_by: req.user.id,
        status: 'published',
      })
      .select()
      .single();

    if (batchError) return res.status(400).json({ error: batchError.message });

    // Ensure categories exist
    const categoryMap = {};
    const uniqueCategories = [...new Set(items.map((i) => i.category))];

    for (const catName of uniqueCategories) {
      // Try to find existing
      const { data: existing } = await supabaseAdmin
        .from('donation_categories')
        .select('id')
        .eq('name', catName)
        .single();

      if (existing) {
        categoryMap[catName] = existing.id;
      } else {
        const { data: created } = await supabaseAdmin
          .from('donation_categories')
          .insert({ name: catName, description: '' })
          .select()
          .single();
        categoryMap[catName] = created.id;
      }
    }

    // Insert items
    const itemsToInsert = items.map((item) => ({
      category_id: categoryMap[item.category],
      name: item.name,
      unit: item.unit,
      required_qty: item.quantity,
      fulfilled_qty: 0,
      is_active: true,
      batch_id: batch.id,
    }));

    const { data: createdItems, error: itemsError } = await supabaseAdmin
      .from('donation_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) return res.status(400).json({ error: itemsError.message });

    // Create inventory records for each item
    const inventoryRecords = createdItems.map((item) => ({
      item_id: item.id,
      quantity_on_hand: 0,
      updated_by: req.user.id,
    }));

    await supabaseAdmin.from('inventory').insert(inventoryRecords);

    res.status(201).json({
      batch,
      items: createdItems,
      message: `${createdItems.length} items published successfully`,
    });
  } catch (err) {
    next(err);
  }
};
