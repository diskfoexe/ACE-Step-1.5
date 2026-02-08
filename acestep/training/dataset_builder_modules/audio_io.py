import os
import shutil
import subprocess
from typing import Tuple

import soundfile as sf
from loguru import logger

try:
    import torchaudio
except Exception:
    torchaudio = None


def load_lyrics_file(audio_path: str) -> Tuple[str, bool]:
    """Load lyrics from a .txt file with the same name as the audio file."""
    base_path = os.path.splitext(audio_path)[0]
    lyrics_path = base_path + ".txt"

    if os.path.exists(lyrics_path):
        try:
            with open(lyrics_path, "r", encoding="utf-8") as f:
                lyrics_content = f.read().strip()

            if lyrics_content:
                logger.info(f"Loaded lyrics from {lyrics_path}")
                return lyrics_content, True
            logger.warning(f"Lyrics file is empty: {lyrics_path}")
            return "", False
        except Exception as e:
            logger.warning(f"Failed to read lyrics file {lyrics_path}: {e}")
            return "", False

    return "", False


def get_audio_duration(audio_path: str) -> int:
    """Get the duration of an audio file in seconds."""
    try:
        info = sf.info(audio_path)
        if info.samplerate > 0:
            return int(info.frames / info.samplerate)
    except Exception:
        pass

    ffprobe_bin = shutil.which("ffprobe")
    if ffprobe_bin:
        try:
            proc = subprocess.run(
                [
                    ffprobe_bin,
                    "-v",
                    "error",
                    "-show_entries",
                    "format=duration",
                    "-of",
                    "default=noprint_wrappers=1:nokey=1",
                    audio_path,
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=False,
            )
            if proc.returncode == 0 and proc.stdout.strip():
                return int(float(proc.stdout.strip()))
        except Exception:
            pass

    try:
        if torchaudio is None:
            raise RuntimeError("torchaudio unavailable")
        info = torchaudio.info(audio_path)
        return int(info.num_frames / info.sample_rate)
    except Exception as e:
        logger.warning(f"Failed to get duration for {audio_path}: {e}")
        return 0
