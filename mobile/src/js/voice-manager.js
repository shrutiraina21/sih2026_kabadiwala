/**
 * Kabadiwala Connect — Voice & Audio Manager
 * Handles pre-recorded Hindi instructions and device-local Text-to-Speech (TTS).
 */

class VoiceManager {
  constructor() {
    this.audioElement = new Audio();
    this.synth = window.speechSynthesis;
    this.hindiVoice = null;
    this.isTtsAvailable = false;
    this.voicesLoaded = false;
    
    this.baseAudioPath = '/audio/hi/';
    
    // Phrases mapping for TTS fallback when audio files are missing
    this.phrases = {
      welcome: 'नमस्ते।',
      take_clear_photo: 'कबाड़ की साफ़ फोटो लें।',
      select_category: 'कृपया कबाड़ की श्रेणी चुनें।',
      confirm_category: 'क्या यह सही श्रेणी है?',
      category_confirmed: 'आपने यह श्रेणी चुनी है।',
      price_available: 'इस कबाड़ की कीमत है।',
      dealer_offers: 'डीलरों की कीमतें सुनने के लिए बटन दबाएँ।',
      no_offers: 'अभी किसी डीलर की कीमत उपलब्ध नहीं है।',
      error_retry: 'कृपया फिर से कोशिश करें।'
    };

    this._initVoices();
  }

  _initVoices() {
    if (!this.synth) return;

    const loadVoices = () => {
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        // Look for Hindi voices
        this.hindiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
        this.isTtsAvailable = !!this.hindiVoice;
        this.voicesLoaded = true;
      }
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  /**
   * Stop any currently playing audio or TTS immediately.
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  playFixedAudio(key) {
    this.stop();
    
    const src = `${this.baseAudioPath}${key}.mp3`;
    this.audioElement.src = src;
    
    this.audioElement.play().catch(err => {
      console.warn(`Could not play fixed audio for ${key} (file might be missing). Falling back to TTS.`, err);
      // Fallback to TTS if the MP3 is missing or autoplay blocked
      if (this.phrases[key]) {
        this.speakTTS(this.phrases[key]);
      }
    });
  }

  speakTTS(text) {
    this.stop();
    
    if (!this.synth) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.hindiVoice) {
      utterance.voice = this.hindiVoice;
    } else {
      console.warn('Hindi voice not found, using default system voice. It may sound accented.');
    }

    utterance.lang = 'hi-IN';
    utterance.rate = 0.9; // Slightly slower for better clarity
    utterance.pitch = 1.0;
    
    utterance.onerror = (e) => {
      console.error('TTS Error:', e.error);
    };

    this.synth.speak(utterance);
  }

  /**
   * Special function to read dynamic material price and dealer offers.
   * Currently mocked to read the base material rate until the Dealer UI is complete.
   */
  speakDealerOffers(categoryName, baseRate, offers = []) {
    this.stop();
    
    let speechText = `${this.phrases.price_available} ${baseRate} रुपये प्रति किलो। `;
    
    if (offers && offers.length > 0) {
      // HOOK FOR TEAMMATE: When dealer UI is ready, pass the offers array here.
      speechText += `यहाँ ${offers.length} डीलर हैं। `;
      offers.forEach((offer, index) => {
        speechText += `डीलर ${index + 1}, ${offer.name}, ${offer.rate} रुपये दे रहे हैं। `;
      });
    } else {
      // No offers yet, just the base rate
      speechText += this.phrases.no_offers;
    }
    
    this.speakTTS(speechText);
  }
}

// Export singleton instance
export const voiceManager = new VoiceManager();
