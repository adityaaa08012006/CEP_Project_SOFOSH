import { supabaseAdmin } from '../config/supabase.js';
import { ROLES } from '@cep/shared';

export const getDonations = async (req, res, next) => {
  try {
    const { status, item_id } = req.query;
    const isAdmin = req.user.role === ROLES.ADMIN;

    let query = supabaseAdmin
      .from('donations')
      .select(`
        *,
        user:profiles!donations_user_id_fkey(full_name, email),
        item:donation_items!donations_item_id_fkey(name, unit, required_qty, fulfilled_qty, category:donation_categories!donation_items_category_id_fkey(name))
      `)
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('user_id', req.user.id);
    }
    if (status) query = query.eq('status', status);
    if (item_id) query = query.eq('item_id', item_id);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ donations: data });
  } catch (err) {
    next(err);
  }
};

export const createDonation = async (req, res, next) => {
  try {
    const { item_id, quantity, notes } = req.validatedBody;

    // Check item exists
    const { data: item, error: itemError } = await supabaseAdmin
      .from('donation_items')
      .select('*')
      .eq('id', item_id)
      .single();

    if (itemError || !item) {
      return res.status(404).json({ error: 'Donation item not found' });
    }

    if (!item.is_active) {
      return res.status(400).json({ error: 'This item is no longer accepting donations' });
    }

    const { data, error } = await supabaseAdmin
      .from('donations')
      .insert({
        user_id: req.user.id,
        item_id,
        quantity,
        notes: notes || null,
        status: 'pledged',
        donated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ donation: data });
  } catch (err) {
    next(err);
  }
};

export const verifyDonation = async (req, res, next) => {
  try {
    const { data: donation, error: fetchError } = await supabaseAdmin
      .from('donations')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    // Update donation status
    const { data, error } = await supabaseAdmin
      .from('donations')
      .update({
        status: 'verified',
        verified_by: req.user.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Update fulfilled quantity on the item
    const { data: item } = await supabaseAdmin
      .from('donation_items')
      .select('fulfilled_qty')
      .eq('id', donation.item_id)
      .single();

    if (item) {
      await supabaseAdmin
        .from('donation_items')
        .update({
          fulfilled_qty: item.fulfilled_qty + donation.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', donation.item_id);

      // Update inventory
      const { data: inv } = await supabaseAdmin
        .from('inventory')
        .select('*')
        .eq('item_id', donation.item_id)
        .single();

      if (inv) {
        await supabaseAdmin
          .from('inventory')
          .update({
            quantity_on_hand: inv.quantity_on_hand + donation.quantity,
            last_restocked_at: new Date().toISOString(),
            updated_by: req.user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('item_id', donation.item_id);
      }
    }

    res.json({ donation: data, message: 'Donation verified and inventory updated' });
  } catch (err) {
    next(err);
  }
};
