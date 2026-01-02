# Supabase Email Template Fix

Als je email niet wordt weergegeven zoals de template, controleer het volgende:

## 1. Template Correct Uploaden

In Supabase Dashboard:
- Ga naar **Authentication** → **Email Templates**
- Selecteer **"Confirm signup"** template
- **VERWIJDER ALLE BESTAANDE INHOUD**
- Kopieer de **VOLLEDIGE** HTML van `emails/confirm-signup.html`
- Plak deze in het template veld
- **Klik op "Save"**

## 2. Belangrijke Variabelen

Supabase gebruikt Go template syntax. Zorg dat deze variabelen correct zijn:
- `{{ .ConfirmationURL }}` - De confirmation link (MUST BE PRESENT)
- `{{ .Email }}` - Het email adres (optioneel)
- `{{ .SiteURL }}` - De site URL (optioneel)

## 3. Veelvoorkomende Problemen

### Probleem: Email ziet eruit als standaard Supabase email
**Oplossing**: 
- Controleer of de template correct is opgeslagen
- Controleer de Auth Logs in Supabase voor errors
- Zorg dat er geen syntax errors zijn in de template

### Probleem: Links werken niet
**Oplossing**:
- Zorg dat `{{ .ConfirmationURL }}` exact zo staat (met punten en hoofdletters)
- Test de link in de email

### Probleem: Styling wordt niet toegepast
**Oplossing**:
- Gebruik inline styles (zoals in de template)
- Vermijd externe stylesheets
- Test in verschillende email clients

## 4. Testen

1. Maak een test account aan
2. Controleer de email die binnenkomt
3. Als het nog steeds de standaard template is:
   - Controleer Auth Logs voor errors
   - Verwijder en upload de template opnieuw
   - Wacht een paar minuten (caching)

## 5. Template Validatie

De template moet:
- ✅ Volledige HTML structuur hebben (DOCTYPE, html, head, body)
- ✅ Inline styles gebruiken
- ✅ `{{ .ConfirmationURL }}` bevatten
- ✅ Geen JSX/React syntax bevatten
- ✅ Table-based layout gebruiken voor compatibiliteit

