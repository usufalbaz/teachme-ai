/**
 * Audio helpers for Gemini Multimodal Live API
 * PCM 16kHz capture (Microphone -> Int16 -> Base64)
 * PCM 24kHz playback (Base64 -> Int16 -> Float32 -> Web Audio API)
 */

export function downsampleTo16kHz(
  input: Float32Array,
  sampleRate: number
): Int16Array {
  if (sampleRate === 16000) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }

  const ratio = sampleRate / 16000;
  const newLength = Math.round(input.length / ratio);
  const result = new Int16Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcPos = i * ratio;
    const srcIndex = Math.floor(srcPos);
    const weight = srcPos - srcIndex;

    const s0 = input[srcIndex] !== undefined ? input[srcIndex] : 0;
    const s1 = input[srcIndex + 1] !== undefined ? input[srcIndex + 1] : s0;
    const interpolated = s0 + weight * (s1 - s0);

    const s = Math.max(-1, Math.min(1, interpolated));
    result[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  return result;
}

export function int16ArrayToBase64(int16: Int16Array): string {
  let binary = '';
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new DataView(new ArrayBuffer(input.length * 2));
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return output.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export class LiveAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor() {
    // AudioContext will be initialized upon user gesture
  }

  private getContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: 24000 });
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public playChunk(base64Pcm: string): void {
    try {
      const ctx = this.getContext();
      const arrayBuffer = base64ToArrayBuffer(base64Pcm);
      const dataView = new DataView(arrayBuffer);
      const numSamples = arrayBuffer.byteLength / 2;
      const float32Data = new Float32Array(numSamples);

      for (let i = 0; i < numSamples; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Data[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
      }

      const audioBuffer = ctx.createBuffer(1, numSamples, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      this.activeSources.push(source);

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
      };
    } catch (err) {
      console.warn('LiveAudioPlayer error:', err);
    }
  }

  public isAudioPlaying(): boolean {
    if (!this.audioCtx) return false;
    return this.activeSources.length > 0 && this.nextPlayTime > this.audioCtx.currentTime;
  }

  public interrupt(): void {
    for (const src of this.activeSources) {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextPlayTime = this.audioCtx.currentTime;
    }
  }

  public close(): void {
    this.interrupt();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
    this.audioCtx = null;
  }
}
