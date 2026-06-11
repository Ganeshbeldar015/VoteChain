import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Wallet, 
  Server, 
  RefreshCw, 
  Sparkles,
  Lock,
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
function mkLog(type, msg, sub){ return { id: Date.now()+Math.random(), time: fmtTime(new Date()), type, msg, sub }; }

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

        contract.on('VoteCast',(eid,voter,cid)=>{ if(!mounted)return; push(mkLog('VOTE',`Vote → Candidate #${cid}`,`by ${short(voter)} · Election #${eid}`)); });
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
    <div style={{ fontFamily:"'JetBrains Mono','Fira Code','Courier New',monospace", background:'#0a0a12', borderRadius:'1.25rem', border:'1px solid rgba(124,58,237,0.3)', overflow:'hidden', boxShadow:'0 0 32px rgba(124,58,237,0.12)' }}>
      {/* title bar */}
      <div style={{ background:'rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px' }}>
        <div style={{ display:'flex', gap:6 }}>
          <span style={{ width:10,height:10,borderRadius:'50%',background:'#ff5f57',display:'block' }}/>
          <span style={{ width:10,height:10,borderRadius:'50%',background:'#febc2e',display:'block' }}/>
          <span style={{ width:10,height:10,borderRadius:'50%',background:'#28c840',display:'block' }}/>
        </div>
        <span style={{ color:'#64748b', fontSize:11, display:'flex', alignItems:'center', gap:6 }}>
          <Terminal size={11}/> VoteChain Event Daemon
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:10 }}>
          {connected ? <Wifi size={11} style={{color:'#34d399'}}/> : <WifiOff size={11} style={{color:'#f87171'}}/>}
          <span style={{ color: connected?'#34d399':'#f87171', letterSpacing:'0.05em' }}>{connected?'LIVE':'OFFLINE'}</span>
          <span style={{ color:'#334155', marginLeft:6 }}>{events} events</span>
        </div>
      </div>

      {/* log body */}
      <div ref={bodyRef} onScroll={()=>{ if(!bodyRef.current)return; const {scrollTop,scrollHeight,clientHeight}=bodyRef.current; setAutoScroll(scrollTop+clientHeight>=scrollHeight-16); }} style={{ height:220, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:1, scrollbarWidth:'thin', scrollbarColor:'rgba(124,58,237,0.25) transparent' }}>
        <div style={{ color:'#6d28d9', fontSize:10, marginBottom:8, letterSpacing:'0.04em' }}>─── Realtime Blockchain Event Monitor ───</div>
        <AnimatePresence initial={false}>
          {logs.map(e=>{
            const t=LOG_TYPES[e.type]||LOG_TYPES.BOOT;
            return (
              <motion.div key={e.id} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{duration:0.2}} style={{ fontSize:11, marginBottom:1 }}>
                <div style={{ display:'flex', gap:8, alignItems:'baseline' }}>
                  <span style={{ color:'#334155', minWidth:62, flexShrink:0 }}>[{e.time}]</span>
                  <span style={{ color:t.color, minWidth:14, flexShrink:0 }}>{t.icon}</span>
                  <span style={{ color:e.type==='VOTE'?'#e2e8f0':e.type==='WARN'?'#fca5a5':'#94a3b8' }}>{e.msg}</span>
                </div>
                {e.sub && <div style={{ paddingLeft:84, fontSize:10, color:'#334155' }}>└─ {e.sub}</div>}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {/* cursor */}
        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
          <span style={{ color:'#334155', fontSize:11 }}>$</span>
          <motion.span animate={{opacity:[1,0,1]}} transition={{duration:1.1,repeat:Infinity}} style={{ display:'inline-block', width:7, height:12, background:connected?'#34d399':'#334155', borderRadius:2 }}/>
        </div>
      </div>

      {/* footer */}
      <div style={{ background:'rgba(255,255,255,0.02)', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 14px', fontSize:10, color:'#334155' }}>
        <span><span style={{color:connected?'#34d399':'#f87171'}}>●</span> {connected?'LISTENING':'DISCONNECTED'}</span>
        <span>EVENTS: <span style={{color:'#64748b'}}>{events}</span></span>
        {!autoScroll&&<button onClick={()=>{setAutoScroll(true);if(bodyRef.current)bodyRef.current.scrollTop=bodyRef.current.scrollHeight;}} style={{background:'rgba(124,58,237,0.15)',color:'#a78bfa',border:'1px solid rgba(124,58,237,0.25)',borderRadius:9999,padding:'2px 8px',cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',gap:3}}><ChevronDown size={9}/>bottom</button>}
      </div>
    </div>
  );
}

const getUnixTimestamp = () => Math.floor(Date.now() / 1000);

const HeroSection = () => {
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 600], [1, 1.15]);
  const y = useTransform(scrollY, [0, 600], [0, 50]);

  // Simulator States
  const [candidates, setCandidates] = useState([
    { id: 1, name: "Alice Vance", party: "Decentralized Future", votes: 142, avatar: "AV" },
    { id: 2, name: "Bob Jenkins", party: "Trust & Transparency", votes: 128, avatar: "BJ" }
  ]);
  const [votedFor, setVotedFor] = useState(null);
  const [simState, setSimState] = useState('idle'); // 'idle', 'preparing', 'confirm-request', 'mining', 'success'
  const [txHash, setTxHash] = useState('');
  const [blockNum, setBlockNum] = useState(0);
  const [simTimestamp, setSimTimestamp] = useState(0);
  const [heroTab, setHeroTab] = useState('demo'); // 'demo' | 'live'

  const startSimulation = (candidateId) => {
    setVotedFor(candidateId);
    setSimTimestamp(getUnixTimestamp());
    setSimState('preparing');
    
    setTimeout(() => {
      setSimState('confirm-request');
    }, 1000);
  };

  const approveSignature = () => {
    setSimState('mining');
    
    setTimeout(() => {
      // Increment vote count
      setCandidates(prev => prev.map(c => {
        if (c.id === votedFor) {
          return { ...c, votes: c.votes + 1 };
        }
        return c;
      }));
      
      // Generate mock tx hash and block
      const randomHash = "0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
      const randomBlock = Math.floor(Math.random() * 50000) + 4820192;
      
      setTxHash(randomHash);
      setBlockNum(randomBlock);
      setSimState('success');
    }, 2000);
  };

  const resetSimulation = () => {
    setCandidates([
      { id: 1, name: "Alice Vance", party: "Decentralized Future", votes: 142, avatar: "AV" },
      { id: 2, name: "Bob Jenkins", party: "Trust & Transparency", votes: 128, avatar: "BJ" }
    ]);
    setVotedFor(null);
    setSimState('idle');
    setTxHash('');
    setBlockNum(0);
  };

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
                
               {/* Console Header with Tab Toggle */}
                <div className="mb-4">
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-100 mb-3">
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
                  {/* Tab switcher */}
                  <div className="flex bg-zinc-100 rounded-xl p-1 gap-1">
                    <button
                      onClick={() => setHeroTab('demo')}
                      className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all ${heroTab === 'demo' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                      🗳 Demo Simulator
                    </button>
                    <button
                      onClick={() => setHeroTab('live')}
                      className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${heroTab === 'live' ? 'bg-zinc-900 text-green-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${heroTab === 'live' ? 'bg-green-400 animate-pulse' : 'bg-zinc-400'}`} />
                      Live Feed
                    </button>
                  </div>
                </div>

                {/* Main Simulator Window Content */}
                <AnimatePresence mode="wait">
                  {heroTab === 'live' ? (
                    <motion.div key="live" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}}>
                      <HeroLiveTerminal />
                    </motion.div>
                  ) : (
                  <motion.div key="demo" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}}>
                  <div className="relative min-h-[260px] flex flex-col justify-between">
                  <AnimatePresence mode="wait">
                    
                    {/* IDLE STATE */}
                    {simState === 'idle' && (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <p className="text-sm font-semibold text-zinc-700 mb-2">Select a candidate to simulate your secure vote:</p>
                        {candidates.map((c) => (
                          <div 
                            key={c.id} 
                            className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex justify-between items-center hover:border-zinc-300 hover:bg-zinc-100/50 transition-all group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-zinc-900 text-white font-bold rounded-xl flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform">
                                {c.avatar}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-zinc-900">{c.name}</h4>
                                <p className="text-[10px] text-muted font-medium">{c.party}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-xs font-bold text-zinc-500">{c.votes} votes</span>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => startSimulation(c.id)}
                                className="bg-primary hover:bg-secondary text-white text-xs px-3.5 py-2 rounded-xl font-bold transition-all shadow-md shadow-primary/5"
                              >
                                Vote
                              </motion.button>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* PREPARING STATE */}
                    {simState === 'preparing' && (
                      <motion.div
                        key="preparing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                      >
                        <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
                        <h4 className="font-bold text-base mb-1 text-zinc-800">Initializing Secure Handshake</h4>
                        <p className="text-xs text-muted max-w-[200px]">Generating zero-knowledge proof tokens for registration verification...</p>
                      </motion.div>
                    )}

                    {/* CONFIRMATION POPUP OVERLAY */}
                    {simState === 'confirm-request' && (
                      <motion.div
                        key="confirm-request"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col justify-between h-full bg-zinc-50 border border-zinc-200 rounded-2xl p-5 shadow-inner"
                      >
                        <div>
                          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 mb-3">
                            <Wallet className="w-4 h-4" />
                            <span>MetaMask Signature Request</span>
                          </div>
                          <h4 className="font-extrabold text-sm text-zinc-800 mb-2">Sign Transaction Request</h4>
                          <p className="text-[11px] text-muted leading-relaxed">
                            Sign this message to authorize casting a vote for <span className="font-bold text-zinc-800">{candidates.find(c => c.id === votedFor)?.name}</span>. This request is free and will not consume Base Sepolia Gas.
                          </p>
                          <div className="bg-white border border-zinc-200 rounded-xl p-3 mt-4 font-mono text-[10px] text-zinc-500 break-all select-none">
                            {"{ "}
                            "action": "castVote",
                            "electionId": 1,
                            "candidateId": {votedFor},
                            "timestamp": {simTimestamp}
                            {" }"}
                          </div>
                        </div>
                        <div className="flex space-x-3 mt-6">
                          <button
                            onClick={resetSimulation}
                            className="flex-1 py-3 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-bold transition-all"
                          >
                            Reject
                          </button>
                          <button
                            onClick={approveSignature}
                            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-green-600/10"
                          >
                            Approve & Sign
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* MINING STATE */}
                    {simState === 'mining' && (
                      <motion.div
                        key="mining"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                      >
                        <RefreshCw className="w-10 h-10 text-green-600 animate-spin mb-4" />
                        <h4 className="font-bold text-base mb-1 text-zinc-800">Mining Blockchain Transaction</h4>
                        <p className="text-xs text-muted max-w-[240px]">Awaiting node consensus. Validating zero-knowledge constraints and storing root leaf to block...</p>
                      </motion.div>
                    )}

                    {/* SUCCESS STATE */}
                    {simState === 'success' && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col justify-between h-full bg-green-50/50 border border-green-100 rounded-2xl p-5 text-left"
                      >
                        <div>
                          <div className="flex items-center space-x-2 text-green-600 font-bold text-xs mb-3">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Transaction Success!</span>
                          </div>
                          
                          <p className="text-[11px] text-zinc-600 leading-relaxed mb-4">
                            Your vote for <span className="font-bold text-zinc-800">{candidates.find(c => c.id === votedFor)?.name}</span> has been written immutably to the ledger.
                          </p>

                          <div className="bg-white border border-green-100 rounded-xl p-3.5 space-y-2 font-mono text-[10px] text-zinc-500 shadow-sm">
                            <p className="flex justify-between"><span className="font-bold text-zinc-700">Block Number:</span> <span className="text-zinc-600">#{blockNum}</span></p>
                            <p className="flex justify-between"><span className="font-bold text-zinc-700">Gas Used:</span> <span className="text-green-600">0 Gwei (Sponsored)</span></p>
                            <div className="pt-2 border-t border-zinc-100">
                              <span className="font-bold text-zinc-700 block mb-1">Tx Hash:</span>
                              <span className="text-zinc-600 break-all">{txHash}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={resetSimulation}
                          className="w-full mt-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-lg"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Simulate Another Vote</span>
                        </button>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
                  </motion.div>
                  )}
                </AnimatePresence>

              </div>



            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
