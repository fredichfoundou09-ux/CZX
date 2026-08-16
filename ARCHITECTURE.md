# Architecture

SENTINELLES NUMERIQUES conserve le frontend React/Vite existant et ajoute une couche Supabase-first.

```text
React + TypeScript + Vite
        |
        +-- Supabase Auth
        +-- Supabase Data API / PostgreSQL
        +-- Supabase Storage
        +-- Supabase Realtime
```

Le store local reste un fallback de transition lorsque les variables `VITE_SUPABASE_*` ne sont pas présentes. En production, Supabase Auth et PostgreSQL deviennent la source de vérité. Les pages migrent domaine par domaine via `src/lib/supabase/*`.
