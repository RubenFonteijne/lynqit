# Plan: Dashboard Verbeteringen

## Huidige Situatie
Het dashboard toont momenteel alleen een overzicht van alle pagina's, wat redundant is met de "Pages" pagina. Dit biedt weinig toegevoegde waarde.

---

## Aanbevolen Dashboard Inhoud

### **Optie 1: Analytics Overview Dashboard** (Aanbevolen)
Een dashboard met een overzicht van alle belangrijke metrics en statistieken.

#### **Top Row - Summary Cards (4 kolommen)**
1. **Totaal Pageviews (Alle Pagina's)**
   - Totaal aantal pageviews over alle pagina's
   - Percentage verandering vs vorige maand
   - Link naar Insights pagina

2. **Totaal Clicks (Alle Pagina's)**
   - Totaal aantal clicks over alle pagina's
   - Percentage verandering vs vorige maand
   - Link naar Insights pagina

3. **Unieke Bezoekers (Alle Pagina's)**
   - Totaal aantal unieke bezoekers
   - Percentage verandering vs vorige maand

4. **Click-Through Rate (Gemiddeld)**
   - Gemiddelde CTR over alle pagina's
   - Percentage verandering vs vorige maand

#### **Second Row - Quick Stats (3 kolommen)**
1. **Aantal Actieve Pagina's**
   - Totaal aantal pagina's
   - Breakdown: Free / Start / Pro
   - Link naar Pages pagina

2. **Meest Bekeken Pagina**
   - Pagina met meeste views (laatste 30 dagen)
   - Aantal views
   - Link naar pagina bewerken

3. **Meest Geklikte Pagina**
   - Pagina met meeste clicks (laatste 30 dagen)
   - Aantal clicks
   - Link naar pagina bewerken

#### **Third Row - Charts (2 kolommen)**
1. **Pageviews Trend (Laatste 30 Dagen)**
   - Line chart met pageviews over alle pagina's gecombineerd
   - Laatste 30 dagen

2. **Clicks Trend (Laatste 30 Dagen)**
   - Line chart met clicks over alle pagina's gecombineerd
   - Laatste 30 dagen

#### **Bottom Section - Recent Activity / Quick Actions**
- **Recent Activity**: Laatste pagina bewerkingen, nieuwe pagina's, etc.
- **Quick Actions**: 
  - "+ Nieuwe Lynqit" button
  - "Bekijk Insights" button
  - "Bekijk Alle Pagina's" button

---

### **Optie 2: Activity & Performance Dashboard**
Focus op recente activiteit en prestaties.

#### **Top Section - Performance Highlights**
- **Top Performing Pages** (top 3-5)
  - Met mini charts of sparklines
  - Views, clicks, CTR per pagina
  - Quick links naar bewerken/insights

#### **Middle Section - Recent Activity**
- **Laatst Bewerkte Pagina's** (laatste 5)
  - Met timestamp
  - Quick link naar bewerken

- **Nieuwe Pagina's** (laatste 5)
  - Met aanmaakdatum
  - Quick link naar bewerken

#### **Bottom Section - Quick Stats & Actions**
- Summary cards (zoals Optie 1)
- Quick action buttons

---

### **Optie 3: Hybrid Dashboard** (Beste van beide)
Combineert analytics overview met recente activiteit.

#### **Top Row - Summary Cards (4 kolommen)**
- Totaal Pageviews
- Totaal Clicks
- Unieke Bezoekers
- Gemiddelde CTR

#### **Second Row - Performance Highlights (2 kolommen)**
- **Top 3 Meest Bekeken Pagina's**
  - Met views count
  - Mini trend indicator
  - Link naar bewerken/insights

- **Top 3 Meest Geklikte Pagina's**
  - Met clicks count
  - Mini trend indicator
  - Link naar bewerken/insights

#### **Third Row - Charts (2 kolommen)**
- Pageviews Trend (30 dagen)
- Clicks Trend (30 dagen)

#### **Bottom Section - Quick Actions & Recent Activity**
- **Quick Actions Card**
  - "+ Nieuwe Lynqit" button
  - "Bekijk Alle Pagina's" link
  - "Bekijk Insights" link

- **Recent Activity Card**
  - Laatst bewerkte pagina's (3-5)
  - Nieuwe pagina's (3-5)

---

## Aanbevolen Implementatie: **Optie 3 (Hybrid Dashboard)**

### **Voordelen:**
- ✅ Geeft direct inzicht in prestaties
- ✅ Toont belangrijkste metrics op één plek
- ✅ Highlight top performers
- ✅ Quick actions voor snelle toegang
- ✅ Recent activity voor context
- ✅ Geen redundantie met Pages pagina

### **Implementatie Details:**

#### **1. API Route: `/api/analytics/dashboard`**
Nieuwe API route die geaggregeerde analytics retourneert:
```typescript
{
  totalViews: number,
  totalClicks: number,
  totalUniqueVisitors: number,
  averageCTR: number,
  topPagesByViews: Array<{ pageId, slug, views, change }>,
  topPagesByClicks: Array<{ pageId, slug, clicks, change }>,
  dailyViews: Array<{ date, views }>,
  dailyClicks: Array<{ date, clicks }>,
  recentPages: Array<{ pageId, slug, updatedAt }>
}
```

#### **2. UI Componenten:**
- **SummaryCards**: 4 cards met totaal metrics
- **TopPagesCard**: Lijst met top 3 pagina's (views/clicks)
- **TrendCharts**: Line charts voor trends
- **QuickActionsCard**: Snelle actie buttons
- **RecentActivityCard**: Recente wijzigingen

#### **3. Styling:**
- Consistent met Insights pagina (dark mode, rgba backgrounds)
- Responsive grid layout
- Cards met `rgba(255, 255, 255, 0.05)` backgrounds

---

## Alternatief: **Minimal Dashboard**

Als de gebruiker liever een minimal dashboard heeft:

### **Top Section - Quick Stats (3 kolommen)**
1. **Totaal Pagina's** - Met breakdown Free/Start/Pro
2. **Totaal Pageviews (30 dagen)** - Over alle pagina's
3. **Totaal Clicks (30 dagen)** - Over alle pagina's

### **Middle Section - Quick Actions**
- "+ Nieuwe Lynqit" button (groot, prominent)
- "Bekijk Alle Pagina's" link
- "Bekijk Insights" link

### **Bottom Section - Recent Pages (Optioneel)**
- Laatste 3-5 pagina's met quick links

---

## Technische Overwegingen

### **Performance:**
- Cache analytics data (5 minuten)
- Parallel fetchen van analytics voor alle pagina's
- Lazy loading van charts

### **Data Aggregatie:**
- Nieuwe API route die analytics combineert voor alle pagina's van een gebruiker
- Efficient queries (gebruik database aggregaties waar mogelijk)

### **Fallbacks:**
- Als gebruiker geen pagina's heeft: toon empty state met "Eerste Page Aanmaken"
- Als geen analytics data: toon "Nog geen statistieken beschikbaar"

---

## Prioriteit

### **Fase 1: Quick Win** (Direct implementeren)
- Summary cards met totaal metrics
- Quick actions
- Recent pages lijst

### **Fase 2: Analytics Integration** (Korte termijn)
- Top performing pages
- Trend charts
- Performance highlights

### **Fase 3: Advanced Features** (Middellange termijn)
- Activity feed
- Notifications
- Personalized recommendations

---

## Success Metrics

- **Engagement**: Gebruikers bezoeken dashboard vaker
- **Action Rate**: Gebruikers klikken vaker op quick actions
- **Insights Discovery**: Gebruikers ontdekken Insights pagina via dashboard
- **Time to Action**: Snellere toegang tot belangrijke functies

