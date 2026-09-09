# SQL patch (review only) — legacy DepositLimitHistory player join

**Never apply from this folder. No production SQL Server edits.**

Legacy proc (read-only reference):

`data-platform-legacy-enterprisedatawarehouseunity/Stored Procedures/XtrlTransform.usp_etl_table_transform_1_dimension_DepositLimitHistory.sql`

## Relevant legacy shape (player / customer)

```sql
FROM #CategorisedRecords AS dlh
    LEFT JOIN EnterpriseDataWarehouseUnity.Sharp.Player AS p
        ON dlh.AccountNumber = p.AccountNumber
    LEFT JOIN EnterpriseDataMart.Dimension.Customer AS c
        ON dlh.AccountNumber = c.AccountNumber;
-- ...
UPDATE dlh
SET dlh.PlayerID = an.PlayerID
FROM EnterpriseDataStaging.Dimension.DepositLimitHistory AS dlh
    INNER JOIN EnterpriseDataMartUnity.Dimension.AccountNumber AS an
        ON an.CustomerID = dlh.CustomerID
WHERE dlh.PlayerID = -1;
```

Intent to mirror in Glue (see `glue_patch.md`):

- Keep limit history rows when player/customer is missing (**LEFT**, not INNER)
- Use a **sentinel** player id (`-1`) and optionally backfill later
- Populate `CustomerID` in legacy; Glue currently omits it — parity or sign-off required

No change proposed to the SQL Server procedure as the delivery vehicle for DE-9556.
