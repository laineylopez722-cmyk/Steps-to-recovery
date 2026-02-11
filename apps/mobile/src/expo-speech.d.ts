declare module 'expo-speech' {
  interface SpeechOptions {
    language?: string;
    /**
     * Controls the pitch (tone) of the synthesized speech.
     *
     * Typical supported range is from 0.5 (lower pitch) to 2.0 (higher pitch),
     * with 1.0 as the normal/default pitch. Values outside this range may be
     * clamped or ignored by the underlying platform text-to-speech engine and
     * can behave inconsistently across iOS and Android.
     */
    pitch?: number;
    /**
     * Controls the speed at which the text is spoken.
     *
     * Typical supported range is from 0.5 (slower) to 2.0 (faster),
     * with 1.0 as the normal/default rate. Values outside this range may be
     * clamped or ignored by the underlying platform text-to-speech engine and
     * can behave inconsistently across iOS and Android.
     */
    rate?: number;
    /** Controls the volume of the speech output. Supported range is from 0.0 (silent) to 1.0 (full volume). */
    volume?: number;

    onError?: (error: { message: string }) => void;

    onDone?: () => void;
    onStart?: () => void;
    onStopped?: () => void;
  }

  export function speak(text: string, options?: SpeechOptions): void;
  export function stop(): void;
  export function isSpeakingAsync(): Promise<boolean>;
}
