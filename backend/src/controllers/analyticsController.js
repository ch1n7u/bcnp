const { supabaseAdmin } = require("../config/db");

async function getDashboardAnalytics(req, res, next) {
  try {
    const [crime, monthly, statusBreak, loss, states] = await Promise.all([
      supabaseAdmin.rpc("get_crime_distribution"),
      supabaseAdmin.rpc("get_monthly_trend"),
      supabaseAdmin.rpc("get_status_breakdown"),
      supabaseAdmin.rpc("get_financial_stats"),
      supabaseAdmin.rpc("get_reports_per_state")
    ]);

    return res.json({
      crimeDistribution: crime.data || [],
      monthlyTrend: monthly.data || [],
      statusBreakdown: statusBreak.data || [],
      financialFraudStats: (loss.data && loss.data[0]) || { total_loss: 0 },
      reportsPerState: states.data || []
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getDashboardAnalytics };