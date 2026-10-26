import React, { useState } from 'react';
import { Pipeline, PipelineStage } from '../types';
import { api } from '../api';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Terminal, 
  GitBranch, 
  GitCommit, 
  Box, 
  ShieldCheck, 
  Server
} from 'lucide-react';

interface Props {
  pipelines: Pipeline[];
  onRefresh: () => void;
  onTriggerSuccess: () => void;
}

export const PipelineDashboard: React.FC<Props> = ({ pipelines, onRefresh, onTriggerSuccess }) => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/geo-cherian-mathew-2k28/DevHub.git');
  const [branch, setBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('feat: add containerized microservices and automated tests');
  const [isTriggering, setIsTriggering] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(pipelines[0] || null);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    try {
      setIsTriggering(true);
      const newPipeline = await api.triggerPipeline({
        repo_url: repoUrl.trim(),
        branch: branch.trim() || 'main',
        commit_message: commitMessage.trim() || undefined,
      });
      setSelectedPipeline(newPipeline);
      onTriggerSuccess();
    } catch (err: any) {
      alert(err.message || 'Failed to trigger pipeline');
    } finally {
      setIsTriggering(false);
    }
  };

  const getStageIcon = (name: string) => {
    if (name.includes('Lint')) return <GitCommit size={15} />;
    if (name.includes('Build')) return <Box size={15} />;
    if (name.includes('Test')) return <Terminal size={15} />;
    if (name.includes('Security') || name.includes('Scout')) return <ShieldCheck size={15} />;
    return <Server size={15} />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="badge badge-status-completed"><CheckCircle2 size={12} style={{ marginRight: 4 }} /> passed</span>;
      case 'running':
        return <span className="badge badge-status-in-progress"><Clock size={12} className="spin" style={{ marginRight: 4 }} /> running</span>;
      case 'failed':
        return <span className="badge badge-priority-high"><AlertCircle size={12} style={{ marginRight: 4 }} /> failed</span>;
      default:
        return <span className="badge badge-status-pending">queued</span>;
    }
  };

  const currentPipeline = selectedPipeline || pipelines[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
      {/* Trigger Form Banner */}
      <div className="stat-card" style={{ padding: '1.25rem', border: '1px solid #bfdbfe', background: '#f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Automated Container CI/CD Pipeline
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Demonstrates real industry DevOps: Git Checkout &rarr; Docker Build &rarr; Automated Testing &rarr; Docker Scout CVE Scan &rarr; Kubernetes Deploy
            </p>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
          >
            Refresh Builds
          </button>
        </div>

        <form onSubmit={handleTrigger} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: '0.75rem', alignItems: 'end' }}>
          <div>
            <label className="form-label">Repository URL</label>
            <input 
              type="text" 
              className="form-control" 
              value={repoUrl} 
              onChange={(e) => setRepoUrl(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="form-label">Branch</label>
            <input 
              type="text" 
              className="form-control" 
              value={branch} 
              onChange={(e) => setBranch(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="form-label">Commit Message</label>
            <input 
              type="text" 
              className="form-control" 
              value={commitMessage} 
              onChange={(e) => setCommitMessage(e.target.value)} 
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isTriggering}
            style={{ height: '38px', minWidth: '140px' }}
          >
            <Play size={15} style={{ marginRight: 6 }} />
            {isTriggering ? 'Triggering...' : 'Run Pipeline'}
          </button>
        </form>
      </div>

      {/* Main Pipeline Layout: History on Left, Live Stage Visualizer on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem' }}>
        {/* Left: Build History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Pipeline Run History ({pipelines.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '550px', overflowY: 'auto' }}>
            {pipelines.map((p) => {
              const isSelected = currentPipeline?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPipeline(p);
                    setSelectedStage(p.stages[0] || null);
                  }}
                  style={{
                    padding: '0.875rem',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: isSelected ? '#eff6ff' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{p.name}</span>
                    {getStatusBadge(p.status)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <GitBranch size={12} /> {p.branch}
                    </span>
                    <span>SHA: {p.commit_sha ? p.commit_sha.substring(0, 7) : 'head'}</span>
                    <span>{p.duration_seconds}s</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Visual Pipeline Graph & Stage Logs */}
        {currentPipeline ? (
          <div className="stat-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{currentPipeline.name}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Commit: <em>"{currentPipeline.commit_message || 'Automated build'}"</em>
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getStatusBadge(currentPipeline.status)}
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Total: {currentPipeline.duration_seconds}s
                </span>
              </div>
            </div>

            {/* Visual Pipeline Stages Graph */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              {currentPipeline.stages.map((st, idx) => {
                const isStageSelected = (selectedStage?.id === st.id) || (!selectedStage && idx === 0);
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStage(st)}
                    style={{
                      flex: 1,
                      minWidth: '130px',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: isStageSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      background: isStageSelected ? '#eff6ff' : '#fafbfc',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600 }}>
                        {getStageIcon(st.name)} Stage {st.order}
                      </span>
                      {st.status === 'success' && <CheckCircle2 size={13} color="#16a34a" />}
                      {st.status === 'running' && <Clock size={13} color="#2563eb" className="spin" />}
                      {st.status === 'failed' && <AlertCircle size={13} color="#dc2626" />}
                    </div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {st.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {st.status === 'running' ? 'In progress...' : `${st.duration_seconds}s`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stage Console Output Terminal */}
            <div style={{ background: '#0f172a', borderRadius: '8px', padding: '1rem', color: '#f8fafc', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Terminal size={14} /> Stage Console: {selectedStage ? selectedStage.name : currentPipeline.stages[0]?.name || 'Logs'}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  Status: {selectedStage ? selectedStage.status : currentPipeline.stages[0]?.status || 'idle'}
                </span>
              </div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', maxHeight: '250px', overflowY: 'auto', lineHeight: '1.6' }}>
                {selectedStage ? selectedStage.logs : currentPipeline.stages[0]?.logs || 'No logs captured.'}
              </pre>
            </div>
          </div>
        ) : (
          <div className="empty-state">Select a pipeline run or trigger a new one.</div>
        )}
      </div>
    </div>
  );
};
