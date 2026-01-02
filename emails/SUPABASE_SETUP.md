# Supabase Email Templates Setup

Om de Lynqit email templates te gebruiken in Supabase, moet je ze uploaden in het Supabase Dashboard.

## Stappen

1. **Ga naar Supabase Dashboard**
   - Open je Supabase project
   - Ga naar **Authentication** → **Email Templates**

2. **Upload de Confirmation Email Template**
   - Selecteer **"Confirm signup"** template
   - Kopieer de inhoud van `emails/confirm-signup.html` (voor Engels) of `emails/confirm-signup-nl.html` (voor Nederlands)
   - Plak de HTML in het template veld
   - **BELANGRIJK**: Zorg dat je de variabele `{{ .ConfirmationURL }}` behoudt - dit wordt automatisch vervangen door Supabase

3. **Controleer de Template Syntax**
   - Gebruik **gewoon HTML**, geen JSX/React syntax
   - Gebruik `class` in plaats van `className`
   - Gebruik inline styles voor email client compatibiliteit
   - Gebruik `{{ .ConfirmationURL }}` voor de confirmation link (Supabase variabele)

4. **Test de Template**
   - Maak een test account aan
   - Controleer of de email correct wordt verzonden
   - Controleer of de confirmation link werkt

## Template Variabelen

Supabase gebruikt de volgende variabelen:
- `{{ .ConfirmationURL }}` - De confirmation link URL
- `{{ .Email }}` - Het email adres van de gebruiker
- `{{ .SiteURL }}` - De site URL

## Belangrijke Opmerkingen

- **Geen JSX syntax**: Gebruik gewoon HTML met `class` in plaats van `className`
- **Inline styles**: Email clients ondersteunen geen externe stylesheets, gebruik inline styles
- **Table-based layout**: Voor betere compatibiliteit met email clients
- **Test in meerdere clients**: Test de email in Gmail, Outlook, Apple Mail, etc.

## Problemen Oplossen

Als je de error krijgt: `"<" in attribute name: "className"`, betekent dit dat er JSX syntax in de template staat. Zorg dat je:
- `className` vervangt door `class`
- Geen React componenten gebruikt
- Alleen gewone HTML gebruikt

