// Customer/partner booking chat client. Requires Supabase client configured by the app.
export function subscribeToBookingMessages(supabase, { bookingId, onMessage }) {
  if (!supabase || !bookingId || typeof onMessage !== 'function') throw new Error('Chat configuration is incomplete.');
  const channel = supabase.channel('booking-chat-' + bookingId)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'messages',
      filter: 'booking_id=eq.' + String(bookingId)
    }, payload => onMessage(payload.new))
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export async function loadBookingMessages(supabase, bookingId) {
  const { data, error } = await supabase.from('messages')
    .select('id,booking_id,sender_id,receiver_id,message_text,created_at')
    .eq('booking_id', String(bookingId)).order('created_at', { ascending: true }).limit(300);
  if (error) throw error;
  return data || [];
}

// Sending must go through an authenticated server endpoint which verifies booking participation.
export async function sendBookingMessage({ bookingId, receiverId, messageText }) {
  const response = await fetch('/api/chat/messages', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ bookingId, receiverId, messageText })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Message could not be sent.');
  return result.message;
}
