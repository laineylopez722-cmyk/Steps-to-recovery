declare module 'expo-speech' {
  interface SpeechOptions {
    language?: string;
    pitch?: number;
    rate?: number;
    onError?: (error: { message: string }) => void;
    onDone?: () => void;
    onStart?: () => void;
    onStopped?: () => void;
  }

  export function speak(text: string, options?: SpeechOptions): void;
  export function stop(): void;
  export function isSpeakingAsync(): Promise<boolean>;
}
