# Transcription of recordings demo

# 動作要件
Node.js 22.14.0

# 内容
WebSpeechAPIを用いて録画データから文字起こしができること

# 技術要件
[WebSpeechAPI](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)  
[WebAudioAPI](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

# 動作方法
mkdir tmp
文字起こししたい動画をtmp/配下に設置

nodenv local 22.14.0  
npm i  

npm start

ブラウザで`localhost:3000`を開いて録画を選択すると文字起こしが開始する
