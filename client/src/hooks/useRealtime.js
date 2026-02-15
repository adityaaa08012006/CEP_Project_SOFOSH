import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useDonationRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('donation-items-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'donation_items' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['donation-items'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useInventoryRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('inventory-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['inventory'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useAppointmentRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('appointments-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useScheduleRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('schedules-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'visiting_schedules' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['schedules'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
