/**
 * Otam Fermasi - Diagrammalar va vizual grafika (Zero-dependency SVG)
 * Визуальные диаграммы и графики без внешних зависимостей
 */

class FarmCharts {
  // Category colors matching farm palette: greens, warm earths, muted accents
  static categoryColors = [
    "#16a34a", // Emerald green (Feed)
    "#d97706", // Warm amber/brown (Roughage)
    "#0284c7", // Sky blue (Medicine)
    "#854d0e", // Warm saddle brown (Livestock)
    "#64748b", // Slate (Equipment)
    "#e11d48", // Rose (Maintenance)
    "#9333ea", // Purple (Logistics)
    "#059669"  // Teal (Labor)
  ];

  static renderDonutChart(containerId, data, emptyLabel = "Ma'lumot yo'q") {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center p-8 text-neutral-400">
          <svg class="w-12 h-12 mb-2 stroke-current" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" stroke-width="2"/>
            <path stroke-linecap="round" stroke-width="2" d="M12 8v4m0 4h.01"/>
          </svg>
          <span class="text-sm">${emptyLabel}</span>
        </div>
      `;
      return;
    }

    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    const size = 200;
    const strokeWidth = 32;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let accumulatedOffset = 0;
    const slices = data.map((item, idx) => {
      const percentage = item.value / total;
      const strokeDasharray = `${percentage * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += percentage * circumference;
      const color = item.color || this.categoryColors[idx % this.categoryColors.length];

      return `
        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}"
          fill="transparent"
          stroke="${color}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${strokeDasharray}"
          stroke-dashoffset="${strokeDashoffset}"
          class="chart-slice transition-all duration-300 hover:opacity-85"
        >
          <title>${item.label}: ${item.value.toLocaleString()} (${Math.round(percentage * 100)}%)</title>
        </circle>
      `;
    }).join("");

    const legend = data.map((item, idx) => {
      const percentage = Math.round((item.value / total) * 100);
      const color = item.color || this.categoryColors[idx % this.categoryColors.length];
      return `
        <div class="flex items-center justify-between text-xs py-1 border-b border-neutral-100 last:border-0">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${color};"></span>
            <span class="font-medium text-neutral-700 truncate max-w-[130px]">${item.label}</span>
          </div>
          <div class="text-right">
            <span class="font-semibold text-neutral-800">${item.value.toLocaleString()}</span>
            <span class="text-neutral-400 ml-1">(${percentage}%)</span>
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = `
      <div class="flex flex-col sm:flex-row items-center gap-6 justify-around p-2">
        <div class="relative w-[180px] h-[180px] flex items-center justify-center flex-shrink-0">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="-rotate-90 transform">
            ${slices}
          </svg>
          <div class="absolute flex flex-col items-center justify-center text-center pointer-events-none">
            <span class="text-xs text-neutral-400 uppercase tracking-wider">Jami</span>
            <span class="text-sm font-bold text-neutral-800">${(total >= 1000000 ? (total/1000000).toFixed(1) + 'M' : (total/1000).toFixed(0) + 'k')}</span>
          </div>
        </div>
        <div class="w-full flex-1 max-w-[280px]">
          ${legend}
        </div>
      </div>
    `;
  }

  static renderComparisonBar(containerId, brotherAmount, myAmount, brotherLabel, myLabel, currency = "so'm") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const total = brotherAmount + myAmount;
    const brotherPct = total > 0 ? Math.round((brotherAmount / total) * 100) : 50;
    const myPct = total > 0 ? (100 - brotherPct) : 50;

    container.innerHTML = `
      <div class="space-y-3">
        <div class="flex justify-between text-sm font-medium text-neutral-700">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-600"></span>
            <span>${brotherLabel}: <strong>${brotherAmount.toLocaleString()} ${currency}</strong></span>
          </div>
          <div class="flex items-center gap-2">
            <span><strong>${myAmount.toLocaleString()} ${currency}</strong> :${myLabel}</span>
            <span class="w-3 h-3 rounded-full bg-amber-700"></span>
          </div>
        </div>
        <div class="h-5 w-full bg-neutral-100 rounded-full overflow-hidden flex shadow-inner">
          <div style="width: ${brotherPct}%;" class="bg-emerald-600 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold" title="${brotherLabel}: ${brotherPct}%">
            ${brotherPct > 10 ? brotherPct + '%' : ''}
          </div>
          <div style="width: ${myPct}%;" class="bg-amber-700 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold" title="${myLabel}: ${myPct}%">
            ${myPct > 10 ? myPct + '%' : ''}
          </div>
        </div>
      </div>
    `;
  }
}
