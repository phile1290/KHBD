import React from 'react';
import { 
  X, 
  FileCheck, 
  CheckCircle2, 
  BookOpen, 
  Layers, 
  Target, 
  Users, 
  Award, 
  ExternalLink 
} from 'lucide-react';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Quy Chuẩn Soạn Kế Hoạch Bài Dạy (CV 5512 & CV 2345)</h3>
              <p className="text-xs text-emerald-200">Hướng dẫn chi tiết từ Bộ Giáo dục và Đào tạo cho Chương trình GDPT 2018</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-slate-800 text-sm leading-relaxed">
          {/* Section 1: Overview */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5">
            <h4 className="font-bold text-emerald-950 text-base flex items-center space-x-2">
              <Award className="w-5 h-5 text-emerald-700" />
              <span>Ý nghĩa và Căn cứ pháp lý cốt lõi</span>
            </h4>
            <p className="mt-2 text-emerald-900 text-xs sm:text-sm">
              Theo <strong>Công văn số 5512/BGDĐT-GDTrH</strong> (ngày 18/12/2020) và <strong>Công văn số 2345/BGDĐT-GDTH</strong> của Bộ GD&ĐT: 
              Kế hoạch bài dạy do giáo viên thiết kế nhằm chuyển dịch từ dạy học truyền thụ kiến thức thụ động sang 
              <strong> hình thành và phát triển phẩm chất, năng lực học sinh</strong>. Mỗi bài dạy là một chuỗi các hoạt động học tập tích cực.
            </p>
          </div>

          {/* Section 2: Structure */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-base border-b border-slate-200 pb-2 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Khung Cấu Trúc Chuẩn 4 Phần của Kế Hoạch Bài Dạy</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-indigo-900 text-sm block">I. MỤC TIÊU BÀI DẠY</span>
                <ul className="text-xs space-y-1.5 text-slate-700">
                  <li>• <strong>1. Về Kiến thức:</strong> Nêu rõ các yêu cầu cần đạt (YCCĐ) theo chương trình môn học.</li>
                  <li>• <strong>2. Về Năng lực:</strong> Gồm Năng lực chung (Tự chủ - tự học; Giao tiếp - hợp tác; Giải quyết vấn đề - sáng tạo) và Năng lực đặc thù của môn học.</li>
                  <li>• <strong>3. Về Phẩm chất:</strong> 5 phẩm chất chủ yếu (Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm).</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-indigo-900 text-sm block">II. THIẾT BỊ DẠY HỌC & HỌC LIỆU</span>
                <ul className="text-xs space-y-1.5 text-slate-700">
                  <li>• <strong>1. Của Giáo viên:</strong> SGK, SGV, bài giảng điện tử, thiết bị trình chiếu, phiếu học tập, đồ dùng trực quan, video mô phỏng, thí nghiệm...</li>
                  <li>• <strong>2. Của Học sinh:</strong> SGK, vở ghi chép, đồ dùng học tập, dụng cụ chuẩn bị trước ở nhà...</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 md:col-span-2">
                <span className="font-bold text-indigo-900 text-sm block">III. TIẾN TRÌNH DẠY HỌC (4 HOẠT ĐỘNG CHUẨN)</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-amber-800 block mb-1">Hoạt động 1: Mở đầu</strong>
                    Xác định vấn đề / nhiệm vụ học tập, tạo hứng thú kích hoạt kiến thức nền.
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-blue-800 block mb-1">Hoạt động 2: Hình thành KT</strong>
                    Nghiên cứu kiến thức mới / giải quyết vấn đề bằng trải nghiệm, thảo luận.
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-emerald-800 block mb-1">Hoạt động 3: Luyện tập</strong>
                    Hệ thống hóa, củng cố và vận dụng trực tiếp vào bài tập củng cố.
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-purple-800 block mb-1">Hoạt động 4: Vận dụng</strong>
                    Mở rộng thực tiễn, định hướng hoạt động tìm tòi khám phá ngoài lớp học.
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 md:col-span-2">
                <span className="font-bold text-indigo-900 text-sm block">IV. HỒ SƠ DẠY HỌC & ĐÁNH GIÁ (PHỤ LỤC)</span>
                <p className="text-xs text-slate-600">
                  Bao gồm: Mẫu Phiếu học tập số 1 & 2; Ma trận và Bảng tiêu chí đánh giá (Rubric) đánh giá sản phẩm / kỹ năng nhóm; 
                  Các câu hỏi trắc nghiệm hoặc bài kiểm tra nhanh cuối bài.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: 4 Steps within each Activity */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-base border-b border-slate-200 pb-2 flex items-center space-x-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <span>Quy Chuẩn 4 Bước Bắt Buộc trong mỗi Hoạt Động (Mục d - Tổ chức thực hiện)</span>
            </h4>

            <div className="space-y-2.5">
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">Bước 1: Chuyển giao nhiệm vụ học tập</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Giáo viên giao nhiệm vụ cụ thể, rõ ràng (qua lời nói, trình chiếu hoặc phát phiếu học tập); đảm bảo mọi học sinh đều hiểu rõ mục tiêu và cách làm.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">Bước 2: Thực hiện nhiệm vụ học tập</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Học sinh tự lực làm việc (cá nhân hoặc theo nhóm). Giáo viên quan sát, theo dõi, phát hiện khó khăn và hỗ trợ kịp thời (không làm thay).
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">Bước 3: Báo cáo kết quả và thảo luận</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Học sinh đại diện trình bày sản phẩm, kết quả; các học sinh/nhóm khác lắng nghe, nhận xét, bổ sung và tranh biện.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">Bước 4: Kết luận, nhận định</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Giáo viên nhận xét về thái độ, quá trình làm việc; chuẩn hóa kiến thức chính xác; chốt nội dung trọng tâm và định hướng bước tiếp theo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 transition-all"
          >
            Đã hiểu & Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};
