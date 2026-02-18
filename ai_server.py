#!/usr/bin/env python3
"""AG Brew Lab static server + local AI assistant endpoint.

Run:
  python3 ai_server.py --port 4174

Requirements for AI generation:
  pip install transformers torch
"""

from __future__ import annotations

import argparse
import json
import os
import re
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

MODEL_NAME = "gpt2"
BREW_SIGNAL_RE = re.compile(
    r"\b(coffee|espresso|matcha|brew|grind|ratio|temperature|v60|pour[- ]?over|aeropress|chemex|french press|extraction|latte|cappuccino|filter|dripper|beans?|roast|caramel|syrup|sweetener|vanilla|mocha)\b",
    re.IGNORECASE,
)
GREETING_ONLY_RE = re.compile(r"^(hi|hey|hello|hey assistant|yo|hiya|sup|what's up)[\s!?.]*$", re.IGNORECASE)

_model = None
_tokenizer = None
_model_error: str | None = None
_model_lock = threading.Lock()

try:
    import torch  # type: ignore
    from transformers import AutoModelForCausalLM, AutoTokenizer  # type: ignore
except Exception as exc:  # pragma: no cover - depends on environment
    torch = None
    AutoModelForCausalLM = None
    AutoTokenizer = None
    _model_error = f"Missing AI dependencies: {exc}"


def _ensure_model() -> None:
    global _model, _tokenizer, _model_error

    if _model is not None and _tokenizer is not None:
        return
    if _model_error is not None and "Missing AI dependencies" in _model_error:
        return

    with _model_lock:
        if _model is not None and _tokenizer is not None:
            return

        try:
            _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
            _model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)
            _model.eval()
        except Exception as exc:  # pragma: no cover - runtime dependency
            _model_error = f"Model load failed: {exc}"


def _build_prompt(message: str, page: str) -> str:
    clean_msg = message.strip().replace("\n", " ")
    page_hint = page.strip() if page.strip() else "general"

    return (
        "You are Brew Concierge for AG Brew Lab by Aishwarya Gawali. "
        "The brand focuses on high-performance coffee and matcha rituals, weekly drops, and precise brew methods.\n"
        "Response style rules:\n"
        "1. Be concise, actionable, and specific.\n"
        "2. Include exact grams, water volume, temperature, grind, and time when relevant.\n"
        "3. Prefer practical step sequences and corrections over generic advice.\n"
        "4. Keep tone professional and focused on the AG Brew Lab style.\n"
        f"Page context: {page_hint}.\n"
        f"Customer request: {clean_msg}\n"
        "Assistant reply:\n"
    )


def _normalize_message(message: str) -> str:
    return re.sub(r"\s+", " ", message).strip().lower()


def _classify_prompt(message: str) -> str:
    normalized = _normalize_message(message)
    if not normalized:
        return "empty"
    if GREETING_ONLY_RE.match(normalized):
        return "greeting"
    if BREW_SIGNAL_RE.search(normalized):
        return "brew"
    return "unknown"


def _scope_reply() -> str:
    return "I focus on coffee and matcha brewing at AG Brew Lab. Ask about recipes, extraction, grind, temperature, or ratios."


def _greeting_reply() -> str:
    return "Hey. Share your brew method and taste issue, and I will give a precise dial-in plan."


def _fallback_reply(message: str) -> str:
    lowered = message.lower()

    if "sour" in lowered:
        return (
            "Sour extraction fix:\n"
            "- Grind 1-2 steps finer.\n"
            "- Increase brew temp by 1-2C.\n"
            "- Extend contact time by 10-20 seconds.\n"
            "- Keep ratio near 1:16 for filter, then re-taste."
        )

    if "bitter" in lowered:
        return (
            "Bitter extraction fix:\n"
            "- Grind slightly coarser.\n"
            "- Reduce water temp by 1-2C.\n"
            "- Shorten brew time and avoid over-stirring.\n"
            "- For espresso, shorten yield to reduce harsh tails."
        )

    if "matcha" in lowered:
        return (
            "AG matcha baseline:\n"
            "- 2g matcha, 70ml water at 80C.\n"
            "- Whisk zig-zag for 20 seconds.\n"
            "- For iced latte: add 180ml cold milk over ice.\n"
            "- For stronger profile: 2.5g matcha, 60ml water."
        )

    return (
        "Coffee baseline (manual brew):\n"
        "- Dose: 20g coffee.\n"
        "- Water: 320ml at 92-93C.\n"
        "- Ratio: 1:16.\n"
        "- Bloom: 40s, then pulse pour to finish around 2:45."
    )


def _clean_generated(text: str) -> str:
    cleaned = re.sub(r"^(answer:|assistant:)\s*", "", text.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"<[^>]+>", "", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = re.sub(r"_{3,}", " ", cleaned)
    cleaned = cleaned.strip()
    return cleaned[:820]


def _looks_like_garbage(text: str) -> bool:
    if not text or len(text) < 12:
        return True
    if re.search(r"(___|<unk>|```|https?://|@@@)", text, flags=re.IGNORECASE):
        return True
    if re.search(r"(.)\1{7,}", text):
        return True
    printable = sum(1 for char in text if 32 <= ord(char) <= 126 or char in "\n\r\t")
    if printable / max(len(text), 1) < 0.96:
        return True
    alpha_num = len(re.findall(r"[a-z0-9]", text, flags=re.IGNORECASE))
    if alpha_num / max(len(text), 1) < 0.36:
        return True
    return False


def _is_useful_reply(message: str, reply: str) -> bool:
    if _looks_like_garbage(reply):
        return False

    prompt_type = _classify_prompt(message)
    if prompt_type == "greeting":
        return bool(re.search(r"\b(hey|hi|hello|brew|coffee|matcha)\b", reply, flags=re.IGNORECASE))
    if prompt_type == "unknown":
        return bool(re.search(r"\b(coffee|matcha|brew)\b", reply, flags=re.IGNORECASE))
    return bool(BREW_SIGNAL_RE.search(reply) or re.search(r"\d+\s?(g|ml|c|°c|sec|min)", reply, flags=re.IGNORECASE))


def _generate_reply(message: str, page: str) -> tuple[str, str | None]:
    prompt_type = _classify_prompt(message)
    if prompt_type == "greeting":
        return _greeting_reply(), None
    if prompt_type == "unknown":
        return _scope_reply(), None
    if prompt_type == "empty":
        return "Ask a specific brew question and I will give a precise step plan.", None

    _ensure_model()

    if _model is None or _tokenizer is None or _model_error is not None:
        return _fallback_reply(message), _model_error

    prompt = _build_prompt(message=message, page=page)

    try:
        encoded = _tokenizer(prompt, return_tensors="pt")

        if torch is not None and torch.cuda.is_available():  # pragma: no cover - optional runtime path
            encoded = {k: v.to("cuda") for k, v in encoded.items()}
            _model.to("cuda")

        with torch.no_grad():
            output = _model.generate(
                **encoded,
                max_new_tokens=170,
                do_sample=True,
                temperature=0.75,
                top_p=0.92,
                repetition_penalty=1.18,
                pad_token_id=_tokenizer.eos_token_id,
                eos_token_id=_tokenizer.eos_token_id,
            )

        prompt_tokens = encoded["input_ids"].shape[1]
        generated_tokens = output[0][prompt_tokens:]
        generated = _tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()

        generated = generated.split("Customer request:")[0].strip()
        generated = generated.split("Assistant reply:")[0].strip()
        generated = _clean_generated(generated)

        if not generated or not _is_useful_reply(message, generated):
            return _fallback_reply(message), "Model output failed quality checks"

        return generated, None
    except Exception as exc:  # pragma: no cover - runtime dependency
        return _fallback_reply(message), f"Generation failed: {exc}"


class AGHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args: Any, directory: str, **kwargs: Any) -> None:
        super().__init__(*args, directory=directory, **kwargs)

    def _write_json(self, status: int, payload: dict[str, Any]) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)

        if parsed.path == "/api/coffee-assistant/health":
            self._write_json(
                200,
                {
                    "status": "ok",
                    "model": MODEL_NAME,
                    "model_loaded": _model is not None,
                    "model_error": _model_error,
                },
            )
            return

        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)

        if parsed.path != "/api/coffee-assistant":
            self._write_json(404, {"error": "not_found"})
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            payload = json.loads(raw.decode("utf-8"))
        except Exception:
            self._write_json(400, {"error": "invalid_json"})
            return

        message = str(payload.get("message", "")).strip()
        page = str(payload.get("page", "general")).strip()

        if not message:
            self._write_json(400, {"error": "missing_message", "message": "Message is required."})
            return

        reply, err = _generate_reply(message=message, page=page)
        self._write_json(
            200,
            {
                "reply": reply,
                "engine": MODEL_NAME,
                "degraded": bool(err),
                "warning": err,
            },
        )


def run_server(host: str, port: int, root: Path) -> None:
    handler = lambda *args, **kwargs: AGHandler(*args, directory=str(root), **kwargs)
    server = ThreadingHTTPServer((host, port), handler)

    print(f"Serving AG Brew Lab on http://{host}:{port}")
    print("Assistant endpoint: /api/coffee-assistant")
    if _model_error:
        print(f"AI warning: {_model_error}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="AG Brew Lab static + AI server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=4174)
    parser.add_argument("--root", default=str(Path(__file__).resolve().parent))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    run_server(host=args.host, port=args.port, root=Path(args.root).resolve())


if __name__ == "__main__":
    main()
