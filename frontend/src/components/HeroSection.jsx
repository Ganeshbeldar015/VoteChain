import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, 
  Play, 
  Server, 
  Sparkles,
  Terminal,
  Wifi,
  WifiOff,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ethers as ethersLib } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../services/blockchain';

/* ── tiny inline terminal used only in the hero ── */
const LOG_TYPES = {
  BOOT:     { icon: '●', color: '#a78bfa' },
  VOTE:     { icon: '✔', color: '#34d399' },
  REGISTER: { icon: 'ℹ', color: '#60a5fa' },
  ELECTION: { icon: '⚡', color: '#fbbf24' },
  WARN:     { icon: '▲', color: '#f87171' },
  NETWORK:  { icon: '◈', color: '#c084fc' },
};
const MAX_LOGS = 40;
function fmtTime(d){ return d.toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'}); }
function short(a){ return a?.length>10?`${a.slice(0,6)}…${a.slice(-4)}`:a; }
function mkLog(type, msg, sub, customTime){ return { id: Date.now()+Math.random(), time: customTime || fmtTime(new Date()), type, msg, sub }; }

function HeroLiveTerminal() {
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const bodyRef = useRef(null);
  const contractRef = useRef(null);

  const push = useCallback((entry) => {
    setLogs(p => { const n=[...p,entry]; return n.length>MAX_LOGS?n.slice(n.length-MAX_LOGS):n; });
    setEvents(n=>n+1);
  }, []);

  useEffect(()=>{ if(autoScroll&&bodyRef.current) bodyRef.current.scrollTop=bodyRef.current.scrollHeight; },[logs,autoScroll]);

  useEffect(()=>{
    let mounted=true;
    const boot=async()=>{
      setLogs([mkLog('BOOT','VoteChain Event Daemon v1.0 initializing...')]);
      if(!window.ethereum){ push(mkLog('WARN','MetaMask not detected. Connect a wallet.')); return; }
      try {
        const provider=new ethersLib.BrowserProvider(window.ethereum);
        const network=await provider.getNetwork();
        if(!mounted) return;
        const chain=network.name==='unknown'?`Chain ${network.chainId}`:network.name;
        push(mkLog('NETWORK',`Connected to ${chain}`));
        push(mkLog('BOOT',`Attaching to ${short(CONTRACT_ADDRESS)}...`));
        const contract=new ethersLib.Contract(CONTRACT_ADDRESS,CONTRACT_ABI,provider);
        contractRef.current=contract;

        // Fetch recent historical events (last 1900 blocks)
        try {
          const currentBlock = await provider.getBlockNumber();
          const fromBlock = Math.max(0, currentBlock - 1900);
          push(mkLog('BOOT', `Scanning recent blocks for on-chain events...`));
          
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
            // Get unique block numbers and query their timestamps in parallel
            const blockNums = [...new Set(allHistorical.map(item => item.block))];
            const blockTimes = {};
            await Promise.all(blockNums.map(async (num) => {
              try {
                const b = await provider.getBlock(num);
                if (b && b.timestamp) {
                  blockTimes[num] = new Date(b.timestamp * 1000);
                }
              } catch (e) {
                console.warn(`Failed to fetch block #${num} timestamp:`, e);
              }
            }));

            // Pre-fetch candidate maps for historical events
            const eids = [...new Set(allHistorical.filter(item => item.type === 'VOTE').map(item => Number(item.log.args[0])))];
            const candidateMaps = {};
            await Promise.all(eids.map(async (eid) => {
              try {
                const list = await contract.getAllCandidates(eid);
                candidateMaps[eid] = list;
              } catch (e) {
                console.warn(`Failed to fetch candidates for election #${eid} during scan`, e);
              }
            }));

            push(mkLog('BOOT', `Loaded ${allHistorical.length} historical logs:`));
            for (const item of allHistorical) {
              const ev = item.log;
              const eventTime = blockTimes[ev.blockNumber] ? fmtTime(blockTimes[ev.blockNumber]) : fmtTime(new Date());
              if (item.type === 'VOTE') {
                const [eid, voter, candidateId] = ev.args;
                const candList = candidateMaps[Number(eid)] || [];
                const candName = candList.find(c => Number(c.id) === Number(candidateId))?.name || `Candidate #${candidateId}`;
                push(mkLog('VOTE', `Vote → ${candName}`, `by ${short(voter)} · Election #${eid} (past event)`, eventTime));
              } else if (item.type === 'REGISTER') {
                const [eid, voter] = ev.args;
                push(mkLog('REGISTER', `Voter registered`, `${short(voter)} · Election #${eid} (past event)`, eventTime));
              } else if (ev.eventName === 'ElectionCreated') {
                const [eid, title] = ev.args;
                push(mkLog('ELECTION', `New election: "${title}" (ID #${eid})`, null, eventTime));
              } else if (ev.eventName === 'ElectionStarted') {
                const [eid] = ev.args;
                push(mkLog('ELECTION', `Election #${eid} started — voting is now OPEN`, null, eventTime));
              } else if (ev.eventName === 'ElectionEnded') {
                const [eid] = ev.args;
                push(mkLog('ELECTION', `Election #${eid} closed — polls are SHUT`, null, eventTime));
              }
            }
          }
        } catch (histError) {
          console.warn("Failed to fetch historical events:", histError);
          push(mkLog('WARN', "Historical scan skipped (RPC range restriction)."));
        }

        // Live event handler with candidate name resolution
        const onVoteCast = async (eid, voter, cid) => {
          if (!mounted) return;
          let candName = `Candidate #${cid}`;
          try {
            const list = await contract.getAllCandidates(eid);
            const found = list.find(c => Number(c.id) === Number(cid));
            if (found && found.name) candName = found.name;
          } catch (err) {
            console.warn("Failed to resolve candidate name on live vote:", err);
          }
          if (mounted) {
            push(mkLog('VOTE', `Vote → ${candName}`, `by ${short(voter)} · Election #${eid}`));
          }
        };

        contract.on('VoteCast', onVoteCast);
        contract.on('VoterRegistered',(eid,voter)=>{ if(!mounted)return; push(mkLog('REGISTER',`Voter registered`,`${short(voter)} · Election #${eid}`)); });
        contract.on('ElectionStarted',(eid)=>{ if(!mounted)return; push(mkLog('ELECTION',`Election #${eid} STARTED`)); });
        contract.on('ElectionEnded',(eid)=>{ if(!mounted)return; push(mkLog('ELECTION',`Election #${eid} ENDED`)); });
        contract.on('CandidateAdded',(eid,cid,name)=>{ if(!mounted)return; push(mkLog('ELECTION',`Candidate "${name}" added`)); });
        contract.on('ElectionCreated',(eid,title)=>{ if(!mounted)return; push(mkLog('ELECTION',`New election: "${title}"`)); });

        if(mounted){ setConnected(true); push(mkLog('BOOT','All listeners active. Awaiting events...')); }
      } catch(err){ if(!mounted)return; push(mkLog('WARN',`Connection failed: ${err.message?.slice(0,60)}`)); }
    };
    boot();
    return ()=>{ mounted=false; if(contractRef.current){contractRef.current.removeAllListeners();contractRef.current=null;} };
  },[push]);

  return (
    <div style={{ fontFamily:"'JetBrains Mono','Fira Code','Courier New',monospace" }}>
      <style>{`
        .terminal-log-container *::selection {
          background: rgba(167, 139, 250, 0.35) !important;
          color: #ffffff !important;
        }
        .terminal-log-container *::-moz-selection {
          background: rgba(167, 139, 250, 0.35) !important;
          color: #ffffff !important;
        }
      `}</style>

      {/* ── Status bar inside the card ── */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom:10, padding:'6px 10px',
        background:'#0f0f1a', borderRadius:'0.75rem',
        border:'1px solid rgba(124,58,237,0.25)',
      }}>
        {/* traffic lights */}
        <div style={{ display:'flex', gap:5 }}>
          <span className="text-terminal" style={{ width:9,height:9,borderRadius:'50%',background:'#ff5f57',display:'block' }}/>
          <span className="text-terminal" style={{ width:9,height:9,borderRadius:'50%',background:'#febc2e',display:'block' }}/>
          <span className="text-terminal" style={{ width:9,height:9,borderRadius:'50%',background:'#28c840',display:'block' }}/>
        </div>
        <span className="text-terminal" style={{ color:'#94a3b8', fontSize:10, display:'flex', alignItems:'center', gap:5 }}>
          <Terminal size={10}/> VoteChain Event Daemon
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10 }}>
          {connected ? <Wifi size={10} style={{color:'#34d399'}}/> : <WifiOff size={10} style={{color:'#ef4444'}}/>}
          <span className="text-terminal" style={{ color:connected?'#34d399':'#ef4444', fontWeight:700, letterSpacing:'0.05em' }}>
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
          <span className="text-terminal" style={{ color:'#64748b', marginLeft:4 }}>{events} ev</span>
        </div>
      </div>

      {/* ── Log area ── */}
      <div
        ref={bodyRef}
        onScroll={()=>{ if(!bodyRef.current)return; const {scrollTop,scrollHeight,clientHeight}=bodyRef.current; setAutoScroll(scrollTop+clientHeight>=scrollHeight-16); }}
        className="terminal-log-container"
        style={{
          height:230, overflowY:'auto',
          background:'#05070c',
          borderRadius:'0.75rem',
          border:'1px solid rgba(124,58,237,0.25)',
          padding:'10px 12px',
          display:'flex', flexDirection:'column', gap:1,
          scrollbarWidth:'thin', scrollbarColor:'rgba(124,58,237,0.2) transparent',
        }}
      >
        <div style={{ color:'#c084fc', fontSize:10, marginBottom:6, letterSpacing:'0.04em' }}>
          ─── Realtime Blockchain Event Monitor ───
        </div>

        <AnimatePresence initial={false}>
          {logs.map(e => {
            const t = LOG_TYPES[e.type] || LOG_TYPES.BOOT;
            return (
              <motion.div
                key={e.id}
                initial={{ opacity:0, x:-6 }}
                animate={{ opacity:1, x:0 }}
                transition={{ duration:0.18 }}
                style={{ fontSize:10.5, marginBottom:1 }}
              >
                <div style={{ display:'flex', gap:7, alignItems:'baseline' }}>
                  <span className="text-terminal" style={{ color:'#64748b', minWidth:58, flexShrink:0 }}>[{e.time}]</span>
                  <span className="text-terminal" style={{ color:t.color, minWidth:12, flexShrink:0 }}>{t.icon}</span>
                  <span className="text-terminal" style={{ color: e.type==='WARN' ? '#fca5a5' : '#f1f5f9' }}>
                    {e.msg}
                  </span>
                </div>
                {e.sub && (
                  <div style={{ paddingLeft:77, fontSize:9.5, color:'#94a3b8' }}>└─ {e.sub}</div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* blinking cursor */}
        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
          <span className="text-terminal" style={{ color:'#64748b', fontSize:10.5 }}>$</span>
          <motion.span
            animate={{ opacity:[1,0,1] }}
            transition={{ duration:1.1, repeat:Infinity }}
            style={{ display:'inline-block', width:6, height:11, background:connected?'#34d399':'#64748b', borderRadius:2 }}
          />
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        marginTop:8, fontSize:10, color:'#475569',
      }}>
        <span className="text-terminal">
          <span className="text-terminal" style={{ color:connected?'#34d399':'#ef4444' }}>●</span>{' '}
          STATUS: <span className="text-terminal" style={{ color:connected?'#34d399':'#ef4444', fontWeight:700 }}>{connected?'LISTENING':'DISCONNECTED'}</span>
        </span>
        <span className="text-terminal">EVENTS: <span className="text-terminal" style={{ color:'#64748b' }}>{events}</span></span>
        {!autoScroll && (
          <button
            onClick={()=>{ setAutoScroll(true); if(bodyRef.current) bodyRef.current.scrollTop=bodyRef.current.scrollHeight; }}
            style={{ background:'rgba(124,58,237,0.12)', color:'#a78bfa', border:'1px solid rgba(124,58,237,0.25)', borderRadius:9999, padding:'2px 8px', cursor:'pointer', fontSize:10, display:'flex', alignItems:'center', gap:3 }}
          >
            <ChevronDown size={9}/> bottom
          </button>
        )}
      </div>

    </div>
  );
}

const HeroSection = () => {
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 600], [1, 1.15]);
  const y = useTransform(scrollY, [0, 600], [0, 50]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background pt-20 pb-12">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.img 
          src="/blockchain-img.jpg" 
          alt="Blockchain background" 
          style={{ scale, y }}
          className="w-full h-full object-cover opacity-[0.18]"
        />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Title, Intro and Live Metrics */}
          <div className="lg:col-span-6 text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Premium Badge */}
              <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-4 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-accent" />
                  Web3 Active Network
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-[3.25rem] font-extrabold mb-4 tracking-tight leading-tight">
                Secure, Transparent <br />
                & <span className="gradient-text">Decentralized Voting</span>
              </h1>
              
              <p className="text-base text-muted max-w-xl mb-6 leading-relaxed">
                VoteChain implements absolute transparency in elections. Powered by zero-knowledge integrity, cryptographic keys, and permissionless audit logs.
              </p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
                <Link to="/elections">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-primary hover:bg-secondary text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-primary/20 transition-all w-full sm:w-auto"
                  >
                    <span>Launch App</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                
                <Link to="/results">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-900 px-8 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 backdrop-blur-sm transition-all w-full sm:w-auto"
                  >
                    <Play className="w-4 h-4 fill-zinc-900 mr-1" />
                    <span>View Results</span>
                  </motion.button>
                </Link>
              </div>


            </motion.div>
          </div>

          {/* Right Column: Interactive Voting Simulator Console */}
          <div className="lg:col-span-6 relative flex justify-center">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full max-w-md relative"
            >
              {/* Outer Decorative Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-zinc-200 to-zinc-300 rounded-3xl blur opacity-25" />
              
              {/* Simulator Card */}
              <div className="glass-card rounded-3xl p-6 relative overflow-hidden shadow-2xl border border-zinc-200 bg-white">
                
               {/* Console Header */}
                <div className="flex justify-between items-center pb-3 border-b border-zinc-100 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="font-mono text-xs font-bold text-zinc-500">VoteChain Terminal</span>
                  </div>
                  <div className="bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-full text-[10px] font-bold text-zinc-600 flex items-center">
                    <Server className="w-3 h-3 mr-1 text-zinc-500" /> Sepolia
                  </div>
                </div>

                {/* Real-time Blockchain Event Daemon */}
                <HeroLiveTerminal />

              </div>



            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
