# 🎂 Web Sinh Nhật Nguyễn Lan - 20 Tuổi

Web chúc mừng sinh nhật tuổi 20 của **Nguyễn Lan** (19/11/2006 - 19/11/2026) với hiệu ứng 3D, pháo hoa và âm thanh.

## ✨ Tính năng

- **Giai đoạn 1**: Màn hình khởi tạo "19/11/2026" với pháo hoa confetti
- **Giai đoạn 2**: Thiệp chúc mừng Glassmorphism + giai điệu Happy Birthday (Web Audio API)
- **Giai đoạn 3**: Không gian bánh sinh nhật 3D tương tác (Three.js + WebGL 2.0)
  - Xoay 360° bằng chuột/touch
  - Thổi nến bằng micro hoặc nút bấm
  - Pháo hoa chân thực khi thổi tắt nến
  - Đổi 3 sắc thái kem bánh
  - 1400 hạt sparkle lung linh

## 🚀 Cách chạy

### Cách 1: Dùng npx (Khuyến nghị)

```bash
cd c:\code\lan\1910
npx serve .
```

Sau đó mở trình duyệt: **http://localhost:3000**

### Cách 2: Python

```bash
cd c:\code\lan\1910
python -m http.server 8080
```

Mở: **http://localhost:8080**

### Cách 3: Live Server (VS Code)

Cài extension "Live Server" trong VS Code, click chuột phải vào `index.html` → "Open with Live Server"

## 📁 Cấu trúc Project

```
c:\code\lan\1910\
├── index.html          # File HTML chính
├── css/
│   └── style.css       # Styles giao diện
├── js/
│   └── main.js         # Logic JavaScript (Three.js, Audio, Fireworks)
├── Kế Hoạch Web Sinh Nhật.md  # Tài liệu thiết kế
└── README.md           # File này
```

## 🎨 Công nghệ sử dụng

| Công nghệ | Mục đích |
|-----------|----------|
| Three.js r170 | Đồ họa 3D WebGL 2.0 |
| Custom GLSL Shaders | Ngọn lửa nến vật lý |
| UnrealBloomPass | Hiệu ứng HDR Bloom |
| Web Audio API | Tổng hợp nhạc Happy Birthday |
| canvas-confetti | Pháo hoa 2D |
| Custom Fireworks System | Pháo hoa Canvas 2D chân thực |

## 📱 Responsive

- Desktop: Xoay bánh bằng chuột, zoom bằng scroll
- Mobile: Vuốt để xoay, pinch để zoom

## ⚠️ Lưu ý

- Cần HTTPS hoặc localhost để sử dụng microphone (thổi nến)
- Khi mở trực tiếp file HTML (file://), microphone sẽ không hoạt động

---

*Made with ❤️ for Nguyễn Lan's 20th Birthday*
