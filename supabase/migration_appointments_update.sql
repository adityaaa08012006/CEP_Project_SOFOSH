-- Migration to add date and time fields to appointments table
-- This allows appointments to be booked directly with date/time instead of requiring a schedule_id

-- Add new columns for direct date/time booking
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Make schedule_id nullable (optional)
ALTER TABLE public.appointments 
ALTER COLUMN schedule_id DROP NOT NULL;

-- Add check constraint to ensure either schedule_id OR (date, start_time, end_time) is provided
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_date_or_schedule_check
CHECK (
  (schedule_id IS NOT NULL) OR 
  (date IS NOT NULL AND start_time IS NOT NULL AND end_time IS NOT NULL)
);

-- Remove the unique constraint on (user_id, schedule_id) since schedule_id can now be NULL
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_user_id_schedule_id_key;

-- Create index on date for efficient querying
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);

-- Comment for documentation
COMMENT ON COLUMN public.appointments.date IS 'Direct booking date (used when not booking via schedule)';
COMMENT ON COLUMN public.appointments.start_time IS 'Direct booking start time (used when not booking via schedule)';
COMMENT ON COLUMN public.appointments.end_time IS 'Direct booking end time (used when not booking via schedule)';
