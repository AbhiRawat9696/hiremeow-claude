// Entry point for the live HireMeow platform (Supabase + API). Everything degrades to setup notices when not configured.
import { makeUsePlatform, getClient } from './client.js';
import { createUi } from './ui.js';
import { createAuth } from './auth.js';
import { createMap } from './map.js';
import { createJobs } from './jobs.js';
import { createCompany } from './company.js';
import { createStudent } from './student.js';
import { createPool } from './pool.js';

export function createPlatform(React) {
  const h = React.createElement;
  const ui = createUi(React);
  const auth = createAuth(React, ui);
  const maps = createMap(React);
  const jobs = createJobs(React, ui, maps);
  const company = createCompany(React, ui, maps, jobs);
  const student = createStudent(React, ui);
  const pool = createPool(React, ui);
  const usePlatform = makeUsePlatform(React);
  if (typeof window !== 'undefined' && !window.claude?.use) getClient();

  function CompaniesLanding({ platform, onOpenAuth, onNavigate }) {
    return h('div', { className: 'pf-stack' },
      h('div', { className: 'pf-card pf-pool-hero' },
        h('div', null, h('p', { className: 'lab-kicker' }, 'For employers'),
          h('h2', null, 'Hire international talent in Thailand, without the black hole.'),
          h('ul', { className: 'pf-ticks' },
            h('li', null, 'Reverse Hiring: browse students who are open to offers and message them with the salary up front.'),
            h('li', null, '60-second video pitches instead of cover letters.'),
            h('li', null, 'Salary Transparency Wall: every job shows a real range.'),
            h('li', null, 'Ghosting Protection keeps your response rate honest.'))),
        platform.user
          ? h('p', { className: 'pf-muted' }, platform.profile?.role === 'admin' ? 'You are signed in as an admin.' : 'You are signed in with a student account. Create a separate company account to post jobs.')
          : h('div', { className: 'lab-row' }, h('button', { type: 'button', className: 'lab-btn', onClick: () => onOpenAuth('company') }, 'Create a company account'), h('button', { type: 'button', className: 'lab-btn-ghost', onClick: () => onOpenAuth() }, 'Sign in'))),
      h('button', { type: 'button', className: 'pd-link', onClick: () => onNavigate('pool') }, '⭐ See the Meow Pool →'));
  }

  function SignInPrompt({ onOpenAuth, children }) {
    return h('div', { className: 'pf-card pf-signin-card' },
      h('div', null, h('h3', null, 'Sign in to unlock your HireMeow account'), h('p', { className: 'pf-muted' }, children || 'Apply to jobs, get offers, upload your 1-Minute Meow Pitch and track every application live.')),
      h('div', { className: 'lab-row' }, h('button', { type: 'button', className: 'lab-btn', onClick: () => onOpenAuth('student') }, 'Sign in or join')));
  }

  return { ui, usePlatform, AuthDialog: auth.AuthDialog, AccountButton: auth.AccountButton, applyPendingRole: auth.applyPendingRole, JobsBoard: jobs.JobsBoard, CompanyDashboard: company.CompanyDashboard, CompaniesLanding, StudentHub: student.StudentHub, MeowPool: pool.MeowPool, AdminPanel: pool.AdminPanel, SignInPrompt };
}
