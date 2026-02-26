import { createAudioPlayer, AudioPlayer } from 'expo-audio';

// Using a reliable source (Wikipedia Commons) for a simple "pop" sound
// This is a "Cork Pop" sound
const POP_SOUND_URI = 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Pop_Cork.ogg';

class SoundService {
  private player: AudioPlayer | null = null;
  private isLoaded: boolean = false;

  async playPop() {
    try {
        if (!this.player) {
             const newSource = { uri: POP_SOUND_URI };
             this.player = createAudioPlayer(newSource);
        }
        
        // With expo-audio, we just call play()
        // It handles loading automatically or we can await prepare()
        // For simple UI sounds, play() is usually sufficient.
        this.player.play();

    } catch (error) {
      // Fail silently in production to avoid disrupting user
      console.log('Error playing sound with expo-audio', error);
    }
  }
}

export const Sounds = new SoundService();
