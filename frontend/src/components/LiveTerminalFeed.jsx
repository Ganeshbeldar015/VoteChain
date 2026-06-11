import { useState, useEffect, useRef, useCallback } from 'react';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Wifi, WifiOff, Circle, ChevronDown } from 'lucide-react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../services/blockchain';

/* ─────────────────────────────────────────────────────────────────────
   LiveTerminalFeed
   Subscribes to on-chain events (VoteCast, VoterRegistered, etc.)
   via ethers.js and renders them as a real-time terminal log.
   ───────────────────────────────────────────────────────────────────── */

const LOG_TYPES = {
  BOOT:      { icon: '●', color: '#a78bfa', label: 'SYSTEM' },
  VOTE:      { icon: '✔', color: '#34d399', label: 'VOTE   ' },
  REGISTER:  { icon: 'ℹ', color: '#60a5fa', label: 'VOTER  ' },
  ELECTION:  { icon: '⚡', color: '#fbbf24', label: 'ADMIN  ' },
  WARN:      { icon: '▲', color: '#f87171', label: 'WARN   ' },
  NETWORK:   { icon: '◈', color: '#c084fc', label: 'NETWORK' },
};

const MAX_LOGS = 60;

function fmt(date) {
  return date.toLocaleTimeString('en-US', { hour12: false,
    hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function shortAddr(addr) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function makeEntry(type, message, extra = {}) {
  return {
    id: Date.now() + Math.random(),
    time: fmt(new Date()),
    type,
    message,
    ...extra,
  };
}

/* ─────────────────────────────────────────────────────────────────────── */

export default function LiveTerminalFeed({ electionId, candidatesData = [] }) {
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [nodeInfo, setNodeInfo] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);
  const terminalRef = useRef(null);
  const contractRef = useRef(null);

  const push = useCallback((entry) => {
    setLogs(prev => {
      const next = [...prev, entry];
      return next.length > MAX_LOGS ? next.slice(next.length - MAX_LOGS) : next;
    });
    setTotalEvents(n => n + 1);
  }, []);

  /* auto-scroll */
  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  /* detect manual scroll up */
  const handleScroll = () => {
    if (!terminalRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
    setAutoScroll(scrollTop + clientHeight >= scrollHeight - 20);
  };

  /* ── bootstrap the event listener ── */
  useEffect(() => {
    let provider;
    let contract;
    let mounted = true;

    const boot = async () => {
      /* Boot messages */
      setLogs([
        makeEntry('BOOT', 'VoteChain Event Daemon v1.0 initializing...'),
      ]);
      setConnected(false);

      if (!window.ethereum) {
        push(makeEntry('WARN', 'MetaMask not detected – connect a wallet to enable live feed.'));
        return;
      }

      try {
        provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        if (!mounted) return;

        const chainName = network.name === 'unknown' ? `Chain ${network.chainId}` : network.name;
        setNodeInfo(chainName);

        push(makeEntry('NETWORK', `Connected to ${chainName} (chainId: ${network.chainId})`));
        push(makeEntry('BOOT', `Attaching to contract ${shortAddr(CONTRACT_ADDRESS)}...`));

        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        contractRef.current = contract;

        /* Fetch historical events (last 1900 blocks to comply with RPC range limitations) */
        try {
          const currentBlock = await provider.getBlockNumber();
          const fromBlock = Math.max(0, currentBlock - 1900);
          
          push(makeEntry('BOOT', `Scanning recent blocks for on-chain events...`));
          
          const voteFilter = contract.filters.VoteCast();
          const registerFilter = contract.filters.VoterRegistered();
          const createFilter = contract.filters.ElectionCreated();
          const startFilter = contract.filters.ElectionStarted();
          const endFilter = contract.filters.ElectionEnded();
          
          const [votes, registers, creations, starts, ends] = await Promise.all([
            contract.queryFilter(voteFilter, fromBlock),
            contract.queryFilter(registerFilter, fromBlock),
            contract.queryFilter(createFilter, fromBlock),
            contract.queryFilter(startFilter, fromBlock),
            contract.queryFilter(endFilter, fromBlock)
          ]);
          
          const allHistorical = [
            ...votes.map(ev => ({ type: 'VOTE', block: ev.blockNumber, txIndex: ev.transactionIndex, log: ev })),
            ...registers.map(ev => ({ type: 'REGISTER', block: ev.blockNumber, txIndex: ev.transactionIndex, log: ev })),
            ...creations.map(ev => ({ type: 'ELECTION', block: ev.blockNumber, txIndex: ev.transactionIndex, log: ev })),
            ...starts.map(ev => ({ type: 'ELECTION', block: ev.blockNumber, txIndex: ev.transactionIndex, log: ev })),
            ...ends.map(ev => ({ type: 'ELECTION', block: ev.blockNumber, txIndex: ev.transactionIndex, log: ev }))
          ].sort((a, b) => a.block - b.block || a.txIndex - b.txIndex);
          
          if (mounted && allHistorical.length > 0) {
            push(makeEntry('BOOT', `Loaded ${allHistorical.length} historical logs:`));
            for (const item of allHistorical) {
              const ev = item.log;
              if (item.type === 'VOTE') {
                const [eid, voter, candidateId] = ev.args;
                const candName = candidatesData.find(c =>
                  Number(c.id ?? candidatesData.indexOf(c)) === Number(candidateId)
                )?.name || `Candidate #${candidateId}`;
                push(makeEntry('VOTE', `Vote cast → ${candName}`, { sub: `by ${shortAddr(voter)} on Election #${eid} (past event)` }));
              } else if (item.type === 'REGISTER') {
                const [eid, voter] = ev.args;
                push(makeEntry('REGISTER', `Voter registered`, { sub: `${shortAddr(voter)} on Election #${eid} (past event)` }));
              } else if (ev.eventName === 'ElectionCreated') {
                const [eid, title] = ev.args;
                push(makeEntry('ELECTION', `New election: "${title}" (ID #${eid})`));
              } else if (ev.eventName === 'ElectionStarted') {
                const [eid] = ev.args;
                push(makeEntry('ELECTION', `Election #${eid} started — voting is now OPEN`));
              } else if (ev.eventName === 'ElectionEnded') {
                const [eid] = ev.args;
                push(makeEntry('ELECTION', `Election #${eid} closed — polls are SHUT`));
              }
            }
          }
        } catch (histError) {
          console.warn("Failed to fetch historical events:", histError);
          push(makeEntry('WARN', "Historical scan skipped (RPC range restriction)."));
        }

        /* ── VoteCast ── */
        const onVoteCast = (eid, voter, candidateId) => {
          if (!mounted) return;
          const candName = candidatesData.find(c =>
            Number(c.id ?? candidatesData.indexOf(c)) === Number(candidateId)
          )?.name || `Candidate #${candidateId}`;

          push(makeEntry('VOTE',
            `Vote cast → ${candName}`,
            { sub: `by ${shortAddr(voter)} on Election #${eid}` }
          ));

          /* refresh results by dispatching custom event */
          window.dispatchEvent(new CustomEvent('votechain:voteCast', {
            detail: { electionId: Number(eid), candidateId: Number(candidateId), voter }
          }));
        };

        /* ── VoterRegistered ── */
        const onVoterRegistered = (eid, voter) => {
          if (!mounted) return;
          push(makeEntry('REGISTER',
            `Voter registered`,
            { sub: `${shortAddr(voter)} on Election #${eid}` }
          ));
        };

        /* ── ElectionStarted ── */
        const onElectionStarted = (eid) => {
          if (!mounted) return;
          push(makeEntry('ELECTION', `Election #${eid} started — voting is now OPEN`));
        };

        /* ── ElectionEnded ── */
        const onElectionEnded = (eid) => {
          if (!mounted) return;
          push(makeEntry('ELECTION', `Election #${eid} closed — polls are SHUT`));
        };

        /* ── CandidateAdded ── */
        const onCandidateAdded = (eid, cid, name) => {
          if (!mounted) return;
          push(makeEntry('ELECTION', `Candidate added: "${name}" (Election #${eid})`));
        };

        /* ── ElectionCreated ── */
        const onElectionCreated = (eid, title) => {
          if (!mounted) return;
          push(makeEntry('ELECTION', `New election created: "${title}" (ID #${eid})`));
        };

        /* Subscribe */
        contract.on('VoteCast', onVoteCast);
        contract.on('VoterRegistered', onVoterRegistered);
        contract.on('ElectionStarted', onElectionStarted);
        contract.on('ElectionEnded', onElectionEnded);
        contract.on('CandidateAdded', onCandidateAdded);
        contract.on('ElectionCreated', onElectionCreated);

        if (mounted) {
          setConnected(true);
          push(makeEntry('BOOT', 'All event listeners active. Awaiting blockchain events...'));
        }

      } catch (err) {
        if (!mounted) return;
        push(makeEntry('WARN', `Failed to connect: ${err.message?.slice(0, 80) ?? 'Unknown error'}`));
      }
    };

    boot();

    return () => {
      mounted = false;
      if (contractRef.current) {
        contractRef.current.removeAllListeners();
        contractRef.current = null;
      }
    };
    // Re-connect if candidatesData changes so name mapping stays fresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId]);

  /* ── render ── */
  return (
    <div className="rounded-[2rem] overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0d0d14 0%, #0a0a12 100%)',
      border: '1px solid rgba(124,58,237,0.25)',
      boxShadow: '0 0 40px rgba(124,58,237,0.08), 0 2px 0 rgba(255,255,255,0.04) inset',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace",
    }}>

      {/* ── Title bar ── */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
      }}>
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', display:'block' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', display:'block' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', display:'block' }} />
        </div>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px' }}>
          <Terminal size={14} />
          <span>VoteChain Event Daemon</span>
          {nodeInfo && (
            <span style={{
              background: 'rgba(124,58,237,0.2)', color: '#a78bfa',
              borderRadius: '9999px', padding: '2px 10px', fontSize: '11px',
            }}>{nodeInfo}</span>
          )}
        </div>

        {/* Status pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {connected
            ? <Wifi size={13} style={{ color: '#34d399' }} />
            : <WifiOff size={13} style={{ color: '#f87171' }} />
          }
          <span style={{ fontSize: '11px', color: connected ? '#34d399' : '#f87171', letterSpacing: '0.05em' }}>
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
          <span style={{ fontSize: '11px', color: '#475569', marginLeft: '8px' }}>
            {totalEvents} events
          </span>
        </div>
      </div>

      {/* ── Log body ── */}
      <div
        ref={terminalRef}
        onScroll={handleScroll}
        style={{
          height: '340px', overflowY: 'auto', padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: '2px',
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(124,58,237,0.3) transparent',
        }}
      >
        {/* Boot header */}
        <div style={{ color: '#a78bfa', fontSize: '12px', marginBottom: '10px', letterSpacing: '0.05em' }}>
          ─── VoteChain Realtime Event Monitor ─── Sepolia Testnet ───
        </div>

        <AnimatePresence initial={false}>
          {logs.map((entry) => {
            const t = LOG_TYPES[entry.type] || LOG_TYPES.BOOT;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'flex', flexDirection: 'column', marginBottom: '1px' }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', fontSize: '12.5px' }}>
                  {/* timestamp */}
                  <span style={{ color: '#475569', minWidth: '70px', flexShrink: 0 }}>
                    [{entry.time}]
                  </span>
                  {/* type icon */}
                  <span style={{ color: t.color, minWidth: '18px', flexShrink: 0 }}>{t.icon}</span>
                  {/* label */}
                  <span style={{ color: '#64748b', fontSize: '11px', minWidth: '62px', flexShrink: 0 }}>
                    {t.label}
                  </span>
                  {/* message */}
                  <span style={{ color: entry.type === 'VOTE' ? '#e2e8f0' : entry.type === 'WARN' ? '#fca5a5' : '#cbd5e1' }}>
                    {entry.message}
                  </span>
                </div>
                {entry.sub && (
                  <div style={{
                    paddingLeft: '170px', fontSize: '11px', color: '#475569',
                    marginTop: '1px'
                  }}>
                    └─ {entry.sub}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Blinking cursor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
          <span style={{ color: '#475569', fontSize: '12.5px' }}>$</span>
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
            style={{
              display: 'inline-block', width: '8px', height: '14px',
              background: connected ? '#34d399' : '#475569', borderRadius: '2px',
            }}
          />
        </div>
      </div>

      {/* ── Footer bar ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 20px', fontSize: '11px',
      }}>
        <span style={{ color: '#475569' }}>
          <span style={{ color: connected ? '#34d399' : '#f87171', marginRight: 6 }}>●</span>
          STATUS: <span style={{ color: connected ? '#34d399' : '#f87171', letterSpacing: '0.05em' }}>
            {connected ? 'LISTENING' : 'DISCONNECTED'}
          </span>
        </span>

        <span style={{ color: '#475569' }}>
          EVENTS CAPTURED: <span style={{ color: '#94a3b8' }}>{totalEvents}</span>
        </span>

        {!autoScroll && (
          <button
            onClick={() => {
              setAutoScroll(true);
              if (terminalRef.current)
                terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'rgba(124,58,237,0.2)', color: '#a78bfa',
              border: '1px solid rgba(124,58,237,0.3)', borderRadius: '9999px',
              padding: '2px 10px', cursor: 'pointer', fontSize: '11px',
            }}
          >
            <ChevronDown size={11} /> scroll to bottom
          </button>
        )}

        <span style={{ color: '#334155' }}>
          {new Date().toISOString().slice(0, 19)} UTC
        </span>
      </div>
    </div>
  );
}
