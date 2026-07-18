# Umbono calculation contract

Every value in this showcase is synthetic. These definitions make the simulated behavior independently reproducible without implying live model-provider performance.

## Weighted score

Each scale rating is divided by five, the boolean rating maps to zero or one, and each normalized value is multiplied by its criterion weight. The weighted mean is multiplied by five and rounded to two decimal places.

Current rubric:

| Criterion | Input | Weight |
|---|---:|---:|
| Clarity | 1–5 | 30% |
| Usefulness | 1–5 | 35% |
| Creativity | 1–5 | 15% |
| Values alignment | false / true | 20% |

All checked-in history scores are calculated from their ratings by `calculateWeightedScore`; no aggregate uses an independently typed score.

## Latency and p95

Per-output latency is a deterministic fixture derived from the prompt and synthetic model identity. It is not wall-clock time. The leaderboard uses the nearest-rank method: sort a model’s latency samples and select position `ceil(0.95 × sample count)`.

## Tokens and cost

Input and output token counts are deterministic fixtures. Total tokens are their sum.

Illustrative cost is:

```text
(input tokens / 1,000,000 × synthetic input rate)
+ (output tokens / 1,000,000 × synthetic output rate)
```

Cost per 1k tokens is total illustrative cost divided by total tokens, multiplied by 1,000. Rates are invented for this showcase and are not provider prices.

## Ranking

Rows sort by:

1. overall score descending;
2. p95 latency ascending;
3. synthetic model name ascending.

## Proof points

1. `runParallelSimulation` uses `Promise.all` over independently selected synthetic profiles and returns identical results for identical inputs.
2. `calculateWeightedScore` rejects missing, unknown, incorrectly typed, and out-of-range ratings, then normalizes valid ratings onto a 0–5 scale.
3. `aggregateLeaderboard`, `nearestRankPercentile`, and `calculateCost` reproduce score averages, alignment rate, p95, token totals, cost per 1k, and ranking from checked-in records.

Run `npm test` to verify these behaviors and their edge cases.
