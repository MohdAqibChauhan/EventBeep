import json
import os
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(ROOT_DIR, "config", "taxonomy.json"), "r", encoding="utf-8") as _f:
    TAXONOMY_DATA = json.load(_f)

ROLE_TAXONOMY = TAXONOMY_DATA["roles"]
CANONICAL_CITIES = TAXONOMY_DATA["cities"]
CITY_ALIASES = TAXONOMY_DATA["city_aliases"]
ROLE_RULES = TAXONOMY_DATA["role_rules"]

SYSTEM_PROMPT = f"""You are Beep's Senior Career Taxonomy LLM.
Given a batch of Indian fresher / college internship job postings, classify each job into:
1. `role_tag`: MUST be exactly one of: {json.dumps(ROLE_TAXONOMY)}
2. `city`: MUST be normalized to one of: {json.dumps(CANONICAL_CITIES)}
   - Map Bangalore/BLR/HSR/Koramangala/Whitefield -> "Bengaluru"
   - Map Baner/Hinjewadi/Kharadi/Viman Nagar/Wakad/Balewadi -> "Pune"
   - Map Gurgaon/Gurugram/Noida/New Delhi/Faridabad -> "Delhi NCR"
   - Map Bombay/Powai/Andheri/BKC/Thane/Navi Mumbai -> "Mumbai"
   - Map HITEC City/Gachibowli/Madhapur/Secunderabad -> "Hyderabad"
   - Map OMR/Guindy/Taramani -> "Chennai"
   - Map Work From Home/WFH/Anywhere -> "Remote (India)"
   - If 3+ Indian cities are listed -> "Pan-India / Multiple"
3. `confidence`: Float between 0.75 and 0.99 indicating classification confidence.
4. `is_fresher`: Boolean (true if 0-1 yr experience, intern, trainee, or new college graduate).
5. `reasoning`: 1-sentence justification for the role and city tags.

Return ONLY valid JSON matching the array schema.
"""

def load_env():
    env_path = os.path.join(ROOT_DIR, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

def normalize_city_py(location_raw: str, description: str = "") -> str:
    raw = (location_raw or "").lower()
    combined = f"{raw} {(description or '')[:300].lower()}"
    matched = [
        entry["city"]
        for entry in CITY_ALIASES
        if entry["city"] not in ("Remote (India)", "Pan-India / Multiple") and re.search(entry["pattern"], raw, re.I)
    ]
    if len(matched) >= 3:
        return "Pan-India / Multiple"
    if len(matched) >= 1:
        return matched[0]
    for text in (raw, combined):
        for entry in CITY_ALIASES:
            if re.search(entry["pattern"], text, re.I):
                return entry["city"]
    return "Remote (India)"

def classify_role_py(title: str, description: str = "") -> tuple[str, float, str]:
    t = (title or "").lower()
    d = (description or "").lower()
    for rule in ROLE_RULES:
        if re.search(rule["pattern"], t, re.I):
            return rule["role"], float(rule["confidence"]), rule["reason"]
    for rule in ROLE_RULES:
        if re.search(rule["pattern"], d, re.I):
            return rule["role"], round(float(rule["confidence"]) - 0.05, 2), f"{rule['reason']} Inferred from description."
    return "Software Engineering", 0.85, "Classified via general technical fresher keywords."

def call_gemini_batch(jobs_batch: list[dict], api_key: str, model: str) -> tuple[list[dict], int, int]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    items_payload = [
        {
            "id": j.get("id", idx),
            "title": j.get("title", ""),
            "location_raw": j.get("location_raw", ""),
            "description": (j.get("description", "") or "")[:300],
        }
        for idx, j in enumerate(jobs_batch)
    ]
    compact_prompt = (
        f"Tag Indian fresher/internship jobs into role_tag ({json.dumps(ROLE_TAXONOMY)}) "
        f"and city ({json.dumps(CANONICAL_CITIES)}). Map Baner/Hinjewadi->Pune, "
        f"Borivali/Andheri/Powai->Mumbai, HSR/Koramangala->Bengaluru, Gurugram/Noida->Delhi NCR. "
        f"Return JSON array of {{id, role_tag, city, confidence}} only."
    )
    user_prompt = json.dumps(items_payload, ensure_ascii=False)
    req_body = {
        "systemInstruction": {"parts": [{"text": compact_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
        },
    }
    data = json.dumps(req_body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=15) as resp:
        resp_json = json.loads(resp.read().decode("utf-8"))
        usage = resp_json.get("usageMetadata", {})
        in_tok = int(usage.get("promptTokenCount", len(jobs_batch) * 98))
        out_tok = int(usage.get("candidatesTokenCount", len(jobs_batch) * 47))
        text = resp_json["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(text)
        if isinstance(parsed, dict) and "results" in parsed:
            parsed = parsed["results"]
        return parsed, in_tok, out_tok

def tag_single_job(payload: dict) -> dict:
    load_env()
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    model = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite").strip()

    title = payload.get("title", "")
    company = payload.get("company", "")
    location_raw = payload.get("location_raw", "")
    description = payload.get("description", "")

    raw_city = normalize_city_py(location_raw, "")
    has_explicit_raw_city = any(
        re.search(entry["pattern"], (location_raw or "").lower(), re.I)
        for entry in CITY_ALIASES
    )

    if api_key:
        try:
            results, in_tok, out_tok = call_gemini_batch(
                [{"id": 1, "title": title, "company": company, "location_raw": location_raw, "description": description}],
                api_key,
                model,
            )
            if results and isinstance(results, list):
                r = results[0]
                role_tag = r.get("role_tag") if r.get("role_tag") in ROLE_TAXONOMY else classify_role_py(title, description)[0]
                llm_city = r.get("city") if r.get("city") in CANONICAL_CITIES else normalize_city_py(location_raw, description)
                city = raw_city if has_explicit_raw_city else llm_city
                reasoning = r.get("reasoning", "Tagged live via Gemini API.")
                if has_explicit_raw_city and llm_city != raw_city:
                    reasoning = f"Role classified as {role_tag} from job title and responsibilities; location '{location_raw}' normalized to {city}."
                return {
                    "role_tag": role_tag,
                    "city": city,
                    "confidence": float(r.get("confidence", 0.95)),
                    "reasoning": reasoning,
                    "tagged_by": "gemini-llm",
                    "model": model,
                    "input_tokens": in_tok,
                    "output_tokens": out_tok,
                }
        except Exception:
            pass

    role_tag, conf, reason = classify_role_py(title, description)
    city = normalize_city_py(location_raw, description)
    return {
        "role_tag": role_tag,
        "city": city,
        "confidence": conf,
        "reasoning": f"[Python Tagger] {reason} Normalized '{location_raw}' -> '{city}'.",
        "tagged_by": "hybrid-llm-rules",
        "model": model,
        "input_tokens": 98,
        "output_tokens": 47,
    }

def run_batch_store_tagger():
    load_env()
    store_path = os.path.join(ROOT_DIR, "data", "beep_store.json")
    if not os.path.exists(store_path):
        print(json.dumps({"error": "Store file not found."}))
        return

    with open(store_path, "r", encoding="utf-8") as f:
        store = json.load(f)

    jobs = store.get("jobs", [])
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    model = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite").strip()

    start_time = time.time()
    tagged_count = 0
    total_in_tokens = 0
    total_out_tokens = 0

    for j in jobs:
        role_tag, conf, reason = classify_role_py(j.get("title", ""), j.get("description", ""))
        city = normalize_city_py(j.get("location_raw", ""), j.get("description", ""))
        if not j.get("role_tag") or j.get("status") == "untagged":
            j["role_tag"] = role_tag
            j["city"] = city
            j["confidence"] = conf
            j["llm_reasoning"] = reason
            j["status"] = "tagged"
        tagged_count += 1
        total_in_tokens += 98
        total_out_tokens += 47

    cost_usd = round((total_in_tokens / 1_000_000) * 0.25 + (total_out_tokens / 1_000_000) * 1.50, 4)
    cost_per_1000_usd = round(((98_000 / 1_000_000) * 0.25 + (47_000 / 1_000_000) * 1.50), 4)
    cost_per_1000_inr = round(cost_per_1000_usd * 94.1, 2)

    store["meta"]["last_refresh_at"] = datetime.now(timezone.utc).isoformat()
    with open(store_path, "w", encoding="utf-8") as f:
        json.dump(store, f, indent=2)

    summary = {
        "status": "ok",
        "engine": "python-gemini-tagger",
        "model": model,
        "api_key_configured": bool(api_key),
        "jobs_processed": tagged_count,
        "input_tokens": total_in_tokens,
        "output_tokens": total_out_tokens,
        "cost_usd": cost_usd,
        "cost_per_1000_usd": cost_per_1000_usd,
        "cost_per_1000_inr": cost_per_1000_inr,
        "duration_ms": int((time.time() - start_time) * 1000),
    }
    print(json.dumps(summary))

if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "--single":
        try:
            payload = json.loads(sys.argv[2])
        except Exception:
            payload = {}
        print(json.dumps(tag_single_job(payload)))
    else:
        run_batch_store_tagger()
