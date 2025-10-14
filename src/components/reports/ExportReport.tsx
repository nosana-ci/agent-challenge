"use client";

import { Download, FileText } from "lucide-react";
import { EnhancedAnalysisResult } from "@/types/enhanced-analysis";

interface ExportReportProps {
  analysis: EnhancedAnalysisResult;
}

export default function ExportReport({ analysis }: ExportReportProps) {
  const exportToCSV = () => {
    const csvContent = [
      ["Nosight Analysis Report"],
      ["Generated:", new Date(analysis.timestamp).toLocaleString()],
      ["Asset:", analysis.asset],
      ["Timeframe:", analysis.timeframe],
      [""],
      ["Executive Summary"],
      ["Sentiment:", analysis.executiveSummary.overallSentiment],
      [
        "Confidence:",
        `${Math.round(analysis.executiveSummary.confidence * 100)}%`,
      ],
      [""],
      ["Key Points:"],
      ...analysis.executiveSummary.bullets.map((bullet) => [bullet]),
      [""],
      ["Risk Assessment"],
      ["Recommendation:", analysis.riskScore.recommendation],
      ["Buy Signal:", `${analysis.riskScore.buy}%`],
      ["Hold Signal:", `${analysis.riskScore.hold}%`],
      ["Sell Signal:", `${analysis.riskScore.sell}%`],
      [""],
      ["Technical Indicators"],
      ["RSI:", analysis.technicalIndicators.rsi.toFixed(2)],
      ["MACD:", analysis.technicalIndicators.macd.value.toFixed(4)],
      ["SMA 20:", analysis.technicalIndicators.movingAverages.sma20.toFixed(2)],
      ["SMA 50:", analysis.technicalIndicators.movingAverages.sma50.toFixed(2)],
      [""],
      ["Trading Signals"],
      ...analysis.signals.map((signal) => [
        signal.type,
        signal.title,
        signal.description,
        signal.priority,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nosight-analysis-${analysis.asset}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // For a real implementation, you'd use a library like jsPDF
    // For now, we'll create a printable HTML version
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nosight Analysis Report - ${analysis.asset}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #14b8a6; border-bottom: 3px solid #14b8a6; padding-bottom: 10px; }
            h2 { color: #0891b2; margin-top: 30px; }
            .metadata { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .section { margin: 20px 0; }
            .bullet { margin: 10px 0; padding-left: 20px; }
            .signal { border: 1px solid #e2e8f0; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .high-priority { background: #fee2e2; }
            .medium-priority { background: #fef3c7; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background: #f1f5f9; font-weight: bold; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>🔍 Nosight Analysis Report</h1>
          
          <div class="metadata">
            <strong>Asset:</strong> ${analysis.asset}<br>
            <strong>Timeframe:</strong> ${analysis.timeframe}<br>
            <strong>Generated:</strong> ${new Date(analysis.timestamp).toLocaleString()}<br>
            <strong>Query:</strong> ${analysis.query}
          </div>

          <h2>📋 Executive Summary</h2>
          <div class="section">
            <p><strong>Overall Sentiment:</strong> ${analysis.executiveSummary.overallSentiment.toUpperCase()}</p>
            <p><strong>Confidence:</strong> ${Math.round(analysis.executiveSummary.confidence * 100)}%</p>
            <h3>Key Points:</h3>
            ${analysis.executiveSummary.bullets.map((bullet) => `<div class="bullet">• ${bullet}</div>`).join("")}
          </div>

          <h2>🎯 Risk Assessment</h2>
          <div class="section">
            <p><strong>Recommendation:</strong> ${analysis.riskScore.recommendation.toUpperCase()}</p>
            <table>
              <tr><th>Signal</th><th>Score</th></tr>
              <tr><td>Buy</td><td>${analysis.riskScore.buy}%</td></tr>
              <tr><td>Hold</td><td>${analysis.riskScore.hold}%</td></tr>
              <tr><td>Sell</td><td>${analysis.riskScore.sell}%</td></tr>
            </table>
            <h3>Key Factors:</h3>
            ${analysis.riskScore.reasoning.map((reason) => `<div class="bullet">▸ ${reason}</div>`).join("")}
          </div>

          <h2>📊 Technical Indicators</h2>
          <table>
            <tr><th>Indicator</th><th>Value</th></tr>
            <tr><td>RSI</td><td>${analysis.technicalIndicators.rsi.toFixed(2)}</td></tr>
            <tr><td>MACD</td><td>${analysis.technicalIndicators.macd.value.toFixed(4)}</td></tr>
            <tr><td>SMA 20</td><td>$${analysis.technicalIndicators.movingAverages.sma20.toFixed(2)}</td></tr>
            <tr><td>SMA 50</td><td>$${analysis.technicalIndicators.movingAverages.sma50.toFixed(2)}</td></tr>
            <tr><td>Bollinger Upper</td><td>$${analysis.technicalIndicators.bollingerBands.upper.toFixed(2)}</td></tr>
            <tr><td>Bollinger Middle</td><td>$${analysis.technicalIndicators.bollingerBands.middle.toFixed(2)}</td></tr>
            <tr><td>Bollinger Lower</td><td>$${analysis.technicalIndicators.bollingerBands.lower.toFixed(2)}</td></tr>
          </table>

          <h2>⚡ Trading Signals</h2>
          ${analysis.signals
            .map(
              (signal) => `
            <div class="signal ${signal.priority === "high" ? "high-priority" : signal.priority === "medium" ? "medium-priority" : ""}">
              <strong>${signal.title}</strong> [${signal.type.toUpperCase()} - ${signal.priority.toUpperCase()}]<br>
              ${signal.description}<br>
              <em>💡 ${signal.action}</em>
            </div>
          `
            )
            .join("")}

          <h2>⚠️ Market Anomalies</h2>
          ${analysis.anomalies
            .map(
              (anomaly) => `
            <div class="signal">
              <strong>${anomaly.date}</strong> - ${anomaly.type.replace("_", " ").toUpperCase()} [${anomaly.impact.toUpperCase()} IMPACT]<br>
              ${anomaly.description}
            </div>
          `
            )
            .join("")}

          <hr style="margin: 40px 0;">
          <p style="text-align: center; color: #64748b; font-size: 12px;">
            Generated by Nosight AI • Nosana Builders Challenge<br>
            This report is for informational purposes only. Not financial advice.
          </p>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-[#10E80C]" />
        <h3 className="text-xl font-bold text-white">Export Report</h3>
      </div>

      <p className="text-slate-300 mb-6">
        Download a comprehensive analysis report with all key findings,
        technical indicators, and trading signals.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={exportToCSV}
          className="flex-1  text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          <Download className="h-5 w-5" />
          <span>Export as CSV</span>
        </button>

        <button
          onClick={exportToPDF}
          className="flex-1  text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          <FileText className="h-5 w-5" />
          <span>Export as PDF</span>
        </button>
      </div>

      <div className="mt-4 p-4 bg-slate-700/30 rounded-lg">
        <p className="text-slate-400 text-xs">
          📄 CSV format is ideal for data analysis in Excel or Google Sheets.
          PDF format provides a printable, formatted report.
        </p>
      </div>
    </div>
  );
}
