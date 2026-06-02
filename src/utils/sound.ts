type WebAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

type SoundName = 'crack' | 'explosion' | 'win' | 'wrong';

export interface SoundEffects {
  unlock: () => void;
  play: (name: SoundName) => void;
}

export function createSoundEffects(): SoundEffects {
  let context: AudioContext | null = null;

  const getContext = (): AudioContext | null => {
    if (context) {
      return context;
    }

    const AudioContextClass =
      window.AudioContext ?? (window as WebAudioWindow).webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    context = new AudioContextClass();
    return context;
  };

  const unlock = (): void => {
    const audioContext = getContext();

    if (!audioContext) {
      return;
    }

    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }
  };

  const play = (name: SoundName): void => {
    unlock();
    const audioContext = getContext();

    if (!audioContext || audioContext.state === 'closed') {
      return;
    }

    if (name === 'wrong') {
      playWrong(audioContext);
      return;
    }

    if (name === 'crack') {
      playCrack(audioContext);
      return;
    }

    if (name === 'win') {
      playWin(audioContext);
      return;
    }

    playExplosion(audioContext);
  };

  return { unlock, play };
}

function playWrong(context: AudioContext): void {
  const now = context.currentTime;
  const gain = createGain(context, 0.13, now, 0.18);
  const oscillator = context.createOscillator();

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(190, now);
  oscillator.frequency.exponentialRampToValueAtTime(105, now + 0.18);
  oscillator.connect(gain);
  oscillator.start(now);
  oscillator.stop(now + 0.2);
}

function playCrack(context: AudioContext): void {
  const now = context.currentTime;
  const chime = context.createOscillator();
  const chimeGain = createGain(context, 0.07, now, 0.22);
  chime.type = 'sine';
  chime.frequency.setValueAtTime(520, now);
  chime.frequency.exponentialRampToValueAtTime(690, now + 0.12);
  chime.connect(chimeGain);
  chime.start(now);
  chime.stop(now + 0.24);

  const secondChime = context.createOscillator();
  const secondGain = createGain(context, 0.035, now + 0.04, 0.2);
  secondChime.type = 'sine';
  secondChime.frequency.setValueAtTime(780, now + 0.04);
  secondChime.connect(secondGain);
  secondChime.start(now + 0.04);
  secondChime.stop(now + 0.24);

  const noise = createNoise(context, 0.1);
  const gain = createGain(context, 0.045, now, 0.11);
  const filter = context.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(520, now);
  filter.Q.setValueAtTime(0.5, now);
  noise.connect(filter);
  filter.connect(gain);
  noise.start(now);
  noise.stop(now + 0.12);
}

function playExplosion(context: AudioContext): void {
  const now = context.currentTime;
  const noise = createNoise(context, 0.58);
  const gain = createGain(context, 0.15, now, 0.58);
  const filter = context.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(420, now);
  filter.frequency.exponentialRampToValueAtTime(95, now + 0.52);
  noise.connect(filter);
  filter.connect(gain);
  noise.start(now);
  noise.stop(now + 0.6);

  const boom = context.createOscillator();
  const boomGain = createGain(context, 0.12, now, 0.44);
  boom.type = 'sine';
  boom.frequency.setValueAtTime(76, now);
  boom.frequency.exponentialRampToValueAtTime(36, now + 0.38);
  boom.connect(boomGain);
  boom.start(now);
  boom.stop(now + 0.46);
}

function playWin(context: AudioContext): void {
  const now = context.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((frequency, index) => {
    const start = now + index * 0.11;
    const oscillator = context.createOscillator();
    const gain = createGain(context, index === notes.length - 1 ? 0.08 : 0.06, start, 0.32);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.connect(gain);
    oscillator.start(start);
    oscillator.stop(start + 0.34);
  });
}

function createGain(
  context: AudioContext,
  peak: number,
  startTime: number,
  duration: number,
): GainNode {
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  gain.connect(context.destination);
  return gain;
}

function createNoise(context: AudioContext, duration: number): AudioBufferSourceNode {
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, Math.max(1, sampleRate * duration), sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < data.length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  return source;
}
