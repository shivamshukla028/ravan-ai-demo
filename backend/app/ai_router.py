"""
Ravan AI — Multi-Model Router
Supports: OpenAI, Anthropic, Gemini, DeepSeek, Qwen
All providers expose a unified interface:
  - stream_chat(messages, model, system_prompt) -> AsyncGenerator[str, None]
  - count_tokens(text, model) -> int
"""
import os
import json
from typing import AsyncGenerator, List, Dict, Optional, Any
from dotenv import load_dotenv

load_dotenv()

# ─── Model Registry ───────────────────────────────────────────────────────────

MODELS = {
    # OpenAI
    "gpt-4o":               {"provider": "openai",    "label": "GPT-4o",               "group": "OpenAI",     "tags": ["Smart", "Fast"]},
    "gpt-4-turbo":          {"provider": "openai",    "label": "GPT-4 Turbo",           "group": "OpenAI",     "tags": ["Smart"]},
    "gpt-3.5-turbo":        {"provider": "openai",    "label": "GPT-3.5 Turbo",         "group": "OpenAI",     "tags": ["Fast", "Cheap"]},
    # Anthropic
    "claude-3-5-sonnet-20241022": {"provider": "anthropic", "label": "Claude 3.5 Sonnet", "group": "Anthropic", "tags": ["Smart", "Safe"]},
    "claude-3-haiku-20240307":    {"provider": "anthropic", "label": "Claude 3 Haiku",    "group": "Anthropic", "tags": ["Fast", "Cheap"]},
    # Google Gemini
    "gemini-1.5-pro":       {"provider": "gemini",    "label": "Gemini 1.5 Pro",        "group": "Google",     "tags": ["Smart", "Long Context"]},
    "gemini-1.5-flash":     {"provider": "gemini",    "label": "Gemini 1.5 Flash",      "group": "Google",     "tags": ["Fast", "Cheap"]},
    # DeepSeek (OpenAI-compatible)
    "deepseek-chat":        {"provider": "deepseek",  "label": "DeepSeek Chat",         "group": "DeepSeek",   "tags": ["Fast", "Cheap"]},
    "deepseek-reasoner":    {"provider": "deepseek",  "label": "DeepSeek Reasoner",     "group": "DeepSeek",   "tags": ["Smart", "Reasoning"]},
    # Qwen (OpenAI-compatible via DashScope)
    "qwen-plus":            {"provider": "qwen",      "label": "Qwen Plus",             "group": "Qwen",       "tags": ["Fast"]},
    "qwen-max":             {"provider": "qwen",      "label": "Qwen Max",              "group": "Qwen",       "tags": ["Smart"]},
}

DEFAULT_MODEL = "gpt-4o"

RAVAN_SYSTEM_PROMPT = """You are Ravan AI, an expert cybersecurity intelligence assistant developed by Qyntraix Cyber Defence.
You specialize in:
- Threat intelligence analysis and incident response
- Vulnerability assessment and penetration testing concepts
- Compliance frameworks (ISO 27001, NIST, SOC 2, GDPR)
- Malware analysis and reverse engineering
- Network security and intrusion detection
- Security code review and secure development practices

Maintain a professional, analytical, and highly precise tone. Format responses with proper markdown, 
use code blocks for technical content, and provide actionable intelligence when possible."""


def get_model_info(model: str) -> Dict[str, Any]:
    return MODELS.get(model, MODELS[DEFAULT_MODEL])


def get_provider(model: str) -> str:
    return get_model_info(model).get("provider", "openai")


# ─── OpenAI Provider ──────────────────────────────────────────────────────────

async def _stream_openai(
    messages: List[Dict],
    model: str,
    system_prompt: str,
) -> AsyncGenerator[str, None]:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))
    
    full_messages = [{"role": "system", "content": system_prompt}] + messages
    
    stream = await client.chat.completions.create(
        model=model,
        messages=full_messages,
        stream=True,
        max_tokens=4096,
        temperature=0.7,
    )
    
    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content


# ─── Anthropic Provider ───────────────────────────────────────────────────────

async def _stream_anthropic(
    messages: List[Dict],
    model: str,
    system_prompt: str,
) -> AsyncGenerator[str, None]:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    
    # Anthropic uses a separate system parameter
    async with client.messages.stream(
        model=model,
        max_tokens=4096,
        system=system_prompt,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            yield text


# ─── Gemini Provider ──────────────────────────────────────────────────────────

async def _stream_gemini(
    messages: List[Dict],
    model: str,
    system_prompt: str,
) -> AsyncGenerator[str, None]:
    import google.generativeai as genai
    genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
    
    gemini_model = genai.GenerativeModel(
        model_name=model,
        system_instruction=system_prompt,
    )
    
    # Convert messages format
    history = []
    for i, msg in enumerate(messages[:-1]):
        role = "user" if msg["role"] == "user" else "model"
        history.append({"role": role, "parts": [msg["content"]]})
    
    chat = gemini_model.start_chat(history=history)
    last_message = messages[-1]["content"] if messages else ""
    
    response = await chat.send_message_async(last_message, stream=True)
    async for chunk in response:
        if chunk.text:
            yield chunk.text


# ─── DeepSeek Provider (OpenAI-compatible) ────────────────────────────────────

async def _stream_deepseek(
    messages: List[Dict],
    model: str,
    system_prompt: str,
) -> AsyncGenerator[str, None]:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(
        api_key=os.getenv("DEEPSEEK_API_KEY", ""),
        base_url="https://api.deepseek.com/v1",
    )
    
    full_messages = [{"role": "system", "content": system_prompt}] + messages
    
    stream = await client.chat.completions.create(
        model=model,
        messages=full_messages,
        stream=True,
        max_tokens=4096,
        temperature=0.7,
    )
    
    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content


# ─── Qwen Provider (OpenAI-compatible via DashScope) ─────────────────────────

async def _stream_qwen(
    messages: List[Dict],
    model: str,
    system_prompt: str,
) -> AsyncGenerator[str, None]:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(
        api_key=os.getenv("DASHSCOPE_API_KEY", ""),
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    )
    
    full_messages = [{"role": "system", "content": system_prompt}] + messages
    
    stream = await client.chat.completions.create(
        model=model,
        messages=full_messages,
        stream=True,
        max_tokens=4096,
        temperature=0.7,
    )
    
    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content


# ─── Unified Dispatch ─────────────────────────────────────────────────────────

async def stream_chat(
    messages: List[Dict],
    model: str = DEFAULT_MODEL,
    system_prompt: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """
    Main entry point. Routes to the correct provider and streams text chunks.
    Messages format: [{"role": "user"|"assistant", "content": "..."}]
    """
    provider = get_provider(model)
    sp = system_prompt or RAVAN_SYSTEM_PROMPT
    
    try:
        # Detect dummy keys and prevent network requests
        api_key = ""
        if provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY", "")
        elif provider == "anthropic":
            api_key = os.getenv("ANTHROPIC_API_KEY", "")
        elif provider == "gemini":
            api_key = os.getenv("GEMINI_API_KEY", "")
        elif provider == "deepseek":
            api_key = os.getenv("DEEPSEEK_API_KEY", "")
        elif provider == "qwen":
            api_key = os.getenv("DASHSCOPE_API_KEY", "")

        is_dummy_key = not api_key or "your-" in api_key.lower()

        if is_dummy_key:
            yield f"⚠️ **API Key Not Configured for `{model}`**.\n\n"
            yield f"It looks like you are using a placeholder API key. To enable real AI responses, please update the `{provider.upper()}_API_KEY` in your backend `.env` file.\n\n"
            yield "---\n*Mock Response:* Hello! I am Ravan AI. This is a simulated response because no valid API key was found."
            return

        if provider == "openai":
            async for chunk in _stream_openai(messages, model, sp):
                yield chunk
        elif provider == "anthropic":
            async for chunk in _stream_anthropic(messages, model, sp):
                yield chunk
        elif provider == "gemini":
            async for chunk in _stream_gemini(messages, model, sp):
                yield chunk
        elif provider == "deepseek":
            async for chunk in _stream_deepseek(messages, model, sp):
                yield chunk
        elif provider == "qwen":
            async for chunk in _stream_qwen(messages, model, sp):
                yield chunk
        else:
            yield f"[ERROR] Unknown provider: {provider}"
    except Exception as e:
        error_msg = str(e)
        # Surface friendly errors for missing API keys or connection resets
        if "api_key" in error_msg.lower() or "authentication" in error_msg.lower() or "unauthorized" in error_msg.lower():
            yield f"\n\n⚠️ **API Key Missing or Invalid** for `{model}`. Please configure `{provider.upper()}_API_KEY` in your `.env` file."
        elif "connection" in error_msg.lower() or "aborted" in error_msg.lower():
            yield f"\n\n⚠️ **Network Connection Error**: The connection to {provider} was aborted. If you are using a corporate proxy or firewall, it might be blocking the request. Error details: `{error_msg}`"
        else:
            yield f"\n\n⚠️ **Error from {provider}**: {error_msg}"


def estimate_tokens(text: str) -> int:
    """Rough token estimate: ~4 chars per token."""
    return max(1, len(text) // 4)


def get_models_grouped() -> List[Dict]:
    """Return models grouped by provider for the frontend selector."""
    groups: Dict[str, List] = {}
    for model_id, info in MODELS.items():
        group = info["group"]
        if group not in groups:
            groups[group] = []
        groups[group].append({
            "id": model_id,
            "label": info["label"],
            "tags": info["tags"],
            "provider": info["provider"],
        })
    return [{"group": g, "models": m} for g, m in groups.items()]
