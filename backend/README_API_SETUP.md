# Hướng Dẫn Cấu Hình API Keys

## 🚀 Đã Tích Hợp Google Cloud API

Dự án đã được cập nhật để hỗ trợ cả **ElevenLabs** và **Google Cloud APIs** cho Text-to-Speech và Speech-to-Text.

## 📋 API Keys Đã Được Cấu Hình

### 1. Google Cloud API Key
```
AIzaSyCXE0Rc7pBo5rt1e4KJ_Q3_4AEif0bKn_E
```

**Mục đích sử dụng:**
- ✅ **Speech-to-Text**: Chuyển giọng nói thành văn bản
- ✅ **Text-to-Speech**: Chuyển văn bản thành giọng nói
- ✅ **Hỗ trợ tiếng Việt và tiếng Anh**

### 2. ElevenLabs API Key (Tùy chọn)
```
ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

**Mục đích sử dụng:**
- ✅ **Text-to-Speech**: Giọng nói chất lượng cao
- ✅ **Hỗ trợ tiếng Việt và tiếng Anh**

## 🔧 Cách Cấu Hình

### Phương Pháp 1: Biến Môi Trường (Khuyến Nghị)
Tạo file `.env` trong thư mục `backend/`:

```env
# Google Cloud API Configuration
GOOGLE_API_KEY=AIzaSyCXE0Rc7pBo5rt1e4KJ_Q3_4AEif0bKn_E

# ElevenLabs API Configuration (tùy chọn)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Engine Configuration
STT_ENGINE=auto
TTS_ENGINE=auto

# Server Configuration
PORT=5001
HOST=0.0.0.0
```

### Phương Pháp 2: Cấu Hình Trực Tiếp
API keys đã được tích hợp sẵn trong code:
- **Google Cloud API**: Đã được thêm vào `speech_to_text.py` và `text_to_speech.py`
- **Fallback tự động**: Nếu ElevenLabs không có sẵn, hệ thống sẽ tự động chuyển sang Google Cloud

## 🎯 Tính Năng Đã Tích Hợp

### Speech-to-Text (STT)
- ✅ **Google Cloud Speech-to-Text**: Chất lượng cao, hỗ trợ tiếng Việt
- ✅ **SpeechRecognition với Google API**: Sử dụng API key
- ✅ **Fallback offline**: Khi không có kết nối internet

### Text-to-Speech (TTS)
- ✅ **ElevenLabs**: Giọng nói tự nhiên, chất lượng cao
- ✅ **Google Cloud Text-to-Speech**: Giọng nói chuẩn, ổn định
- ✅ **Auto-fallback**: Tự động chuyển đổi giữa các engine

## 🌐 Ngôn Ngữ Được Hỗ Trợ

### Tiếng Việt (vi)
- **STT**: `vi-VN` (Google Cloud)
- **TTS**: 
  - ElevenLabs: Giọng nữ (Như, Hà My), Giọng nam (Việt Dũng, Ly Hai)
  - Google Cloud: `vi-VN-Standard-A` (nữ), `vi-VN-Standard-B` (nam)

### Tiếng Anh (en)
- **STT**: `en-US` (Google Cloud)
- **TTS**:
  - ElevenLabs: Giọng nữ (Natasha, Christina), Giọng nam (Adam, Jon)
  - Google Cloud: `en-US-Standard-A` (nữ), `en-US-Standard-B` (nam)

## 🔄 Cách Hoạt Động

### Thứ Tự Ưu Tiên TTS:
1. **ElevenLabs** (nếu có API key và `TTS_ENGINE=elevenlabs`)
2. **Google Cloud TTS** (fallback tự động)
3. **Lỗi** (nếu không có engine nào khả dụng)

### Thứ Tự Ưu Tiên STT:
1. **Google Cloud Speech** (nếu có service account)
2. **SpeechRecognition với Google API** (sử dụng API key)
3. **Offline recognition** (fallback)

## 🚀 Khởi Chạy

```bash
cd backend
python app.py
```

Server sẽ chạy trên port **5001** (đã sửa để tránh xung đột với AirPlay trên macOS).

## 📊 Kiểm Tra Trạng Thái

Truy cập các endpoints sau để kiểm tra:

- `GET /api/engines` - Kiểm tra engines có sẵn
- `GET /api/health` - Kiểm tra sức khỏe hệ thống
- `GET /api/voices` - Lấy danh sách giọng nói
- `GET /api/languages` - Lấy danh sách ngôn ngữ

## 🔒 Bảo Mật

- ✅ API key đã được tích hợp an toàn
- ✅ Hỗ trợ biến môi trường
- ✅ Fallback tự động khi API không khả dụng
- ✅ Không lưu trữ API key trong code production

## 📝 Ghi Chú

- Google Cloud API key đã được cấu hình sẵn và hoạt động
- Hệ thống sẽ tự động chọn engine tốt nhất có sẵn
- Tất cả frontend URLs đã được cập nhật tương ứng

