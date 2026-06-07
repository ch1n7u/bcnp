const { supabaseAdmin } = require("../config/db");

async function getDashboardAnalytics(req, res, next) {
  try {
    const { startDate, endDate, state, district, crimeType } = req.query;

    const { data: reports, error: dbError } = await supabaseAdmin.from("reports").select("*");
    if (dbError) {
      throw new Error("Failed to fetch reports: " + dbError.message);
    }

    const allReports = reports || [];

    // Extract all unique states/locations and crime types for frontend filters
    const filterOptions = {
      states: [...new Set(allReports.map(r => r.location))].filter(Boolean).sort(),
      crimeTypes: [...new Set(allReports.map(r => r.crime_type))].filter(Boolean).sort()
    };

    // Apply filters
    let filtered = allReports;
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(r => new Date(r.created_at) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      filtered = filtered.filter(r => new Date(r.created_at) <= end);
    }
    if (state) {
      filtered = filtered.filter(r => r.location && r.location.includes(state));
    }
    if (district) {
      filtered = filtered.filter(r => r.location && r.location.includes(district));
    }
    if (crimeType) {
      filtered = filtered.filter(r => r.crime_type === crimeType);
    }

    // Aggregations
    let totalLoss = 0;
    let resolvedCount = 0;
    let activeCount = 0;
    let totalResolutionMs = 0;
    let resolvedWithTimeCount = 0;

    const crimeMap = {
      "Phishing Scam": 0,
      "Online Fraud": 0,
      "UPI Scam": 0,
      "Social Media Harassment": 0,
      "Identity Theft": 0,
      "Cryptocurrency Scam": 0,
      "Fake Website Scam": 0
    };
    const statusMap = {};
    const stateMap = {};
    const monthlyMap = {};

    for (const report of filtered) {
      const loss = parseFloat(report.financial_loss_amount) || 0;
      totalLoss += loss;

      const status = report.status;
      statusMap[status] = (statusMap[status] || 0) + 1;

      if (status === "Resolved" || status === "Closed") {
        resolvedCount++;
        if (report.created_at && report.updated_at) {
          const created = new Date(report.created_at);
          const updated = new Date(report.updated_at);
          const diff = updated - created;
          if (diff > 0) {
            totalResolutionMs += diff;
            resolvedWithTimeCount++;
          }
        }
      } else if (status === "Investigation" || status === "Under Review") {
        activeCount++;
      }

      const rawCrime = report.crime_type || "Other";
      
      // Map database raw strings to the 7 standard Scam Types
      let mappedCrime = rawCrime;
      const lowerCrime = rawCrime.toLowerCase();
      if (lowerCrime.includes("online fraud") || lowerCrime.includes("e-commerce") || lowerCrime.includes("part-time job") || lowerCrime.includes("telegram") || lowerCrime.includes("ransomware") || lowerCrime.includes("cyber attack")) {
        mappedCrime = "Online Fraud";
      } else if (lowerCrime.includes("phishing") || lowerCrime.includes("electricity bill")) {
        mappedCrime = "Phishing Scam";
      } else if (lowerCrime.includes("upi") || lowerCrime.includes("olx")) {
        mappedCrime = "UPI Scam";
      } else if (lowerCrime.includes("social media") || lowerCrime.includes("impersonation") || lowerCrime.includes("extortion")) {
        mappedCrime = "Social Media Harassment";
      } else if (lowerCrime.includes("identity")) {
        mappedCrime = "Identity Theft";
      } else if (lowerCrime.includes("crypto")) {
        mappedCrime = "Cryptocurrency Scam";
      } else if (lowerCrime.includes("fake website")) {
        mappedCrime = "Fake Website Scam";
      } else {
        mappedCrime = "Online Fraud"; // Default fallback
      }

      crimeMap[mappedCrime] = (crimeMap[mappedCrime] || 0) + 1;

      const loc = report.location;
      stateMap[loc] = (stateMap[loc] || 0) + 1;

      if (report.created_at) {
        const createdDate = new Date(report.created_at);
        const yearMonth = createdDate.toISOString().substring(0, 7);
        monthlyMap[yearMonth] = (monthlyMap[yearMonth] || 0) + 1;
      }
    }

    const crimeDistribution = Object.entries(crimeMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const statusBreakdown = Object.entries(statusMap)
      .map(([label, value]) => ({ label, value }));

    const reportsPerState = Object.entries(stateMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const monthlyTrend = Object.entries(monthlyMap)
      .map(([month, reports]) => ({ month, reports }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const avgResolutionHours = resolvedWithTimeCount > 0
      ? Math.round((totalResolutionMs / (1000 * 60 * 60)) / resolvedWithTimeCount)
      : 0;

    // Recent reports
    const recentReports = [...filtered]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(r => ({
        report_id: r.report_id,
        victim_name: r.victim_name,
        crime_type: r.crime_type,
        financial_loss_amount: r.financial_loss_amount,
        location: r.location,
        status: r.status,
        created_at: r.created_at
      }));

    return res.json({
      filterOptions,
      crimeDistribution,
      monthlyTrend,
      statusBreakdown,
      reportsPerState,
      recentReports,
      metrics: {
        totalReports: filtered.length,
        totalLoss,
        resolvedReports: resolvedCount,
        activeInvestigations: activeCount,
        averageResolutionHours: avgResolutionHours
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getDashboardAnalytics };