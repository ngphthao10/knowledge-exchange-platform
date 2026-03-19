# SkillSwap – Manual Test Cases

**URL:** https://skillswap-two-gamma.vercel.app

**Test account A:** ngphthao031028@gmail.com / 123456

**Test account B:** hieu.english@demo.com / demo123456

---

## 1. Authentication

| # | Bước | Expected |
|---|------|----------|
| 1.1 | Truy cập `/dashboard` khi chưa đăng nhập | Redirect về `/login` |
| 1.2 | Đăng nhập với email/password sai | Hiện thông báo lỗi, ở lại trang login |
| 1.3 | Đăng nhập với account A | Redirect về `/dashboard`, hiện tên user |
| 1.4 | Click Sign out | Redirect về `/login`, không vào được `/dashboard` |

---

## 2. Profile & Skills

| # | Bước | Expected |
|---|------|----------|
| 2.1 | Vào `/profile`, thêm 1 skill vào "You teach" | Skill hiện ra dưới dạng badge |
| 2.2 | Thêm 1 skill vào "You want to learn" | Skill hiện ra, khác màu với teach |
| 2.3 | Xóa 1 skill vừa thêm | Skill biến mất |
| 2.4 | Vào mục **Future Skills**, nhập "Machine Learning" → Enter | Hiện badge màu amber |
| 2.5 | Xóa future skill vừa thêm | Badge biến mất |
| 2.6 | Điền bio → Save | Bio được lưu lại sau khi reload |

---

## 3. Discover

| # | Bước | Expected |
|---|------|----------|
| 3.1 | Vào `/discover` | Hiện danh sách user cards |
| 3.2 | Gõ tên skill vào ô tìm kiếm | Cards được lọc theo skill |
| 3.3 | Click **Connect** trên 1 user card | Nút đổi thành "Pending" hoặc "Requested" |
| 3.4 | User có Future Skills → badge Hourglass hiện ở card | Badge màu amber hiển thị tên skill |
| 3.5 | Nếu mình có thể dạy skill đó → nút **Pledge** xuất hiện | Pledge button có màu amber |
| 3.6 | Click **Pledge** | Nút đổi thành "Pledged", không click lại được |

---

## 4. Matches & Chemistry Score

| # | Bước | Expected |
|---|------|----------|
| 4.1 | Vào `/matches` | Hiện tabs: All / Pending / Connected / Declined / Futures |
| 4.2 | Click **Find matches** | Nút đổi "Searching…", sau đó hiện matches mới |
| 4.3 | Match card hiện 2 badge: **Skill %** và **⚡ Chemistry %** | Màu: tím ≥75%, vàng 45–75%, đỏ <45% |
| 4.4 | Hover/đọc phần chemistry explanation | Dòng text giải thích tại sao chemistry cao/thấp |
| 4.5 | Click **Accept** trên 1 match | Match chuyển sang tab "Connected" |
| 4.6 | Click **Decline** trên 1 match | Match chuyển sang tab "Declined" |
| 4.7 | Vào tab **Futures** | Hiện pledges đã gửi (outgoing) và nhận (incoming) |

---

## 5. Messages

| # | Bước | Expected |
|---|------|----------|
| 5.1 | Vào `/messages` | Hiện danh sách conversations |
| 5.2 | Click vào 1 conversation | Mở chat, hiện lịch sử tin nhắn |
| 5.3 | Gõ tin nhắn → Enter | Tin nhắn hiện ngay trong chat |
| 5.4 | Đăng nhập account B (tab khác) → mở cùng conversation | Tin nhắn real-time xuất hiện ở cả 2 bên |

---

## 6. Sessions

| # | Bước | Expected |
|---|------|----------|
| 6.1 | Vào `/sessions` | Hiện sessions list, view toggle: List / Table / Calendar |
| 6.2 | Switch sang **Table view** | Hiện dạng bảng có cột: Skill, Date, Duration, Role, Status |
| 6.3 | Switch sang **Calendar view** | Hiện calendar tuần, sessions được plot đúng giờ |
| 6.4 | Session đang scheduled → có nút **AI Coach** màu tím | Nút link đến `/sessions/[id]/live` |
| 6.5 | Session đã past + scheduled → có nút **Complete** | Click mở form nhập notes + confirm |
| 6.6 | Session completed → có nút **Rate** ⭐ | Click chọn 1–5 sao, lưu rating |

---

## 7. Ambient Session Coach (AI Feature)

| # | Bước | Expected |
|---|------|----------|
| 7.1 | Click **AI Coach** trên session card | Mở trang `/sessions/[id]/live` |
| 7.2 | Trang live hiện: heading "Live Session", skill topic, trạng thái "Paused" | Layout đúng |
| 7.3 | Click **Start mic** → cho phép microphone | Trạng thái đổi thành "Listening" (chấm đỏ nhấp nháy) |
| 7.4 | Nói chuyện tự nhiên trong ~15 giây | Transcript xuất hiện bên dưới |
| 7.5 | Sau 15s AI xử lý | Hint cards xuất hiện: tím = Teacher hint, xanh = Learner hint |
| 7.6 | Click **×** trên hint card | Card biến mất |
| 7.7 | Click **Pause mic** | Trạng thái về "Paused", ngừng ghi |
| 7.8 | Click **End & summarize** | Loading spinner, sau đó hiện summary 3–5 bullet points |
| 7.9 | Click **Back to sessions** | Về `/sessions`, session notes đã được update |

---

## 8. Learning Path

| # | Bước | Expected |
|---|------|----------|
| 8.1 | Vào `/learning-path` | Hiện learning paths đã tạo hoặc empty state |
| 8.2 | Generate learning path cho 1 skill | AI trả về roadmap với milestones và resources |
| 8.3 | Check/uncheck milestone | State được lưu lại |

---

## 9. Skill Assessment

| # | Bước | Expected |
|---|------|----------|
| 9.1 | Vào Profile → click **Assess** trên 1 skill | Mở trang assessment |
| 9.2 | Trả lời các câu hỏi AI đưa ra | AI đánh giá level: Beginner / Intermediate / Advanced |
| 9.3 | Kết quả hiện và được lưu vào profile | Level cập nhật trên badge skill |

---

## Pass/Fail

| Section | Pass | Fail | Notes |
|---------|------|------|-------|
| 1. Auth | | | |
| 2. Profile | | | |
| 3. Discover | | | |
| 4. Matches + Chemistry | | | |
| 5. Messages | | | |
| 6. Sessions | | | |
| 7. AI Session Coach | | | |
| 8. Learning Path | | | |
| 9. Assessment | | | |
