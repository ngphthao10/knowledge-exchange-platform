# SkillSwap — WOW Features Plan (Hackathon)

3 features độc lập, build trong 2 ngày. Thứ tự: Feature 4 → 3 → 1.

---

## Feature 4 — Chemistry Score *(6 giờ)*

> Match không chỉ skill — mà cả phong cách học. Enhance matching đang có, không cần UI mới phức tạp.

### DB migration `006_chemistry.sql`
```sql
ALTER TABLE profiles ADD COLUMN learning_style jsonb;
ALTER TABLE matches ADD COLUMN chemistry_score float;
```

### Bước 1 — API `/api/ai/chemistry/route.ts`
- Input: `{ userAId, userBId }`
- Claude phân tích bio + skills + availability → infer learning style (visual/hands-on/theoretical/structured)
- Tính chemistry score (0–1) + 1 câu giải thích
- Lưu vào `matches.chemistry_score`

### Bước 2 — Tích hợp vào matching flow (`/lib/ai/matching.ts`)
- Sau khi tính `skill_overlap_score`, gọi thêm chemistry analysis
- `final_score = skill_score * 0.7 + chemistry_score * 0.3`

### Bước 3 — UI `MatchCard.tsx`
- Thêm chemistry % bên cạnh match score
- Color: xanh >80%, vàng 40–80%, đỏ <40% + cảnh báo
- Tooltip: "A học tốt qua ví dụ thực tế, B dạy lý thuyết trước — 41%"

---

## Feature 3 — Skill Futures *(1 ngày)*

> Exchange kỹ năng bạn đang học — chưa có. Concept hoàn toàn mới.

### DB migration `007_skill_futures.sql`
```sql
CREATE TABLE skill_futures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  current_level text,
  target_level text,
  estimated_weeks int,
  ai_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE future_pledges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pledger_id uuid REFERENCES profiles(user_id),
  receiver_id uuid REFERENCES profiles(user_id),
  pledger_skill text NOT NULL,
  future_skill text NOT NULL,
  sessions_pledged int DEFAULT 5,
  sessions_delivered int DEFAULT 0,
  status text DEFAULT 'active',  -- active/completed/cancelled
  created_at timestamptz DEFAULT now()
);
```

### Bước 1 — Profile page — section "Skills I'm learning"
- Form: tên skill + expected weeks + current progress
- Lưu vào `skill_futures`
- Badge "Future · 8 tuần" trên profile công khai

### Bước 2 — Discover page
- Users có future skills hiện badge khác màu: "Future: Python · 8 tuần"
- Filter mới: "Include futures" toggle

### Bước 3 — API `/api/ai/futures/route.ts`
- `POST` — tạo pledge: A gửi 5 Figma sessions → đặt cọc nhận 5 Python sau 8 tuần
- `GET` — list pledges của user
- AI verification: khi assessment đạt target level → mark `ai_verified = true` + update pledge

### Bước 4 — Matches page
- Tab mới: "Futures" bên cạnh Pending/Connected/Declined
- Card: "Bạn dạy Figma (5 buổi) → nhận Python khi họ đạt Intermediate"
- Progress bar: học được đến đâu rồi

### Bước 5 — Link với Assessment
- Sau mỗi assessment, check `skill_futures` cho skill đó
- Nếu đạt target → trigger `ai_verified = true` → notify pledger

---

## Feature 1 — Ambient Session Coach *(1 ngày)*

> AI quan sát buổi học và coach cả 2 bên live. Không ai có cái này.

**Không cần DB mới** — lưu summary vào `sessions.notes`.

### Bước 1 — Nút "Start AI Coach" trên `SessionCard.tsx`
- Hiện khi session status = `scheduled` và đang trong giờ
- Click → navigate `/sessions/[id]/live`

### Bước 2 — Page `/sessions/[sessionId]/live/page.tsx`
- Thông tin session: ai dạy, ai học, skill gì
- Chia đôi UI: Teacher hints | Learner hints
- Nút "Start Listening" → request microphone

### Bước 3 — Transcription (`LiveSessionRoom.tsx`)
```typescript
const recognition = new webkitSpeechRecognition()
recognition.continuous = true
recognition.interimResults = true
// Mỗi 15 giây → flush transcript → gửi lên API
```

### Bước 4 — API `/api/ai/session-coach/route.ts`
- Input: `{ sessionId, transcript, skillTopic }`
- Teacher prompt: "Learner chưa hiểu gì? Gợi ý 1 câu ngắn cho người dạy"
- Learner prompt: "Câu hỏi hay để hỏi ngay lúc này"
- Output: `{ teacherHint: string, learnerHint: string }`
- Cuối session: generate summary → PATCH `sessions.notes`

### Bước 5 — UI hints
- Toast nhẹ, không interrupt, tự dismiss sau 20 giây
- Teacher: "B chưa hiểu khái niệm vừa rồi — thử ví dụ thực tế?"
- Learner: "Câu hay để hỏi: 'Khi nào dùng X thay vì Y?'"

---

## Timeline

| Thời gian | Feature | Task |
|---|---|---|
| Ngày 1 sáng | Chemistry Score | DB migration + API + UI | ~6h |
| Ngày 1 chiều | Skill Futures | DB migration + Profile page | ~4h |
| Ngày 2 sáng | Skill Futures | Discover + Matches + API | ~5h |
| Ngày 2 chiều | Ambient Session Coach | Full feature | ~5h |

---

## Files cần tạo/sửa

### Chemistry Score
- `src/supabase/migrations/006_chemistry.sql` ← new
- `src/app/api/ai/chemistry/route.ts` ← new
- `src/lib/ai/chemistry.ts` ← new
- `src/lib/ai/matching.ts` ← update score formula
- `src/components/matching/MatchCard.tsx` ← update UI
- `src/app/(dashboard)/discover/page.tsx` ← update card display

### Skill Futures
- `src/supabase/migrations/007_skill_futures.sql` ← new
- `src/app/api/ai/futures/route.ts` ← new
- `src/app/(dashboard)/profile/page.tsx` ← add futures section
- `src/app/(dashboard)/discover/page.tsx` ← add future badge + filter
- `src/app/(dashboard)/matches/page.tsx` ← add Futures tab
- `src/components/futures/FuturePledgeCard.tsx` ← new

### Ambient Session Coach
- `src/app/api/ai/session-coach/route.ts` ← new
- `src/app/(dashboard)/sessions/[sessionId]/live/page.tsx` ← new
- `src/components/sessions/LiveSessionRoom.tsx` ← new
- `src/components/sessions/SessionCard.tsx` ← add "Start AI Coach" button
