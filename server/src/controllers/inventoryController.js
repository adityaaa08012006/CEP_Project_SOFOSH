import { supabaseAdmin } from '../config/supabase.js';

export const getInventory = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('inventory')
      .select(`
        *,
        item:donation_items!inventory_item_id_fkey(
          name, unit, required_qty, fulfilled_qty, is_active,
          category:donation_categories!donation_items_category_id_fkey(name)
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ inventory: data });
  } catch (err) {
    next(err);
  }
};

export const updateInventory = async (req, res, next) => {
  try {
    const { quantity_on_hand } = req.validatedBody;

    const { data, error } = await supabaseAdmin
      .from('inventory')
      .update({
        quantity_on_hand,
        updated_by: req.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('item_id', req.params.itemId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ inventory: data });
  } catch (err) {
    next(err);
  }
};

export const getInventoryReport = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('donation_items')
      .select(`
        *,
        category:donation_categories!donation_items_category_id_fkey(name),
        inventory:inventory!inventory_item_id_fkey(quantity_on_hand)
      `)
      .eq('is_active', true);

    if (error) return res.status(400).json({ error: error.message });

    const report = data.map((item) => {
      const onHand = item.inventory?.[0]?.quantity_on_hand || 0;
      const deficit = Math.max(0, item.required_qty - item.fulfilled_qty);
      const surplus = Math.max(0, item.fulfilled_qty - item.required_qty);
      const fulfillmentPct = item.required_qty > 0
        ? Math.round((item.fulfilled_qty / item.required_qty) * 100)
        : 0;

      return {
        id: item.id,
        name: item.name,
        category: item.category?.name,
        unit: item.unit,
        required_qty: item.required_qty,
        fulfilled_qty: item.fulfilled_qty,
        quantity_on_hand: onHand,
        deficit,
        surplus,
        fulfillment_pct: fulfillmentPct,
        status: surplus > 0 ? 'surplus' : deficit > 0 ? 'needed' : 'fulfilled',
      };
    });

    res.json({
      report,
      summary: {
        total_items: report.length,
        fulfilled: report.filter((r) => r.status === 'fulfilled').length,
        needed: report.filter((r) => r.status === 'needed').length,
        surplus: report.filter((r) => r.status === 'surplus').length,
      },
    });
  } catch (err) {
    next(err);
  }
};
