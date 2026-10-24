import { LessonPlan } from '../types/lesson';

export const SAMPLE_LESSONS: LessonPlan[] = [
  {
    id: 'sample-toan-8-pythagore',
    title: 'Bài 9: Định lí Pythagore và ứng dụng',
    subject: 'Toán học',
    grade: 'Lớp 8',
    curriculum: 'Kết nối tri thức với cuộc sống (NXB Giáo dục VN)',
    duration: '2 tiết (90 phút)',
    standardFormat: 'CV5512',
    teachingMethod: 'Dạy học khám phá kết hợp phương pháp khăn trải bàn và thực hành cắt dán hình',
    teachingTools: 'Máy chiếu, mô hình ghép hình chứng minh Pythagore, thước đo, êke, Phiếu học tập số 1 và 2',
    targetAudienceProfile: 'Lớp học sôi nổi, thích trải nghiệm mô hình trực quan',
    createdAt: '2026-10-10T08:00:00.000Z',
    updatedAt: '2026-10-10T08:00:00.000Z',
    tags: ['Toán 8', 'Hình học', 'CV5512', 'Pythagore'],
    teacherName: 'Nguyễn Văn An',
    schoolName: 'Trường THCS Lê Quý Đôn',
    content: `# KẾ HOẠCH BÀI DẠY
## MÔN: TOÁN HỌC - LỚP 8
### BÀI 9: ĐỊNH LÍ PYTHAGORE (Thời lượng: 2 tiết)
**Bộ sách:** Kết nối tri thức với cuộc sống

---

### I. MỤC TIÊU
#### 1. Về kiến thức
- Học sinh phát biểu được định lí Pythagore về mối quan hệ giữa ba cạnh trong tam giác vuông.
- Học sinh phát biểu được định lí Pythagore đảo và biết cách vận dụng để kiểm tra một tam giác có vuông hay không.
- Vận dụng định lí Pythagore tính độ dài một cạnh của tam giác vuông khi biết hai cạnh còn lại và giải các bài toán thực tiễn đơn giản (tính chiều cao bức tường, độ dài thang, khoảng cách hai điểm).

#### 2. Về năng lực
- **Năng lực chung:**
  - *Năng lực tự chủ và tự học:* Tự giác nghiên cứu SGK, tích cực thực hiện hoạt động ghép hình khám phá định lí.
  - *Năng lực giao tiếp và hợp tác:* Thảo luận nhóm hiệu quả bằng kĩ thuật khăn trải bàn, lắng nghe và phản biện ý kiến của bạn bè.
  - *Năng lực giải quyết vấn đề và sáng tạo:* Phát hiện mối liên hệ giữa diện tích các hình vuông dựng trên ba cạnh tam giác vuông để suy ra hệ thức $a^2 + b^2 = c^2$.
- **Năng lực đặc thù:**
  - *Năng lực tư duy và lập luận toán học:* Chứng minh định lí thông qua quan sát trực quan ghép hình.
  - *Năng lực mô hình hóa toán học:* Chuyển bài toán thực tế chiếc thang tựa vào tường thành mô hình tam giác vuông để giải quyết.

#### 3. Về phẩm chất
- **Chăm chỉ:** Tích cực phát biểu, tỉ mỉ trong việc cắt ghép hình và tính toán độ dài.
- **Trung thực:** Ghi chép số liệu đo đạc chính xác, đánh giá công bằng sản phẩm học tập của bạn.
- **Trách nhiệm:** Hoàn thành nhiệm vụ được nhóm phân công trong phần bài tập dự án thực tế.

---

### II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
1. **Giáo viên:**
   - Kế hoạch bài dạy, bài trình chiếu PowerPoint tương tác.
   - 04 bộ mô hình gỗ/giấy ghép hình chứng minh định lí Pythagore (bộ 8 tam giác vuông bằng nhau và 2 hình vuông cạnh $a+b$).
   - Phiếu học tập số 1 (Khám phá), Phiếu học tập số 2 (Luyện tập phân hóa).
2. **Học sinh:**
   - SGK Toán 8, vở ghi, thước thẳng có vạch chia, êke, máy tính cầm tay.
   - Kéo cắt giấy, giấy kẻ ô li để làm việc nhóm.

---

### III. TIẾN TRÌNH DẠY HỌC

#### HOẠT ĐỘNG 1: MỞ ĐẦU (KHỞI ĐỘNG) (7 phút)
**a) Mục tiêu:**
- Tạo tâm thế hào hứng, gợi mở nhu cầu tìm hiểu mối liên hệ giữa các cạnh của tam giác vuông từ bài toán đo đạc thực tế của thợ xây dựng Ai Cập cổ đại.

**b) Nội dung:**
- GV trình chiếu hình ảnh người thợ xây dựng sử dụng sợi dây thắt 12 nút cách đều nhau để tạo góc vuông khi xây kim tự tháp.
- Đặt câu hỏi: *"Tại sao một tam giác có các cạnh tỉ lệ 3 : 4 : 5 lại luôn là tam giác vuông? Giữa độ dài các cạnh của tam giác vuông có mối liên hệ kỳ diệu nào?"*

**c) Sản phẩm:**
- Dự đoán ban đầu của học sinh: Nhận ra độ dài $3^2 + 4^2 = 9 + 16 = 25 = 5^2$.

**d) Tổ chức thực hiện:**
- **Bước 1: Chuyển giao nhiệm vụ:** GV chiếu hình ảnh bài toán chiếc thang tựa vào tường hoặc sợi dây 12 nút của người Ai Cập. Yêu cầu HS suy nghĩ cá nhân trong 2 phút.
- **Bước 2: Thực hiện nhiệm vụ:** HS quan sát hình ảnh, thảo luận cặp đôi về mối liên hệ giữa các con số 3, 4, 5.
- **Bước 3: Báo cáo, thảo luận:** Đại diện 2 HS nêu ý kiến suy đoán của mình trước lớp.
- **Bước 4: Kết luận, nhận định:** GV nhận xét và dẫn dắt: *"Từ hơn 2500 năm trước, nhà toán học Hy Lạp Pythagore đã phát hiện ra một định lí bất hủ giải thích hiện tượng này. Hôm nay chúng ta cùng khám phá Định lí Pythagore."*

---

#### HOẠT ĐỘNG 2: HÌNH THÀNH KIẾN THỨC MỚI (45 phút)
##### Mục 1: Định lí Pythagore
**a) Mục tiêu:**
- Phát hiện và phát biểu được định lí Pythagore: Trong một tam giác vuông, bình phương của cạnh huyền bằng tổng các bình phương của hai cạnh góc vuông.

**b) Nội dung:**
- Thực hiện hoạt động ghép hình (Hoạt động khám phá trên Phiếu học tập số 1).
- Quan sát hai hình vuông lớn bằng nhau có cạnh cùng bằng $a+b$.
- So sánh phần diện tích còn lại sau khi trừ đi 4 tam giác vuông bằng nhau.

**c) Sản phẩm:**
- HS hoàn thành Phiếu học tập số 1:
  - Diện tích hình vuông lớn: $S = (a+b)^2$.
  - Ở hình 1: Diện tích 4 tam giác vuông $+ c^2$.
  - Ở hình 2: Diện tích 4 tam giác vuông $+ a^2 + b^2$.
  - Rút ra kết luận: $c^2 = a^2 + b^2$.
- Phát biểu chuẩn định lí: Trong tam giác vuông $ABC$ vuông tại $A$, ta có: $BC^2 = AB^2 + AC^2$.

**d) Tổ chức thực hiện:**
- **Bước 1 (Chuyển giao nhiệm vụ):** GV chia lớp thành các nhóm 4 học sinh, phát bộ mảnh ghép hình và Phiếu học tập số 1. Yêu cầu các nhóm ghép 4 tam giác vuông vào hai hình vuông cạnh $a+b$ và tính diện tích phần trắng.
- **Bước 2 (Thực hiện nhiệm vụ):** Các nhóm thực hành thao tác cắt ghép, ghi nhận kết quả diện tích vào phiếu. GV đi quanh quan sát, hướng dẫn các nhóm gặp khó khăn.
- **Bước 3 (Báo cáo, thảo luận):** Nhóm 1 và nhóm 3 cử đại diện mang sản phẩm lên bảng dán và thuyết minh kết quả so sánh diện tích. Các nhóm khác theo dõi, đặt câu hỏi phản biện.
- **Bước 4 (Kết luận, nhận định):** GV chuẩn hóa kiến thức bằng hoạt hình mô phỏng chuyển động nước đổ đầy từ hai bình $a^2, b^2$ sang bình $c^2$. Ghi bảng nội dung định lí đóng khung trang trọng.

##### Mục 2: Định lí Pythagore đảo
**a) Mục tiêu:**
- Nắm vững định lí đảo: Nếu một tam giác có bình phương của một cạnh bằng tổng các bình phương của hai cạnh kia thì tam giác đó là tam giác vuông.

**b) Nội dung:**
- Xét tam giác có độ dài ba cạnh là 6 cm, 8 cm, 10 cm. Kiểm tra $6^2 + 8^2 = 36 + 64 = 100 = 10^2$. Dùng êke đo góc đối diện cạnh 10 cm.

**c) Sản phẩm:**
- Lời giải bài tập kiểm tra tam giác vuông chính xác.

**d) Tổ chức thực hiện:**
- Tổ chức theo hình thức vấn đáp gợi mở kết hợp thực hành cá nhân kiểm tra bằng dụng cụ đo thực tế.

---

#### HOẠT ĐỘNG 3: LUYỆN TẬP (25 phút)
**a) Mục tiêu:**
- Củng cố kĩ năng tính cạnh tam giác vuông và nhận biết tam giác vuông.

**b) Nội dung:**
- Hoàn thành Phiếu học tập số 2 gồm 4 bài toán:
  - Bài 1: Cho tam giác vuông có $AB = 5\\text{ cm}, AC = 12\\text{ cm}$. Tính độ dài cạnh huyền $BC$.
  - Bài 2: Cho tam giác vuông có cạnh huyền $17\\text{ cm}$, một cạnh góc vuông là $15\\text{ cm}$. Tính cạnh còn lại.
  - Bài 3: Kiểm tra các bộ ba số sau có tạo thành tam giác vuông không: a) 9, 12, 15; b) 7, 8, 10.
  - Bài 4 (Trắc nghiệm nhanh Quiz): 4 câu hỏi nhận biết qua Plickers / bảng con.

**c) Sản phẩm:**
- Bài làm trên vở và Phiếu học tập số 2 của học sinh.

**d) Tổ chức thực hiện:**
- **Bước 1:** GV giao Phiếu học tập số 2, quy định thời gian làm việc cá nhân 10 phút, sau đó đổi chéo bài chấm điểm.
- **Bước 2:** HS độc lập tính toán, sử dụng máy tính cầm tay hỗ trợ căn bậc hai.
- **Bước 3:** Gọi 2 HS lên bảng trình bày hai bài toán tiêu biểu. Lớp nhận xét bài bạn.
- **Bước 4:** GV chấm điểm ngẫu nhiên 5 bài, nhận xét các lỗi sai phổ biến (như quên bình phương, nhầm lẫn cạnh huyền và cạnh góc vuông).

---

#### HOẠT ĐỘNG 4: VẬN DỤNG VÀ MỞ RỘNG (13 phút)
**a) Mục tiêu:**
- Vận dụng định lí vào tình huống đời sống: An toàn khi dùng thang và tính đường chéo màn hình tivi.

**b) Nội dung:**
- Tình huống thực tế: *"Một chiếc thang dài 4 mét tựa vào bức tường thẳng đứng. Chân thang cách tường 1,5 mét. Hỏi đầu trên của thang đạt độ cao bao nhiêu mét so với mặt đất? Khoảng cách này có đảm bảo an toàn theo khuyến cáo không?"*

**c) Sản phẩm:**
- Lời giải mô hình hóa: Gọi khoảng cách từ chân tường đến đầu thang là $h$.
- Áp dụng định lí Pythagore: $h^2 + 1,5^2 = 4^2 \\Rightarrow h = \\sqrt{16 - 2,25} = \\sqrt{13,75} \\approx 3,71\\text{ mét}$.

**d) Tổ chức thực hiện:**
- **Bước 1:** GV nêu tình huống trên slide, liên hệ kỹ năng an toàn lao động trong gia đình.
- **Bước 2:** HS thảo luận cặp bàn phác thảo hình vẽ mô hình tam giác vuông và tính toán.
- **Bước 3:** Đại diện cặp đôi nêu kết quả và giải thích ý nghĩa thực tiễn.
- **Bước 4:** GV tổng kết, giao nhiệm vụ về nhà đo kích thước màn hình tivi nhà mình (dài, rộng) để tính số inch.

---

### IV. HỒ SƠ DẠY HỌC & ĐÁNH GIÁ (PHỤ LỤC)

#### 1. PHIẾU HỌC TẬP SỐ 1 (Khám phá Định lí Pythagore)
\`\`\`
TRƯỜNG THCS: .......................................   LỚP: 8.....
HỌ VÀ TÊN HỌC SINH: .............................   NHÓM: ......

NHIỆM VỤ: KHÁM PHÁ BÌNH PHƯƠNG CẠNH HUYỀN
1. Dán 4 tam giác vuông bằng nhau (cạnh a, b, cạnh huyền c) vào Hình 1.
   -> Diện tích phần hình vuông trắng ở giữa là: S1 = ...........
2. Dán 4 tam giác vuông đó vào Hình 2.
   -> Diện tích phần hai hình vuông trắng là: S2 = ........... + ...........
3. So sánh S1 và S2: Ta nhận thấy S1 ....... S2
   -> RÚT RA HỆ THỨC: .....................................................
\`\`\`

#### 2. BẢNG TIÊU CHÍ ĐÁNH GIÁ HOẠT ĐỘNG NHÓM (RUBRIC)
| Tiêu chí | Mức 1: Cần cố gắng (<5đ) | Mức 2: Đạt (5 - 6.5đ) | Mức 3: Khá (7 - 8.5đ) | Mức 4: Tốt (9 - 10đ) |
|---|---|---|---|---|
| **Thao tác cắt ghép mô hình** | Lúng túng, chưa hoàn thành ghép hình | Ghép được mô hình nhưng mất nhiều thời gian | Ghép đúng, khéo léo, đúng thời gian | Ghép nhanh, chính xác tuyệt đối, thẩm mĩ cao |
| **Lập luận rút ra hệ thức** | Chưa giải thích được mối liên hệ diện tích | Nêu được hệ thức nhưng chưa rõ lập luận | Lập luận rõ ràng logic từ hình vẽ | Lập luận sắc sảo, tự tin thuyết trình trước lớp |
| **Tinh thần làm việc nhóm** | 1-2 bạn làm, các bạn khác thụ động | Đa số tham gia nhưng còn ồn ào | Phân công việc hợp lý, hỗ trợ nhau tốt | Tất cả thành viên đều tích cực, đoàn kết, hiệu quả |
`
  },
  {
    id: 'sample-nguvan-10-thanthoai',
    title: 'Bài 1: Sức sống của sử thi và thần thoại (Thần Trụ Trời)',
    subject: 'Ngữ văn',
    grade: 'Lớp 10',
    curriculum: 'Chân trời sáng tạo (NXB Giáo dục VN)',
    duration: '2 tiết (90 phút)',
    standardFormat: 'CV5512',
    teachingMethod: 'Dạy học đọc hiểu văn bản theo thể loại kết hợp kĩ thuật sân khấu hóa đóng vai',
    teachingTools: 'Máy chiếu, video tư liệu nguồn gốc vũ trụ, tranh minh họa dân gian, Phiếu học tập đọc hiểu',
    targetAudienceProfile: 'Học sinh năng động, giàu trí tưởng tượng, thích tranh biện và nghệ thuật',
    createdAt: '2026-10-09T08:00:00.000Z',
    updatedAt: '2026-10-09T08:00:00.000Z',
    tags: ['Ngữ văn 10', 'Thần thoại', 'Chân trời sáng tạo', 'CV5512'],
    teacherName: 'Trần Thị Thu Hà',
    schoolName: 'Trường THPT Chuyên Quốc Học',
    content: `# KẾ HOẠCH BÀI DẠY
## MÔN: NGỮ VĂN - LỚP 10
### BÀI 1: TẠO LẬP THẾ GIỚI - VĂN BẢN 1: THẦN TRỤ TRỜI (Thời lượng: 2 tiết)
**Bộ sách:** Chân trời sáng tạo

---

### I. MỤC TIÊU
#### 1. Về kiến thức
- Nhận biết và phân tích được các yếu tố đặc trưng của truyện thần thoại: không gian, thời gian, cốt truyện, nhân vật, lời kể và niềm tin thiêng liêng của người nguyên thủy.
- Phân tích được hình tượng nhân vật Thần Trụ Trời với vóc dáng khổng lồ, hành động khai thiên lập địa và ý nghĩa giải thích nguồn gốc tự nhiên.

#### 2. Về năng lực
- **Năng lực chung:** Tự chủ trong việc chuẩn bị bài ở nhà; Hợp tác nhóm thảo luận so sánh thần thoại Việt Nam với thần thoại thế giới (thần Pangu - Bàn Cổ Trung Quốc, thần Atlas Hy Lạp).
- **Năng lực đặc thù:**
  - Năng lực cảm thụ thẩm mĩ: Trân trọng trí tưởng tượng hồn nhiên, kỳ vĩ của tổ tiên người Việt thuở hồng hoang.
  - Năng lực ngôn ngữ: Đọc diễn cảm văn bản thần thoại với giọng điệu trang trọng, cổ kính; viết đoạn văn phân tích chi tiết nghệ thuật tiêu biểu.

#### 3. Về phẩm chất
- **Yêu nước và tự hào văn hóa dân tộc:** Biết nâng niu, gìn giữ vốn di sản văn học dân gian quý báu của cha ông.
- **Trách nhiệm:** Ý thức bảo vệ và sống hòa hợp với thiên nhiên tươi đẹp.

---

### II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
- **Giáo viên:** Bài giảng trình chiếu điện tử, tranh dân gian Đông Hồ / tranh minh họa Thần Trụ Trời, đoạn clip ngắn về thuở hồng hoang vũ trụ, Phiếu học tập số 1 & 2.
- **Học sinh:** SGK Ngữ văn 10 tập 1, vở soạn bài, bảng nhóm KWL.

---

### III. TIẾN TRÌNH DẠY HỌC

#### HOẠT ĐỘNG 1: MỞ ĐẦU (7 phút)
**a) Mục tiêu:** Kích hoạt kiến thức nền về nguồn gốc vũ trụ, tạo tâm lý hào hứng bước vào thế giới thần thoại.
**b) Nội dung:** Trình chiếu 3 câu hỏi trắc nghiệm hình ảnh: "Trước khi có trời đất muôn loài, vũ trụ là gì? Người xưa giải thích hiện tượng trời tròn đất vuông như thế nào?"
**c) Sản phẩm:** Câu trả lời ngắn của HS về sự hỗn mang nguyên thủy.
**d) Tổ chức thực hiện:** GV tổ chức trò chơi "Mảnh ghép thời gian", dẫn dắt vào bài học thần thoại khởi nguyên.

---

#### HOẠT ĐỘNG 2: HÌNH THÀNH KIẾN THỨC MỚI (50 phút)
##### 1. Khám phá không gian và thời gian thần thoại
- **Mục tiêu:** Nhận biết không gian vũ trụ nguyên sơ và thời gian cổ xưa không xác định.
- **Sản phẩm:** Bảng phân tích: Không gian vũ trụ hỗn độn, mù mịt; Thời gian "thuở ấy, chưa có thế gian, chưa có muôn vật và loài người".
- **Tổ chức thực hiện:** Kĩ thuật đọc sáng tạo kết hợp làm việc cá nhân và chia sẻ cặp đôi.

##### 2. Hình tượng Thần Trụ Trời và hành động kiến tạo thế giới
- **Mục tiêu:** Phân tích ngoại hình phi thường và hành động kỳ vĩ của vị thần khai thiên lập địa.
- **Sản phẩm:** Sơ đồ tư duy về hành động của thần: Vươn vai đứng dậy -> Đào đất khuân đá -> Đắp cột chống trời -> Phá cột ném đá vung vãi tạo nên núi non gò đống.
- **Tổ chức thực hiện:** Thảo luận nhóm 6 học sinh theo kĩ thuật khăn trải bàn, hoàn thành Phiếu học tập số 1. Đại diện nhóm thuyết trình và nhận xét chéo.

---

#### HOẠT ĐỘNG 3: LUYỆN TẬP (20 phút)
**a) Mục tiêu:** Khắc sâu đặc trưng thể loại thần thoại qua việc so sánh đối chiếu.
**b) Nội dung:** So sánh hình tượng Thần Trụ Trời (Việt Nam) với Thần Bàn Cổ (Trung Quốc) hoặc Thần Atlas (Hy Lạp).
**c) Sản phẩm:** Bảng đối chiếu điểm tương đồng (tầm vóc khổng lồ, ý chí khai phá) và khác biệt (sự hóa thân thành vạn vật).

---

#### HOẠT ĐỘNG 4: VẬN DỤNG (13 phút)
**a) Mục tiêu:** Kết nối tác phẩm với suy nghĩ của thế hệ trẻ hôm nay về khát vọng chinh phục tự nhiên.
**b) Nội dung:** Viết đoạn văn (khoảng 150 chữ) trả lời câu hỏi: *"Khát vọng giải thích thế giới của con người nguyên thủy gợi cho bạn suy nghĩ gì về tinh thần khám phá khoa học của tuổi trẻ ngày nay?"*
**c) Sản phẩm:** Đoạn văn viết tay của học sinh.

---

### IV. HỒ SƠ DẠY HỌC (PHIẾU HỌC TẬP & ĐÁNH GIÁ)
- Phiếu học tập số 1: Đặc trưng thể loại thần thoại trong "Thần Trụ Trời".
- Rubric đánh giá đoạn văn nghị luận 150 chữ (Đúng hình thức, đúng nội dung, diễn đạt trong sáng, có cảm xúc).
`
  },
  {
    id: 'sample-khtn-6-tebao',
    title: 'Bài 17: Tế bào - Đơn vị cơ sở của sự sống',
    subject: 'Khoa học tự nhiên (Lý - Hóa - Sinh)',
    grade: 'Lớp 6',
    curriculum: 'Cánh Diều (NXB ĐH Sư phạm)',
    duration: '2 tiết (90 phút)',
    standardFormat: 'CV5512',
    teachingMethod: 'Phương pháp Bàn tay nặn bột kết hợp quan sát tiêu bản hiển vi ảo',
    teachingTools: 'Kính hiển vi quang học, tiêu bản tế bào biểu bì hành tây, mô hình 3D tế bào động vật và thực vật',
    targetAudienceProfile: 'Học sinh đầu cấp THCS tò mò khám phá thế giới vi mô',
    createdAt: '2026-10-08T08:00:00.000Z',
    updatedAt: '2026-10-08T08:00:00.000Z',
    tags: ['KHTN 6', 'Sinh học', 'Cánh Diều', 'CV5512'],
    teacherName: 'Lê Hoàng Nam',
    schoolName: 'Trường THCS Chu Văn An',
    content: `# KẾ HOẠCH BÀI DẠY
## MÔN: KHOA HỌC TỰ NHIÊN - LỚP 6
### BÀI 17: TẾ BÀO - ĐƠN VỊ CƠ SỞ CỦA SỰ SỐNG (Thời lượng: 2 tiết)
**Bộ sách:** Cánh Diều

---

### I. MỤC TIÊU
#### 1. Về kiến thức
- Nêu được khái niệm tế bào là đơn vị cấu trúc và chức năng cơ bản của mọi sinh vật sống.
- Nhận biết được các thành phần chính cấu tạo nên tế bào: màng tế bào, tế bào chất, nhân (hoặc vùng nhân).
- Phân biệt được tế bào nhân sơ và tế bào nhân thực, tế bào thực vật và tế bào động vật (qua sự có mặt của lục lạp, thành tế bào).

#### 2. Về năng lực
- **Năng lực KHTN:** Rèn luyện kĩ năng quan sát mô hình, sử dụng kính hiển vi quang học quan sát tế bào vảy hành.
- **Năng lực tự chủ:** Tự giác thu thập mẫu vật, vẽ lại hình dạng tế bào quan sát được.

#### 3. Về phẩm chất
- Tò mò, yêu thích khám phá thế giới tự nhiên, bảo vệ sự sống quanh mình.

---

### II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
- 04 kính hiển vi quang học, lam kính, lam men, củ hành tây, phẩm nhuộm xanh methylene.
- Mô hình giải phẫu tế bào động vật và thực vật phóng đại.
- Phiếu học tập thực hành số 1 và số 2.
`
  }
];
