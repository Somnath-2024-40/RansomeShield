import { useState, useEffect, useRef, useCallback } from 'react';

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
      // Fetch both in parallel for faster loading
      const [statsRes, threatsRes] = await Promise.all([
        fetch(`${API_URL}/stats`),
        fetch(`${API_URL}/threats`)
      ]);

      const [statsData, threatsData] = await Promise.all([
        statsRes.json(),
        threatsRes.json()
      ]);

      setStats(statsData);
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
        // Immediate refresh after starting
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
      // Immediate refresh after stopping
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
      // Refresh after scan
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
      ctx.fillStyle = '#9ca3af';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No threats to visualize', displayWidth / 2, displayHeight / 2);
      return;
    }

    const maxThreats = Math.min(threats.length, 20);
    const barWidth = displayWidth / maxThreats - 5;

    threats.slice(0, maxThreats).reverse().forEach((threat, i) => {
      const x = i * (barWidth + 5);
      const height = (threat.score * displayHeight * 0.8);
      const y = displayHeight - height;

      ctx.fillStyle = threat.risk === 'CRITICAL' ? '#ef4444' :
                     threat.risk === 'HIGH' ? '#f59e0b' : '#3b82f6';

      ctx.fillRect(x, y, barWidth, height);

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barWidth, height);
    });

    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Threat Timeline (Most Recent)', 10, 20);
  }, [threats]);

  // Initial load and auto-refresh
  useEffect(() => {
    refreshDashboard();
    
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Set up new interval with faster refresh
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
    <div className="min-h-screen bg-linear-to-br from-[#667eea] to-[#764ba2] p-5">
      <div className="max-w-[1400px] mx-auto bg-white/95 rounded-3xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-10 pb-5 border-b-4 border-[#667eea]">
          <h1 className="text-5xl font-bold text-[#667eea] mb-3 flex items-center justify-center gap-4">
            🛡️ RansomShield Pro
          </h1>
          <p className="text-gray-600 text-lg">Advanced Multi-Layer Ransomware Detection & Response System</p>
          <div className={`inline-block px-5 py-2 rounded-full font-bold mt-3 ${
            systemActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
          }`}>
            {systemActive ? '✅ Active Protection' : '⏸️ Monitoring Inactive'}
          </div>
          
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          {[
            { label: 'Total Threats', value: stats.total_threats },
            { label: 'Critical Alerts', value: stats.critical },
            { label: 'Files Protected', value: stats.backups_created },
            { label: 'Honeypots Active', value: stats.honeypots_active },
            { label: 'Processes Killed', value: stats.processes_killed }
          ].map((stat, i) => (
            <div key={i} className="bg-linear-to-br from-[#667eea] to-[#764ba2] text-white p-6 rounded-2xl shadow-xl hover:-translate-y-1 transition-transform">
              <h3 className="text-sm opacity-90 mb-2">{stat.label}</h3>
              <div className="text-5xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-gray-100 p-6 rounded-2xl mb-8">
          <h3 className="text-xl font-bold text-[#667eea] mb-4">📂 Monitoring Controls</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="text"
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
              placeholder="Enter directory path (e.g., D:\test_folder)"
              className="flex-1 min-w-[300px] px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#667eea] transition-colors"
            />
            <button onClick={startMonitoring} className="px-6 py-3 bg-[#667eea] text-white rounded-lg font-bold hover:bg-[#5568d3] hover:scale-105 transition-all">
              🚀 Start Protection
            </button>
            <button onClick={stopMonitoring} className="px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors">
              ⏹️ Stop
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={scanFile} className="px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors">
              🔍 Scan File
            </button>
            <button onClick={generateReport} className="px-6 py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition-colors">
              📊 Generate Report
            </button>
            <button onClick={refreshDashboard} className="px-6 py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition-colors">
              🔄 Refresh Now
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Threats List */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-[#667eea] mb-5 flex items-center gap-3">
              🚨 Recent Threats
              {!loading && <span className="text-sm font-normal text-gray-500">({threats.length} total)</span>}
            </h2>
            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-10 text-gray-400 animate-pulse">Loading threats...</div>
              ) : threats.length === 0 ? (
                <div className="text-center py-10 text-gray-400">✅ No threats detected - System is clean</div>
              ) : (
                threats.map((threat, i) => (
                  <div key={`${threat.file}-${i}`} className={`p-4 mb-3 rounded-lg border-l-4 hover:translate-x-1 transition-transform ${
                    threat.risk === 'CRITICAL' ? 'border-red-500 bg-red-50' :
                    threat.risk === 'HIGH' ? 'border-orange-500 bg-orange-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-800">🚨 {threat.reason}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        threat.risk === 'CRITICAL' ? 'bg-red-500 text-white' :
                        threat.risk === 'HIGH' ? 'bg-orange-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {threat.risk}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Score: {(threat.score * 100).toFixed(1)}%
                      {threat.backup && ' | Backup: ✅'}
                    </div>
                    <div className="text-xs font-mono text-gray-700 mt-1 break-all">
                      📁 {threat.file}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ⏰ {new Date(threat.time).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Visualization */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-[#667eea] mb-5 flex items-center gap-3">
              📈 Threat Activity
            </h2>
            <canvas ref={canvasRef} className="w-full h-[300px] bg-gray-50 rounded-lg"></canvas>
            <div className="mt-5 text-sm text-gray-600 space-y-1">
              <p><strong>Detection Engine:</strong> <span className="text-green-600">● Active</span></p>
              <p><strong>Backup Size:</strong> {stats.backup_size_mb} MB</p>
              <p><strong>Last Update:</strong> {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}