// Mock mailer: emails are written to public.email_outbox by the database function and logged here.
// Swap `deliver` for Resend/SendGrid/SES when you are ready to send real email.
export async function deliver(messages, log = console.log) {
  for (const m of messages) log(`[mock email] to=${m.to_email || '(no email)'} · ${m.job_title} · ${m.student_name} waited ${m.days_waiting} days`);
  return { delivered: messages.length, mode: 'mock' };
}
