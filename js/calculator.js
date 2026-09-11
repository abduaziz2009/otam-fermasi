/**
 * Otam Fermasi - Yem-xashak va don sarfini hisoblash moduli
 * Модуль расчёта расхода кормов и зерна
 */

class FeedCalculator {
  constructor() {
    this.presets = {
      standard: {
        nameKey: "rationPresetStandard",
        description: "Standart qishki parvarish / Стандартный зимний рацион",
        rations: {
          ewes: { alfalfa: 1.8, straw: 1.0, barley: 0.40, wheat: 0.05, compound: 0.0, saltPremix: 0.015 },
          rams: { alfalfa: 2.5, straw: 0.8, barley: 0.65, wheat: 0.15, compound: 0.0, saltPremix: 0.020 },
          lambs: { alfalfa: 1.0, straw: 0.3, barley: 0.25, wheat: 0.10, compound: 0.25, saltPremix: 0.010 },
          fattening: { alfalfa: 1.5, straw: 0.5, barley: 0.85, wheat: 0.25, compound: 0.45, saltPremix: 0.020 }
        }
      },
      fattening: {
        nameKey: "rationPresetFattening",
        description: "Bo'rdoqichilik jadal ratsioni / Интенсивный откорм",
        rations: {
          ewes: { alfalfa: 1.8, straw: 1.0, barley: 0.45, wheat: 0.10, compound: 0.0, saltPremix: 0.015 },
          rams: { alfalfa: 2.5, straw: 0.8, barley: 0.70, wheat: 0.15, compound: 0.0, saltPremix: 0.020 },
          lambs: { alfalfa: 1.2, straw: 0.3, barley: 0.40, wheat: 0.15, compound: 0.35, saltPremix: 0.012 },
          fattening: { alfalfa: 1.8, straw: 0.4, barley: 1.10, wheat: 0.35, compound: 0.70, saltPremix: 0.025 }
        }
      },
      pasture: {
        nameKey: "rationPresetPasture",
        description: "Yaylov qo'shimcha yemlash / Летний выпас с подкормкой",
        rations: {
          ewes: { alfalfa: 0.5, straw: 0.3, barley: 0.20, wheat: 0.0, compound: 0.0, saltPremix: 0.015 },
          rams: { alfalfa: 1.0, straw: 0.3, barley: 0.40, wheat: 0.0, compound: 0.0, saltPremix: 0.020 },
          lambs: { alfalfa: 0.4, straw: 0.1, barley: 0.15, wheat: 0.05, compound: 0.15, saltPremix: 0.010 },
          fattening: { alfalfa: 1.2, straw: 0.3, barley: 0.75, wheat: 0.15, compound: 0.40, saltPremix: 0.020 }
        }
      }
    };
  }

  calculateMonthlyConsumption(flock, feedInventory, customRations, days = 30) {
    const flockMap = {};
    flock.forEach(cat => {
      flockMap[cat.id] = Number(cat.count) || 0;
    });

    const activeRations = customRations || this.presets.standard.rations;

    const results = [];
    let grandTotalMonthlyCost = 0;
    let grandTotalDailyKg = 0;
    let grandTotalMonthlyKg = 0;

    feedInventory.forEach(feed => {
      const feedId = feed.id;
      let totalDailyFeedKg = 0;

      // Calculate across all flock categories
      Object.keys(flockMap).forEach(catId => {
        const count = flockMap[catId];
        const rationKg = (activeRations[catId] && activeRations[catId][feedId] !== undefined)
          ? activeRations[catId][feedId]
          : (feed.standardDailyRationKg || 0);

        totalDailyFeedKg += count * rationKg;
      });

      const totalMonthlyFeedKg = totalDailyFeedKg * days;
      const totalMonthlyFeedTon = totalMonthlyFeedKg / 1000;

      // In native units (e.g. bales of alfalfa or bags of grain)
      let monthlyInUnit = totalMonthlyFeedKg;
      let currentStockInKg = feed.currentStock;

      if (feed.unit === "baleUnit") {
        // 1 bale ~ 18 kg
        monthlyInUnit = feed.unitWeightKg ? (totalMonthlyFeedKg / feed.unitWeightKg) : totalMonthlyFeedKg;
        currentStockInKg = feed.currentStock * (feed.unitWeightKg || 18);
      } else if (feed.unit === "pieceUnit") {
        monthlyInUnit = feed.unitWeightKg ? (totalMonthlyFeedKg / feed.unitWeightKg) : totalMonthlyFeedKg;
        currentStockInKg = feed.currentStock * (feed.unitWeightKg || 5);
      } else if (feed.unit === "sackUnit") {
        monthlyInUnit = feed.unitWeightKg ? (totalMonthlyFeedKg / feed.unitWeightKg) : (totalMonthlyFeedKg / 50);
        currentStockInKg = feed.currentStock * (feed.unitWeightKg || 50);
      }

      // Cost calculation
      let monthlyCost = 0;
      if (feed.unit === "baleUnit" || feed.unit === "pieceUnit" || feed.unit === "sackUnit") {
        monthlyCost = Math.round(monthlyInUnit * (feed.unitPrice || 0));
      } else {
        monthlyCost = Math.round(totalMonthlyFeedKg * (feed.unitPrice || 0));
      }

      // Stock runway calculation (days remaining)
      let daysRemaining = 0;
      if (totalDailyFeedKg > 0) {
        daysRemaining = Math.floor(currentStockInKg / totalDailyFeedKg);
      } else if (currentStockInKg > 0) {
        daysRemaining = 999;
      }

      // Status indicator
      let stockStatus = "sufficient"; // 'sufficient', 'low', 'critical', 'none'
      if (currentStockInKg <= 0) {
        stockStatus = "none";
      } else if (daysRemaining < 7) {
        stockStatus = "critical";
      } else if (daysRemaining < 20) {
        stockStatus = "low";
      }

      grandTotalDailyKg += totalDailyFeedKg;
      grandTotalMonthlyKg += totalMonthlyFeedKg;
      grandTotalMonthlyCost += monthlyCost;

      results.push({
        id: feed.id,
        nameKey: feed.nameKey,
        unit: feed.unit,
        unitPrice: feed.unitPrice,
        unitWeightKg: feed.unitWeightKg,
        currentStock: feed.currentStock,
        currentStockInKg,
        dailyKg: Math.round(totalDailyFeedKg * 10) / 10,
        monthlyKg: Math.round(totalMonthlyFeedKg),
        monthlyTon: Math.round(totalMonthlyFeedTon * 100) / 100,
        monthlyInUnit: Math.round(monthlyInUnit * 10) / 10,
        monthlyCost,
        daysRemaining,
        stockStatus
      });
    });

    return {
      days,
      totalFlockCount: Object.values(flockMap).reduce((a, b) => a + b, 0),
      grandTotalDailyKg: Math.round(grandTotalDailyKg * 10) / 10,
      grandTotalMonthlyKg: Math.round(grandTotalMonthlyKg),
      grandTotalMonthlyTon: Math.round((grandTotalMonthlyKg / 1000) * 100) / 100,
      grandTotalMonthlyCost,
      items: results
    };
  }
}

const calculator = new FeedCalculator();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FeedCalculator, calculator };
}
