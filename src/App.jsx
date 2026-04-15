import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ReferenceLine, Cell
} from 'recharts';
import {
  Calculator, TrendingDown, TrendingUp, Shield, BarChart3,
  RefreshCw, AlertTriangle, CheckCircle, Info,
  Cpu, DollarSign, Percent, Zap, Server,
  Briefcase, Key, Plus, Trash2, Loader2
} from 'lucide-react';

// ─── STATIC BASELINE DATA ───────────────────────────────────────────────────

const MODAL_SELL_PRICES = {
  'B200': 6.25, 'H200': 4.54, 'H100': 3.95, 'A100 80GB': 2.50,
  'A100 40GB': 2.10, 'L40S': 1.95, 'A10': 1.10, 'L4': 0.80, 'T4': 0.59,
};

const GPU_TYPES = ['B200', 'H200', 'H100', 'A100 80GB', 'A100 40GB', 'L40S', 'A10', 'L4', 'T4'];

const PROVIDER_PRICING = {
  'AWS': { 'B200': 12.00, 'H200': 10.60, 'H100': 3.93, 'A100 80GB': 4.10, 'A100 40GB': 3.40, 'L40S': null, 'A10': 1.50, 'L4': 0.80, 'T4': 0.53 },
  'GCP': { 'B200': 11.50, 'H200': 8.50, 'H100': 3.00, 'A100 80GB': 3.67, 'A100 40GB': 2.85, 'L40S': null, 'A10': null, 'L4': 0.70, 'T4': 0.35 },
  'Azure': { 'B200': 13.00, 'H200': 10.60, 'H100': 3.67, 'A100 80GB': 3.67, 'A100 40GB': null, 'L40S': null, 'A10': 1.60, 'L4': null, 'T4': 0.53 },
  'OCI': { 'B200': 8.00, 'H200': 5.50, 'H100': 3.50, 'A100 80GB': 2.95, 'A100 40GB': 2.50, 'L40S': null, 'A10': null, 'L4': null, 'T4': null },
  'CoreWeave': { 'B200': 5.50, 'H200': 3.89, 'H100': 6.16, 'A100 80GB': 2.21, 'A100 40GB': 2.06, 'L40S': null, 'A10': null, 'L4': null, 'T4': null },
  'Lambda': { 'B200': 4.99, 'H200': 4.49, 'H100': 2.49, 'A100 80GB': 1.48, 'A100 40GB': null, 'L40S': null, 'A10': null, 'L4': null, 'T4': null },
  'RunPod': { 'B200': null, 'H200': 3.59, 'H100': 2.49, 'A100 80GB': 1.64, 'A100 40GB': null, 'L40S': 0.99, 'A10': 0.44, 'L4': null, 'T4': null },
  'Vast.ai': { 'B200': null, 'H200': 3.00, 'H100': 1.87, 'A100 80GB': 1.20, 'A100 40GB': null, 'L40S': 0.70, 'A10': null, 'L4': null, 'T4': null },
  'Crusoe': { 'B200': null, 'H200': 3.50, 'H100': 2.50, 'A100 80GB': 1.71, 'A100 40GB': null, 'L40S': null, 'A10': null, 'L4': null, 'T4': null },
  'DataCrunch': { 'B200': 3.99, 'H200': null, 'H100': 1.99, 'A100 80GB': 1.45, 'A100 40GB': null, 'L40S': null, 'A10': null, 'L4': null, 'T4': null },
};

const PROVIDERS = Object.keys(PROVIDER_PRICING);

const RESERVED_DISCOUNTS = {
  'AWS': 0.45, 'GCP': 0.35, 'Azure': 0.40, 'OCI': 0.35,
  'CoreWeave': 0.60, 'Lambda': 0.25, 'RunPod': 0.15,
  'Vast.ai': 0.10, 'Crusoe': 0.20, 'DataCrunch': 0.20,
};

const SUPPLIER_DATA = [
  { name: 'AWS', category: 'Hyperscaler', badge: 'Marketplace', price: 3, availability: 9, networking: 7, sla: 9, flexibility: 6, geo: 10, modalFit: 8, notes: 'Modal customers can apply AWS committed spend. Confirmed partnership.' },
  { name: 'GCP', category: 'Hyperscaler', badge: 'Marketplace', price: 4, availability: 8, networking: 7, sla: 8, flexibility: 6, geo: 9, modalFit: 8, notes: 'Modal has GCP marketplace integration.' },
  { name: 'Azure', category: 'Hyperscaler', badge: null, price: 3, availability: 7, networking: 7, sla: 8, flexibility: 5, geo: 9, modalFit: 6, notes: 'No confirmed marketplace integration yet.' },
  { name: 'OCI', category: 'Hyperscaler', badge: 'Current Partner', price: 7, availability: 6, networking: 8, sla: 7, flexibility: 7, geo: 5, modalFit: 10, notes: '"OCI\'s bare metal instances have been phenomenal" — Modal' },
  { name: 'CoreWeave', category: 'Neocloud', badge: null, price: 6, availability: 8, networking: 10, sla: 7, flexibility: 4, geo: 4, modalFit: 7, notes: 'InfiniBand, NVLink, purpose-built for ML. 8-GPU cluster minimums.' },
  { name: 'Lambda', category: 'Neocloud', badge: null, price: 8, availability: 7, networking: 6, sla: 6, flexibility: 8, geo: 4, modalFit: 7, notes: 'Transparent pricing, no egress fees, hourly billing.' },
  { name: 'Crusoe', category: 'Neocloud', badge: null, price: 8, availability: 5, networking: 6, sla: 6, flexibility: 6, geo: 3, modalFit: 5, notes: 'Green energy discount, sustainability angle.' },
  { name: 'Voltage Park', category: 'Neocloud', badge: null, price: 7, availability: 5, networking: 7, sla: 6, flexibility: 5, geo: 3, modalFit: 5, notes: 'InfiniBand capable.' },
  { name: 'Together AI', category: 'Neocloud', badge: null, price: 6, availability: 6, networking: 7, sla: 7, flexibility: 5, geo: 4, modalFit: 4, notes: 'More competitor than supplier.' },
  { name: 'Nebius', category: 'Neocloud', badge: null, price: 8, availability: 6, networking: 7, sla: 6, flexibility: 7, geo: 5, modalFit: 6, notes: '$2.00/hr H100. EU + US presence.' },
  { name: 'RunPod', category: 'Marketplace', badge: null, price: 9, availability: 7, networking: 4, sla: 4, flexibility: 9, geo: 5, modalFit: 5, notes: 'Per-minute billing, community + secure tiers.' },
  { name: 'Vast.ai', category: 'Marketplace', badge: null, price: 10, availability: 6, networking: 3, sla: 2, flexibility: 10, geo: 6, modalFit: 3, notes: 'Marketplace model, lowest prices, no SLA guarantees.' },
  { name: 'FluidStack', category: 'Marketplace', badge: null, price: 8, availability: 5, networking: 4, sla: 4, flexibility: 8, geo: 5, modalFit: 4, notes: 'Distributed GPU marketplace.' },
  { name: 'TensorDock', category: 'Marketplace', badge: null, price: 9, availability: 5, networking: 3, sla: 3, flexibility: 9, geo: 5, modalFit: 3, notes: 'Budget option, variable reliability.' },
];

const DEFAULT_WEIGHTS = {
  price: 25, availability: 20, networking: 15, sla: 15,
  flexibility: 10, geo: 10, modalFit: 5,
};

const DIMENSION_LABELS = {
  price: 'Price', availability: 'Availability', networking: 'Networking',
  sla: 'SLA & Reliability', flexibility: 'Flexibility', geo: 'Geo Coverage', modalFit: 'Modal Fit',
};

const H100_PRICE_HISTORY = [
  { date: 'Q1 2024', AWS: 8.00, GCP: 11.00, Lambda: 4.50, RunPod: 3.50, avg: 6.75 },
  { date: 'Q2 2024', AWS: 7.50, GCP: 8.50, Lambda: 3.50, RunPod: 3.00, avg: 5.63 },
  { date: 'Q3 2024', AWS: 6.50, GCP: 6.00, Lambda: 3.00, RunPod: 2.80, avg: 4.58 },
  { date: 'Q4 2024', AWS: 5.50, GCP: 4.50, Lambda: 2.99, RunPod: 2.50, avg: 3.87 },
  { date: 'Q1 2025', AWS: 4.50, GCP: 3.50, Lambda: 2.99, RunPod: 2.20, avg: 3.30 },
  { date: 'Q2 2025', AWS: 3.93, GCP: 3.00, Lambda: 2.49, RunPod: 1.99, avg: 2.85 },
  { date: 'Q3 2025', AWS: 3.93, GCP: 3.00, Lambda: 2.49, RunPod: 1.99, avg: 2.85 },
  { date: 'Q4 2025', AWS: 3.93, GCP: 3.00, Lambda: 2.49, RunPod: 1.99, avg: 2.85 },
  { date: 'Q1 2026', AWS: 3.93, GCP: 3.00, Lambda: 2.49, RunPod: 1.99, avg: 2.85 },
  { date: 'Q2 2026', AWS: 3.93, GCP: 3.00, Lambda: 2.49, RunPod: 1.99, avg: 2.85 },
];

const GPU_PERF_VALUE = [
  { gpu: 'A100 80GB', fp8: 624, typicalPrice: 1.50, tflopsPerDollar: 416 },
  { gpu: 'H100 SXM', fp8: 3958, typicalPrice: 2.85, tflopsPerDollar: 1389 },
  { gpu: 'H200 SXM', fp8: 3958, typicalPrice: 4.00, tflopsPerDollar: 990 },
  { gpu: 'B200 SXM', fp8: 9000, typicalPrice: 5.00, tflopsPerDollar: 1800 },
];

const GPU_SPECS = [
  { gpu: 'T4', arch: 'Turing', vram: '16 GB', memType: 'GDDR6', bw: '320 GB/s', fp8: 130, fp16: 65, tdp: '70W', interconnect: 'PCIe', price: '~$2,500' },
  { gpu: 'A10', arch: 'Ampere', vram: '24 GB', memType: 'GDDR6', bw: '600 GB/s', fp8: 250, fp16: 125, tdp: '150W', interconnect: 'PCIe', price: '~$4,000' },
  { gpu: 'L4', arch: 'Ada Lovelace', vram: '24 GB', memType: 'GDDR6', bw: '300 GB/s', fp8: 242, fp16: 121, tdp: '72W', interconnect: 'PCIe', price: '~$2,800' },
  { gpu: 'L40S', arch: 'Ada Lovelace', vram: '48 GB', memType: 'GDDR6', bw: '864 GB/s', fp8: 733, fp16: 366, tdp: '350W', interconnect: 'PCIe', price: '~$8,000' },
  { gpu: 'A100 40GB', arch: 'Ampere', vram: '40 GB', memType: 'HBM2e', bw: '1,555 GB/s', fp8: 624, fp16: 312, tdp: '400W', interconnect: 'NVLink 600GB/s', price: '~$10,000' },
  { gpu: 'A100 80GB', arch: 'Ampere', vram: '80 GB', memType: 'HBM2e', bw: '2,039 GB/s', fp8: 624, fp16: 312, tdp: '400W', interconnect: 'NVLink 600GB/s', price: '~$15,000' },
  { gpu: 'H100 SXM', arch: 'Hopper', vram: '80 GB', memType: 'HBM3', bw: '3,350 GB/s', fp8: 3958, fp16: 1979, tdp: '700W', interconnect: 'NVLink 900GB/s', price: '~$25-30K' },
  { gpu: 'H200 SXM', arch: 'Hopper', vram: '141 GB', memType: 'HBM3e', bw: '4,800 GB/s', fp8: 3958, fp16: 1979, tdp: '700W', interconnect: 'NVLink 900GB/s', price: '~$30-40K' },
  { gpu: 'B200 SXM', arch: 'Blackwell', vram: '192 GB', memType: 'HBM3e', bw: '8,000 GB/s', fp8: 9000, fp16: 4500, tdp: '1000W', interconnect: 'NVLink 1,800GB/s', price: '~$35-45K' },
];

const MARKET_SIGNALS = [
  { severity: 'yellow', title: 'H100 Price Stabilization', summary: 'H100 on-demand pricing has flattened at ~$2-3/hr on neoclouds after 18 months of decline. Limited further downside expected as floor approaches hardware depreciation cost.', source: 'getdeploying.com pricing data', date: 'Mar 2026' },
  { severity: 'red', title: 'B200 Supply Constraints', summary: 'B200 and GB200 hardware reportedly sold out through mid-2026 with ~3.6M unit backlog. Expect premium pricing and allocation challenges.', source: 'SemiAnalysis', date: 'Feb 2026' },
  { severity: 'green', title: 'HBM Memory Cost Pressure', summary: 'DRAM/HBM prices surging (doubled in 2025). AMD forecasting ~10% GPU price hikes in 2026. Could push cloud GPU rates higher, benefiting Modal\'s existing capacity margins.', source: 'TrendForce, AMD earnings call', date: 'Jan 2026' },
  { severity: 'yellow', title: 'Neocloud Price Wars', summary: 'Intense competition among Lambda, RunPod, DataCrunch, Nebius driving H100 prices toward $2/hr floor. Some providers may be below sustainable margins.', source: 'getdeploying.com pricing data', date: 'Apr 2026' },
  { severity: 'green', title: 'NVIDIA Roadmap: Vera Rubin H2 2026', summary: 'Next-gen architecture using HBM4, 288GB/GPU, 13 TB/s bandwidth. Will further depreciate Hopper-generation hardware. Begin planning procurement transition.', source: 'NVIDIA GTC 2025 keynote', date: 'Mar 2025' },
  { severity: 'red', title: 'CoreWeave IPO / Financial Risk', summary: 'CoreWeave went public with significant debt load. Monitor financial stability as a key supplier. Diversification important.', source: 'SEC S-1 filing, Reuters', date: 'Mar 2025' },
  { severity: 'yellow', title: 'Hyperscaler Reserved Capacity Sold Out', summary: 'H100 reserved pools on AWS/GCP largely sold out due to 2026 demand. Spot instances on neoclouds becoming primary on-ramp for teams without reserved capacity.', source: 'The Information, AWS re:Invent', date: 'Dec 2025' },
  { severity: 'green', title: 'AMD MI300X Emerging', summary: 'MI300X at $1.71/hr (Crusoe) with 192GB HBM3 offers memory advantage over H100 at lower cost. Software ecosystem (ROCm) improving. Worth evaluating for inference workloads.', source: 'Crusoe pricing page, AMD ROCm blog', date: 'Feb 2026' },
];

const DEAL_PRESETS = [
  { label: 'OCI Reserved H100', provider: 'OCI', gpu: 'H100', gpus: 128, term: '1yr', rate: 2.80 },
  { label: 'Lambda H200 6mo', provider: 'Lambda', gpu: 'H200', gpus: 32, term: '6mo', rate: 3.50 },
  { label: 'CoreWeave B200 1yr', provider: 'CoreWeave', gpu: 'B200', gpus: 64, term: '1yr', rate: 3.80 },
  { label: 'AWS Savings H100 3yr', provider: 'AWS', gpu: 'H100', gpus: 256, term: '3yr', rate: 1.90 },
];

const TERM_HOURS = { '1mo': 730, '3mo': 2190, '6mo': 4380, '1yr': 8760, '3yr': 26280 };

const CHART_COLORS = ['#62DE61', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

const fmt = (n, decimals = 2) => {
  if (n == null) return '—';
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const fmtPct = (n) => {
  if (n == null) return '—';
  return (n * 100).toFixed(1) + '%';
};

const fmtCompact = (n) => {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
  return fmt(n);
};

const getMarketStats = (gpu) => {
  const prices = PROVIDERS.map(p => PROVIDER_PRICING[p][gpu]).filter(p => p != null);
  if (!prices.length) return { min: null, max: null, avg: null, count: 0 };
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: prices.reduce((a, b) => a + b, 0) / prices.length,
    count: prices.length,
  };
};

const getCellColor = (providerPrice, modalPrice) => {
  if (providerPrice == null || modalPrice == null) return '';
  const ratio = providerPrice / modalPrice;
  if (ratio < 0.85) return 'text-emerald-400 bg-emerald-400/10';
  if (ratio < 1.05) return 'text-yellow-400 bg-yellow-400/10';
  return 'text-red-400 bg-red-400/10';
};

const severityColors = {
  green: { bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', dot: 'bg-emerald-400', text: 'text-emerald-400' },
  yellow: { bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', dot: 'bg-yellow-400', text: 'text-yellow-400' },
  red: { bg: 'bg-red-400/10', border: 'border-red-400/30', dot: 'bg-red-400', text: 'text-red-400' },
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function TabBar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'deal', label: 'Deal Evaluator', icon: Calculator },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'prices', label: 'Market Prices', icon: DollarSign },
    { id: 'scorecard', label: 'Supplier Scorecard', icon: Shield },
    { id: 'trends', label: 'Market Trends', icon: BarChart3 },
    { id: 'methodology', label: 'Methodology', icon: Info },
  ];
  return (
    <div className="flex overflow-x-auto border-b border-[#1e1e2e] scrollbar-hide">
      {tabs.map(t => {
        const Icon = t.icon;
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 md:px-5 py-3 text-xs md:text-sm font-medium transition-colors border-b-2 whitespace-nowrap shrink-0 ${
              active
                ? 'text-[#62DE61] border-[#62DE61] bg-[#62DE61]/5'
                : 'text-[#8888a0] border-transparent hover:text-[#e2e2e8] hover:bg-[#1e1e2e]/50'
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(' ')[0]}</span>
          </button>
        );
      })}
    </div>
  );
}

function StatBar() {
  const h100Stats = getMarketStats('H100');
  const totalProviders = PROVIDERS.length;
  const totalGpus = GPU_TYPES.length;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 md:px-6 py-2 bg-[#12121a] border-b border-[#1e1e2e] text-[10px] md:text-xs text-[#8888a0]">
      <span className="flex items-center gap-1.5">
        <Server size={12} className="text-[#62DE61]" />
        <span className="font-mono text-[#e2e2e8]">{totalProviders}</span> providers · <span className="font-mono text-[#e2e2e8]">{totalGpus}</span> GPUs
      </span>
      <span className="hidden md:inline text-[#1e1e2e]">|</span>
      <span>H100 avg: <span className="text-[#62DE61] font-mono">{fmt(h100Stats.avg)}</span>/hr</span>
      <span className="hidden sm:inline text-[#1e1e2e]">|</span>
      <span className="hidden sm:inline">Range: <span className="font-mono text-[#e2e2e8]">{fmt(h100Stats.min)}</span> – <span className="font-mono text-[#e2e2e8]">{fmt(h100Stats.max)}</span></span>
      <span className="ml-auto text-[#8888a0]/60 text-[9px] hidden md:inline">Market data via getdeploying.com · Baseline Apr 2026</span>
    </div>
  );
}

// ─── DEAL EVALUATOR ─────────────────────────────────────────────────────────

function DealEvaluator() {
  const [provider, setProvider] = useState('OCI');
  const [gpu, setGpu] = useState('H100');
  const [gpuCount, setGpuCount] = useState(64);
  const [term, setTerm] = useState('1yr');
  const [rate, setRate] = useState(2.50);
  const [utilization, setUtilization] = useState(70);
  const [sellPrice, setSellPrice] = useState(MODAL_SELL_PRICES['H100']);

  // Sync sell price when GPU changes
  useEffect(() => {
    setSellPrice(MODAL_SELL_PRICES[gpu] || 3.95);
  }, [gpu]);

  const hours = TERM_HOURS[term];
  const years = hours / 8760;

  const totalCost = gpuCount * hours * rate;
  const effectiveCostAtUtil = rate / (utilization / 100);
  const annualCommitment = totalCost / years;
  const revenue = gpuCount * hours * (utilization / 100) * sellPrice;
  const margin = revenue - totalCost;
  const marginPct = revenue > 0 ? margin / revenue : 0;
  const breakeven = sellPrice > 0 ? (rate / sellPrice) * 100 : 0;

  const providerOnDemand = PROVIDER_PRICING[provider]?.[gpu];
  const marketStats = getMarketStats(gpu);
  const savingsVsOnDemand = providerOnDemand ? (1 - rate / providerOnDemand) : null;
  const savingsVsAvg = marketStats.avg ? (1 - rate / marketStats.avg) : null;
  const savingsVsBest = marketStats.min ? (1 - rate / marketStats.min) : null;

  // Breakeven chart data
  const breakevenData = useMemo(() => {
    const points = [];
    for (let u = 0; u <= 100; u += 2) {
      const rev = gpuCount * hours * (u / 100) * sellPrice;
      const profit = rev - totalCost;
      points.push({ utilization: u, profit, revenue: rev, cost: totalCost });
    }
    return points;
  }, [gpuCount, hours, sellPrice, totalCost]);

  // Sensitivity table
  const sensitivityData = useMemo(() => {
    return [50, 60, 70, 80, 90, 100].map(u => {
      const rev = gpuCount * hours * (u / 100) * sellPrice;
      const prof = rev - totalCost;
      return { util: u, revenue: rev, profit: prof, margin: rev > 0 ? prof / rev : 0 };
    });
  }, [gpuCount, hours, sellPrice, totalCost]);

  // Comparison: top 5 alternatives for this GPU
  const alternatives = useMemo(() => {
    return PROVIDERS
      .filter(p => PROVIDER_PRICING[p][gpu] != null)
      .map(p => ({ provider: p, price: PROVIDER_PRICING[p][gpu] }))
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);
  }, [gpu]);

  const comparisonData = useMemo(() => {
    const items = alternatives.map(a => ({
      name: a.provider,
      price: a.price,
      fill: a.provider === provider ? '#62DE61' : '#3b82f6',
    }));
    items.push({ name: 'This Deal', price: rate, fill: '#f59e0b' });
    if (MODAL_SELL_PRICES[gpu]) {
      items.push({ name: 'Modal Sell', price: MODAL_SELL_PRICES[gpu], fill: '#8b5cf6' });
    }
    return items.sort((a, b) => a.price - b.price);
  }, [alternatives, provider, rate, gpu]);

  const applyPreset = (preset) => {
    setProvider(preset.provider);
    setGpu(preset.gpu);
    setGpuCount(preset.gpus);
    setTerm(preset.term);
    setRate(preset.rate);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-[#8888a0] self-center mr-2">Quick scenarios:</span>
        {DEAL_PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className="px-3 py-1.5 text-xs rounded border border-[#1e1e2e] bg-[#12121a] text-[#8888a0] hover:text-[#62DE61] hover:border-[#62DE61]/30 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input + Output Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
          <h3 className="text-sm font-semibold text-[#e2e2e8] flex items-center gap-2">
            <Calculator size={14} className="text-[#62DE61]" /> Deal Parameters
          </h3>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-[#8888a0]">Provider</span>
              <select value={provider} onChange={e => setProvider(e.target.value)}
                className="mt-1 w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded px-3 py-2 text-sm text-[#e2e2e8] focus:border-[#62DE61] focus:outline-none">
                {[...PROVIDERS, 'Voltage Park', 'Together AI', 'Nebius', 'FluidStack', 'TensorDock'].map(p => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-[#8888a0]">GPU Type</span>
              <select value={gpu} onChange={e => setGpu(e.target.value)}
                className="mt-1 w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded px-3 py-2 text-sm text-[#e2e2e8] focus:border-[#62DE61] focus:outline-none">
                {GPU_TYPES.map(g => <option key={g}>{g}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-[#8888a0]">Number of GPUs</span>
              <input type="number" value={gpuCount} onChange={e => setGpuCount(Math.max(1, +e.target.value))}
                className="mt-1 w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded px-3 py-2 text-sm font-mono text-[#e2e2e8] focus:border-[#62DE61] focus:outline-none" />
            </label>

            <label className="block">
              <span className="text-xs text-[#8888a0]">Contract Term</span>
              <select value={term} onChange={e => setTerm(e.target.value)}
                className="mt-1 w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded px-3 py-2 text-sm text-[#e2e2e8] focus:border-[#62DE61] focus:outline-none">
                {Object.keys(TERM_HOURS).map(t => <option key={t}>{t}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-[#8888a0]">Contracted $/GPU-hr</span>
              <input type="number" step="0.01" value={rate} onChange={e => setRate(Math.max(0, +e.target.value))}
                className="mt-1 w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded px-3 py-2 text-sm font-mono text-[#e2e2e8] focus:border-[#62DE61] focus:outline-none" />
            </label>

            <label className="block">
              <span className="text-xs text-[#8888a0]">Modal Sell Price $/GPU-hr</span>
              <input type="number" step="0.01" value={sellPrice} onChange={e => setSellPrice(Math.max(0, +e.target.value))}
                className="mt-1 w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded px-3 py-2 text-sm font-mono text-[#e2e2e8] focus:border-[#62DE61] focus:outline-none" />
            </label>

            <label className="block">
              <span className="text-xs text-[#8888a0] flex justify-between">
                Expected Utilization
                <span className="font-mono text-[#62DE61]">{utilization}%</span>
              </span>
              <input type="range" min="0" max="100" value={utilization} onChange={e => setUtilization(+e.target.value)}
                className="mt-2 w-full accent-[#62DE61]" />
            </label>
          </div>
        </div>

        {/* Outputs */}
        <div className="lg:col-span-8 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
              <div className="text-xs text-[#8888a0] mb-1">Total Contract Cost</div>
              <div className="text-lg font-mono font-bold text-[#e2e2e8]">{fmtCompact(totalCost)}</div>
              <div className="text-xs text-[#8888a0] mt-1">{fmtCompact(annualCommitment)}/yr</div>
            </div>
            <div className="p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
              <div className="text-xs text-[#8888a0] mb-1">Gross Revenue</div>
              <div className="text-lg font-mono font-bold text-[#3b82f6]">{fmtCompact(revenue)}</div>
              <div className="text-xs text-[#8888a0] mt-1">at {utilization}% util</div>
            </div>
            <div className={`p-4 rounded-lg border ${margin >= 0 ? 'bg-emerald-400/5 border-emerald-400/20' : 'bg-red-400/5 border-red-400/20'}`}>
              <div className="text-xs text-[#8888a0] mb-1">Gross Margin</div>
              <div className={`text-lg font-mono font-bold ${margin >= 0 ? 'text-[#62DE61]' : 'text-red-400'}`}>
                {fmtCompact(margin)}
              </div>
              <div className={`text-xs mt-1 ${margin >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>{fmtPct(marginPct)} margin</div>
            </div>
            <div className="p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
              <div className="text-xs text-[#8888a0] mb-1">Breakeven Util.</div>
              <div className={`text-lg font-mono font-bold ${breakeven < utilization ? 'text-[#62DE61]' : 'text-red-400'}`}>
                {breakeven.toFixed(1)}%
              </div>
              <div className="text-xs text-[#8888a0] mt-1">
                {breakeven < utilization ? `${(utilization - breakeven).toFixed(0)}pt buffer` : `${(breakeven - utilization).toFixed(0)}pt short`}
              </div>
            </div>
          </div>

          {/* Savings Comparison */}
          {(savingsVsOnDemand != null || savingsVsAvg != null) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {savingsVsOnDemand != null && (
                <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e] flex items-center gap-3">
                  <div className={`p-2 rounded ${savingsVsOnDemand > 0 ? 'bg-emerald-400/10' : 'bg-red-400/10'}`}>
                    {savingsVsOnDemand > 0 ? <TrendingDown size={16} className="text-[#62DE61]" /> : <TrendingUp size={16} className="text-red-400" />}
                  </div>
                  <div>
                    <div className="text-xs text-[#8888a0]">vs {provider} On-Demand</div>
                    <div className={`text-sm font-mono font-bold ${savingsVsOnDemand > 0 ? 'text-[#62DE61]' : 'text-red-400'}`}>
                      {savingsVsOnDemand > 0 ? '' : '+'}{fmtPct(-savingsVsOnDemand)} {savingsVsOnDemand > 0 ? 'savings' : 'premium'}
                    </div>
                  </div>
                </div>
              )}
              {savingsVsAvg != null && (
                <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e] flex items-center gap-3">
                  <div className={`p-2 rounded ${savingsVsAvg > 0 ? 'bg-emerald-400/10' : 'bg-red-400/10'}`}>
                    {savingsVsAvg > 0 ? <TrendingDown size={16} className="text-[#62DE61]" /> : <TrendingUp size={16} className="text-red-400" />}
                  </div>
                  <div>
                    <div className="text-xs text-[#8888a0]">vs Market Average</div>
                    <div className={`text-sm font-mono font-bold ${savingsVsAvg > 0 ? 'text-[#62DE61]' : 'text-red-400'}`}>
                      {savingsVsAvg > 0 ? '' : '+'}{fmtPct(-savingsVsAvg)} {savingsVsAvg > 0 ? 'savings' : 'premium'}
                    </div>
                  </div>
                </div>
              )}
              {savingsVsBest != null && (
                <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e] flex items-center gap-3">
                  <div className={`p-2 rounded ${savingsVsBest > 0 ? 'bg-emerald-400/10' : 'bg-yellow-400/10'}`}>
                    {savingsVsBest > 0 ? <TrendingDown size={16} className="text-[#62DE61]" /> : <TrendingUp size={16} className="text-yellow-400" />}
                  </div>
                  <div>
                    <div className="text-xs text-[#8888a0]">vs Best Available</div>
                    <div className={`text-sm font-mono font-bold ${savingsVsBest > 0 ? 'text-[#62DE61]' : 'text-yellow-400'}`}>
                      {savingsVsBest > 0 ? '' : '+'}{fmtPct(-savingsVsBest)} {savingsVsBest > 0 ? 'savings' : 'premium'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Breakeven Chart */}
            <div className="p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
              <h4 className="text-xs font-semibold text-[#8888a0] mb-3">Profit/Loss by Utilization</h4>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={breakevenData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#62DE61" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#62DE61" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                  <XAxis dataKey="utilization" tick={{ fontSize: 10, fill: '#8888a0' }} tickFormatter={v => v + '%'} />
                  <YAxis tick={{ fontSize: 10, fill: '#8888a0' }} tickFormatter={v => fmtCompact(v)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '12px' }}
                    labelFormatter={v => `${v}% utilization`}
                    formatter={(v) => [fmtCompact(v)]}
                  />
                  <ReferenceLine y={0} stroke="#8888a0" strokeDasharray="3 3" />
                  <ReferenceLine x={breakeven} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: `BE: ${breakeven.toFixed(0)}%`, fill: '#f59e0b', fontSize: 10 }} />
                  <ReferenceLine x={utilization} stroke="#62DE61" strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="profit" stroke="#62DE61" fill="url(#profitGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Comparison Bar Chart */}
            <div className="p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
              <h4 className="text-xs font-semibold text-[#8888a0] mb-3">Cost Comparison ($/GPU-hr)</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={comparisonData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#8888a0' }} tickFormatter={v => '$' + v.toFixed(2)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#8888a0' }} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v) => [fmt(v), '$/GPU-hr']}
                  />
                  <Bar dataKey="price" radius={[0, 4, 4, 0]}>
                    {comparisonData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sensitivity Table */}
          <div className="p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
            <h4 className="text-xs font-semibold text-[#8888a0] mb-3">Margin Sensitivity by Utilization</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#8888a0] border-b border-[#1e1e2e]">
                  <th className="text-left py-2 px-3">Utilization</th>
                  <th className="text-right py-2 px-3">Revenue</th>
                  <th className="text-right py-2 px-3">Profit/Loss</th>
                  <th className="text-right py-2 px-3">Margin %</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {sensitivityData.map(row => (
                  <tr key={row.util} className={`border-b border-[#1e1e2e]/50 ${row.util === utilization ? 'bg-[#62DE61]/5' : ''}`}>
                    <td className="py-2 px-3 font-mono text-[#e2e2e8]">
                      {row.util}%
                      {row.util === utilization && <span className="ml-2 text-[10px] text-[#62DE61]">current</span>}
                    </td>
                    <td className="text-right py-2 px-3 font-mono text-[#e2e2e8]">{fmtCompact(row.revenue)}</td>
                    <td className={`text-right py-2 px-3 font-mono font-bold ${row.profit >= 0 ? 'text-[#62DE61]' : 'text-red-400'}`}>
                      {fmtCompact(row.profit)}
                    </td>
                    <td className={`text-right py-2 px-3 font-mono ${row.margin >= 0 ? 'text-[#62DE61]' : 'text-red-400'}`}>
                      {fmtPct(row.margin)}
                    </td>
                    <td className="py-2 px-3">
                      {row.profit >= 0
                        ? <span className="text-[#62DE61] flex items-center gap-1"><CheckCircle size={12} /> Profitable</span>
                        : <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> Loss</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MARKET PRICES ──────────────────────────────────────────────────────────

function MarketPrices({ apiKey }) {
  const [pricingTier, setPricingTier] = useState('ondemand');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [liveData, setLiveData] = useState(() => {
    try {
      const cached = localStorage.getItem('gpu-pricing-cache');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [refreshing, setRefreshing] = useState(null);
  const [refreshError, setRefreshError] = useState(null);

  const displayGpus = GPU_TYPES;

  // Merge live data over baseline
  const getPricing = (provider, gpu) => {
    if (liveData?.prices?.[gpu]) {
      const liveEntry = liveData.prices[gpu].find(p => p.provider === provider);
      if (liveEntry?.perGpuHour != null) return liveEntry.perGpuHour;
    }
    return PROVIDER_PRICING[provider]?.[gpu] ?? null;
  };

  const getPrice = (provider, gpu) => {
    const base = getPricing(provider, gpu);
    if (base == null) return null;
    if (pricingTier === 'reserved') return base * (1 - (RESERVED_DISCOUNTS[provider] || 0));
    if (pricingTier === 'spot') return base * 0.6;
    return base;
  };

  const refreshPricing = async (gpuType) => {
    if (!apiKey) { setRefreshError('Set your Anthropic API key in the header first'); return; }
    setRefreshing(gpuType);
    setRefreshError(null);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
          messages: [{
            role: 'user',
            content: `Search getdeploying.com for current NVIDIA ${gpuType} GPU cloud pricing. Find per-GPU-hour on-demand prices from all listed providers. Return ONLY valid JSON, no markdown, no explanation, no backticks: {"gpu":"${gpuType}","prices":[{"provider":"AWS","perGpuHour":3.93},{"provider":"Lambda Labs","perGpuHour":2.49}],"source":"getdeploying.com","asOf":"${new Date().toISOString().slice(0, 10)}"}`
          }],
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error ${response.status}`);
      }
      const data = await response.json();
      const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      // Merge into existing live data
      setLiveData(prev => {
        const merged = {
          prices: { ...(prev?.prices || {}), [gpuType]: parsed.prices },
          refreshedAt: Date.now(),
          source: 'getdeploying.com',
        };
        localStorage.setItem('gpu-pricing-cache', JSON.stringify(merged));
        return merged;
      });
    } catch (err) {
      setRefreshError(`${gpuType}: ${err.message}`);
    } finally {
      setRefreshing(null);
    }
  };

  const refreshAll = async () => {
    for (const gpu of ['H100', 'H200', 'B200', 'A100 80GB']) {
      await refreshPricing(gpu);
    }
  };

  const cacheAge = liveData?.refreshedAt ? Date.now() - liveData.refreshedAt : null;
  const freshnessColor = !cacheAge ? 'text-[#8888a0]' : cacheAge < 86400000 ? 'text-[#62DE61]' : cacheAge < 259200000 ? 'text-[#f59e0b]' : 'text-red-400';
  const freshnessLabel = !cacheAge ? 'Baseline' : cacheAge < 86400000 ? 'Fresh' : cacheAge < 259200000 ? 'Aging' : 'Stale';

  const sortedProviders = useMemo(() => {
    if (!sortCol) return PROVIDERS;
    return [...PROVIDERS].sort((a, b) => {
      const av = getPrice(a, sortCol) ?? 999;
      const bv = getPrice(b, sortCol) ?? 999;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [sortCol, sortDir, pricingTier]);

  const handleSort = (gpu) => {
    if (sortCol === gpu) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(gpu); setSortDir('asc'); }
  };

  // Best price per GPU for margin calc
  const bestPrices = useMemo(() => {
    const result = {};
    GPU_TYPES.forEach(gpu => {
      const prices = PROVIDERS.map(p => getPrice(p, gpu)).filter(p => p != null);
      result[gpu] = prices.length ? Math.min(...prices) : null;
    });
    return result;
  }, [pricingTier]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-[#1e1e2e] overflow-hidden">
            {['ondemand', 'reserved', 'spot'].map(t => (
              <button key={t} onClick={() => setPricingTier(t)}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  pricingTier === t ? 'bg-[#62DE61]/10 text-[#62DE61]' : 'bg-[#12121a] text-[#8888a0] hover:text-[#e2e2e8]'
                }`}>
                {t === 'ondemand' ? 'On-Demand' : t === 'reserved' ? 'Reserved (1yr est.)' : 'Spot (est.)'}
              </button>
            ))}
          </div>
          {pricingTier !== 'ondemand' && (
            <span className="text-[10px] text-[#8888a0] italic">Estimated from typical discount ranges</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-[10px] ${freshnessColor}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${freshnessColor.replace('text-', 'bg-')}`} />
            {freshnessLabel}
            {cacheAge && <span className="text-[#8888a0]">({Math.round(cacheAge / 3600000)}h ago)</span>}
          </div>
          <button
            onClick={refreshAll}
            disabled={!!refreshing || !apiKey}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors ${
              apiKey
                ? 'border-[#62DE61]/30 text-[#62DE61] hover:bg-[#62DE61]/10'
                : 'border-[#1e1e2e] text-[#8888a0] cursor-not-allowed'
            }`}
          >
            {refreshing
              ? <><Loader2 size={12} className="animate-spin" /> Refreshing {refreshing}...</>
              : <><RefreshCw size={12} /> Refresh Prices</>
            }
          </button>
        </div>
      </div>
      {refreshError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-red-400/10 border border-red-400/20 text-xs text-red-400">
          <AlertTriangle size={12} /> {refreshError}
        </div>
      )}
      {!apiKey && (
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-[#1e1e2e]/50 text-[10px] text-[#8888a0]">
          <Key size={10} /> Set your Anthropic API key in the header to enable live price refresh from getdeploying.com
        </div>
      )}

      {/* Pricing Matrix */}
      <div className="rounded-lg border border-[#1e1e2e] overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#12121a]">
              <th className="text-left py-3 px-4 text-[#8888a0] font-medium sticky left-0 bg-[#12121a] z-10">Provider</th>
              {displayGpus.map(gpu => (
                <th key={gpu}
                  onClick={() => handleSort(gpu)}
                  className="text-right py-3 px-3 text-[#8888a0] font-medium cursor-pointer hover:text-[#e2e2e8] transition-colors whitespace-nowrap">
                  {gpu} {sortCol === gpu && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Modal Sell Price Row */}
            <tr className="border-b-2 border-[#62DE61]/20 bg-[#62DE61]/5">
              <td className="py-2.5 px-4 font-medium text-[#62DE61] sticky left-0 bg-[#62DE61]/5 z-10 flex items-center gap-1.5">
                <Zap size={12} /> Modal Sell
              </td>
              {displayGpus.map(gpu => (
                <td key={gpu} className="text-right py-2.5 px-3 font-mono font-bold text-[#62DE61]">
                  {MODAL_SELL_PRICES[gpu] ? fmt(MODAL_SELL_PRICES[gpu]) : '—'}
                </td>
              ))}
            </tr>

            {/* Provider Rows */}
            {sortedProviders.map(provider => (
              <tr key={provider} className="border-b border-[#1e1e2e]/50 hover:bg-[#1e1e2e]/30 transition-colors">
                <td className="py-2.5 px-4 text-[#e2e2e8] font-medium sticky left-0 bg-[#0a0a0f] z-10">
                  {provider}
                  {provider === 'OCI' && <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-[#62DE61]/10 text-[#62DE61]">Partner</span>}
                </td>
                {displayGpus.map(gpu => {
                  const price = getPrice(provider, gpu);
                  const cellColor = getCellColor(price, MODAL_SELL_PRICES[gpu]);
                  return (
                    <td key={gpu} className={`text-right py-2.5 px-3 font-mono ${cellColor}`}>
                      {price != null ? fmt(price) : <span className="text-[#1e1e2e]">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Best Available Row */}
            <tr className="border-t-2 border-[#1e1e2e] bg-[#12121a]">
              <td className="py-2.5 px-4 text-[#8888a0] font-medium sticky left-0 bg-[#12121a] z-10">Best Available</td>
              {displayGpus.map(gpu => (
                <td key={gpu} className="text-right py-2.5 px-3 font-mono font-bold text-[#3b82f6]">
                  {bestPrices[gpu] != null ? fmt(bestPrices[gpu]) : '—'}
                </td>
              ))}
            </tr>

            {/* Estimated Margin Row */}
            <tr className="bg-[#12121a]">
              <td className="py-2.5 px-4 text-[#8888a0] font-medium sticky left-0 bg-[#12121a] z-10">Est. Margin</td>
              {displayGpus.map(gpu => {
                const sell = MODAL_SELL_PRICES[gpu];
                const best = bestPrices[gpu];
                const margin = (sell && best) ? sell - best : null;
                const pct = (sell && best) ? ((sell - best) / sell) : null;
                return (
                  <td key={gpu} className={`text-right py-2.5 px-3 font-mono font-bold ${margin != null && margin > 0 ? 'text-[#62DE61]' : 'text-red-400'}`}>
                    {margin != null ? (
                      <div>
                        <div>{fmt(margin)}</div>
                        <div className="text-[10px] opacity-70">{fmtPct(pct)}</div>
                      </div>
                    ) : '—'}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Attribution */}
      <div className="flex items-center gap-2 text-[10px] text-[#8888a0]/60">
        <Info size={10} />
        Market pricing via getdeploying.com. Baseline data Apr 2026. Verify with provider before procurement decisions.
      </div>
    </div>
  );
}

// ─── SUPPLIER SCORECARD ─────────────────────────────────────────────────────

function SupplierScorecard() {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [sortBy, setSortBy] = useState('score');
  const [selectedProvider, setSelectedProvider] = useState(null);

  const scored = useMemo(() => {
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    return SUPPLIER_DATA.map(s => {
      const score =
        (s.price * weights.price + s.availability * weights.availability +
         s.networking * weights.networking + s.sla * weights.sla +
         s.flexibility * weights.flexibility + s.geo * weights.geo +
         s.modalFit * weights.modalFit) / totalWeight;
      return { ...s, score: score.toFixed(1) };
    }).sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b[sortBy] - a[sortBy];
    });
  }, [weights, sortBy]);

  const radarData = useMemo(() => {
    if (!selectedProvider) return [];
    const s = SUPPLIER_DATA.find(p => p.name === selectedProvider);
    if (!s) return [];
    return [
      { dim: 'Price', value: s.price },
      { dim: 'Availability', value: s.availability },
      { dim: 'Networking', value: s.networking },
      { dim: 'SLA', value: s.sla },
      { dim: 'Flexibility', value: s.flexibility },
      { dim: 'Geo', value: s.geo },
      { dim: 'Modal Fit', value: s.modalFit },
    ];
  }, [selectedProvider]);

  const updateWeight = (key, newVal) => {
    setWeights(prev => {
      const clamped = Math.max(0, Math.min(100, Math.round(+newVal)));
      const remaining = 100 - clamped;
      const otherKeys = Object.keys(prev).filter(k => k !== key);
      const sumOthers = otherKeys.reduce((s, k) => s + prev[k], 0);

      const next = { ...prev, [key]: clamped };
      if (sumOthers === 0) {
        // Edge case: all others are 0, distribute equally
        const each = Math.floor(remaining / otherKeys.length);
        otherKeys.forEach(k => { next[k] = each; });
        // Fix rounding remainder on first key
        next[otherKeys[0]] += remaining - each * otherKeys.length;
      } else {
        // Proportionally scale others
        let assigned = 0;
        otherKeys.forEach((k, i) => {
          if (i === otherKeys.length - 1) {
            next[k] = remaining - assigned; // last one absorbs rounding drift
          } else {
            const scaled = Math.round(prev[k] * remaining / sumOthers);
            next[k] = scaled;
            assigned += scaled;
          }
        });
      }
      return next;
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weight Controls */}
        <div className="lg:col-span-3 p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e] space-y-3">
          <h3 className="text-xs font-semibold text-[#e2e2e8] flex items-center gap-2">
            <Percent size={14} className="text-[#62DE61]" /> Dimension Weights
          </h3>
          {Object.entries(DIMENSION_LABELS).map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-[10px] text-[#8888a0] flex justify-between">
                {label}
                <span className="font-mono text-[#e2e2e8]">{weights[key]}%</span>
              </span>
              <input type="range" min="0" max="100" value={weights[key]}
                onChange={e => updateWeight(key, e.target.value)}
                className="w-full accent-[#62DE61] mt-1" />
            </label>
          ))}
          <button onClick={() => setWeights(DEFAULT_WEIGHTS)}
            className="w-full mt-2 px-3 py-1.5 text-xs rounded border border-[#1e1e2e] text-[#8888a0] hover:text-[#e2e2e8] transition-colors">
            Reset Defaults
          </button>
        </div>

        {/* Scorecard Grid + Radar */}
        <div className="lg:col-span-9 space-y-4">
          {/* Provider Cards */}
          <div className="grid grid-cols-1 gap-3">
            {scored.map((s, i) => (
              <button
                key={s.name}
                onClick={() => setSelectedProvider(sel => sel === s.name ? null : s.name)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  selectedProvider === s.name
                    ? 'bg-[#62DE61]/5 border-[#62DE61]/30'
                    : 'bg-[#12121a] border-[#1e1e2e] hover:border-[#62DE61]/20'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#8888a0] w-5">#{i + 1}</span>
                      <span className="text-sm font-semibold text-[#e2e2e8]">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1e2e] text-[#8888a0]">{s.category}</span>
                      {s.badge === 'Current Partner' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#62DE61]/10 text-[#62DE61]">Current Partner</span>
                      )}
                      {s.badge === 'Marketplace' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3b82f6]/10 text-[#3b82f6]">Marketplace</span>
                      )}
                    </div>
                  </div>
                  <div className={`text-xl font-mono font-bold ${+s.score >= 7 ? 'text-[#62DE61]' : +s.score >= 5 ? 'text-[#f59e0b]' : 'text-red-400'}`}>
                    {s.score}
                  </div>
                </div>

                {/* Dimension scores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
                  {['price', 'availability', 'networking', 'sla', 'flexibility', 'geo', 'modalFit'].map(dim => (
                    <div key={dim} className="flex items-center gap-2">
                      <span className="text-[10px] text-[#8888a0] w-20 shrink-0">{DIMENSION_LABELS[dim]}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[#1e1e2e] overflow-hidden">
                        <div className="h-full rounded-full bg-[#62DE61]" style={{ width: `${s[dim] * 10}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-[#e2e2e8] w-8 text-right">{s[dim]}/10</span>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-[#8888a0] mt-2 line-clamp-1">{s.notes}</p>
              </button>
            ))}
          </div>

          {/* Radar Chart */}
          {selectedProvider && radarData.length > 0 && (
            <div className="p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
              <h4 className="text-xs font-semibold text-[#8888a0] mb-3">{selectedProvider} — Dimension Profile</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1e1e2e" />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: '#8888a0' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 9, fill: '#8888a0' }} />
                  <Radar name={selectedProvider} dataKey="value" stroke="#62DE61" fill="#62DE61" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MARKET TRENDS ──────────────────────────────────────────────────────────

function MarketTrends() {
  // Multi-GPU price comparison data
  const gpuComparisonData = useMemo(() => {
    return GPU_TYPES.map(gpu => {
      const stats = getMarketStats(gpu);
      return {
        gpu,
        min: stats.min,
        max: stats.max,
        avg: stats.avg,
        modal: MODAL_SELL_PRICES[gpu],
        range: stats.max && stats.min ? stats.max - stats.min : 0,
      };
    }).filter(d => d.avg != null);
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* H100 Price History */}
      <div className="p-5 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
        <h3 className="text-sm font-semibold text-[#e2e2e8] mb-4">H100 On-Demand Price Trajectory</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={H100_PRICE_HISTORY} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8888a0' }} />
            <YAxis tick={{ fontSize: 10, fill: '#8888a0' }} tickFormatter={v => '$' + v} domain={[0, 'auto']} />
            <Tooltip
              contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '12px' }}
              formatter={(v) => [fmt(v), '']}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Line type="monotone" dataKey="AWS" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="GCP" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Lambda" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="RunPod" stroke="#06b6d4" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="avg" stroke="#62DE61" strokeWidth={3} dot={false} name="Market Avg" strokeDasharray="5 5" />
            <ReferenceLine y={3.95} stroke="#62DE61" strokeDasharray="3 3" label={{ value: 'Modal Sell $3.95', fill: '#62DE61', fontSize: 10, position: 'right' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Multi-GPU Price Range */}
        <div className="p-5 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
          <h3 className="text-sm font-semibold text-[#e2e2e8] mb-1">Current Market Range by GPU</h3>
          <p className="text-[10px] text-[#8888a0] mb-3">On-demand $/GPU-hr across all tracked providers · Baseline Apr 2026</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gpuComparisonData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="gpu" tick={{ fontSize: 9, fill: '#8888a0' }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10, fill: '#8888a0' }} tickFormatter={v => '$' + v} />
              <Tooltip
                contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v, name) => [fmt(v), name]}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="min" name="Min" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="avg" name="Avg" fill="#8888a0" radius={[2, 2, 0, 0]} />
              <Bar dataKey="max" name="Max" fill="#ef4444" radius={[2, 2, 0, 0]} />
              <Bar dataKey="modal" name="Modal Sell" fill="#62DE61" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance/$ Index */}
        <div className="p-5 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
          <h3 className="text-sm font-semibold text-[#e2e2e8] mb-1">GPU Generation Value (FP8 TFLOPS/$)</h3>
          <p className="text-[10px] text-[#8888a0] mb-3">Higher = more compute per dollar · Based on typical market $/hr at median on-demand rates</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={GPU_PERF_VALUE} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="gpu" tick={{ fontSize: 10, fill: '#8888a0' }} />
              <YAxis tick={{ fontSize: 10, fill: '#8888a0' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v, name) => {
                  if (name === 'tflopsPerDollar') return [v.toLocaleString(), 'TFLOPS/$'];
                  return [v, name];
                }}
              />
              <Bar dataKey="tflopsPerDollar" name="TFLOPS/$" radius={[4, 4, 0, 0]}>
                {GPU_PERF_VALUE.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Market Signals */}
      <div>
        <h3 className="text-sm font-semibold text-[#e2e2e8] mb-3 flex items-center gap-2">
          <AlertTriangle size={14} className="text-[#f59e0b]" /> Market Intelligence Signals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MARKET_SIGNALS.map((signal, i) => {
            const colors = severityColors[signal.severity];
            return (
              <div key={i} className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors.dot}`} />
                  <div>
                    <h4 className={`text-sm font-semibold ${colors.text}`}>{signal.title}</h4>
                    <p className="text-xs text-[#8888a0] mt-1 leading-relaxed">{signal.summary}</p>
                    <p className="text-[10px] text-[#8888a0]/50 mt-1.5">{signal.source} · {signal.date}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GPU Specs Reference */}
      <div className="p-5 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
        <h3 className="text-sm font-semibold text-[#e2e2e8] mb-3 flex items-center gap-2">
          <Cpu size={14} className="text-[#3b82f6]" /> NVIDIA GPU Specs Reference
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#8888a0] border-b border-[#1e1e2e]">
                <th className="text-left py-2 px-3">GPU</th>
                <th className="text-left py-2 px-3">Architecture</th>
                <th className="text-right py-2 px-3">VRAM</th>
                <th className="text-left py-2 px-3">Memory</th>
                <th className="text-right py-2 px-3">Bandwidth</th>
                <th className="text-right py-2 px-3">FP8</th>
                <th className="text-right py-2 px-3">FP16</th>
                <th className="text-right py-2 px-3">TDP</th>
                <th className="text-left py-2 px-3">Interconnect</th>
                <th className="text-right py-2 px-3">Purchase $</th>
              </tr>
            </thead>
            <tbody>
              {GPU_SPECS.map(spec => (
                <tr key={spec.gpu} className="border-b border-[#1e1e2e]/50 hover:bg-[#1e1e2e]/20">
                  <td className="py-2 px-3 font-medium text-[#e2e2e8]">{spec.gpu}</td>
                  <td className="py-2 px-3 text-[#8888a0]">{spec.arch}</td>
                  <td className="py-2 px-3 text-right font-mono text-[#e2e2e8]">{spec.vram}</td>
                  <td className="py-2 px-3 text-[#8888a0]">{spec.memType}</td>
                  <td className="py-2 px-3 text-right font-mono text-[#8888a0]">{spec.bw}</td>
                  <td className="py-2 px-3 text-right font-mono text-[#e2e2e8]">{spec.fp8.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono text-[#8888a0]">{spec.fp16.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono text-[#8888a0]">{spec.tdp}</td>
                  <td className="py-2 px-3 text-[#8888a0]">{spec.interconnect}</td>
                  <td className="py-2 px-3 text-right font-mono text-[#8888a0]">{spec.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PORTFOLIO & CAPACITY PLANNER ───────────────────────────────────────────

const DEFAULT_PORTFOLIO = [
  { id: 1, provider: 'OCI', gpu: 'H100', gpus: 128, rate: 2.80, term: '1yr', utilization: 75 },
  { id: 2, provider: 'CoreWeave', gpu: 'B200', gpus: 64, rate: 3.80, term: '1yr', utilization: 65 },
  { id: 3, provider: 'Lambda', gpu: 'H200', gpus: 32, rate: 3.50, term: '6mo', utilization: 80 },
];

let nextContractId = 100;

function Portfolio() {
  const [contracts, setContracts] = useState(DEFAULT_PORTFOLIO);
  const [demandMultiplier, setDemandMultiplier] = useState(1.0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContract, setNewContract] = useState({
    provider: 'OCI', gpu: 'H100', gpus: 64, rate: 2.50, term: '1yr', utilization: 70,
  });

  const addContract = () => {
    setContracts(c => [...c, { ...newContract, id: nextContractId++ }]);
    setShowAddForm(false);
  };

  const removeContract = (id) => {
    setContracts(c => c.filter(x => x.id !== id));
  };

  // Portfolio-level analytics
  const analytics = useMemo(() => {
    let totalCost = 0;
    let totalRevenue = 0;
    let totalGpuHours = 0;
    let totalUtilizedHours = 0;
    const byGpu = {};
    const byProvider = {};

    contracts.forEach(c => {
      const hours = TERM_HOURS[c.term];
      const cost = c.gpus * hours * c.rate;
      const sell = MODAL_SELL_PRICES[c.gpu] || 0;
      const rev = c.gpus * hours * (c.utilization / 100) * sell;
      const gpuHours = c.gpus * hours;

      totalCost += cost;
      totalRevenue += rev;
      totalGpuHours += gpuHours;
      totalUtilizedHours += gpuHours * (c.utilization / 100);

      // By GPU
      if (!byGpu[c.gpu]) byGpu[c.gpu] = { gpus: 0, cost: 0, revenue: 0, hours: 0 };
      byGpu[c.gpu].gpus += c.gpus;
      byGpu[c.gpu].cost += cost;
      byGpu[c.gpu].revenue += rev;
      byGpu[c.gpu].hours += gpuHours;

      // By provider
      if (!byProvider[c.provider]) byProvider[c.provider] = { gpus: 0, cost: 0, contracts: 0 };
      byProvider[c.provider].gpus += c.gpus;
      byProvider[c.provider].cost += cost;
      byProvider[c.provider].contracts += 1;
    });

    const totalMargin = totalRevenue - totalCost;
    const marginPct = totalRevenue > 0 ? totalMargin / totalRevenue : 0;
    const blendedUtil = totalGpuHours > 0 ? totalUtilizedHours / totalGpuHours : 0;
    const monthlyBurn = totalCost / 12; // Annualized assumption for mixed terms

    return { totalCost, totalRevenue, totalMargin, marginPct, blendedUtil, monthlyBurn, byGpu, byProvider, totalGpuHours };
  }, [contracts]);

  // Capacity forecast with demand multiplier
  const capacityData = useMemo(() => {
    const quarters = ['Now', '+3mo', '+6mo', '+9mo', '+12mo'];
    return quarters.map((label, i) => {
      const growth = Math.pow(demandMultiplier, i / 4);
      const demanded = {};
      const committed = {};

      contracts.forEach(c => {
        const termMonths = { '1mo': 1, '3mo': 3, '6mo': 6, '1yr': 12, '3yr': 36 };
        const months = termMonths[c.term];
        const stillActive = (i * 3) < months;
        if (!committed[c.gpu]) committed[c.gpu] = 0;
        if (stillActive) committed[c.gpu] += c.gpus;
      });

      // Demand = current utilized capacity * growth
      contracts.forEach(c => {
        if (!demanded[c.gpu]) demanded[c.gpu] = 0;
        demanded[c.gpu] += c.gpus * (c.utilization / 100) * growth;
      });

      return { label, demanded, committed };
    });
  }, [contracts, demandMultiplier]);

  // Bar chart data for provider concentration
  const providerChartData = useMemo(() => {
    return Object.entries(analytics.byProvider)
      .map(([name, d]) => ({ name, cost: d.cost, gpus: d.gpus, contracts: d.contracts }))
      .sort((a, b) => b.cost - a.cost);
  }, [analytics]);

  // GPU allocation pie-style data (horizontal bar)
  const gpuAllocData = useMemo(() => {
    return Object.entries(analytics.byGpu)
      .map(([gpu, d]) => ({
        gpu,
        gpus: d.gpus,
        cost: d.cost,
        revenue: d.revenue,
        margin: d.revenue - d.cost,
        marginPct: d.revenue > 0 ? (d.revenue - d.cost) / d.revenue : 0,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [analytics]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
          <div className="text-[10px] text-[#8888a0] mb-1">Total Contracts</div>
          <div className="text-xl font-mono font-bold text-[#e2e2e8]">{contracts.length}</div>
        </div>
        <div className="p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
          <div className="text-[10px] text-[#8888a0] mb-1">Annual Commitment</div>
          <div className="text-xl font-mono font-bold text-[#e2e2e8]">{fmtCompact(analytics.totalCost)}</div>
        </div>
        <div className="p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
          <div className="text-[10px] text-[#8888a0] mb-1">Projected Revenue</div>
          <div className="text-xl font-mono font-bold text-[#3b82f6]">{fmtCompact(analytics.totalRevenue)}</div>
        </div>
        <div className={`p-4 rounded-lg border ${analytics.totalMargin >= 0 ? 'bg-emerald-400/5 border-emerald-400/20' : 'bg-red-400/5 border-red-400/20'}`}>
          <div className="text-[10px] text-[#8888a0] mb-1">Portfolio Margin</div>
          <div className={`text-xl font-mono font-bold ${analytics.totalMargin >= 0 ? 'text-[#62DE61]' : 'text-red-400'}`}>{fmtCompact(analytics.totalMargin)}</div>
          <div className={`text-[10px] mt-0.5 ${analytics.totalMargin >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>{fmtPct(analytics.marginPct)}</div>
        </div>
        <div className="p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
          <div className="text-[10px] text-[#8888a0] mb-1">Monthly Burn</div>
          <div className="text-xl font-mono font-bold text-[#f59e0b]">{fmtCompact(analytics.monthlyBurn)}</div>
        </div>
        <div className="p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
          <div className="text-[10px] text-[#8888a0] mb-1">Blended Utilization</div>
          <div className={`text-xl font-mono font-bold ${analytics.blendedUtil >= 0.7 ? 'text-[#62DE61]' : analytics.blendedUtil >= 0.5 ? 'text-[#f59e0b]' : 'text-red-400'}`}>
            {(analytics.blendedUtil * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Contract Book */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-lg bg-[#12121a] border border-[#1e1e2e] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#e2e2e8] flex items-center gap-2">
                <Briefcase size={14} className="text-[#62DE61]" /> Contract Book
              </h3>
              <button onClick={() => setShowAddForm(f => !f)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-[#62DE61]/30 text-[#62DE61] hover:bg-[#62DE61]/10 transition-colors">
                <Plus size={12} /> Add Contract
              </button>
            </div>

            {/* Add form */}
            {showAddForm && (
              <div className="px-4 py-3 border-b border-[#1e1e2e] bg-[#0a0a0f]">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <select value={newContract.provider} onChange={e => setNewContract(n => ({ ...n, provider: e.target.value }))}
                    className="bg-[#12121a] border border-[#1e1e2e] rounded px-2 py-1.5 text-xs text-[#e2e2e8] focus:border-[#62DE61] focus:outline-none">
                    {[...PROVIDERS, 'Voltage Park', 'Together AI', 'Nebius', 'FluidStack', 'TensorDock'].map(p => <option key={p}>{p}</option>)}
                  </select>
                  <select value={newContract.gpu} onChange={e => setNewContract(n => ({ ...n, gpu: e.target.value }))}
                    className="bg-[#12121a] border border-[#1e1e2e] rounded px-2 py-1.5 text-xs text-[#e2e2e8] focus:border-[#62DE61] focus:outline-none">
                    {GPU_TYPES.map(g => <option key={g}>{g}</option>)}
                  </select>
                  <input type="number" placeholder="GPUs" value={newContract.gpus} onChange={e => setNewContract(n => ({ ...n, gpus: Math.max(1, +e.target.value) }))}
                    className="bg-[#12121a] border border-[#1e1e2e] rounded px-2 py-1.5 text-xs font-mono text-[#e2e2e8] focus:border-[#62DE61] focus:outline-none" />
                  <input type="number" step="0.01" placeholder="$/hr" value={newContract.rate} onChange={e => setNewContract(n => ({ ...n, rate: Math.max(0, +e.target.value) }))}
                    className="bg-[#12121a] border border-[#1e1e2e] rounded px-2 py-1.5 text-xs font-mono text-[#e2e2e8] focus:border-[#62DE61] focus:outline-none" />
                  <select value={newContract.term} onChange={e => setNewContract(n => ({ ...n, term: e.target.value }))}
                    className="bg-[#12121a] border border-[#1e1e2e] rounded px-2 py-1.5 text-xs text-[#e2e2e8] focus:border-[#62DE61] focus:outline-none">
                    {Object.keys(TERM_HOURS).map(t => <option key={t}>{t}</option>)}
                  </select>
                  <button onClick={addContract}
                    className="px-3 py-1.5 text-xs rounded bg-[#62DE61]/10 text-[#62DE61] border border-[#62DE61]/30 hover:bg-[#62DE61]/20 transition-colors">
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Contract rows */}
            <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="text-[#8888a0] border-b border-[#1e1e2e]">
                  <th className="text-left py-2 px-4">Provider</th>
                  <th className="text-left py-2 px-3">GPU</th>
                  <th className="text-right py-2 px-3">Count</th>
                  <th className="text-right py-2 px-3">Rate</th>
                  <th className="text-center py-2 px-3">Term</th>
                  <th className="text-right py-2 px-3">Util.</th>
                  <th className="text-right py-2 px-3">Annual Cost</th>
                  <th className="text-right py-2 px-3">Margin</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {contracts.map(c => {
                  const hours = TERM_HOURS[c.term];
                  const cost = c.gpus * hours * c.rate;
                  const sell = MODAL_SELL_PRICES[c.gpu] || 0;
                  const rev = c.gpus * hours * (c.utilization / 100) * sell;
                  const margin = rev - cost;
                  const marginPct = rev > 0 ? margin / rev : 0;
                  return (
                    <tr key={c.id} className="border-b border-[#1e1e2e]/50 hover:bg-[#1e1e2e]/20 transition-colors">
                      <td className="py-2.5 px-4 text-[#e2e2e8] font-medium">
                        {c.provider}
                        {c.provider === 'OCI' && <span className="ml-1.5 text-[8px] px-1 py-0.5 rounded bg-[#62DE61]/10 text-[#62DE61]">Partner</span>}
                      </td>
                      <td className="py-2.5 px-3 text-[#e2e2e8]">{c.gpu}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#e2e2e8]">{c.gpus}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#e2e2e8]">{fmt(c.rate)}</td>
                      <td className="py-2.5 px-3 text-center text-[#8888a0]">{c.term}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#8888a0]">{c.utilization}%</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#e2e2e8]">{fmtCompact(cost)}</td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${margin >= 0 ? 'text-[#62DE61]' : 'text-red-400'}`}>
                        {fmtPct(marginPct)}
                      </td>
                      <td className="py-2.5 px-2">
                        <button onClick={() => removeContract(c.id)} className="text-[#8888a0] hover:text-red-400 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

          {/* GPU Allocation Breakdown */}
          <div className="rounded-lg bg-[#12121a] border border-[#1e1e2e] p-4">
            <h4 className="text-xs font-semibold text-[#8888a0] mb-3">Margin by GPU Type</h4>
            <div className="space-y-2.5">
              {gpuAllocData.map(d => (
                <div key={d.gpu} className="flex items-center gap-3">
                  <span className="text-xs text-[#e2e2e8] w-24 shrink-0 font-medium">{d.gpu}</span>
                  <span className="text-[10px] font-mono text-[#8888a0] w-16 shrink-0">{d.gpus} GPUs</span>
                  <div className="flex-1 h-2 rounded-full bg-[#1e1e2e] overflow-hidden">
                    <div className={`h-full rounded-full ${d.margin >= 0 ? 'bg-[#62DE61]' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(100, Math.abs(d.marginPct) * 100)}%` }} />
                  </div>
                  <span className={`text-xs font-mono w-20 text-right ${d.margin >= 0 ? 'text-[#62DE61]' : 'text-red-400'}`}>
                    {fmtCompact(d.margin)}
                  </span>
                  <span className={`text-[10px] font-mono w-12 text-right ${d.margin >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                    {fmtPct(d.marginPct)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Charts + Capacity Forecast */}
        <div className="lg:col-span-5 space-y-4">
          {/* Provider Concentration */}
          <div className="p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
            <h4 className="text-xs font-semibold text-[#8888a0] mb-3">Spend by Provider</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={providerChartData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#8888a0' }} tickFormatter={v => fmtCompact(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#8888a0' }} width={75} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v) => [fmtCompact(v), 'Annual Cost']}
                />
                <Bar dataKey="cost" fill="#62DE61" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Capacity Forecast */}
          <div className="p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-[#8888a0]">Capacity Forecast</h4>
              <label className="flex items-center gap-2 text-[10px] text-[#8888a0]">
                Demand growth
                <select value={demandMultiplier} onChange={e => setDemandMultiplier(+e.target.value)}
                  className="bg-[#0a0a0f] border border-[#1e1e2e] rounded px-2 py-1 text-[10px] text-[#e2e2e8] focus:border-[#62DE61] focus:outline-none">
                  <option value={1.0}>Flat (1x)</option>
                  <option value={1.5}>1.5x / yr</option>
                  <option value={2.0}>2x / yr</option>
                  <option value={3.0}>3x / yr</option>
                </select>
              </label>
            </div>
            {/* Capacity table by GPU type over time */}
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#8888a0] border-b border-[#1e1e2e]">
                  <th className="text-left py-2 px-2">GPU</th>
                  {capacityData.map(q => (
                    <th key={q.label} className="text-center py-2 px-2">{q.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(analytics.byGpu).map(gpu => (
                  <tr key={gpu} className="border-b border-[#1e1e2e]/50">
                    <td className="py-2 px-2 text-[#e2e2e8] font-medium">{gpu}</td>
                    {capacityData.map(q => {
                      const committed = q.committed[gpu] || 0;
                      const demanded = Math.ceil(q.demanded[gpu] || 0);
                      const gap = committed - demanded;
                      return (
                        <td key={q.label} className="py-2 px-2 text-center">
                          <div className="font-mono text-[#e2e2e8]">{committed}</div>
                          <div className={`text-[10px] font-mono ${gap >= 0 ? 'text-[#62DE61]' : 'text-red-400'}`}>
                            {demanded > 0 && (gap >= 0 ? `+${gap} buffer` : `${gap} short`)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {demandMultiplier > 1 && (
              <p className="text-[10px] text-[#8888a0]/60 mt-2 italic">
                Projecting {demandMultiplier}x annual demand growth from current utilized capacity. "Short" = demand exceeds committed GPUs — new contracts needed.
              </p>
            )}
          </div>

          {/* Risk Callouts */}
          <div className="space-y-2">
            {(() => {
              const risks = [];
              // Single-provider concentration
              const topProvider = providerChartData[0];
              if (topProvider && analytics.totalCost > 0 && topProvider.cost / analytics.totalCost > 0.5) {
                risks.push({ severity: 'yellow', text: `${topProvider.name} represents ${((topProvider.cost / analytics.totalCost) * 100).toFixed(0)}% of total spend. Consider diversifying.` });
              }
              // Low utilization
              if (analytics.blendedUtil < 0.6) {
                risks.push({ severity: 'red', text: `Blended utilization at ${(analytics.blendedUtil * 100).toFixed(0)}% — below 60% threshold. Review demand forecasts before adding capacity.` });
              }
              // Negative margin
              if (analytics.totalMargin < 0) {
                risks.push({ severity: 'red', text: `Portfolio is margin-negative at current utilization. Need ${((analytics.totalCost / (analytics.totalRevenue / analytics.blendedUtil)) * 100).toFixed(0)}% blended utilization to break even.` });
              }
              // Capacity gaps at growth
              if (demandMultiplier > 1) {
                const lastQ = capacityData[capacityData.length - 1];
                const gaps = Object.keys(lastQ.demanded).filter(gpu => (lastQ.committed[gpu] || 0) < Math.ceil(lastQ.demanded[gpu]));
                if (gaps.length > 0) {
                  risks.push({ severity: 'yellow', text: `At ${demandMultiplier}x growth, capacity gaps in: ${gaps.join(', ')} by +12 months.` });
                }
              }
              if (risks.length === 0) {
                risks.push({ severity: 'green', text: 'Portfolio is healthy — positive margins, adequate utilization, no concentration risk.' });
              }
              return risks.map((r, i) => {
                const c = severityColors[r.severity];
                return (
                  <div key={i} className={`px-4 py-3 rounded-lg border text-xs ${c.bg} ${c.border} ${c.text} flex items-start gap-2`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${c.dot}`} />
                    {r.text}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── METHODOLOGY ────────────────────────────────────────────────────────────

function Methodology() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <h2 className="text-sm font-bold text-[#e2e2e8]">Methodology</h2>

      <div className="rounded-lg bg-[#12121a] border border-[#1e1e2e] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1e1e2e] text-[#8888a0]">
              <th className="text-left py-2.5 px-4 font-medium w-36">Tab</th>
              <th className="text-left py-2.5 px-4 font-medium">Data Source</th>
              <th className="text-left py-2.5 px-4 font-medium">How Metrics Are Computed</th>
            </tr>
          </thead>
          <tbody className="text-[#8888a0]">
            <tr className="border-b border-[#1e1e2e]/50">
              <td className="py-2.5 px-4 text-[#e2e2e8] font-medium">Market Prices</td>
              <td className="py-2.5 px-4">On-demand $/GPU-hr from <span className="text-[#e2e2e8]">getdeploying.com</span> (Apr 2026 baseline). Modal sell prices from <span className="text-[#e2e2e8]">modal.com/pricing</span>. Live refresh via Anthropic API + web_search.</td>
              <td className="py-2.5 px-4">Est. Margin = Modal sell price − cheapest upstream. Reserved/spot tiers are estimated discount ranges (e.g. AWS ~45% off), not actual quotes.</td>
            </tr>
            <tr className="border-b border-[#1e1e2e]/50">
              <td className="py-2.5 px-4 text-[#e2e2e8] font-medium">Deal Evaluator</td>
              <td className="py-2.5 px-4">User inputs + Modal sell prices + provider on-demand rates from Market Prices baseline.</td>
              <td className="py-2.5 px-4">Total cost = GPUs × hours × rate. Revenue = GPUs × hours × utilization × sell price. Breakeven = contracted rate ÷ sell price. All calculations are real-time, client-side.</td>
            </tr>
            <tr className="border-b border-[#1e1e2e]/50">
              <td className="py-2.5 px-4 text-[#e2e2e8] font-medium">Portfolio</td>
              <td className="py-2.5 px-4">User-defined contract book (editable). Pre-seeded with example deals.</td>
              <td className="py-2.5 px-4">Aggregates cost/revenue/margin across all contracts. Capacity forecast models demand growth against committed GPU counts per term.</td>
            </tr>
            <tr className="border-b border-[#1e1e2e]/50">
              <td className="py-2.5 px-4 text-[#e2e2e8] font-medium">Supplier Scorecard</td>
              <td className="py-2.5 px-4">Editorial ratings (1–10) based on public docs, community reports, and known partnerships.</td>
              <td className="py-2.5 px-4">Weighted composite: Σ(score × weight) ÷ Σ(weights). Weights always sum to 100% — adjusting one auto-scales the rest.</td>
            </tr>
            <tr className="border-b border-[#1e1e2e]/50">
              <td className="py-2.5 px-4 text-[#e2e2e8] font-medium">Market Trends</td>
              <td className="py-2.5 px-4">H100 quarterly trajectory from pricing page archives. GPU specs from NVIDIA published data. Market signals are curated editorial.</td>
              <td className="py-2.5 px-4">TFLOPS/$ = FP8 TFLOPS ÷ typical market $/hr. Price ranges computed from provider data in Market Prices.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-lg bg-[#12121a] border border-[#1e1e2e] p-4 space-y-2">
        <h3 className="text-xs font-semibold text-[#e2e2e8]">Caveats</h3>
        <ul className="text-xs text-[#8888a0] space-y-1 list-disc list-inside">
          <li>Baseline pricing is a point-in-time snapshot (Apr 2026) — use "Refresh Prices" on Market Prices for current data.</li>
          <li>Reserved/spot tiers are estimated from typical discount ranges, not actual contract quotes.</li>
          <li>Supplier scorecard ratings are informed judgment, not measured SLA data.</li>
        </ul>
      </div>
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────

function App() {
  const [activeTab, setActiveTab] = useState('deal');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('anthropic-api-key') || '');
  const [showApiKey, setShowApiKey] = useState(false);

  const saveApiKey = (key) => {
    setApiKey(key);
    if (key) localStorage.setItem('anthropic-api-key', key);
    else localStorage.removeItem('anthropic-api-key');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e2e8]">
      {/* Header */}
      <header className="border-b border-[#1e1e2e] bg-[#12121a]">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#62DE61] animate-pulse shrink-0" />
            <h1 className="text-sm md:text-base font-bold tracking-tight">
              <span className="text-[#62DE61]">Compute Intel</span>
              <span className="text-[#8888a0] font-normal ml-1.5 hidden sm:inline">— Modal Procurement Dashboard</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setShowApiKey(s => !s)}
              className={`flex items-center gap-1.5 px-2 py-1.5 text-[10px] md:text-xs rounded border transition-colors ${
                apiKey ? 'border-[#62DE61]/30 text-[#62DE61] hover:bg-[#62DE61]/10' : 'border-[#1e1e2e] text-[#8888a0] hover:text-[#e2e2e8]'
              }`}>
              <Key size={12} />
              <span className="hidden sm:inline">{apiKey ? 'API Key Set' : 'Set API Key'}</span>
            </button>
            <div className="text-[10px] md:text-xs text-[#8888a0] font-mono hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
        {showApiKey && (
          <div className="flex items-center gap-2 px-4 md:px-6 pb-3">
            <input
              type="password"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={e => saveApiKey(e.target.value)}
              className="bg-[#0a0a0f] border border-[#1e1e2e] rounded px-2.5 py-1.5 text-xs font-mono text-[#e2e2e8] w-full max-w-xs focus:border-[#62DE61] focus:outline-none"
            />
            {apiKey && <button onClick={() => saveApiKey('')} className="text-[10px] text-red-400 hover:text-red-300 shrink-0">Clear</button>}
          </div>
        )}
        <StatBar />
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </header>

      {/* Content */}
      <main>
        {activeTab === 'deal' && <DealEvaluator />}
        {activeTab === 'portfolio' && <Portfolio />}
        {activeTab === 'prices' && <MarketPrices apiKey={apiKey} />}
        {activeTab === 'scorecard' && <SupplierScorecard />}
        {activeTab === 'trends' && <MarketTrends />}
        {activeTab === 'methodology' && <Methodology />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e1e2e] px-6 py-4 text-center">
        <p className="text-[10px] text-[#8888a0]/50">
          Built by Niko as a work sample for Modal's Compute Strategy & Operations Lead role
        </p>
      </footer>
    </div>
  );
}

export default App;
