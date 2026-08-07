#!/usr/bin/env python3
from __future__ import annotations

import argparse
import importlib.util
import sys


def have(module: str) -> bool:
    return importlib.util.find_spec(module) is not None


def transcribe_with_faster_whisper(audio_path: str) -> str:
    from faster_whisper import WhisperModel

    model_name = "small"
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, _info = model.transcribe(audio_path, language="en", vad_filter=True)
    return " ".join(segment.text.strip() for segment in segments if segment.text.strip()).strip()


def transcribe_with_openai_whisper(audio_path: str) -> str:
    import whisper

    model = whisper.load_model("base")
    result = model.transcribe(audio_path, language="en")
    return (result.get("text") or "").strip()


def transcribe_with_sphinx(audio_path: str) -> str:
    import speech_recognition as sr

    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_path) as source:
        audio = recognizer.record(source)

    return recognizer.recognize_sphinx(audio).strip()


def main() -> int:
    parser = argparse.ArgumentParser(description="Transcribe an audio file locally")
    parser.add_argument("audio_path")
    args = parser.parse_args()

    if have("faster_whisper"):
        text = transcribe_with_faster_whisper(args.audio_path)
    elif have("whisper"):
        text = transcribe_with_openai_whisper(args.audio_path)
    elif have("speech_recognition") and have("pocketsphinx"):
        text = transcribe_with_sphinx(args.audio_path)
    else:
        print("No supported STT backend installed", file=sys.stderr)
        return 2

    text = text.strip()
    if not text:
        print("No transcript produced", file=sys.stderr)
        return 3

    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
