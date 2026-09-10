# Curated before famly

Famly reverse merges on top of curated. Run `{env}_midln_{domain}` (curated → analytics) before `{env}_midln_famly_{domain}`.

Rebuild from curated alone drops `new_famly_*` ids — restore reverse from `midlothian/famly/{domain}/` and re-run the famly Step Function.
