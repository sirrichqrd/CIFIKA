/* ============================================================
   CIFIKA → SUPABASE SYNC BRIDGE
   Fire-and-forget dual-write. Never blocks the Sheets/PDF flow.
   ============================================================ */
(function () {
  const SUPABASE_URL      = 'https://mvwmxcqzvmiagkinxqyg.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_rkQwgjabWvkiLcAsvdRTMg_oVgwHKZa'; // ← Settings → API → anon public

  const syncedRefs = new Set();
  let sb = null;

  function client() {
    if (sb) return sb;
    if (typeof supabase === 'undefined') return null;
    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.startsWith('PASTE_')) {
      console.warn('[CIFIKA] Sync disabled — paste your anon key in cifika-supabase.js');
      return null;
    }
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return sb;
  }

  /* ---------- collect the form from the DOM (no coupling to your JS) ---------- */
  const val    = n => (document.querySelector(`#regForm [name="${n}"]`)?.value || '').trim();
  const chk    = n => !!document.querySelector(`#regForm [name="${n}"]`)?.checked;
  const toggle = g => document.querySelector(`.toggle-btn.active[data-group="${g}"]`)?.dataset.value || '';
  const picks  = sel => [...document.querySelectorAll(sel)].map(el => el.dataset.value || el.value).filter(Boolean);

  function collect() {
    const hasTrained = toggle('hasTrained');
    const prior = {
      hasTrained,
      arts: picks('#artsGrid .check-btn.active, #artsGrid input:checked'),
      style: val('mStyle'), club: val('mClub'), instructor: val('mInstructor'),
      rank: val('mRank'), years: val('mYears'), lastActive: val('mLastActive'), other: val('mOther'),
      karate: {
        style: picks('#karateStyleGrid .check-btn.active, #karateStyleGrid input:checked')[0] || '',
        club: val('kClub'), instructor: val('kInstructor'), assoc: val('kAssoc'),
        rank: val('kRank'), years: val('kYears'), lastActive: val('kLastActive')
      }
    };
    return {
      ref: findRef(),
      fullName: val('fullName'), preferredName: val('preferredName'),
      dob: val('dob'), gender: toggle('gender'),
      nationality: val('nationality'), phone: val('phone'), email: val('email'),
      address: val('address'), cityState: val('cityState'),
      pFullName: val('pFullName'), pRelationship: val('pRelationship'),
      pPhone: val('pPhone'), pEmail: val('pEmail'), pAddress: val('pAddress'),
      prior_martial_arts: prior,
      karate_style: prior.karate.style,
      previous_rank: prior.karate.rank,
      years_trained: prior.karate.years,
      medical_conditions: toggle('medical') === 'yes' ? val('medicalDesc') : '',
      injuries: toggle('injury') === 'yes' ? val('injuryDesc') : '',
      emergency_contact: {
        name: val('eName'), relationship: val('eRelationship'),
        primaryPhone: val('ePrimaryPhone'), altPhone: val('eAltPhone')
      },
      media_consent: toggle('media') === 'yes',
      club_rules_accepted: chk('rulesRead'),
      dojo_kun_acknowledged: chk('kunRead'),
      consents: {
        participation: chk('participation'),
        code_of_conduct: chk('codeOfConduct'),
        privacy: chk('privacy'),
        guardian_responsibility: chk('pResponsible'),
        signature: val('signature'), signed_at: val('sigDate'),
        training_objectives: picks('#objectivesGrid .check-btn.active, #objectivesGrid input:checked')
      }
    };
  }

  /* ---------- find the CFK ref your form generated (ignores placeholder) ---------- */
  function findRef() {
    const m = document.getElementById('refNum')?.textContent.match(/CFK-\d{3,}/i);
    if (m && !/^CFK-0+$/.test(m[0])) return m[0].toUpperCase();
    return '';
  }

  /* ---------- send ---------- */
  async function send(data) {
    const c = client();
    if (!c) return { status: 'error', message: 'Supabase not configured' };
    try {
      const { data: res, error } = await c.rpc('register_student', { p: data });
      if (error) throw error;
      syncedRefs.add(data.ref);
      console.info('%c[CIFIKA] Synced to Supabase ✓ ' + data.ref, 'color:#FF6B00;font-weight:bold');
      if (window.CIFIKA_SUPABASE?.onSynced) window.CIFIKA_SUPABASE.onSynced(res);
      return res;
    } catch (e) {
      syncedRefs.delete(data.ref); // allow retry
      console.error('[CIFIKA] Supabase sync failed:', e.message);
      return { status: 'error', message: e.message };
    }
  }

  async function syncNow(overrideRef) {
    const data = collect();
    if (overrideRef) data.ref = String(overrideRef).toUpperCase();
    if (!data.ref)            return console.warn('[CIFIKA] Sync skipped — no ref generated yet.');
    if (!data.fullName || !data.email) return console.warn('[CIFIKA] Sync skipped — form incomplete.');
    if (syncedRefs.has(data.ref))      return { status: 'ok', cached: true };
    return send(data);
  }

  /* ---------- auto mode: watches #refNum, fires when a real ref appears ---------- */
  function armObserver() {
    const el = document.getElementById('refNum');
    if (!el) return;
    const mo = new MutationObserver(() => {
      const ref = findRef();
      if (!ref || syncedRefs.has(ref)) return;
      const snapshot = collect();       // snapshot immediately, before anything resets
      snapshot.ref = ref;
      syncedRefs.add(ref);
      setTimeout(() => send(snapshot), 500);
    });
    mo.observe(el, { childList: true, characterData: true, subtree: true });
  }

  function boot() {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload = armObserver;
    document.head.appendChild(s);
  }
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();

  window.CIFIKA_SUPABASE = { syncNow, collect, onSynced: null };
})();