

## Judge Portal Enhancement Plan

### Current State
The app has: Dashboard with 3-priority columns, file upload with AI analysis, case detail page, streaming AI agent (chat/research/draft modes), and two database tables (`cases`, `evidence`) with public RLS.

### What Will Be Built (Incremental, Feasible Phases)

---

### Phase 1: Authentication System
**Database changes:**
- Create `profiles` table (id, user_id FK to auth.users, full_name, judge_id, avatar_url)
- Create `user_roles` table with `app_role` enum (judge, admin)
- Add `user_id` column to `cases` table
- Update RLS policies on `cases` and `evidence` to require auth
- Auto-create profile trigger on signup

**Frontend:**
- Login/Signup pages (email + password)
- Protected route wrapper (redirect to /login if unauthenticated)
- Session timeout after 15 min inactivity (listener on mouse/keyboard, auto-logout)
- Password reset flow with `/reset-password` page
- Auth context provider

---

### Phase 2: Enhanced Dashboard + Priority Scoring
**Database changes:**
- Add columns to `cases`: `priority_score` (integer 0-100), `risk_breakdown` (jsonb), `status` (text, default "pending"), `facts` (jsonb), `highlights` (jsonb)

**Update `analyze-case` edge function:**
- Return `priority_score` (0-100), `risk_breakdown` ({violence, fraud, child_involvement, financial_damage} as percentages)
- Add "Very High" priority level (score 80+)
- Extract `facts[]` and `highlights[]`

**Dashboard UI:**
- Stat cards: Total Cases, High Priority, ODR, Mediation, Backlog Reduction %
- Case inflow vs resolved bar chart (by month, using Recharts)
- Priority distribution donut chart
- 4-color priority system: Red (Very High), Orange (High), Yellow (Medium), Green (Low)
- 4 priority columns instead of 3

---

### Phase 3: Decision Actions + History
**Database changes:**
- Create `decision_history` table (id, case_id, user_id, action, notes, created_at)
- Enable realtime on `cases` for status updates

**Case Detail page additions:**
- Action buttons: Send to Court, Send to Mediation, Send to ODR, Mark as Reviewed
- Decision history timeline section
- Update case status on action

---

### Phase 4: AI Insight Panel + Explainable AI
**Case Detail page additions:**
- Risk breakdown radar/bar chart (violence %, fraud %, child involvement %, financial damage %)
- AI explanation section: "Why this case is high priority" with bullet reasoning and confidence score
- Sentence recommendation section with legal reasoning and disclaimer
- Facts and highlights display sections

---

### Phase 5: Search, Filter & Backlog Simulator
**Dashboard additions:**
- Search bar (case title, keywords) with debounced input
- Filter dropdowns: priority, case type, date range, status
- New `/simulator` page with two sliders (% to ODR, % to Mediation)
- Real-time projection chart showing backlog reduction and yearly time savings

---

### Phase 6: Evidence Storage + Preview
**Database changes:**
- Create `case-files` storage bucket
- Add `file_url` column to `evidence` table

**UI:**
- PDF viewer (iframe embed)
- Image viewer with zoom
- File upload on case detail page linked to evidence

---

### Phase 7: Enhanced AI Agent
- Add "Legal Analysis" mode to the agent (extract IPC sections, sentence recommendations)
- Support writing entire case documents with proper Indian court formatting
- AI disclaimer on all outputs: "AI provides assistance only. Final decision rests with the judge."

---

### Out of Scope (Platform Limitations)
- 3D AI avatar with lip-sync (WebGL/Three.js too complex for this context)
- TTS/STT voice system (would need ElevenLabs connector, separate effort)
- WebRTC, MongoDB, Redis, Next.js (not supported on this platform)
- Video/audio streaming with watermarks

---

### Implementation Order
Phases 1-7 will be built sequentially. Phase 1 (auth) is foundational. Each phase is self-contained and functional on its own.

### Tech Stack (Actual)
- Frontend: React + Vite + Tailwind + Framer Motion + Recharts + React Query
- Backend: Supabase PostgreSQL + Edge Functions
- AI: Lovable AI Gateway (Gemini) with streaming
- State: React Query (no need for Zustand/Redux)

