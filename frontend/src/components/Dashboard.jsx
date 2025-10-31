import { useState, useEffect } from "react";
import "./../App.css";
const API_URL = "http://localhost:8000/api";

function Dashboard() {
    const [directory, setDirectory] = useState("");
    const [stats, setStats] = useState({});
    const [threats, setThreats] = useState([]);
    const [status, setStatus] = useState("inactive");

    // Fetch 
    const refreshDashboard = async () => {
        try {
            const statsRes = await fetch(`${API_URL}/stats`).then((r) =>
                r.json()
            );
            const threatsRes = await fetch(`${API_URL}/threats`).then((r) =>
                r.json()
            );
            setStats(statsRes);
            setThreats(threatsRes);
        } catch (error) {
            console.error("Error refreshing:", error);
        }
    };

    // Monitoring
    const startMonitoring = async () => {
        if (!directory) return alert("Please enter a directory path!");
        try {
            const res = await fetch(`${API_URL}/monitor/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ directory }),
            });
            const result = await res.json();
            if (result.success) {
                setStatus("active");
                alert(
                    `Protection started!\n ${result.honeypots} * honeypots deployed!`
                );
                refreshDashboard();
            } else {
                alert(" Failed to start monitoring!");
            }
        } catch (err) {
            alert(err.message);
        }
    };

    // Stop Monitoring
    const stopMonitoring = async () => {
        try {
            await fetch(`${API_URL}/monitor/stop`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ directory }),
            });
            setStatus("inactive");
            alert("Monitoring stopped");
        } catch (err) {
            alert(err.message);
        }
    };

    // Scan
    const scanFile = async () => {
        const filePath = prompt("Enter full file path to scan:");
        if (!filePath) return;
        try {
            const res = await fetch(`${API_URL}/scan`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ file_path: filePath }),
            });
            const result = await res.json();
            alert(JSON.stringify(result, null, 2));
        } catch (err) {
            alert(err.message);
        }
    };

    //Generate Report
    const generateReport = async () => {
        try {
            const res = await fetch(`${API_URL}/report`);
            const report = await res.json();
            alert(JSON.stringify(report, null, 2));
        } catch (err) {
            alert(err.message);
        }
    };

    useEffect(() => {
        refreshDashboard();
    }, []);

    return (
        <div className="mx-auto flex justify-center items-center" >
            <div className="container m-5 sm:m-10 md:m-15  lg:m-20 " >
                <div className="header">
                    <h1> RansomShield Pro</h1>
                    <p>
                        Advanced Multi-Layer Ransomware Detection & Response
                        System
                    </p>
                    <div
                        className={`status-badge ${
                            status === "active"
                                ? "status-active"
                                : "status-inactive"
                        }`}>
                        {status === "active"
                            ? " Active Protection"
                            : "⏸ Monitoring Inactive"}
                    </div>
                </div>

                {/* Statistics */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Threats</h3>
                        <div className="number">{stats.total_threats || 0}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Critical Alerts</h3>
                        <div className="number">{stats.critical || 0}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Files Protected</h3>
                        <div className="number">
                            {stats.backups_created || 0}
                        </div>
                    </div>
                    <div className="stat-card">
                        <h3>Honeypots Active</h3>
                        <div className="number">
                            {stats.honeypots_active || 0}
                        </div>
                    </div>
                    <div className="stat-card">
                        <h3>Processes Killed</h3>
                        <div className="number">
                            {stats.processes_killed || 0}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="controls">
                    <h3>Monitoring Controls</h3>
                    <div className="control-group">
                        <input
                            type="text"
                            value={directory}
                            onChange={(e) => setDirectory(e.target.value)}
                            placeholder="Enter directory path (e.g., D:\\test_folder)"
                        />
                        <button
                            className="btn-primary"
                            onClick={startMonitoring}>
                            Start Protection
                        </button>
                        <button className="btn-danger" onClick={stopMonitoring}>
                            Stop
                        </button>
                    </div>

                    <div className="control-group">
                        <button className="btn-success" onClick={scanFile}>
                             Scan File
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={generateReport}>
                            Generate Report
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={refreshDashboard}>
                             Refresh
                        </button>
                    </div>
                </div>

                {/* Threat List */}
                <div className="content-grid">
                    <div className="threats-section">
                        <h2> Recent Threats</h2>
                        <div className="threats-list">
                            {threats.length === 0 ? (
                                <div className="no-threats">
                                    No threats detected
                                </div>
                            ) : (
                                threats.map((t, i) => (
                                    <div
                                        key={i}
                                        className={`threat-item ${t.risk}`}>
                                        <div className="threat-header">
                                            <span className="threat-type">
                                                 {t.reason}
                                            </span>
                                            <span
                                                className={`risk-badge risk-${t.risk}`}>
                                                {t.risk}
                                            </span>
                                        </div>

                                        <div className="threat-details">
                                            Score: {(t.score * 100).toFixed(1)}%
                                            {t.backup && " | Backup "}
                                        </div>

                                        <div className="file-path">
                                            {t.file}
                                        </div>
                                        <div className="threat-details">
                                            {new Date(t.time).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="viz-section">
                        <h2>Threat Activity</h2>
                        <canvas id="threatCanvas"></canvas>
                        <div
                        className="mt-5 font-[0.9em] text-[#6b7280]"
                           >
                            <p>
                                <strong>Detection Engine:</strong>
                                <span id="mlStatus">Active</span>
                            </p>
                            <p>
                                <strong>Backup Size:</strong>
                                <span>{stats.backup_size_mb || 0} MB</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
