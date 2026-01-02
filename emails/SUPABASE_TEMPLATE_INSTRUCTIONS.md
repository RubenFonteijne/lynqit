# Supabase Email Template - Stap voor Stap Instructies

Als je de standaard Supabase email krijgt in plaats van je custom template, volg deze stappen EXACT:

## Stap 1: Open Supabase Dashboard
1. Ga naar je Supabase project
2. Klik op **Authentication** in het linker menu
3. Klik op **Email Templates** in het submenu

## Stap 2: Selecteer de Correcte Template
1. Klik op **"Confirm signup"** template (niet "Magic Link" of andere)

## Stap 3: Verwijder ALLE Bestaande Inhoud
1. **BELANGRIJK**: Selecteer ALLES in het "Body" veld (Ctrl+A / Cmd+A)
2. **VERWIJDER** alles (Delete of Backspace)
3. Zorg dat het veld volledig leeg is

## Stap 4: Kopieer de Template
1. Open het bestand `emails/confirm-signup-simple.html` (of `confirm-signup.html`)
2. Selecteer **ALLES** (van regel 1 tot de laatste regel)
3. Kopieer (Ctrl+C / Cmd+C)

## Stap 5: Plak in Supabase
1. Klik in het lege "Body" veld in Supabase
2. Plak de template (Ctrl+V / Cmd+V)
3. **Controleer** dat `{{ .ConfirmationURL }}` aanwezig is (met spatie en punt!)

## Stap 6: Stel Subject In
1. In het **Subject** veld (bovenaan, niet in de Body):
   - Zet: `Confirm Your Signup for Lynqit`
   - Of: `Bevestig je Lynqit account` (voor Nederlands)

## Stap 7: Sla Op
1. **Klik op "Save changes"** (groene knop rechtsonder)
2. Wacht tot je een bevestiging ziet dat het is opgeslagen

## Stap 8: Test
1. Wacht 2-3 minuten (Supabase caching)
2. Maak een **NIEUW** test account aan
3. Controleer de email

## Problemen Oplossen

### Als je nog steeds de standaard email krijgt:

1. **Controleer Auth Logs**:
   - Ga naar **Logs** → **Auth Logs**
   - Zoek naar errors rond de tijd van de test email
   - Als er errors zijn, corrigeer deze eerst

2. **Probeer de Vereenvoudigde Template**:
   - Gebruik `confirm-signup-simple.html` in plaats van `confirm-signup.html`
   - Deze heeft minder complexe styling en werkt gegarandeerd

3. **Reset de Template**:
   - Verwijder alles opnieuw
   - Plak deze minimale test template:
   ```html
   <!DOCTYPE html>
   <html>
   <body style="background-color: #000000; color: #ffffff; padding: 20px;">
       <h1>Lynqit Email Test</h1>
       <p>Click: <a href="{{ .ConfirmationURL }}" style="color: #00F0EE;">Confirm</a></p>
   </body>
   </html>
   ```
   - Sla op en test
   - Als dit werkt, voeg dan langzaam styling toe

4. **Controleer Variabelen**:
   - Zorg dat `{{ .ConfirmationURL }}` exact zo staat
   - Geen `{{.ConfirmationURL}}` (zonder spatie)
   - Geen `{{ConfirmationURL}}` (zonder punt)

## Belangrijke Checklist

- [ ] Template is volledig gekopieerd (van `<!DOCTYPE html>` tot `</html>`)
- [ ] Alle bestaande inhoud is verwijderd voordat je plakt
- [ ] `{{ .ConfirmationURL }}` staat exact zo (met spatie en punt)
- [ ] Subject line is ingesteld (niet alleen in HTML title)
- [ ] "Save changes" is geklikt (niet alleen sluiten)
- [ ] Geen JSX/React syntax (geen `className`, alleen `class`)
- [ ] Nieuwe test account is aangemaakt (niet bestaand account)
- [ ] 2-3 minuten gewacht na opslaan (caching)

