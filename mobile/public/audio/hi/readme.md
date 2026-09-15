# Hindi Audio Assets

Place the pre-recorded Hindi `.mp3` files in this directory. The `voice-manager.js` relies on these files for fixed instructions.

Required files:
- `welcome.mp3` - "नमस्ते।"
- `take_clear_photo.mp3` - "कबाड़ की साफ़ फोटो लें।"
- `select_category.mp3` - "कृपया कबाड़ की श्रेणी चुनें।"
- `confirm_category.mp3` - "क्या यह सही श्रेणी है?"
- `category_confirmed.mp3` - "आपने यह श्रेणी चुनी है।"
- `price_available.mp3` - "इस कबाड़ की कीमत है।"
- `dealer_offers.mp3` - "डीलरों की कीमतें सुनने के लिए बटन दबाएँ।"
- `no_offers.mp3` - "अभी किसी डीलर की कीमत उपलब्ध नहीं है।"
- `error_retry.mp3` - "कृपया फिर से कोशिश करें।"
- `tts_fallback.mp3` - Fallback instruction if TTS is unavailable.

If any of these files are missing, the system will automatically fall back to using the device's native Text-To-Speech (TTS) engine.
