import { useState, useRef } from 'react';

/* ── Process colour palette ── */
const P_COLORS = [
  { bg: '#00f0ff', text: '#000', glow: 'rgba(0,240,255,0.4)'   },
  { bg: '#ff6b35', text: '#000', glow: 'rgba(255,107,53,0.4)'  },
  { bg: '#00ff88', text: '#000', glow: 'rgba(0,255,136,0.4)'   },
  { bg: '#ff3366', text: '#fff', glow: 'rgba(255,51,102,0.4)'  },
  { bg: '#ffd700', text: '#000', glow: 'rgba(255,215,0,0.4)'   },
  { bg: '#cc44ff', text: '#fff', glow: 'rgba(204,68,255,0.4)'  },
  { bg: '#44aaff', text: '#000', glow: 'rgba(68,170,255,0.4)'  },
  { bg: '#ff8844', text: '#000', glow: 'rgba(255,136,68,0.4)'  },
];

const pidColor = (pid) => P_COLORS[(pid - 1) % P_COLORS.length];

const DEMO = [
  { id: 1, at: 0, bt: 10 },
  { id: 2, at: 1, bt: 6  },
  { id: 3, at: 2, bt: 14 },
  { id: 4, at: 3, bt: 4  },
  { id: 5, at: 4, bt: 8  },
  { id: 6, at: 5, bt: 12 },
];

function PidBadge({ pid }) {
  const c = pidColor(pid);
  return (
    <span className="pid-badge" style={{ color: c.bg, borderColor: c.bg }}>
      P{pid}
    </span>
  );
}

function StatSm({ label, value, accent }) {
  return (
    <div className="stat-card-sm">
      <div className="stat-label-sm">{label}</div>
      <div className={`stat-val-sm${accent ? ' accent' : ''}`}>{value ?? '—'}</div>
    </div>
  );
}

function StatLg({ label, value }) {
  return (
    <div className="stat-card-lg">
      <div className="stat-val-lg">{value ?? '—'}</div>
      <div className="stat-label-lg">{label}</div>
    </div>
  );
}

/* ── Metrics data ── */
const METRICS = [
  { icon: '⏱', title: 'Arrival Time (AT)', color: '#00f0ff', desc: 'The time at which a process enters the ready queue and becomes available for execution. Processes with AT=0 are available from the very start.', formula: 'AT = time process enters ready queue' },
  { icon: '⚡', title: 'Burst Time (BT)', color: '#ffd700', desc: 'The total CPU time required by a process to complete its execution. Also called CPU Time or Service Time. This is the workload each process brings.', formula: 'BT = total CPU time needed' },
  { icon: '🏁', title: 'Completion Time (CT)', color: '#00ff88', desc: 'The time at which a process finishes execution completely. The CPU is done with this process and it exits the system.', formula: 'CT = time process finishes execution' },
  { icon: '🔄', title: 'Turnaround Time (TAT)', color: '#cc44ff', desc: 'Total time a process spends in the system from arrival to completion. Includes both waiting time and actual execution time.', formula: 'TAT = CT − AT' },
  { icon: '⏳', title: 'Waiting Time (WT)', color: '#ff6b35', desc: 'Total time a process spends waiting in the ready queue without getting CPU. Lower waiting time = better scheduler performance.', formula: 'WT = TAT − BT' },
  { icon: '👁', title: 'Response Time (RT)', color: '#ff3366', desc: 'Time from process arrival until it gets the CPU for the very first time. Critical for interactive systems where responsiveness matters most.', formula: 'RT = first CPU start time − AT' },
  { icon: '🖥', title: 'CPU Utilization', color: '#44aaff', desc: 'Percentage of time the CPU is actively executing processes (not idle). 100% means the CPU was always busy — no idle gaps.', formula: 'CPU Util = (Busy Time / Total Time) × 100%' },
  { icon: '📈', title: 'Throughput', color: '#00ff88', desc: 'Number of processes completed per unit time. Higher throughput means the scheduler completes more work in the same time period.', formula: 'Throughput = N / Total Time' },
  { icon: '🔁', title: 'Context Switches', color: '#ffd700', desc: 'Number of times the CPU switches from one process to another. Each switch has overhead cost. Fewer context switches = more efficient execution.', formula: 'Count of CPU switches between different processes' },
  { icon: '⚙', title: 'Time Quantum (TQ)', color: '#cc44ff', desc: 'The max CPU time slice a process gets per turn. In Adaptive RR, this changes every round based on remaining burst times of all waiting processes.', formula: 'TQ = ceil(Σ Remaining Times / N)' },
];

const STEPS = [
  { step: '01', title: 'Processes Arrive', desc: 'Processes enter the ready queue based on their Arrival Time. The scheduler sorts them and waits until the first process is available.' },
  { step: '02', title: 'Calculate Dynamic Quantum', desc: 'At the start of each round: TQ = ceil(ΣRT / N), where ΣRT = sum of all remaining burst times, N = number of processes in the ready queue.' },
  { step: '03', title: 'Execute Each Process', desc: 'Each process gets min(remaining_time, TQ) of CPU. If it finishes, it exits with CT recorded. If not, it goes back to end of the queue.' },
  { step: '04', title: 'New Arrivals Join', desc: 'During execution, any process whose arrival time ≤ current time joins the queue. They participate in the next round quantum calculation.' },
  { step: '05', title: 'Recalculate Quantum', desc: 'After each full round, TQ is recalculated. As processes finish, remaining times shrink → TQ gets smaller → more fairness in final stages.' },
  { step: '06', title: 'Repeat Until Done', desc: 'The cycle continues until all processes complete. The result adapts to actual workload instead of using a fixed arbitrary quantum.' },
];

function LearnPage({ darkMode }) {
  const s = (style) => style;
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px', overflowY: 'auto' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ display: 'inline-block', padding: '5px 16px', borderRadius: 999, border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14, fontFamily: 'JetBrains Mono, monospace' }}>// CPU Scheduling Algorithm</div>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, margin: '0 0 14px', color: 'var(--text-primary)', lineHeight: 1.15 }}>
          Understanding <span style={{ color: 'var(--accent)' }}>Adaptive</span> Round Robin
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 580, margin: '0 auto', lineHeight: 1.7 }}>
          A complete guide — from basic scheduling concepts to the adaptive formula and every metric it computes.
        </p>
      </div>

      {/* Round Robin */}
      <div className="panel-card" style={{ marginBottom: 16 }}>
        <h2 className="section-title">What is Round Robin Scheduling?</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 14, fontSize: '0.9rem' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Round Robin (RR)</strong> is one of the most fundamental CPU scheduling algorithms. It gives each process a fixed time slice called a <strong style={{ color: 'var(--accent)' }}>Time Quantum (TQ)</strong>. Every process gets the CPU for TQ milliseconds, then goes to the back of the queue — whether it is done or not. This continues until all processes complete.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: '✅ Advantage', text: 'Fair — every process gets equal CPU time per turn. No process starves.' },
            { label: '❌ Problem', text: 'Fixed TQ is arbitrary. Too small → too many context switches. Too large → behaves like FCFS (not fair).' },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontWeight: 700, marginBottom: 5, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{item.label}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6 }}>{item.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Adaptive RR */}
      <div className="panel-card" style={{ marginBottom: 16, borderColor: 'rgba(0,240,255,0.3)' }}>
        <h2 className="section-title">What is Adaptive Round Robin?</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 16, fontSize: '0.9rem' }}>
          <strong style={{ color: 'var(--accent)' }}>Adaptive Round Robin</strong> solves the fixed-TQ problem by <em>dynamically recalculating the quantum every round</em> based on the actual workload remaining. Instead of you guessing a good TQ value, the algorithm figures it out automatically using the remaining burst times.
        </p>
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--accent)', borderRadius: 10, padding: '18px 24px', textAlign: 'center', boxShadow: darkMode ? '0 0 24px rgba(0,240,255,0.1)' : '0 4px 20px rgba(99,102,241,0.08)', marginBottom: 14 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>THE ADAPTIVE FORMULA</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(0.95rem, 2.5vw, 1.4rem)', fontWeight: 700, color: 'var(--accent)' }}>
            TQ = ceil( Σ Remaining Times / N )
          </div>
          <div style={{ marginTop: 10, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            where <strong style={{ color: 'var(--text-primary)' }}>N</strong> = number of processes currently in the ready queue
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Early Rounds', text: 'High N, high remaining times → large TQ → fewer context switches' },
            { label: 'Mid Rounds', text: 'Some finish → N drops → TQ adjusts downward automatically' },
            { label: 'Final Rounds', text: 'Few processes with small remaining time → tiny TQ → very fair finish' },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--input-bg)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', marginBottom: 5, fontFamily: 'JetBrains Mono, monospace' }}>{item.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div className="panel-card" style={{ marginBottom: 16 }}>
        <h2 className="section-title">How it Works — Step by Step</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 40, height: 40, borderRadius: 8, background: 'var(--input-bg)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '0.75rem', color: 'var(--accent)', flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, fontSize: '0.88rem' }}>{s.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="panel-card">
        <h2 className="section-title">Key Scheduling Metrics Explained</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 12 }}>
          {METRICS.map(m => (
            <div key={m.title} style={{ background: 'var(--input-bg)', borderLeft: `3px solid ${m.color}`, borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderRadius: 10, padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <span style={{ fontSize: '1.2rem' }}>{m.icon}</span>
                <span style={{ fontWeight: 700, color: m.color, fontSize: '0.85rem' }}>{m.title}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.65, margin: '0 0 8px' }}>{m.desc}</p>
              <div style={{ background: 'var(--bg-panel)', borderRadius: 5, padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: m.color, fontWeight: 600 }}>{m.formula}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [darkMode, setDarkMode]     = useState(true);
  const [view, setView]             = useState('simulator');
  const [queue, setQueue]           = useState([]);
  const [form, setForm]             = useState({ at: 0, bt: 1 });
  const [baseQuantum, setBaseQuantum] = useState(4);
  const [nextId, setNextId]         = useState(1);
  const [results, setResults]       = useState(null);
  const [gantt, setGantt]           = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const rightRef = useRef(null);

  /* ── Handlers ── */
  const addProcess = () => {
    const at = parseInt(form.at, 10) || 0;
    const bt = Math.max(1, parseInt(form.bt, 10) || 1);
    setQueue(q => [...q, { id: nextId, at, bt }]);
    setNextId(n => n + 1);
  };

  const removeProcess = (id) => setQueue(q => q.filter(p => p.id !== id));

  const handleReset = () => {
    setQueue([]);
    setForm({ at: 0, bt: 1 });
    setBaseQuantum(4);
    setNextId(1);
    setResults(null);
    setGantt(null);
    setGlobalStats(null);
    setError(null);
  };

  const loadDemo = () => {
    setQueue(DEMO);
    setNextId(7);
    setResults(null); setGantt(null); setGlobalStats(null); setError(null);
  };

  const handleRun = async () => {
    if (queue.length === 0) { setError('Add at least one process to the ready queue.'); return; }
    setLoading(true); setError(null); setResults(null); setGantt(null); setGlobalStats(null);
    try {
      const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${BACKEND}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processes: queue, baseQuantum }),
      });
      if (!res.ok) throw new Error('Simulation failed. Is the backend running?');
      const data = await res.json();
      setTimeout(() => {
        setResults(data.results);
        setGantt(data.gantt);
        setGlobalStats({
          totalTime: data.total_time,
          cpuUtil: data.cpu_utilization,
          throughput: data.throughput,
          avgQuantum: data.avg_quantum,
          contextSwitches: data.context_switches,
        });
        setLoading(false);
        setTimeout(() => rightRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      }, 500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  /* ── Derived ── */
  const avgWt  = results ? (results.reduce((s, r) => s + r.wt, 0) / results.length).toFixed(2) : null;
  const avgTat = results ? (results.reduce((s, r) => s + r.tat, 0) / results.length).toFixed(2) : null;
  const avgResp= results ? (results.reduce((s, r) => s + r.response, 0) / results.length).toFixed(2) : null;
  const maxWt  = results ? Math.max(...results.map(r => r.wt)) : 1;

  /* ── Gantt ticks ── */
  const totalTime = gantt?.at(-1)?.end ?? 0;

  return (
    <div data-theme={darkMode ? 'dark' : 'light'} className="app-root">

      {/* ── Header ── */}
      <header className="app-header">
        <h1>⚡ Adaptive Round Robin Scheduler</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 3 }}>
            {[{ id: 'simulator', label: '⚙ Simulator' }, { id: 'learn', label: '📖 Learn' }].map(v => (
              <button key={v.id} onClick={() => setView(v.id)} style={{
                padding: '5px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase',
                transition: 'all 0.2s',
                background: view === v.id ? 'var(--accent)' : 'transparent',
                color: view === v.id ? '#000' : 'var(--text-secondary)',
                fontFamily: 'JetBrains Mono, monospace',
              }}>{v.label}</button>
            ))}
          </div>
          <button className="theme-toggle" onClick={() => setDarkMode(d => !d)}>
            {darkMode ? '☀ Light' : '◑ Dark'}
          </button>
        </div>
      </header>

      {view === 'learn'
        ? <div className="learn-page-wrap"><LearnPage darkMode={darkMode} /></div>
        : <div className="app-layout">

        {/* ══════════════════════════════
            LEFT PANEL
        ══════════════════════════════ */}
        <aside className="left-panel">

          {/* Add Process */}
          <div className="panel-section">
            <h2 className="section-title">Add Process</h2>
            <div className="form-grid">
              <div>
                <label className="form-label">Arrival Time</label>
                <input type="number" min="0" className="form-input"
                  value={form.at} onChange={e => setForm(f => ({ ...f, at: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Burst Time</label>
                <input type="number" min="1" className="form-input"
                  value={form.bt} onChange={e => setForm(f => ({ ...f, bt: e.target.value }))} />
              </div>
            </div>

            {/* Base Quantum Slider */}
            <div className="slider-wrap">
              <div className="slider-header">
                <label className="form-label" style={{ marginBottom: 0 }}>Base Quantum</label>
                <span className="slider-val">{baseQuantum}</span>
              </div>
              <input type="range" min="1" max="20" value={baseQuantum}
                onChange={e => setBaseQuantum(Number(e.target.value))} />
            </div>

            <div className="btn-row">
              <button className="btn-primary" onClick={addProcess}>+ Add Process</button>
              <button className="btn-outline" onClick={loadDemo}>Demo Set</button>
            </div>
          </div>

          {/* Ready Queue */}
          <div className="panel-section" style={{ flex: 1 }}>
            <h2 className="section-title">Ready Queue</h2>
            {queue.length === 0 ? (
              <div className="empty-queue">No processes added yet</div>
            ) : (
              <table className="rq-table">
                <thead>
                  <tr>
                    <th>PID</th><th>ARR</th><th>BURST</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map(p => (
                    <tr key={p.id}>
                      <td><PidBadge pid={p.id} /></td>
                      <td>{p.at} ms</td>
                      <td>{p.bt} ms</td>
                      <td>
                        <button className="btn-delete" onClick={() => removeProcess(p.id)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Run + Reset Buttons */}
          <div className="panel-section" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {error && <div className="error-box" style={{ marginBottom: 4 }}>{error}</div>}
            <button className="btn-run" onClick={handleRun} disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg style={{ animation: 'spin 1s linear infinite', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                  </svg>
                  Simulating…
                </span>
              ) : '▶ Run Scheduler'}
            </button>
            <button onClick={handleReset} disabled={loading} style={{
              width: '100%', padding: '9px', borderRadius: 8,
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
              background: 'transparent',
              border: '1px solid rgba(255,51,102,0.5)',
              color: 'rgba(255,51,102,0.85)',
              transition: 'all 0.2s',
              fontFamily: 'JetBrains Mono, monospace',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,51,102,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,51,102,0.9)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,51,102,0.5)'; }}
            >↺ Reset Everything</button>
          </div>
        </aside>

        {/* ══════════════════════════════
            RIGHT PANEL
        ══════════════════════════════ */}
        <div className="right-panel" ref={rightRef}>

          {/* Small stats */}
          <div className="stats-row">
            <StatSm label="Avg Waiting Time"    value={avgWt  != null ? `${avgWt} ms` : null} />
            <StatSm label="Avg Turnaround"   value={avgTat != null ? `${avgTat} ms` : null} />
            <StatSm label="Avg Response"     value={avgResp!= null ? `${avgResp} ms` : null} />
            <StatSm label="Context Switches" value={globalStats?.contextSwitches ?? null} accent />
          </div>

          {/* Large stats */}
          <div className="stats-row-lg">
            <StatLg label="CPU Utilization"
              value={globalStats ? `${globalStats.cpuUtil.toFixed(1)}%` : null} />
            <StatLg label="Throughput"
              value={globalStats ? globalStats.throughput.toFixed(3) : null} />
            <StatLg label="Total Completion Time"
              value={globalStats ? `${globalStats.totalTime} ms` : null} />
            <StatLg label="Avg Quantum"
              value={globalStats ? `${globalStats.avgQuantum.toFixed(1)} ms` : null} />
          </div>

          {/* Adaptive Quantum Log */}
          <div className="panel-card fade-in">
            <h2 className="section-title">Adaptive Quantum Log</h2>
            {!results ? (
              <div className="empty-state">Run the scheduler to see per-round quantum usage</div>
            ) : (
              results.map(r => {
                const c = pidColor(r.pid);
                return (
                  <div key={r.pid} className="q-log-row">
                    <span className="q-log-pid" style={{ color: c.bg }}>P{r.pid}:</span>
                    <div className="q-log-blocks">
                      {(r.quantum_log || []).map((q, i) => (
                        <span key={i} className="q-block" style={{ color: c.bg, borderColor: c.bg }}>
                          Q{q}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Gantt Chart */}
          <div className="panel-card">
            <h2 className="section-title">Execution Timeline</h2>
            {!gantt ? (
              <div className="empty-state">Gantt chart will appear here</div>
            ) : (
              <div className="gantt-wrap">
                <div className="gantt-bar">
                  {gantt.map((block, idx) => {
                    const w = ((block.end - block.start) / totalTime) * 100;
                    const isIdle = block.pid === -1;
                    const c = isIdle ? null : pidColor(block.pid);
                    return (
                      <div key={idx} title={isIdle ? `Idle ${block.start}–${block.end}` : `P${block.pid} | ${block.start}–${block.end} | TQ=${block.tq}`}
                        className={isIdle ? 'gantt-block gantt-idle' : 'gantt-block'}
                        style={{
                          width: `${w}%`,
                          background: isIdle ? undefined : c.bg,
                          animation: `slideIn 0.4s ease ${idx * 0.05}s both`,
                          color: isIdle ? 'var(--text-muted)' : c.text,
                          minWidth: w > 3 ? undefined : 0,
                        }}>
                        {!isIdle && w > 5 && <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>P{block.pid}</span>}
                      </div>
                    );
                  })}
                </div>
                {/* Tick marks */}
                <div style={{ position: 'relative', height: 28, minWidth: 600, marginTop: 6 }}>
                  {/* Start tick: 0 */}
                  <div style={{ position: 'absolute', left: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ width: 1, height: 5, background: 'var(--text-muted)', marginBottom: 2 }} />
                    <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)', fontWeight: 600 }}>0</span>
                  </div>
                  {gantt.map((block, idx) => {
                    const pct = (block.end / totalTime) * 100;
                    const isLast = idx === gantt.length - 1;
                    const isFirst = pct < 5; // skip if too close to 0
                    if (isFirst && idx !== gantt.length - 1) return null;
                    return (
                      <div key={idx} style={{
                        position: 'absolute',
                        left: `${pct}%`,
                        display: 'flex', flexDirection: 'column',
                        alignItems: isLast ? 'flex-end' : 'center',
                        transform: isLast ? 'translateX(-100%)' : 'translateX(-50%)',
                      }}>
                        <div style={{ width: 1, height: 5, background: 'var(--text-muted)', marginBottom: 2 }} />
                        <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{block.end}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Per-Process Analysis */}
          <div className="panel-card">
            <h2 className="section-title">Per-Process Analysis</h2>
            {!results ? (
              <div className="empty-state">Analysis will appear after simulation</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="analysis-table">
                  <thead>
                    <tr>
                      <th>PID</th><th>Burst</th><th>Arrival</th>
                      <th>Completion</th><th>Waiting</th><th>Turnaround</th>
                      <th>Response</th><th>Q-Used</th><th>Wait Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => {
                      const c = pidColor(r.pid);
                      const waitRate = maxWt > 0 ? (r.wt / maxWt) * 100 : 0;
                      return (
                        <tr key={r.pid}>
                          <td><PidBadge pid={r.pid} /></td>
                          <td>{r.bt} ms</td>
                          <td>{r.at} ms</td>
                          <td>{r.ct} ms</td>
                          <td style={{ color: 'var(--accent3)' }}>{r.wt} ms</td>
                          <td>{r.tat} ms</td>
                          <td>{r.response} ms</td>
                          <td>{r.q_used}</td>
                          <td>
                            <div className="wait-bar-wrap">
                              <div className="wait-bar-fill"
                                style={{ width: `${waitRate}%`, background: c.bg }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>{/* /right-panel */}
      </div>}{/* /app-layout ternary */}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
