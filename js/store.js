/**
 * Otam Fermasi - Ma'lumotlar ombori va holat boshqaruvi
 * Хранилище данных и управление состоянием
 */

const STORAGE_KEY = "otam_fermasi_data_v1";

const defaultData = {
  activeUser: "me", // 'me' yoki 'brother'
  language: "uz",   // 'uz' yoki 'ru'
  flock: [
    { id: "ewes", categoryKey: "categoryEwes", count: 120, avgWeight: 65, notes: "Hisori va Jaydari sovliqlar" },
    { id: "rams", categoryKey: "categoryRams", count: 6, avgWeight: 95, notes: "Nasldor qora qo'chqorlar" },
    { id: "lambs", categoryKey: "categoryLambs", count: 75, avgWeight: 28, notes: "Bahorgi qo'zilar" },
    { id: "fattening", categoryKey: "categoryFattening", count: 40, avgWeight: 52, notes: "Kuzgi bozor uchun semirtirishda" }
  ],
  feedInventory: [
    {
      id: "alfalfa",
      nameKey: "feedAlfalfa",
      unit: "baleUnit",
      unitWeightKg: 18, // 1 bog' beda = ~18 kg
      currentStock: 320, // 320 bog'
      unitPrice: 35000,  // 35,000 so'm / bog'
      standardDailyRationKg: 1.8 // kg per sheep
    },
    {
      id: "straw",
      nameKey: "feedStraw",
      unit: "baleUnit",
      unitWeightKg: 14,
      currentStock: 450,
      unitPrice: 15000,
      standardDailyRationKg: 1.0
    },
    {
      id: "barley",
      nameKey: "feedBarley",
      unit: "kgUnit",
      unitWeightKg: 1,
      currentStock: 4200, // 4,200 kg (4.2 t)
      unitPrice: 3200,    // 3,200 so'm / kg
      standardDailyRationKg: 0.45 // 450g per head
    },
    {
      id: "wheat",
      nameKey: "feedWheat",
      unit: "kgUnit",
      unitWeightKg: 1,
      currentStock: 1500,
      unitPrice: 3400,
      standardDailyRationKg: 0.15
    },
    {
      id: "compound",
      nameKey: "feedCompound",
      unit: "kgUnit",
      unitWeightKg: 1,
      currentStock: 1800,
      unitPrice: 4000,
      standardDailyRationKg: 0.3
    },
    {
      id: "saltPremix",
      nameKey: "feedSaltPremix",
      unit: "pieceUnit",
      unitWeightKg: 5,
      currentStock: 25,
      unitPrice: 20000,
      standardDailyRationKg: 0.015
    }
  ],
  purchases: [
    {
      id: "p-1",
      date: "2026-09-02",
      name: "3 Tonna Arpa doni",
      categoryKey: "catFeedGrain",
      feedItemId: "barley",
      supplier: "Chinoz don bozori (Murod aka)",
      quantity: 3000,
      unit: "kgUnit",
      unitPrice: 3200,
      totalPrice: 9600000,
      paymentMethod: "payCash",
      paidBy: "brother",
      recordedBy: "brother",
      notes: "Toza quruq arpa, sifatli qoplangan",
      addedToStock: true
    },
    {
      id: "p-2",
      date: "2026-09-04",
      name: "150 bog' ko'k beda (2-o'rim)",
      categoryKey: "catRoughage",
      feedItemId: "alfalfa",
      supplier: "Yangiyo'l fermer (Shavkat)",
      quantity: 150,
      unit: "baleUnit",
      unitPrice: 35000,
      totalPrice: 5250000,
      paymentMethod: "payCard",
      paidBy: "me",
      recordedBy: "me",
      notes: "Yomg'ir tegmagan, yaxshi siqilgan press",
      addedToStock: true
    },
    {
      id: "p-3",
      date: "2026-09-06",
      name: "Vaktsina va qurt dori (Alben + Klozantel)",
      categoryKey: "catMedicine",
      feedItemId: null,
      supplier: "Veterinariya dorixonasi",
      quantity: 10,
      unit: "pieceUnit",
      unitPrice: 65000,
      totalPrice: 650000,
      paymentMethod: "payCard",
      paidBy: "me",
      recordedBy: "me",
      notes: "Kuzgi emlash va parazitlarga qarshi",
      addedToStock: false
    },
    {
      id: "p-4",
      date: "2026-09-08",
      name: "Yem novlari va oxurlar uchun taxta",
      categoryKey: "catEquipment",
      feedItemId: null,
      supplier: "Qurilish mollari bozori",
      quantity: 12,
      unit: "pieceUnit",
      unitPrice: 120000,
      totalPrice: 1440000,
      paymentMethod: "payCash",
      paidBy: "brother",
      recordedBy: "brother",
      notes: "Bo'rdoqi qo'ylarga yangi yem nov yasash uchun",
      addedToStock: false
    }
  ],
  customRations: {
    ewes: { alfalfa: 2.0, straw: 1.0, barley: 0.4, wheat: 0.0, compound: 0.0, saltPremix: 0.015 },
    rams: { alfalfa: 2.5, straw: 0.8, barley: 0.6, wheat: 0.1, compound: 0.0, saltPremix: 0.02 },
    lambs: { alfalfa: 1.2, straw: 0.3, barley: 0.25, wheat: 0.1, compound: 0.25, saltPremix: 0.01 },
    fattening: { alfalfa: 1.5, straw: 0.5, barley: 0.8, wheat: 0.2, compound: 0.5, saltPremix: 0.02 }
  }
};

class FarmStore {
  constructor() {
    this.data = this.loadLocal();
    this.listeners = [];
  }

  loadLocal() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with default to guarantee new schema fields
        return { ...defaultData, ...parsed };
      }
    } catch (e) {
      console.warn("Could not load from localStorage, using defaultData", e);
    }
    return JSON.parse(JSON.stringify(defaultData));
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
    // Proactively notify listeners
    this.notify();
    // Also attempt background sync if server is running
    this.syncToServer();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => {
      try {
        cb(this.data);
      } catch (err) {
        console.error("Store listener error:", err);
      }
    });
  }

  // --- Active User & Language ---
  getActiveUser() {
    return this.data.activeUser || "me";
  }

  setActiveUser(user) {
    if (user === "me" || user === "brother") {
      this.data.activeUser = user;
      this.save();
    }
  }

  getLanguage() {
    return this.data.language || "uz";
  }

  setLanguage(lang) {
    if (lang === "uz" || lang === "ru") {
      this.data.language = lang;
      this.save();
    }
  }

  // --- Flock Operations ---
  getFlock() {
    return this.data.flock || [];
  }

  getTotalSheepCount() {
    return this.getFlock().reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  }

  updateFlockCategory(id, count, avgWeight, notes) {
    const item = this.data.flock.find(f => f.id === id);
    if (item) {
      item.count = Math.max(0, parseInt(count, 10) || 0);
      if (avgWeight !== undefined) item.avgWeight = parseFloat(avgWeight) || 0;
      if (notes !== undefined) item.notes = notes;
      this.save();
    }
  }

  addFlockCategory(category) {
    this.data.flock.push({
      id: "cat-" + Date.now(),
      categoryKey: category.nameKey || "categoryOther",
      customName: category.customName || "",
      count: parseInt(category.count, 10) || 0,
      avgWeight: parseFloat(category.avgWeight) || 0,
      notes: category.notes || ""
    });
    this.save();
  }

  // --- Purchases Operations ---
  getPurchases() {
    return (this.data.purchases || []).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  addPurchase(purchase) {
    const newId = "p-" + Date.now();
    const fullPurchase = {
      id: newId,
      date: purchase.date || new Date().toISOString().split("T")[0],
      name: purchase.name,
      categoryKey: purchase.categoryKey,
      feedItemId: purchase.feedItemId || null,
      supplier: purchase.supplier || "",
      quantity: parseFloat(purchase.quantity) || 0,
      unit: purchase.unit,
      unitPrice: parseFloat(purchase.unitPrice) || 0,
      totalPrice: (parseFloat(purchase.quantity) || 0) * (parseFloat(purchase.unitPrice) || 0),
      paymentMethod: purchase.paymentMethod || "payCash",
      paidBy: purchase.paidBy || this.getActiveUser(),
      recordedBy: this.getActiveUser(),
      notes: purchase.notes || "",
      addedToStock: Boolean(purchase.addToStock)
    };

    // If purchase links to a feed item and requested to update stock
    if (fullPurchase.addedToStock && fullPurchase.feedItemId) {
      const feed = this.data.feedInventory.find(f => f.id === fullPurchase.feedItemId);
      if (feed) {
        feed.currentStock += fullPurchase.quantity;
        feed.unitPrice = fullPurchase.unitPrice; // update latest price
      }
    }

    this.data.purchases.unshift(fullPurchase);
    this.save();
    return fullPurchase;
  }

  deletePurchase(id) {
    this.data.purchases = this.data.purchases.filter(p => p.id !== id);
    this.save();
  }

  // --- Feed & Stock Operations ---
  getFeedInventory() {
    return this.data.feedInventory || [];
  }

  updateFeedStock(id, newStock, newUnitPrice) {
    const feed = this.data.feedInventory.find(f => f.id === id);
    if (feed) {
      feed.currentStock = Math.max(0, parseFloat(newStock) || 0);
      if (newUnitPrice !== undefined) {
        feed.unitPrice = Math.max(0, parseFloat(newUnitPrice) || 0);
      }
      this.save();
    }
  }

  // --- Financial Summaries ---
  getMonthlySpendingSummary(monthStr) {
    // monthStr format: "YYYY-MM" (e.g. "2026-09")
    const now = new Date();
    const targetMonth = monthStr || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const monthlyPurchases = this.getPurchases().filter(p => p.date.startsWith(targetMonth));

    let total = 0;
    let brotherTotal = 0;
    let myTotal = 0;
    const byCategory = {};

    monthlyPurchases.forEach(p => {
      const amount = p.totalPrice || (p.quantity * p.unitPrice) || 0;
      total += amount;
      if (p.paidBy === "brother") {
        brotherTotal += amount;
      } else {
        myTotal += amount;
      }

      byCategory[p.categoryKey] = (byCategory[p.categoryKey] || 0) + amount;
    });

    return {
      month: targetMonth,
      total,
      brotherTotal,
      myTotal,
      balance: myTotal - brotherTotal, // > 0 means brother owes me half difference
      byCategory,
      count: monthlyPurchases.length
    };
  }

  // --- Backup & Restore ---
  exportToJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    const date = new Date().toISOString().split("T")[0];
    downloadAnchor.setAttribute("download", `otam_fermasi_backup_${date}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  exportPurchasesCsv(t) {
    const purchases = this.getPurchases();
    const headers = [
      t.date,
      t.purchaseName,
      t.purchaseCategory,
      t.supplier,
      t.quantity,
      t.unit,
      t.unitPrice,
      t.totalPrice,
      t.paymentMethod,
      t.paidBy,
      t.notes
    ];

    const rows = purchases.map(p => [
      `"${p.date}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${t[p.categoryKey] || p.categoryKey}"`,
      `"${(p.supplier || '').replace(/"/g, '""')}"`,
      p.quantity,
      `"${t[p.unit] || p.unit}"`,
      p.unitPrice,
      p.totalPrice,
      `"${t[p.paymentMethod] || p.paymentMethod}"`,
      `"${p.paidBy === 'brother' ? t.brother : t.me}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const date = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `otam_fermasi_xaridlar_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  importFromJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.flock && parsed.feedInventory) {
        this.data = parsed;
        this.save();
        return true;
      }
    } catch (e) {
      console.error("Invalid JSON import", e);
    }
    return false;
  }

  // Optional background sync with server.js if running
  async syncToServer() {
    try {
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.data)
      });
    } catch (e) {
      // Offline or standalone file mode, ignore silently
    }
  }

  async loadFromServer() {
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const serverData = await res.json();
        if (serverData && serverData.flock) {
          const currentStr = JSON.stringify(this.data);
          const serverStr = JSON.stringify(serverData);
          if (currentStr !== serverStr) {
            this.data = serverData;
            localStorage.setItem(STORAGE_KEY, serverStr);
            this.notify();
          }
          return true;
        }
      }
    } catch (e) {
      // Standalone mode, no server
    }
    return false;
  }
}

const store = new FarmStore();
