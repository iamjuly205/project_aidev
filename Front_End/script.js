// ===== UNIFIED SCRIPT - GỘP TẤT CẢ CHỨC NĂNG =====
// Gộp script.js + script-elevenlabs.js + script-elevenlabs-fixed.js
console.log('🚀 Đang tải script thống nhất với tất cả chức năng...');

// ===== BIẾN GLOBAL =====
// Audio Player
let currentAudio = null;
let isPlaying = false;

// Speech Recognition
let recognition = null;
let isRecording = false;
let recordingTimer = null;
let recordingTime = 0;

// ElevenLabs Voice Options
let voiceOptionsData = null;
let selectedVoiceId = null; // Lưu trữ voice ID đã chọn

// Authentication
let isLoggedIn = false;
let currentUser = null;

// Theme & Language
let isDarkTheme = localStorage.getItem('darkTheme') === 'true';
let currentLanguage = localStorage.getItem('language') || 'vi';


function showDashboard() {
    console.log('🎯 Hiển thị dashboard');
    // Ẩn toàn bộ trang chủ
    const homeWrapper = document.getElementById('homeWrapper');
    if (homeWrapper) homeWrapper.style.display = 'none';

    // Hiện Dashboard
    document.getElementById('dashboardPage').style.display = 'block';

    document.title = currentLanguage === 'vi' ? 'Dashboard - Sign Language' : 'Dashboard - Sign Language';
    initializeDashboard();

    // Scroll lên đầu cho gọn
    window.scrollTo({ top: 0, behavior: 'instant' });
}



function showHomePage() {
    console.log('🏠 Hiển thị trang chủ');

    const homeWrapper = document.getElementById('homeWrapper');
    if (homeWrapper) homeWrapper.style.display = 'block';

    document.getElementById('dashboardPage').style.display = 'none';

  // Phần reset style cơ bản có thể giữ nguyên hoặc lược bớt nếu không cần
    document.body.style.overflow = 'auto';
    document.title = currentLanguage === 'vi'
    ? 'Sign Language - Ngôn Ngữ Ký Hiệu'
    : 'Sign Language Recognition Tool';

    window.requestAnimationFrame(() => { document.body.offsetHeight; });


    // Đảm bảo header được định vị đúng
    const header = document.querySelector('.header');
    if (header) {
        header.style.position = '';
        header.style.top = '';
        header.style.zIndex = '';
        header.style.transform = '';
    }
    
    // Reset style container
    const container = document.querySelector('.container');
    if (container) {
        container.style.paddingTop = '';
        container.style.position = '';
        container.style.height = '';
    }
    
    // Buộc tính toán lại layout
    window.requestAnimationFrame(() => {
        document.body.offsetHeight; // Buộc repaint
    });
}

// ===== VIDEO MODAL FUNCTIONALITY =====
const videoCards = document.querySelectorAll(".video-card");
const modal = document.getElementById("videoModal");
const modalVideo = document.getElementById("modalVideo");
const closeBtn = document.querySelector(".close-btn");

videoCards.forEach(card => {
    card.addEventListener("click", () => {
        const videoSrc = card.getAttribute("data-video");
        modalVideo.querySelector("source").src = videoSrc;
        modalVideo.load();
        modal.style.display = "flex";
    });
});

closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    modalVideo.pause();
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
        modalVideo.pause();
    }
});


// ===== ELEVENLABS VOICE OPTIONS =====
function loadVoiceOptionsFromBackend() {
    const languageSelect = document.getElementById('languageSelect');
    const language = languageSelect ? languageSelect.value : 'vi';
    console.log('🎵 Đang tải danh sách giọng nói cho ngôn ngữ:', language);
    
    // Lưu voice ID hiện tại trước khi tải
    const currentVoiceId = selectedVoiceId;
    console.log(`🎵 Lưu voice ID hiện tại trước khi tải: ${currentVoiceId}`);
    
    fetch(`http://localhost:5000/api/voice-options?language=${language}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                voiceOptionsData = data.voice_options;
                console.log('✅ Đã tải danh sách giọng nói:', voiceOptionsData);
                updateVoiceSelectFromGender();
                
                // Khôi phục voice ID đã chọn sau khi tải xong
                const voiceSelect = document.getElementById('voiceSelect');
                if (voiceSelect && currentVoiceId) {
                    // Kiểm tra xem voice ID có trong danh sách mới không
                    const allVoices = [...voiceOptionsData.female_voices, ...voiceOptionsData.male_voices];
                    if (allVoices.some(voice => voice.voice_id === currentVoiceId)) {
                        voiceSelect.value = currentVoiceId;
                        selectedVoiceId = currentVoiceId; // Đảm bảo selectedVoiceId được cập nhật
                        console.log(`🎵 Khôi phục voice ID sau khi tải: ${currentVoiceId}`);
                    } else {
                        console.log(`⚠️ Voice ID ${currentVoiceId} không có trong danh sách mới, giữ nguyên lựa chọn hiện tại`);
                        // Nếu voice ID không có trong danh sách mới, vẫn giữ nguyên selectedVoiceId
                        selectedVoiceId = currentVoiceId;
                    }
                }
            } else {
                console.error('❌ Lỗi tải danh sách giọng nói:', data.error);
                setDefaultVoiceOptionsData();
            }
        })
        .catch(error => {
            console.error('❌ Lỗi kết nối khi tải giọng nói:', error);
            setDefaultVoiceOptionsData();
        });
}

function setDefaultVoiceOptionsData() {
    console.log('🔄 Sử dụng danh sách giọng nói mặc định');
    const languageSelect = document.getElementById('languageSelect');
    const language = languageSelect ? languageSelect.value : 'vi';
    
    // Lưu voice ID hiện tại trước khi thay đổi
    const currentVoiceId = selectedVoiceId;
    console.log(`🎵 Lưu voice ID hiện tại trước khi set default: ${currentVoiceId}`);
    
    // Cấu hình voice theo ngôn ngữ được chọn
    const voiceConfigs = {
        'vi': {
            female_voices: [
                { id: 'voice1', name: 'voice-nhu', description: 'voice-nhu-desc', voice_id: 'A5w1fw5x0uXded1LDvZp', language: 'vi' },
                { id: 'voice2', name: 'voice-ha-my', description: 'voice-ha-my-desc', voice_id: 'RmcV9cAq1TByxNSgbii7', language: 'vi' }
            ],
            male_voices: [
                { id: 'voice1', name: 'voice-viet-dung', description: 'voice-viet-dung-desc', voice_id: 'BUPPIXeDaJWBz696iXRS', language: 'vi' },
                { id: 'voice2', name: 'voice-ly-hai', description: 'voice-ly-hai-desc', voice_id: '7hsfEc7irDn6E8br0qfw', language: 'vi' }
            ]
        },
        'en': {
            female_voices: [
                { id: 'voice1', name: 'voice-natasha', description: 'voice-natasha-desc', voice_id: '7NsaqHdLuKNFvEfjpUno', language: 'en' },
                { id: 'voice2', name: 'voice-christina', description: 'voice-christina-desc', voice_id: '2qfp6zPuviqeCOZIE9RZ', language: 'en' }
            ],
            male_voices: [
                { id: 'voice1', name: 'voice-adam', description: 'voice-adam-desc', voice_id: 'wAGzRVkxKEs8La0lmdrE', language: 'en' },
                { id: 'voice2', name: 'voice-jon', description: 'voice-jon-desc', voice_id: 'MFZUKuGQUsGJPQjTS4wC', language: 'en' }
            ]
        }
    };
    
    // Sử dụng voice options theo ngôn ngữ được chọn
    voiceOptionsData = voiceConfigs[language] || voiceConfigs['vi'];
    updateVoiceSelectFromGender();
    
    // Khôi phục voice ID đã chọn sau khi set default
    const voiceSelect = document.getElementById('voiceSelect');
    if (voiceSelect && currentVoiceId) {
        const allVoices = [...voiceOptionsData.female_voices, ...voiceOptionsData.male_voices];
        if (allVoices.some(voice => voice.voice_id === currentVoiceId)) {
            voiceSelect.value = currentVoiceId;
            selectedVoiceId = currentVoiceId; // Đảm bảo selectedVoiceId được cập nhật
            console.log(`🎵 Khôi phục voice ID sau khi set default: ${currentVoiceId}`);
        } else {
            console.log(`⚠️ Voice ID ${currentVoiceId} không có trong danh sách cho ngôn ngữ ${language}, giữ nguyên lựa chọn`);
            // Nếu voice ID không có trong danh sách cho ngôn ngữ hiện tại, vẫn giữ nguyên selectedVoiceId
            selectedVoiceId = currentVoiceId;
        }
    }
}

function updateVoiceSelectFromGender() {
    const genderSelect = document.getElementById('genderSelect');
    const voiceSelect = document.getElementById('voiceSelect');
    
    if (!genderSelect || !voiceSelect || !voiceOptionsData) {
        console.log('⚠️ Không thể cập nhật voice select - thiếu elements hoặc data');
        console.log('genderSelect:', !!genderSelect, 'voiceSelect:', !!voiceSelect, 'voiceOptionsData:', !!voiceOptionsData);
        return;
    }
    
    const selectedGender = genderSelect.value;
    const voices = selectedGender === 'female' ? voiceOptionsData.female_voices : voiceOptionsData.male_voices;
    
    // Lưu voice ID hiện tại trước khi cập nhật
    const currentVoiceId = voiceSelect.value;
    
    // Xóa các options cũ
    voiceSelect.innerHTML = '';
    
    // Thêm các options mới
    voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.voice_id;
        
        // Lấy tên và mô tả từ translations
        const voiceName = translations[currentLanguage] && translations[currentLanguage][voice.name] ? translations[currentLanguage][voice.name] : voice.name;
        const voiceDesc = translations[currentLanguage] && translations[currentLanguage][voice.description] ? translations[currentLanguage][voice.description] : voice.description;
        
        option.textContent = `${voiceName} - ${voiceDesc}`;
        voiceSelect.appendChild(option);
    });
    
    // Khôi phục voice ID đã chọn nếu có thể
    if (selectedVoiceId && voices.some(voice => voice.voice_id === selectedVoiceId)) {
        voiceSelect.value = selectedVoiceId;
        console.log(`🎵 Khôi phục voice ID đã chọn: ${selectedVoiceId}`);
    } else if (currentVoiceId && voices.some(voice => voice.voice_id === currentVoiceId)) {
        voiceSelect.value = currentVoiceId;
        console.log(`🎵 Giữ nguyên voice ID hiện tại: ${currentVoiceId}`);
    } else {
        // Nếu không tìm thấy, lưu voice ID đầu tiên
        selectedVoiceId = voices[0] ? voices[0].voice_id : null;
        console.log(`🎵 Chọn voice ID đầu tiên: ${selectedVoiceId}`);
    }
    
    console.log(`🎵 Đã cập nhật ${voices.length} giọng nói cho ${selectedGender}`);
}

// ===== AUDIO PLAYER FUNCTIONS =====
function initializeAudioPlayer() {
    console.log('🎵 Khởi tạo Audio Player');
    
    const playBtn = document.getElementById('playBtn');
    const downloadAudioBtn = document.getElementById('downloadAudioBtn');
    
    if (playBtn) {
        playBtn.addEventListener('click', function() {
            console.log('🎵 Play button clicked');
            
            if (window.currentAudioInfo && window.currentAudioInfo.audio_filename) {
                if (!isPlaying) {
                    playAudio();
                } else {
                    pauseAudio();
                }
            } else {
                const alertMessage = currentLanguage === 'vi'
                    ? 'Chưa có file âm thanh để phát. Vui lòng tạo âm thanh trước!'
                    : 'No audio file to play. Please create audio first!';
                alert(alertMessage);
            }
        });
    }
    
    if (downloadAudioBtn) {
        downloadAudioBtn.addEventListener('click', function() {
            console.log('📥 Download button clicked');
            
            if (window.currentAudioInfo && window.currentAudioInfo.audio_filename) {
                const downloadUrl = `http://localhost:5000/api/download-audio/${window.currentAudioInfo.audio_filename}`;
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = window.currentAudioInfo.audio_filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                console.log('📥 Download started:', window.currentAudioInfo.audio_filename);
            } else {
                const alertMessage = currentLanguage === 'vi'
                    ? 'Chưa có file âm thanh để tải xuống!'
                    : 'No audio file to download!';
                alert(alertMessage);
            }
        });
    }
}

function playAudio() {
    if (!window.currentAudioInfo) {
        console.error('❌ Không có thông tin audio');
        return;
    }
    
    console.log('▶️ Bắt đầu phát audio:', window.currentAudioInfo.audio_filename);
    
    const audioUrl = `http://localhost:5000/api/play-audio/${window.currentAudioInfo.audio_filename}`;
    
    // Tạo audio element mới nếu chưa có hoặc file khác
    if (!currentAudio || currentAudio.src !== audioUrl) {
        // Dừng audio cũ nếu có
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        
        currentAudio = new Audio(audioUrl);
        
        // Xử lý sự kiện khi metadata được tải
        currentAudio.addEventListener('loadedmetadata', function() {
            console.log('📊 Audio metadata loaded, duration:', currentAudio.duration);
            const totalTimeDisplay = document.getElementById('totalTime');
            if (totalTimeDisplay) {
                totalTimeDisplay.textContent = formatTime(currentAudio.duration);
            }
        });
        
        // Cập nhật progress bar
        currentAudio.addEventListener('timeupdate', function() {
            const progressFill = document.getElementById('progressFill');
            const currentTimeDisplay = document.getElementById('currentTime');
            
            if (progressFill && currentTimeDisplay && currentAudio.duration) {
                const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
                progressFill.style.width = progress + '%';
                currentTimeDisplay.textContent = formatTime(currentAudio.currentTime);
            }
        });
        
        // Xử lý khi audio kết thúc
        currentAudio.addEventListener('ended', function() {
            console.log('⏹️ Audio ended');
            resetAudioPlayer();
        });
        
        // Xử lý lỗi
        currentAudio.addEventListener('error', function(e) {
            console.error('❌ Lỗi phát audio:', e);
            const errorMessage = currentLanguage === 'vi'
                ? 'Không thể phát file âm thanh. Vui lòng kiểm tra kết nối và thử lại.'
                : 'Cannot play audio file. Please check connection and try again.';
            alert(errorMessage);
            resetAudioPlayer();
        });
        
        // Xử lý khi có thể phát
        currentAudio.addEventListener('canplay', function() {
            console.log('✅ Audio ready to play');
        });
    }
    
    // Phát audio
    currentAudio.play().then(() => {
        console.log('▶️ Audio playing');
        isPlaying = true;
        updatePlayButton();
    }).catch(error => {
        console.error('❌ Lỗi phát audio:', error);
        const errorMessage = currentLanguage === 'vi'
            ? 'Không thể phát file âm thanh. Vui lòng kiểm tra kết nối backend.'
            : 'Cannot play audio file. Please check backend connection.';
        alert(errorMessage);
        resetAudioPlayer();
    });
}

function pauseAudio() {
    if (currentAudio) {
        console.log('⏸️ Pause audio');
        currentAudio.pause();
        isPlaying = false;
        updatePlayButton();
    }
}

function resetAudioPlayer() {
    console.log('🔄 Reset audio player');
    
    isPlaying = false;
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    updatePlayButton();
    
    // Reset progress bar
    const progressFill = document.getElementById('progressFill');
    const currentTimeDisplay = document.getElementById('currentTime');
    const totalTimeDisplay = document.getElementById('totalTime');
    
    if (progressFill) {
        progressFill.style.width = '0%';
    }
    if (currentTimeDisplay) {
        currentTimeDisplay.textContent = '0:00';
    }
    if (totalTimeDisplay) {
        totalTimeDisplay.textContent = '0:00';
    }
}

function updatePlayButton() {
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        const icon = playBtn.querySelector('i');
        if (icon) {
            if (isPlaying) {
                icon.className = 'fas fa-pause';
                playBtn.classList.add('playing');
                playBtn.title = 'Pause';
            } else {
                icon.className = 'fas fa-play';
                playBtn.classList.remove('playing');
                playBtn.title = 'Play';
            }
        }
    }
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds === null || seconds === undefined) {
        return '0:00';
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// ===== SPEECH RECOGNITION FUNCTIONS =====
function initializeSpeechRecognition() {
    console.log('🎤 Khởi tạo Speech Recognition');
    
    // Kiểm tra hỗ trợ Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('❌ Trình duyệt không hỗ trợ Web Speech API');
        const speechToTextOutput = document.getElementById('speechToTextOutput');
        if (speechToTextOutput) {
            speechToTextOutput.value = 'Trình duyệt không hỗ trợ Web Speech API. Vui lòng sử dụng Chrome hoặc Edge.';
        }
        return;
    }
    
    // Khởi tạo Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Cấu hình Speech Recognition
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    // Thiết lập ngôn ngữ mặc định
    const languageMap = {
        'vi': 'vi-VN',
        'en': 'en-US'
    };
    recognition.lang = languageMap[currentLanguage] || 'vi-VN';
    
    // Xử lý kết quả
    recognition.onresult = function(event) {
        console.log('🎤 Speech recognition result:', event);
        
        const result = event.results[0][0];
        const transcript = result.transcript;
        const confidence = result.confidence;
        
        console.log('📝 Transcript:', transcript);
        console.log('🎯 Confidence:', confidence);
        
        // Hiển thị kết quả
        const speechToTextOutput = document.getElementById('speechToTextOutput');
        if (speechToTextOutput) {
            speechToTextOutput.value = transcript;
            
            // Hiển thị nút download
            const downloadTextBtn = document.getElementById('downloadTextBtn');
            if (downloadTextBtn) {
                downloadTextBtn.style.display = 'flex';
            }
        }
        
        // Cập nhật trạng thái
        stopRecording();
    };
    
    // Xử lý lỗi
    recognition.onerror = function(event) {
        console.error('❌ Speech recognition error:', event.error);
        
        const speechToTextOutput = document.getElementById('speechToTextOutput');
        if (speechToTextOutput) {
            let errorMessage = '';
            
            switch(event.error) {
                case 'no-speech':
                    errorMessage = currentLanguage === 'vi' 
                        ? 'Không phát hiện giọng nói. Vui lòng thử lại.'
                        : 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage = currentLanguage === 'vi'
                        ? 'Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.'
                        : 'Cannot access microphone. Please check permissions.';
                    break;
                case 'not-allowed':
                    errorMessage = currentLanguage === 'vi'
                        ? 'Quyền truy cập microphone bị từ chối. Vui lòng cho phép truy cập.'
                        : 'Microphone access denied. Please allow access.';
                    break;
                default:
                    errorMessage = currentLanguage === 'vi'
                        ? `Lỗi nhận diện giọng nói: ${event.error}`
                        : `Speech recognition error: ${event.error}`;
            }
            
            speechToTextOutput.value = errorMessage;
        }
        
        stopRecording();
    };
    
    // Xử lý khi bắt đầu
    recognition.onstart = function() {
        console.log('🎤 Speech recognition started');
    };
    
    // Xử lý khi kết thúc
    recognition.onend = function() {
        console.log('🎤 Speech recognition ended');
        stopRecording();
    };
    
    console.log('✅ Speech Recognition đã được khởi tạo');
}

function startRecording() {
    if (!recognition) {
        console.error('❌ Speech Recognition chưa được khởi tạo');
        return;
    }
    
    console.log('🎤 Bắt đầu ghi âm');
    
    isRecording = true;
    recordingTime = 0;
    
    // Cập nhật UI
    const micIcon = document.getElementById('micIcon');
    const recordingStatus = document.getElementById('recordingStatus');
    const recordingTimerDiv = document.getElementById('recordingTimer');
    const timerDisplay = document.getElementById('timerDisplay');
    const convertSpeechBtn = document.getElementById('convertSpeechBtn');
    const speechToTextOutput = document.getElementById('speechToTextOutput');
    
    if (micIcon) {
        micIcon.classList.add('recording');
    }
    
    if (recordingStatus) {
        recordingStatus.textContent = currentLanguage === 'vi'
            ? 'Đang ghi âm... Nhấn lại để dừng'
            : 'Recording... Click again to stop';
    }
    
    if (recordingTimerDiv) {
        recordingTimerDiv.style.display = 'block';
    }
    
    if (convertSpeechBtn) {
        convertSpeechBtn.style.display = 'none';
    }
    
    if (speechToTextOutput) {
        speechToTextOutput.value = currentLanguage === 'vi'
            ? 'Đang lắng nghe...'
            : 'Listening...';
    }
    
    // Bắt đầu timer
    recordingTimer = setInterval(() => {
        recordingTime++;
        const minutes = Math.floor(recordingTime / 60);
        const seconds = recordingTime % 60;
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
    
    // Cập nhật ngôn ngữ cho recognition
    const languageMap = {
        'vi': 'vi-VN',
        'en': 'en-US'
    };
    recognition.lang = languageMap[currentLanguage] || 'vi-VN';
    
    // Bắt đầu recognition
    try {
        recognition.start();
    } catch (error) {
        console.error('❌ Lỗi bắt đầu recognition:', error);
        stopRecording();
    }
}

function stopRecording() {
    console.log('🎤 Dừng ghi âm');
    
    isRecording = false;
    
    // Dừng recognition
    if (recognition) {
        try {
            recognition.stop();
        } catch (error) {
            console.log('Recognition đã dừng');
        }
    }
    
    // Dừng timer
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
    
    // Cập nhật UI
    const micIcon = document.getElementById('micIcon');
    const recordingStatus = document.getElementById('recordingStatus');
    const recordingTimerDiv = document.getElementById('recordingTimer');
    
    if (micIcon) {
        micIcon.classList.remove('recording');
    }
    
    if (recordingStatus) {
        recordingStatus.textContent = currentLanguage === 'vi'
            ? 'Nhấn microphone để ghi âm'
            : 'Click microphone to record';
    }
    
    if (recordingTimerDiv) {
        recordingTimerDiv.style.display = 'none';
    }
}

// ===== TEXT-TO-SPEECH WITH ELEVENLABS =====
function handleTextToSpeech() {
    const textInput = document.getElementById('textInput');
    const genderSelect = document.getElementById('genderSelect');
    const voiceSelect = document.getElementById('voiceSelect');
    const languageSelect = document.getElementById('languageSelect');
    
    if (textInput) {
        const text = textInput.value.trim();
        const gender = genderSelect ? genderSelect.value : 'female';
        const voiceId = voiceSelect ? voiceSelect.value : null;
        const language = languageSelect ? languageSelect.value : 'vi';
        
        console.log('🔍 Debug values:', {
            text: text.substring(0, 50) + '...',
            gender: gender,
            voiceId: voiceId,
            language: language,
            hasGenderSelect: !!genderSelect,
            hasVoiceSelect: !!voiceSelect,
            hasLanguageSelect: !!languageSelect
        });
        
        if (!text) {
            alert(currentLanguage === 'vi' 
                ? 'Vui lòng nhập nội dung cần chuyển đổi!'
                : 'Please enter text to convert!');
            return;
        }
        
        if (!gender) {
            alert(currentLanguage === 'vi'
                ? 'Vui lòng chọn giới tính!'
                : 'Please select gender!');
            return;
        }
        
        // Hiển thị controls âm thanh
        const audioStatus = document.querySelector('.audio-status');
        if (audioStatus) {
            audioStatus.innerHTML = '<div style="color: #007bff;">🔄 Đang tạo âm thanh với ElevenLabs...</div>';
        }
        
        // Chuẩn bị payload cho API
        const payload = {
            text: text,
            language: language,
            voice: gender
        };
        
        // Thêm voice_id nếu có
        if (voiceId) {
            payload.voice_id = voiceId;
        }
        
        console.log('📤 Gửi payload:', payload);
        
        // Gọi backend API để chuyển văn bản thành giọng nói
        fetch('http://localhost:5000/api/text-to-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            console.log('✅ Phản hồi TTS:', data);
            if (audioStatus) {
                if (data.success) {
                    // Hiển thị thông tin chi tiết về giọng nói
                    const voiceInfo = data.voice_description || `${gender} ${language}`;
                    const voiceName = data.voice_name || 'Unknown';
                    let engineInfo = '';
                    
                    switch(data.engine) {
                        case 'elevenlabs':
                            engineInfo = '🎵 ElevenLabs (Premium)';
                            break;
                        case 'google_cloud':
                            engineInfo = '🔧 Google Cloud (Chất lượng cao)';
                            break;
                        case 'gtts':
                            engineInfo = '📢 gTTS (Chuẩn)';
                            break;
                        default:
                            engineInfo = data.engine || 'Unknown';
                    }
                    
                    audioStatus.innerHTML = `
                        <div style="color: #28a745; font-weight: 500;">
                            ✅ Âm thanh đã được tạo thành công!
                        </div>
                        <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                            🎤 Giọng: ${voiceName}<br>
                            📝 Mô tả: ${voiceInfo}<br>
                            ${engineInfo}<br>
                            📁 Kích thước: ${(data.file_size / 1024).toFixed(1)} KB
                        </div>
                    `;
                    
                    const audioControlsPanel = document.querySelector('.audio-controls-panel');
                    if (audioControlsPanel) {
                        audioControlsPanel.style.display = 'flex';
                    }
                    
                    // Lưu thông tin âm thanh để play và download
                    window.currentAudioInfo = data;
                    
                    // Reset audio player để chuẩn bị cho file mới
                    resetAudioPlayer();
                } else {
                    audioStatus.innerHTML = `
                        <div style="color: #dc3545; font-weight: 500;">
                            ❌ Lỗi: ${data.error || 'Không thể tạo âm thanh'}
                        </div>
                    `;
                }
            }
        })
        .catch(error => {
            console.error('❌ Lỗi TTS:', error);
            if (audioStatus) {
                audioStatus.innerHTML = `
                    <div style="color: #dc3545; font-weight: 500;">
                        ❌ Lỗi kết nối
                    </div>
                    <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">
                        Vui lòng kiểm tra backend server tại:<br>
                        <code>http://localhost:5000</code>
                    </div>
                `;
            }
        });
    }
}

// ===== DASHBOARD INITIALIZATION =====
function initializeDashboard() {
    console.log('🔧 Khởi tạo dashboard với ElevenLabs');

    // Cập nhật dashboard với ngôn ngữ hiện tại
    updateDashboardLanguage(currentLanguage);
    
    // Cập nhật các option ngôn ngữ
    updateLanguageOptions(currentLanguage);

    // Thiết lập các tab sidebar
    const sidebarTabs = document.querySelectorAll('.sidebar-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    sidebarTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');

            // Xóa class active khỏi tất cả tabs và contents
            sidebarTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Thêm class active cho tab được click và content tương ứng
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');

            console.log('📋 Chuyển sang tab:', targetTab);
        });
    });

    // Tải danh sách giọng nói
    loadVoiceOptionsFromBackend();
    
    // Thiết lập event listener cho gender select
    const genderSelect = document.getElementById('genderSelect');
    if (genderSelect) {
        genderSelect.addEventListener('change', function() {
            console.log('👤 Thay đổi giới tính:', this.value);
            updateVoiceSelectFromGender();
        });
    }
    
    // Thiết lập event listener cho language select
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            console.log('🌐 Thay đổi ngôn ngữ:', this.value);
            // Lưu voice ID hiện tại trước khi tải lại voice options
            const voiceSelect = document.getElementById('voiceSelect');
            if (voiceSelect && voiceSelect.value) {
                selectedVoiceId = voiceSelect.value;
                console.log(`🎵 Lưu voice ID trước khi tải lại voice options: ${selectedVoiceId}`);
            }
            // Tải lại voice options từ backend theo ngôn ngữ mới
            loadVoiceOptionsFromBackend();
        });
    }
    
    // Thiết lập event listener cho voice select để lưu voice ID đã chọn
    const voiceSelect = document.getElementById('voiceSelect');
    if (voiceSelect) {
        voiceSelect.addEventListener('change', function() {
            selectedVoiceId = this.value;
            console.log(`🎵 Người dùng chọn voice ID: ${selectedVoiceId}`);
        });
    }

    // Thiết lập chức năng text-to-speech với ElevenLabs
    const textToSpeechBtn = document.getElementById('textToSpeechBtn');
    if (textToSpeechBtn) {
        textToSpeechBtn.addEventListener('click', handleTextToSpeech);
    }

    // Thiết lập chức năng speech-to-text với Web Speech API
    const micContainer = document.getElementById('micContainer');
    const downloadTextBtn = document.getElementById('downloadTextBtn');
    const speechToTextOutput = document.getElementById('speechToTextOutput');

    if (micContainer) {
        micContainer.addEventListener('click', function() {
            if (!isRecording) {
                startRecording();
            } else {
                stopRecording();
            }
        });
    }

    // Thiết lập chức năng download text
    if (downloadTextBtn) {
        downloadTextBtn.addEventListener('click', function() {
            const text = speechToTextOutput ? speechToTextOutput.value : '';
            if (text && text.trim()) {
                const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'speech-to-text-result.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                console.log('📥 Text downloaded');
            } else {
                const alertMessage = currentLanguage === 'vi'
                    ? 'Chưa có văn bản để tải xuống!'
                    : 'No text to download!';
                alert(alertMessage);
            }
        });
    }

    // Khởi tạo Audio Player và Speech Recognition
    initializeAudioPlayer();
    initializeSpeechRecognition();
    
    // Khởi tạo Gesture Detection
    initializeGestureDetection();
}

// ===== GESTURE DETECTION FUNCTIONALITY =====
let videoStream = null;
let detectionInterval = null;
let isDetecting = false;
let gestureVideo = null;
let gestureCanvas = null;
let gestureContext = null;
let detectedWords = [];
let currentSentence = '';

function initializeGestureDetection() {
    console.log('🤖 Khởi tạo chức năng phát hiện ký hiệu');
    
    // Tạo elements cho camera và detection
    setupGestureUI();
    
    // Thiết lập event listeners
    setupGestureEventListeners();
}

function setupGestureUI() {
    const signToTextTab = document.getElementById('sign-to-text');
    if (!signToTextTab) return;
    
    // Cập nhật HTML của sign-to-text tab
    signToTextTab.innerHTML = `
        <div class="input-section">
            <h3>Camera phát hiện ký hiệu:</h3>
            <div class="gesture-container">
                <div class="video-container" id="videoContainer">
                    <video id="gestureVideo" autoplay muted playsinline style="width: 100%; max-width: 640px; height: auto; border-radius: 10px; background: #000;"></video>
                    <canvas id="gestureCanvas" style="display: none;"></canvas>
                    <div class="detection-overlay" id="detectionOverlay">
                        <div class="detection-info" id="detectionInfo">
                            <div class="current-word" id="currentWord">Chưa phát hiện từ nào</div>
                            <div class="confidence" id="confidence">Độ tin cậy: 0%</div>
                        </div>
                    </div>
                </div>
                <div class="gesture-controls">
                    <button class="btn btn-primary" id="startCameraBtn">Bật Camera</button>
                    <button class="btn btn-secondary" id="stopCameraBtn" disabled>Tắt Camera</button>
                </div>
            </div>
        </div>
        <div class="output-section">
            <h3>Kết quả phát hiện:</h3>
            <div class="gesture-results">
                <div class="detected-words-container">
                    <h4>Từ đã phát hiện:</h4>
                    <div class="detected-words" id="detectedWordsDisplay">
                        <span class="no-words">Chưa có từ nào được phát hiện</span>
                    </div>
                </div>
                <div class="generated-sentence-container">
                    <h4>Câu hoàn chỉnh:</h4>
                    <textarea class="text-input" id="generatedSentence" placeholder="Câu hoàn chỉnh sẽ xuất hiện tại đây..." readonly></textarea>
                </div>
            </div>
        </div>
    `;
    
    // Thêm CSS styles cho gesture detection
    const style = document.createElement('style');
    style.textContent = `
        .gesture-container {
            text-align: center;
        }
        
        .video-container {
            position: relative;
            display: inline-block;
            margin-bottom: 20px;
        }
        
        .detection-overlay {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
        }
        
        .current-word {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .confidence {
            font-size: 12px;
            opacity: 0.8;
        }
        
        .gesture-controls {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .gesture-results {
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 20px;
        }
        
        .detected-words-container, .generated-sentence-container {
            margin-bottom: 20px;
        }
        
        .detected-words {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
            min-height: 40px;
            padding: 10px;
            border: 1px solid #eee;
            border-radius: 5px;
            background: #f9f9f9;
        }
        
        .word-tag {
            background: #007bff;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        
        .word-tag .confidence-badge {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 10px;
            padding: 2px 6px;
            font-size: 11px;
        }
        
        .no-words {
            color: #666;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
}

function setupGestureEventListeners() {
    const startCameraBtn = document.getElementById('startCameraBtn');
    const stopCameraBtn = document.getElementById('stopCameraBtn');
    
    if (startCameraBtn) {
        startCameraBtn.addEventListener('click', startCamera);
    }
    
    if (stopCameraBtn) {
        stopCameraBtn.addEventListener('click', stopCamera);
    }
}

async function startCamera() {
    try {
        console.log('📹 Bắt đầu camera...');
        
        const video = document.getElementById('gestureVideo');
        const canvas = document.getElementById('gestureCanvas');
        
        if (!video || !canvas) {
            console.error('❌ Không tìm thấy video hoặc canvas elements');
            return;
        }
        
        gestureVideo = video;
        gestureCanvas = canvas;
        gestureContext = canvas.getContext('2d');
        
        // Tự động xóa từ khi bắt đầu quay mới
        await clearDetectedWords();
        
        // Yêu cầu quyền truy cập camera
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 }
        });
        
        video.srcObject = videoStream;
        
        // Đợi video load
        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                resolve();
            };
        });
        
        // Cập nhật UI
        updateGestureControls(true);
        
        // Bắt đầu detection
        startDetection();
        
        console.log('✅ Camera đã được bắt đầu');
        
    } catch (error) {
        console.error('❌ Lỗi bắt đầu camera:', error);
        alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập!');
    }
}

async function stopCamera() {
    console.log('📹 Dừng camera...');
    
    // Dừng detection
    stopDetection();
    
    // Tự động tạo câu khi tắt camera (nếu có từ)
    if (detectedWords.length > 0) {
        await generateSentence();
    }
    
    // Dừng video stream
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    
    // Clear video
    if (gestureVideo) {
        gestureVideo.srcObject = null;
    }
    
    // Cập nhật UI
    updateGestureControls(false);
    
    console.log('✅ Camera đã được dừng');
}

function startDetection() {
    if (isDetecting) return;
    
    console.log('🤖 Bắt đầu phát hiện ký hiệu...');
    isDetecting = true;
    
    // Tăng tần suất phát hiện lên 5 lần/giây để nhạy hơn
    detectionInterval = setInterval(captureAndDetect, 200);
}

function stopDetection() {
    console.log('🤖 Dừng phát hiện ký hiệu...');
    isDetecting = false;
    
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
}

async function captureAndDetect() {
    if (!gestureVideo || !gestureCanvas || !gestureContext) return;
    
    try {
        // Capture frame từ video
        gestureContext.drawImage(gestureVideo, 0, 0, gestureCanvas.width, gestureCanvas.height);
        
        // Convert canvas to base64 với chất lượng cao hơn
        const imageData = gestureCanvas.toDataURL('image/jpeg', 0.9);
        
        // Gửi đến backend để phát hiện
        const response = await fetch('http://localhost:5000/api/gesture-detect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Lấy tổng số từ đã phát hiện
            const currentWordCount = detectedWords.length;
            
            // Kiểm tra từ đã phát hiện
            if (result.detected_word) {
                // Cập nhật UI overlay với thông tin chi tiết
                updateDetectionOverlay(
                    result.detected_word, 
                    result.confidence, 
                    result.hold_time || 0, 
                    result.is_confirmed || false
                );
                
                // Nếu có từ mới được thêm vào (số lượng từ thay đổi)
                if (result.total_words > currentWordCount) {
                    console.log('✅ Phát hiện từ mới:', result.confirmed_word, 'Confidence:', result.confidence);
                    
                    // Hiệu ứng nhấp nháy khi từ được xác nhận
                    const detectionOverlay = document.getElementById('detectionOverlay');
                    if (detectionOverlay) {
                        detectionOverlay.classList.add('word-confirmed');
                        setTimeout(() => {
                            detectionOverlay.classList.remove('word-confirmed');
                        }, 500);
                    }
                    
                    // Cập nhật danh sách từ
                    await updateWordList();
                }
            } else {
                updateDetectionOverlay(null, 0, 0, false);
            }
        } else {
            updateDetectionOverlay(null, 0, 0, false);
            console.error('❌ Lỗi phát hiện:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Lỗi phát hiện ký hiệu:', error);
        updateDetectionOverlay(null, 0, 0, false);
    }
}

function updateDetectionOverlay(word, confidence, holdTime = 0, isConfirmed = false) {
    const currentWordEl = document.getElementById('currentWord');
    const confidenceEl = document.getElementById('confidence');
    const detectionInfo = document.getElementById('detectionInfo');
    const holdThreshold = 0.6; // phải giống với server (0.6s)
    
    if (currentWordEl) {
        if (word) {
            currentWordEl.textContent = `Đang phát hiện: ${word}`;
            
            // Thêm thông tin về thời gian giữ nếu có
            if (holdTime > 0) {
                const holdPercentage = Math.min(100, (holdTime / holdThreshold) * 100).toFixed(0);
                currentWordEl.textContent += ` (${holdPercentage}%)`;
                
                // Thêm hiệu ứng hiển thị tiến trình
                if (detectionInfo) {
                    // Tạo hoặc cập nhật progress bar
                    let progressBar = document.getElementById('holdProgressBar');
                    if (!progressBar) {
                        progressBar = document.createElement('div');
                        progressBar.id = 'holdProgressBar';
                        progressBar.className = 'hold-progress';
                        
                        // Thêm styles vào <head> nếu chưa có
                        if (!document.getElementById('detection-styles')) {
                            const style = document.createElement('style');
                            style.id = 'detection-styles';
                            style.textContent = `
                                .hold-progress {
                                    height: 6px;
                                    background-color: #FFC107;
                                    border-radius: 3px;
                                    margin-top: 5px;
                                    transition: width 0.2s, background-color 0.3s;
                                }
                                
                                .word-confirmed {
                                    animation: pulse 0.5s;
                                }
                                
                                @keyframes pulse {
                                    0% { background-color: rgba(0, 0, 0, 0.7); }
                                    50% { background-color: rgba(76, 175, 80, 0.8); }
                                    100% { background-color: rgba(0, 0, 0, 0.7); }
                                }
                            `;
                            document.head.appendChild(style);
                        }
                        
                        detectionInfo.appendChild(progressBar);
                    }
                    
                    // Cập nhật trạng thái progress bar
                    progressBar.style.width = `${holdPercentage}%`;
                    progressBar.style.backgroundColor = holdTime >= holdThreshold ? '#4CAF50' : '#FFC107';
                }
            }
        } else {
            currentWordEl.textContent = 'Chưa phát hiện từ nào';
            
            // Xóa progress bar nếu không phát hiện từ
            const progressBar = document.getElementById('holdProgressBar');
            if (progressBar) progressBar.remove();
        }
    }
    
    if (confidenceEl) {
        confidenceEl.textContent = `Độ tin cậy: ${(confidence * 100).toFixed(1)}%`;
    }
    
    // Thêm styles cho progress bar nếu chưa tồn tại
    const styleId = 'progressBarStyles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .hold-progress {
                height: 4px;
                background-color: #FFC107;
                width: 0%;
                transition: width 0.2s ease, background-color 0.3s ease;
                border-radius: 2px;
                margin-top: 5px;
            }
            .word-confirmed {
                background-color: rgba(76, 175, 80, 0.8) !important;
                transition: background-color 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
}

async function addDetectedWord(word, confidence) {
    try {
        // Kiểm tra xem từ đã được thêm gần đây chưa (tránh duplicate)
        const recentWord = detectedWords[detectedWords.length - 1];
        if (recentWord && recentWord.word === word) {
            return; // Bỏ qua nếu từ giống với từ cuối cùng
        }
        
        // Gửi đến backend để thêm từ
        const response = await fetch('http://localhost:5000/api/gesture-add-word', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                word: word, 
                confidence: confidence 
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Cập nhật local array từ backend
            await updateWordList();
            console.log('✅ Đã thêm từ:', word);
        }
        
    } catch (error) {
        console.error('❌ Lỗi thêm từ:', error);
    }
}

// Lấy và đồng bộ danh sách từ từ backend
async function updateWordList() {
    try {
        const response = await fetch('http://localhost:5000/api/gesture-get-words');
        const result = await response.json();
        
        if (result.success) {
            // Cập nhật danh sách từ local từ backend
            detectedWords = result.detailed_words || [];
            
            // Cập nhật UI
            updateDetectedWordsDisplay();
            updateGestureControls(videoStream !== null);
        }
    } catch (error) {
        console.error('❌ Lỗi lấy danh sách từ:', error);
    }
}

function updateDetectedWordsDisplay() {
    const detectedWordsDisplay = document.getElementById('detectedWordsDisplay');
    if (!detectedWordsDisplay) return;
    
    if (detectedWords.length === 0) {
        detectedWordsDisplay.innerHTML = '<span class="no-words">Chưa có từ nào được phát hiện</span>';
        return;
    }
    
    const wordsHTML = detectedWords.map(item => `
        <div class="word-tag">
            ${item.word}
            <span class="confidence-badge">${(item.confidence * 100).toFixed(0)}%</span>
        </div>
    `).join('');
    
    detectedWordsDisplay.innerHTML = wordsHTML;
}

async function generateSentence() {
    if (detectedWords.length === 0) {
        alert('Chưa có từ nào để tạo câu!');
        return;
    }
    
    try {
        console.log('🤖 Tạo câu hoàn chỉnh từ:', detectedWords.map(w => w.word));
        
        const response = await fetch('http://localhost:5000/api/gesture-generate-sentence', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({})
        });
        
        const result = await response.json();
        
        if (result.success) {
            const sentenceTextarea = document.getElementById('generatedSentence');
            if (sentenceTextarea) {
                sentenceTextarea.value = result.sentence;
                currentSentence = result.sentence;
            }
            
            console.log('✅ Câu được tạo:', result.sentence);
            // Đã bỏ alert thông báo theo yêu cầu
        } else {
            console.error('❌ Lỗi tạo câu:', result.error);
            alert('Không thể tạo câu: ' + result.error);
        }
        
    } catch (error) {
        console.error('❌ Lỗi tạo câu:', error);
        alert('Lỗi kết nối khi tạo câu!');
    }
}

async function clearDetectedWords() {
    try {
        const response = await fetch('http://localhost:5000/api/gesture-clear-words', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({})
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Clear local data
            detectedWords = [];
            currentSentence = '';
            
            // Cập nhật UI
            updateDetectedWordsDisplay();
            
            const sentenceTextarea = document.getElementById('generatedSentence');
            if (sentenceTextarea) {
                sentenceTextarea.value = '';
            }
            
            updateGestureControls(videoStream !== null);
            
            console.log('✅ Đã xóa danh sách từ');
        }
        
    } catch (error) {
        console.error('❌ Lỗi xóa danh sách từ:', error);
    }
}

function updateGestureControls(cameraActive) {
    const startCameraBtn = document.getElementById('startCameraBtn');
    const stopCameraBtn = document.getElementById('stopCameraBtn');
    
    if (startCameraBtn) {
        startCameraBtn.disabled = cameraActive;
    }
    
    if (stopCameraBtn) {
        stopCameraBtn.disabled = !cameraActive;
    }
}

// ===== AUTHENTICATION FUNCTIONS =====
function checkExistingLogin() {
    const savedUser = localStorage.getItem('currentUser');
    console.log('🔍 Kiểm tra đăng nhập hiện tại:', savedUser);

    if (savedUser && savedUser !== 'null' && savedUser !== 'undefined') {
        try {
            const userData = JSON.parse(savedUser);
            if (userData && userData.name) {
                console.log('✅ Tìm thấy người dùng:', userData.name);
                return userData;
            }
        } catch (e) {
            console.error('❌ Lỗi parse dữ liệu người dùng:', e);
            localStorage.removeItem('currentUser');
        }
    }

    console.log('ℹ️ Không tìm thấy người dùng hợp lệ, ở lại trang chủ');
    return false;
}

function checkLoginStatus() {
    const savedUser = localStorage.getItem('currentUser');
    const rememberLogin = localStorage.getItem('rememberLogin');

    if (savedUser && rememberLogin === 'true') {
        isLoggedIn = true;
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
    }
}

function updateUIForLoggedInUser() {
    const headerLoginBtn = document.querySelector('.btn-login');
    const headerRegisterBtn = document.querySelector('.btn-register');
    
    if (isLoggedIn && currentUser && headerLoginBtn && headerRegisterBtn) {
        // Cập nhật nút đăng nhập để hiển thị tên người dùng
        const greeting = currentLanguage === 'vi' ? `Xin chào, ${currentUser.name}` : `Hello, ${currentUser.name}`;
        headerLoginBtn.textContent = greeting;
        headerLoginBtn.style.background = '#0ad35aff';
        

        // Cập nhật nút đăng ký thành đăng xuất
        const logoutText = currentLanguage === 'vi' ? 'Đăng Xuất' : 'Logout';
        headerRegisterBtn.textContent = logoutText;
        headerRegisterBtn.style.background = '#0add62ff';
        

        // Xóa event listeners cũ và thêm mới
        headerLoginBtn.replaceWith(headerLoginBtn.cloneNode(true));
        headerRegisterBtn.replaceWith(headerRegisterBtn.cloneNode(true));

        // Lấy references mới
        const newHeaderLoginBtn = document.querySelector('.btn-login');
        const newHeaderRegisterBtn = document.querySelector('.btn-register');

        // Thêm chức năng đăng xuất
        if (newHeaderRegisterBtn) {
            newHeaderRegisterBtn.addEventListener('click', logout);
        }
    }
}

function logout() {
    isLoggedIn = false;
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rememberLogin');

    // Reset UI về trạng thái đã đăng xuất
    resetUIToLoggedOut();

    // Hiển thị trang chủ thay vì modal
    showHomePage();
}

function resetUIToLoggedOut() {
    const headerLoginBtn = document.querySelector('.btn-login');
    const headerRegisterBtn = document.querySelector('.btn-register');
    
    if (headerLoginBtn && headerRegisterBtn) {
        // Reset nút đăng nhập
        headerLoginBtn.textContent = currentLanguage === 'vi' ? 'Đăng Nhập' : 'Login';
        headerLoginBtn.style.background = '#ffd700';

        // Reset nút đăng ký
        headerRegisterBtn.textContent = currentLanguage === 'vi' ? 'Đăng Ký' : 'Register';
        headerRegisterBtn.style.background = '#ffa500';

        // Xóa event listeners cũ và thêm lại các listeners gốc
        headerLoginBtn.replaceWith(headerLoginBtn.cloneNode(true));
        headerRegisterBtn.replaceWith(headerRegisterBtn.cloneNode(true));

        // Lấy references mới và thêm lại event listeners gốc
        const newHeaderLoginBtn = document.querySelector('.btn-login');
        const newHeaderRegisterBtn = document.querySelector('.btn-register');

        if (newHeaderLoginBtn) {
            newHeaderLoginBtn.addEventListener('click', () => showModal(false));
        }
        if (newHeaderRegisterBtn) {
            newHeaderRegisterBtn.addEventListener('click', () => showModal(true));
        }
    }
}

// ===== MODAL FUNCTIONS =====
function showModal(showRegister = false) {
    console.log(`📱 Hiển thị modal (đăng ký: ${showRegister})`);
    const authModal = document.getElementById('authModal');
    const authContainer = document.getElementById('container');
    
    if (authModal) {
        authModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        if (authContainer) {
            if (showRegister) {
                authContainer.classList.add('active');
            } else {
                authContainer.classList.remove('active');
            }
        }
    }
}

function hideModal() {
    console.log('❌ Ẩn modal');
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ===== THEME FUNCTIONS =====
function updateTheme() {
    if (isDarkTheme) {
        document.body.classList.add('dark-theme');
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) themeToggle.textContent = '🌙';
    } else {
        document.body.classList.remove('dark-theme');
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) themeToggle.textContent = '🌟';
    }
    localStorage.setItem('darkTheme', isDarkTheme);
    updateThemeTooltip();
}

function updateThemeTooltip() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        if (currentLanguage === 'vi') {
            if (isDarkTheme) {
                themeToggle.setAttribute('data-tooltip', 'Chế độ tối - Click để chuyển sang chế độ sáng');
            } else {
                themeToggle.setAttribute('data-tooltip', 'Chế độ sáng - Click để chuyển sang chế độ tối');
            }
        } else {
            if (isDarkTheme) {
                themeToggle.setAttribute('data-tooltip', 'Dark mode - Click to switch to light mode');
            } else {
                themeToggle.setAttribute('data-tooltip', 'Light mode - Click to switch to dark mode');
            }
        }
    }
}

// ===== LANGUAGE FUNCTIONS =====
const translations = {
    vi: {
        'login': 'Đăng Nhập',
        'register': 'Đăng Ký',
        'hero-title': 'Công cụ hỗ trợ nhận diện ngôn ngữ ký hiệu',
        'hero-description': 'Khám phá giải pháp AI tiên tiến giúp chuyển đổi ngôn ngữ ký hiệu thành văn bản, giọng nói và ngược lại một cách dễ dàng.',
        'start-btn': 'Bắt Đầu Ngay',
        'create-account': 'Tạo Tài Khoản',
        'or-email-register': 'hoặc sử dụng email để đăng ký',
        'agree-terms': 'Tôi đồng ý với',
        'terms-of-use': 'điều khoản sử dụng',
        'or-email-login': 'hoặc sử dụng email và mật khẩu',
        'remember-me': 'Ghi nhớ đăng nhập',
        'forgot-password': 'Quên mật khẩu?',
        'welcome-back': 'Chào Mừng Trở Lại!',
        'welcome-back-desc': 'Nhập thông tin cá nhân để sử dụng tất cả tính năng của trang web',
        'hello': 'Xin Chào!',
        'hello-desc': 'Đăng ký với thông tin cá nhân để sử dụng tất cả tính năng của trang web',
        'name': 'Họ và tên',
        'email': 'Email',
        'password': 'Mật khẩu',
        'video-section-title': 'Video Giới Thiệu',
        'video-section-description': 'Xem các video hướng dẫn để hiểu cách sử dụng công cụ nhận diện ngôn ngữ ký hiệu của chúng tôi.',
        'news-section-title': 'Tin Tức & Bài Viết',
        'news-section-description': 'Cập nhật những thông tin mới nhất và các bài viết hữu ích về ngôn ngữ ký hiệu và công nghệ AI.',
        
        // Dashboard translations
        'sidebar-text-to-speech': 'Văn bản thành giọng nói',
        'sidebar-speech-to-text': 'Giọng nói thành văn bản',
        'sidebar-sign-to-text': 'Ký hiệu thành văn bản',
        'text-input-title': 'Nhập văn bản cần chuyển đổi:',
        'text-input-placeholder': 'Nhập văn bản của bạn tại đây...',
        'gender-label': 'Giới tính:',
        'gender-female': 'Nữ',
        'gender-male': 'Nam',
        'language-label': 'Ngôn ngữ:',
        'voice-label': 'Giọng người đọc:',
        'voice-loading': 'Đang tải...',
        'audio-output-title': 'Âm thanh được tạo:',
        'audio-status': 'Âm thanh sẽ được tạo ra tại đây',
        'speech-input-title': 'Ghi âm giọng nói:',
        'speech-status': 'Nhấn vào microphone để bắt đầu ghi âm',
        'speech-output-title': 'Văn bản được chuyển đổi:',
        'speech-output-placeholder': 'Văn bản sẽ xuất hiện tại đây...',
        'download-text': 'Tải xuống văn bản',
        'sign-input-title': 'Tải lên ảnh/video ngôn ngữ ký hiệu:',
        'sign-status': 'Tải lên ảnh hoặc video để chuyển đổi',
        'sign-output-title': 'Văn bản được nhận diện:',
        'sign-output-placeholder': 'Văn bản được nhận diện sẽ xuất hiện tại đây...',
        'upload-btn': 'Tải lên tệp',
        'convert-btn': 'Chuyển đổi',
        'download-btn': 'Tải xuống',
        'footer-description': 'Công cụ AI tiên tiến hỗ trợ nhận diện ngôn ngữ ký hiệu, giúp kết nối cộng đồng người khiếm thính với thế giới xung quanh.',
        
        // Voice descriptions
        'voice-nhu': 'Như',
        'voice-nhu-desc': 'Giọng miền Bắc',
        'voice-ha-my': 'Hà My',
        'voice-ha-my-desc': 'Giọng miền Nam',
        'voice-viet-dung': 'Việt Dũng',
        'voice-viet-dung-desc': 'Giọng miền Bắc',
        'voice-ly-hai': 'Ly Hai',
        'voice-ly-hai-desc': 'Giọng miền Nam',
        'voice-natasha': 'Natasha',
        'voice-natasha-desc': 'Giọng nữ trẻ, năng động',
        'voice-christina': 'Christina',
        'voice-christina-desc': 'Giọng nữ dịu dàng, chuyên nghiệp',
        'voice-adam': 'Adam',
        'voice-adam-desc': 'Giọng nam mạnh mẽ, tự tin',
        'voice-jon': 'Jon',
        'voice-jon-desc': 'Giọng nam trẻ, thân thiện'
    },
    en: {
        'login': 'Login',
        'register': 'Register',
        'hero-title': 'Sign Language Recognition Support Tool',
        'hero-description': 'Explore the advanced AI solution that easily converts sign language to text, speech, and vice versa.',
        'start-btn': 'Get Started',
        'create-account': 'Create Account',
        'or-email-register': 'or use email to register',
        'agree-terms': 'I agree with',
        'terms-of-use': 'terms of use',
        'or-email-login': 'or use email and password',
        'remember-me': 'Remember me',
        'forgot-password': 'Forgot password?',
        'welcome-back': 'Welcome Back!',
        'welcome-back-desc': 'Enter your personal details to use all features of the website',
        'hello': 'Hello!',
        'hello-desc': 'Register with your personal details to use all features of the website',
        'name': 'Full Name',
        'email': 'Email',
        'password': 'Password',
        'video-section-title': 'Introduction Video',
        'video-section-description': 'Watch tutorial videos to understand how to use our sign language recognition tool.',
        'news-section-title': 'News & Articles',
        'news-section-description': 'Stay updated with the latest information and useful articles about sign language and AI technology.',
        
        // Dashboard translations
        'sidebar-text-to-speech': 'Text to Speech',
        'sidebar-speech-to-text': 'Speech to Text',
        'sidebar-sign-to-text': 'Sign to Text',
        'text-input-title': 'Enter text to convert:',
        'text-input-placeholder': 'Enter your text here...',
        'gender-label': 'Gender:',
        'gender-female': 'Female',
        'gender-male': 'Male',
        'language-label': 'Language:',
        'voice-label': 'Voice:',
        'voice-loading': 'Loading...',
        'audio-output-title': 'Generated Audio:',
        'audio-status': 'Audio will be generated here',
        'speech-input-title': 'Record voice:',
        'speech-status': 'Click microphone to start recording',
        'speech-output-title': 'Converted text:',
        'speech-output-placeholder': 'Text will appear here...',
        'download-text': 'Download text',
        'sign-input-title': 'Upload sign language image/video:',
        'sign-status': 'Upload image or video to convert',
        'sign-output-title': 'Recognized text:',
        'sign-output-placeholder': 'Recognized text will appear here...',
        'upload-btn': 'Upload File',
        'convert-btn': 'Convert',
        'download-btn': 'Download',
        'footer-description': 'Advanced AI tool supporting sign language recognition, helping connect the deaf community with the world around them.',
        
        // Voice descriptions
        'voice-nhu': 'Như',
        'voice-nhu-desc': 'Northern accent',
        'voice-ha-my': 'Ha My',
        'voice-ha-my-desc': 'Southern accent',
        'voice-viet-dung': 'Viet Dung',
        'voice-viet-dung-desc': 'Northern accent',
        'voice-ly-hai': 'Ly Hai',
        'voice-ly-hai-desc': 'Southern accent',
        'voice-natasha': 'Natasha',
        'voice-natasha-desc': 'Young, energetic female voice',
        'voice-christina': 'Christina',
        'voice-christina-desc': 'Gentle, professional female voice',
        'voice-adam': 'Adam',
        'voice-adam-desc': 'Strong, confident male voice',
        'voice-jon': 'Jon',
        'voice-jon-desc': 'Young, friendly male voice'
    }
};

function translatePage(lang) {
    console.log(`🌐 Dịch sang: ${lang}`);
    currentLanguage = lang;
    localStorage.setItem('language', lang);

    // Cập nhật tiêu đề trang
    if (lang === 'en') {
        document.title = 'Sign Language Recognition Tool';
    } else {
        document.title = 'Sign Language - Ngôn Ngữ Ký Hiệu';
    }

    // Dịch các elements
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // Dịch placeholders
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });

    // Cập nhật tooltips
    updateThemeTooltip();
    updateLogoTooltip();

    // Cập nhật tooltip toggle ngôn ngữ
    const languageToggle = document.getElementById('languageToggle');
    if (languageToggle) {
        if (lang === 'vi') {
            languageToggle.setAttribute('data-tooltip', 'Tiếng Việt (VN) - Click để chuyển sang Tiếng Anh');
        } else {
            languageToggle.setAttribute('data-tooltip', 'English (US) - Click to switch to Vietnamese');
        }
    }

    // Cập nhật UI người dùng đã đăng nhập với ngôn ngữ mới
    if (isLoggedIn) {
        updateUIForLoggedInUser();
    }
    
    // Cập nhật dashboard nếu đang hiển thị
    if (document.getElementById('dashboardPage') && document.getElementById('dashboardPage').style.display !== 'none') {
        console.log('🔄 Cập nhật dashboard với ngôn ngữ mới');
        // Dashboard đang hiển thị, cập nhật các elements
        updateDashboardLanguage(lang);
    }
    
    // Cập nhật các option trong dropdown ngôn ngữ
    updateLanguageOptions(lang);
}

function updateLogoTooltip() {
    const logoHome = document.getElementById('logoHome');
    if (logoHome) {
        if (currentLanguage === 'vi') {
            logoHome.setAttribute('data-tooltip', 'Về trang chủ');
        } else {
            logoHome.setAttribute('data-tooltip', 'Return to home');
        }
    }
}

function updateDashboardLanguage(lang) {
    console.log(`🔄 Cập nhật dashboard với ngôn ngữ: ${lang}`);
    
    // Cập nhật các elements trong dashboard
    const dashboardElements = document.querySelectorAll('#dashboardPage [data-translate]');
    dashboardElements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Cập nhật placeholders
    const dashboardPlaceholders = document.querySelectorAll('#dashboardPage [data-translate-placeholder]');
    dashboardPlaceholders.forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    
    // Cập nhật voice options
    updateVoiceOptions(lang);
    
    console.log(`✅ Đã cập nhật ${dashboardElements.length} elements và ${dashboardPlaceholders.length} placeholders trong dashboard`);
}

function updateLanguageOptions(lang) {
    console.log(`🌐 Cập nhật các option ngôn ngữ sang: ${lang}`);
    
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        const options = languageSelect.querySelectorAll('option');
        
        options.forEach(option => {
            const value = option.value;
            if (value === 'vi') {
                option.textContent = lang === 'en' ? 'Vietnamese' : 'Tiếng Việt';
            } else if (value === 'en') {
                option.textContent = lang === 'en' ? 'English' : 'Tiếng Anh';
            }
        });
        
        console.log(`✅ Đã cập nhật ${options.length} options trong dropdown ngôn ngữ`);
    }
}

function updateVoiceOptions(lang) {
    console.log(`🎵 Cập nhật voice options sang: ${lang}`);
    
    // Cập nhật voice options nếu đang có data
    if (voiceOptionsData) {
        updateVoiceSelectFromGender();
        console.log('✅ Đã cập nhật voice options');
    }
}

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM đã tải, đang khởi tạo script thống nhất...');

    // Kiểm tra người dùng đã đăng nhập
    const existingUser = checkExistingLogin();
    isLoggedIn = !!existingUser;
    currentUser = existingUser || null;

    // Lấy tất cả elements
    const elements = {
        authModal: document.getElementById('authModal'),
        authContainer: document.getElementById('container'),
        authOverlay: document.getElementById('authOverlay'),
        themeToggle: document.getElementById('themeToggle'),
        languageToggle: document.getElementById('languageToggle'),
        logoHome: document.getElementById('logoHome'),
        headerLoginBtn: document.querySelector('.btn-login'),
        headerRegisterBtn: document.querySelector('.btn-register'),
        startBtn: document.getElementById('startBtn'),
        registerBtn: document.getElementById('register'),
        loginBtn: document.getElementById('login')
    };
    
    // Log các elements đã tìm thấy
    console.log('🔍 Elements đã tìm thấy:');
    Object.keys(elements).forEach(key => {
        console.log(`  ${key}: ${elements[key] ? '✅' : '❌'}`);
    });
    
    // Event listeners cho các nút header
    if (elements.headerLoginBtn) {
        elements.headerLoginBtn.addEventListener('click', function() {
            console.log('🔑 Nút đăng nhập header được click');
            showModal(false);
        });
    }
    
    if (elements.headerRegisterBtn) {
        elements.headerRegisterBtn.addEventListener('click', function() {
            console.log('📝 Nút đăng ký header được click');
            showModal(true);
        });
    }

    // Event listener cho nút bắt đầu
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', function() {
            console.log('🚀 Nút bắt đầu được click');

            if (isLoggedIn) {
                // Người dùng đã đăng nhập, hiển thị dashboard
                console.log('✅ Người dùng đã đăng nhập, hiển thị dashboard');
                const redirectingText = currentLanguage === 'vi' ? 'Đang chuyển hướng...' : 'Redirecting...';
                elements.startBtn.textContent = redirectingText;
                elements.startBtn.disabled = true;

                setTimeout(() => {
                    showDashboard();
                    elements.startBtn.textContent = currentLanguage === 'vi' ? 'Bắt Đầu Ngay' : 'Get Started';
                    elements.startBtn.disabled = false;
                }, 1000);
            } else {
                // Người dùng chưa đăng nhập, hiển thị modal đăng nhập
                console.log('❌ Người dùng chưa đăng nhập, hiển thị modal');
                showModal(false);

                // Thêm thông báo khuyến khích
                setTimeout(() => {
                    const loginForm = document.getElementById('loginForm');
                    if (loginForm && !loginForm.querySelector('.login-message')) {
                        const message = document.createElement('div');
                        message.className = 'login-message';
                        message.style.cssText = `
                            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                            padding: 15px;
                            border-radius: 10px;
                            margin-bottom: 20px;
                            text-align: center;
                            color: #1976d2;
                            font-size: 0.9rem;
                            border-left: 4px solid #2196f3;
                        `;
                        const messageText = currentLanguage === 'vi'
                            ? '🚀 Vui lòng đăng nhập để sử dụng công cụ nhận diện ngôn ngữ ký hiệu!'
                            : '🚀 Please login to use the sign language recognition tool!';
                        message.innerHTML = messageText;
                        loginForm.insertBefore(message, loginForm.firstChild);
                    }
                }, 100);
            }
        });
    }
    
    // Event listeners cho modal
    if (elements.registerBtn) {
        elements.registerBtn.addEventListener('click', function() {
            console.log('📝 Nút đăng ký modal được click');
            if (elements.authContainer) {
                elements.authContainer.classList.add('active');
            }
        });
    }
    
    if (elements.loginBtn) {
        elements.loginBtn.addEventListener('click', function() {
            console.log('🔑 Nút đăng nhập modal được click');
            if (elements.authContainer) {
                elements.authContainer.classList.remove('active');
            }
        });
    }
    
    if (elements.authOverlay) {
        elements.authOverlay.addEventListener('click', hideModal);
    }
    
    window.addEventListener('click', function(e) {
        if (e.target === elements.authModal) {
            hideModal();
        }
    });
    
    // Event listener cho theme toggle
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', () => {
            console.log('🌟 Toggle theme được click');
            isDarkTheme = !isDarkTheme;
            
            // Thêm animation xoay
            elements.themeToggle.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                elements.themeToggle.style.transform = 'rotate(0deg)';
            }, 300);
            
            updateTheme();
        });
    }
    
    // Event listener cho language toggle
    if (elements.languageToggle) {
        elements.languageToggle.addEventListener('click', function() {
            console.log('🌐 Toggle ngôn ngữ được click');
            const newLang = currentLanguage === 'vi' ? 'en' : 'vi';
            translatePage(newLang);
        });
    }
    
    // Event listener cho logo
    if (elements.logoHome) {
        elements.logoHome.addEventListener('click', () => {
            console.log('🏠 Logo được click - trở về trang chủ');
            
            showHomePage();
            
            // Scroll lên đầu mượt mà
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // Đóng bất kỳ modal nào đang mở
            hideModal();
            
            // Reset trạng thái auth container
            if (elements.authContainer) {
                elements.authContainer.classList.remove('active');
            }
        });
    }
    
    // Xử lý submit form đăng nhập
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('🔑 Form đăng nhập được submit');

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            if (!email || !password) {
                const alertMessage = currentLanguage === 'vi'
                    ? 'Vui lòng nhập đầy đủ email và mật khẩu!'
                    : 'Please enter both email and password!';
                alert(alertMessage);
                return;
            }

            // Mô phỏng quá trình đăng nhập
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            const loggingInText = currentLanguage === 'vi' ? 'Đang đăng nhập...' : 'Logging in...';
            submitBtn.textContent = loggingInText;
            submitBtn.disabled = true;

            setTimeout(() => {
                // Tạo dữ liệu người dùng
                const userData = {
                    id: 1,
                    name: email.split('@')[0],
                    email: email,
                    loginTime: new Date().toISOString()
                };

                // Đặt trạng thái đăng nhập
                isLoggedIn = true;
                currentUser = userData;

                // Lưu vào localStorage
                localStorage.setItem('currentUser', JSON.stringify(userData));

                if (rememberMe) {
                    localStorage.setItem('rememberLogin', 'true');
                } else {
                    localStorage.removeItem('rememberLogin');
                }

                // Cập nhật UI
                updateUIForLoggedInUser();

                // Ẩn modal
                hideModal();

                // Reset form
                loginForm.reset();
                const loginMessage = loginForm.querySelector('.login-message');
                if (loginMessage) {
                    loginMessage.remove();
                }

                // Reset nút
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;

                console.log('✅ Đăng nhập thành công');
            }, 1500);
        });
    }

    // Xử lý submit form đăng ký
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 Form đăng ký được submit');

            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const agreeTerms = document.getElementById('agreeTerms').checked;

            if (!name || !email || !password) {
                const alertMessage = currentLanguage === 'vi'
                    ? 'Vui lòng nhập đầy đủ thông tin!'
                    : 'Please fill in all information!';
                alert(alertMessage);
                return;
            }

            if (password.length < 6) {
                const passwordAlert = currentLanguage === 'vi'
                    ? 'Mật khẩu phải có ít nhất 6 ký tự!'
                    : 'Password must be at least 6 characters!';
                alert(passwordAlert);
                return;
            }

            if (!agreeTerms) {
                const termsAlert = currentLanguage === 'vi'
                    ? 'Vui lòng đồng ý với điều khoản sử dụng!'
                    : 'Please agree to the terms of use!';
                alert(termsAlert);
                return;
            }

            // Mô phỏng quá trình đăng ký
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            const registeringText = currentLanguage === 'vi' ? 'Đang đăng ký...' : 'Registering...';
            submitBtn.textContent = registeringText;
            submitBtn.disabled = true;

            setTimeout(() => {
                // Tạo dữ liệu người dùng
                const userData = {
                    id: Date.now(),
                    name: name,
                    email: email,
                    loginTime: new Date().toISOString()
                };

                // Tự động đăng nhập sau khi đăng ký
                isLoggedIn = true;
                currentUser = userData;

                // Lưu vào localStorage
                localStorage.setItem('currentUser', JSON.stringify(userData));
                localStorage.setItem('rememberLogin', 'true');

                // Cập nhật UI
                updateUIForLoggedInUser();

                // Ẩn modal
                hideModal();

                // Reset form
                registerForm.reset();

                // Reset nút
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;

                console.log('✅ Đăng ký thành công');
            }, 1500);
        });
    }

    // Khởi tạo mọi thứ
    checkLoginStatus();
    updateTheme();
    translatePage(currentLanguage);

    // Nếu người dùng đã đăng nhập, cập nhật UI
    if (isLoggedIn && currentUser) {
        updateUIForLoggedInUser();
        console.log('✅ Người dùng đã đăng nhập, sẵn sàng truy cập dashboard');
    }

    console.log('🎉 Hoàn thành khởi tạo script thống nhất!');
});

console.log('📝 Script thống nhất đã được tải hoàn toàn');

