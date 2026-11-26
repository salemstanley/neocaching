import { AudioPlayer, setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';

const COIN = require('../../assets/sounds/coin.wav');
const WARNING = require('../../assets/sounds/warning.wav');
const TURKEY = require('../../assets/sounds/turkey.wav');

// Coin "cha-ching" for the right way, a buzz (or an angry turkey) for the wrong way.
export function useGameSounds() {
  // Three coin players take turns, so quick grabs in a row never cut each
  // other off or get skipped while one is still rewinding.
  const coins = [useAudioPlayer(COIN), useAudioPlayer(COIN), useAudioPlayer(COIN)];
  const warning = useAudioPlayer(WARNING);
  const turkey = useAudioPlayer(TURKEY);
  const next = useRef(0);

  useEffect(() => {
    // Play even with the ringer on silent or vibrate, and don't get muted by music.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers', shouldPlayInBackground: false }).catch(() => {});
    for (const p of [...coins, warning, turkey]) p.volume = 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = (player: AudioPlayer) => {
    player.volume = 1;
    // Rewind first, then play. If rewinding fails, play anyway.
    player
      .seekTo(0)
      .catch(() => {})
      .finally(() => player.play());
  };

  const playCoin = () => {
    const p = coins[next.current % coins.length];
    next.current++;
    play(p);
  };

  return { playCoin, playWarning: () => play(warning), playTurkey: () => play(turkey) };
}
