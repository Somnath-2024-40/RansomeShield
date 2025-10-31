const API_URL = "http://localhost:8000/api";
let refreshInterval;

// Start monitoring
async function startMonitoring() {
    const directory = document.getElementById("directoryInput").value.trim();

    if (!directory) {
        alert("Please enter a directory path!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/monitor/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ directory }),
        });

        const result = await response.json();

        if (result.success) {
            alert(
                ` Protection started!\n ${result.honeypots} honeypots deployed!`
            );
            document.getElementById("systemStatus").className =
                "status-badge status-active";
            document.getElementById("systemStatus").textContent =
                " Active Protection";
            refreshDashboard();
        } else {
            alert(" Failed to start monitoring!");
        }
    } catch (error) {
        alert("Error: " + error.message);
    }
}

// Stop 
async function stopMonitoring() {
    const directory = document.getElementById("directoryInput").value.trim();

    try {
        await fetch(`${API_URL}/monitor/stop`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ directory }),
        });

        alert(" Monitoring stopped");
        document.getElementById("systemStatus").className =
            "status-badge status-inactive";
        document.getElementById("systemStatus").textContent =
            "⏸ Monitoring Inactive";
    } catch (error) {
        alert("Error: " + error.message);
    }
}

// Scan
async function scanFile() {
    const filePath = prompt("Enter full file path to scan:");

    if (!filePath) return;

    try {
        const response = await fetch(`${API_URL}/scan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_path: filePath }),
        });

        const result = await response.json();

        // Build a readable message using template literals
        let message = `🔍 SCAN RESULTS\n\n`;
        message += `File: ${result.file}\n\n`;
        message += `Verdict: ${result.verdict}\n\n`;
        message += `Detection Results:\n`;
        if (result.entropy_scan) {
            message += `  - Threat: ${
                result.entropy_scan.threat ? " YES" : " NO"
            }\n`;
            message += `  - Reason: ${result.entropy_scan.reason || "N/A"}\n`;
            message += `  - Risk Level: ${result.entropy_scan.risk || "N/A"}\n`;
            const score =
                typeof result.entropy_scan.score === "number"
                    ? (result.entropy_scan.score * 100).toFixed(1)
                    : "0.0";
            message += `  - Score: ${score}%\n`;
        } else {
            message += `  - No entropy scan results available.\n`;
        }

        alert(message);
    } catch (error) {
        alert("Error: " + error.message);
    }
}

// Generate report
async function generateReport() {
    try {
        const response = await fetch(`${API_URL}/report`);
        const report = await response.json();

        let message = `=== RANSOMSHIELD FORENSIC REPORT ===\n\n`;
        message += `Report ID: ${report.report_id}\n`;
        message += `Generated: ${new Date(
            report.generated
        ).toLocaleString()}\n\n`;
        message += `SUMMARY:\n`;
        if (report.summary) {
            message += `  Total Threats: ${report.summary.total_threats}\n`;
            message += `  Critical: ${report.summary.critical_threats}\n`;
            message += `  Files Protected: ${report.summary.files_protected}\n\n`;
        } else {
            message += `  No summary available.\n\n`;
        }
        message += `RECOMMENDATIONS:\n`;
        if (Array.isArray(report.recommendations)) {
            report.recommendations.forEach((rec, i) => {
                message += `  ${i + 1}. ${rec}\n`;
            });
        } else {
            message += `  No recommendations available.\n`;
        }

        alert(message);
    } catch (error) {
        alert("Error: " + error.message);
    }
}

// Refresh dashboard
async function refreshDashboard() {
    console.log(" Refreshing dashboard...");

    try {
        // Get stats
        const statsRes = await fetch(`${API_URL}/stats`);
        const stats = await statsRes.json();
        console.log("📊 Stats:", stats);

        document.getElementById("totalThreats").textContent =
            stats.total_threats || 0;
        document.getElementById("criticalThreats").textContent =
            stats.critical || 0;
        document.getElementById("backupsCreated").textContent =
            stats.backups_created || 0;
        document.getElementById("honeypotsActive").textContent =
            stats.honeypots_active || 0;
        document.getElementById("processesKilled").textContent =
            stats.processes_killed || 0;
        document.getElementById("backupSize").textContent = `${
            stats.backup_size_mb || 0
        } MB`;

        // Get threats
        const threatsRes = await fetch(`${API_URL}/threats`);
        const threats = await threatsRes.json();
        console.log("🚨 Threats:", threats);

        const threatsList = document.getElementById("threatsList");

        if (!Array.isArray(threats) || threats.length === 0) {
            threatsList.innerHTML =
                '<div class="no-threats"> No threats detected - System is clean</div>';
        } else {
            let html = "";
            threats.forEach((threat) => {
                html += `
                            <div class="threat-item ${threat.risk}">
                                <div class="threat-header">
                                    <span class="threat-type"> ${
                                        threat.reason
                                    }</span>
                                    <span class="risk-badge risk-${
                                        threat.risk
                                    }">${threat.risk}</span>
                                </div>
                                <div class="threat-details">
                                    Score: ${(threat.score * 100).toFixed(1)}%
                                    ${threat.backup ? ` | Backup: ` : ""}
                                </div>
                                <div class="file-path">📁 ${threat.file}</div>
                                <div class="threat-details">Time:  ${new Date(
                                    threat.time
                                ).toLocaleString()}</div>
                            </div>
                        `;
            });
            threatsList.innerHTML = html;
        }

        // Update visualization
        drawVisualization(Array.isArray(threats) ? threats : []);
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

// Draw threat visualization
function drawVisualization(threats) {
    const canvas = document.getElementById("threatCanvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!Array.isArray(threats) || threats.length === 0) {
        ctx.fillStyle = "#9ca3af";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            "No threats to visualize",
            canvas.width / 2,
            canvas.height / 2
        );
        return;
    }

    // Draw threats as timeline
    const maxThreats = Math.min(threats.length, 20);
    const barWidth = canvas.width / maxThreats - 5;

    threats
        .slice(0, maxThreats)
        .reverse()
        .forEach((threat, i) => {
            const x = i * (barWidth + 5);
            const height = threat.score * canvas.height * 0.8;
            const y = canvas.height - height;

            // Color based on risk
            ctx.fillStyle =
                threat.risk === "CRITICAL"
                    ? "#ef4444"
                    : threat.risk === "HIGH"
                    ? "#f59e0b"
                    : "#3b82f6";

            ctx.fillRect(x, y, barWidth, height);

            // Draw border
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, barWidth, height);
        });

    // Draw labels
    ctx.fillStyle = "#6b7280";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Threat Timeline (Most Recent)", 10, 20);
}

// Auto-refresh every 5 seconds
refreshInterval = setInterval(refreshDashboard, 10);

// Initial load
refreshDashboard();
