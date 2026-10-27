CIFIKA CLUB SYSTEM — v2.2.1
City Fitness Karate Club • Powered by TTOSR

════════════════════════════════════════════════════
FILES IN THIS PACKAGE
════════════════════════════════════════════════════
  portal.html        Member portal (responsive + PWA): balance, renewal
                     alerts, training days, grading entry, belt review status
  attendance.html    Dojo QR check-in — single member AND new
                     PARENT/FAMILY tab (check in many IDs at once)
  frontdesk.html     Front desk console: today's check-ins (time + late
                     chip + remark), walk-up check-in, renewal alerts,
                     FULL registered-clients roster, payments, packages
  admin.html         Admin console: dashboard, members, QR generator,
                     NEW Check-in Log (exact time per ID + remarks),
                     NEW Consistency (weekly 2-session tracking),
                     payments oversight, belt reviews, grading windows
  manifest.json      PWA manifest (used by portal/attendance/frontdesk)
  sw.js              Service worker (cache version cifika-v2)
  icons/             PWA icons
  cifika_sessions_schema.sql   BASE migration — run once (if not already run)
  cifika_v2_migration.sql      NEW — run once: check-in log + consistency
                               analytics RPCs

════════════════════════════════════════════════════
SETUP — SQL (2 minutes)
════════════════════════════════════════════════════
1. Supabase → SQL Editor → paste ALL of cifika_sessions_schema.sql → Run.
   v2.2.1 FIX: this file now creates TABLES first and functions after —
   the old version failed with  ERROR: relation "payments" does not exist
   because a helper function referenced payments before it was created.
   The fixed file runs top-to-bottom cleanly and is safe to re-run even
   after a half-finished attempt.
2. Supabase → SQL Editor → paste ALL of cifika_v2_migration.sql → Run.
   Needed for: Admin → Check-in Log + Admin → Consistency.
   Everything else works without it, but run it anyway.
3. If a pasted SQL ever fails midway, just fix/re-paste and run the WHOLE
   file again — every statement is IF NOT EXISTS / OR REPLACE, so re-running
   never duplicates data or breaks anything.

════════════════════════════════════════════════════
SETUP — UPLOAD (the "raw code on the page" fix)
════════════════════════════════════════════════════
If admin.html ever shows JavaScript code as text (or the console says
"Uncaught SyntaxError: Unexpected end of input"), the file on your host
is NOT the file from this package — it got truncated or mangled, most
often by COPY-PASTING the code through a chat app instead of using the
file download (chat pipelines silently eat character sequences like [m
and can cut long files). Do NOT copy-paste page code from any chat —
always use the file/zip download button. Then:

1. Download FRESH copies of these files — do NOT open them in Word,
   Google Docs, or any editor that could re-save them.
2. Upload ALL files into the SAME folder on your host (the same folder
   where registration.html and assets/ live).
3. Open the site with a HARD REFRESH: Ctrl+Shift+R (Windows)
   or hold refresh on mobile → "Clear cache and hard reload".
4. VERIFY: the admin header must show a small  v2.2  badge next to
   "CIFIKA ADMIN". If you don't see v2.2, you're on an old cached copy.
5. If you still see code: your host is serving the file as plain text —
   make sure the file is named admin.html (not admin.html.txt) and that
   you're opening it from your web host's URL, not from a file-preview
   app (Google Drive / WhatsApp preview / chat viewers show raw code).

Also new in v2.2: if JavaScript fails for any reason, a red banner at
the bottom tells you exactly that instead of a blank/broken page.

════════════════════════════════════════════════════
WHAT'S NEW IN v2.2
════════════════════════════════════════════════════
• ATTENDANCE — new PARENT/FAMILY tab: paste several CFK-xxxxx IDs
  (comma, space or new-line separated), tap CHECK IN ALL, and every
  member gets their own result card: name, exact time, on-time/late,
  sessions left, renewal colour, belt-review note. Max 10 at once.
• LATE RULE — checking in more than 15 minutes after the session start
  is recorded as LATE (server-side, Africa/Lagos time). Showed on the
  member's result, front desk today list and admin log.
• CHECK-IN REPORTING — Admin → Check-in Log: every ID's check-in time,
  ON TIME/LATE chip, source (QR or desk), light remark ("Early on the
  mat ⚡", "Late — 34 min after start", "2 sessions this week 🎯"),
  session-consumed + renewal colour, CSV export. Front desk → Today
  shows the same per row.
• CONSISTENCY — Admin → Consistency: week-by-week grid (target 2
  sessions/week), 🔥 streaks, 0-session watchlist, weekly rates.
• FRONT DESK — Members tab now shows ALL registered clients exactly
  like admin (including pending ones): status, belt, age, email, phone,
  guardian, emergency contact, medical notes, belt-review flag, balance.
• BELT REVIEWS — confirmed working end-to-end: members who register
  with prior karate experience KEEP their registered belt, the system
  flags them "Pending review by the Sensei" (portal, front desk and
  admin all show it), and Admin → Belt Reviews → Regularise sets the
  CIFIKA-standard belt. Make sure your registration→Supabase sync maps
  KarateRank/KarateYears into students.previous_rank / years_trained
  so the flag fires automatically on new registrations.

════════════════════════════════════════════════════
TRAINING SCHEDULE (defaults, WAT)
════════════════════════════════════════════════════
  Friday   4:30 – 6:00 PM
  Saturday 8:00 – 10:00 AM
  Sunday   4:30 – 6:00 PM   ← you wrote "4:30am"; change in
                              admin.html TRAINING_SCHEDULE if AM is real
Members pick 2 flexible days in their portal; 2 sessions/week = target.
