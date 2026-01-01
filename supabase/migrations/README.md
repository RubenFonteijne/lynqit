# Database Migrations

Dit document legt uit hoe je database wijzigingen kunt maken voor Lynqit.

## Structuur

Migraties worden opgeslagen in `supabase/migrations/` en genummerd:
- `001_initial_schema.sql` - Basis database structuur
- `002_indexes.sql` - Database indexes voor performance
- `003_rls_policies.sql` - Row Level Security policies
- `004_*.sql` - Toekomstige wijzigingen

## Nieuwe velden toevoegen aan lynqit_pages

Als je een nieuw veld wilt toevoegen aan de `lynqit_pages` tabel:

### Stap 1: Maak een nieuwe migratie

Maak een nieuw bestand, bijvoorbeeld `004_add_new_field.sql`:

```sql
-- Add new field to lynqit_pages table
ALTER TABLE lynqit_pages 
ADD COLUMN IF NOT EXISTS new_field_name TEXT;

-- Or for JSONB fields:
ALTER TABLE lynqit_pages 
ADD COLUMN IF NOT EXISTS new_json_field JSONB DEFAULT '{}'::jsonb;

-- Or for required fields with default:
ALTER TABLE lynqit_pages 
ADD COLUMN IF NOT EXISTS new_required_field TEXT NOT NULL DEFAULT 'default_value';
```

### Stap 2: Update TypeScript interface

Update `lib/lynqit-pages.ts` - voeg het veld toe aan de `LynqitPage` interface:

```typescript
export interface LynqitPage {
  // ... existing fields
  newFieldName?: string;
  newJsonField?: SomeType;
}
```

### Stap 3: Update mapping functies

Update `mapDbPageToPage` en `updatePage` in `lib/lynqit-pages.ts`:

```typescript
function mapDbPageToPage(dbPage: any): LynqitPage {
  return {
    // ... existing mappings
    newFieldName: dbPage.new_field_name,
    newJsonField: dbPage.new_json_field,
  };
}

// In updatePage function:
if (allowedUpdates.newFieldName !== undefined) {
  updateData.new_field_name = allowedUpdates.newFieldName;
}
```

### Stap 4: Run de migratie in Supabase

1. Ga naar je Supabase dashboard
2. Open de SQL Editor
3. Kopieer en plak de migratie SQL
4. Run de query

## Nieuwe tabel toevoegen

Voor een nieuwe tabel, maak een migratie bestand:

```sql
-- Example: New table
CREATE TABLE IF NOT EXISTS new_table_name (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES lynqit_pages(id) ON DELETE CASCADE,
  field1 TEXT,
  field2 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes if needed
CREATE INDEX IF NOT EXISTS idx_new_table_page_id ON new_table_name(page_id);

-- Add RLS policies if needed
ALTER TABLE new_table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
  ON new_table_name FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM lynqit_pages 
      WHERE user_id IN (
        SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      )
    )
  );
```

## Bestaande velden wijzigen

Voor het wijzigen van bestaande velden:

```sql
-- Change column type
ALTER TABLE lynqit_pages 
ALTER COLUMN existing_field TYPE TEXT;

-- Add constraint
ALTER TABLE lynqit_pages 
ADD CONSTRAINT check_field CHECK (field_name IN ('value1', 'value2'));

-- Rename column
ALTER TABLE lynqit_pages 
RENAME COLUMN old_name TO new_name;
```

## Velden verwijderen

⚠️ **Let op**: Verwijder alleen velden als je zeker weet dat ze niet meer nodig zijn!

```sql
-- Remove column
ALTER TABLE lynqit_pages 
DROP COLUMN IF EXISTS field_to_remove;
```

## Best practices

1. **Gebruik altijd `IF NOT EXISTS` of `IF EXISTS`** om errors te voorkomen bij herhaalde runs
2. **Test eerst op een development database** voordat je naar production gaat
3. **Maak backups** voordat je grote wijzigingen maakt
4. **Documenteer wijzigingen** in commit messages
5. **Update TypeScript interfaces** tegelijk met database wijzigingen
6. **Gebruik migrations** in plaats van directe SQL wijzigingen

## Voorbeeld: Nieuw veld toevoegen

Stel je wilt een `description` veld toevoegen aan de lynqit_pages:

1. **Migratie** (`004_add_description.sql`):
```sql
ALTER TABLE lynqit_pages 
ADD COLUMN IF NOT EXISTS description TEXT;
```

2. **TypeScript interface** (`lib/lynqit-pages.ts`):
```typescript
export interface LynqitPage {
  // ... existing
  description?: string;
}
```

3. **Mapping functie**:
```typescript
function mapDbPageToPage(dbPage: any): LynqitPage {
  return {
    // ... existing
    description: dbPage.description,
  };
}
```

4. **Update functie**:
```typescript
if (allowedUpdates.description !== undefined) {
  updateData.description = allowedUpdates.description;
}
```

5. **Run in Supabase SQL Editor**

## Hulp nodig?

Als je een nieuwe veld of tabel wilt toevoegen, vraag het gewoon en ik maak de complete migratie voor je!

