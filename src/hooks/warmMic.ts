/**
 * Web-only recorder that keeps the microphone stream open ("warm") for the
 * whole game, so a buzz only has to start a MediaRecorder — no
 * getUserMedia round-trip, which takes from a third of a second to more than
 * a second on iPhones/iPads and also clips the first notes of the singing.
 */

const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return undefined;
  return MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
}

class WarmMic {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private lastUrl: string | null = null;

  get isWarm(): boolean {
    return !!this.stream?.getAudioTracks().some((t) => t.readyState === 'live');
  }

  /** Opens the mic if needed. Call from a tap on iOS (needs a user gesture). */
  async warmUp(): Promise<void> {
    if (this.isWarm) return;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('No microphone available');
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }

  async start(): Promise<void> {
    await this.warmUp(); // instant when already warm; re-opens if iOS closed it
    if (this.lastUrl) URL.revokeObjectURL(this.lastUrl);
    this.lastUrl = null;
    this.chunks = [];
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(this.stream!, mimeType ? { mimeType, audioBitsPerSecond: 64000 } : undefined);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    recorder.start();
    this.recorder = recorder;
  }

  /** Stops recording and returns a blob: URL for the clip (mic stays warm). */
  async stop(): Promise<string | null> {
    const recorder = this.recorder;
    this.recorder = null;
    if (!recorder) return null;
    const stopped = new Promise<void>((resolve) => recorder.addEventListener('stop', () => resolve(), { once: true }));
    if (recorder.state !== 'inactive') recorder.stop();
    await stopped;
    if (this.chunks.length === 0) return null;
    this.lastUrl = URL.createObjectURL(new Blob(this.chunks, { type: recorder.mimeType || 'audio/webm' }));
    return this.lastUrl;
  }

  /** Closes the mic (turns off the browser's "in use" indicator). */
  release(): void {
    if (this.recorder?.state === 'recording') this.recorder.stop();
    this.recorder = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}

export const warmMic = new WarmMic();
