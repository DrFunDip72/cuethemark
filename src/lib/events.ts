import { supabase } from './supabase';

type EventName =
  | 'signup_completed'
  | 'routine_created'
  | 'marker_created'
  | 'marker_played'
  | 'share_link_copied'
  | 'shared_routine_opened'
  | 'shared_marker_played';

const visitorId = () => {
  let id = localStorage.getItem('ctm-visitor');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('ctm-visitor', id);
  }
  return id;
};

// Fire-and-forget funnel tracking; never blocks or breaks the UI.
export const logEvent = (name: EventName, routineId?: string) => {
  supabase
    .rpc('log_event', { p_name: name, p_routine_id: routineId ?? null, p_visitor_id: visitorId() })
    .then(({ error }) => error && console.warn('log_event failed', error.message));
};
