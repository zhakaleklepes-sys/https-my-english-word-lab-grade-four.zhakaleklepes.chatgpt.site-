import asyncio
import hashlib
import json
from pathlib import Path

import edge_tts

ROOT = Path(__file__).parent
VOICES = {
    "ryan": "en-GB-RyanNeural",
    "thomas": "en-GB-ThomasNeural",
}
OVERRIDES = {
    "ICT": "I C T",
    "PE": "P E",
    "Watch TV": "watch T V",
    "Do one's homework": "do ones homework",
}


async def main():
    data = json.loads((ROOT / "data.json").read_text(encoding="utf-8"))
    words = sorted({word[0] for section in data for word in section["words"]})
    audio_root = ROOT / "assets" / "audio"
    audio_root.mkdir(parents=True, exist_ok=True)
    manifest = {}
    semaphore = asyncio.Semaphore(10)

    async def render(voice_key, voice_name, word):
        file_key = hashlib.sha1(word.encode("utf-8")).hexdigest()[:16]
        relative = f"assets/audio/{voice_key}/{file_key}.mp3"
        destination = ROOT / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        manifest.setdefault(word, {})[voice_key] = relative
        if destination.exists() and destination.stat().st_size > 1000:
            return
        async with semaphore:
            for attempt in range(3):
                try:
                    text = OVERRIDES.get(word, word)
                    await edge_tts.Communicate(text, voice_name, rate="-8%", pitch="-2Hz").save(destination)
                    return
                except Exception:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(1 + attempt)

    await asyncio.gather(*(
        render(voice_key, voice_name, word)
        for word in words
        for voice_key, voice_name in VOICES.items()
    ))
    js = "window.AUDIO_MANIFEST=" + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (ROOT / "audio-manifest.js").write_text(js, encoding="utf-8")
    print(f"Generated {len(words)} words in {len(VOICES)} British male voices")


if __name__ == "__main__":
    asyncio.run(main())
