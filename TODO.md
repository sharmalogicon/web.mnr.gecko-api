# gecko-mnr Development TODO

## Project Setup
- [x] Initialize Next.js 14+ project with TypeScript
- [x] Configure Tailwind CSS and design tokens
- [x] Install and setup shadcn/ui components

## App Shell
- [x] Build Sidebar navigation (collapsible, responsive)
- [x] Build Top navigation bar (search, notifications, user menu)
- [x] Build Main layout wrapper

## Dashboard
- [x] Build KPI cards (Equipment, Surveys, Repairs, Cleaning)
- [x] Build Charts (Operations trend line chart, Equipment pie chart)
- [x] Build Activity feed & Pending approvals widgets

## Shared Components
- [x] Build DataTable component (sortable, pagination, row actions)
- [x] Build StatsCard & StatsGrid components
- [x] Build PageHeader component (breadcrumbs, actions)
- [x] Build StatusBadge component (comprehensive status types)
- [x] Build StockBadge component

## Repair Module
- [x] Build Kanban board view (`/repair`)
- [x] Build Repair detail page (`/repair/[id]`)
- [x] Build New repair form (`/repair/new`)

## Survey Module
- [x] Build Survey list page with DataTable (`/survey`)
- [x] Build New Survey wizard (`/survey/new`)
- [x] Build Survey detail page (`/survey/[id]`)

## Cleaning Module
- [x] Build Cleaning bay status visualization (`/cleaning`)
- [x] Build Cleaning Kanban board
- [x] Build New Cleaning Job form (`/cleaning/new`)
- [x] Build Cleaning Job detail page (`/cleaning/[id]`)

## Storage Module
- [x] Build Yard map visualization (`/storage`)
- [x] Build zone occupancy display
- [x] Build equipment storage list

## Equipment Module
- [x] Build Equipment registry page (`/equipment`)
- [x] Build Equipment detail page (`/equipment/[id]`)

## Parts/Inventory Module
- [x] Build Spare parts inventory page (`/parts`)
- [x] Build Low stock alerts
- [x] Build New Part form (`/parts/new`)
- [x] Build Part detail page (`/parts/[id]`)

## Billing Module
- [x] Build Invoices list page (`/billing`)
- [x] Build Invoice detail page (`/billing/[id]`)

## Emergency Module
- [x] Build Emergency support page (`/emergency`)
- [x] Build Active emergency alerts banner
- [x] Build Emergency detail page (`/emergency/[id]`)

## Modification Module
- [x] Build Modification requests page (`/modification`)
- [x] Build New Modification request form (`/modification/new`)
- [x] Build Modification detail page (`/modification/[id]`)

## Settings Module
- [x] Build Settings page with sections (`/settings`)
- [x] Build Company settings form
- [x] Build Users & Roles section
- [x] Build Pricing configuration
- [x] Build Notifications preferences
- [x] Build Security settings
- [x] Build Master Data management
- [x] Build Email templates section
- [x] Build Appearance settings

## Tariff Module
### Tariff Dashboard
- [ ] Build Tariff dashboard page (`/tariff`)
- [ ] Build KPI cards (Rate Cards, Customer Rates, Active Contracts, Expiring Soon)
- [ ] Build Quick Actions grid (6 action cards)
- [ ] Build Expiring Contracts widget
- [ ] Build Recent Price Changes widget

### Rate Cards (`/tariff/rate-cards`)
- [ ] Build Rate Cards list page with grid view
- [ ] Build Rate Cards list page with table view (alternative)
- [ ] Build category grouping (Survey, Cleaning, Storage, Labor, Repair, Modification)
- [ ] Build rate card components with pricing display
- [ ] Build Edit Rate Card modal
- [ ] Build New Rate Card modal
- [ ] Build rate card filtering (category, equipment, status)
- [ ] Build rate card search functionality

### Customer Rates (`/tariff/customer-rates`)
- [ ] Build Customer Rates list page (`/tariff/customer-rates`)
- [ ] Build customer rate cards with tier badges
- [ ] Build Customer Rate detail page (`/tariff/customer-rates/:customerId`)
- [ ] Build service rates table with tier/custom indicators
- [ ] Build volume discounts display
- [ ] Build rate history timeline
- [ ] Build Edit Customer Rates page (`/tariff/customer-rates/:customerId/edit`)
- [ ] Build pricing method selector (tier-based vs custom)
- [ ] Build service rate editor with custom overrides
- [ ] Build volume discount tier editor
- [ ] Build Customer Tier Configuration page
- [ ] Build tier management table
- [ ] Build New Customer Rate modal
- [ ] Build customer rate filtering and search

### Contracts (`/tariff/contracts`)
- [ ] Build Contracts list page (`/tariff/contracts`)
- [ ] Build contract cards with status badges
- [ ] Build contract search and filtering
- [ ] Build Contract detail page (`/tariff/contracts/:id`)
- [ ] Build contract status timeline visualization
- [ ] Build pricing terms display
- [ ] Build financial summary cards
- [ ] Build documents section with upload
- [ ] Build activity log
- [ ] Build New Contract form - Step 1: Basic Information (`/tariff/contracts/new`)
- [ ] Build New Contract form - Step 2: Pricing Terms
- [ ] Build New Contract form - Step 3: Review & Create
- [ ] Build multi-step form navigation
- [ ] Build Contract Renewal modal
- [ ] Build contract renewal workflow

### Surcharges (`/tariff/surcharges`)
- [ ] Build Surcharges list page (`/tariff/surcharges`)
- [ ] Build surcharge grouping (Time-Based, Service-Based, Equipment-Based, Discounts)
- [ ] Build surcharge cards with toggle functionality
- [ ] Build New Surcharge modal
- [ ] Build Edit Surcharge modal
- [ ] Build surcharge applicability configuration
- [ ] Build time rules configuration (days/hours)
- [ ] Build Holiday Configuration page (`/tariff/surcharges/holidays`)
- [ ] Build holiday calendar with surcharge rates
- [ ] Build import/copy holiday functionality

### Price Simulator (`/tariff/simulator`)
- [ ] Build Price Simulator page (`/tariff/simulator`)
- [ ] Build job details input form
- [ ] Build real-time price calculation display
- [ ] Build applied rules breakdown
- [ ] Build surcharge breakdown display
- [ ] Build "Create Quote" integration

### Price History (`/tariff/history`)
- [ ] Build Price History page (`/tariff/history`)
- [ ] Build change log table with filters
- [ ] Build date range selector
- [ ] Build Change Detail modal
- [ ] Build before/after comparison view
- [ ] Build export functionality

### Shared Tariff Components
- [ ] Build TierBadge component (Platinum, Gold, Silver, Bronze, Standard)
- [ ] Build ContractStatusBadge component
- [ ] Build RateCard component
- [ ] Build CustomerRateCard component
- [ ] Build SurchargeCard component
- [ ] Build PriceBreakdown component
- [ ] Build VolumeDiscountEditor component
- [ ] Build TimeRuleSelector component

---

## Route Summary

| Module | List | New | Detail |
|--------|------|-----|--------|
| Dashboard | `/` | - | - |
| Survey | `/survey` | `/survey/new` | `/survey/[id]` |
| Cleaning | `/cleaning` | `/cleaning/new` | `/cleaning/[id]` |
| Repair | `/repair` | `/repair/new` | `/repair/[id]` |
| Storage | `/storage` | - | - |
| Equipment | `/equipment` | - | `/equipment/[id]` |
| Parts | `/parts` | `/parts/new` | `/parts/[id]` |
| Billing | `/billing` | - | `/billing/[id]` |
| Emergency | `/emergency` | - | `/emergency/[id]` |
| Modification | `/modification` | `/modification/new` | `/modification/[id]` |
| Settings | `/settings` | - | - |
| **Tariff** | `/tariff` | - | - |
| Rate Cards | `/tariff/rate-cards` | `/tariff/rate-cards/new` | - |
| Customer Rates | `/tariff/customer-rates` | `/tariff/customer-rates/new` | `/tariff/customer-rates/:customerId` |
| Contracts | `/tariff/contracts` | `/tariff/contracts/new` | `/tariff/contracts/:id` |
| Surcharges | `/tariff/surcharges` | `/tariff/surcharges/new` | - |
| Price Simulator | `/tariff/simulator` | - | - |
| Price History | `/tariff/history` | - | - |
| Holiday Config | `/tariff/surcharges/holidays` | - | - |

---
*Last Updated: December 15, 2024*
*Tariff module planned - pending implementation*
