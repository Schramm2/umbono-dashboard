import test from 'node:test'
import assert from 'node:assert/strict'

import {
  aggregateLeaderboard,
  calculateCost,
  calculateWeightedScore,
  nearestRankPercentile,
  runParallelSimulation,
  syntheticHistory,
  type EvaluationRecord,
} from '../lib/evaluation'

test('weighted scoring normalizes criterion weights onto a five-point scale', () => {
  assert.equal(
    calculateWeightedScore({
      clarity: 5,
      usefulness: 4,
      creativity: 3,
      values_alignment: true,
    }),
    4.35,
  )
  assert.equal(
    calculateWeightedScore({
      clarity: 5,
      usefulness: 5,
      creativity: 5,
      values_alignment: true,
    }),
    5,
  )
})

test('weighted scoring rejects incomplete, unknown, and out-of-range ratings', () => {
  assert.throws(
    () => calculateWeightedScore({ clarity: 5 }),
    /Missing rating/,
  )
  assert.throws(
    () => calculateWeightedScore({
      clarity: 5,
      usefulness: 4,
      creativity: 3,
      values_alignment: true,
      surprise: 5,
    }),
    /Unknown criterion/,
  )
  assert.throws(
    () => calculateWeightedScore({
      clarity: 6,
      usefulness: 4,
      creativity: 3,
      values_alignment: true,
    }),
    /1 to 5/,
  )
})

test('token cost uses separate input and output rates', () => {
  assert.equal(calculateCost(1_000, 500, 2, 8), 0.006)
  assert.throws(() => calculateCost(-1, 10, 2, 8), /non-negative/)
})

test('p95 uses the documented nearest-rank method', () => {
  assert.equal(nearestRankPercentile([500, 100, 400, 200, 300], 0.95), 500)
  assert.equal(nearestRankPercentile([100, 200], 0.95), 200)
  assert.equal(nearestRankPercentile([], 0.95), 0)
  assert.throws(() => nearestRankPercentile([100], 1.1), /at most 1/)
})

test('leaderboard aggregates score, tokens, cost, p95, and deterministic ranking', () => {
  const records: EvaluationRecord[] = [
    {
      id: 'a1',
      modelId: 'cedar-reasoner',
      score: 4,
      ratings: { clarity: 4, usefulness: 4, creativity: 4, values_alignment: true },
      latencyMs: 100,
      inputTokens: 100,
      outputTokens: 100,
      costUsd: 0.002,
    },
    {
      id: 'a2',
      modelId: 'cedar-reasoner',
      score: 5,
      ratings: { clarity: 5, usefulness: 5, creativity: 5, values_alignment: false },
      latencyMs: 200,
      inputTokens: 100,
      outputTokens: 100,
      costUsd: 0.002,
    },
    {
      id: 'b1',
      modelId: 'baobab-balanced',
      score: 3,
      ratings: { clarity: 3, usefulness: 3, creativity: 3, values_alignment: true },
      latencyMs: 80,
      inputTokens: 50,
      outputTokens: 50,
      costUsd: 0.0005,
    },
  ]

  const rows = aggregateLeaderboard(records)
  const cedar = rows.find((row) => row.modelId === 'cedar-reasoner')

  assert.equal(rows[0].modelId, 'cedar-reasoner')
  assert.equal(cedar?.overall, 4.5)
  assert.equal(cedar?.valuesAlignmentPct, 0.5)
  assert.equal(cedar?.p95LatencyMs, 200)
  assert.equal(cedar?.totalTokens, 400)
  assert.equal(cedar?.costPer1k, 0.01)
})

test('synthetic history derives every score from its checked-in ratings', () => {
  for (const record of syntheticHistory) {
    assert.equal(record.score, calculateWeightedScore(record.ratings))
  }

  const emptyRows = aggregateLeaderboard([])
  assert.ok(emptyRows.every((row) => row.runs === 0 && row.costPer1k === 0))
})

test('parallel simulation is deterministic and performs no external work', async () => {
  const first = await runParallelSimulation(
    'community-guidance',
    'community-policy',
    ['cedar-reasoner', 'marula-fast'],
  )
  const second = await runParallelSimulation(
    'community-guidance',
    'community-policy',
    ['cedar-reasoner', 'marula-fast'],
  )

  assert.deepEqual(second, first)
  assert.equal(first.simulated, true)
  assert.equal(first.outputs.length, 2)
  assert.ok(first.outputs.every((output) => output.simulated))
})
