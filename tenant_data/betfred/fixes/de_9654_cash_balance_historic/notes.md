# DE-9654 — notes

## Two solutions

| File | What |
|---|---|
| `proposed_solution.html` | Chooser |
| `proposed_solution_1.html` | **Year-by-year to RS** (~5 loops) |
| `proposed_solution_2.html` | One-shot extract + one MERGE |

## Solution 1 order (locked)

For each year (2024 proof first → 2021 → 2022 → 2023 → 2025H1):

1. SQL→S3  
2. S3→Iceberg  
3. Iceberg→RS MERGE **that year only**  
4. Next year  

Camera **after** all five years.

Do **not** extract all years then one giant MERGE (that’s S2-shaped).

## Windows (Jul cutoff)

| Year | Window | ~rows |
|---|---|---|
| 2024 | 2024-01-01 → 2025-01-01 | ~20.7M (proof) |
| 2021 | 2021-03-01 → 2022-01-01 | ~0.1M |
| 2022 | 2022-01-01 → 2023-01-01 | small |
| 2023 | 2023-01-01 → 2024-01-01 | ~6.9M |
| 2025H1 | 2025-01-01 → 2025-07-01 | ~14.9M |

Always `num_partitions=1` on extract.
