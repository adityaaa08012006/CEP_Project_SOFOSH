import { supabaseAdmin } from '../config/supabase.js';
import { ROLES } from '@cep/shared';

export const getAppointments = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    const isAdmin = req.user.role === ROLES.ADMIN;

    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        user:profiles!appointments_user_id_fkey(full_name, email, phone),
        schedule:visiting_schedules!appointments_schedule_id_fkey(date, start_time, end_time)
      `)
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('user_id', req.user.id);
    }
    if (status) query = query.eq('status', status);
    if (date) query = query.eq('schedule.date', date);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ appointments: data });
  } catch (err) {
    next(err);
  }
};

export const getAppointmentById = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        user:profiles!appointments_user_id_fkey(full_name, email, phone),
        schedule:visiting_schedules!appointments_schedule_id_fkey(*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Appointment not found' });

    // Users can only see their own
    if (req.user.role !== ROLES.ADMIN && data.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ appointment: data });
  } catch (err) {
    next(err);
  }
};

export const bookAppointment = async (req, res, next) => {
  try {
    const { schedule_id, num_visitors, purpose } = req.validatedBody;

    // Check schedule exists and has capacity
    const { data: schedule, error: schedError } = await supabaseAdmin
      .from('visiting_schedules')
      .select('*')
      .eq('id', schedule_id)
      .single();

    if (schedError || !schedule) {
      return res.status(404).json({ error: 'Schedule slot not found' });
    }

    if (!schedule.is_active) {
      return res.status(400).json({ error: 'This slot is no longer available' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (schedule.date < today) {
      return res.status(400).json({ error: 'Cannot book a past date' });
    }

    const available = schedule.max_capacity - schedule.current_bookings;
    if (available < num_visitors) {
      return res.status(409).json({ error: `Only ${available} spots available in this slot` });
    }

    // Check if user already booked this slot
    const { data: existing } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('schedule_id', schedule_id)
      .neq('status', 'cancelled')
      .single();

    if (existing) {
      return res.status(409).json({ error: 'You already have a booking for this slot' });
    }

    // Create appointment
    const { data: appointment, error: apptError } = await supabaseAdmin
      .from('appointments')
      .insert({
        user_id: req.user.id,
        schedule_id,
        num_visitors,
        purpose: purpose || null,
        status: 'pending',
      })
      .select()
      .single();

    if (apptError) return res.status(400).json({ error: apptError.message });

    // Increment current_bookings
    await supabaseAdmin
      .from('visiting_schedules')
      .update({ current_bookings: schedule.current_bookings + num_visitors })
      .eq('id', schedule_id);

    res.status(201).json({ appointment });
  } catch (err) {
    next(err);
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, admin_notes } = req.validatedBody;

    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('*, schedule:visiting_schedules!appointments_schedule_id_fkey(*)')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const updateData = {
      status,
      admin_notes: admin_notes || null,
      reviewed_by: req.user.id,
      reviewed_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // If rejected, free up the slot capacity
    if (status === 'rejected' && appointment.status === 'pending') {
      await supabaseAdmin
        .from('visiting_schedules')
        .update({
          current_bookings: Math.max(0, appointment.schedule.current_bookings - appointment.num_visitors),
        })
        .eq('id', appointment.schedule_id);
    }

    res.json({ appointment: data });
  } catch (err) {
    next(err);
  }
};

export const cancelAppointment = async (req, res, next) => {
  try {
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('*, schedule:visiting_schedules!appointments_schedule_id_fkey(*)')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only cancel your own appointments' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: 'Appointment already cancelled' });
    }

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Free up capacity
    if (['pending', 'approved'].includes(appointment.status)) {
      await supabaseAdmin
        .from('visiting_schedules')
        .update({
          current_bookings: Math.max(0, appointment.schedule.current_bookings - appointment.num_visitors),
        })
        .eq('id', appointment.schedule_id);
    }

    res.json({ appointment: data });
  } catch (err) {
    next(err);
  }
};

export const getDailySummary = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const { data: schedules, error } = await supabaseAdmin
      .from('visiting_schedules')
      .select(`
        *,
        appointments(
          *,
          user:profiles!appointments_user_id_fkey(full_name, email)
        )
      `)
      .eq('date', date);

    if (error) return res.status(400).json({ error: error.message });

    const summary = {
      date,
      total_slots: schedules.length,
      total_bookings: schedules.reduce((sum, s) => sum + s.current_bookings, 0),
      total_capacity: schedules.reduce((sum, s) => sum + s.max_capacity, 0),
      schedules,
    };

    res.json(summary);
  } catch (err) {
    next(err);
  }
};
