import { useState, useEffect, useRef, useCallback } from 'react';
// import HackerBackground from '../assets/hacker.webp';
import HackerBackground from '../assets/v2.png';


// Tailwind Colors for Hacker Theme:
// BG: Dark Black/Circuit (inline style for complex background)
// Primary Accent: Neon Green (e.g., #00ff41 or green-400/500)
// Secondary Accent: Dark Slate/Blue-Black (#1e293b)

// --- Helper component for the Stat Box (Optional, but cleaner) ---
const StatBox = ({ label, value }) => (
    <div className="bg-[#1e293b] text-white p-5 rounded-lg shadow-xl border-2 border-green-700 hover:border-[#00ff41] transition-all duration-300 transform hover:scale-[1.02]">
        <h3 className="text-sm opacity-80 mb-2 font-mono text-green-400">{label}</h3>
        <div className="text-5xl font-bold font-digital text-[#00ff41] tracking-wider">
            {/* Added a subtle green glow effect for numbers */}
            <span className="drop-shadow-[0_0_5px_rgba(0,255,65,0.7)]">{value}</span>
        </div>
    </div>
);

export default function RansomShieldDashboard() {
  const API_URL = 'http://localhost:8000/api';
  
  const [systemActive, setSystemActive] = useState(false);
  const [directory, setDirectory] = useState('');
  const [stats, setStats] = useState({
    total_threats: 0,
    critical: 0,
    backups_created: 0,
    honeypots_active: 0,
    processes_killed: 0,
    backup_size_mb: 0
  });
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);  
  const canvasRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  // Optimized fetch with parallel requests
  const refreshDashboard = useCallback(async () => {
    try {
      const [statsRes, threatsRes] = await Promise.all([
        fetch(`${API_URL}/stats`),
        fetch(`${API_URL}/threats`)
      ]);

      const [statsData, threatsData] = await Promise.all([
        statsRes.json(),
        threatsRes.json()
      ]);

      // Map 'backups_created' to 'files_protected' for the design label consistency
      const mappedStats = {
          ...statsData,
          files_protected: statsData.backups_created 
      };

      setStats(mappedStats);
      setThreats(threatsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  }, [API_URL]);

  // Start monitoring
  const startMonitoring = async () => {
    if (!directory.trim()) {
      alert('Please enter a directory path!');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/monitor/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory })
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Protection started!\n🍯 ${result.honeypots} honeypots deployed!`);
        setSystemActive(true);
        refreshDashboard();
      } else {
        alert('❌ Failed to start monitoring!');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Stop monitoring
  const stopMonitoring = async () => {
    try {
      await fetch(`${API_URL}/monitor/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory })
      });

      alert('⏹️ Monitoring stopped');
      setSystemActive(false);
      refreshDashboard();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Scan file
  const scanFile = async () => {
    const filePath = prompt('Enter full file path to scan:');
    if (!filePath) return;

    try {
      const response = await fetch(`${API_URL}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath })
      });

      const result = await response.json();

      let message = `🔍 SCAN RESULTS\n\n`;
      message += `File: ${result.file}\n\n`;
      message += `Verdict: ${result.verdict}\n\n`;
      message += `Detection Results:\n`;
      message += `  - Threat: ${result.entropy_scan.threat ? '⚠️ YES' : '✅ NO'}\n`;
      message += `  - Reason: ${result.entropy_scan.reason}\n`;
      message += `  - Risk Level: ${result.entropy_scan.risk}\n`;
      message += `  - Score: ${(result.entropy_scan.score * 100).toFixed(1)}%\n`;

      alert(message);
      refreshDashboard();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Generate report
  const generateReport = async () => {
    try {
      const response = await fetch(`${API_URL}/report`);
      const report = await response.json();

      let message = `=== RANSOMSHIELD FORENSIC REPORT ===\n\n`;
      message += `Report ID: ${report.report_id}\n`;
      message += `Generated: ${new Date(report.generated).toLocaleString()}\n\n`;
      message += `SUMMARY:\n`;
      message += `  Total Threats: ${report.summary.total_threats}\n`;
      message += `  Critical: ${report.summary.critical_threats}\n`;
      message += `  Files Protected: ${report.summary.files_protected}\n\n`;
      message += `RECOMMENDATIONS:\n`;
      report.recommendations.forEach((rec, i) => {
        message += `  ${i + 1}. ${rec}\n`;
      });

      alert(message);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Optimized visualization with memoization
  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set display size
    canvas.style.width = '100%';
    canvas.style.height = '300px';
    
    // Set actual size in memory
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = 300 * dpr;
    
    // Scale for high DPI displays
    ctx.scale(dpr, dpr);

    const displayWidth = canvas.offsetWidth;
    const displayHeight = 300;

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    if (threats.length === 0) {
      ctx.fillStyle = '#6b7280'; // Gray for 'No threats' in a dark theme
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No active threat data', displayWidth / 2, displayHeight / 2);
      return;
    }

    const maxThreats = Math.min(threats.length, 20);
    const barWidth = displayWidth / maxThreats - 5;

    threats.slice(0, maxThreats).reverse().forEach((threat, i) => {
      const x = i * (barWidth + 5);
      const height = (threat.score * displayHeight * 0.8);
      const y = displayHeight - height;

      // Define colors based on risk level
      const barColor = threat.risk === 'CRITICAL' ? '#ef4444' : // Red
                         threat.risk === 'HIGH' ? '#f59e0b' :   // Orange
                         '#00ff41';                             // Neon Green

      ctx.fillStyle = barColor;

      // Draw the bar with a subtle shadow/glow for a digital effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = barColor;
      ctx.fillRect(x, y, barWidth, height);
      ctx.shadowBlur = 0; // Reset shadow

      ctx.strokeStyle = '#374151'; // Dark border
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, height);
    });

    ctx.fillStyle = '#9ca3af'; // Light gray for text
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Threat Timeline (Most Recent)', 10, 20);
  }, [threats]);

  // Initial load and auto-refresh
  useEffect(() => {
    refreshDashboard();
    
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Set up new interval with faster refresh
    // Retaining 100ms refresh for the digital 'feel'
    refreshIntervalRef.current = setInterval(refreshDashboard, 100);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refreshDashboard]);

  // Update visualization when threats change
  useEffect(() => {
    drawVisualization();
  }, [drawVisualization]);

  return (
    <div 
        className="min-h-screen p-5 font-sans"
        style={{
            backgroundColor: '',
            backgroundImage: `url(${HackerBackground})`, 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        }}
    >
      <div className="max-w-[1400px] mx-auto bg-transparent border-2 border-green-800 rounded-xl px-8 shadow-2xl shadow-green-900/50">
        
        {/* Header */}
        <div className="text-center mb-10 pb-5 border-b-2 border-green-700">
          <h1 className="vt323-regular text-xl  lg:text-5xl backdrop-blur-4xl font-extrabold text-[#00ff41] mb-2 flex items-center justify-center gap-4 drop-shadow-[0_0_8px_rgba(0,255,65,0.7)]">
            <span className="pt-1 text-xl lg:text-4xl backdrop-blur-4xl ">🛡️</span> RansomShield Pro
          </h1>
          <p className="text-green-500 text-lg font-mono tracking-wide">Advanced Multi-Layer Ransomware Detection & Response System</p>
          
          {/* Monitoring Status Badge */}
          <div className={`inline-block px-5 py-2 rounded-full font-bold mt-3 border ${
            systemActive 
              ? 'bg-green-600/70 border-green-400 text-white shadow-lg shadow-green-500/30' 
              : 'bg-gray-700/70 border-gray-500 text-gray-300'
          }`}>
            {systemActive ? '✅ Active Protection' : '⏸ Monitoring Inactive'}
          </div>
        </div>

        {/* Stats Grid */}
        <div className=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <StatBox label="Total Threats" value={stats.total_threats} />
          <StatBox label="Critical Alerts" value={stats.critical} />
          <StatBox label="Files Protected" value={stats.backups_created} /> 
          <StatBox label="Honeypots Active" value={stats.honeypots_active} />
          <StatBox label="Processes Killed" value={stats.processes_killed} />
        </div>

        {/* Controls */}
        <div className="bg-gray-800/80 p-6 rounded-lg mb-10 border border-green-900 shadow-inner shadow-green-900">
          <h3 className="text-xl font-bold text-[#00ff41] mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span> Monitoring Controls
          </h3>
          <div className="flex flex-wrap gap-4 mb-4">
            <input
              type="text"
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
              placeholder="Enter directory path (e.g., D:\test_folder)"
              className="flex-1 min-w-[300px] px-4 py-3 border-2 border-green-700 bg-gray-900 text-green-400 rounded-lg focus:outline-none focus:border-[#00ff41] transition-colors font-mono"
            />
            <button onClick={startMonitoring} className="px-6 py-3 bg-green-700 text-white rounded-lg font-bold hover:bg-green-600 hover:scale-[1.05] transition-all duration-200 shadow-md shadow-green-700/50">
                Start Protection
            </button>
            <button onClick={stopMonitoring} className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-500 transition-colors">
                Stop
            </button>
          </div>
          <div className="flex flex-wrap gap-4 pt-2">
            {/* <button onClick={scanFile} className="px-6 py-3 bg-gray-700 text-green-400 rounded-lg font-bold hover:bg-gray-600 hover:text-[#00ff41] transition-colors border border-green-900">
                Scan File
            </button> */}
            <button onClick={generateReport} className="px-6 py-3 bg-gray-700 text-green-400 rounded-lg font-bold hover:bg-gray-600 hover:text-[#00ff41] transition-colors border border-green-900">
                Generate Report
            </button>
            <button onClick={refreshDashboard} className="px-6 py-3 bg-gray-700 text-green-400 rounded-lg font-bold hover:bg-gray-600 hover:text-[#00ff41] transition-colors border border-green-900">
                Refresh Now
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Threats List */}
          <div className="lg:col-span-2 bg-gray-800/80 rounded-lg p-6 shadow-xl border border-green-900">
            <h2 className="text-2xl font-bold text-[#00ff41] mb-5 flex items-center gap-3">
              <span className="text-red-500 text-3xl">🚨</span> Recent Threats
              {!loading && <span className="text-sm font-normal text-gray-400">({threats.length} total)</span>}
            </h2>
            <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"> {/* Custom scrollbar needed for dark theme */}
              {loading ? (
                <div className="text-center py-10 text-green-700 animate-pulse font-mono">Loading data matrix...</div>
              ) : threats.length === 0 ? (
                <div className="text-center py-10 text-green-400 font-mono">✅ No threats detected - System is clean</div>
              ) : (
                threats.map((threat, i) => (
                  <div key={`${threat.file}-${i}`} className={`p-4 mb-3 rounded-md border-l-4 font-mono transition-transform duration-100 hover:bg-gray-700 ${
                    threat.risk === 'CRITICAL' ? 'border-red-500 bg-red-900/20' :
                    threat.risk === 'HIGH' ? 'border-orange-500 bg-orange-900/20' :
                    'border-green-500 bg-green-900/20'
                  }`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-100">🔥 {threat.reason}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        threat.risk === 'CRITICAL' ? 'bg-red-600 text-white' :
                        threat.risk === 'HIGH' ? 'bg-orange-600 text-white' :
                        'bg-green-600 text-white'
                      }`}>
                        {threat.risk}
                      </span>
                    </div>
                    <div className="text-xs text-green-400 mt-1">
                      Score: {(threat.score * 100).toFixed(1)}%
                      {threat.backup && ' | Backup: ✅'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 break-all">
                       {threat.file}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Time: {new Date(threat.time).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Visualization */}
          <div className="bg-gray-800/80 rounded-lg p-6 shadow-xl border border-green-900">
            <h2 className="text-2xl font-bold text-[#00ff41] mb-5 flex items-center gap-3">
              <span className="text-green-500 text-3xl">📈</span> Threat Activity
            </h2>
            <canvas ref={canvasRef} className="w-full h-[300px] bg-gray-900 rounded-lg border border-green-800"></canvas>
            <div className="mt-5 text-sm text-gray-400 space-y-1 font-mono">
              <p><strong>DETECTION_ENGINE:</strong> <span className="text-green-400">ACTIVE_ONLINE</span></p>
              <p><strong>BACKUP_SIZE:</strong> {stats.backup_size_mb.toFixed(2)} MB</p>
              <p><strong>LAST_UPDATE:</strong> {new Date().toLocaleTimeString('en-US', { hour12: false })}</p>
            </div>
          </div>
        </div>
      </div>
      {/* NOTE: To get the perfect visual from the image, you'll need to define a 
        custom font like "VT323" or similar mono/digital font, and you'll 
        need to inject a global CSS style for the background image and the
        scrollbar (e.g., using a global 'styles.css' file or Tailwind's JIT mode). 
      */}
    </div>
  );
}