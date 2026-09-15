import { deliver } from '../mailer.js';
/** Ghosting Protection: nudges companies silent for N days and refreshes response rates. */
export async function runGhostingCheck(env, sb, log = console.log) {
  const rows = await sb.rpc('hm_run_ghosting_check', { p_days: env.ghostingDays }, { service: true });
  const result = await deliver(rows || [], log);
  return { nudged: (rows || []).length, ...result, days: env.ghostingDays };
}
