# Modal Compute Intelligence Dashboard — Build Spec

## Purpose

Build a production-quality React web app that serves as a **GPU Compute Procurement Intelligence Dashboard** — the kind of tool the Compute Strategy & Operations Lead at Modal would use daily to track market pricing, evaluate suppliers, model deal economics, and monitor supply trends.

This is a job application work sample for the "Compute Strategy & Operations Lead" role at Modal (https://jobs.ashbyhq.com/modal/f1465314-5f6c-4c28-89f1-55a4ae6e11c0). It should demonstrate deep fluency in the GPU infrastructure landscape, commercial instincts, and the ability to build operational tooling.

## Tech Stack

- **React** (single-file .jsx artifact or small app)
- **Tailwind CSS** for styling
- **Recharts** for charts/visualizations
- **lucide-react** for icons
- Use a dark theme with Modal's brand green (#62DE61) as accent color
- Professional, dense, data-rich UI — think Bloomberg terminal meets modern dashboard
- **Anthropic API** for live data features (web search integration — "Claude in Claude")
- Hybrid data architecture: static baseline + live refresh capabilities

## Data Architecture

### Design Decision: Single Canonical Source

**For this interview version**, all market pricing data is sourced from **getdeploying.com**, which aggregates pricing across 42+ cloud GPU providers and updates daily. This is a deliberate design choice:

- getdeploying.com is the most comprehensive public aggregator for GPU cloud pricing
- It normalizes per-GPU-hour rates across providers (even when providers only list 8-GPU nodes)
- It tracks on-demand, spot, and reserved pricing tiers
- It covers the exact providers Modal would evaluate (AWS, GCP, Azure, OCI, CoreWeave, Lambda, RunPod, Vast.ai, etc.)

**In production**, we would layer in additional data sources:
- Direct API integrations with providers that offer them (AWS Pricing API, GCP Billing Catalog)
- Contracted/negotiated rates from Modal's existing deals (internal data)
- Hardware cost basis data for TCO modeling
- getdeploying.com as a cross-reference/sanity check against direct sources

Attribution is shown in the app: *"Market pricing via getdeploying.com. Updated daily. Verify with provider before procurement decisions."*

### How Live Refresh Works

The app uses the **Anthropic API with web_search** to pull current data from getdeploying.com on demand. Since the artifact can't fetch external URLs directly (CORS), we route through the Anthropic API which can search and read the page.

```javascript
const refreshPricing = async (gpuType) => {
  setRefreshing(gpuType);
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `Search getdeploying.com for current NVIDIA ${gpuType} GPU cloud pricing. Find the per-GPU-hour on-demand prices from as many providers as possible. Return ONLY valid JSON, no markdown, no backticks: {"gpu":"${gpuType}","avgPrice":number,"minPrice":number,"maxPrice":number,"providerCount":number,"prices":[{"provider":"AWS","perGpuHour":3.93,"billingType":"on-demand"},{"provider":"Lambda Labs","perGpuHour":2.49,"billingType":"on-demand"}],"source":"getdeploying.com","asOf":"2026-04-15"}`
        }]
      })
    });
    const data = await response.json();
    const text = data.content.filter(b => b.type === "text").map(b => b.text).join("");
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Refresh failed:", err);
    return null; // Fall back to baseline
  } finally {
    setRefreshing(null);
  }
};
```

### Data Layers

**Layer 1 — Static Baseline (instant load, always available)**
Hardcoded from research as of April 2026. The app works immediately without any API calls.
Includes: all provider pricing, GPU specs, supplier scorecard ratings, historical trends, deal presets.

**Layer 2 — Cached Refresh Data (persists across sessions)**
After a successful refresh, data is saved to `window.storage` so the next time the user opens the app, they see the refreshed data instantly without needing another API call.

```javascript
// Save after refresh
await window.storage.set('gpu-pricing-cache', JSON.stringify({
  prices: mergedPriceData,
  refreshedAt: Date.now(),
  source: 'getdeploying.com'
}));

// Load on mount
const cached = await window.storage.get('gpu-pricing-cache');
if (cached) {
  const { prices, refreshedAt } = JSON.parse(cached.value);
  // Use cached data, show "Last refreshed X hours ago"
}
```

**Layer 3 — Live Refresh (on-demand via button)**
User clicks "Refresh Prices" → Anthropic API + web_search → getdeploying.com data → update UI + save to cache.

### Freshness Indicators

Every price shows its age:
- 🟢 **Fresh** (<24h): green dot
- 🟡 **Aging** (24-72h): yellow dot, "Refresh recommended"  
- 🔴 **Stale** (>72h) or baseline: red/gray dot, "Refresh for current data"

### What Stays Static (not from getdeploying.com)

- **GPU hardware specs** — these don't change (NVIDIA published specs)
- **Modal's sell prices** — from modal.com/pricing, updated manually
- **Supplier scorecard ratings** — qualitative assessments, editorial judgment
- **Historical price trend data** — quarterly data points for trajectory charts
- **Deal evaluator logic** — calculations, not data
- **Market signals** — curated baseline signals (with option to scan for live news)

## App Views

Single-page app with a **tab-based layout** across 4 main views:

1. **Market Prices** — GPU pricing matrix across providers (static + live refresh)
2. **Supplier Scorecard** — Provider evaluation on multiple dimensions (static with adjustable weights)
3. **Deal Evaluator** — Interactive calculator for modeling contract economics (fully interactive)
4. **Market Trends** — Price trajectory charts and market signals (static charts + live news scan)

Plus a persistent **header** showing:
- App title: "Compute Intelligence — Modal Procurement Dashboard"
- Current date
- A summary stat bar: "Tracking X providers across Y GPU types | H100 market avg: $Z.ZZ/hr"

---

## View 1: Market Prices

### Layout
A **matrix/table** with GPU types as rows and providers as columns, showing per-GPU-hour on-demand pricing. Modal's own sell price shown in a highlighted column for instant margin visibility.

### Data — Modal's Sell Prices (from modal.com/pricing, converted to $/hr)

| GPU | Modal $/hr |
|-----|-----------|
| B200 | $6.25 |
| H200 | $4.54 |
| H100 | $3.95 |
| A100 80GB | $2.50 |
| A100 40GB | $2.10 |
| L40S | $1.95 |
| A10 | $1.10 |
| L4 | $0.80 |
| T4 | $0.59 |

### Data — Provider On-Demand Pricing ($/GPU-hr, April 2026 market data)

Use `null` where a provider doesn't offer that GPU.

**AWS (EC2)**
- B200: ~$12.00
- H200: ~$10.60
- H100: ~$3.93 (post June 2025 cut)
- A100 80GB: ~$4.10
- A100 40GB: ~$3.40
- L40S: null
- A10: ~$1.50
- L4: ~$0.80
- T4: ~$0.53

**GCP**
- B200: ~$11.50
- H200: ~$8.50
- H100: ~$3.00
- A100 80GB: ~$3.67
- A100 40GB: ~$2.85
- L40S: null
- L4: ~$0.70
- T4: ~$0.35

**Azure**
- B200: ~$13.00
- H200: ~$10.60
- H100: ~$3.67
- A100 80GB: ~$3.67
- A10: ~$1.60
- T4: ~$0.53

**OCI (Oracle)** — Modal's confirmed upstream partner
- B200: ~$8.00
- H200: ~$5.50
- H100: ~$3.50
- A100 80GB: ~$2.95
- A100 40GB: ~$2.50

**CoreWeave**
- B200: ~$5.50
- H200: ~$3.89
- H100: ~$6.16 (cluster pricing, 8-GPU min)
- A100 80GB: ~$2.21
- A100 40GB: ~$2.06

**Lambda Labs**
- B200: ~$4.99
- H200: ~$4.49
- H100: ~$2.49
- A100 80GB: ~$1.48
- A100 40GB: null

**RunPod**
- B200: null
- H200: ~$3.59
- H100: ~$2.49 (secure cloud)
- A100 80GB: ~$1.64
- A100 40GB: null
- L40S: ~$0.99
- A10: ~$0.44

**Vast.ai** (marketplace, variable)
- H200: ~$3.00
- H100: ~$1.87
- A100 80GB: ~$1.20
- L40S: ~$0.70

**Crusoe Energy**
- H200: ~$3.50
- H100: ~$2.50
- A100 80GB: ~$1.71 (MI300X pricing reference)

**DataCrunch**
- B200: ~$3.99
- H100: ~$1.99
- A100 80GB: ~$1.45

### Features
- Color-code cells: green = below Modal sell price (potential buy), yellow = near Modal price, red = above Modal price
- Show **estimated margin** row: Modal sell price minus the cheapest available upstream price for each GPU
- Sortable columns
- Click a cell to see more detail (provider + GPU combo)
- Filter: show only GPUs Modal currently sells, or show all
- Toggle: On-demand vs. Reserved (1yr) vs. Spot pricing tiers where data exists

### Reserved/Committed Pricing Estimates (for toggle)
These are approximate and represent typical 1-year commitment discounts:
- AWS: ~40-50% off on-demand (Savings Plans)
- GCP: ~30-40% off (CUD)
- Azure: ~35-45% off
- OCI: ~30-40% off
- CoreWeave: ~60% off on-demand (per their website)
- Lambda: ~20-30% off (negotiated clusters)

---

## View 2: Supplier Scorecard

### Layout
A **card grid or detailed table** evaluating each provider across standardized dimensions. Each provider gets an overall score (weighted composite).

### Providers to Evaluate

**Hyperscalers:**
1. AWS
2. GCP (Google Cloud)
3. Azure (Microsoft)
4. OCI (Oracle) — flag as "Current Partner"

**Neoclouds / GPU-First:**
5. CoreWeave
6. Lambda Labs
7. Crusoe Energy
8. Voltage Park
9. Together AI
10. Nebius

**Marketplaces / Budget:**
11. RunPod
12. Vast.ai
13. FluidStack
14. TensorDock

### Scoring Dimensions (each rated 1-5 or 1-10)

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Price Competitiveness | 25% | On-demand $/GPU-hr relative to market average |
| GPU Availability | 20% | Breadth of GPU types, waitlist frequency, capacity depth |
| Networking | 15% | InfiniBand support, NVLink, RoCE, fabric topology quality |
| SLA & Reliability | 15% | Uptime guarantees, preemption risk, support quality |
| Contract Flexibility | 10% | Min commitments, term options, spot availability |
| Geographic Coverage | 10% | Number of regions, proximity to Modal's target markets |
| Strategic Fit for Modal | 5% | Marketplace integrations, bare-metal access, API-first |

### Provider Profiles Data

**AWS**
- Price: 3/10 (premium pricing, but deep reserved discounts)
- Availability: 9/10 (broadest GPU selection, global)
- Networking: 7/10 (EFA, not InfiniBand native, 400Gbps)
- SLA: 9/10 (99.99% for some services)
- Flexibility: 6/10 (1-3yr commits for best pricing, spot available)
- Geo: 10/10 (30+ regions globally)
- Modal Fit: 8/10 (Modal already has AWS marketplace integration)
- Notes: Modal customers can apply AWS committed spend. Confirmed partnership.

**GCP**
- Price: 4/10 (slightly cheaper than AWS on H100)
- Availability: 8/10 (strong H100/A100, adding B200)
- Networking: 7/10 (gVNIC, GPUDirect RDMA)
- SLA: 8/10
- Flexibility: 6/10 (CUDs, spot VMs)
- Geo: 9/10 (35+ regions)
- Modal Fit: 8/10 (Modal has GCP marketplace integration)

**Azure**
- Price: 3/10 (most expensive hyperscaler for GPU)
- Availability: 7/10 (strong H100, limited spot)
- Networking: 7/10 (InfiniBand on ND-series)
- SLA: 8/10
- Flexibility: 5/10 (reserved, limited spot)
- Geo: 9/10 (60+ regions)
- Modal Fit: 6/10 (no confirmed marketplace integration yet)

**OCI (Oracle)**
- Price: 7/10 (significantly cheaper than AWS/GCP/Azure)
- Availability: 6/10 (growing but smaller footprint)
- Networking: 8/10 (bare-metal with RDMA, ClusterNetworking)
- SLA: 7/10
- Flexibility: 7/10 (flexible shapes, good negotiation)
- Geo: 5/10 (fewer regions than big 3)
- Modal Fit: 10/10 (CONFIRMED upstream partner — Modal CEO quote praising OCI bare metal)
- Notes: "Before working with Oracle, we struggled to find reliable NVIDIA GPU access at scale... OCI's bare metal instances have been phenomenal" — Modal

**CoreWeave**
- Price: 6/10 (mid-range, good reserved pricing at 60% off)
- Availability: 8/10 (strong H100/H200/B200, cluster-focused)
- Networking: 10/10 (InfiniBand, NVLink, purpose-built for ML)
- SLA: 7/10 (enterprise-grade, single-tenancy)
- Flexibility: 4/10 (8-GPU cluster minimums, enterprise sales cycle)
- Geo: 4/10 (US-focused, expanding)
- Modal Fit: 7/10 (Kubernetes-native, good for bulk capacity)

**Lambda Labs**
- Price: 8/10 (very competitive on-demand, transparent)
- Availability: 7/10 (H100/A100/B200, waitlists can occur)
- Networking: 6/10 (standard, not InfiniBand-first)
- SLA: 6/10 (no spot, but guaranteed non-preemptible)
- Flexibility: 8/10 (single-GPU available, no egress fees, hourly billing)
- Geo: 4/10 (US primarily)
- Modal Fit: 7/10 (simple API, good for burst capacity)

**Crusoe Energy**
- Price: 8/10 (competitive, green energy discount)
- Availability: 5/10 (limited GPU types)
- Networking: 6/10
- SLA: 6/10
- Flexibility: 6/10
- Geo: 3/10 (US only, limited locations)
- Modal Fit: 5/10 (niche, sustainability angle)

**RunPod**
- Price: 9/10 (among cheapest, community + secure tiers)
- Availability: 7/10 (broad GPU range including consumer)
- Networking: 4/10 (limited interconnect for training)
- SLA: 4/10 (community cloud has interruption risk)
- Flexibility: 9/10 (per-minute billing, spot, no minimums)
- Geo: 5/10 (multiple locations, variable)
- Modal Fit: 5/10 (better for burst/overflow than primary supply)

**Vast.ai**
- Price: 10/10 (marketplace model, lowest prices)
- Availability: 6/10 (depends on marketplace hosts)
- Networking: 3/10 (variable, no guaranteed interconnect)
- SLA: 2/10 (no SLA guarantees, host-dependent)
- Flexibility: 10/10 (total flexibility, bid model)
- Geo: 6/10 (distributed globally)
- Modal Fit: 3/10 (reliability too low for primary supply)

**Voltage Park**
- Price: 7/10
- Availability: 5/10
- Networking: 7/10 (InfiniBand capable)
- SLA: 6/10
- Flexibility: 5/10
- Geo: 3/10
- Modal Fit: 5/10

**Together AI**
- Price: 6/10
- Availability: 6/10
- Networking: 7/10
- SLA: 7/10
- Flexibility: 5/10
- Geo: 4/10
- Modal Fit: 4/10 (more competitor than supplier)

**Nebius**
- Price: 8/10 ($2.00/hr H100)
- Availability: 6/10
- Networking: 7/10 (InfiniBand)
- SLA: 6/10
- Flexibility: 7/10
- Geo: 5/10 (EU + US)
- Modal Fit: 6/10

**FluidStack**
- Price: 8/10
- Availability: 5/10
- Networking: 4/10
- SLA: 4/10
- Flexibility: 8/10
- Geo: 5/10
- Modal Fit: 4/10

**TensorDock**
- Price: 9/10
- Availability: 5/10
- Networking: 3/10
- SLA: 3/10
- Flexibility: 9/10
- Geo: 5/10
- Modal Fit: 3/10

### Visual Treatment
- Radar/spider chart for each provider showing their dimension scores
- Overall weighted score prominently displayed
- Color-coded badges: "Current Partner" (OCI), "Marketplace Integration" (AWS, GCP), "Recommended for Evaluation"
- Ability to adjust dimension weights with sliders (lets leadership prioritize what matters)
- Sort providers by overall score

---

## View 3: Deal Evaluator

### Purpose
Interactive calculator to model the economics of a specific capacity contract before signing.

### Input Fields

| Field | Type | Default |
|-------|------|---------|
| Provider | Dropdown (from supplier list) | — |
| GPU Type | Dropdown | H100 |
| Number of GPUs | Number input | 64 |
| Contract Term | Dropdown: 1mo, 3mo, 6mo, 1yr, 3yr | 1yr |
| Contracted $/GPU-hr | Number input | 2.50 |
| Expected Utilization % | Slider: 0-100% | 70% |
| Modal Sell Price $/GPU-hr | Auto-populated from Modal pricing, editable | 3.95 |

### Calculated Outputs

**Cost Analysis:**
- Total contract cost = GPUs × hours_in_term × contracted_rate
- Effective cost at utilization = total_cost / (GPUs × hours_in_term × utilization)
- Annual commitment = total_contract_cost / years

**Revenue & Margin Analysis:**
- Gross revenue at utilization = GPUs × hours_in_term × utilization × modal_sell_price
- Gross margin $ = revenue - total_contract_cost
- Gross margin % = margin / revenue
- Breakeven utilization = contracted_rate / modal_sell_price (the utilization at which you break even)

**Comparison:**
- vs. On-demand: savings compared to same provider's on-demand rate
- vs. Market average: savings compared to average on-demand across all providers
- vs. Best available: savings compared to cheapest on-demand for that GPU

### Visualization
- A **breakeven chart**: X-axis = utilization (0-100%), Y-axis = profit/loss. Show the line crossing zero. Shade profitable zone green, loss zone red.
- A **sensitivity table**: show margin at 50%, 60%, 70%, 80%, 90% utilization
- A **comparison bar chart**: this deal's effective cost vs. top 5 alternatives

### Scenario Presets
Include 3-4 preset buttons for common deal structures:
- "OCI Reserved H100 — 1yr @ $2.80/hr × 128 GPUs"
- "Lambda H200 — 6mo @ $3.50/hr × 32 GPUs"
- "CoreWeave B200 — 1yr @ $3.80/hr × 64 GPUs"
- "AWS Savings Plan H100 — 3yr @ $1.90/hr × 256 GPUs"

---

## View 4: Market Trends

### Price Trajectory Charts

**Chart 1: H100 On-Demand Price History**
Show how H100 pricing has evolved. Use this approximate data:

| Date | AWS | GCP | Lambda | RunPod | Market Avg |
|------|-----|-----|--------|--------|------------|
| Q1 2024 | $8.00 | $11.00 | $4.50 | $3.50 | $6.75 |
| Q2 2024 | $7.50 | $8.50 | $3.50 | $3.00 | $5.63 |
| Q3 2024 | $6.50 | $6.00 | $3.00 | $2.80 | $4.58 |
| Q4 2024 | $5.50 | $4.50 | $2.99 | $2.50 | $3.87 |
| Q1 2025 | $4.50 | $3.50 | $2.99 | $2.20 | $3.30 |
| Q2 2025 | $3.93 | $3.00 | $2.49 | $1.99 | $2.85 |
| Q3 2025 | $3.93 | $3.00 | $2.49 | $1.99 | $2.85 |
| Q4 2025 | $3.93 | $3.00 | $2.49 | $1.99 | $2.85 |
| Q1 2026 | $3.93 | $3.00 | $2.49 | $1.99 | $2.85 |
| Q2 2026 | $3.93 | $3.00 | $2.49 | $1.99 | $2.85 |

**Chart 2: Multi-GPU Price Comparison (Current)**
Bar chart comparing current on-demand prices across T4, L4, A10, L40S, A100-40, A100-80, H100, H200, B200. Show market range (min-max) plus Modal sell price.

**Chart 3: GPU Generation Value (Performance/$ Index)**
Normalize performance-per-dollar across GPU generations:

| GPU | FP8 TFLOPS | Typical $/hr | TFLOPS/$ |
|-----|-----------|-------------|----------|
| A100 80GB | 624 | $1.50 | 416 |
| H100 SXM | 3,958 | $2.85 | 1,389 |
| H200 SXM | 3,958 | $4.00 | 990 |
| B200 SXM | 9,000 | $5.00 | 1,800 |

### Market Signals Panel

Two modes — **Baseline Signals** (always shown) and **Live Scan** (on-demand via Anthropic API).

**Live Scan Button:** "Scan Latest GPU Market News"
When clicked, fires an Anthropic API call with web_search:
```
Search for the latest GPU cloud computing market news from the past 2 weeks.
Focus on: pricing changes, supply constraints, new datacenter announcements,
NVIDIA GPU availability, cloud provider capacity updates.
Return as JSON: { "signals": [{ "title": "...", "summary": "...", "severity": "green|yellow|red", "source": "...", "date": "..." }] }
```
Display results as cards below the baseline signals, marked as "Live — scanned just now"

**Baseline Signals** (hardcoded, always visible):

A curated list of key market dynamics. Hardcode these as signal cards with severity indicators (🟢 🟡 🔴):

1. 🟡 **H100 Price Stabilization** — H100 on-demand pricing has flattened at ~$2-3/hr on neoclouds after 18 months of decline. Limited further downside expected as floor approaches hardware depreciation cost.

2. 🔴 **B200 Supply Constraints** — B200 and GB200 hardware reportedly sold out through mid-2026 with ~3.6M unit backlog. Expect premium pricing and allocation challenges.

3. 🟢 **HBM Memory Cost Pressure** — DRAM/HBM prices surging (doubled in 2025). AMD forecasting ~10% GPU price hikes in 2026. Could push cloud GPU rates higher, benefiting Modal's existing capacity margins.

4. 🟡 **Neocloud Price Wars** — Intense competition among Lambda, RunPod, DataCrunch, Nebius driving H100 prices toward $2/hr floor. Some providers may be below sustainable margins.

5. 🟢 **NVIDIA Roadmap: Vera Rubin H2 2026** — Next-gen architecture using HBM4, 288GB/GPU, 13 TB/s bandwidth. Will further depreciate Hopper-generation hardware. Begin planning procurement transition.

6. 🔴 **CoreWeave IPO / Financial Risk** — CoreWeave went public with significant debt load. Monitor financial stability as a key supplier. Diversification important.

7. 🟡 **Hyperscaler Reserved Capacity Sold Out** — H100 reserved pools on AWS/GCP largely sold out due to 2026 demand. Spot instances on neoclouds becoming primary on-ramp for teams without reserved capacity.

8. 🟢 **AMD MI300X Emerging** — MI300X at $1.71/hr (Crusoe) with 192GB HBM3 offers memory advantage over H100 at lower cost. Software ecosystem (ROCm) improving. Worth evaluating for inference workloads.

### NVIDIA GPU Specs Reference Table

Include a reference panel with key specs:

| GPU | Architecture | VRAM | Memory Type | Bandwidth | FP8 TFLOPS | FP16 TFLOPS | TDP | Interconnect | Purchase Price |
|-----|-------------|------|-------------|-----------|------------|-------------|-----|-------------|---------------|
| T4 | Turing | 16 GB | GDDR6 | 320 GB/s | 130 | 65 | 70W | PCIe | ~$2,500 |
| A10 | Ampere | 24 GB | GDDR6 | 600 GB/s | 250 | 125 | 150W | PCIe | ~$4,000 |
| L4 | Ada Lovelace | 24 GB | GDDR6 | 300 GB/s | 242 | 121 | 72W | PCIe | ~$2,800 |
| L40S | Ada Lovelace | 48 GB | GDDR6 | 864 GB/s | 733 | 366 | 350W | PCIe | ~$8,000 |
| A100 40GB | Ampere | 40 GB | HBM2e | 1,555 GB/s | 624 | 312 | 400W | NVLink 600GB/s | ~$10,000 |
| A100 80GB | Ampere | 80 GB | HBM2e | 2,039 GB/s | 624 | 312 | 400W | NVLink 600GB/s | ~$15,000 |
| H100 SXM | Hopper | 80 GB | HBM3 | 3,350 GB/s | 3,958 | 1,979 | 700W | NVLink 900GB/s | ~$25,000-30,000 |
| H200 SXM | Hopper | 141 GB | HBM3e | 4,800 GB/s | 3,958 | 1,979 | 700W | NVLink 900GB/s | ~$30,000-40,000 |
| B200 SXM | Blackwell | 192 GB | HBM3e | 8,000 GB/s | 9,000 | 4,500 | 1,000W | NVLink 1,800GB/s | ~$35,000-45,000 |

---

## Design Spec

### Color Palette
- Background: #0a0a0f (very dark navy/black)
- Card/Panel background: #12121a
- Border: #1e1e2e
- Text primary: #e2e2e8
- Text secondary: #8888a0
- Accent / Modal green: #62DE61
- Positive/profit: #62DE61
- Negative/loss: #ef4444
- Warning: #f59e0b
- Info/neutral: #3b82f6
- Chart colors: #62DE61, #3b82f6, #f59e0b, #ef4444, #8b5cf6, #06b6d4

### Typography
- Monospace for numbers/prices (font-mono)
- Clean sans-serif for labels
- Dense but readable — this is an ops tool, not a marketing page

### Layout
- Full-width, no sidebar
- Tab bar at top for switching views
- Responsive but optimized for desktop (1440px+)
- Dense data tables with good alignment
- Cards with subtle borders, no heavy shadows

### Interactive Elements
- All tables sortable by clicking column headers
- Deal evaluator inputs update calculations in real-time
- Supplier scorecard weights adjustable via sliders
- Tooltips on hover for additional context
- Smooth transitions between tabs

---

## Key Business Context to Embed

The app should feel like it was built by someone who understands Modal's business model:

1. **Modal is a reseller with value-add** — They buy upstream GPU capacity and sell it serverless. The margin between buy and sell price is the business. Every pricing decision, every contract negotiation, directly impacts gross margin.

2. **Multi-cloud is strategic** — Modal's partnership with OCI, plus AWS/GCP marketplace integrations, means they arbitrage across providers. The tool should help identify which provider offers the best deal for each GPU type at any given time.

3. **Utilization is the key variable** — Because Modal bills per-second and auto-scales, they can achieve higher utilization than customers running their own instances. But reserved contracts require *Modal* to maintain utilization to be profitable. The deal evaluator should make this tradeoff crystal clear.

4. **Supply planning is existential** — At 9-figure ARR and growing, Modal needs to secure capacity *before* customer demand materializes. Getting caught short on B200 supply could mean lost customers. Overcommitting could destroy margins.

5. **The neocloud landscape is volatile** — CoreWeave's IPO, Lambda's growth, new entrants like Nebius — the supplier landscape is shifting fast. The scorecard needs to capture both current value and strategic risk.

---

## Build Instructions

1. Build this as a single React component (JSX file)
2. Seed ALL static baseline data from this spec as constants at the top of the file
3. **Data source: getdeploying.com via Anthropic API**
   - On load: show static baseline data instantly (no API call needed to render)
   - "Refresh Prices" button: fires Anthropic API with web_search targeting getdeploying.com
   - On success: merge new prices into state, save to `window.storage` for persistence
   - On failure: show brief error, keep displaying baseline/cached data
   - Show data attribution: "Market data via getdeploying.com" with freshness indicator
4. **Persistent caching** via `window.storage`:
   - After refresh, save to `window.storage.set('gpu-pricing-cache', JSON.stringify({...}))`
   - On mount, check `window.storage.get('gpu-pricing-cache')` — if fresh data exists, use it
   - Show staleness: green (<24h), yellow (24-72h), red (>72h or baseline)
5. Use recharts for all visualizations
6. Use Tailwind for all styling — dark theme throughout
7. Tab navigation between the 4 views
8. Responsive tables with good number formatting ($ signs, 2 decimal places)
9. The deal evaluator should update all calculations reactively as inputs change
10. Show the production roadmap callout somewhere visible (see Data Architecture section)
11. Include a small footer: "Built by Niko as a work sample for Modal's Compute Strategy & Operations Lead role"

### Key Code Patterns

**Anthropic API** (available in React artifacts without an API key):

```javascript
const refreshPricing = async (gpuType) => {
  setRefreshing(gpuType);
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `Search getdeploying.com for current NVIDIA ${gpuType} GPU cloud pricing. Find per-GPU-hour on-demand prices from all listed providers. Return ONLY valid JSON, no markdown, no backticks: {"gpu":"${gpuType}","prices":[{"provider":"AWS","perGpuHour":3.93},{"provider":"Lambda Labs","perGpuHour":2.49}],"source":"getdeploying.com","asOf":"2026-04-15"}`
        }]
      })
    });
    const data = await response.json();
    const text = data.content.filter(b => b.type === "text").map(b => b.text).join("");
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    // Merge into state + save to cache
    mergePrices(gpuType, parsed);
    await window.storage.set('gpu-pricing-cache', JSON.stringify({
      ...allPrices,
      refreshedAt: Date.now()
    }));
  } catch (err) {
    console.error("Refresh failed:", err);
  } finally {
    setRefreshing(null);
  }
};
```

**Persistent storage** (load on mount):

```javascript
useEffect(() => {
  (async () => {
    try {
      const cached = await window.storage.get('gpu-pricing-cache');
      if (cached) {
        const data = JSON.parse(cached.value);
        setPricingData(data);
        setLastRefreshed(data.refreshedAt);
      }
    } catch (e) { /* no cache, use baseline */ }
  })();
}, []);
```

## What Success Looks Like

Someone at Modal (Erik Bernhardsson, the CEO, or whoever reviews this application) should open this and think:
- "This person understands our business model and cost structure"
- "They know the GPU market landscape cold"
- "They built a tool I'd actually want to use"
- "They think about procurement as margin management, not just cost reduction"
- "Smart to use getdeploying.com as a data source and be upfront about the production roadmap"

### Build Priority Order (if time is constrained)

If the single JSX file gets too large, prioritize in this order:
1. **Deal Evaluator** — highest signal for commercial instincts, fully interactive, no API needed
2. **Market Prices** — the core pricing matrix with Modal margin overlay + live refresh from getdeploying.com
3. **Supplier Scorecard** — demonstrates market knowledge
4. **Market Trends** — charts and signals round it out
