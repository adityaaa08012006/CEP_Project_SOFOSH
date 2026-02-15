import { supabaseAdmin } from '../config/supabase.js';

export const getSchedules = async (req, res, next) => {
  try {
    const { from, to, active_only } = req.query;

    let query = supabaseAdmin
      .from('visiting_schedules')
      .select('*, created_by_profile:profiles!visiting_schedules_created_by_fkey(full_name)')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);
    if (active_only === 'true') query = query.eq('is_active', true);

    const { data, error } = await query;

    if (error) return res.status(400).json({ error: error.message });
    res.json({ schedules: data });
  } catch (err) {
    next(err);
  }
};

export const getScheduleById = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('visiting_schedules')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Schedule not found' });
    res.json({ schedule: data });
  } catch (err) {
    next(err);
  }
};

export const createSchedule = async (req, res, next) => {
  try {
    const scheduleData = req.validatedBody;

    const { data, error } = await supabaseAdmin
      .from('visiting_schedules')
      .insert({
        ...scheduleData,
        current_bookings: 0,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ schedule: data });
  } catch (err) {
    next(err);
  }
};

export const updateSchedule = async (req, res, next) => {
  try {
    const scheduleData = req.validatedBody;

    const { data, error } = await supabaseAdmin
      .from('visiting_schedules')
      .update(scheduleData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ schedule: data });
  } catch (err) {
    next(err);
  }
};

export const deleteSchedule = async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('visiting_schedules')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    next(err);
  }
};
