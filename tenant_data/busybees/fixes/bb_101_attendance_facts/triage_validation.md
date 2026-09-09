# Triage — BB-101

Source pipe: SFTP parent portal → bronze → dbt → warehouse.
Issue: late files caused under-count on Mondays. Fix: watermark + catch-up window.
