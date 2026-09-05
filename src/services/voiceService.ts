/**
 * Voice & Audio Service for Liencolis Driver Safety
 * Provides hands-free voice alerts, sound synthesizer, and voice commands
 */

class VoiceService {
  private audioCtx: AudioContext | null = null;
  private isRecognitionActive = false;
  private recognitionInstance: any = null;

  private getAudioContext(): AudioContext | null {
    if (!this.audioCtx) {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (typeof AudioCtxClass === 'function') {
          this.audioCtx = new AudioCtxClass();
        }
      } catch (e) {
        console.warn('AudioContext constructor not permitted or failed:', e);
        return null;
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        this.audioCtx.resume().catch(() => {});
      } catch {}
    }
    return this.audioCtx;
  }

  /**
   * Triggers browser Vibration API haptic feedback tailored for drivers (hands-free safety)
   * 300m / 500m proximity alerts have high-intensity multi-pulse rhythms for driving
   */
  public triggerProximityVibration(type: '300m' | '500m' | 'arrived' | 'sos' | 'general' = '300m'): boolean {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
      console.warn('Vibration API not supported by browser or device.');
      return false;
    }

    try {
      // Cancel any ongoing vibration pattern
      navigator.vibrate(0);

      if (type === '300m') {
        // High attention urgent haptic pattern for 300m proximity: 3 strong bursts + long pulse
        // Pattern: [vibrate, pause, vibrate, pause, vibrate, pause, long vibrate]
        navigator.vibrate([400, 120, 400, 120, 600, 150, 900]);
      } else if (type === '500m') {
        // 500m Approach notice haptic pattern: double rhythmic pulses
        navigator.vibrate([300, 100, 300, 100, 450]);
      } else if (type === 'arrived') {
        // Destination arrived haptic pattern: 4 rapid celebratory pulses
        navigator.vibrate([150, 80, 150, 80, 150, 80, 500]);
      } else if (type === 'sos') {
        // Emergency SOS pattern: SOS Morse code vibration [S = . . . , O = --- , S = . . .]
        navigator.vibrate([150, 100, 150, 100, 150, 200, 400, 100, 400, 100, 400, 200, 150, 100, 150, 100, 150]);
      } else {
        navigator.vibrate([200, 100, 200]);
      }
      return true;
    } catch (err) {
      console.warn('Failed to trigger haptic vibration:', err);
      return false;
    }
  }

  /**
   * Check if device supports Vibration API
   */
  public isVibrationSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  /**
   * Plays a loud warning chime / vibration for 300m and 500m alerts
   */
  public playAlertSound(type: 'warning_300m' | 'primary_500m' | 'delivered' | 'sos' = 'warning_300m'): void {
    try {
      // Haptic vibration feedback
      if (type === 'warning_300m') {
        this.triggerProximityVibration('300m');
      } else if (type === 'primary_500m') {
        this.triggerProximityVibration('500m');
      } else if (type === 'delivered') {
        this.triggerProximityVibration('arrived');
      } else if (type === 'sos') {
        this.triggerProximityVibration('sos');
      }

      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'warning_300m') {
        // High attention alert chime (two-tone urgent beep)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // A5
        osc1.frequency.setValueAtTime(1174.66, now + 0.15); // D6
        osc1.frequency.setValueAtTime(1760, now + 0.35); // A6

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(587.33, now + 0.15);
        osc2.frequency.setValueAtTime(880, now + 0.35);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.8);
        osc2.stop(now + 0.8);
      } else if (type === 'primary_500m') {
        // Softer notice chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.15); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.55);
      } else if (type === 'delivered') {
        // Victory fanfare
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.75);
      }
    } catch (e) {
      console.warn('Audio playback not permitted yet (requires user gesture):', e);
    }
  }

  /**
   * Speaks a clear French/international voice synthesis message
   */
  public speak(text: string, lang = 'fr-FR', onEnd?: () => void): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not available');
      onEnd?.();
      return;
    }

    try {
      const SpeechUtteranceClass = (window as any).SpeechSynthesisUtterance;
      if (!SpeechUtteranceClass || typeof SpeechUtteranceClass !== 'function') {
        onEnd?.();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechUtteranceClass(text);
      utterance.lang = lang;
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Select French voice if available
      const voices = window.speechSynthesis.getVoices();
      const frenchVoice = voices.find((v) => v.lang.startsWith('fr') || v.name.includes('French'));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }

      utterance.onend = () => {
        onEnd?.();
      };
      utterance.onerror = () => {
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis error:', err);
      onEnd?.();
    }
  }

  /**
   * Starts listening for driver voice commands (hands-free)
   */
  public startVoiceCommandListener(
    onCommandRecognized: (command: string, action: string) => void,
    onError?: (error: string) => void
  ): boolean {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition || typeof SpeechRecognition !== 'function') {
      onError?.("La reconnaissance vocale n'est pas prise en charge par ce navigateur.");
      return false;
    }

    try {
      if (this.recognitionInstance) {
        try {
          this.recognitionInstance.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        this.isRecognitionActive = true;
      };

      recognition.onresult = (event: any) => {
        const lastIndex = event.results.length - 1;
        const transcript = event.results[lastIndex][0].transcript.toLowerCase().trim();
        console.log('Voice Command Received:', transcript);

        let action = 'unknown';
        if (transcript.includes('client') || transcript.includes('appelle') || transcript.includes('appel client')) {
          action = 'call_client';
        } else if (transcript.includes('secours') || transcript.includes('urgence') || transcript.includes('proche')) {
          action = 'call_emergency';
        } else if (transcript.includes('whatsapp') || transcript.includes('message')) {
          action = 'whatsapp_client';
        } else if (transcript.includes('panne') || transcript.includes('crevaison') || transcript.includes('accident') || transcript.includes('police')) {
          action = 'report_incident';
        } else if (transcript.includes('valider') || transcript.includes('reçu') || transcript.includes('terminer') || transcript.includes('livré')) {
          action = 'confirm_delivered';
        } else if (transcript.includes('gps') || transcript.includes('itinéraire') || transcript.includes('voie')) {
          action = 'read_route';
        }

        onCommandRecognized(transcript, action);
      };

      recognition.onerror = (e: any) => {
        console.warn('Voice recognition error:', e.error);
        if (e.error !== 'no-speech') {
          onError?.(e.error);
        }
      };

      recognition.onend = () => {
        this.isRecognitionActive = false;
      };

      recognition.start();
      this.recognitionInstance = recognition;
      return true;
    } catch (e: any) {
      console.error('Failed to start voice command listener:', e);
      onError?.(e.message);
      return false;
    }
  }

  public stopVoiceCommandListener(): void {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch {
        // Ignore
      }
      this.recognitionInstance = null;
      this.isRecognitionActive = false;
    }
  }

  public isListening(): boolean {
    return this.isRecognitionActive;
  }
}

export const voiceService = new VoiceService();
