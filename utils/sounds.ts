import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Using a reliable source (Wikipedia Commons) for a simple "pop" sound
// This is a "Cork Pop" sound
const POP_SOUND_URI = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav';

class SoundService {
  private soundObj: Audio.Sound | null = null;

  async playPop() {
    if (Platform.OS === 'web') return;
    try {
        if (!this.soundObj) {
            const { sound } = await Audio.Sound.createAsync(
                { uri: POP_SOUND_URI },
                { shouldPlay: true }
            );
            this.soundObj = sound;
        } else {
            await this.soundObj.replayAsync();
        }
    } catch (error) {
      // Fail silently in production to avoid disrupting user
      console.log('Error playing sound with expo-av', error);
    }
  }
}

export const Sounds = new SoundService();
