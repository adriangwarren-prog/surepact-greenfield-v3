import React from 'react';
import { Search, Activity } from 'lucide-react';

interface ExternalGrant {
  id: string;
  opportunityId: string;
  title: string;
  agency: string;
  category: string;
  value: number;
  openDate: string;
  closeDate: string;
  description: string;
  eligibility: string;
  sourceUrl: string;
  isNew?: boolean;
}

interface SavedSearch {
  id: string;
  name: string;
  category?: string | null;
  minFunding?: number | null;
  maxFunding?: number | null;
  source?: string | null;
}

interface GrantSearchProps {
  externalSearchQuery: string;
  setExternalSearchQuery: (val: string) => void;
  externalSearchCategory: string;
  setExternalSearchCategory: (val: string) => void;
  externalSearchSource: string;
  setExternalSearchSource: (val: string) => void;
  externalSearchMinVal: string;
  setExternalSearchMinVal: (val: string) => void;
  externalSearchMaxVal: string;
  setExternalSearchMaxVal: (val: string) => void;
  savedSearches: SavedSearch[];
  handleDeleteSavedSearch: (id: string) => void;
  setShowSaveSearchModal: (val: boolean) => void;
  externalGrants: any[];
  searchingExternal: boolean;
  grants: any[];
  importingExternalId: string | null;
  handleConsiderExternalGrant: (grant: any) => void;
}

export const GrantSearch: React.FC<GrantSearchProps> = ({
  externalSearchQuery,
  setExternalSearchQuery,
  externalSearchCategory,
  setExternalSearchCategory,
  externalSearchSource,
  setExternalSearchSource,
  externalSearchMinVal,
  setExternalSearchMinVal,
  externalSearchMaxVal,
  setExternalSearchMaxVal,
  savedSearches,
  handleDeleteSavedSearch,
  setShowSaveSearchModal,
  externalGrants,
  searchingExternal,
  grants,
  importingExternalId,
  handleConsiderExternalGrant
}) => {
  return (
    <div className="panel animate" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="panel-card" style={{ padding: '20px', gap: '16px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <Search size={16} color="var(--accent-cyan)" /> Search Parameters
          </h4>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Keyword Search</label>
            <input
              type="text"
              className="url-input"
              style={{ width: '100%', padding: '8px' }}
              placeholder="Search titles, agencies..."
              value={externalSearchQuery}
              onChange={(e) => setExternalSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Industry Sector / Category</label>
            <select
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: 'pointer',
                height: '42px',
                lineHeight: '1.4'
              }}
              value={externalSearchCategory}
              onChange={(e) => setExternalSearchCategory(e.target.value)}
            >
              <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- All Industry Sectors &amp; Categories --</option>
              <option value="Local Government" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Local Government</option>
              <option value="ACCHO / First Nations" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>ACCHO / First Nations</option>
              <option value="Not for profit" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Not for profit</option>
              <option value="Healthcare" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Healthcare</option>
              <option value="Education" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Education</option>
              <option value="Environment & Community" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Environment &amp; Community</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Agency / Source</label>
            <input
              type="text"
              className="url-input"
              style={{ width: '100%', padding: '8px' }}
              placeholder="e.g. Department, Office..."
              value={externalSearchSource}
              onChange={(e) => setExternalSearchSource(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Min Value ($)</label>
              <input
                type="number"
                className="url-input"
                style={{ width: '100%', padding: '8px' }}
                placeholder="e.g. 50000"
                value={externalSearchMinVal}
                onChange={(e) => setExternalSearchMinVal(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Max Value ($)</label>
              <input
                type="number"
                className="url-input"
                style={{ width: '100%', padding: '8px' }}
                placeholder="e.g. 2000000"
                value={externalSearchMaxVal}
                onChange={(e) => setExternalSearchMaxVal(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              onClick={() => {
                setExternalSearchQuery('');
                setExternalSearchCategory('');
                setExternalSearchSource('');
                setExternalSearchMinVal('');
                setExternalSearchMaxVal('');
              }}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              Reset
            </button>
            <button 
              onClick={() => setShowSaveSearchModal(true)}
              className="btn"
              style={{ flex: 1, padding: '8px 12px', fontSize: '12px', background: '#fbbd08', color: '#151226', fontWeight: '700', border: '1px solid #fbbd08' }}
            >
              Save Alert
            </button>
          </div>
        </div>

        <div className="panel-card" style={{ padding: '20px', gap: '12px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <Activity size={16} color="var(--accent-cyan)" /> Saved Alerts
          </h4>

          {savedSearches.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px 0' }}>
              No saved alerts yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedSearches.map(search => (
                <div 
                  key={search.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: 'rgba(255,255,255,0.01)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    padding: '10px 12px', 
                    cursor: 'pointer' 
                  }}
                  onClick={() => {
                    setExternalSearchCategory(search.category || '');
                    setExternalSearchMinVal(search.minFunding ? search.minFunding.toString() : '');
                    setExternalSearchMaxVal(search.maxFunding ? search.maxFunding.toString() : '');
                    setExternalSearchSource(search.source || '');
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{search.name}</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      {search.category || 'All'} {search.minFunding ? `> $${search.minFunding.toLocaleString()}` : ''}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSavedSearch(search.id);
                    }} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', fontSize: '16px' }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clawback Risk Sentinel Widget */}
        <div className="panel-card" style={{ padding: '16px 20px', gap: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderLeft: '4px solid #ef4444', borderRadius: '10px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            🛡️ Clawback Sentinel Risk Monitor
          </h4>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Active Obligated Grants Audit Health:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>First Nations Youth Digital</span>
              <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>🔴 HIGH RISK</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Remote Health Telehealth</span>
              <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid #f59e0b', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>🟡 MED RISK</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Sustainable Infrastructure</span>
              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>🟢 AUDIT READY</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {(() => {
          const matchingAlerts: ExternalGrant[] = [];
          savedSearches.forEach(search => {
            externalGrants.forEach(g => {
              if (g.isNew) {
                let matches = true;
                if (search.category && g.category !== search.category) matches = false;
                if (search.source && !g.agency.toLowerCase().includes(search.source.toLowerCase())) matches = false;
                if (search.minFunding && g.value < search.minFunding) matches = false;
                if (search.maxFunding && g.value > search.maxFunding) matches = false;

                if (matches && !matchingAlerts.some(alert => alert.id === g.id)) {
                  matchingAlerts.push(g);
                }
              }
            });
          });

          if (matchingAlerts.length === 0) return null;

          return (
            <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--accent-cyan)' }}>
                <span>🔔 ALERT: {matchingAlerts.length} New Matching Grants Found Today</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {matchingAlerts.map(alert => (
                  <div key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>{alert.agency}</span>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>{alert.title}</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-success)' }}>
                      ${alert.value.toLocaleString('en-AU')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="panel-card" style={{ padding: '24px', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Australian Grants Repository ({externalGrants.length} available)
            </h4>
            {searchingExternal && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Searching...</span>}
          </div>

          {externalGrants.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '40px', textAlign: 'center' }}>
              No external grants match your search criteria. Adjust filters or keyword inputs.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {externalGrants.map(eg => {
                const isImported = grants.some(g => g.sourceUrl === eg.sourceUrl);
                
                return (
                  <div 
                    key={eg.id} 
                    style={{ 
                      background: 'rgba(255,255,255,0.01)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px', 
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span className="badge badge-potential" style={{ textTransform: 'uppercase', fontSize: '9px', fontWeight: '600' }}>
                            {eg.category}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Opportunity ID: {eg.opportunityId}</span>
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '6px' }}>{eg.title}</h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>{eg.agency}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '18px', color: 'var(--text-primary)' }}>${eg.value.toLocaleString('en-AU')}</strong>
                        <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Closes: {new Date(eg.closeDate).toLocaleDateString('en-AU')}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                      {eg.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        <strong>Eligibility:</strong> {eg.eligibility}
                      </div>

                      <button
                        onClick={() => handleConsiderExternalGrant(eg)}
                        className="btn"
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '11px', 
                          background: isImported ? 'rgba(255,255,255,0.05)' : '#fbbd08', 
                          color: isImported ? 'var(--text-muted)' : '#151226',
                          fontWeight: isImported ? 'normal' : '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        disabled={isImported || importingExternalId === eg.id}
                      >
                        {importingExternalId === eg.id ? 'Importing...' : isImported ? 'Imported (POTENTIAL)' : 'For Consideration'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
