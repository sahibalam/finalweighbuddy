const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Weigh = require('../models/Weigh');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Caravan = require('../models/Caravan');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const router = express.Router();

// @desc    Get advanced analytics for professional users
// @route   GET /api/reports/analytics
// @access  Private (Professional users only)
router.get('/analytics', protect, authorize('professional'), async (req, res) => {
  try {
    const { period = '30', type = 'all' } = req.query;
    const userId = req.user.id;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    // Build query
    const query = {
      user: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    };
    
    // Get weighs with populated vehicle and caravan data
    const weighs = await Weigh.find(query)
      .populate('vehicle', 'make model year gvm')
      .populate('caravan', 'make model year atm')
      .sort({ createdAt: -1 });
    
    // Advanced analytics calculations
    const analytics = {
      summary: {
        totalWeighs: weighs.length,
        compliantWeighs: weighs.filter(w => w.complianceResults?.overallCompliant).length,
        nonCompliantWeighs: weighs.filter(w => !w.complianceResults?.overallCompliant).length,
        averageProcessingTime: calculateAverageProcessingTime(weighs),
        totalRevenue: weighs.length * 0 // Professional users don't pay per weigh
      },
      
      complianceBreakdown: {
        gvm: weighs.filter(w => !w.compliance?.gvm?.compliant).length,
        frontAxle: weighs.filter(w => !w.compliance?.frontAxle?.compliant).length,
        rearAxle: weighs.filter(w => !w.compliance?.rearAxle?.compliant).length,
        tbm: weighs.filter(w => !w.compliance?.tbm?.compliant).length,
        btc: weighs.filter(w => !w.compliance?.btc?.compliant).length,
        atm: weighs.filter(w => !w.compliance?.atm?.compliant).length,
        gcm: weighs.filter(w => !w.compliance?.gcm?.compliant).length
      },
      
      vehicleAnalysis: analyzeVehicles(weighs),
      caravanAnalysis: analyzeCaravans(weighs),
      customerAnalysis: analyzeCustomers(weighs),
      timeAnalysis: analyzeTimePatterns(weighs),
      trendsAnalysis: analyzeTrends(weighs, period)
    };
    
    res.json({
      success: true,
      analytics,
      period: `${period} days`,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics'
    });
  }
});

// @desc    Export detailed report as Excel
// @route   GET /api/reports/export/excel
// @access  Private (Professional users only)
router.get('/export/excel', protect, authorize('professional'), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const userId = req.user.id;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    // Get weighs with populated data
    const weighs = await Weigh.find({
      user: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate('vehicle', 'make model year gvm frontAxleRating rearAxleRating btc')
    .populate('caravan', 'make model year atm axleGroupLoading')
    .sort({ createdAt: -1 });
    
    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];
    
    const compliantCount = weighs.filter(w => w.complianceResults?.overallCompliant).length;
    summarySheet.addRows([
      { metric: 'Total Weighs', value: weighs.length },
      { metric: 'Compliant Weighs', value: compliantCount },
      { metric: 'Non-Compliant Weighs', value: weighs.length - compliantCount },
      { metric: 'Compliance Rate', value: `${weighs.length > 0 ? ((compliantCount / weighs.length) * 100).toFixed(1) : 0}%` },
      { metric: 'Date Range', value: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}` }
    ]);
    
    // Detailed data sheet
    const detailSheet = workbook.addWorksheet('Detailed Data');
    detailSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Customer Phone', key: 'customerPhone', width: 15 },
      { header: 'Vehicle Make', key: 'vehicleMake', width: 15 },
      { header: 'Vehicle Model', key: 'vehicleModel', width: 15 },
      { header: 'Vehicle Plate', key: 'vehiclePlate', width: 12 },
      { header: 'Caravan Make', key: 'caravanMake', width: 15 },
      { header: 'Caravan Model', key: 'caravanModel', width: 15 },
      { header: 'Caravan Plate', key: 'caravanPlate', width: 12 },
      { header: 'Overall Compliant', key: 'compliant', width: 15 },
      { header: 'GVM Compliant', key: 'gvmCompliant', width: 15 },
      { header: 'ATM Compliant', key: 'atmCompliant', width: 15 },
      { header: 'Notes', key: 'notes', width: 30 }
    ];
    
    weighs.forEach(weigh => {
      detailSheet.addRow({
        date: new Date(weigh.createdAt).toLocaleDateString(),
        customerName: weigh.customer.name,
        customerPhone: weigh.customer.phone,
        vehicleMake: weigh.vehicle?.make || 'N/A',
        vehicleModel: weigh.vehicle?.model || 'N/A',
        vehiclePlate: weigh.vehicleNumberPlate,
        caravanMake: weigh.caravan?.make || 'N/A',
        caravanModel: weigh.caravan?.model || 'N/A',
        caravanPlate: weigh.caravanNumberPlate,
        compliant: weigh.complianceResults?.overallCompliant ? 'Yes' : 'No',
        gvmCompliant: weigh.compliance?.gvm?.compliant ? 'Yes' : 'No',
        atmCompliant: weigh.compliance?.atm?.compliant ? 'Yes' : 'No',
        notes: weigh.notes || ''
      });
    });
    
    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="weigh-report-${period}days.xlsx"`);
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to export Excel report'
    });
  }
});

// @desc    Generate comprehensive PDF report
// @route   GET /api/reports/export/pdf
// @access  Private (Professional users only)
router.get('/export/pdf', protect, authorize('professional'), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const userId = req.user.id;
    
    // Get user and business info
    const user = await User.findById(userId);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    // Get weighs data
    const weighs = await Weigh.find({
      user: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate('vehicle', 'make model year')
    .populate('caravan', 'make model year')
    .sort({ createdAt: -1 });
    
    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="advanced-weigh-report-${period}days.pdf"`);
    
    doc.pipe(res);
    
    // Header
    doc.fontSize(20).text('Advanced Weigh Compliance Report', { align: 'center' });
    doc.moveDown();
    
    // Business info
    doc.fontSize(14).text(`Business: ${user.businessName}`, { align: 'left' });
    doc.text(`Report Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    
    // Summary statistics
    const compliantCount = weighs.filter(w => w.complianceResults?.overallCompliant).length;
    const complianceRate = weighs.length > 0 ? ((compliantCount / weighs.length) * 100).toFixed(1) : 0;
    
    doc.fontSize(16).text('Executive Summary', { underline: true });
    doc.fontSize(12);
    doc.text(`Total Weighs Processed: ${weighs.length}`);
    doc.text(`Compliant Vehicles: ${compliantCount}`);
    doc.text(`Non-Compliant Vehicles: ${weighs.length - compliantCount}`);
    doc.text(`Overall Compliance Rate: ${complianceRate}%`);
    doc.moveDown();
    
    // Compliance breakdown
    doc.fontSize(16).text('Compliance Breakdown', { underline: true });
    doc.fontSize(12);
    
    const complianceIssues = {
      'GVM Issues': weighs.filter(w => !w.compliance?.gvm?.compliant).length,
      'Front Axle Issues': weighs.filter(w => !w.compliance?.frontAxle?.compliant).length,
      'Rear Axle Issues': weighs.filter(w => !w.compliance?.rearAxle?.compliant).length,
      'TBM Issues': weighs.filter(w => !w.compliance?.tbm?.compliant).length,
      'BTC Issues': weighs.filter(w => !w.compliance?.btc?.compliant).length,
      'ATM Issues': weighs.filter(w => !w.compliance?.atm?.compliant).length,
      'GCM Issues': weighs.filter(w => !w.compliance?.gcm?.compliant).length
    };
    
    Object.entries(complianceIssues).forEach(([issue, count]) => {
      if (count > 0) {
        doc.text(`${issue}: ${count} (${((count / weighs.length) * 100).toFixed(1)}%)`);
      }
    });
    
    doc.moveDown();
    
    // Recent weighs table (last 10)
    doc.fontSize(16).text('Recent Weigh Entries', { underline: true });
    doc.fontSize(10);
    
    const recentWeighs = weighs.slice(0, 10);
    let y = doc.y;
    
    // Table headers
    doc.text('Date', 50, y);
    doc.text('Customer', 120, y);
    doc.text('Vehicle', 200, y);
    doc.text('Caravan', 280, y);
    doc.text('Status', 360, y);
    
    y += 20;
    
    recentWeighs.forEach(weigh => {
      doc.text(new Date(weigh.createdAt).toLocaleDateString(), 50, y);
      doc.text(weigh.customer.name.substring(0, 15), 120, y);
      doc.text(`${weigh.vehicle?.make || ''} ${weigh.vehicle?.model || ''}`.substring(0, 15), 200, y);
      doc.text(`${weigh.caravan?.make || ''} ${weigh.caravan?.model || ''}`.substring(0, 15), 280, y);
      doc.text(weigh.complianceResults?.overallCompliant ? 'Compliant' : 'Non-Compliant', 360, y);
      y += 15;
      
      if (y > 700) { // New page if needed
        doc.addPage();
        y = 50;
      }
    });
    
    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report'
    });
  }
});

// Helper functions
function calculateAverageProcessingTime(weighs) {
  // This would calculate based on timestamps if we tracked processing time
  return '2.5 minutes'; // Placeholder
}

function analyzeVehicles(weighs) {
  const vehicleStats = {};
  
  weighs.forEach(weigh => {
    if (weigh.vehicle) {
      const key = `${weigh.vehicle.make} ${weigh.vehicle.model}`;
      if (!vehicleStats[key]) {
        vehicleStats[key] = { total: 0, compliant: 0 };
      }
      vehicleStats[key].total++;
      if (weigh.complianceResults?.overallCompliant) {
        vehicleStats[key].compliant++;
      }
    }
  });
  
  return Object.entries(vehicleStats)
    .map(([vehicle, stats]) => ({
      vehicle,
      total: stats.total,
      complianceRate: ((stats.compliant / stats.total) * 100).toFixed(1)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10); // Top 10
}

function analyzeCaravans(weighs) {
  const caravanStats = {};
  
  weighs.forEach(weigh => {
    if (weigh.caravan) {
      const key = `${weigh.caravan.make} ${weigh.caravan.model}`;
      if (!caravanStats[key]) {
        caravanStats[key] = { total: 0, compliant: 0 };
      }
      caravanStats[key].total++;
      if (weigh.complianceResults?.overallCompliant) {
        caravanStats[key].compliant++;
      }
    }
  });
  
  return Object.entries(caravanStats)
    .map(([caravan, stats]) => ({
      caravan,
      total: stats.total,
      complianceRate: ((stats.compliant / stats.total) * 100).toFixed(1)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10); // Top 10
}

function analyzeCustomers(weighs) {
  const customerStats = {};
  
  weighs.forEach(weigh => {
    const customer = weigh.customer.name;
    if (!customerStats[customer]) {
      customerStats[customer] = { total: 0, compliant: 0 };
    }
    customerStats[customer].total++;
    if (weigh.complianceResults?.overallCompliant) {
      customerStats[customer].compliant++;
    }
  });
  
  return {
    totalCustomers: Object.keys(customerStats).length,
    repeatCustomers: Object.values(customerStats).filter(stats => stats.total > 1).length,
    topCustomers: Object.entries(customerStats)
      .map(([customer, stats]) => ({
        customer,
        total: stats.total,
        complianceRate: ((stats.compliant / stats.total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  };
}

function analyzeTimePatterns(weighs) {
  const hourStats = new Array(24).fill(0);
  const dayStats = new Array(7).fill(0);
  
  weighs.forEach(weigh => {
    const date = new Date(weigh.createdAt);
    hourStats[date.getHours()]++;
    dayStats[date.getDay()]++;
  });
  
  const peakHour = hourStats.indexOf(Math.max(...hourStats));
  const peakDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    dayStats.indexOf(Math.max(...dayStats))
  ];
  
  return {
    peakHour: `${peakHour}:00`,
    peakDay,
    hourlyDistribution: hourStats.map((count, hour) => ({ hour, count })),
    dailyDistribution: dayStats.map((count, day) => ({ 
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day], 
      count 
    }))
  };
}

function analyzeTrends(weighs, period) {
  const days = parseInt(period);
  const trendsData = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const dayWeighs = weighs.filter(weigh => {
      const weighDate = new Date(weigh.createdAt);
      return weighDate >= dayStart && weighDate < dayEnd;
    });
    
    trendsData.push({
      date: dayStart.toISOString().split('T')[0],
      total: dayWeighs.length,
      compliant: dayWeighs.filter(w => w.complianceResults?.overallCompliant).length
    });
  }
  
  return trendsData;
}

module.exports = router;



