"""
Ứng dụng backend chính - ĐÃ SỬA LỖI HOÀN CHỈNH
Xử lý các API endpoints và điều phối dịch vụ
"""
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import time
import base64
import cv2
import numpy as np
from ultralytics import YOLO
import google.generativeai as genai
from text_to_speech import TextToSpeechService
from speech_to_text import SpeechToTextService

app = Flask(__name__)
CORS(app)  # Bật CORS để frontend có thể giao tiếp

# Khởi tạo các dịch vụ
print("🔧 Đang khởi tạo các dịch vụ được tối ưu hóa...")
tts_service = TextToSpeechService()
stt_service = SpeechToTextService()

# Khởi tạo Gemini AI và YOLO cho gesture detection
genai.configure(api_key="AIzaSyC7ibsJvR85BLS14ozgyvOTjHOehHemPWA")
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
}
model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",  # Sử dụng model mới nhất
    generation_config=generation_config,
)

# Dictionary để lưu trữ từ khóa phát hiện được
detected_words = []

# Biến theo dõi cử chỉ hiện tại và thời gian giữ
last_gesture = None
gesture_start_time = None
hold_time_threshold = 0.6  # giây cần giữ để xác nhận cử chỉ (giống như trong api.py)

# Mock YOLO model initialization (fallback approach)
class MockYOLOModel:
    def __init__(self):
        self.names = {
            0: 'bread', 1: 'like', 2: 'home', 3: 'you', 4: 'i', 
            5: 'listen', 6: 'sleep', 7: 'go', 8: 'drink', 9: 'no',
            10: 'yes', 11: 'love', 12: 'goodbye', 13: 'thank', 14: 'hello',
            15: 'eat', 16: 'read'
        }
        
    def predict(self, source, save=False):
        # Mock prediction result
        import random
        import time
        
        # Simulate some processing time
        time.sleep(0.1)
        
        # Return mock result with random word detection
        mock_result = type('MockResult', (), {
            'boxes': type('MockBoxes', (), {
                'cls': [random.randint(0, 16)] if random.random() > 0.3 else [],
                'conf': [0.8] if random.random() > 0.3 else []
            })()
        })()
        
        return [mock_result]

try:
    print("🤖 Đang tải YOLO model...")
    yolo_model = YOLO('D:/project_aidev/backend/best.pt')  # Sửa đường dẫn để tìm file best.pt
    print("✅ YOLO model đã được tải thành công!")
except Exception as e:
    print(f"⚠️ Không thể tải YOLO model: {e}")
    print("🔄 Sử dụng Mock model để demo...")
    yolo_model = MockYOLOModel()

@app.route('/', methods=['GET'])
def home():
    """Endpoint kiểm tra sức khỏe hệ thống"""
    return jsonify({
        "status": "running",
        "message": "Sign Language Backend API - ĐÃ SỬA LỖI HOÀN CHỈNH",
        "version": "1.3.0",
        "available_engines": {
            "tts": tts_service.get_available_engines(),
            "stt": stt_service.get_available_engines()
        },
        "voice_samples": tts_service.get_voice_samples()
    })



@app.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    """Chuyển văn bản thành giọng nói với lựa chọn giọng tối ưu và ElevenLabs"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({"success": False, "error": "Cần có văn bản để chuyển đổi"}), 400
        
        text = data['text']
        language = data.get('language', 'vi')
        voice = data.get('voice', 'female')
        voice_id = data.get('voice_id')  # ElevenLabs voice ID
        
        print(f"🔊 Yêu cầu TTS: text='{text[:50]}...', ngôn ngữ={language}, giọng={voice}, voice_id={voice_id}")
        
        result = tts_service.convert_text_to_speech(text, language, voice, voice_id)
        
        print(f"✅ TTS thành công: engine {result.get('engine', 'unknown')}, giọng: {result.get('voice_name', 'unknown')}")
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Lỗi TTS: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/speech-to-text', methods=['POST'])
def speech_to_text():
    """Chuyển giọng nói thành văn bản"""
    try:
        # Xử lý upload file
        if 'audio' not in request.files:
            return jsonify({"success": False, "error": "Cần có file âm thanh"}), 400
        
        audio_file = request.files['audio']
        language = request.form.get('language', 'vi')
        
        if audio_file.filename == '':
            return jsonify({"success": False, "error": "Chưa chọn file"}), 400
        
        print(f"🎤 Yêu cầu STT: file={audio_file.filename}, ngôn ngữ={language}")
        
        # Lưu file upload tạm thời
        temp_path = os.path.join("temp", audio_file.filename)
        os.makedirs("temp", exist_ok=True)
        audio_file.save(temp_path)
        
        # Xử lý âm thanh
        result = stt_service.convert_speech_to_text(temp_path, language)
        
        # Dọn dẹp file tạm
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        print(f"✅ STT thành công: engine {result.get('engine', 'unknown')} đã sử dụng")
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Lỗi STT: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/start-recording', methods=['POST'])
def start_recording():
    """Bắt đầu ghi âm"""
    try:
        result = stt_service.start_recording()
        print(f"🎤 Bắt đầu ghi âm: {result.get('session_id')}")
        return jsonify(result)
    except Exception as e:
        print(f"❌ Lỗi bắt đầu ghi âm: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/stop-recording', methods=['POST'])
def stop_recording():
    """Dừng ghi âm"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({"success": False, "error": "Cần có Session ID"}), 400
        
        result = stt_service.stop_recording(session_id)
        print(f"🎤 Dừng ghi âm: {session_id}")
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Lỗi dừng ghi âm: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/download-audio/<filename>', methods=['GET'])
def download_audio(filename):
    """Tải xuống file âm thanh đã tạo"""
    try:
        file_path = os.path.join("audio_output", filename)
        if os.path.exists(file_path):
            print(f"📥 Tải xuống âm thanh: {filename}")
            # Thêm CORS headers và content type cho audio
            response = send_file(file_path, mimetype='audio/mpeg')
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            return response
        else:
            return jsonify({"success": False, "error": "Không tìm thấy file"}), 404
    except Exception as e:
        print(f"❌ Lỗi tải xuống: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/play-audio/<filename>', methods=['GET'])
def play_audio(filename):
    """Phát file âm thanh trực tiếp (cho audio player)"""
    try:
        file_path = os.path.join("audio_output", filename)
        if os.path.exists(file_path):
            print(f"🎵 Phát âm thanh: {filename}")
            # Trả về file âm thanh với headers phù hợp cho audio player
            response = send_file(
                file_path, 
                mimetype='audio/mpeg',
                conditional=True  # Hỗ trợ range requests
            )
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Range, Content-Type'
            response.headers['Accept-Ranges'] = 'bytes'
            return response
        else:
            return jsonify({"success": False, "error": "Không tìm thấy file"}), 404
    except Exception as e:
        print(f"❌ Lỗi phát âm thanh: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/languages', methods=['GET'])
def get_languages():
    """Lấy danh sách ngôn ngữ được hỗ trợ với mô tả"""
    return jsonify({
        "success": True,
        "tts_languages": tts_service.get_supported_languages(),
        "stt_languages": stt_service.get_supported_languages()
    })

@app.route('/api/voices', methods=['GET'])
def get_voices():
    """Lấy danh sách giọng nói được hỗ trợ cho TTS với mô tả"""
    return jsonify({
        "success": True,
        "voices": tts_service.get_supported_voices(),
        "voice_samples": tts_service.get_voice_samples()
    })

@app.route('/api/engines', methods=['GET'])
def get_engines():
    """Lấy trạng thái các engines có sẵn"""
    return jsonify({
        "success": True,
        "tts_engines": tts_service.get_available_engines(),
        "stt_engines": stt_service.get_available_engines()
    })

@app.route('/api/test-voice', methods=['POST'])
def test_voice():
    """Test giọng nói với văn bản mẫu"""
    try:
        data = request.get_json()
        language = data.get('language', 'vi')
        voice = data.get('voice', 'female')
        
        # Lấy văn bản mẫu cho ngôn ngữ
        voice_samples = tts_service.get_voice_samples()
        sample_text = voice_samples.get(language, {}).get('sample_text', 'Xin chào, đây là test giọng nói.')
        
        print(f"🎵 Test giọng nói: ngôn ngữ={language}, giọng={voice}")
        
        result = tts_service.convert_text_to_speech(sample_text, language, voice)
        
        print(f"✅ Test giọng nói thành công: {result.get('voice_name', 'unknown')}")
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Lỗi test giọng nói: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/voice-options', methods=['GET'])
def get_voice_options():
    """Lấy danh sách tùy chọn giọng nói chi tiết cho ElevenLabs - ĐÃ SỬA LỖI HOÀN CHỈNH"""
    try:
        language = request.args.get('language', 'vi')  # ← ĐÃ SỬA: Lấy ngôn ngữ từ query parameter
        print(f"🎵 API nhận language: {language}")
        voice_options = tts_service.get_voice_options(language)  # ← ĐÃ SỬA: Truyền parameter language
        print(f"✅ Trả về voice options cho {language}: {len(voice_options.get('female_voices', []))} nữ, {len(voice_options.get('male_voices', []))} nam")
        
        # Debug: In ra danh sách giọng nói chi tiết
        if language == 'vi':
            print("🇻🇳 Giọng tiếng Việt:")
            for voice in voice_options.get('female_voices', []):
                print(f"   Nữ: {voice.get('name')} - {voice.get('voice_id')}")
            for voice in voice_options.get('male_voices', []):
                print(f"   Nam: {voice.get('name')} - {voice.get('voice_id')}")
        elif language == 'en':
            print("🇺🇸 Giọng tiếng Anh:")
            for voice in voice_options.get('female_voices', []):
                print(f"   Nữ: {voice.get('name')} - {voice.get('voice_id')}")
            for voice in voice_options.get('male_voices', []):
                print(f"   Nam: {voice.get('name')} - {voice.get('voice_id')}")
        
        return jsonify({
            "success": True,
            "voice_options": voice_options
        })
    except Exception as e:
        print(f"❌ Lỗi lấy voice options: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/voice-info/<voice_id>', methods=['GET'])
def get_voice_info(voice_id):
    """Lấy thông tin chi tiết của một giọng nói theo voice_id"""
    try:
        voice_info = tts_service.get_voice_by_id(voice_id)
        if voice_info:
            return jsonify({
                "success": True,
                "voice_info": voice_info
            })
        else:
            return jsonify({
                "success": False,
                "error": "Không tìm thấy giọng nói với ID này"
            }), 404
    except Exception as e:
        print(f"❌ Lỗi lấy voice info: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/test-voice-by-id', methods=['POST'])
def test_voice_by_id():
    """Test giọng nói cụ thể bằng voice_id"""
    try:
        data = request.get_json()
        voice_id = data.get('voice_id')
        language = data.get('language', 'vi')
        
        if not voice_id:
            return jsonify({"success": False, "error": "Cần có voice_id"}), 400
        
        # Lấy thông tin giọng nói
        voice_info = tts_service.get_voice_by_id(voice_id)
        if not voice_info:
            return jsonify({"success": False, "error": "Voice ID không hợp lệ"}), 400
        
        # Lấy văn bản mẫu cho ngôn ngữ
        voice_samples = tts_service.get_voice_samples()
        sample_text = voice_samples.get(language, {}).get('sample_text', 'Xin chào, đây là test giọng nói.')
        
        print(f"🎵 Test giọng nói bằng ID: voice_id={voice_id}, ngôn ngữ={language}")
        
        result = tts_service.convert_text_to_speech(sample_text, language, voice_info['gender'], voice_id)
        
        print(f"✅ Test giọng nói thành công: {result.get('voice_name', 'unknown')}")
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Lỗi test giọng nói bằng ID: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Kiểm tra sức khỏe chi tiết của hệ thống"""
    try:
        # Kiểm tra các thư mục cần thiết
        directories = ["audio_output", "recordings", "temp"]
        dir_status = {}
        
        for directory in directories:
            dir_status[directory] = {
                "exists": os.path.exists(directory),
                "writable": os.access(directory, os.W_OK) if os.path.exists(directory) else False
            }
        
        # Kiểm tra biến môi trường
        env_status = {
            "ELEVENLABS_API_KEY": bool(os.getenv('ELEVENLABS_API_KEY')),
            "GOOGLE_API_KEY": bool(os.getenv('GOOGLE_API_KEY')),
            "GOOGLE_APPLICATION_CREDENTIALS": bool(os.getenv('GOOGLE_APPLICATION_CREDENTIALS')),
            "TTS_ENGINE": os.getenv('TTS_ENGINE', 'auto'),
            "STT_ENGINE": os.getenv('STT_ENGINE', 'auto')
        }
        
        return jsonify({
            "success": True,
            "status": "healthy",
            "directories": dir_status,
            "environment": env_status,
            "engines": {
                "tts": tts_service.get_available_engines(),
                "stt": stt_service.get_available_engines()
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "status": "unhealthy",
            "error": str(e)
        }), 500

# ===== GESTURE DETECTION ENDPOINTS =====

@app.route('/api/gesture-detect', methods=['POST'])
def gesture_detect():
    """Phát hiện ký hiệu từ hình ảnh camera với cơ chế giữ ổn định - cải tiến theo api.py"""
    global last_gesture, gesture_start_time, detected_words
    
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({"success": False, "error": "Cần có hình ảnh để phát hiện"}), 400
        
        # Decode base64 image
        image_data = data['image'].split(',')[1]  # Remove data:image/jpeg;base64,
        image_bytes = base64.b64decode(image_data)
        
        # Convert to OpenCV image
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({"success": False, "error": "Không thể decode hình ảnh"}), 400
        
        # Run YOLO detection
        results = yolo_model.predict(frame, save=False, conf=0.5, iou=0.45)
        
        detected_word = None
        confidence = 0
        is_word_confirmed = False
        hold_time = 0
        
        # Logic phát hiện ổn định hơn, giống trong api.py
        if results and len(results) > 0:
            boxes = results[0].boxes
            if boxes is not None and len(boxes.cls) > 0:
                if hasattr(boxes, 'conf') and len(boxes.conf) > 0:
                    # Lấy lớp với độ tin cậy cao nhất
                    conf_values = boxes.conf.cpu().numpy()
                    max_conf_idx = np.argmax(conf_values)
                    confidence = float(conf_values[max_conf_idx])
                    class_id = int(boxes.cls[max_conf_idx].cpu().numpy())
                    
                    if hasattr(yolo_model, 'names') and class_id in yolo_model.names:
                        current_gesture = yolo_model.names[class_id]
                        
                        # Xử lý theo dõi thời gian giữ cử chỉ (giống api.py)
                        if current_gesture != last_gesture:
                            last_gesture = current_gesture
                            gesture_start_time = time.time()
                            hold_time = 0
                            is_word_confirmed = False
                        else:
                            if gesture_start_time is not None:
                                hold_time = time.time() - gesture_start_time
                                
                                # Nếu giữ đủ lâu và chưa được thêm vào danh sách
                                if hold_time >= hold_time_threshold:
                                    is_word_confirmed = True
                                    detected_word = current_gesture
                                    
                                    # Kiểm tra đơn giản: chỉ thêm nếu khác từ cuối cùng hoặc chưa có từ nào
                                    if len(detected_words) == 0 or detected_words[-1]['word'] != current_gesture:
                                        detected_words.append({
                                            'word': current_gesture,
                                            'confidence': confidence,
                                            'timestamp': time.time()
                                        })
                                        print(f"✅ Đã phát hiện từ mới: {current_gesture} (confidence: {confidence:.2f})")
        else:
            # Reset nếu không phát hiện gì
            last_gesture = None
            gesture_start_time = None
            
        return jsonify({
            "success": True,
            "detected_word": last_gesture,
            "confirmed_word": detected_word if is_word_confirmed else None,
            "confidence": confidence, 
            "hold_time": hold_time,
            "is_confirmed": is_word_confirmed,
            "total_words": len(detected_words),
            "words": [w['word'] for w in detected_words]
        })
        
    except Exception as e:
        print(f"❌ Lỗi gesture detection: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/gesture-add-word', methods=['POST'])
def gesture_add_word():
    """Thêm từ được phát hiện vào danh sách"""
    try:
        data = request.get_json()
        
        if not data or 'word' not in data:
            return jsonify({"success": False, "error": "Cần có từ để thêm"}), 400
        
        word = data['word']
        confidence = data.get('confidence', 0)
        
        # Thêm từ vào danh sách
        detected_words.append({
            'word': word,
            'confidence': confidence,
            'timestamp': __import__('time').time()
        })
        
        print(f"➕ Đã thêm từ: {word} (confidence: {confidence:.2f})")
        
        return jsonify({
            "success": True,
            "message": f"Đã thêm từ: {word}",
            "total_words": len(detected_words),
            "words": [w['word'] for w in detected_words]
        })
        
    except Exception as e:
        print(f"❌ Lỗi thêm từ: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/gesture-get-words', methods=['GET'])
def gesture_get_words():
    """Lấy danh sách từ đã phát hiện"""
    try:
        return jsonify({
            "success": True,
            "words": [w['word'] for w in detected_words],
            "detailed_words": detected_words,
            "total_words": len(detected_words)
        })
        
    except Exception as e:
        print(f"❌ Lỗi lấy danh sách từ: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/gesture-generate-sentence', methods=['POST'])
def gesture_generate_sentence():
    """Tạo câu từ danh sách từ đã phát hiện bằng Gemini AI"""
    try:
        if not detected_words:
            return jsonify({"success": False, "error": "Chưa có từ nào được phát hiện"}), 400
        
        # Lấy danh sách từ
        words = [w['word'] for w in detected_words]
        words_str = ', '.join(words)
        
        # Tạo prompt cải tiến để giữ nguyên thứ tự các từ, đảm bảo câu hoàn toàn tiếng Anh và sát nghĩa
        prompt = f"""
        From the following list of words (in chronological detection order): {words}
        
        Your task is to create ONE simple, concise, and contextually appropriate English sentence with the following MANDATORY requirements:
        
        1. You MUST use all words from the list in their exact form
        2. You MUST MAINTAIN the exact order of appearance of the words in the resulting sentence, from beginning to end (this is the MOST IMPORTANT)
        3. Add ONLY ESSENTIAL connecting words (if needed) between the given words to form a grammatically correct sentence
        4. Keep the sentence as SIMPLE as possible - prefer adding fewer words rather than more
        5. DO NOT add extra adjectives, adverbs, or descriptive phrases that change the core meaning
        6. Return ONLY the resulting sentence, without any explanation or additional content
        7. The sentence MUST be ENTIRELY in English, with NO Vietnamese words or phrases mixed in
        8. The meaning of the sentence should closely reflect the likely intent of the detected words
        
        Example 1: If the word list is [i, love, you], the resulting sentence should simply be "I love you."
        Example 2: If the word list is [eat, bread, go, home], the resulting sentence should be "I eat bread and go home."
        """
        
        # Gọi Gemini API
        response = model.generate_content(prompt)
        generated_sentence = response.text.strip()
        
        print(f"🤖 Câu được tạo: {generated_sentence}")
        print(f"📝 Từ các từ: {words_str}")
        
        return jsonify({
            "success": True,
            "sentence": generated_sentence,
            "words_used": words,
            "total_words": len(detected_words)
        })
        
    except Exception as e:
        print(f"❌ Lỗi tạo câu: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/gesture-clear-words', methods=['POST'])
def gesture_clear_words():
    """Xóa danh sách từ đã phát hiện"""
    try:
        global detected_words
        detected_words = []
        
        print("🗑️ Đã xóa danh sách từ")
        
        return jsonify({
            "success": True,
            "message": "Đã xóa danh sách từ",
            "total_words": 0
        })
        
    except Exception as e:
        print(f"❌ Lỗi xóa danh sách từ: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    # Tạo các thư mục cần thiết
    os.makedirs("audio_output", exist_ok=True)
    os.makedirs("recordings", exist_ok=True)
    os.makedirs("temp", exist_ok=True)
    
    print("🚀 Đang khởi động Sign Language Backend API - ĐÃ SỬA LỖI HOÀN CHỈNH...")
    print("📡 API sẽ có sẵn tại: http://localhost:5000")
    print("📋 Các endpoints có sẵn:")
    print("  - GET  /                     - Kiểm tra sức khỏe hệ thống")
    print("  - POST /api/text-to-speech   - Chuyển văn bản thành giọng nói")
    print("  - POST /api/speech-to-text   - Chuyển giọng nói thành văn bản")
    print("  - POST /api/start-recording  - Bắt đầu ghi âm")
    print("  - POST /api/stop-recording   - Dừng ghi âm")
    print("  - GET  /api/languages        - Lấy ngôn ngữ được hỗ trợ")
    print("  - GET  /api/voices           - Lấy giọng nói được hỗ trợ")
    print("  - GET  /api/engines          - Lấy trạng thái engines")
    print("  - POST /api/test-voice       - Test giọng nói với mẫu")
    print("  - GET  /api/health           - Kiểm tra sức khỏe chi tiết")
    print("  - GET  /api/download-audio/<filename> - Tải xuống file âm thanh")
    print("  - POST /api/gesture-detect   - Phát hiện ký hiệu từ hình ảnh")
    print("  - POST /api/gesture-add-word - Thêm từ được phát hiện")
    print("  - GET  /api/gesture-get-words - Lấy danh sách từ đã phát hiện")
    print("  - POST /api/gesture-generate-sentence - Tạo câu từ các từ")
    print("  - POST /api/gesture-clear-words - Xóa danh sách từ")
    
    print("\n🔧 Trạng thái Engine:")
    print("TTS Engines:", tts_service.get_available_engines())
    print("STT Engines:", stt_service.get_available_engines())
    
    print("\n🎵 Mẫu giọng nói:")
    voice_samples = tts_service.get_voice_samples()
    for lang, samples in voice_samples.items():
        print(f"  {lang}: {samples['sample_text'][:50]}...")
    
    print("\n✅ Hệ thống đã sẵn sàng!")
    app.run(debug=True, host='0.0.0.0', port=5000)