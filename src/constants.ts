import { StyleOption, AspectRatioOption, PromptInspiration, GeneratedImage } from './types';

export const STYLES: StyleOption[] = [
  {
    id: 'photorealistic',
    name: 'Nhiếp ảnh Chân thực',
    description: 'Chi tiết cực cao 8K, độ sâu trường ảnh, ánh sáng tự nhiên',
    gradient: 'from-amber-600 via-orange-600 to-rose-700',
    tag: 'Chân thực',
    iconName: 'Camera',
  },
  {
    id: 'anime',
    name: 'Anime Nhật Bản',
    description: 'Nét vẽ Makoto Shinkai & Ghibli, màu sắc tươi sáng rực rỡ',
    gradient: 'from-pink-500 via-purple-500 to-indigo-600',
    tag: 'Hoạt hình',
    iconName: 'Sparkles',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Thành phố tương lai, đèn neon xanh tím phản chiếu mưa đêm',
    gradient: 'from-cyan-500 via-blue-600 to-fuchsia-600',
    tag: 'Khoa học viễn tưởng',
    iconName: 'Zap',
  },
  {
    id: '3d-render',
    name: '3D Pixar & Octane',
    description: 'Nhân vật 3D đáng yêu mềm mại, hiệu ứng subsurface scattering',
    gradient: 'from-violet-500 via-indigo-600 to-cyan-500',
    tag: '3D Render',
    iconName: 'Box',
  },
  {
    id: 'watercolor',
    name: 'Tranh Màu nước',
    description: 'Loang màu mềm mại trên nền giấy nhám thô, nghệ thuật thơ mộng',
    gradient: 'from-teal-400 via-cyan-500 to-blue-500',
    tag: 'Hội họa',
    iconName: 'Droplets',
  },
  {
    id: 'oil_painting',
    name: 'Tranh Sơn dầu',
    description: 'Vệt sơn cọ cổ điển, phong cách phục hưng kịch tính Rembrandt',
    gradient: 'from-yellow-600 via-amber-700 to-red-800',
    tag: 'Cổ điển',
    iconName: 'Palette',
  },
  {
    id: 'fantasy',
    name: 'Kỳ ảo Fantasy',
    description: 'Sinh vật thần thoại, phép thuật phát sáng, lâu đài huyền bí',
    gradient: 'from-emerald-500 via-teal-600 to-purple-700',
    tag: 'Thần thoại',
    iconName: 'Flame',
  },
  {
    id: 'minimalist',
    name: 'Đồ họa Tối giản',
    description: 'Hình khối hình học thanh lịch, khoảng trắng tinh tế hiện đại',
    gradient: 'from-slate-600 via-gray-700 to-zinc-800',
    tag: 'Tối giản',
    iconName: 'Feather',
  },
  {
    id: 'retro_vaporwave',
    name: 'Retro Vaporwave',
    description: 'Thập niên 80, lưới neon synthwave, hoàng hôn pixel tím cam',
    gradient: 'from-fuchsia-500 via-rose-500 to-amber-500',
    tag: 'Cổ điển 80s',
    iconName: 'Radio',
  },
  {
    id: 'origami',
    name: 'Nghệ thuật Gấp giấy',
    description: 'Nếp gấp giấy 3D tinh xảo, bóng đổ đổ nổi khối sắc sảo',
    gradient: 'from-rose-400 via-pink-400 to-amber-300',
    tag: 'Điêu khắc giấy',
    iconName: 'Layers',
  },
];

export const ASPECT_RATIOS: AspectRatioOption[] = [
  {
    id: '1:1',
    label: 'Vuông 1:1',
    ratio: '1:1',
    widthRatio: 1,
    heightRatio: 1,
    description: 'Thích hợp cho Avatar, Instagram, ảnh đại diện',
  },
  {
    id: '16:9',
    label: 'Ngang 16:9',
    ratio: '16:9',
    widthRatio: 16,
    heightRatio: 9,
    description: 'Màn hình máy tính, YouTube thumbnail, phong cảnh',
  },
  {
    id: '9:16',
    label: 'Dọc 9:16',
    ratio: '9:16',
    widthRatio: 9,
    heightRatio: 16,
    description: 'TikTok, Reels, Instagram Story, hình nền điện thoại',
  },
  {
    id: '4:3',
    label: 'Tiêu chuẩn 4:3',
    ratio: '4:3',
    widthRatio: 4,
    heightRatio: 3,
    description: 'Tỷ lệ kinh điển, tranh ảnh truyền thống',
  },
  {
    id: '3:4',
    label: 'Chân dung 3:4',
    ratio: '3:4',
    widthRatio: 3,
    heightRatio: 4,
    description: 'Ảnh chân dung, poster nghệ thuật',
  },
];

export const PROMPT_INSPIRATIONS: PromptInspiration[] = [
  {
    title: 'Phố cổ Hội An đêm rằm hoa đăng',
    prompt: 'Phố cổ Hội An lung linh trong đêm rằm với hàng ngàn chiếc đèn lồng giấy lụa rực rỡ sắc màu, dòng sông Hoài phẳng lặng chở hoa đăng trôi bồng bềnh, phản chiếu ánh sáng ấm áp, cinematic photography, 8k',
    style: 'photorealistic',
    aspectRatio: '16:9',
    category: 'Việt Nam Tuyệt Đẹp',
  },
  {
    title: 'Mèo phi hành gia du hành vũ trụ',
    prompt: 'Chú mèo lông vàng mập mạp mặc bộ đồ du hành vũ trụ NASA siêu chi tiết, mũ bảo hiểm bằng kính trong suốt phát sáng, bay lơ lửng giữa tinh vân dải ngân hà rực rỡ, 3D Pixar render cute',
    style: '3d-render',
    aspectRatio: '1:1',
    category: 'Động Vật & 3D',
  },
  {
    title: 'Sài Gòn tương lai Cyberpunk 2088',
    prompt: 'Thành phố Sài Gòn tương lai với các tòa tháp chọc trời phủ kín bảng hiệu hologram tiếng Việt phát sáng neon, xe bay tấp nập giữa tầng mây, mưa bay lất phất phản chiếu ánh sáng tím xanh rực rỡ',
    style: 'cyberpunk',
    aspectRatio: '16:9',
    category: 'Tương Lai & Viễn Tưởng',
  },
  {
    title: 'Nữ kiếm sĩ hoa đào dưới trăng',
    prompt: 'Nữ kiếm sĩ anime kiêu sa đứng trên mái chùa cổ dưới ánh trăng tròn rực rỡ, tà áo lụa bay phất phơ cùng những cánh hoa anh đào hồng rơi chậm rãi, phong cách Makoto Shinkai lung linh',
    style: 'anime',
    aspectRatio: '3:4',
    category: 'Anime & Manga',
  },
  {
    title: 'Rừng nấm phát sáng kỳ ảo',
    prompt: 'Khu rừng nguyên sinh thần thoại vào ban đêm với những cây nấm khổng lồ phát ra ánh sáng dạ quang xanh lục và tím ngọc bích, các đốm đom đóm thần tiên bay lượn, sương mây huyền bí',
    style: 'fantasy',
    aspectRatio: '16:9',
    category: 'Kỳ Ảo & Phép Thuật',
  },
  {
    title: 'Bình minh trên ruộng bậc thang Mù Cang Chải',
    prompt: 'Ruộng bậc thang Mù Cang Chải mùa lúa chín vàng óng ả uốn lượn theo sườn núi xanh biếc, biển mây bồng bềnh đón những tia nắng đầu tiên xuyên qua sương sớm, tranh sơn mài màu nước truyền thống',
    style: 'watercolor',
    aspectRatio: '16:9',
    category: 'Việt Nam Tuyệt Đẹp',
  },
  {
    title: 'Rồng thần Đông Á uốn lượn mây ngũ sắc',
    prompt: 'Rồng thần Á Đông màu ngọc bích viền vàng bay lượn uy nghiêm giữa các tầng mây ngũ sắc, mắt rực lửa trí tuệ, từng lớp vảy rồng phát sáng lộng lẫy, tranh sơn dầu đỉnh cao cổ điển',
    style: 'oil_painting',
    aspectRatio: '1:1',
    category: 'Kỳ Ảo & Phép Thuật',
  },
  {
    title: 'Tách cà phê phin tối giản buổi sáng',
    prompt: 'Ly cà phê sữa đá pha phin truyền thống trên bàn gỗ sồi mộc mạc, giọt cà phê đang rơi chậm, ánh nắng xiên chéo tạo bóng đổ hình học sắc nét, phong cách đồ họa tối giản sang trọng',
    style: 'minimalist',
    aspectRatio: '1:1',
    category: 'Tối Giản & Đời Sống',
  },
];

// Browser-safe SVG data URL encoder without Node.js Buffer
const createSvgDataUrl = (svg: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

// Initial gallery items generated procedurally with SVG art canvas
export const INITIAL_GALLERY_IMAGES: GeneratedImage[] = [
  {
    id: 'sample-1',
    prompt: 'Phố cổ Hội An lung linh trong đêm rằm hoa đăng lấp lánh',
    enhancedPrompt: 'Phố cổ Hội An rực rỡ với hàng ngàn đèn lồng phản chiếu trên sông Hoài tĩnh lặng, sắc vàng ấm áp, góc máy điện ảnh 8K',
    style: 'photorealistic',
    aspectRatio: '16:9',
    imageUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        <defs>
          <linearGradient id="hoiAnSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="40%" stop-color="#1e1b4b" />
            <stop offset="70%" stop-color="#451a03" />
            <stop offset="100%" stop-color="#78350f" />
          </linearGradient>
          <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fef08a" stop-opacity="0.9" />
            <stop offset="40%" stop-color="#f97316" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#b45309" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="1280" height="720" fill="url(#hoiAnSky)" />
        <circle cx="640" cy="200" r="140" fill="url(#lanternGlow)" />
        <circle cx="280" cy="280" r="70" fill="url(#lanternGlow)" />
        <circle cx="980" cy="240" r="90" fill="url(#lanternGlow)" />
        <!-- Roofs -->
        <polygon points="100,450 350,380 420,450" fill="#18181b" />
        <polygon points="400,460 680,390 760,460" fill="#27272a" />
        <polygon points="740,450 1020,370 1150,450" fill="#18181b" />
        <!-- Water reflection -->
        <rect y="460" width="1280" height="260" fill="#090d16" />
        <ellipse cx="640" cy="560" rx="360" ry="40" fill="#f59e0b" opacity="0.25" />
        <ellipse cx="320" cy="590" rx="180" ry="25" fill="#f43f5e" opacity="0.2" />
        <ellipse cx="940" cy="580" rx="220" ry="30" fill="#fbbf24" opacity="0.2" />
        <!-- Floating lanterns -->
        <circle cx="580" cy="540" r="12" fill="#fbbf24" />
        <circle cx="660" cy="580" r="10" fill="#f43f5e" />
        <circle cx="480" cy="610" r="14" fill="#38bdf8" />
        <circle cx="780" cy="550" r="11" fill="#ec4899" />
        <circle cx="860" cy="620" r="9" fill="#eab308" />
        <text x="60" y="660" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="28" font-weight="700">Đêm Phố Cổ Hội An</text>
        <text x="60" y="690" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="16">Phong cách: Nhiếp ảnh Chân thực • 16:9 • AI Studio</text>
      </svg>
    `),
    createdAt: '2026-10-23T10:15:00.000Z',
    isFavorite: true,
    sourceMode: 'text',
  },
  {
    id: 'sample-2',
    prompt: 'Chú mèo phi hành gia lông vàng dễ thương trôi giữa vũ trụ',
    enhancedPrompt: 'Cute fluffy golden kitten in detailed NASA spacesuit floating in cosmic galaxy, Pixar 3D render',
    style: '3d-render',
    aspectRatio: '1:1',
    imageUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
        <defs>
          <radialGradient id="cosmos" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="#4c1d95" />
            <stop offset="40%" stop-color="#1e1b4b" />
            <stop offset="70%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#020617" />
          </radialGradient>
          <linearGradient id="visor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8" />
            <stop offset="50%" stop-color="#818cf8" stop-opacity="0.5" />
            <stop offset="100%" stop-color="#ec4899" stop-opacity="0.8" />
          </linearGradient>
        </defs>
        <rect width="800" height="800" fill="url(#cosmos)" />
        <!-- Stars -->
        <circle cx="120" cy="150" r="3" fill="#ffffff" opacity="0.8" />
        <circle cx="240" cy="90" r="2" fill="#38bdf8" opacity="0.7" />
        <circle cx="680" cy="180" r="3.5" fill="#f472b6" opacity="0.9" />
        <circle cx="720" cy="380" r="2.5" fill="#ffffff" opacity="0.6" />
        <circle cx="160" cy="620" r="3" fill="#fef08a" opacity="0.75" />
        <circle cx="620" cy="650" r="2" fill="#ffffff" opacity="0.8" />
        <!-- Astronaut Helmet -->
        <circle cx="400" cy="390" r="190" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="10" />
        <!-- Visor Reflective Glass -->
        <ellipse cx="400" cy="390" rx="145" ry="125" fill="url(#visor)" />
        <!-- Cat ears on top of helmet -->
        <polygon points="270,240 310,130 360,210" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="6" />
        <polygon points="440,210 490,130 530,240" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="6" />
        <!-- Cat eyes in visor -->
        <ellipse cx="350" cy="375" rx="20" ry="24" fill="#0f172a" />
        <circle cx="356" cy="370" r="7" fill="#ffffff" />
        <ellipse cx="450" cy="375" rx="20" ry="24" fill="#0f172a" />
        <circle cx="456" cy="370" r="7" fill="#ffffff" />
        <!-- Cat nose & whiskers -->
        <polygon points="395,410 405,410 400,418" fill="#f43f5e" />
        <line x1="310" y1="415" x2="370" y2="420" stroke="#ffffff" stroke-width="2.5" opacity="0.7" />
        <line x1="430" y1="420" x2="490" y2="415" stroke="#ffffff" stroke-width="2.5" opacity="0.7" />
        <!-- Text badge -->
        <text x="400" y="730" text-anchor="middle" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="24" font-weight="700">Mèo Phi Hành Gia NASA</text>
        <text x="400" y="760" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="15">Phong cách: 3D Pixar Cute • 1:1</text>
      </svg>
    `),
    createdAt: '2026-10-23T11:20:00.000Z',
    isFavorite: true,
    sourceMode: 'text',
  },
  {
    id: 'sample-3',
    prompt: 'Sài Gòn tương lai Cyberpunk rực rỡ mưa đêm',
    enhancedPrompt: 'Futuristic Neo Saigon cyberpunk skyline with neon holographic billboards, flying vehicles, rainy ground reflections',
    style: 'cyberpunk',
    aspectRatio: '16:9',
    imageUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        <defs>
          <linearGradient id="cyberSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#050510" />
            <stop offset="50%" stop-color="#0f0e26" />
            <stop offset="100%" stop-color="#1e1035" />
          </linearGradient>
        </defs>
        <rect width="1280" height="720" fill="url(#cyberSky)" />
        <!-- City Skyscrapers -->
        <rect x="80" y="160" width="130" height="420" fill="#090d16" stroke="#06b6d4" stroke-width="2" />
        <rect x="240" y="220" width="160" height="360" fill="#0d111e" stroke="#d946ef" stroke-width="2" />
        <rect x="440" y="100" width="200" height="480" fill="#060913" stroke="#3b82f6" stroke-width="2.5" />
        <polygon points="540,40 500,100 580,100" fill="#38bdf8" opacity="0.6" />
        <rect x="670" y="190" width="140" height="390" fill="#090d19" stroke="#06b6d4" stroke-width="2" />
        <rect x="840" y="140" width="180" height="440" fill="#0c0e22" stroke="#ec4899" stroke-width="2" />
        <rect x="1050" y="240" width="150" height="340" fill="#080a14" stroke="#8b5cf6" stroke-width="2" />
        <!-- Neon Signs -->
        <text x="470" y="250" fill="#06b6d4" font-family="system-ui, sans-serif" font-size="28" font-weight="900">SÀI GÒN 2088</text>
        <text x="865" y="280" fill="#f43f5e" font-family="system-ui, sans-serif" font-size="24" font-weight="800">CYBER VIỆT</text>
        <text x="110" y="300" fill="#a855f7" font-family="monospace" font-size="20">AI STUDIO</text>
        <!-- Flying Cars -->
        <rect x="360" y="180" width="60" height="12" rx="4" fill="#38bdf8" />
        <line x1="330" y1="186" x2="360" y2="186" stroke="#38bdf8" stroke-width="3" opacity="0.7" />
        <rect x="780" y="260" width="70" height="14" rx="4" fill="#f43f5e" />
        <line x1="850" y1="267" x2="890" y2="267" stroke="#f43f5e" stroke-width="3" opacity="0.7" />
        <!-- Wet Ground & Neon Reflections -->
        <rect y="580" width="1280" height="140" fill="#02040a" />
        <ellipse cx="540" cy="630" rx="280" ry="25" fill="#06b6d4" opacity="0.25" />
        <ellipse cx="900" cy="640" rx="220" ry="22" fill="#ec4899" opacity="0.25" />
        <ellipse cx="200" cy="650" rx="160" ry="18" fill="#8b5cf6" opacity="0.2" />
      </svg>
    `),
    createdAt: '2026-10-23T12:00:00.000Z',
    isFavorite: false,
    sourceMode: 'text',
  },
];
