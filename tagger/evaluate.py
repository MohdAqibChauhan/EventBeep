import json
import os
from collections import Counter


def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    store_path = os.path.join(root_dir, "data", "beep_store.json")
    if not os.path.exists(store_path):
        print("Error: data/beep_store.json not found.")
        return

    with open(store_path, "r", encoding="utf-8") as f:
        store = json.load(f)

    samples = store.get("eval_50", [])
    total = len(samples) or 1
    role_ok = sum(1 for s in samples if s.get("role_correct"))
    city_ok = sum(1 for s in samples if s.get("city_correct"))
    both_ok = sum(1 for s in samples if s.get("both_correct"))

    confusions = [
        f"Sample #{s['sample_no']} ({s['company']} - {s['title']}): LLM=({s['llm_role']}, {s['llm_city']}) vs Human=({s['human_role']}, {s['human_city']})"
        for s in samples
        if not s.get("both_correct")
    ]

    role_dist = Counter(s.get("human_role") for s in samples)

    report = {
        "total_hand_checked": len(samples),
        "role_accuracy_pct": round((role_ok / total) * 100, 1),
        "city_accuracy_pct": round((city_ok / total) * 100, 1),
        "joint_accuracy_pct": round((both_ok / total) * 100, 1),
        "role_correct": f"{role_ok}/{len(samples)}",
        "city_correct": f"{city_ok}/{len(samples)}",
        "joint_correct": f"{both_ok}/{len(samples)}",
        "cost_per_1000_posts_usd": 0.0333,
        "cost_per_1000_posts_inr": 2.81,
        "actual_spend_inr": 0.0,
        "role_distribution_in_50_sample": dict(role_dist),
        "discrepancies_found": confusions,
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
