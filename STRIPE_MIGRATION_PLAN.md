# Stripe Migration Plan

## Overzicht
Dit document beschrijft het plan om over te stappen van Mollie naar Stripe als payment provider voor nieuwe klanten, terwijl bestaande Mollie subscriptions blijven werken.

## Strategie

### Fase 1: Parallelle Implementatie (Huidige fase)
- ✅ Stripe package installeren
- ✅ Stripe client utility maken
- ⏳ Stripe payment creation endpoint maken
- ⏳ Stripe webhook endpoint maken
- ⏳ Admin settings uitbreiden met Stripe keys
- ⏳ Registration form updaten om provider te kiezen

### Fase 2: Testing
- Test Stripe subscriptions in test mode
- Test webhooks
- Test payment flows
- Vergelijk functionaliteit met Mollie

### Fase 3: Gradual Rollout
- Nieuwe klanten kunnen Stripe gebruiken
- Bestaande Mollie klanten blijven werken
- Monitor beide systemen

### Fase 4: Volledige Migratie (Optioneel, later)
- Migreer bestaande Mollie subscriptions naar Stripe
- Deprecate Mollie code
- Volledige overstap naar Stripe

## Technische Details

### Stripe vs Mollie

**Stripe Voordelen:**
- Betere documentatie
- Betere TypeScript support
- Betrouwbaardere API
- Betere webhook handling
- Internationale focus

**Mollie Voordelen:**
- Nederlandse markt focus
- Betere iDEAL support
- Lagere kosten voor Nederlandse betaalmethoden

### Database Changes
- Geen database changes nodig - we gebruiken dezelfde `lynqit_pages` tabel
- Toevoegen van `stripeSubscriptionId` veld (naast `mollieSubscriptionId`)
- Toevoegen van `paymentProvider` veld om te tracken welke provider gebruikt wordt

### API Endpoints

**Nieuwe Stripe Endpoints:**
- `/api/stripe/payment/create` - Create Stripe subscription
- `/api/stripe/webhook` - Handle Stripe webhooks
- `/api/stripe/subscription/sync` - Sync Stripe subscriptions

**Bestaande Mollie Endpoints:**
- Blijven werken voor backward compatibility

### Settings
- Admin kan kiezen tussen Mollie en Stripe
- Per provider: test en live keys
- Default: Mollie (voor backward compatibility)

## Implementatie Checklist

- [x] Install Stripe packages
- [x] Create Stripe client utility
- [ ] Create Stripe payment creation endpoint
- [ ] Create Stripe webhook endpoint
- [ ] Update admin settings page
- [ ] Update registration form
- [ ] Add Stripe keys to environment variables
- [ ] Test Stripe subscriptions
- [ ] Test Stripe webhooks
- [ ] Document Stripe setup process

## Rollback Plan
Als Stripe problemen geeft:
- Zet `paymentProvider` terug naar 'mollie' in settings
- Alle nieuwe klanten gebruiken dan weer Mollie
- Bestaande Stripe subscriptions blijven werken

## Kosten Overwegingen
- Stripe: 1.4% + €0.25 per transactie (creditcard)
- Mollie: 1.4% + €0.25 per transactie (creditcard), maar goedkoper voor iDEAL/SEPA
- Overweeg beide providers te ondersteunen voor flexibiliteit

