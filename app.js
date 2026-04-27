(function () {
  "use strict";

  const ids = [
    "spot",
    "strike",
    "maturity",
    "rate",
    "dividend",
    "repo",
    "vol",
    "position",
    "lots",
    "multiplier",
    "tick",
    "optionType",
    "spotMove",
    "ivMove",
    "spotChartMetric",
    "axisChartMetric",
    "axisChartVariable",
    "tenor",
    "bsPrice",
    "forward",
    "cashDelta",
    "deltaHedge",
    "deltaDecay",
    "cashGamma",
    "cashTheta",
    "cashVega",
    "cashCharm",
    "cashVanna",
    "cashRho",
    "newDeltaCash",
    "gammaPnl",
    "dailyMove",
    "tickValue",
    "premiumCash",
    "breakEven",
    "thetaBill",
    "moveToCover",
    "vegaShock",
    "exerciseSignal",
    "exerciseDetail",
    "unitDelta",
    "unitGamma",
    "unitVega",
    "unitTheta",
    "unitRho",
    "spotChartTitle",
    "axisChartTitle"
  ];

  const els = {};
  const charts = {};
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const BLUE = "#12436C";
  const RED = "#D1A08E";
  const GREEN = "#A9D08E";
  const PURPLE = "#595959";
  const GRID = "rgba(89, 89, 89, 0.16)";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    ids.forEach((id) => {
      els[id] = document.getElementById(id);
    });

    if (window.Chart) {
      Chart.register(atmLinePlugin);
      Chart.defaults.font.family = 'Inter, "Segoe UI", Roboto, Arial, sans-serif';
      Chart.defaults.color = "#595959";
    }

    document.querySelectorAll("input, select").forEach((input) => {
      input.addEventListener("input", update);
      input.addEventListener("change", update);
    });

    document.querySelectorAll(".step-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const target = els[button.dataset.target];
        if (!target) return;

        const step = parseNumber(target.dataset.step || "1", 1);
        const current = parseNumber(target.value, 0);
        const direction = Number(button.dataset.direction || 1);
        const decimals = decimalPlaces(step);
        target.value = formatInput(current + step * direction, decimals);
        target.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });

    update();
  }

  function readState() {
    const maturity = parseDate(els.maturity.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const t = Math.max((maturity - today) / MS_PER_DAY / 365.25, 1 / 365.25);
    const rate = parseNumber(els.rate.value, 5) / 100;
    const dividend = parseNumber(els.dividend.value, 2) / 100;
    const repo = parseNumber(els.repo.value, 0) / 100;
    const sigma = Math.max(parseNumber(els.vol.value, 20) / 100, 0.0001);

    return {
      spot: Math.max(parseNumber(els.spot.value, 100), 0.0001),
      strike: Math.max(parseNumber(els.strike.value, 100), 0.0001),
      maturity,
      t,
      rate,
      dividend,
      repo,
      sigma,
      yield: dividend + repo,
      position: parseNumber(els.position.value, 1),
      lots: Math.max(parseNumber(els.lots.value, 1), 0),
      multiplier: Math.max(parseNumber(els.multiplier.value, 100), 0),
      tick: Math.max(parseNumber(els.tick.value, 0.01), 0.000001),
      optionType: els.optionType.value === "put" ? "put" : "call",
      spotMovePct: parseNumber(els.spotMove.value, 1),
      ivMove: Math.max(parseNumber(els.ivMove.value, parseNumber(els.vol.value, 20)) / 100, 0.0001),
      spotChartMetric: els.spotChartMetric.value,
      axisChartMetric: els.axisChartMetric.value,
      axisChartVariable: els.axisChartVariable.value
    };
  }

  function update() {
    const state = readState();
    const result = blackScholes(state, state.optionType);
    const unit = result.greeks;
    const quantity = state.position * state.lots * state.multiplier;
    const absQuantity = state.lots * state.multiplier;
    const spotMove = state.spot * state.spotMovePct / 100;

    els.tenor.textContent = formatNumber(state.t, 4);
    els.bsPrice.textContent = formatNumber(result.price, 4);
    els.forward.textContent = formatNumber(result.forward, 4);
    els.cashDelta.textContent = formatNumber(unit.delta * state.spot * quantity, 2);
    els.deltaHedge.textContent = formatNumber(unit.delta * absQuantity, 1);
    els.deltaDecay.textContent = formatNumber(unit.charmDay * absQuantity, 2);

    els.cashGamma.textContent = formatNumber(unit.gamma * state.spot * quantity, 2);
    els.cashTheta.textContent = formatNumber(unit.thetaDay * quantity, 2);
    els.cashVega.textContent = formatNumber(unit.vegaPoint * quantity, 2);
    els.cashCharm.textContent = formatNumber(unit.charmDay * state.spot * quantity, 2);
    els.cashVanna.textContent = formatNumber(unit.vanna * quantity, 2);
    els.cashRho.textContent = formatNumber(unit.rhoPoint * quantity, 2);

    els.unitDelta.textContent = formatNumber(unit.delta, 6);
    els.unitGamma.textContent = formatNumber(unit.gamma, 6);
    els.unitVega.textContent = formatNumber(unit.vegaPoint, 6);
    els.unitTheta.textContent = formatNumber(unit.thetaDay, 6);
    els.unitRho.textContent = formatNumber(unit.rhoPoint, 6);

    els.newDeltaCash.textContent = formatNumber(unit.gamma * spotMove * state.spot * quantity, 0);
    els.gammaPnl.textContent = formatNumber(0.5 * unit.gamma * spotMove * spotMove * quantity, 2);
    els.dailyMove.textContent = `${formatNumber(state.ivMove / Math.sqrt(252) * 100, 2)}%`;

    els.tickValue.textContent = formatNumber(state.tick * quantity, 2);
    els.premiumCash.textContent = formatNumber(result.price * quantity, 2);
    els.breakEven.textContent = formatNumber(
      state.optionType === "call" ? state.strike + result.price : state.strike - result.price,
      2
    );
    els.thetaBill.textContent = formatNumber(unit.thetaDay * quantity, 2);
    els.vegaShock.textContent = formatNumber(unit.vegaPoint * quantity, 2);
    els.moveToCover.textContent = formatNumber(moveToCoverTheta(unit, state), 2) + "%";

    updateExercise(result, state);
    updateCharts(state);
  }

  function blackScholes(input, optionType) {
    const s = Math.max(input.spot, 0.0001);
    const k = Math.max(input.strike, 0.0001);
    const t = Math.max(input.t, 1e-8);
    const sigma = Math.max(input.sigma, 1e-8);
    const r = input.rate;
    const y = input.yield;
    const sqrtT = Math.sqrt(t);
    const discR = Math.exp(-r * t);
    const discY = Math.exp(-y * t);
    const forward = s * Math.exp((r - y) * t);
    const d1 = (Math.log(s / k) + (r - y + 0.5 * sigma * sigma) * t) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;
    const pdfD1 = normPdf(d1);
    const callPrice = s * discY * normCdf(d1) - k * discR * normCdf(d2);
    const putPrice = k * discR * normCdf(-d2) - s * discY * normCdf(-d1);

    return {
      price: optionType === "put" ? putPrice : callPrice,
      callPrice,
      putPrice,
      forward,
      d1,
      d2,
      greeks: greeksFor(optionType, { s, k, t, sigma, r, y, sqrtT, discR, discY, d1, d2, pdfD1 })
    };
  }

  function greeksFor(optionType, p) {
    const isCall = optionType === "call";
    const nd1 = normCdf(p.d1);
    const nd2 = normCdf(p.d2);
    const delta = isCall ? p.discY * nd1 : p.discY * (nd1 - 1);
    const gamma = p.discY * p.pdfD1 / (p.s * p.sigma * p.sqrtT);
    const vegaPoint = p.s * p.discY * p.pdfD1 * p.sqrtT * 0.01;
    const commonTheta = -(p.s * p.discY * p.pdfD1 * p.sigma) / (2 * p.sqrtT);
    const thetaAnnual = isCall
      ? commonTheta - p.r * p.k * p.discR * nd2 + p.y * p.s * p.discY * nd1
      : commonTheta + p.r * p.k * p.discR * normCdf(-p.d2) - p.y * p.s * p.discY * normCdf(-p.d1);
    const rhoPoint = isCall
      ? p.k * p.t * p.discR * nd2 * 0.01
      : -p.k * p.t * p.discR * normCdf(-p.d2) * 0.01;
    const charmAnnual = charm(optionType, p);
    const vanna = -p.discY * p.pdfD1 * p.d2 / p.sigma;

    return {
      delta,
      gamma,
      vegaPoint,
      thetaDay: thetaAnnual / 365,
      rhoPoint,
      charmDay: charmAnnual / 365,
      vanna
    };
  }

  function charm(optionType, p) {
    const part = p.discY * p.pdfD1 *
      ((2 * (p.r - p.y) * p.t - p.d2 * p.sigma * p.sqrtT) / (2 * p.t * p.sigma * p.sqrtT));

    if (optionType === "call") {
      return p.y * p.discY * normCdf(p.d1) - part;
    }

    return -p.y * p.discY * normCdf(-p.d1) - part;
  }

  function metricValue(metric, params, optionType) {
    const calc = blackScholes(params, optionType);
    const g = calc.greeks;
    const values = {
      price: calc.price,
      delta: g.delta,
      gamma: g.gamma,
      vega: g.vegaPoint,
      theta: g.thetaDay,
      rho: g.rhoPoint
    };

    return values[metric] ?? calc.price;
  }

  function updateCharts(state) {
    if (!window.Chart) return;

    updateSpotChart(state);
    updateAxisChart(state);
    updateVolatilitySensitivity("deltaVolChart", "delta", state);
    updateTimeSensitivity("deltaTimeChart", "delta", state);
    updateVolatilitySensitivity("gammaVolChart", "gamma", state);
    updateTimeSensitivity("gammaTimeChart", "gamma", state);
    updateVolatilitySensitivity("vegaVolChart", "vega", state);
    updateTimeSensitivity("vegaTimeChart", "vega", state);
  }

  function updateSpotChart(state) {
    const metric = state.spotChartMetric;
    const title = `${titleCase(metric)} vs Spot`;
    els.spotChartTitle.textContent = title;
    const spots = range(state.spot * 0.7, state.spot * 1.3, 45);

    const datasets = ["call", "put"].map((type) => ({
      label: titleCase(type),
      data: spots.map((spot) => ({
        x: spot,
        y: metricValue(metric, { ...state, spot }, type)
      })),
      borderColor: type === "call" ? BLUE : RED,
      backgroundColor: type === "call" ? BLUE : RED,
      pointRadius: 0,
      borderWidth: 2,
      tension: 0.28
    }));

    drawChart("priceSpotChart", datasets, {
      xTitle: "Spot",
      yTitle: titleCase(metric),
      xValue: state.spot,
      label: "ATM"
    });
  }

  function updateAxisChart(state) {
    const metric = state.axisChartMetric;
    const variable = state.axisChartVariable;
    const title = `${titleCase(metric)} vs ${titleCase(variable)}`;
    els.axisChartTitle.textContent = title;

    const values = axisValues(variable, state);
    const datasets = ["call", "put"].map((type) => ({
      label: titleCase(type),
      data: values.map((value) => ({
        x: displayX(variable, value),
        y: metricValue(metric, paramsForAxis(variable, value, state), type)
      })),
      borderColor: type === "call" ? BLUE : RED,
      backgroundColor: type === "call" ? BLUE : RED,
      pointRadius: 0,
      borderWidth: 2,
      tension: 0.2
    }));

    drawChart("axisChart", datasets, {
      xTitle: axisTitle(variable),
      yTitle: titleCase(metric)
    });
  }

  function updateVolatilitySensitivity(canvasId, metric, state) {
    const spots = range(state.spot * 0.7, state.spot * 1.3, 45);
    const vols = [
      { value: 0.1, label: "sigma = 10%", color: BLUE },
      { value: 0.2, label: "sigma = 20%", color: PURPLE },
      { value: 0.4, label: "sigma = 40%", color: RED }
    ];

    const datasets = vols.map((vol) => ({
      label: vol.label,
      data: spots.map((spot) => ({
        x: spot,
        y: metricValue(metric, { ...state, spot, sigma: vol.value }, state.optionType)
      })),
      borderColor: vol.color,
      backgroundColor: vol.color,
      pointRadius: 0,
      borderWidth: 2,
      tension: 0.3
    }));

    drawChart(canvasId, datasets, {
      xTitle: "Spot",
      yTitle: titleCase(metric),
      xValue: state.spot,
      label: "ATM"
    });
  }

  function updateTimeSensitivity(canvasId, metric, state) {
    const times = range(0.04, Math.max(state.t, 1), 45);
    const moneyness = [
      { ratio: 0.9, label: state.optionType === "call" ? "OTM (S=90)" : "ITM (S=90)", color: RED },
      { ratio: 1, label: "ATM (S=100)", color: BLUE },
      { ratio: 1.1, label: state.optionType === "call" ? "ITM (S=110)" : "OTM (S=110)", color: GREEN }
    ];

    const datasets = moneyness.map((item) => ({
      label: item.label,
      data: times.map((t) => ({
        x: t,
        y: metricValue(metric, { ...state, spot: state.strike * item.ratio, t }, state.optionType)
      })),
      borderColor: item.color,
      backgroundColor: item.color,
      pointRadius: 0,
      borderWidth: 2,
      tension: 0.3
    }));

    drawChart(canvasId, datasets, {
      xTitle: "Time to Maturity (y)",
      yTitle: titleCase(metric)
    });
  }

  function drawChart(canvasId, datasets, extra) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (charts[canvasId]) {
      charts[canvasId].destroy();
    }

    charts[canvasId] = new Chart(canvas, {
      type: "line",
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
          intersect: false,
          mode: "nearest"
        },
        scales: {
          x: {
            type: "linear",
            title: {
              display: Boolean(extra.xTitle),
              text: extra.xTitle,
              color: "#595959",
              font: { size: 12, weight: "500" }
            },
            grid: { color: "rgba(0, 0, 0, 0)" },
            ticks: {
              maxTicksLimit: 8,
              color: "#595959",
              callback: (value) => trimNumber(value)
            }
          },
          y: {
            title: {
              display: false,
              text: extra.yTitle || ""
            },
            grid: { color: GRID },
            border: { color: "#DBDBDB" },
            ticks: {
              maxTicksLimit: 6,
              color: "#595959",
              callback: (value) => trimNumber(value)
            }
          }
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 28,
              boxHeight: 2,
              usePointStyle: false,
              color: "#021A32",
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${formatNumber(context.parsed.y, 4)}`
            }
          },
          atmLine: {
            xValue: extra.xValue,
            label: extra.label
          }
        }
      }
    });
  }

  function axisValues(variable, state) {
    if (variable === "time") return range(0.04, Math.max(state.t, 1), 45);
    if (variable === "strike") return range(state.strike * 0.7, state.strike * 1.3, 45);
    return range(0.05, 0.6, 45);
  }

  function paramsForAxis(variable, value, state) {
    if (variable === "time") return { ...state, t: value };
    if (variable === "strike") return { ...state, strike: value };
    return { ...state, sigma: value };
  }

  function displayX(variable, value) {
    return variable === "vol" ? value * 100 : value;
  }

  function axisTitle(variable) {
    const labels = {
      vol: "Vol (%)",
      time: "Time to Maturity (y)",
      strike: "Strike"
    };
    return labels[variable] || titleCase(variable);
  }

  function moveToCoverTheta(unit, state) {
    const theta = Math.abs(unit.thetaDay);
    if (unit.gamma <= 0 || theta === 0) return 0;
    const move = Math.sqrt((2 * theta) / unit.gamma);
    return move / state.spot * 100;
  }

  function updateExercise(result, state) {
    const intrinsic = state.optionType === "call"
      ? Math.max(state.spot - state.strike, 0)
      : Math.max(state.strike - state.spot, 0);
    const extrinsic = Math.max(result.price - intrinsic, 0);
    let signal = "Hold";
    let detail = `Extrinsic value ${formatNumber(extrinsic, 4)}`;

    if (state.optionType === "call" && state.dividend + state.repo > state.rate && extrinsic < 0.05) {
      signal = "Watch";
      detail = "Dividend carry can make exercise relevant near expiry.";
    }

    if (state.optionType === "put" && state.rate > state.dividend + state.repo && extrinsic < 0.05 && state.spot < state.strike) {
      signal = "Watch";
      detail = "Deep in-the-money put with low extrinsic value.";
    }

    els.exerciseSignal.textContent = signal;
    els.exerciseDetail.textContent = detail;
  }

  function parseNumber(value, fallback) {
    if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
    const normalized = String(value || "")
      .trim()
      .replace(/\s/g, "")
      .replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function parseDate(value) {
    const match = String(value || "").trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      parsed.setHours(0, 0, 0, 0);
      return parsed;
    }

    const fallback = new Date();
    fallback.setFullYear(fallback.getFullYear() + 1);
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }

  function erf(x) {
    const sign = x >= 0 ? 1 : -1;
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const absX = Math.abs(x);
    const t = 1 / (1 + p * absX);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return sign * y;
  }

  function normCdf(x) {
    return 0.5 * (1 + erf(x / Math.SQRT2));
  }

  function normPdf(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  function range(start, end, count) {
    if (count <= 1) return [start];
    const step = (end - start) / (count - 1);
    return Array.from({ length: count }, (_, index) => start + index * step);
  }

  function decimalPlaces(value) {
    const text = String(value);
    if (!text.includes(".")) return 0;
    return text.split(".")[1].length;
  }

  function formatInput(value, decimals) {
    return value.toFixed(decimals).replace(".", ",");
  }

  function formatNumber(value, decimals) {
    if (!Number.isFinite(value)) return "-";
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function trimNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return value;
    if (Math.abs(number) >= 100) return formatNumber(number, 0);
    if (Math.abs(number) >= 10) return formatNumber(number, 1);
    return formatNumber(number, 2);
  }

  function titleCase(value) {
    return String(value)
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (letter) => letter.toUpperCase());
  }

  const atmLinePlugin = {
    id: "atmLine",
    afterDatasetsDraw(chart, _args, options) {
      if (!options || !Number.isFinite(options.xValue)) return;

      const xScale = chart.scales.x;
      const yScale = chart.scales.y;
      const x = xScale.getPixelForValue(options.xValue);

      if (x < xScale.left || x > xScale.right) return;

      const ctx = chart.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(18, 67, 108, 0.46)";
      ctx.lineWidth = 1;
      ctx.moveTo(x, yScale.top);
      ctx.lineTo(x, yScale.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#12436C";
      ctx.font = "11px Segoe UI, Arial, sans-serif";
      ctx.fillText(options.label || "ATM", x + 6, yScale.top + 14);
      ctx.restore();
    }
  };
})();
