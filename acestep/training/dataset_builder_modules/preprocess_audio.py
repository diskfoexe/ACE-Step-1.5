import os
import shutil
import subprocess
import tempfile
from typing import Tuple

import soundfile as sf
import torch
import torch.nn.functional as F

try:
    import torchaudio
except Exception:
    torchaudio = None


def _load_with_soundfile(audio_path: str) -> Tuple[torch.Tensor, int]:
    data, sr = sf.read(audio_path, always_2d=True, dtype="float32")
    audio = torch.from_numpy(data.T)
    return audio, int(sr)


def _load_with_ffmpeg(audio_path: str) -> Tuple[torch.Tensor, int]:
    ffmpeg_bin = shutil.which("ffmpeg")
    if ffmpeg_bin is None:
        raise RuntimeError("ffmpeg not found in PATH")

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_wav = tmp.name
    try:
        proc = subprocess.run(
            [ffmpeg_bin, "-y", "-i", audio_path, "-acodec", "pcm_f32le", tmp_wav],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip() or "ffmpeg decode failed")
        return _load_with_soundfile(tmp_wav)
    finally:
        try:
            os.remove(tmp_wav)
        except OSError:
            pass


def load_audio_stereo(audio_path: str, target_sample_rate: int, max_duration: float):
    """Load audio, resample, convert to stereo, and truncate."""
    try:
        audio, sr = _load_with_soundfile(audio_path)
    except Exception:
        try:
            audio, sr = _load_with_ffmpeg(audio_path)
        except Exception:
            if torchaudio is None:
                raise
            audio, sr = torchaudio.load(audio_path)

    if sr != target_sample_rate:
        if torchaudio is not None:
            resampler = torchaudio.transforms.Resample(sr, target_sample_rate)
            audio = resampler(audio)
        else:
            new_len = int(audio.shape[1] * float(target_sample_rate) / float(sr))
            audio = F.interpolate(
                audio.unsqueeze(0),
                size=new_len,
                mode="linear",
                align_corners=False,
            ).squeeze(0)

    if audio.shape[0] == 1:
        audio = audio.repeat(2, 1)
    elif audio.shape[0] > 2:
        audio = audio[:2, :]

    max_samples = int(max_duration * target_sample_rate)
    if audio.shape[1] > max_samples:
        audio = audio[:, :max_samples]

    return audio, sr
