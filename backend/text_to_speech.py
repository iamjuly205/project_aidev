"""
Dịch vụ chuyển văn bản thành giọng nói với ElevenLabs và Google Cloud APIs
Hỗ trợ đầy đủ tiếng Việt và tiếng Anh
"""

import os
import hashlib
import requests
from typing import Dict, Any
from dotenv import load_dotenv

# Tải biến môi trường
load_dotenv()

class TextToSpeechService:
    def __init__(self):
        """Khởi tạo dịch vụ Text-to-Speech với ElevenLabs và Google Cloud APIs"""
        # ElevenLabs API configuration - Hỗ trợ nhiều API keys
        self.elevenlabs_api_keys = self._load_elevenlabs_api_keys()
        self.current_api_key_index = 0
        self.elevenlabs_base_url = "https://api.elevenlabs.io/v1"
        
        # Google Cloud API configuration
        self.google_api_key = os.getenv('GOOGLE_API_KEY') or 'AIzaSyCXE0Rc7pBo5rt1e4KJ_Q3_4AEif0bKn_E'
        
        # Ngôn ngữ được hỗ trợ
        self.supported_languages = {
            'vi': 'Tiếng Việt',
            'en': 'English'
        }
        
        # Cấu hình giọng nói ElevenLabs - PHÂN BỔ CHO TỪNG API KEY + GOOGLE FALLBACK
        self.voice_configs = {
            'vi': {  # Tiếng Việt - VOICES THỰC SỰ LÀ TIẾNG VIỆT
                'female': {
                    'voice1': {
                        'voice_id': 'A5w1fw5x0uXded1LDvZp',  
                        'name': 'Như',
                        'description': 'Giọng miền Bắc',
                        'api_key_index': 0,  # API key main
                        'fallback_to_google': False  # Không fallback
                    },
                    'voice2': {
                        'voice_id': 'RmcV9cAq1TByxNSgbii7',  
                        'name': 'Hà My',
                        'description': 'Giọng miền Nam',
                        'api_key_index': 1,  # API key main
                        'fallback_to_google': True  # Fallback sang Google nếu lỗi
                    }
                },
                'male': {
                    'voice1': {
                        'voice_id': 'BUPPIXeDaJWBz696iXRS',  
                        'name': 'Việt Dũng',
                        'description': 'Giọng miền Bắc',
                        'api_key_index': 0,  # API key main
                        'fallback_to_google': True  # Fallback sang Google nếu lỗi
                    },
                    'voice2': {
                        'voice_id': '7hsfEc7irDn6E8br0qfw',  
                        'name': 'Ly Hai',
                        'description': 'Giọng miền Nam',
                        'api_key_index': 1,  # API key main
                        'fallback_to_google': True  # Fallback sang Google nếu lỗi
                    }
                }
            },
            'en': {  # Tiếng Anh - VOICES THỰC SỰ LÀ TIẾNG ANH
                'female': {
                    'voice1': {
                        'voice_id': '7NsaqHdLuKNFvEfjpUno',  
                        'name': 'Natasha',
                        'description': 'Young, energetic female voice',
                        'api_key_index': 0,  # API key 1
                        'fallback_to_google': True  # Fallback sang Google nếu lỗi
                    },
                    'voice2': {
                        'voice_id': '2qfp6zPuviqeCOZIE9RZ',  
                        'name': 'Christina',
                        'description': 'Gentle, professional female voice',
                        'api_key_index': 1,  # API key 1
                        'fallback_to_google': True  # Fallback sang Google nếu lỗi
                    }
                },
                'male': {
                    'voice1': {
                        'voice_id': 'wAGzRVkxKEs8La0lmdrE',  
                        'name': 'Adam',
                        'description': 'Strong, confident male voice',
                        'api_key_index': 1,  # API key 1
                        'fallback_to_google': True  # Fallback sang Google nếu lỗi
                    },
                    'voice2': {
                        'voice_id': 'MFZUKuGQUsGJPQjTS4wC',  
                        'name': 'Jon',
                        'description': 'Young, friendly male voice',
                        'api_key_index': 1,  # API key 1
                        'fallback_to_google': True  # Fallback sang Google nếu lỗi
                    }
                }
            }
        }
        
        # Giọng nói được hỗ trợ
        self.supported_voices = {
            'male': 'Giọng Nam',
            'female': 'Giọng Nữ'
        }
        
        print("✅ Dịch vụ Text-to-Speech với ElevenLabs và Google Cloud APIs đã được khởi tạo")
        print("🔧 Voice ID đã được cập nhật để đảm bảo đúng ngôn ngữ")
        if self.elevenlabs_api_keys:
            print(f"✅ Đã tải {len(self.elevenlabs_api_keys)} ElevenLabs API keys")
        else:
            print("⚠️ Không có ElevenLabs API key nào được cấu hình, sẽ sử dụng Google Cloud TTS")
        
        if self.google_api_key:
            print("✅ Google Cloud API Key đã được cấu hình")
        else:
            print("⚠️ Google Cloud API Key chưa được cấu hình")

    def _load_elevenlabs_api_keys(self):
        """Tải nhiều ElevenLabs API keys từ biến môi trường"""
        api_keys = []
        
        # API key chính
        main_key = os.getenv('ELEVENLABS_API_KEY')
        if main_key:
            api_keys.append(main_key)
        
        # Các API keys bổ sung
        for i in range(1, 10):  # Hỗ trợ tối đa 10 API keys
            additional_key = os.getenv(f'ELEVENLABS_API_KEY_{i}')
            if additional_key:
                api_keys.append(additional_key)
        
        if api_keys:
            print(f"✅ Đã tải {len(api_keys)} ElevenLabs API keys")
        else:
            print("⚠️ Không có ElevenLabs API key nào được cấu hình")
        
        return api_keys
    
    def _get_next_api_key(self):
        """Lấy API key tiếp theo theo round-robin"""
        if not self.elevenlabs_api_keys:
            return None
        
        api_key = self.elevenlabs_api_keys[self.current_api_key_index]
        self.current_api_key_index = (self.current_api_key_index + 1) % len(self.elevenlabs_api_keys)
        return api_key
    
    def _get_api_key_for_voice(self, voice_id: str) -> str:
        """Lấy API key phù hợp cho voice ID cụ thể"""
        if not self.elevenlabs_api_keys:
            return None
        
        # Tìm voice trong config để lấy api_key_index
        for language in self.voice_configs:
            for gender in self.voice_configs[language]:
                for voice_key, config in self.voice_configs[language][gender].items():
                    if config['voice_id'] == voice_id:
                        api_key_index = config.get('api_key_index', 0)
                        if api_key_index < len(self.elevenlabs_api_keys):
                            return self.elevenlabs_api_keys[api_key_index]
                        else:
                            # Fallback về round-robin nếu index vượt quá
                            return self._get_next_api_key()
        
        # Nếu không tìm thấy, sử dụng round-robin
        return self._get_next_api_key()

    def convert_text_to_speech(self, text: str, language: str = 'vi', voice: str = 'female', voice_id: str = None) -> Dict[str, Any]:
        """Chuyển văn bản thành giọng nói bằng ElevenLabs API hoặc Google Cloud TTS"""
        try:
            # Kiểm tra engine ưu tiên
            preferred_engine = os.getenv('TTS_ENGINE', 'auto').lower()
            
            # Thử ElevenLabs trước nếu có API key
            if self.elevenlabs_api_keys and (preferred_engine == 'elevenlabs' or preferred_engine == 'auto'):
                try:
                    return self._convert_with_elevenlabs(text, language, voice, voice_id)
                except Exception as e:
                    print(f"⚠️ ElevenLabs thất bại: {e}")
                    if preferred_engine == 'elevenlabs':
                        raise e
            
            # Fallback sang Google Cloud TTS
            if self.google_api_key:
                print("🔄 Chuyển sang Google Cloud TTS")
                return self.convert_text_to_speech_google_cloud(text, language, voice)
            else:
                raise Exception("Không có TTS engine nào khả dụng")
                
        except Exception as e:
            print(f"❌ Lỗi Text-to-Speech: {e}")
            raise e
            
    def _convert_with_elevenlabs(self, text: str, language: str = 'vi', voice: str = 'female', voice_id: str = None) -> Dict[str, Any]:
        """Chuyển văn bản thành giọng nói bằng ElevenLabs API"""
        try:
            if not self.elevenlabs_api_keys:
                raise Exception("ElevenLabs API Keys chưa được cấu hình")
            
            # Kiểm tra đầu vào
            if not text.strip():
                raise ValueError("Văn bản không được để trống")
            
            if language not in self.supported_languages:
                raise ValueError(f"Ngôn ngữ không được hỗ trợ: {language}")
            
            if voice not in self.supported_voices:
                raise ValueError(f"Giọng nói không được hỗ trợ: {voice}")
            
            # Lấy voice_id nếu không được cung cấp
            if not voice_id:
                # Mặc định sử dụng voice1 cho mỗi giới tính theo ngôn ngữ
                voice_id = self.voice_configs[language][voice]['voice1']['voice_id']
                print(f"🔧 Sử dụng voice_id mặc định: {voice_id} cho {language}-{voice}")
            
            # Tìm thông tin giọng nói theo voice_id được cung cấp
            voice_info = None
            voice_language = None
            for lang in self.voice_configs:
                for gender in self.voice_configs[lang]:
                    for voice_key, config in self.voice_configs[lang][gender].items():
                        if config['voice_id'] == voice_id:
                            voice_info = config
                            voice_language = lang
                            break
                    if voice_info:
                        break
                if voice_info:
                    break
            
            # Nếu không tìm thấy voice_id, sử dụng mặc định cho ngôn ngữ hiện tại
            if not voice_info:
                print(f"⚠️  Không tìm thấy voice_id {voice_id}, sử dụng mặc định cho {language}")
                voice_info = self.voice_configs[language][voice]['voice1']
                voice_id = voice_info['voice_id']
            else:
                # Giữ nguyên voice_id mà người dùng đã chọn, không tự động thay đổi theo ngôn ngữ
                print(f"✅ Sử dụng voice_id {voice_id} ({voice_info['name']}) cho ngôn ngữ {language}")
                print(f"ℹ️  Voice này thuộc ngôn ngữ {voice_language}, nhưng sẽ được sử dụng cho {language}")
            
            # Sử dụng API key phù hợp cho voice ID
            api_key = self._get_api_key_for_voice(voice_id)
            if api_key:
                # Tìm tên của API key
                key_names = ['Main', 'Additional 1', 'Additional 2', 'Additional 3']
                try:
                    key_index = self.elevenlabs_api_keys.index(api_key)
                    key_name = key_names[key_index] if key_index < len(key_names) else f'Key {key_index + 1}'
                    print(f"🔑 Sử dụng API key: {key_name} (index {key_index + 1}/{len(self.elevenlabs_api_keys)})")
                except ValueError:
                    print(f"🔑 Sử dụng API key: Unknown (round-robin)")
            else:
                print(f"⚠️  Không có API key khả dụng")
                raise Exception("Không có ElevenLabs API key khả dụng")
            
            # Chuẩn bị request
            url = f"{self.elevenlabs_base_url}/text-to-speech/{voice_id}"
            
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": api_key
            }
            
            data = {
                "text": text,
                "model_id": "eleven_flash_v2_5",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.0,
                    "use_speaker_boost": True
                }
            }
            
            print(f"🔊 Đang gọi ElevenLabs API với voice: {voice_info['name']} ({voice_id}) - Ngôn ngữ: {language}")
            
            # Gửi request
            response = requests.post(url, json=data, headers=headers, timeout=30)
            
            if response.status_code != 200:
                error_msg = f"ElevenLabs API error: {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail.get('detail', 'Unknown error')}"
                    
                    # Kiểm tra xem có phải lỗi voice_limit_reached không
                    if 'voice_limit_reached' in str(error_detail):
                        # Kiểm tra xem voice này có được cấu hình fallback sang Google không
                        if voice_info.get('fallback_to_google', False):
                            print(f"🔄 Voice {voice_info['name']} gặp lỗi giới hạn, chuyển sang Google Cloud TTS")
                            return self.convert_text_to_speech_google_cloud(text, language, voice)
                        else:
                            print(f"⚠️ Voice {voice_info['name']} gặp lỗi giới hạn và không được cấu hình fallback")
                    
                except:
                    error_msg += f" - {response.text}"
                
                raise Exception(error_msg)
            
            # Lưu âm thanh vào file
            text_hash = hashlib.md5(text.encode()).hexdigest()[:8]
            audio_filename = f"elevenlabs_{text_hash}_{language}_{voice}_{voice_info['name']}.mp3"
            audio_path = os.path.join("audio_output", audio_filename)
            os.makedirs("audio_output", exist_ok=True)
            
            with open(audio_path, "wb") as f:
                f.write(response.content)
            
            return {
                "success": True,
                "engine": "elevenlabs",
                "transcribed_text": text,
                "language": language,
                "voice_name": voice_info['name'],
                "voice_gender": voice,
                "voice_id": voice_id,
                "audio_filename": audio_filename,
                "audio_path": audio_path,
                "file_size": len(response.content),
                "word_count": len(text.split()),
                "duration": len(text.split()) * 0.5  # Ước tính thời gian
            }
            
        except Exception as e:
            print(f"❌ Lỗi ElevenLabs TTS: {e}")
            raise e

    def convert_text_to_speech_google_cloud(self, text: str, language: str = 'vi', voice: str = 'female') -> Dict[str, Any]:
        """Chuyển văn bản thành giọng nói bằng Google Cloud Text-to-Speech API"""
        try:
            if not self.google_api_key:
                raise Exception("Google Cloud API Key chưa được cấu hình")
            
            # Kiểm tra đầu vào
            if not text.strip():
                raise ValueError("Văn bản không được để trống")
            
            if language not in self.supported_languages:
                raise ValueError(f"Ngôn ngữ không được hỗ trợ: {language}")
            
            if voice not in self.supported_voices:
                raise ValueError(f"Giọng nói không được hỗ trợ: {voice}")
            
            # Cấu hình giọng nói Google Cloud
            google_voices = {
                'vi': {
                    'female': 'vi-VN-Standard-A',
                    'male': 'vi-VN-Standard-B'
                },
                'en': {
                    'female': 'en-US-Standard-A',
                    'male': 'en-US-Standard-B'
                }
            }
            
            voice_name = google_voices[language][voice]
            
            # Chuẩn bị request
            url = "https://texttospeech.googleapis.com/v1/text:synthesize"
            
            headers = {
                "Content-Type": "application/json"
            }
            
            data = {
                "input": {
                    "text": text
                },
                "voice": {
                    "languageCode": "vi-VN" if language == "vi" else "en-US",
                    "name": voice_name
                },
                "audioConfig": {
                    "audioEncoding": "MP3",
                    "speakingRate": 1.0,
                    "pitch": 0.0,
                    "volumeGainDb": 0.0
                }
            }
            
            print(f"🔊 Đang gọi Google Cloud TTS API với voice: {voice_name} - Ngôn ngữ: {language}")
            
            # Gửi request với API key
            response = requests.post(
                f"{url}?key={self.google_api_key}",
                json=data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code != 200:
                error_msg = f"Google Cloud TTS API error: {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail.get('error', {}).get('message', 'Unknown error')}"
                except:
                    error_msg += f" - {response.text}"
                raise Exception(error_msg)
            
            # Xử lý response
            response_data = response.json()
            audio_content = response_data.get('audioContent')
            
            if not audio_content:
                raise Exception("Không nhận được audio content từ Google Cloud TTS")
            
            # Decode base64 audio content
            import base64
            audio_bytes = base64.b64decode(audio_content)
            
            # Lưu âm thanh vào file
            text_hash = hashlib.md5(text.encode()).hexdigest()[:8]
            audio_filename = f"google_cloud_{text_hash}_{language}_{voice}.mp3"
            audio_path = os.path.join("audio_output", audio_filename)
            os.makedirs("audio_output", exist_ok=True)
            
            with open(audio_path, "wb") as f:
                f.write(audio_bytes)
            
            return {
                "success": True,
                "engine": "google_cloud",
                "transcribed_text": text,
                "language": language,
                "voice_name": voice_name,
                "voice_gender": voice,
                "audio_filename": audio_filename,
                "audio_path": audio_path,
                "file_size": len(audio_bytes),
                "word_count": len(text.split()),
                "duration": len(text.split()) * 0.5  # Ước tính thời gian
            }
            
        except Exception as e:
            print(f"❌ Lỗi Google Cloud TTS: {e}")
            raise e

    def get_voice_options(self, language: str = 'vi') -> Dict[str, Any]:
        """Lấy danh sách tùy chọn giọng nói chi tiết cho ElevenLabs"""
        if language not in self.voice_configs:
            return {"female_voices": [], "male_voices": []}
        
        result = {
            "female_voices": [],
            "male_voices": []
        }
        
        # Thêm giọng nữ
        for voice_key, config in self.voice_configs[language]['female'].items():
            result["female_voices"].append({
                "voice_id": config['voice_id'],
                "name": config['name'],
                "description": config['description'],
                "language": language,
                "gender": "female"
            })
        
        # Thêm giọng nam
        for voice_key, config in self.voice_configs[language]['male'].items():
            result["male_voices"].append({
                "voice_id": config['voice_id'],
                "name": config['name'],
                "description": config['description'],
                "language": language,
                "gender": "male"
            })
        
        print(f"✅ Trả về {len(result['female_voices'])} giọng nữ, {len(result['male_voices'])} giọng nam cho ngôn ngữ {language}")
        return result

    def get_voice_by_id(self, voice_id: str) -> Dict[str, Any]:
        """Lấy thông tin giọng nói theo voice_id"""
        for language in self.voice_configs:
            for gender in self.voice_configs[language]:
                for voice_key, config in self.voice_configs[language][gender].items():
                    if config['voice_id'] == voice_id:
                        return {
                            'language': language,
                            'gender': gender,
                            'voice_key': voice_key,
                            'voice_id': voice_id,
                            'name': config['name'],
                            'description': config['description']
                        }
        return None
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Lấy danh sách ngôn ngữ được hỗ trợ"""
        return self.supported_languages
    
    def get_supported_voices(self) -> Dict[str, str]:
        """Lấy danh sách giọng nói được hỗ trợ"""
        return self.supported_voices
    
    def get_available_engines(self) -> Dict[str, bool]:
        """Lấy trạng thái các TTS engines có sẵn"""
        return {
            "elevenlabs": self.elevenlabs_api_keys is not None,
            "google_cloud": self.google_api_key is not None
        }
    
    def get_voice_samples(self) -> Dict[str, Any]:
        """Lấy văn bản mẫu để test giọng nói"""
        return {
            'vi': {
                'sample_text': 'Xin chào, đây là giọng nói tiếng Việt từ ElevenLabs. Chất lượng âm thanh rất tốt và phát âm chuẩn.',
                'female_description': 'Giọng nữ ElevenLabs tự nhiên, phát âm chuẩn, dễ nghe',
                'male_description': 'Giọng nam ElevenLabs tự nhiên, phát âm chuẩn, truyền cảm'
            },
            'en': {
                'sample_text': 'Hello, this is English voice from ElevenLabs. The audio quality is excellent with clear pronunciation.',
                'female_description': 'Natural ElevenLabs female voice, clear and pleasant',
                'male_description': 'Natural ElevenLabs male voice, professional and clear'
            }
        }

    def test_voice_by_id(self, voice_id: str, text: str = None, language: str = 'vi') -> Dict[str, Any]:
        """Test giọng nói bằng voice_id cụ thể"""
        if not text:
            samples = self.get_voice_samples()
            text = samples[language]['sample_text']
        
        voice_info = self.get_voice_by_id(voice_id)
        if not voice_info:
            raise ValueError(f"Voice ID không tồn tại: {voice_id}")
        
        return self.convert_text_to_speech(
            text=text,
            language=language,
            voice=voice_info['gender'],
            voice_id=voice_id
        )

# Ví dụ sử dụng
if __name__ == "__main__":
    try:
        tts_service = TextToSpeechService()
        
        print("🔊 Engines có sẵn:", tts_service.get_available_engines())
        print("🎵 Voice options (VI):", tts_service.get_voice_options('vi'))
        print("🎵 Voice options (EN):", tts_service.get_voice_options('en'))
        
        # Test chuyển đổi tiếng Việt
        print("\n🇻🇳 Test tiếng Việt:")
        result_vi = tts_service.convert_text_to_speech(
            text="Xin chào, tôi là giọng nữ tiếng Việt từ ElevenLabs",
            language="vi",
            voice="female"
        )
        print(f"   - Engine: {result_vi['engine']}")
        print(f"   - Voice: {result_vi['voice_name']}")
        print(f"   - File: {result_vi['audio_filename']}")
        
        # Test chuyển đổi tiếng Anh
        print("\n🇺🇸 Test tiếng Anh:")
        result_en = tts_service.convert_text_to_speech(
            text="Hello, I am an English female voice from ElevenLabs",
            language="en",
            voice="female"
        )
        print(f"   - Engine: {result_en['engine']}")
        print(f"   - Voice: {result_en['voice_name']}")
        print(f"   - File: {result_en['audio_filename']}")
        
    except Exception as e:
        print(f"❌ Test thất bại: {e}")

