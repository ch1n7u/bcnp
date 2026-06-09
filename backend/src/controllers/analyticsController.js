const { supabaseAdmin } = require("../config/db");
const SecurityMonitor = require("../services/securityMonitor");

async function getDashboardAnalytics(req, res, next) {
  try {
    const [crime, monthly, statusBreak, loss, states] = await Promise.all([
      supabaseAdmin.rpc("get_crime_distribution"),
      supabaseAdmin.rpc("get_monthly_trend"),
      supabaseAdmin.rpc("get_status_breakdown"),
      supabaseAdmin.rpc("get_financial_stats"),
      supabaseAdmin.rpc("get_reports_per_state")
    ]);

    const securityThreats = await SecurityMonitor.getThreatIndicators();

    return res.json({
      crimeDistribution: crime.data || [],
      monthlyTrend: monthly.data || [],
      statusBreakdown: statusBreak.data || [],
      financialFraudStats: (loss.data && loss.data[0]) || { total_loss: 0 },
      reportsPerState: states.data || [],
      securityThreats
    });
  } catch (error) {
    return next(error);
  }
}

async function getVisitorAnalytics(req, res, next) {
  try {
    const { data: visitors, error } = await supabaseAdmin
      .from('visitors')
      .select('*')
      .order('last_seen', { ascending: false })
      .limit(100);
      
    if (error) return next(error);
    
    // Aggregate data for charts
    const { count: totalVisitors } = await supabaseAdmin.from('visitors').select('*', { count: 'exact', head: true });
    
    return res.json({
      visitors: visitors || [],
      total: totalVisitors || 0
    });
  } catch (error) {
    return next(error);
  }
}

async function getPageAnalytics(req, res, next) {
  try {
    const { data: pages, error } = await supabaseAdmin
      .from('page_visits')
      .select('page_url, page_name, visited_at, duration_seconds')
      .order('visited_at', { ascending: false })
      .limit(500);
      
    if (error) return next(error);
    
    // Basic aggregation
    const counts = {};
    for (const p of pages || []) {
      counts[p.page_url] = (counts[p.page_url] || 0) + 1;
    }
    
    const topPages = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([url, count]) => ({ url, count }));

    return res.json({
      recent: pages || [],
      topPages
    });
  } catch (error) {
    return next(error);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const { data: logs, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*, users:user_id(name, email)')
      .order('created_at', { ascending: false })
      .limit(200);
      
    if (error) return next(error);
    
    const enrichedLogs = (logs || []).map(l => ({
      ...l,
      user_name: l.users?.name,
      user_email: l.users?.email
    }));

    return res.json(enrichedLogs);
  } catch (error) {
    return next(error);
  }
}

module.exports = { 
  getDashboardAnalytics, 
  getVisitorAnalytics, 
  getPageAnalytics, 
  getAuditLogs 
};