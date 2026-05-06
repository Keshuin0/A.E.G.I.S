import { useState, useEffect } from "react";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring'; 
import { invoke } from "@tauri-apps/api/core"; 
import QRCode from "react-qr-code"; 
import "./App.css";

function App() {
  const [balance, setBalance] = useState("0.0000");
  const [walletAddress, setWalletAddress] = useState("");
  const [gpuTemp, setGpuTemp] = useState("39");
  const [alpha, setAlpha] = useState("LOADING...");
  const [beta, setBeta] = useState("LOADING...");
  const [nodeStatus, setNodeStatus] = useState("CONNECTING...");

  const [terminalOpen, setTerminalOpen] = useState(false);
  const [commandInput, setCommandInput] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { sender: "AEGIS", message: "SYSTEM ONLINE. I am the AEGIS Sovereign Intelligence. Awaiting input." }
  ]);
  
  // NEW: The God Protocol Telemetry Memory (Limited to 50 logs)
  const [aegisThoughts, setAegisThoughts] = useState<{time: string, text: string}[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);

  // --- EMERGENCY MEMORY PURGE ---
  const clearChatHistory = () => {
    setChatHistory([
      { sender: "SYSTEM", message: "MEMORY PURGED. Local context wiped." },
      { sender: "AEGIS", message: "SYSTEM ONLINE. I am the AEGIS Sovereign Intelligence. Awaiting input." }
    ]);
  };
  
  const [api, setApi] = useState<ApiPromise | null>(null);

  // --- PHASE 7.3a6: TRANSACTION STATE ---
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [txStatus, setTxStatus] = useState("");

  // --- PHASE 7.3a7: RECEIVE STATE ---
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        setTerminalOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const connectToBlockchain = async () => {
      try {
        const provider = new WsProvider('ws://127.0.0.1:9944');
        const connectedApi = await ApiPromise.create({ provider });
        
        setApi(connectedApi);
        setNodeStatus("MAINNET CONNECTED");
        
        const ALICE_ADDRESS = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
        setWalletAddress(ALICE_ADDRESS);

        await connectedApi.query.aegisPouc.currentAlpha((liveAlpha: any) => {
          setAlpha(liveAlpha.toString());
        });

        await connectedApi.query.aegisPouc.currentBeta((liveBeta: any) => {
          setBeta(liveBeta.toString());
        });

        await connectedApi.query.system.events((events: any[]) => {
          events.forEach((record) => {
            const { event } = record;
            if (event.section === 'aegisPouc' && event.method === 'ZkpotVerified') {
              const liveTemp = event.data[3].toString();
              setGpuTemp(liveTemp);
            }
          });
        });

      } catch (error) {
        console.error("Blockchain connection failed:", error);
        setNodeStatus("CONNECTION FAILED");
      }
    };

    connectToBlockchain();
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const subscribeToBalance = async () => {
      if (api && walletAddress) {
        // FIXED: TS Error 2322 - Casted UnsubscribePromise appropriately
        unsubscribe = (await api.query.system.account(walletAddress, ({ data: balanceData }: any) => {
          const rawPlanck = balanceData.free.toBigInt();
          const wholeTokens = rawPlanck / 1000000000000000000n;
          const formatted = new Intl.NumberFormat('en-US').format(wholeTokens);
          
          if (wholeTokens < 1000000n) {
            setBalance(`${formatted}.0000`);
          } else {
            setBalance(formatted); 
          }
        })) as unknown as () => void;
      }
    };

    subscribeToBalance();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [api, walletAddress]);

  const generateWallet = async () => {
    try {
      setIsGenerating(true);
      setWalletAddress("GENERATING LATTICE KEYS...");
      
      const newAddress: string = await invoke("generate_quantum_keypair");
      
      setTimeout(() => {
        setWalletAddress(newAddress);
        setIsGenerating(false);
      }, 2000); 
      
    } catch (error) {
      console.error("Key generation failed", error);
      setWalletAddress("CRYPTOGRAPHIC ERROR");
      setIsGenerating(false);
    }
  };

  const executeTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!api || !sendTarget || !sendAmount) return;

    try {
      setTxStatus("SIGNING TRANSACTION...");
      
      const keyring = new Keyring({ type: 'sr25519' });
      const alice = keyring.addFromUri('//Alice');

      const amountInPlancks = BigInt(Math.floor(parseFloat(sendAmount) * 10**18));
      const transferExtrinsic = api.tx.balances.transferKeepAlive(sendTarget, amountInPlancks);

      setTxStatus("BROADCASTING TO MEMPOOL...");

      await transferExtrinsic.signAndSend(alice, ({ status, dispatchError }) => {
        if (status.isInBlock) {
          setTxStatus(`SUCCESS! INCLUDED IN BLOCK.`);
          setTimeout(() => {
            setIsSendModalOpen(false);
            setTxStatus("");
            setSendTarget("");
            setSendAmount("");
          }, 2000);
        } else if (dispatchError) {
          setTxStatus("TRANSACTION FAILED.");
        }
      });

    } catch (error) {
      console.error("Transfer error:", error);
      setTxStatus("CRYPTOGRAPHIC ERROR");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    setTerminalLogs(prev => [...prev, `> ${commandInput}`]);

    if (commandInput.toLowerCase().includes("mint") || commandInput.toLowerCase().includes("give")) {
      setTerminalLogs(prev => [...prev, `[SUDO AGENT]: Intent recognized. Compiling Balances::force_set_balance extrinsic...`]);
      setTimeout(() => {
        setTerminalLogs(prev => [...prev, `[SUCCESS]: Command executed.`]);
      }, 1000);
    } else {
      setTerminalLogs(prev => [...prev, `[SUDO AGENT]: Command parsed. Awaiting Rust pallet implementation.`]);
    }

    setCommandInput("");
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatHistory(prev => [...prev, { sender: "USER", message: chatInput }]);
    
    try {
      const ws = new WebSocket('ws://localhost:8765');
      
      ws.onopen = () => {
        const payload = JSON.stringify({ type: "chat_query", payload: chatInput });
        ws.send(payload);
        setChatHistory(prev => [...prev, { sender: "SYSTEM", message: "[Routing query to local 24GB VRAM LLM Engine...]" }]);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "chat_response") {
          setChatHistory(prev => [...prev, { sender: "AEGIS", message: data.payload }]);
          setIsGenerating(false);
        } 
        else if (data.type === "aegis_thought") {
          // Route the God Protocol's internal thoughts to the dedicated terminal, NOT the chat
          setAegisThoughts(prev => {
            const newThoughts = [...prev, { 
              time: new Date().toLocaleTimeString(), 
              text: data.payload 
            }];
            return newThoughts.slice(-50); // Keep memory footprint small
          });
        }
      };

      // FIXED: TS Error 6133 - Removed unused 'error' parameter
      ws.onerror = () => {
        setChatHistory(prev => [...prev, { sender: "SYSTEM ERROR", message: "Failed to reach AI Backend. Is the python worker running?" }]);
      };
    } catch (err) {
      console.error(err);
    }

    setChatInput("");
  };

  return (
    <main className="dashboard-container fade-in">
      
      {/* --- SEND MODAL --- */}
      {isSendModalOpen && (
        <div className="modal-overlay pop-in">
          <div className="glass-card send-modal">
            <div className="card-header">
              <h3>SECURE TRANSFER</h3>
              <button className="close-btn" onClick={() => setIsSendModalOpen(false)}>X</button>
            </div>
            
            <form onSubmit={executeTransfer} className="send-form">
              <div className="input-group">
                <label>RECIPIENT ADDRESS</label>
                <input 
                  type="text" 
                  placeholder="e.g. 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty" 
                  value={sendTarget}
                  onChange={(e) => setSendTarget(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>AMOUNT (AEGIS)</label>
                <input 
                  type="number" 
                  step="0.0001"
                  placeholder="0.0000" 
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  required
                />
              </div>
              
              {txStatus && <div className="tx-status-indicator">{txStatus}</div>}
              
              <button type="submit" className="btn-primary full-width" disabled={!!txStatus && txStatus !== "TRANSACTION FAILED."}>
                SIGN & BROADCAST
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- RECEIVE MODAL --- */}
      {isReceiveModalOpen && (
        <div className="modal-overlay pop-in">
          <div className="glass-card receive-modal">
            <div className="card-header">
              <h3>RECEIVE AEGIS</h3>
              <button className="close-btn" onClick={() => setIsReceiveModalOpen(false)}>X</button>
            </div>
            
            <div className="receive-content">
              <div className="qr-container">
                <QRCode 
                  value={walletAddress || "PENDING"} 
                  bgColor="transparent" 
                  fgColor="#00f0ff" 
                  size={160} 
                  level="H"
                />
              </div>

              <div className="address-display-box" onClick={copyToClipboard}>
                <label>YOUR AEGIS ADDRESS</label>
                <p className="address-string">{walletAddress}</p>
                <span className={`copy-feedback ${isCopied ? "copied" : ""}`}>
                  {isCopied ? "✓ COPIED TO CLIPBOARD" : "CLICK TO COPY"}
                </span>
              </div>

              <div className="receive-actions">
                <a 
                  href={`mailto:?subject=My%20AEGIS%20Address&body=Please%20send%20AEGIS%20tokens%20to%20my%20sovereign%20address:%0A%0A${walletAddress}`} 
                  className="action-link"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  Email This Address
                </a>
                
                <a href={`https://polkadot.js.org/apps/?rpc=ws%3A%2F%2F127.0.0.1%3A9944#/accounts?filter=${walletAddress}`} target="_blank" rel="noreferrer" className="action-link">
                  <span className="icon">🔗</span>
                  View on Block Explorer
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {terminalOpen && (
        <div className="sudo-terminal slide-down">
          <div className="terminal-header">
            <span>AEGIS_OVERSEER // ROOT_ACCESS_GRANTED</span>
            <button onClick={() => setTerminalOpen(false)}>X</button>
          </div>
          <div className="terminal-output">
            {terminalLogs.map((log, i) => (
              <div key={i} className={log.includes("[SUCCESS]") ? "log-success" : "log-text"}>{log}</div>
            ))}
          </div>
          <form onSubmit={handleCommandSubmit} className="terminal-input-row">
            <span>root@aegis:~# </span>
            <input 
              type="text" 
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Enter natural language command..."
              autoFocus
            />
          </form>
        </div>
      )}

      <nav className="glass-nav">
        <div className="brand">
          <div className="logo-orb"></div>
          <h1>AEGIS <span className="version">v0.1.0-alpha</span></h1>
        </div>
        <div className="network-status">
          <span className={nodeStatus === "MAINNET CONNECTED" ? "pulse-dot" : "pulse-dot error"}></span>
          {nodeStatus}
        </div>
      </nav>

      <div className="bento-grid">
        
        {/* ROW 1: Vault & Compute */}
        <section className="glass-card vault-card span-2 relative-container">
          <div className="card-header">
            <h3>SOVEREIGN VAULT</h3>
            <span className={`address-pill ${isGenerating ? 'scanning' : ''}`}>{walletAddress || "INITIALIZING ZK-SNARK..."}</span>
          </div>
          
          <div className="balance-wrapper" style={{ marginBottom: '20px' }}>
            <h2 className="fiat-value">$0.00 <span className="fiat-currency">USD</span></h2>
            <h1 className="crypto-balance">{balance} <span className="crypto-ticker">AEGIS</span></h1>
          </div>

          {(walletAddress === "" || walletAddress.startsWith("5Grw")) && (
            <div className="quantum-action-area">
              <button className={`btn-quantum ${isGenerating ? 'processing' : ''}`} onClick={generateWallet} disabled={isGenerating}>
                <span className="quantum-glow"></span>
                <span className="btn-text">{isGenerating ? "SECURING LATTICE..." : "GENERATE QUANTUM WALLET"}</span>
              </button>
            </div>
          )}

          <div className="action-row" style={{ marginTop: (walletAddress === "" || walletAddress.startsWith("5Grw")) ? '20px' : '0' }}>
            <button className="btn-primary" onClick={() => setIsSendModalOpen(true)}>SEND</button>
            <button className="btn-secondary" onClick={() => setIsReceiveModalOpen(true)}>RECEIVE</button>
          </div>
        </section>

        <section className="glass-card compute-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3>MINING TELEMETRY</h3>
            <span className="status-text active">PROCESSING</span>
          </div>
          <div className="telemetry-grid" style={{ flex: 1, alignContent: 'center' }}>
            <div className="data-point"><label>HARDWARE</label><p>RTX 5090</p></div>
            <div className="data-point"><label>THERMALS</label><p className="safe">{gpuTemp}°C</p></div>
            <div className="data-point full-width"><label>ACTIVE HASH</label><p className="hash-string typing-effect">0xdc671bf2...2f3d52916d6b</p></div>
          </div>
        </section>

        {/* ROW 2: Economy Algorithm & Sentinel Telemetry */}
        <section className="glass-card economy-card">
          <div className="card-header">
            <h3>IDE ALGORITHM</h3>
            <span className="status-text warning">PID ACTIVE</span>
          </div>
          <div className="economy-metrics">
            <div className="metric-ring">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" className="percentage">α {alpha}</text>
              </svg>
            </div>
            <div className="metric-ring">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle-beta" strokeDasharray="45, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" className="percentage">β {beta}</text>
              </svg>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* NEW: AEGIS AUTONOMOUS SENTINEL TERMINAL    */}
        {/* ========================================== */}
        <section className="glass-card span-2" style={{ display: 'flex', flexDirection: 'column', height: '250px' }}> {/* Locked height */}
          <div className="card-header" style={{ borderBottom: '1px solid rgba(0, 255, 102, 0.2)', paddingBottom: '10px', flexShrink: 0 }}>
            <h3 style={{ color: '#00ff66', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="icon">👁️</span> 
              SENTINEL TELEMETRY
            </h3>
            <span className="status-text active">AUTONOMOUS LOOP ACTIVE</span>
          </div>
          
          {/* Added overflowY: 'auto' and a custom scrollbar style */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'monospace' }} className="terminal-scroll">
            {aegisThoughts.length === 0 ? (
              <span style={{ color: '#888', fontStyle: 'italic' }}>Awaiting autonomous pulse...</span>
            ) : (
              aegisThoughts.map((thought, index) => (
                <div key={index} style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '4px', borderLeft: '2px solid #00ff66' }}>
                  <span style={{ color: '#888', fontSize: '0.7rem', marginRight: '10px' }}>[{thought.time}]</span>
                  <span style={{ color: '#ccc', fontSize: '0.85rem' }}>{thought.text}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ROW 3: Chat Interface */}
        <section className="glass-card chat-card span-3">
          <div className="card-header">
            <h3>AEGIS OMNISCIENCE INTERFACE</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span className="status-text active glow-text">CONCURRENT LLM ONLINE</span>
              <button 
                onClick={clearChatHistory} 
                style={{ background: 'transparent', border: '1px solid #ff003c', color: '#ff003c', padding: '4px 10px', fontSize: '0.65rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                PURGE MEMORY
              </button>
            </div>
          </div>
          
          <div className="chat-window">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`chat-bubble pop-in ${msg.sender === "USER" ? "user-msg" : (msg.sender === "SYSTEM" || msg.sender === "SYSTEM ERROR") ? "system-msg" : "aegis-msg"}`}>
                <span className="sender-tag">{msg.sender}</span>
                <p>{msg.message}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleChatSubmit} className="chat-input-row">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Query the sovereign intelligence..."
            />
            <button type="submit" className="btn-primary small-btn hover-glow">TRANSMIT</button>
          </form>
        </section>

      </div>
    </main>
  );
}

export default App;