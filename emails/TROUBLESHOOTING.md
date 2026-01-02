# Email Template Troubleshooting

Als je email niet wordt weergegeven zoals de template, volg deze stappen:

## Stap 1: Controleer of de Template Correct is Geüpload

1. Ga naar **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Selecteer **"Confirm signup"** template
3. Controleer of de volledige HTML aanwezig is (van `<!DOCTYPE html>` tot `</html>`)
4. **VERWIJDER ALLE BESTAANDE INHOUD** voordat je de nieuwe template plakt
5. Kopieer de **VOLLEDIGE** inhoud van `emails/confirm-signup.html`
6. Plak deze in het template veld
7. **Klik op "Save"** (niet alleen sluiten!)

## Stap 2: Controleer Auth Logs

1. Ga naar **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Zoek naar errors rond de tijd dat je een test email hebt verzonden
3. Als er errors zijn, corrigeer deze eerst

## Stap 3: Test Opnieuw

1. Maak een **nieuw test account** aan (niet een bestaand account)
2. Wacht 1-2 minuten (Supabase kan caching hebben)
3. Controleer de email opnieuw

## Stap 4: Controleer Template Variabelen

Zorg dat deze exact zo staan (met punten en hoofdletters):
- `{{ .ConfirmationURL }}` - NIET `{{.ConfirmationURL}}` of `{{ConfirmationURL}}`
- De variabele moet tussen dubbele accolades staan met een spatie en punt

## Stap 5: Veelvoorkomende Problemen

### Email ziet eruit als standaard Supabase email
**Oorzaak**: Template is niet correct opgeslagen of er is een syntax error
**Oplossing**: 
- Verwijder alle inhoud en plak opnieuw
- Controleer Auth Logs voor errors
- Zorg dat je op "Save" klikt

### Links werken niet
**Oorzaak**: Variabele syntax is incorrect
**Oplossing**: 
- Zorg dat `{{ .ConfirmationURL }}` exact zo staat
- Test de link in de email

### Styling wordt niet toegepast
**Oorzaak**: Email client ondersteunt bepaalde CSS niet
**Oplossing**: 
- De template gebruikt al inline styles (correct)
- Test in verschillende email clients

## Stap 6: Als Niets Werkt

1. **Reset de template**:
   - Verwijder alle inhoud
   - Plak deze minimale test template:
   ```html
   <!DOCTYPE html>
   <html>
   <body style="background-color: #000000; color: #ffffff; padding: 20px;">
       <h1>Test Email</h1>
       <p>Click here: <a href="{{ .ConfirmationURL }}">Confirm</a></p>
   </body>
   </html>
   ```
   - Sla op en test
   - Als dit werkt, voeg dan langzaam de styling toe

2. **Contact Supabase Support** als het probleem aanhoudt

## Belangrijke Checklist

- [ ] Template is volledig gekopieerd (van DOCTYPE tot </html>)
- [ ] Alle bestaande inhoud is verwijderd voordat je plakt
- [ ] "Save" is geklikt (niet alleen sluiten)
- [ ] `{{ .ConfirmationURL }}` staat exact zo (met spatie en punt)
- [ ] Geen JSX/React syntax (geen `className`, alleen `class`)
- [ ] Auth Logs zijn gecontroleerd voor errors
- [ ] Nieuwe test account is aangemaakt (niet bestaand account)

