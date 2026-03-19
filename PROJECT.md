# SkillSwap — Tài liệu giới thiệu dự án

---

## 1. Bối cảnh & Hiện trạng

Hiện nay, người muốn học một kỹ năng mới thường gặp hai lựa chọn:

- **Trả tiền học** — khóa online (Udemy, Coursera), gia sư, bootcamp. Chi phí cao, không linh hoạt về lịch, và kiến thức thường một chiều.
- **Tự học miễn phí** — YouTube, tài liệu. Thiếu tương tác, dễ mắc kẹt vì không có người giải đáp.

Trong khi đó, **mỗi người đều có điều gì đó để dạy người khác** — một lập trình viên có thể dạy Python, đổi lại học Piano từ một người bạn. Nhưng không có nền tảng nào kết nối điều này một cách có hệ thống.

---

## 2. Giải pháp: SkillSwap

**SkillSwap** là nền tảng trao đổi kỹ năng ngang hàng (peer-to-peer skill exchange), kết nối những người có kỹ năng muốn chia sẻ với những người muốn học — **hoàn toàn miễn phí**, dựa trên nguyên tắc "bạn dạy tôi cái này, tôi dạy bạn cái kia."

AI đóng vai trò trung tâm: phân tích hồ sơ người dùng, tính toán độ tương thích, và giải thích lý do hai người nên kết nối với nhau.

**Deployed tại:** https://skillswap-two-gamma.vercel.app

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | TailwindCSS v4, CSS custom properties |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth (email/password, Google OAuth) |
| AI | OpenAI-compatible API (gpt-4o-mini), hỗ trợ Ollama/LM Studio |
| Realtime | Supabase Realtime (WebSocket subscriptions) |
| Storage | Supabase Storage (credentials, portfolio) |
| Deployment | Vercel |

---

## 4. Tính năng đã hoàn thành

### 4.1 Onboarding thông minh
- Wizard 4 bước hướng dẫn người dùng từ đầu
- Chọn kỹ năng có thể dạy (tối đa 5) với level: Beginner / Intermediate / Advanced
- Chọn kỹ năng muốn học
- Đăng ký khung giờ rảnh (6 slot: sáng/chiều/tối × ngày thường/cuối tuần)
- Gợi ý kỹ năng theo category: Tech, Languages, Creative, Other

### 4.2 Discover & Matching
- Trang Discover: hiển thị toàn bộ người dùng (có phân loại số lượng: "22 of 22 members")
- Sort: **Newest** / **Top Rated**
- Filter theo level: All / Beginner / Intermediate / Advanced
- Filter theo khung giờ: Weekday AM/PM/Eve, Weekend AM/PM/Eve
- Filter **Compatible only** — chỉ hiển thị người phù hợp skill hai chiều
- Search theo tên, kỹ năng, hoặc bio
- Chủ động gửi Connect request từ Discover
- Trang Matches: quản lý kết nối theo tab **All / Pending / Connected / Declined**
- Nút Decline, Accept, Reconsider
- Sau khi Accept: hiện nút **Message** và **Book session** ngay trên card

### 4.3 Nhắn tin
- Chat trực tiếp với người match đã accept
- Supabase Realtime WebSocket *(đang có lỗi kết nối WebSocket trên production — xem mục Nhược điểm)*

### 4.4 Quản lý buổi học (Sessions)
- Đặt lịch buổi học với người match
- Tự động tạo Google Meet link (hiển thị "Join Google Meet")
- Dashboard widget "Next Session" với countdown timer
- Calendar schedule view
- Đánh giá sau buổi học (1–5 sao) và ghi chú
- Dashboard stats: Sessions completed, Active matches, Verified skills, Milestones done

### 4.5 Quản lý hồ sơ & Credentials
- Chỉnh sửa thông tin cá nhân, bio, kỹ năng, lịch rảnh
- Upload file xác minh: CV, chứng chỉ, giải thưởng, portfolio (JPG/PNG/PDF, tối đa 10MB)
- Profile công khai hiển thị đủ thông tin cho người khác đánh giá

### 4.6 Bảo mật & Rate Limiting
- Row Level Security (RLS) đảm bảo người dùng chỉ xem được dữ liệu của mình
- Rate limiting trên AI endpoints: 10 lần match/giờ, 5 lần learning path/giờ, 30 lần assessment/10 phút
- Admin client (service role) chỉ dùng server-side cho các operation cần bypass RLS

---

## 5. Tính năng AI (build riêng)

> Các tính năng này dùng AI (GPT-4o-mini) và có logic phức tạp hơn — tách riêng để dễ quản lý và iterate độc lập.

### AI-1: Match Explanation
- Tính điểm tương thích dựa trên **skill overlap hai chiều**: A dạy được B học, B dạy được A học
- AI sinh lý giải cụ thể tại sao hai người nên kết nối (hiển thị trên card trong trang Matches)
- API: `/api/ai/match`
- Rate limit: 10 lần/giờ

### AI-2: Skill Assessment
- Trợ lý AI hỏi 5–7 câu để đánh giá trình độ thực tế của người dùng
- Câu hỏi adaptive: điều chỉnh độ khó theo câu trả lời trước
- Kết quả: điểm số (0–100), level được xác nhận, nhận xét cụ thể
- Hồ sơ hiển thị badge **"Verified"** cho kỹ năng đã qua assessment
- Dashboard gợi ý "Verify skills with AI — Start with: [skill]"
- API: `/api/ai/assessment`
- Rate limit: 30 lần/10 phút

### AI-3: Learning Path Generator
- Dựa trên level hiện tại, level mục tiêu, và lịch sử buổi học
- AI tạo lộ trình 4 tuần với 6–8 milestones cụ thể
- Người dùng tick hoàn thành từng milestone, hiển thị % progress
- Có thể tạo lại lộ trình mới khi đã hoàn thành
- API: `/api/ai/learning-path`
- Rate limit: 5 lần/giờ

---

## 6. Kiến trúc hệ thống

```
User Browser
    │
    ▼
Next.js (Vercel Edge)
    ├── Static pages  (landing, login, register)
    ├── Server Components (dashboard, profile, sessions...)
    │       └── fetch data từ Supabase trực tiếp
    ├── API Routes (serverless functions)
    │       ├── /api/ai/match      → AI matching engine
    │       ├── /api/ai/assessment → Conversational AI assessor
    │       ├── /api/ai/learning-path → AI path generator
    │       ├── /api/messages      → Send message
    │       ├── /api/sessions      → CRUD sessions
    │       └── /api/credentials   → Upload/delete files
    └── Middleware (auth session refresh on every request)

Supabase
    ├── Auth (email verification, Google OAuth, session cookies)
    ├── PostgreSQL
    │       ├── profiles       (user info + skills + embeddings)
    │       ├── matches        (pairs + score + AI reason)
    │       ├── sessions       (scheduled lessons)
    │       ├── messages       (chat history)
    │       ├── learning_paths (AI-generated milestones)
    │       ├── assessment_sessions (conversation history)
    │       └── credentials    (file metadata)
    ├── Realtime (WebSocket pub/sub cho messages)
    └── Storage (credential files)

OpenAI API (gpt-4o-mini)
    ├── Match explanation generation
    ├── Skill assessment conversation
    └── Learning path generation
```

---

## 7. Database Schema (tóm tắt)

| Table | Mô tả |
|---|---|
| `profiles` | Hồ sơ người dùng: tên, bio, skills_teach[], skills_learn[], availability[], skill embeddings |
| `matches` | Cặp kết nối: user_a, user_b, match_score (0–1), match_reason (AI), status |
| `sessions` | Buổi học: teacher, learner, skill, thời gian, meet_link, rating, notes |
| `messages` | Tin nhắn: match_id, sender_id, content, created_at |
| `learning_paths` | Lộ trình: user, skill, current_level, target_level, milestones[] |
| `assessment_sessions` | Lịch sử chat assessment, final_score, final_level |
| `credentials` | File xác minh: type, title, file_url, file_size |

---

## 8. Ưu điểm

**Giá trị sản phẩm:**
- Mô hình trao đổi miễn phí — không cần tiền, chỉ cần thời gian và kiến thức
- AI matching giảm ma sát kết nối — không phải tự tìm kiếm thủ công
- Vừa dạy vừa học — cả hai bên đều được lợi trong một kết nối

**Kỹ thuật:**
- Kiến trúc server component + client component rõ ràng, dễ maintain
- Supabase RLS bảo vệ dữ liệu từ tầng database, không phụ thuộc vào logic app
- AI provider pluggable — có thể đổi từ OpenAI sang bất kỳ API tương thích nào (Ollama, LM Studio, self-hosted)
- Realtime messaging không cần WebSocket server riêng — tận dụng Supabase Realtime
- Rate limiting bảo vệ AI endpoints khỏi lạm dụng

---

## 9. Nhược điểm & Hạn chế hiện tại

**Kỹ thuật:**
- Rate limiting dùng **in-memory** — mỗi Vercel serverless instance có store riêng, không chia sẻ giữa các instance. Cần Upstash Redis cho production thực sự
- **Supabase Realtime WebSocket đang lỗi trên production** — console log nhiều lỗi `WebSocket connection to 'wss://...' failed`, ảnh hưởng tính năng chat realtime
- Chưa có **email notification** — người dùng không biết khi có match mới hoặc tin nhắn nếu không online
- Google Meet link được generate tự động nhưng **không phải link thật** — cần tích hợp Google Calendar API để tạo meeting thực sự
- Skill matching dựa trên **text similarity** — "JS" và "JavaScript" có thể không match nếu fuzzy matching bỏ sót

**Sản phẩm:**
- Chưa có cơ chế **trust/reputation** — người dùng không biết người kia có thực sự giỏi không trước khi kết nối (Assessment giải quyết một phần, nhưng chưa bắt buộc)
- Chưa có **video call tích hợp** — phụ thuộc Google Meet bên ngoài
- Chưa có **mobile app** — chỉ có web responsive
- Onboarding chưa có **email verification bắt buộc trước khi vào app** (Supabase có thể config được)
- Chưa có **payment/premium tier** nếu muốn monetize sau này

---

## 10. FAQ — Câu hỏi thường gặp

**"Tôi không có năng khiếu dạy học, có dùng được không?"**

Được — và đây là hiểu lầm phổ biến nhất về SkillSwap.

SkillSwap không phải nền tảng để làm giáo viên chuyên nghiệp. Nó hoạt động theo mô hình **peer learning** — học từ người ngang hàng, không phải từ chuyên gia đứng trên bục giảng.

Thực tế thú vị: người vừa học xong thường dạy tốt hơn chuyên gia. Vì họ còn nhớ cảm giác không biết gì, biết mình đã vấp ở đâu, và giải thích bằng ngôn ngữ người mới hiểu được — thay vì dùng thuật ngữ chuyên môn mà người học chưa quen.

Bên cạnh đó, bản thân việc dạy người khác là cách học hiệu quả nhất cho chính mình (Feynman Technique — bạn chỉ thực sự hiểu điều gì đó khi giải thích được nó cho người khác).

Trên SkillSwap, một buổi "dạy" có thể chỉ là: ngồi cùng nhau, bạn làm thử, mình chỉ chỗ sai, hỏi thêm — không cần giáo án, không cần kỹ năng sư phạm.

---

**"Kỹ năng của tôi bình thường, không ai muốn học đâu?"**

Mọi kỹ năng đều có người muốn học ở một thời điểm nào đó. Nấu ăn, Excel, chỉnh ảnh điện thoại, viết CV — những thứ bạn nghĩ ai cũng biết thực ra không phải ai cũng biết.

Matching trên SkillSwap là hai chiều: bạn không cần "giỏi hơn" người kia, chỉ cần **bạn có thứ họ chưa có, và họ có thứ bạn muốn học**.

---

**"Làm sao biết người kia đáng tin? Lỡ gặp người xấu?"**

Hiện tại SkillSwap có một số lớp bảo vệ cơ bản: tài khoản yêu cầu xác thực email, hồ sơ công khai với thông tin kỹ năng và bio, và hệ thống đánh giá sau mỗi buổi học. AI Skill Assessment cũng giúp xác minh trình độ thực tế — người đã qua assessment có badge "Verified" trên hồ sơ.

Về lâu dài, reputation system tích lũy từ nhiều buổi học sẽ là lớp trust mạnh nhất — tương tự cách Airbnb hay Grab xây dựng niềm tin qua rating hai chiều. Đây là tính năng trong roadmap.

Quan trọng hơn: các buổi học đầu tiên hoàn toàn có thể diễn ra online qua Google Meet — không cần gặp mặt trực tiếp nếu chưa tin tưởng.

---

**"Nếu người kia bùng lịch, không dạy nữa thì sao?"**

Rủi ro này có thật và không thể loại bỏ hoàn toàn — tương tự như hẹn gặp bạn bè hay đồng nghiệp. Tuy nhiên mô hình trao đổi hai chiều tạo động lực tự nhiên để cả hai giữ cam kết: nếu bạn bùng người kia, bạn cũng mất đi người dạy mình.

Về kỹ thuật, hệ thống rating sau buổi học và lịch sử sessions được lưu lại, tạo áp lực xã hội nhẹ để duy trì cam kết. Tính năng nhắc lịch và email notification là bước tiếp theo trong roadmap.

---

**"Học từ người không chuyên thì có đảm bảo chất lượng không? Lỡ họ dạy sai?"**

Đây là trade-off rõ ràng của mô hình peer learning: bạn đổi "chuyên môn có kiểm chứng" lấy "chi phí bằng 0 và lịch linh hoạt".

Tuy nhiên rủi ro bị dạy sai thấp hơn người ta nghĩ vì hai lý do: (1) AI Assessment xác minh trình độ thực tế trước khi người dùng được xem là "người dạy" kỹ năng đó; (2) người học cũng có thể tự kiểm chứng qua thực hành — học xong làm được hay không là thước đo rõ nhất.

SkillSwap phù hợp nhất cho **kỹ năng thực hành có thể kiểm chứng ngay** (lập trình, ngoại ngữ, nhạc cụ) hơn là kiến thức lý thuyết chuyên sâu cần bằng cấp.

---

**"Khác gì so với italki, Preply, hay học YouTube?"**

| | SkillSwap | italki / Preply | YouTube |
|---|---|---|---|
| Chi phí | Miễn phí (trao đổi) | Trả tiền/giờ | Miễn phí |
| Tương tác | Hai chiều, cá nhân hóa | Một chiều (thầy–trò) | Một chiều |
| Lịch linh hoạt | Thỏa thuận tự do | Theo slot của gia sư | Xem bất cứ lúc nào |
| Bạn cũng dạy lại | Có — bạn chia sẻ kỹ năng của mình | Không | Không |
| AI matching | Có | Không | Không |
| Phạm vi kỹ năng | Mọi kỹ năng | Chủ yếu ngoại ngữ | Mọi thứ nhưng chung chung |

italki và Preply là nền tảng thương mại — gia sư kiếm tiền, học viên trả tiền. SkillSwap là nền tảng cộng đồng — không ai trả tiền, mọi người trao đổi giá trị trực tiếp.

---

**"App miễn phí thì kiếm tiền bằng gì? Sau này có tính phí không?"**

Hiện tại SkillSwap đang ở giai đoạn xây dựng cộng đồng — ưu tiên số 1 là có đủ người dùng để matching hoạt động tốt. Chưa có kế hoạch tính phí với người dùng cá nhân trong thời gian gần.

Các hướng monetize tiềm năng không ảnh hưởng đến trải nghiệm cơ bản:
- **Premium tier**: tính năng nâng cao (ưu tiên matching, analytics học tập, không giới hạn learning path)
- **B2B**: công ty trả để nhân viên dùng SkillSwap cho internal knowledge sharing
- **Verified credentials**: dịch vụ xác minh kỹ năng có giá trị tuyển dụng

Core experience — trao đổi kỹ năng, chat, đặt lịch — sẽ luôn miễn phí.

---

**"Tại sao không dùng tiền thay vì trao đổi cho đơn giản hơn?"**

Tiền đơn giản hơn về mặt logistics, nhưng thay đổi hoàn toàn dynamics của mối quan hệ. Khi có tiền, một bên là "khách hàng" và bên kia là "nhà cung cấp dịch vụ" — tạo ra kỳ vọng, áp lực, và rào cản gia nhập (ai cũng phải tự hỏi "mình có đủ giỏi để thu tiền không?").

Mô hình trao đổi giữ cả hai bên ở vị thế **ngang hàng**: không ai phục vụ ai, hai người cùng giúp nhau. Điều này tạo môi trường học thoải mái hơn và hạ thấp ngưỡng tham gia — bạn không cần tự định giá bản thân, chỉ cần có thứ gì đó để chia sẻ.

---

**"Nếu không tìm được ai match thì sao?"**

Đây là vấn đề cold start thực tế của bất kỳ marketplace nào — giá trị tăng theo số người dùng. Trong giai đoạn đầu, matching có thể hạn chế ở một số kỹ năng phổ biến.

Giải pháp hiện tại: trang Discover cho phép chủ động xem và kết nối với bất kỳ người dùng nào, không cần chờ AI gợi ý. Về lâu dài, mở rộng sang các thành phố và cộng đồng cụ thể (tech community, language learners...) sẽ tạo density đủ lớn để matching hoạt động tốt.

---

**"Hai người ở múi giờ khác nhau thì sắp xếp lịch kiểu gì?"**

Profile người dùng lưu timezone và khung giờ rảnh (sáng/chiều/tối theo ngày thường và cuối tuần). AI matching có thể tính đến availability overlap khi gợi ý — đây là tính năng đang trong roadmap để tự động hóa.

Hiện tại, sau khi match thành công, hai người chat trực tiếp để thỏa thuận lịch — linh hoạt hơn bất kỳ hệ thống booking cứng nhắc nào.

---

**"Hiện tại có bao nhiêu người dùng? Ít người thì match kiểu gì?"**

SkillSwap hiện đang trong giai đoạn beta — số lượng người dùng còn nhỏ. Đây là thách thức kinh điển của mọi two-sided marketplace: cần người dùng để có giá trị, nhưng cần giá trị để thu hút người dùng.

Chiến lược giai đoạn đầu: tập trung vào một nhóm cộng đồng cụ thể (ví dụ: sinh viên IT, cộng đồng học ngoại ngữ) thay vì mở rộng đại trà. Density trong một nhóm nhỏ hiệu quả hơn độ phủ rộng với mật độ thấp.

---

## 11. Roadmap tiềm năng

| Priority | Feature | Ghi chú |
|---|---|---|
| Cao | Fix Supabase Realtime WebSocket lỗi trên production | Đang ảnh hưởng chat realtime |
| Cao | Email notifications (new match, message) | — |
| Cao | Upstash Redis cho rate limiting production | Thay in-memory hiện tại |
| Cao | Google Calendar API — tạo meeting thật | Meet link hiện chỉ là placeholder |
| Trung | Reputation system — rating tổng hợp từ các buổi học | — |
| Trung | Group sessions — 1 người dạy nhiều người | — |
| Thấp | Mobile app (React Native hoặc PWA) | — |
| Thấp | Skill marketplace — offer/request cụ thể hơn | — |
| Thấp | Tích hợp video call (Daily.co, Whereby) | — |
