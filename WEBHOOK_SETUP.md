# Webhook Setup voor Mollie

Mollie kan geen webhooks sturen naar `localhost` URLs. Voor development moet je een tunneling service gebruiken.

## Optie 1: ngrok (Aanbevolen)

1. Installeer ngrok: https://ngrok.com/download
2. Start je Next.js development server: `npm run dev`
3. In een nieuwe terminal, start ngrok:
   ```bash
   ngrok http 3000
   ```
4. Kopieer de HTTPS URL (bijvoorbeeld: `https://abc123.ngrok.io`)
5. Stel `NEXT_PUBLIC_BASE_URL` in je `.env.local` bestand:
   ```
   NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
   ```
6. Herstart je Next.js server

## Optie 2: Cloudflare Tunnel

1. Installeer Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
2. Start je Next.js development server: `npm run dev`
3. In een nieuwe terminal, start de tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
4. Kopieer de HTTPS URL en stel `NEXT_PUBLIC_BASE_URL` in

## Optie 3: Voor productie

Voor productie moet `NEXT_PUBLIC_BASE_URL` je publieke domain zijn:
```
NEXT_PUBLIC_BASE_URL=https://lynqit.nl
```

## Let op

- De webhook URL wordt automatisch weggelaten als `NEXT_PUBLIC_BASE_URL` localhost bevat
- Zonder webhook URL kun je betalingen nog steeds testen, maar de status updates komen niet automatisch
- Voor volledige functionaliteit gebruik je een tunneling service tijdens development

