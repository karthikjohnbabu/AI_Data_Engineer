# SCD2 two-row sign-off

Do not sign off an SCD2 change until the same business key has two rows: one expired (`current_flag=N`) and one current (`current_flag=Y`).

Parent and bill_payer business keys are composite with `old_famly_child_id`.
