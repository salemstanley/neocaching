import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

const COIN = require('../../assets/sounds/coin.wav');
const WARNING = require('../../assets/sounds/warning.wav');
const TURKEY = require('../../assets/sounds/turkey.wav');

// Coin "cha-ching" for the right way, a buzz (or an angry turkey) for the wrong way.
export function useGameSounds() {
  const coin = useAudioPlayer(COIN);
  const warning = useAudioPlayer(WARNING);
  const turkey = useAudioPlayer(TURKEY);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
  }, []);

  const play = (player: typeof coin) => {
    player.seekTo(0);
    player.play();
  };

  return { playCoin: () => play(coin), playWarning: () => play(warning), playTurkey: () => play(turkey) };
}
