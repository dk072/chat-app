import React, { useEffect, useState } from 'react';
import { BarChart2, Download, TrendingUp, Users, Clock, Sparkles } from 'lucide-react';
import api from '../../../services/api';

const AdvancedAnalyticsTab: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/admin/advanced/analytics');
        setAnalytics(res.data.analytics);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAnalytics();
  }, []);

  const handleExportCsv = () => {
    if (!analytics) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value\n' +
      `Total Users,${analytics.overview.totalUsers}\n` +
      `Total Messages,${analytics.overview.totalMessages}\n` +
      `Total Calls,${analytics.overview.totalCalls}\n` +
      `Retention Rate,${analytics.overview.retentionRate30DayPct}%\n` +
      `Projected Monthly Growth,${analytics.overview.projectedMonthlyGrowth}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'analytics_summary.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!analytics) {
    return <div className="p-8 text-center text-slate-400">Loading advanced analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-brand-500 shrink-0" />
            <span>Advanced Analytics & Growth Forecasting</span>
          </h2>
          <p className="text-xs text-slate-500">Retention Cohorts, Peak Hours Heatmap & AI Insights</p>
        </div>

        <button
          onClick={handleExportCsv}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-xs shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Analytics CSV</span>
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 block mb-1">30-DAY RETENTION</span>
          <div className="text-xl sm:text-3xl font-extrabold text-brand-600">{analytics.overview.retentionRate30DayPct}%</div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">Cohort engagement rate</p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 block mb-1">DAILY ACTIVE USERS</span>
          <div className="text-xl sm:text-3xl font-extrabold text-indigo-600">{analytics.overview.dailyActiveUserEngagementPct}%</div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">DAU / MAU ratio</p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 block mb-1 truncate">GROWTH PREDICTION (30D)</span>
          <div className="text-xl sm:text-3xl font-extrabold text-emerald-600">+{analytics.overview.projectedMonthlyGrowth}</div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Projected: {analytics.overview.predictedTotalUsers30Days}</p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 block mb-1 truncate">TOTAL CONVERSATIONS</span>
          <div className="text-xl sm:text-3xl font-extrabold text-slate-800">{analytics.overview.totalConversations}</div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">1-on-1 channels</p>
        </div>
      </div>

      {/* Peak Activity Hours & Feature Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Activity Heatmap Bar */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-brand-500" />
            <span>Peak Activity Hours Heatmap</span>
          </h3>

          <div className="space-y-3">
            {analytics.peakActivityHours.map((item: any, i: number) => (
              <div key={i} className="text-xs">
                <div className="flex justify-between font-semibold text-slate-600 mb-1">
                  <span>{item.hour}</span>
                  <span>{item.activityScore}% Traffic Load</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-brand-500 h-full rounded-full transition-all"
                    style={{ width: `${item.activityScore}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Usage Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Feature Usage Breakdown</h3>
          <div className="space-y-3">
            {analytics.featureUsage.map((f: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">{f.feature}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-500">{f.usageCount} events</span>
                  <span className="px-2.5 py-1 bg-brand-50 text-brand-700 font-bold rounded-lg">{f.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Generated Insights Box */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 rounded-3xl text-white space-y-3 shadow-md">
        <h3 className="text-sm font-bold flex items-center space-x-2 text-indigo-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>AI-Generated Analytics Insights</span>
        </h3>
        <div className="space-y-2 text-xs text-slate-300">
          {analytics.aiInsights.map((insight: string, idx: number) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-brand-400 font-bold">•</span>
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsTab;
