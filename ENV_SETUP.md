# Environment Variables Setup

Deze applicatie heeft de volgende environment variables nodig om te werken:

## Vereiste Environment Variables

### Supabase (Verplicht)

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Je Supabase project URL
   - Vind je in Supabase Dashboard → Settings → API → Project URL
   - Voorbeeld: `https://zafemwpgbkciuozaxtgs.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Je Supabase anon/public key
   - Vind je in Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
   - Dit is de publieke key die veilig in de browser kan worden gebruikt

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Je Supabase service role key (GEHEIM - nooit in de browser!)
   - Vind je in Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
   - Deze key bypasses Row Level Security (RLS) - alleen gebruiken in server-side code

4. **Supabase Site URL (BELANGRIJK voor email confirmaties!)**
   - Ga naar Supabase Dashboard → Authentication → URL Configuration
   - Zet **Site URL** op je productie URL: `https://lynqit.io`
   - Zet **Redirect URLs** op: `https://lynqit.io/account-confirmed`, `https://lynqit.io/account-bevestigd`, `https://lynqit.io/reset-password`
   - **BELANGRIJK:** Als dit niet is ingesteld, worden email confirmatie links naar localhost gestuurd!

5. **Supabase Storage Bucket (BELANGRIJK voor afbeeldingen!)**
   - Ga naar Supabase Dashboard → Storage
   - Maak een nieuwe bucket aan met de naam: `lynqit-uploads`
   - Zet **Public bucket** aan (zodat afbeeldingen publiek toegankelijk zijn)
   - **BELANGRIJK:** Zonder deze bucket worden afbeeldingen niet opgeslagen en kunnen ze niet worden weergegeven!

### Base URL (Verplicht voor productie)

5. **NEXT_PUBLIC_BASE_URL**
   - Je publieke website URL (zonder trailing slash)
   - Voor productie: `https://lynqit.io` (of je eigen domain)
   - Voor development: `http://localhost:3000` (standaard)
   - Wordt gebruikt voor redirect URLs na betalingen en password reset emails
   - **BELANGRIJK:** Zonder deze variabele worden gebruikers na betaling doorgestuurd naar localhost!

### Mollie (Optioneel - voor betalingen)

6. **MOLLIE_API_KEY** (optioneel)
   - Je Mollie API key voor betalingen
   - Kan ook worden ingesteld via de admin interface

## Setup op Productie Server

### Optie 1: Via .env.local bestand

Maak een `.env.local` bestand in de root van je project met:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://jouw-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key
SUPABASE_SERVICE_ROLE_KEY=jouw-service-role-key
NEXT_PUBLIC_BASE_URL=https://lynqit.io
```

**Let op:** Dit bestand staat in `.gitignore` en wordt niet naar Git gepusht.

### Optie 2: Via Server Environment Variables

Als je hosting provider environment variables ondersteunt (zoals Vercel, Railway, etc.):

1. Ga naar je hosting dashboard
2. Zoek naar "Environment Variables" of "Config"
3. Voeg de volgende variabelen toe:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_BASE_URL`

### Optie 3: Via Shell/SSH

Als je via SSH op je server werkt:

```bash
# Exporteer de variabelen in je shell
export NEXT_PUBLIC_SUPABASE_URL="https://jouw-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="jouw-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="jouw-service-role-key"
export NEXT_PUBLIC_BASE_URL="https://lynqit.io"

# Of voeg ze toe aan je ~/.bashrc of ~/.zshrc voor permanente configuratie
echo 'export NEXT_PUBLIC_SUPABASE_URL="https://jouw-project.supabase.co"' >> ~/.bashrc
echo 'export NEXT_PUBLIC_SUPABASE_ANON_KEY="jouw-anon-key"' >> ~/.bashrc
echo 'export SUPABASE_SERVICE_ROLE_KEY="jouw-service-role-key"' >> ~/.bashrc
echo 'export NEXT_PUBLIC_BASE_URL="https://lynqit.io"' >> ~/.bashrc
```

## Verificatie

Na het instellen van de environment variables:

1. **Herstart je Next.js server** (belangrijk!)
2. Controleer of de foutmelding weg is
3. Test of je kunt inloggen en pagina's kunt bekijken

## Troubleshooting

### Email confirmatie links gaan naar localhost

Dit betekent dat de **Site URL** in Supabase Dashboard niet correct is ingesteld.

**Oplossing:**
1. Ga naar Supabase Dashboard → Authentication → URL Configuration
2. Zet **Site URL** op `https://lynqit.io` (of je productie URL)
3. Voeg toe aan **Redirect URLs**:
   - `https://lynqit.io/account-confirmed`
   - `https://lynqit.io/account-bevestigd`
   - `https://lynqit.io/reset-password`
4. Zorg ook dat `NEXT_PUBLIC_BASE_URL` is ingesteld op je productie server
5. Herstart je Next.js server
6. Test opnieuw een registratie

### Gebruikers worden doorgestuurd naar localhost na betaling

Dit betekent dat `NEXT_PUBLIC_BASE_URL` niet is ingesteld of nog op localhost staat. 

**Oplossing:**
1. Zet `NEXT_PUBLIC_BASE_URL` op je productie server naar je live URL (bijv. `https://lynqit.io`)
2. Herstart je Next.js server
3. Test opnieuw een betaling

### Foutmelding: "Missing Supabase client environment variables"

Dit betekent dat de environment variables niet correct zijn ingesteld. Controleer:

1. Zijn de variabelen correct gespeld? (let op hoofdletters/kleine letters)
2. Zijn de variabelen ingesteld op de productie server?
3. Is de Next.js server herstart na het instellen van de variabelen?
4. Gebruik je `NEXT_PUBLIC_` prefix voor client-side variabelen?

### Afbeeldingen worden niet geladen op productie

Dit betekent dat de Supabase Storage bucket niet is aangemaakt of niet correct is geconfigureerd.

**Oplossing:**
1. Ga naar Supabase Dashboard → Storage
2. Klik op **"New bucket"**
3. Maak een bucket aan met de naam: `lynqit-uploads`
4. Zet **Public bucket** aan (zodat afbeeldingen publiek toegankelijk zijn)
5. Klik op **"Create bucket"**
6. Test opnieuw het uploaden van een afbeelding

**Belangrijk:** Zonder deze bucket worden afbeeldingen niet opgeslagen en kunnen ze niet worden weergegeven op de productie site.

### Waar vind ik mijn Supabase keys?

1. Ga naar [Supabase Dashboard](https://app.supabase.com)
2. Selecteer je project
3. Ga naar **Settings** → **API**
4. Hier vind je:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API keys** → `service_role` `secret` → `SUPABASE_SERVICE_ROLE_KEY`

## Veiligheid

⚠️ **BELANGRIJK:**
- De `SUPABASE_SERVICE_ROLE_KEY` is GEHEIM en mag NOOIT in de browser worden gebruikt
- Deze key heeft volledige toegang tot je database en bypasses alle security policies
- Gebruik deze alleen in server-side code (API routes, server components)
- Zet deze key NOOIT in client-side code of in `NEXT_PUBLIC_*` variabelen

