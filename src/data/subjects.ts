import { SubjectOption } from '../types/lesson';

export const CURRICULUM_OPTIONS = [
  'Kết nối tri thức với cuộc sống (NXB Giáo dục VN)',
  'Cánh Diều (NXB ĐH Sư phạm)',
  'Chân trời sáng tạo (NXB Giáo dục VN)',
  'Cùng học để phát triển năng lực',
  'Chương trình GDPT 2018 chung',
  'Chương trình chuyên biệt / Nhà trường'
];

export const GRADE_OPTIONS = [
  'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5',
  'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9',
  'Lớp 10', 'Lớp 11', 'Lớp 12',
  'Đại học / Cao đẳng / Nghề'
];

export const DURATION_OPTIONS = [
  '1 tiết (45 phút)',
  '2 tiết (90 phút)',
  '3 tiết (135 phút)',
  'Chủ đề tích hợp (4 tiết)',
  'Dự án học tập (6 tiết)',
  '1 tiết Tiểu học (35 phút)',
  '2 tiết Tiểu học (70 phút)'
];

export const TEACHING_METHOD_OPTIONS = [
  'Dạy học giải quyết vấn đề kết hợp kĩ thuật phòng tranh',
  'Dạy học khám phá kết hợp phương pháp khăn trải bàn',
  'Phương pháp Bàn tay nặn bột (Hands-on experiments)',
  'Dạy học tích hợp liên môn / Giáo dục STEM',
  'Dạy học hợp tác theo nhóm kết hợp kĩ thuật mảnh ghép (Jigsaw)',
  'Phương pháp dạy học theo trạm và góc (Stations & Corners)',
  'Dạy học dự án (Project-Based Learning - PBL)',
  'Phương pháp đóng vai và sân khấu hóa tương tác',
  'Kỹ thuật KWL, sơ đồ tư duy kết hợp trò chơi học tập',
  'Phương pháp vấn đáp gợi mở kết hợp thực hành trực tiếp'
];

export const TEACHING_TOOL_OPTIONS = [
  'Tivi / Máy chiếu, Bài giảng PowerPoint/Canva, Phiếu học tập, SGK',
  'Phần mềm mô phỏng thí nghiệm ảo (PhET, GeoGebra), Máy chiếu, Phiếu học tập',
  'Dụng cụ thí nghiệm thực hành, mẫu vật thật, bảng phụ nhóm',
  'Bảng tương tác thông minh, Padlet / Kahoot / Quizizz, thiết bị cá nhân',
  'Tranh ảnh khổ lớn, video tư liệu, phiếu đánh giá chéo Rubric',
  'Mô hình trực quan, thẻ bài từ khóa, sơ đồ tư duy in màu'
];

export const SUBJECTS_LIST: SubjectOption[] = [
  {
    id: 'toan',
    name: 'Toán học',
    category: 'Tự nhiên',
    popularTopics: [
      'Định lí Pythagore và ứng dụng thực tiễn',
      'Hàm số bậc nhất và đồ thị',
      'Định lý Thales trong tam giác',
      'Phương trình bậc hai một ẩn và hệ thức Viète',
      'Xác suất thực nghiệm và biến cố',
      'Phép nhân và phép chia đa thức',
      'Khảo sát sự biến thiên và vẽ đồ thị hàm số (Lớp 12)'
    ]
  },
  {
    id: 'nguvan',
    name: 'Ngữ văn',
    category: 'Xã hội',
    popularTopics: [
      'Thần thoại Hy Lạp và Thần thoại Việt Nam (Chân trời sáng tạo)',
      'Bài học đường đời đầu tiên (Dế Mèn phiêu lưu ký)',
      'Đoàn thuyền đánh cá (Huy Cận) - Cảm hứng vũ trụ và lao động',
      'Chuyện người con gái Nam Xương (Nguyễn Dữ)',
      'Viết bài văn nghị luận về một vấn đề xã hội cần giải quyết',
      'Thực hành tiếng Việt: Biện pháp tu từ ẩn dụ và hoán dụ',
      'Vợ nhặt (Kim Lân) - Khát vọng sống và tình người'
    ]
  },
  {
    id: 'tienganh',
    name: 'Tiếng Anh',
    category: 'Ngoại ngữ',
    popularTopics: [
      'Unit 1: Local Community - A Closer Look 1',
      'Unit 2: City Life - Skills 1 (Reading & Speaking)',
      'Unit 3: Teen Stress and Pressure - Communication',
      'Unit 4: Remembering the Past - Grammar (Used to & Wishes)',
      'Unit 6: Viet Nam: Then and Now - Project Presentation',
      'Unit 7: Natural Wonders of the World - Listening & Writing'
    ]
  },
  {
    id: 'khtn',
    name: 'Khoa học tự nhiên (Lý - Hóa - Sinh)',
    category: 'Tự nhiên',
    popularTopics: [
      'Tế bào - Đơn vị cơ sở của sự sống (Sinh học)',
      'Nguyên tử, Nguyên tố hóa học và Bảng tuần hoàn',
      'Định luật bảo toàn khối lượng và phương trình hóa học',
      'Tốc độ chuyển động và đồ thị quãng đường - thời gian (Vật lí)',
      'Năng lượng tái tạo và bảo vệ môi trường',
      'Quang hợp và hô hấp ở thực vật'
    ]
  },
  {
    id: 'vatly',
    name: 'Vật lí (Cấp THPT)',
    category: 'Tự nhiên',
    popularTopics: [
      'Động học: Chuyển động thẳng biến đổi đều',
      'Động lực học: Ba định luật Newton và ứng dụng',
      'Công, năng lượng và định luật bảo toàn cơ năng',
      'Dao động điều hòa và các đại lượng đặc trưng',
      'Sóng cơ và sự giao thoa sóng',
      'Từ trường và cảm ứng điện từ'
    ]
  },
  {
    id: 'hoahoc',
    name: 'Hóa học (Cấp THPT)',
    category: 'Tự nhiên',
    popularTopics: [
      'Cấu tạo nguyên tử và bảng tuần hoàn các nguyên tố',
      'Liên kết hóa học (Cộng hóa trị và ion)',
      'Tốc độ phản ứng hóa học và cân bằng hóa học',
      'Hydrocarbon no và không no (Alcane, Alquene)',
      'Dẫn xuất Halogen, Alcohol và Phenol',
      'Hóa học Polyme và vật liệu composite'
    ]
  },
  {
    id: 'sinhhoc',
    name: 'Sinh học (Cấp THPT)',
    category: 'Tự nhiên',
    popularTopics: [
      'Thành phần hóa học của tế bào: Carbohydrate và Lipid',
      'Cấu trúc và chức năng của DNA, RNA',
      'Chu kỳ tế bào, nguyên phân và giảm phân',
      'Quy luật di truyền của Mendel và mở rộng',
      'Di truyền học người và ứng dụng công nghệ gen',
      'Hệ sinh thái và chuỗi thức ăn sinh học'
    ]
  },
  {
    id: 'lichsu_diali',
    name: 'Lịch sử & Địa lí',
    category: 'Xã hội',
    popularTopics: [
      'Văn minh Văn Lang - Âu Lạc: Nguồn cội dân tộc Việt',
      'Cuộc kháng chiến chống quân Nguyên - Mông thời Trần',
      'Cách mạng tháng Tám năm 1945 và sự ra đời của nước VNDCCH',
      'Đặc điểm địa hình và khoáng sản Việt Nam',
      'Khí hậu nhiệt đới gió mùa và ảnh hưởng đối với sản xuất',
      'Phát triển kinh tế biển đảo và chủ quyền quốc gia'
    ]
  },
  {
    id: 'tinhoc',
    name: 'Tin học',
    category: 'Tự nhiên',
    popularTopics: [
      'Thuật toán tìm kiếm tuần tự và tìm kiếm nhị phân',
      'Lập trình Python: Cấu trúc lặp và rẽ nhánh',
      'Mạng máy tính và Internet: An toàn thông tin trên không gian mạng',
      'Cơ sở dữ liệu quan hệ và hệ quản trị CSDL MySQL',
      'Thiết kế trang web cá nhân với HTML/CSS',
      'Trí tuệ nhân tạo (AI) và đạo đức kỹ thuật số'
    ]
  },
  {
    id: 'congnghe',
    name: 'Công nghệ',
    category: 'Tự nhiên',
    popularTopics: [
      'Bản vẽ kỹ thuật và hình chiếu vuông góc',
      'Mạch điện điều khiển đơn giản trong gia đình',
      'Nông nghiệp công nghệ cao và hệ thống trồng cây thủy canh',
      'An toàn điện và tiết kiệm năng lượng gia dụng'
    ]
  },
  {
    id: 'gdcd',
    name: 'Giáo dục công dân / KT & Pháp luật',
    category: 'Xã hội',
    popularTopics: [
      'Xây dựng tình bạn trong sáng, lành mạnh',
      'Tôn trọng sự đa dạng của các dân tộc',
      'Quyền và nghĩa vụ của công dân về bảo vệ môi trường',
      'Thị trường và cơ chế thị trường trong nền kinh tế',
      'Quyền tự do kinh doanh và nghĩa vụ nộp thuế của công dân'
    ]
  },
  {
    id: 'amnhac_mythuat',
    name: 'Nghệ thuật (Âm nhạc / Mỹ thuật)',
    category: 'Năng khiếu & Khác',
    popularTopics: [
      'Hát: Bài hát ca ngợi quê hương đất nước',
      'Nhạc cụ gõ và tiết tấu đa dạng',
      'Vẽ tranh đề tài phong cảnh quê hương bằng màu nước',
      'Thiết kế poster bảo vệ môi trường học đường',
      'Nghệ thuật gốm truyền thống Bát Tràng'
    ]
  },
  {
    id: 'tieuhoc',
    name: 'Các môn Tiểu học (Toán, Tiếng Việt, TNXH, Đạo đức)',
    category: 'Xã hội',
    popularTopics: [
      'Tiếng Việt 2: Em là búp măng non (Đọc & Viết)',
      'Toán 3: Bảng nhân 7 và vận dụng giải toán có lời văn',
      'Tự nhiên và Xã hội 3: Cơ quan tiêu hóa và cách chăm sóc',
      'Khoa học 4: Nước có những tính chất gì?',
      'Lịch sử & Địa lí 5: Phong trào Cần Vương yêu nước'
    ]
  }
];
