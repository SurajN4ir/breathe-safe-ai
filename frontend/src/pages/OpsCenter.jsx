import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Position,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Activity,
  BrainCircuit,
  Boxes,
  Database,
  Radar,
  ShieldCheck,
  Workflow,
  AlertTriangle,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar as RadarPoly,
} from 'recharts';

const statusStyle = {
  healthy: 'border-emerald-300/60 text-emerald',
  active: 'border-cyan-300/70 text-sky',
  warning: 'border-amber-300/70 text-amber',
  degraded: 'border-rose-300/70 text-rose',
};

const pipelineNodesData = [
  ['raw', 'Raw AQI Dataset', 'Data source + batch snapshots', 'healthy', 20, 40],
  ['ingest', 'Data Ingestion', 'Ingestion and schema checks', 'active', 260, 40],
  ['gx', 'Great Expectations', 'Validation suite execution', 'healthy', 500, 40],
  ['feature', 'Feature Engineering', 'Environmental feature prep', 'active', 740, 40],
  ['feast', 'Feast Feature Store', 'Offline/online feature serving', 'healthy', 980, 40],
  ['train', 'Model Training', 'Random Forest training jobs', 'active', 1220, 40],
  ['mlflow', 'MLflow Tracking', 'Experiments + artifacts', 'healthy', 1460, 40],
  ['registry', 'Model Registry', 'Versioned model governance', 'active', 1700, 40],
  ['api', 'FastAPI Deployment', 'Prediction + forecast APIs', 'healthy', 1940, 40],
  ['web', 'React Frontend', 'Dashboard + forecasting UX', 'active', 2180, 40],
  ['monitor', 'Monitoring Stack', 'Ops telemetry routing', 'active', 2420, 40],
  ['prom', 'Prometheus', 'Metric scraping and storage', 'healthy', 2660, 40],
  ['graf', 'Grafana', 'Live dashboards + alerting', 'healthy', 2900, 40],
  ['drift', 'Evidently Drift', 'Data and prediction drift', 'warning', 3140, 40],
  ['lineage', 'OpenLineage + Marquez', 'Lineage metadata tracking', 'active', 3380, 40],
];

const pipelineEdgesData = pipelineNodesData.slice(0, -1).map((entry, i) => ({
  id: `edge-${entry[0]}-${pipelineNodesData[i + 1][0]}`,
  source: entry[0],
  target: pipelineNodesData[i + 1][0],
}));

const lineageNodesData = [
  ['dataset', 'AQI Raw Dataset', 'Ingestion Source', 'healthy', 40, 90],
  ['validated', 'Validated Dataset', 'Great Expectations', 'healthy', 280, 90],
  ['processed', 'Processed Features', 'Feature Engineering', 'active', 520, 90],
  ['store', 'Feature Store', 'Feast', 'healthy', 760, 90],
  ['training', 'Training Dataset', 'Training Split', 'active', 1000, 90],
  ['model', 'Model Artifact', 'MLflow Registry', 'healthy', 1240, 90],
  ['prediction', 'Prediction API', 'FastAPI Serving', 'active', 1480, 90],
  ['dashboard', 'Frontend Dashboard', 'React Consumption', 'healthy', 1720, 90],
];

const lineageEdgesData = lineageNodesData.slice(0, -1).map((entry, i) => ({
  id: `lineage-${entry[0]}-${lineageNodesData[i + 1][0]}`,
  source: entry[0],
  target: lineageNodesData[i + 1][0],
}));

const liveMetrics = [
  { label: 'Pipeline Execution', value: '96.8%', tone: 'healthy', icon: Workflow },
  { label: 'Latest MLflow Run', value: 'rf_2026_05_17', tone: 'active', icon: BrainCircuit },
  { label: 'Model Version', value: 'aqi_model v12', tone: 'healthy', icon: Boxes },
  { label: 'Prediction Latency', value: '84ms', tone: 'active', icon: Activity },
  { label: 'API Uptime', value: '99.94%', tone: 'healthy', icon: ShieldCheck },
  { label: 'Validation Success', value: '99.1%', tone: 'healthy', icon: CheckCircle2 },
  { label: 'Drift Monitoring', value: 'Moderate Drift', tone: 'warning', icon: AlertTriangle },
  { label: 'K8s Deployment', value: '6 / 6 Healthy', tone: 'healthy', icon: Cpu },
];

const chartSeries = [
  { t: '09:00', latency: 94, throughput: 122 },
  { t: '10:00', latency: 87, throughput: 142 },
  { t: '11:00', latency: 82, throughput: 159 },
  { t: '12:00', latency: 79, throughput: 172 },
  { t: '13:00', latency: 91, throughput: 155 },
  { t: '14:00', latency: 84, throughput: 181 },
];

const radarSeries = [
  { metric: 'Data Quality', score: 93 },
  { metric: 'Model Ops', score: 88 },
  { metric: 'Serving', score: 95 },
  { metric: 'Monitoring', score: 84 },
  { metric: 'Lineage', score: 80 },
  { metric: 'Reliability', score: 91 },
];

function GlowingNode({ data }) {
  return (
    <div className="w-[210px] rounded-xl border border-cyan-300/30 bg-slate-900/85 p-3 shadow-[0_0_30px_rgba(56,189,248,0.16)] backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-cyan-300" />
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-200">{data.label}</p>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusStyle[data.status]}`}>
          {data.status}
        </span>
      </div>
      <p className="text-xs leading-5 text-slate-300">{data.description}</p>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-indigo-300" />
    </div>
  );
}

export default function OpsCenter() {
  const [selectedPipeline, setSelectedPipeline] = useState(pipelineNodesData[0]);
  const [selectedLineage, setSelectedLineage] = useState(lineageNodesData[0]);

  const nodeTypes = useMemo(() => ({ glowing: GlowingNode }), []);

  const pipelineNodes = useMemo(
    () =>
      pipelineNodesData.map(([id, label, description, status, x, y]) => ({
        id,
        type: 'glowing',
        position: { x, y },
        data: { label, description, status },
      })),
    []
  );

  const pipelineEdges = useMemo(
    () =>
      pipelineEdgesData.map((edge) => ({
        ...edge,
        animated: true,
        style: { stroke: '#67e8f9', strokeWidth: 2.1 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#67e8f9' },
      })),
    []
  );

  const lineageNodes = useMemo(
    () =>
      lineageNodesData.map(([id, label, description, status, x, y]) => ({
        id,
        type: 'glowing',
        position: { x, y },
        data: { label, description, status },
      })),
    []
  );

  const lineageEdges = useMemo(
    () =>
      lineageEdgesData.map((edge) => ({
        ...edge,
        animated: true,
        style: { stroke: '#a78bfa', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#a78bfa' },
      })),
    []
  );

  return (
    <div className="relative overflow-hidden pb-10">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-20 left-12 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute top-32 right-16 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="page-wrap relative z-10 animate-fade-in">
        <header className="mb-8">
          <p className="text-label mb-2 text-sky">Enterprise MLOps Command Center</p>
          <h1 className="text-heading mb-3">Pipeline observability and lineage intelligence for Breathe Safe AI.</h1>
          <p className="max-w-4xl text-lg leading-8 text-muted">
            A production-style operations view combining workflow telemetry, model governance, lineage mapping, and live service reliability in one cyberpunk enterprise control interface.
          </p>
        </header>

        <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {liveMetrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.28 }}
                className="rounded-xl border border-white/15 bg-slate-900/65 p-4 shadow-[0_0_24px_rgba(59,130,246,0.15)] backdrop-blur-xl"
              >
                <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-300">
                  <Icon size={14} />
                  {metric.label}
                </p>
                <p className={`text-2xl font-extrabold ${statusStyle[metric.tone].split(' ')[1]}`}>{metric.value}</p>
              </motion.div>
            );
          })}
        </section>

        <section className="mb-7 rounded-xl border border-cyan-300/20 bg-slate-950/70 p-4 shadow-[0_0_40px_rgba(34,211,238,0.1)] backdrop-blur-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-label text-sky">MLOps Pipeline Visualization</p>
              <h2 className="text-section">Live enterprise pipeline topology</h2>
            </div>
            <span className="rounded-full border border-cyan-300/50 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
              Real-time flow simulation
            </span>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
            <div className="h-[460px] overflow-hidden rounded-xl border border-white/10">
              <ReactFlow
                nodes={pipelineNodes}
                edges={pipelineEdges}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.25}
                maxZoom={1.2}
                onNodeClick={(_, node) => setSelectedPipeline(pipelineNodesData.find((n) => n[0] === node.id))}
              >
                <MiniMap className="!bg-slate-900/80" nodeColor={() => '#38bdf8'} />
                <Controls />
                <Background color="#1f3a5c" gap={24} />
              </ReactFlow>
            </div>
            <div className="rounded-xl border border-indigo-300/25 bg-indigo-950/35 p-4">
              <p className="text-label mb-2 text-indigo-200">Node Intelligence</p>
              <h3 className="mb-2 text-xl font-bold text-white">{selectedPipeline?.[1]}</h3>
              <p className="mb-3 text-sm leading-6 text-slate-300">{selectedPipeline?.[2]}</p>
              <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyle[selectedPipeline?.[3]]}`}>
                {selectedPipeline?.[3]}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-7 rounded-xl border border-violet-300/20 bg-slate-950/70 p-4 shadow-[0_0_40px_rgba(167,139,250,0.1)] backdrop-blur-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-label text-indigo-200">Data Lineage Visualization</p>
              <h2 className="text-section">OpenLineage-inspired relationship graph</h2>
            </div>
            <span className="rounded-full border border-violet-300/45 bg-violet-300/10 px-3 py-1 text-xs font-bold text-violet-200">
              Marquez style lineage pathing
            </span>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
            <div className="h-[360px] overflow-hidden rounded-xl border border-white/10">
              <ReactFlow
                nodes={lineageNodes}
                edges={lineageEdges}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.3}
                maxZoom={1.2}
                onNodeClick={(_, node) => setSelectedLineage(lineageNodesData.find((n) => n[0] === node.id))}
              >
                <MiniMap className="!bg-slate-900/80" nodeColor={() => '#a78bfa'} />
                <Controls />
                <Background color="#2a2353" gap={22} />
              </ReactFlow>
            </div>
            <div className="rounded-xl border border-violet-300/25 bg-violet-950/35 p-4">
              <p className="text-label mb-2 text-violet-100">Lineage Metadata</p>
              <h3 className="mb-2 text-xl font-bold text-white">{selectedLineage?.[1]}</h3>
              <p className="mb-2 text-sm text-slate-300">Source Stage: {selectedLineage?.[2]}</p>
              <p className="mb-3 text-sm text-slate-300">Last Update: 2026-05-17 16:30 IST</p>
              <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyle[selectedLineage?.[3]]}`}>
                {selectedLineage?.[3]}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-cyan-300/20 bg-slate-900/70 p-4">
            <p className="mb-3 flex items-center gap-2 text-label text-cyan-200">
              <Activity size={14} /> Prediction Throughput vs Latency
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#29435f" />
                  <XAxis dataKey="t" stroke="#9db9d8" />
                  <YAxis stroke="#9db9d8" />
                  <Tooltip contentStyle={{ background: '#0b1727', border: '1px solid #1d3a5b' }} />
                  <Area type="monotone" dataKey="throughput" stroke="#22d3ee" fill="#22d3ee44" />
                  <Area type="monotone" dataKey="latency" stroke="#a78bfa" fill="#a78bfa33" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-indigo-300/20 bg-slate-900/70 p-4">
            <p className="mb-3 flex items-center gap-2 text-label text-indigo-200">
              <Radar size={14} /> MLOps Capability Posture
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarSeries}>
                  <PolarGrid stroke="#324769" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#c9d9ea', fontSize: 12 }} />
                  <RadarPoly name="Score" dataKey="score" stroke="#60a5fa" fill="#60a5fa66" fillOpacity={0.55} />
                  <Tooltip contentStyle={{ background: '#0b1727', border: '1px solid #1d3a5b' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
