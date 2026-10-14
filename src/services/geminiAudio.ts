/**
 * TeachMe AI - High-Performance Audio Processing Engine (DSP)
 * Handles 16kHz PCM Linear Capture for Gemini Live & 24kHz Output Playback.
 */

// Helper: Convert Float32Array to 16-bit PCM ArrayBuffer
function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new DataView(new ArrayBuffer(input.length * 2));
  for (let i = 0; i < input.length; i++) {
    // Clamp sample between -1 and 1
    const s = Math.max(-1, Math.min(1, input[i]));
    // Scale to 16-bit signed integer range (-32768 to 32767)
    output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return output.buffer;
}

// Helper: Linear Interpolation Resampler from sourceRate to targetRate (16000Hz)
function downsampleBuffer(
  buffer: Float32Array,
  sourceRate: number,
  targetRate: number = 16000
): Float32Array {
  if (sourceRate === targetRate) return buffer;
  if (sourceRate < targetRate) {
    // Upsampling not recommended, return original
    return buffer;
  }

  const ratio = sourceRate / targetRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const originPos = i * ratio;
    const index = Math.floor(originPos);
    const decimal = originPos - index;

    const current = buffer[index] || 0;
    const next = buffer[index + 1] !== undefined ? buffer[index + 1] : current;

    // Linear interpolation
    result[i] = current + (next - current) * decimal;
  }

  return result;
}

// Helper: Convert ArrayBuffer to Base64 String
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Convert Base64 String to Int16 PCM Float32Array for AudioBuffer
function base64ToFloat32Array(base64: string): Float32Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);

  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / (int16[i] < 0 ? 32768 : 32767);
  }

  return float32;
}

/**
 * LiveAudioPlayer: Schedules 24kHz PCM chunks seamlessly without gaps
 * Supports immediate interruption (Barge-in).
 */
export class LiveAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private sampleRate: number = 24000; // Gemini Live standard output sample rate

  constructor() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    this.ensureAudioContextRunning();
  }

  private async ensureAudioContextRunning() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (err) {
        console.warn('Failed to auto-resume AudioContext:', err);
      }
    }
  }

  public async playPcmChunk(base64Pcm: string) {
    if (!this.audioCtx) return;
    await this.ensureAudioContextRunning();

    try {
      const float32Data = base64ToFloat32Array(base64Pcm);
      if (float32Data.length === 0) return;

      const audioBuffer = this.audioCtx.createBuffer(
        1,
        float32Data.length,
        this.sampleRate
      );
      audioBuffer.getChannelData(0).set(float32Data);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioCtx.destination);

      const currentTime = this.audioCtx.currentTime;
      // If nextPlayTime is behind current time, reset to current time
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }

      source.start(this.nextPlayTime);
      this.activeSources.push(source);

      // Advance schedule pointer
      this.nextPlayTime += audioBuffer.duration;

      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
      };
    } catch (error) {
      console.error('Error scheduling live audio chunk:', error);
    }
  }

  public interrupt() {
    // Immediately halt all playing and queued audio sources
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source might already be stopped
      }
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextPlayTime = this.audioCtx.currentTime;
    }
  }

  public close() {
    this.interrupt();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}

/**
 * createPcmAudioRecorder: Captures raw microphone audio, downsamples to 16kHz,
 * converts to 16-bit PCM, and emits Base64 chunks via callback.
 */
export async function createPcmAudioRecorder(
  onDataChunk: (base64Chunk: string) => void,
  onAudioLevel?: (level: number) => void
): Promise<() => void> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  // Mobile-optimized acoustic hardware constraints
  const constraints: MediaStreamConstraints = {
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  const source = audioCtx.createMediaStreamSource(stream);

  // Buffer size 4096 gives ~85ms chunks at 48kHz (smooth real-time streaming)
  const bufferSize = 4096;
  const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);

  processor.onaudioprocess = (e) => {
    const inputData = e.inputBuffer.getChannelData(0);

    // Calculate real-time root-mean-square (RMS) for visualizer
    if (onAudioLevel) {
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      onAudioLevel(Math.min(1, rms * 5)); // Scaled for UI responsiveness
    }

    // Downsample from hardware rate (e.g. 48000Hz) to 16000Hz for Gemini Live
    const downsampled = downsampleBuffer(inputData, audioCtx.sampleRate, 16000);

    // Convert to 16-bit Linear PCM
    const pcm16Buffer = floatTo16BitPCM(downsampled);

    // Convert to Base64 and push over WebSocket
    const base64Chunk = arrayBufferToBase64(pcm16Buffer);
    onDataChunk(base64Chunk);
  };

  source.connect(processor);
  processor.connect(audioCtx.destination);

  // Return teardown function
  return () => {
    try {
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      if (audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    } catch (e) {
      console.warn('Error during audio recorder teardown:', e);
    }
  };
}
