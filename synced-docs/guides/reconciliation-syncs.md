# Reconciliation syncs

Fire-and-forget destinations can confirm that they accepted a request, but
they cannot confirm that the requested work finished. Examples include a
webhook that starts a job and a GitHub Actions `workflow_dispatch` request.

This creates a gap for incremental syncs. Once the watermark advances, a row
is not selected again. If the downstream job never produces its expected
result, drt has no failure to retry:

- retry policy only repeats a destination request that reports a failure;
- the [Dead Letter Queue](dead-letter-queue.md) stores known delivery failures;
- neither one detects work that was accepted but never completed.

Rows can also go missing before a destination accepts them. For example, an
operator might deliberately skip a row error, data might arrive behind the
current watermark, or an existing row might become eligible after a filter or
allowlist changes. These misses do not necessarily produce a stored failure
either.

A **reconciliation sync**, also called a sweep, closes that gap. Run a second
`mode: full` sync on a slower schedule. Its model compares the rows that
should have landed with evidence of what actually landed, then selects only
the missing rows for another attempt. The comparison recovers a missing row
regardless of whether the original cause was a skipped error, late data, a
classification change, or downstream work that never finished.

## The pattern

The model is an anti-join between the expected and completed sets:

```sql
SELECT
    expected.id,
    expected.env,
    expected.version
FROM `your_project.operations.approved_deployments` AS expected
LEFT JOIN `your_project.operations.completed_deployments` AS completed
    ON completed.deployment_id = expected.id
WHERE completed.deployment_id IS NULL
  AND expected.approved_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
```

Configure the sweep as a full sync so it reevaluates the comparison on every
run:

```yaml
sync:
  mode: full
  on_error: fail
```

Schedule this sync independently from the fast incremental path—for example,
run the incremental sync every few minutes and the reconciliation sync once a
day.

## Requirements

Use this pattern only when all of these are true:

1. **There is reliable landing evidence.** The completed table or status view
   must prove that the downstream work finished, not only that it started.
2. **Both sides share a stable key.** The anti-join needs a key such as a
   deployment or event ID.
3. **Re-dispatch is safe.** A row can be selected again before its first
   attempt finishes. The downstream workflow must deduplicate by the stable
   key or otherwise be idempotent.
4. **The query has a bounded lookback.** Restrict the expected set to a useful
   recovery window so a configuration change cannot dispatch all historical
   rows at once.

Keep `on_error: fail` on the sweep. The reconciliation run is the safety net,
so a delivery error should fail the run and alert its operator instead of
silently skipping another row.

## How it works with the DLQ

The two mechanisms cover different gaps:

| Mechanism | Recovers |
|---|---|
| Retry policy | A transient error reported during the current run |
| Dead Letter Queue | A delivery failure that drt observed and stored |
| Reconciliation sync | Expected downstream work that is still missing |

Use the DLQ and reconciliation together when the destination can both reject
requests and accept requests whose downstream work might later fail.

See the
[`bigquery_to_github_actions`](../../examples/bigquery_to_github_actions/)
example for a complete incremental-dispatch and reconciliation pair.
