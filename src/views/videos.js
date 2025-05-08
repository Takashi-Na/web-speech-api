let recognition = null;
let isRecognizing = false;
let finalTranscript = '';
let currentSentence = '';
let sentenceBuffer = [];
let audioContext = null;
let mediaStreamDestination = null;
let mediaElementSource = null;
let mediaStreamTrack = null;
let recognitionTimeout = null;
const SENTENCE_END_MARKERS = ['。', '！', '？', '.', '!', '?', '\n'];
const RECOGNITION_TIMEOUT = 3 * 60 * 1000; // 3分（ミリ秒）
const startButton = document.querySelector('#startButton');
const stopButton = document.querySelector('#stopButton');
const status = document.querySelector('#status');
const error = document.querySelector('#error');
const transcription = document.querySelector('#transcription');
const videoPlayer = document.querySelector('#videoPlayer');

// 文の終わりを判定
function isEndOfSentence(text) {
  return SENTENCE_END_MARKERS.some(marker => text.endsWith(marker));
}

// 文を処理
function processSentence(sentence) {
  if (sentence.trim()) {
    // 新しい文を追加
    sentenceBuffer.push(sentence);
    // すべての文を表示
    updateTranscription(sentenceBuffer.join('\n'));
  }
}

// 動画の音声ストリームを取得して認識を開始
async function startRecognitionFromVideo() {
  if (isRecognizing) {
    return;
  }

  try {
    // AudioContextの初期化
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    mediaStreamDestination = audioContext.createMediaStreamDestination();
    mediaStreamTrack = mediaStreamDestination.stream.getAudioTracks()[0];
    
    // 動画の音声をMediaStreamDestinationに接続
    mediaElementSource = audioContext.createMediaElementSource(videoPlayer);
    mediaElementSource.connect(mediaStreamDestination);

    // Web Speech APIの初期化
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    // 音声認識の結果を処理
    recognition.onresult = (event) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // 最終結果を文単位で処理
          currentSentence += transcript;
          if (isEndOfSentence(currentSentence)) {
            processSentence(currentSentence);
            currentSentence = '';
          }
        } else {
          interimTranscript += transcript;
          // 中間結果も表示（斜体で）
          const displayText = sentenceBuffer.join('\n') + 
            (currentSentence ? '\n' + currentSentence : '') + 
            (interimTranscript ? '\n' + interimTranscript : '');
          updateTranscription(displayText);
        }
      }
    };

    // 音声認識の開始
    recognition.onstart = () => {
      isRecognizing = true;
      startButton.disabled = true;
      stopButton.disabled = false;
      status.textContent = '音声認識中...';
      error.textContent = '';
      // バッファはクリアしない（既存の文字起こしを保持）

      // 3分後に自動停止
      recognitionTimeout = setTimeout(() => {
        if (isRecognizing) {
          status.textContent = '3分経過: 認識を再開します...';
          recognition.stop();
        }
      }, RECOGNITION_TIMEOUT);
    };

    // 音声認識の終了
    recognition.onend = () => {
      // タイムアウトをクリア
      if (recognitionTimeout) {
        clearTimeout(recognitionTimeout);
        recognitionTimeout = null;
      }

      if (isRecognizing && mediaStreamTrack) {
        try {
          // 現在の文が途中で終わっている場合は、その文も保存
          if (currentSentence.trim()) {
            processSentence(currentSentence);
            currentSentence = '';
          }
          // MediaStreamが存在する場合は再開
          recognition.start(mediaStreamTrack);
        } catch (e) {
          error.textContent = `音声認識の再開に失敗しました: ${e.message}`;
          isRecognizing = false;
          startButton.disabled = false;
          stopButton.disabled = true;
        }
      } else {
        isRecognizing = false;
        startButton.disabled = false;
        stopButton.disabled = true;
        status.textContent = '準備完了';
      }
    };

    // エラー処理
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech' && mediaStreamTrack) {
        try {
          // 現在の文が途中で終わっている場合は、その文も保存
          if (currentSentence.trim()) {
            processSentence(currentSentence);
            currentSentence = '';
          }
          recognition.start(mediaStreamTrack);
        } catch (e) {
          error.textContent = `音声認識の再開に失敗しました: ${e.message}`;
        }
      } else {
        error.textContent = `エラーが発生しました: ${event.error}`;
        isRecognizing = false;
        startButton.disabled = false;
        stopButton.disabled = true;
      }
    };

    // 動画の音声ストリームを使用して認識を開始
    videoPlayer.play();
    recognition.start(mediaStreamTrack);

  } catch (e) {
    error.textContent = `音声認識を開始できません: ${e.message}`;
    console.error('Error starting recognition:', e);
  }
}

function stopRecognition() {
  if (recognition) {
    isRecognizing = false;
    recognition.stop();
    
    // タイムアウトをクリア
    if (recognitionTimeout) {
      clearTimeout(recognitionTimeout);
      recognitionTimeout = null;
    }
    
    // 音声ストリームの接続を解除
    if (mediaElementSource) {
      mediaElementSource.disconnect();
    }
    if (audioContext) {
      audioContext.close();
    }
  }
}

function clearTranscription() {
  finalTranscript = '';
  currentSentence = '';
  sentenceBuffer = [];
  transcription.textContent = '';
  error.textContent = '';
}

function updateTranscription(text) {
  transcription.textContent = text;
  // 自動スクロール
  transcription.scrollTop = transcription.scrollHeight;
}

// 動画リストの取得と表示
async function loadVideos() {
  try {
    const response = await fetch('/api/videos');
    const videos = await response.json();
    const videoList = document.getElementById('videoList');
    const videoPlayer = document.getElementById('videoPlayer');

    videos.forEach(video => {
      const videoItem = document.createElement('div');
      videoItem.className = 'video-item';
      videoItem.textContent = video.name;
      videoItem.onclick = () => {
        videoPlayer.src = `/tmp/${video.name}`;
        videoPlayer.play();
        // 動画クリック時に音声認識を開始
        startRecognitionFromVideo();
      };
      videoList.appendChild(videoItem);
    });
  } catch (error) {
    console.error('動画リストの取得に失敗しました:', error);
  }
}

// ページ読み込み時に動画リストを取得
window.addEventListener('load', loadVideos); 