/**
 * Otam Fermasi - Asosiy dastur boshqaruvchisi (Main App Controller)
 * Управление интерфейсом, событиями и переводами
 */

class FarmApp {
  constructor() {
    this.currentTab = "overview";
    this.activePreset = "standard";
    this.init();
  }

  init() {
    // Check if server is running and load latest data
    store.loadFromServer();

    // Subscribe to store updates
    store.subscribe(() => {
      this.render();
    });

    // Set initial date in purchase modal
    const today = new Date().toISOString().split("T")[0];
    const dateInput = document.getElementById("p-form-date");
    if (dateInput) dateInput.value = today;

    // Set initial month in reports
    const reportMonthInput = document.getElementById("reports-month-select");
    if (reportMonthInput) {
      reportMonthInput.value = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    }

    // Update UI
    this.applyLanguage();
    this.updateUserUI();
    this.render();

    // Avtomatik sinxronizatsiya: aka-uka kiritgan ma'lumotlar bir necha soniyada yangilanadi
    setInterval(() => {
      store.loadFromServer();
    }, 4000);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        store.loadFromServer();
      }
    });
  }

  // --- Localization & Translation ---
  t(key) {
    const lang = store.getLanguage();
    return (translations[lang] && translations[lang][key]) || (translations.uz && translations.uz[key]) || key;
  }

  switchLanguage(lang) {
    store.setLanguage(lang);
    this.applyLanguage();
    this.render();
  }

  applyLanguage() {
    const lang = store.getLanguage();
    
    // Update active button state
    document.querySelectorAll(".lang-toggle-btn").forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.getElementById(`lang-btn-${lang}`);
    if (activeBtn) activeBtn.classList.add("active");

    // Translate all static DOM elements with [data-i18n]
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const translation = this.t(key);
      if (translation) {
        if (el.tagName === "INPUT" && el.hasAttribute("placeholder")) {
          el.placeholder = translation;
        } else {
          el.textContent = translation;
        }
      }
    });

    // Update dynamic options and titles
    this.updateUserUI();
  }

  // --- User Profile Switching (Brother & Me) ---
  switchUser(user) {
    store.setActiveUser(user);
    this.updateUserUI();
    this.render();
  }

  updateUserUI() {
    const activeUser = store.getActiveUser();
    const t = (k) => this.t(k);

    const btnBrother = document.getElementById("user-btn-brother");
    const btnMe = document.getElementById("user-btn-me");
    const avatar = document.getElementById("dash-user-avatar");
    const nameEl = document.getElementById("dash-user-name");

    if (btnBrother) {
      btnBrother.classList.remove("active-brother", "active-me");
      if (activeUser === "brother") btnBrother.classList.add("active-brother");
    }

    if (btnMe) {
      btnMe.classList.remove("active-brother", "active-me");
      if (activeUser === "me") btnMe.classList.add("active-me");
    }

    if (avatar && nameEl) {
      if (activeUser === "brother") {
        avatar.textContent = "A";
        avatar.className = "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm bg-amber-700 flex-shrink-0";
        nameEl.textContent = t("brother");
      } else {
        avatar.textContent = "M";
        avatar.className = "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm bg-emerald-600 flex-shrink-0";
        nameEl.textContent = t("me");
      }
    }

    // Default payer in modal
    const payerSelect = document.getElementById("p-form-payer");
    if (payerSelect) {
      payerSelect.value = activeUser;
    }
  }

  // --- Tab Navigation ---
  setTab(tabId) {
    this.currentTab = tabId;

    // Update tab button styles
    document.querySelectorAll(".nav-tab").forEach(btn => {
      btn.classList.remove("active");
    });
    const activeBtn = document.getElementById(`tab-${tabId}`);
    if (activeBtn) activeBtn.classList.add("active");

    // Hide all sections, show target
    const sections = ["overview", "flock", "calculator", "purchases", "stock", "reports"];
    sections.forEach(sec => {
      const el = document.getElementById(`section-${sec}`);
      if (el) {
        if (sec === tabId) {
          el.classList.remove("hidden");
        } else {
          el.classList.add("hidden");
        }
      }
    });

    // Specific triggers on tab activation
    if (tabId === "reports") {
      this.renderReports();
    } else if (tabId === "calculator") {
      this.recalculateFeed();
    }
  }

  // --- Master Render ---
  render() {
    this.renderDashboard();
    this.renderFlock();
    this.renderFeedCalculator();
    this.renderPurchases();
    this.renderStock();
    if (this.currentTab === "reports") {
      this.renderReports();
    }
  }

  // --- 1. Dashboard Render ---
  renderDashboard() {
    const t = (k) => this.t(k);
    const flock = store.getFlock();
    const totalSheep = store.getTotalSheepCount();
    const feedInv = store.getFeedInventory();
    const purchases = store.getPurchases();

    // Sheep Count
    const totalSheepEl = document.getElementById("dash-total-sheep");
    if (totalSheepEl) totalSheepEl.textContent = totalSheep.toLocaleString();

    const flockSub = document.getElementById("dash-flock-sub");
    if (flockSub) {
      const parts = flock.map(f => `${t(f.categoryKey)}: ${f.count}`).join(" • ");
      flockSub.textContent = parts || t("flockSubtitle");
    }

    // Monthly Feed Calculation (Standard 30 days)
    const calcResult = calculator.calculateMonthlyConsumption(flock, feedInv, store.data.customRations, 30);
    const monthlyCostEl = document.getElementById("dash-monthly-feed-cost");
    if (monthlyCostEl) monthlyCostEl.textContent = calcResult.grandTotalMonthlyCost.toLocaleString();

    const monthlyTonEl = document.getElementById("dash-monthly-feed-ton");
    if (monthlyTonEl) monthlyTonEl.textContent = calcResult.grandTotalMonthlyTon;

    // Monthly Spending Summary
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthlySummary = store.getMonthlySpendingSummary(currentMonthStr);

    const monthlySpendingEl = document.getElementById("dash-monthly-spending");
    if (monthlySpendingEl) monthlySpendingEl.textContent = monthlySummary.total.toLocaleString();

    const purchasesCountEl = document.getElementById("dash-purchases-count");
    if (purchasesCountEl) {
      purchasesCountEl.textContent = store.getLanguage() === "ru"
        ? `${monthlySummary.count} записей за текущий месяц`
        : `${monthlySummary.count} ta xarid (bu oyda)`;
    }

    // Brother vs Me
    const brotherSpentEl = document.getElementById("dash-brother-spent");
    const meSpentEl = document.getElementById("dash-me-spent");
    const settlementBadge = document.getElementById("dash-settlement-badge");

    if (brotherSpentEl) brotherSpentEl.textContent = `${monthlySummary.brotherTotal.toLocaleString()} ${t("currency")}`;
    if (meSpentEl) meSpentEl.textContent = `${monthlySummary.myTotal.toLocaleString()} ${t("currency")}`;

    if (settlementBadge) {
      const diff = monthlySummary.myTotal - monthlySummary.brotherTotal;
      const halfDiff = Math.abs(Math.round(diff / 2));

      if (Math.abs(diff) < 1000) {
        settlementBadge.className = "mt-2 pt-2 border-t border-slate-100 text-[11px] font-medium text-emerald-700";
        settlementBadge.textContent = "✓ " + t("balancedSpending");
      } else if (diff > 0) {
        // I spent more -> brother owes me half diff
        settlementBadge.className = "mt-2 pt-2 border-t border-slate-100 text-[11px] font-medium text-emerald-700";
        settlementBadge.textContent = `${t("brotherOwesMe")} ${halfDiff.toLocaleString()} ${t("currency")}`;
      } else {
        // Brother spent more -> I owe brother half diff
        settlementBadge.className = "mt-2 pt-2 border-t border-slate-100 text-[11px] font-medium text-amber-700";
        settlementBadge.textContent = `${t("iOweBrother")} ${halfDiff.toLocaleString()} ${t("currency")}`;
      }
    }

    // Stock Runway list on Dashboard
    const runwayList = document.getElementById("dash-stock-runway-list");
    if (runwayList) {
      runwayList.innerHTML = calcResult.items.map(item => {
        const pct = Math.min(100, Math.round((item.daysRemaining / 45) * 100));
        let barColor = "bg-emerald-600";
        let statusBadge = `<span class="badge badge-green">${item.daysRemaining} ${t("daysUnit")}</span>`;

        if (item.stockStatus === "none") {
          barColor = "bg-red-600";
          statusBadge = `<span class="badge badge-red">${t("noStock")}</span>`;
        } else if (item.stockStatus === "critical") {
          barColor = "bg-red-500";
          statusBadge = `<span class="badge badge-red">${item.daysRemaining} ${t("daysUnit")} (${t("criticalStock")})</span>`;
        } else if (item.stockStatus === "low") {
          barColor = "bg-amber-500";
          statusBadge = `<span class="badge badge-yellow">${item.daysRemaining} ${t("daysUnit")} (${t("lowStock")})</span>`;
        }

        return `
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div class="flex items-center justify-between text-xs mb-1.5">
              <div class="flex items-center gap-2">
                <strong class="text-slate-800 font-semibold">${t(item.nameKey)}</strong>
                <span class="text-slate-400">(${item.currentStock.toLocaleString()} ${t(item.unit)})</span>
              </div>
              <div>${statusBadge}</div>
            </div>
            <div class="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div class="${barColor} h-full transition-all duration-500" style="width: ${pct}%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Kunlik sarf: ${item.dailyKg} kg</span>
              <span>Oylik ehtiyoj: ${item.monthlyKg.toLocaleString()} kg (${item.monthlyInUnit} ${t(item.unit)})</span>
            </div>
          </div>
        `;
      }).join("");
    }

    // Recent Purchases Preview Table
    const recentPurchasesTbody = document.getElementById("dash-recent-purchases-tbody");
    if (recentPurchasesTbody) {
      const recents = purchases.slice(0, 5);
      if (recents.length === 0) {
        recentPurchasesTbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400 text-xs">${t("noPurchasesFound")}</td></tr>`;
      } else {
        recentPurchasesTbody.innerHTML = recents.map(p => `
          <tr>
            <td class="text-slate-500 text-xs">${p.date}</td>
            <td class="font-semibold text-slate-800">${p.name}</td>
            <td><span class="badge badge-green">${t(p.categoryKey) || p.categoryKey}</span></td>
            <td>${p.quantity.toLocaleString()} ${t(p.unit)}</td>
            <td class="font-bold text-slate-900">${(p.totalPrice || 0).toLocaleString()} ${t("currency")}</td>
            <td>
              <span class="badge ${p.paidBy === 'brother' ? 'badge-brown' : 'badge-green'}">
                ${p.paidBy === 'brother' ? t('brother') : t('me')}
              </span>
            </td>
          </tr>
        `).join("");
      }
    }
  }

  // --- 2. Flock Render ---
  renderFlock() {
    const t = (k) => this.t(k);
    const flock = store.getFlock();
    const totalSheep = store.getTotalSheepCount();

    const totalBadge = document.getElementById("flock-tab-total-badge");
    if (totalBadge) totalBadge.textContent = `${totalSheep.toLocaleString()} ${t("headCount")}`;

    const container = document.getElementById("flock-categories-container");
    if (container) {
      container.innerHTML = flock.map(cat => `
        <div class="farm-card p-5 flex flex-col justify-between border-slate-200 hover:border-emerald-300 transition-all">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-bold text-slate-800 text-base">${t(cat.categoryKey) || cat.customName}</h3>
              <p class="text-xs text-slate-400 mt-0.5">${cat.notes || ''}</p>
            </div>
            <button onclick="app.openFlockModal('${cat.id}')" class="p-1.5 text-slate-400 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors" title="${t('edit')}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
          </div>

          <div class="mt-6 flex items-baseline justify-between border-t border-slate-100 pt-3">
            <div>
              <span class="text-3xl font-extrabold text-emerald-900">${cat.count.toLocaleString()}</span>
              <span class="text-xs text-slate-500 ml-1 font-medium">${t("headCount")}</span>
            </div>
            <div class="text-right">
              <span class="text-xs text-slate-400 block">${t("avgWeight")}</span>
              <span class="text-sm font-bold text-slate-700">${cat.avgWeight || 0} kg</span>
            </div>
          </div>
        </div>
      `).join("");
    }
  }

  // --- 3. Feed Calculator Render ---
  renderFeedCalculator() {
    const t = (k) => this.t(k);
    const flock = store.getFlock();
    const feedInv = store.getFeedInventory();
    const daysInput = document.getElementById("calc-days-input");
    const days = daysInput ? (parseInt(daysInput.value, 10) || 30) : 30;

    const result = calculator.calculateMonthlyConsumption(flock, feedInv, store.data.customRations, days);

    // Summary Highlights
    const dailyKgEl = document.getElementById("calc-grand-daily-kg");
    if (dailyKgEl) dailyKgEl.textContent = result.grandTotalDailyKg.toLocaleString();

    const monthlyTonEl = document.getElementById("calc-grand-monthly-ton");
    if (monthlyTonEl) monthlyTonEl.textContent = result.grandTotalMonthlyTon;

    const monthlyKgEl = document.getElementById("calc-grand-monthly-kg");
    if (monthlyKgEl) monthlyKgEl.textContent = result.grandTotalMonthlyKg.toLocaleString();

    const monthlyCostEl = document.getElementById("calc-grand-monthly-cost");
    if (monthlyCostEl) monthlyCostEl.textContent = result.grandTotalMonthlyCost.toLocaleString();

    // Table
    const tbody = document.getElementById("calc-breakdown-tbody");
    if (tbody) {
      tbody.innerHTML = result.items.map(item => {
        let statusBadge = `<span class="badge badge-green">${t("sufficientStock")}</span>`;
        if (item.stockStatus === "none") {
          statusBadge = `<span class="badge badge-red">${t("noStock")}</span>`;
        } else if (item.stockStatus === "critical") {
          statusBadge = `<span class="badge badge-red">${t("criticalStock")}</span>`;
        } else if (item.stockStatus === "low") {
          statusBadge = `<span class="badge badge-yellow">${t("lowStock")}</span>`;
        }

        return `
          <tr>
            <td class="font-bold text-slate-800">${t(item.nameKey)}</td>
            <td>
              <span class="font-semibold text-slate-800">${item.dailyKg}</span>
              <span class="text-xs text-slate-400">kg/${t("dayUnit")}</span>
            </td>
            <td>
              <div class="font-bold text-emerald-900">${item.monthlyKg.toLocaleString()} kg</div>
              <div class="text-[11px] text-slate-500">${item.monthlyInUnit} ${t(item.unit)} (${item.monthlyTon} t)</div>
            </td>
            <td>
              <span class="font-semibold text-slate-700">${item.currentStock.toLocaleString()}</span>
              <span class="text-xs text-slate-400">${t(item.unit)}</span>
            </td>
            <td>
              <strong class="text-slate-800 text-sm ${item.daysRemaining < 15 ? 'text-amber-700' : 'text-emerald-700'}">${item.daysRemaining}</strong>
              <span class="text-xs text-slate-400">${t("daysUnit")}</span>
            </td>
            <td class="font-bold text-slate-800">
              ${item.monthlyCost.toLocaleString()} <span class="text-xs font-normal text-slate-400">${t("currency")}</span>
            </td>
            <td>${statusBadge}</td>
          </tr>
        `;
      }).join("");
    }
  }

  recalculateFeed() {
    this.renderFeedCalculator();
  }

  changePreset(presetKey) {
    if (calculator.presets[presetKey]) {
      store.data.customRations = JSON.parse(JSON.stringify(calculator.presets[presetKey].rations));
      store.save();
      this.recalculateFeed();
    }
  }

  // --- 4. Purchases Render ---
  renderPurchases() {
    const t = (k) => this.t(k);
    const purchases = store.getPurchases();
    const tbody = document.getElementById("purchases-full-tbody");
    if (!tbody) return;

    const searchVal = (document.getElementById("purchases-search-input")?.value || "").toLowerCase();
    const catVal = document.getElementById("purchases-cat-filter")?.value || "";
    const payerVal = document.getElementById("purchases-payer-filter")?.value || "";

    const filtered = purchases.filter(p => {
      const matchSearch = !searchVal || 
        (p.name && p.name.toLowerCase().includes(searchVal)) ||
        (p.supplier && p.supplier.toLowerCase().includes(searchVal)) ||
        (p.notes && p.notes.toLowerCase().includes(searchVal));

      const matchCat = !catVal || p.categoryKey === catVal;
      const matchPayer = !payerVal || p.paidBy === payerVal;

      return matchSearch && matchCat && matchPayer;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center py-10 text-slate-400 text-sm">${t("noPurchasesFound")}</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => `
      <tr>
        <td class="text-slate-500 text-xs">${p.date}</td>
        <td>
          <strong class="text-slate-800 block">${p.name}</strong>
          ${p.notes ? `<span class="text-[11px] text-slate-400 block">${p.notes}</span>` : ''}
        </td>
        <td><span class="badge badge-green">${t(p.categoryKey) || p.categoryKey}</span></td>
        <td class="text-xs text-slate-600">${p.supplier || '—'}</td>
        <td class="font-medium text-slate-800">${p.quantity.toLocaleString()} ${t(p.unit)}</td>
        <td class="text-xs text-slate-600">${p.unitPrice.toLocaleString()} ${t("currency")}</td>
        <td class="font-bold text-slate-900">${(p.totalPrice || 0).toLocaleString()} ${t("currency")}</td>
        <td><span class="badge badge-brown">${t(p.paymentMethod) || p.paymentMethod}</span></td>
        <td>
          <span class="badge ${p.paidBy === 'brother' ? 'badge-brown' : 'badge-green'}">
            ${p.paidBy === 'brother' ? t('brother') : t('me')}
          </span>
        </td>
        <td class="text-right">
          <button onclick="app.deletePurchase('${p.id}')" class="p-1 text-slate-400 hover:text-red-600 transition-colors" title="${t('delete')}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </td>
      </tr>
    `).join("");
  }

  filterPurchases() {
    this.renderPurchases();
  }

  // --- 5. Stock Render ---
  renderStock() {
    const t = (k) => this.t(k);
    const feedInv = store.getFeedInventory();
    const container = document.getElementById("stock-items-container");
    if (!container) return;

    container.innerHTML = feedInv.map(feed => `
      <div class="farm-card p-5 flex flex-col justify-between border-slate-200 hover:border-emerald-300 transition-all">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-bold text-slate-800 text-base">${t(feed.nameKey)}</h3>
            <span class="text-xs text-slate-400 font-medium">Birlik narxi: ${(feed.unitPrice || 0).toLocaleString()} ${t("currency")}</span>
          </div>
          <button onclick="app.openStockModal('${feed.id}')" class="btn-secondary text-xs py-1 px-2.5">
            <span data-i18n="edit">${t('edit')}</span>
          </button>
        </div>

        <div class="mt-6 flex items-baseline justify-between border-t border-slate-100 pt-3">
          <div>
            <span class="text-xs text-slate-400 block">${t("currentStock")}</span>
            <span class="text-3xl font-extrabold text-emerald-900">${feed.currentStock.toLocaleString()}</span>
            <span class="text-xs text-slate-500 ml-1 font-medium">${t(feed.unit)}</span>
          </div>
          <div class="text-right">
            <span class="text-xs text-slate-400 block">Jami qiymati</span>
            <span class="text-sm font-bold text-slate-700">${(feed.currentStock * feed.unitPrice).toLocaleString()} ${t("currency")}</span>
          </div>
        </div>
      </div>
    `).join("");
  }

  // --- 6. Reports Render ---
  renderReports() {
    const t = (k) => this.t(k);
    const monthSelect = document.getElementById("reports-month-select");
    const selectedMonth = monthSelect ? monthSelect.value : "";
    const summary = store.getMonthlySpendingSummary(selectedMonth);
    const totalSheep = store.getTotalSheepCount();

    // Financial indicators
    const grandTotalEl = document.getElementById("rep-grand-total");
    if (grandTotalEl) grandTotalEl.textContent = `${summary.total.toLocaleString()} ${t("currency")}`;

    const countEl = document.getElementById("rep-purchases-count");
    if (countEl) countEl.textContent = `${summary.count} ta xarid`;

    const brotherTotalEl = document.getElementById("rep-brother-total");
    if (brotherTotalEl) brotherTotalEl.textContent = `${summary.brotherTotal.toLocaleString()} ${t("currency")}`;

    const myTotalEl = document.getElementById("rep-my-total");
    if (myTotalEl) myTotalEl.textContent = `${summary.myTotal.toLocaleString()} ${t("currency")}`;

    const brotherPct = summary.total > 0 ? Math.round((summary.brotherTotal / summary.total) * 100) : 0;
    const myPct = summary.total > 0 ? Math.round((summary.myTotal / summary.total) * 100) : 0;

    const brotherPctEl = document.getElementById("rep-brother-pct");
    if (brotherPctEl) brotherPctEl.textContent = `${brotherPct}% ${t("sharedSpendingTotal")}`;

    const myPctEl = document.getElementById("rep-my-pct");
    if (myPctEl) myPctEl.textContent = `${myPct}% ${t("sharedSpendingTotal")}`;

    // Per Sheep Cost
    const costPerSheepEl = document.getElementById("rep-cost-per-sheep");
    if (costPerSheepEl) {
      const perHead = totalSheep > 0 ? Math.round(summary.total / totalSheep) : 0;
      costPerSheepEl.textContent = `${perHead.toLocaleString()} ${t("currency")} / bosh`;
    }

    // Settlement Card
    const settlementCard = document.getElementById("rep-settlement-card");
    if (settlementCard) {
      const diff = summary.myTotal - summary.brotherTotal;
      const halfDiff = Math.abs(Math.round(diff / 2));

      if (summary.total === 0) {
        settlementCard.className = "p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500";
        settlementCard.innerHTML = `<span>Bu oyda hali hech qanday xarid amalga oshirilmagan.</span>`;
      } else if (Math.abs(diff) < 1000) {
        settlementCard.className = "p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900";
        settlementCard.innerHTML = `<strong>✓ ${t("balancedSpending")}</strong>`;
      } else if (diff > 0) {
        settlementCard.className = "p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex justify-between items-center";
        settlementCard.innerHTML = `
          <div>
            <strong class="block text-sm mb-0.5">${t("settlementNotice")}</strong>
            <span>${t("brotherOwesMe")} <strong>${halfDiff.toLocaleString()} ${t("currency")}</strong></span>
          </div>
          <span class="badge badge-green py-1 px-3 text-xs">Balans musbat</span>
        `;
      } else {
        settlementCard.className = "p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex justify-between items-center";
        settlementCard.innerHTML = `
          <div>
            <strong class="block text-sm mb-0.5">${t("settlementNotice")}</strong>
            <span>${t("iOweBrother")} <strong>${halfDiff.toLocaleString()} ${t("currency")}</strong></span>
          </div>
          <span class="badge badge-brown py-1 px-3 text-xs">Akam ko'proq to'lagan</span>
        `;
      }
    }

    // Render Donut Chart
    const donutData = Object.keys(summary.byCategory).map(catKey => ({
      label: t(catKey) || catKey,
      value: summary.byCategory[catKey]
    }));
    FarmCharts.renderDonutChart("rep-donut-container", donutData, t("noPurchasesFound"));

    // Render Comparison Bar
    FarmCharts.renderComparisonBar(
      "rep-comparison-container",
      summary.brotherTotal,
      summary.myTotal,
      t("brother"),
      t("me"),
      t("currency")
    );
  }

  // --- Purchase Modal Handling ---
  openNewPurchaseModal() {
    const modal = document.getElementById("modal-purchase");
    if (!modal) return;

    document.getElementById("purchase-form").reset();
    document.getElementById("p-form-date").value = new Date().toISOString().split("T")[0];
    document.getElementById("p-form-payer").value = store.getActiveUser();
    document.getElementById("p-form-add-to-stock").checked = true;
    document.getElementById("p-form-total-preview").textContent = `0 ${this.t("currency")}`;

    modal.classList.remove("hidden");
  }

  closePurchaseModal() {
    const modal = document.getElementById("modal-purchase");
    if (modal) modal.classList.add("hidden");
  }

  handlePurchaseCategoryChange(catVal) {
    const feedItemContainer = document.getElementById("p-form-feed-link-container");
    if (!feedItemContainer) return;

    if (catVal === "catFeedGrain" || catVal === "catRoughage") {
      feedItemContainer.classList.remove("hidden");
    } else {
      feedItemContainer.classList.add("hidden");
      document.getElementById("p-form-feed-item").value = "";
    }
  }

  updatePurchaseTotalPreview() {
    const qty = parseFloat(document.getElementById("p-form-qty").value) || 0;
    const price = parseFloat(document.getElementById("p-form-price").value) || 0;
    const total = qty * price;
    const preview = document.getElementById("p-form-total-preview");
    if (preview) preview.textContent = `${total.toLocaleString()} ${this.t("currency")}`;
  }

  handlePurchaseSubmit(e) {
    e.preventDefault();
    const purchase = {
      name: document.getElementById("p-form-name").value.trim(),
      categoryKey: document.getElementById("p-form-category").value,
      date: document.getElementById("p-form-date").value,
      feedItemId: document.getElementById("p-form-feed-item").value || null,
      quantity: parseFloat(document.getElementById("p-form-qty").value) || 0,
      unit: document.getElementById("p-form-unit").value,
      unitPrice: parseFloat(document.getElementById("p-form-price").value) || 0,
      paidBy: document.getElementById("p-form-payer").value,
      paymentMethod: document.getElementById("p-form-paymethod").value,
      supplier: document.getElementById("p-form-supplier").value.trim(),
      addToStock: document.getElementById("p-form-add-to-stock").checked
    };

    store.addPurchase(purchase);
    this.closePurchaseModal();
    this.render();
  }

  deletePurchase(id) {
    if (confirm(this.t("confirmDelete"))) {
      store.deletePurchase(id);
      this.render();
    }
  }

  // --- Flock Modal Handling ---
  openFlockModal(id) {
    const cat = store.getFlock().find(f => f.id === id);
    if (!cat) return;

    document.getElementById("f-form-id").value = cat.id;
    document.getElementById("f-form-count").value = cat.count;
    document.getElementById("f-form-weight").value = cat.avgWeight || 0;
    document.getElementById("f-form-notes").value = cat.notes || "";
    document.getElementById("modal-flock-title").textContent = this.t(cat.categoryKey);

    document.getElementById("modal-flock").classList.remove("hidden");
  }

  closeFlockModal() {
    const modal = document.getElementById("modal-flock");
    if (modal) modal.classList.add("hidden");
  }

  handleFlockSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("f-form-id").value;
    const count = document.getElementById("f-form-count").value;
    const avgWeight = document.getElementById("f-form-weight").value;
    const notes = document.getElementById("f-form-notes").value.trim();

    store.updateFlockCategory(id, count, avgWeight, notes);
    this.closeFlockModal();
    this.render();
  }

  // --- Stock Modal Handling ---
  openStockModal(id) {
    const feed = store.getFeedInventory().find(f => f.id === id);
    if (!feed) return;

    document.getElementById("s-form-id").value = feed.id;
    document.getElementById("s-form-stock").value = feed.currentStock;
    document.getElementById("s-form-price").value = feed.unitPrice;
    document.getElementById("s-form-unit-hint").textContent = `O'lchov birligi: ${this.t(feed.unit)}`;
    document.getElementById("modal-stock-title").textContent = this.t(feed.nameKey);

    document.getElementById("modal-stock").classList.remove("hidden");
  }

  closeStockModal() {
    const modal = document.getElementById("modal-stock");
    if (modal) modal.classList.add("hidden");
  }

  handleStockSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("s-form-id").value;
    const stock = document.getElementById("s-form-stock").value;
    const price = document.getElementById("s-form-price").value;

    store.updateFeedStock(id, stock, price);
    this.closeStockModal();
    this.render();
  }

  // --- Import Backup Handling ---
  openImportModal() {
    document.getElementById("modal-import")?.classList.remove("hidden");
  }

  closeImportModal() {
    document.getElementById("modal-import")?.classList.add("hidden");
  }

  handleImportSubmit() {
    const fileInput = document.getElementById("import-file-input");
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert("Iltimos, JSON faylni tanlang!");
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      if (store.importFromJson(content)) {
        alert(this.t("successSave"));
        this.closeImportModal();
        this.render();
      } else {
        alert("Fayl formati noto'g'ri!");
      }
    };
    reader.readAsText(file);
  }

  exportPurchasesCsv() {
    store.exportPurchasesCsv(translations[store.getLanguage()]);
  }
}

// Global instance
const app = new FarmApp();
