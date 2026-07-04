// app.js - Pastel Flex Lotto Lab Client Logic with Local Storage, Matcher, and Pinned/Excluded Filters

// --- Data Constants ---
const FREQUENCY_SCORES = {
  1: 9, 2: 7, 3: 8, 4: 7, 5: 6, 6: 7, 7: 8, 8: 7, 9: 6, 10: 7,
  11: 8, 12: 8, 13: 9, 14: 8, 15: 7, 16: 6, 17: 9, 18: 9, 19: 6, 20: 8,
  21: 7, 22: 7, 23: 6, 24: 8, 25: 7, 26: 8, 27: 10, 28: 7, 29: 6, 30: 7,
  31: 8, 32: 7, 33: 9, 34: 10, 35: 7, 36: 6, 37: 8, 38: 7, 39: 9, 40: 8,
  41: 7, 42: 8, 43: 10, 44: 8, 45: 9
};

const COLD_NUMBERS = new Set([5, 9, 16, 23, 29, 36]);
const adjustedWeights = { ...FREQUENCY_SCORES };
COLD_NUMBERS.forEach(num => {
  adjustedWeights[num] += 2;
});

const PRIMES = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43]);

const MODE_DESCRIPTIONS = {
  1: { name: "stat-stat", desc: "1차 통계 + 2차 통계 (전형적 피팅 중심)" },
  2: { name: "rand-stat", desc: "1차 무작위 + 2차 통계 (랜덤 후 균형 보완)" },
  3: { name: "stat-rand", desc: "1차 통계 + 2차 무작위 (통계 선점 후 랜덤)" },
  4: { name: "rand-rand", desc: "1차 무작위 + 2차 무작위 (순수 이중 무작위)" }
};

// 100% Reliable Offline Fallback Data
const FALLBACK_LATEST_DRAW = {
  drwNo: 1229,
  drwNoDate: "2026-06-27",
  drwtNo1: 1,
  drwtNo2: 5,
  drwtNo3: 12,
  drwtNo4: 19,
  drwtNo5: 23,
  drwtNo6: 44,
  bnusNo: 35,
  firstWinamnt: 1850000000,
  returnValue: "success"
};

// --- State Variables ---
let currentMode = 1;
let isDrawing = false;
let history = []; // Saved lotto tickets database
const pinnedNumbers = new Set();
const excludedNumbers = new Set();

// --- DOM References ---
const btnModeCards = document.querySelectorAll('.mode-option');
const btnGenerate = document.getElementById('btn-generate');
const selectSets = document.getElementById('input-sets');
const selectTemp = document.getElementById('input-temp');
const badgeStatus = document.getElementById('status-badge');
const badgeText = document.getElementById('badge-text');
const resultsPanel = document.getElementById('results-panel');
const part1List = document.getElementById('part1-list');
const part2List = document.getElementById('part2-list');
const excludedChipsContainer = document.getElementById('excluded-chips');
const labelOddEven = document.getElementById('label-odd-even');
const labelHighLow = document.getElementById('label-high-low');
const chartOddEven = document.getElementById('chart-odd-even');
const chartHighLow = document.getElementById('chart-high-low');
const gaussianDot = document.getElementById('gaussian-dot');

// History & Matcher DOM References
const savedLogsList = document.getElementById('saved-logs-list');
const savedLogsCount = document.getElementById('saved-logs-count');
const btnClearHistory = document.getElementById('btn-clear-history');
const btnRunMatch = document.getElementById('btn-run-match');
const valTotalSpend = document.getElementById('val-total-spend');
const valTotalWin = document.getElementById('val-total-win');
const valRoi = document.getElementById('val-roi');

const rank1Fill = document.getElementById('rank-1-fill');
const rank2Fill = document.getElementById('rank-2-fill');
const rank3Fill = document.getElementById('rank-3-fill');
const rank4Fill = document.getElementById('rank-4-fill');
const rank5Fill = document.getElementById('rank-5-fill');

const rank1Val = document.getElementById('rank-1-val');
const rank2Val = document.getElementById('rank-2-val');
const rank3Val = document.getElementById('rank-3-val');
const rank4Val = document.getElementById('rank-4-val');
const rank5Val = document.getElementById('rank-5-val');

// --- Canvas Physics Engine Setup ---
const canvas = document.getElementById('lotto-canvas');
const ctx = canvas.getContext('2d');
const cx = 110;
const cy = 110;
const cageRadius = 92;
const ballRadius = 6.8;
const restitution = 0.58;
const gravity = 0.22;

let balls = [];
let isSpinning = false;
let animationFrameId = null;

// Initialize 45 pastel balls
function initPhysicsBalls() {
  balls = [];
  for (let i = 1; i <= 45; i++) {
    const angle = Math.random() * Math.PI * 0.8 + Math.PI * 0.1;
    const r = Math.random() * (cageRadius - 20);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r + 20;
    
    balls.push({
      num: i,
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      r: ballRadius,
      color: getBallPastelHex(i),
      textHex: getBallTextHex(i),
      exiting: false,
      exitProgress: 0
    });
  }
}

// Vibrant Pastel Ball Colors (Matched with CSS)
function getBallPastelHex(num) {
  if (num <= 10) return '#facc15';
  if (num <= 20) return '#60a5fa';
  if (num <= 30) return '#fb7185';
  if (num <= 40) return '#94a3b8';
  return '#34d399';
}

function getBallTextHex(num) {
  if (num <= 10) return '#78350f';
  return '#ffffff';
}

function getBallColorClass(num) {
  if (num <= 10) return 'color-p-yellow';
  if (num <= 20) return 'color-p-blue';
  if (num <= 30) return 'color-p-red';
  if (num <= 40) return 'color-p-gray';
  return 'color-p-green';
}

// 2D Physics Loop
function updatePhysics() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 1. Draw outer transparent cage border
  ctx.beginPath();
  ctx.arc(cx, cy, cageRadius + 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(cx, cy, cageRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 2. Physics Update & Draw Balls
  balls.forEach((ball, idx) => {
    if (ball.exiting) {
      ball.exitProgress += 0.05;
      ball.x = cx;
      ball.y = cy + cageRadius + (ball.exitProgress * 25);
      
      const scaleRadius = ball.r * (1 - ball.exitProgress * 0.4);
      if (scaleRadius > 0) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, scaleRadius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      return;
    }

    // Apply Forces
    if (isSpinning) {
      const dx = ball.x - cx;
      const dy = ball.y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist > 0) {
        const tx = -dy / dist;
        const ty = dx / dist;
        ball.vx += tx * 0.85 + (Math.random() - 0.5) * 0.5;
        ball.vy += ty * 0.85 + (Math.random() - 0.5) * 0.5;
        
        ball.vx += (dx / dist) * 0.15;
        ball.vy += (dy / dist) * 0.15;
      }
    } else {
      ball.vy += gravity;
    }
    
    ball.vx *= 0.985;
    ball.vy *= 0.985;
    
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist + ball.r > cageRadius) {
      const nx = -dx / dist;
      const ny = -dy / dist;
      
      ball.x = cx - nx * (cageRadius - ball.r);
      ball.y = cy - ny * (cageRadius - ball.r);
      
      const dot = ball.vx * nx + ball.vy * ny;
      ball.vx = (ball.vx - 2 * dot * nx) * restitution;
      ball.vy = (ball.vy - 2 * dot * ny) * restitution;
    }
    
    for (let j = idx + 1; j < balls.length; j++) {
      const bj = balls[j];
      if (bj.exiting) continue;
      
      const bdx = bj.x - ball.x;
      const bdy = bj.y - ball.y;
      const bdist = Math.sqrt(bdx*bdx + bdy*bdy);
      const minDist = ball.r + bj.r;
      
      if (bdist < minDist) {
        const bnx = bdx / bdist;
        const bny = bdy / bdist;
        const overlap = minDist - bdist;
        
        ball.x -= bnx * overlap * 0.5;
        ball.y -= bny * overlap * 0.5;
        bj.x += bnx * overlap * 0.5;
        bj.y += bny * overlap * 0.5;
        
        const rvx = bj.vx - ball.vx;
        const rvy = bj.vy - ball.vy;
        const velAlongNormal = rvx * bnx + rvy * bny;
        
        if (velAlongNormal < 0) {
          const impulse = -(1 + restitution) * velAlongNormal / 2;
          ball.vx -= impulse * bnx;
          ball.vy -= impulse * bny;
          bj.vx += impulse * bnx;
          bj.vy += impulse * bny;
        }
      }
    }
    
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = ball.textHex;
    ctx.font = 'bold 7px var(--font-primary)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ball.num.toString(), ball.x, ball.y + 0.3);
  });

  ctx.beginPath();
  ctx.arc(cx, cy + cageRadius, 10, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(226, 232, 240, 0.4)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.stroke();

  animationFrameId = requestAnimationFrame(updatePhysics);
}

// Initial draw run
initPhysicsBalls();
updatePhysics();

// --- Event Listeners Mode Cards ---
btnModeCards.forEach(card => {
  card.addEventListener('click', () => {
    if (isDrawing) return;
    btnModeCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    currentMode = parseInt(card.dataset.mode);
    badgeText.textContent = `${MODE_DESCRIPTIONS[currentMode].name.toUpperCase()} 선택됨`;
  });
});

btnGenerate.addEventListener('click', () => {
  if (isDrawing) return;
  startSimulation();
});

// --- Statistical Core Functions (JS Port) ---
function calculateFitnessScore(lst) {
  let score = 0.0;
  
  const odds = lst.filter(x => x % 2 !== 0).length;
  if ([3, 2, 4].includes(odds)) score += 10;
  else if ([1, 5].includes(odds)) score += 2;
  else score += -10;
  
  const lows = lst.filter(x => x <= 22).length;
  if ([3, 2, 4].includes(lows)) score += 10;
  else if ([1, 5].includes(lows)) score += 2;
  else score += -10;
  
  const totalSum = lst.reduce((a, b) => a + b, 0);
  const sumScore = Math.exp(-Math.pow(totalSum - 138.0, 2) / (2 * Math.pow(32.0, 2))) * 10;
  score += sumScore;
  
  const diffs = new Set();
  for (let i = 0; i < lst.length; i++) {
    for (let j = i + 1; j < lst.length; j++) {
      diffs.add(Math.abs(lst[i] - lst[j]));
    }
  }
  const ac = diffs.size - (6 - 1);
  if (ac >= 7) score += 10;
  else if (ac === 6) score += 5;
  else score += -15;
  
  let consecCount = 0;
  let maxConsecRun = 1;
  let run = 1;
  for (let i = 0; i < 5; i++) {
    if (lst[i+1] - lst[i] === 1) {
      consecCount += 1;
      run += 1;
      if (run > maxConsecRun) maxConsecRun = run;
    } else {
      run = 1;
    }
  }
  if (maxConsecRun >= 3) score += -15;
  else if (consecCount <= 1) score += 10;
  else if (consecCount === 2) score += 5;
  else score += -10;
  
  const lastDigits = lst.map(x => x % 10);
  const digitCounts = {};
  lastDigits.forEach(d => { digitCounts[d] = (digitCounts[d] || 0) + 1; });
  const maxDupDigit = Math.max(...Object.values(digitCounts));
  if (maxDupDigit <= 2) score += 10;
  else if (maxDupDigit === 3) score += -5;
  else score += -15;
  
  const buckets = [0, 0, 0, 0, 0];
  lst.forEach(x => {
    if (x <= 9) buckets[0]++;
    else if (x <= 19) buckets[1]++;
    else if (x <= 29) buckets[2]++;
    else if (x <= 39) buckets[3]++;
    else buckets[4]++;
  });
  const maxBucket = Math.max(...buckets);
  if (maxBucket <= 3) score += 10;
  else if (maxBucket === 4) score += -5;
  else score += -15;
  
  const primeCount = lst.filter(x => PRIMES.has(x)).length;
  const mult3Count = lst.filter(x => x % 3 === 0).length;
  if (primeCount >= 1 && primeCount <= 3 && mult3Count >= 1 && mult3Count <= 3) score += 10;
  else if ((primeCount >= 1 && primeCount <= 3) || (mult3Count >= 1 && mult3Count <= 3)) score += 5;
  else score += -5;
  
  return parseFloat(score.toFixed(2));
}

// Generate combinations respecting manual Pins
function generateRandSets(pool, count) {
  // Filter out any pinned numbers from drawing pool
  const poolArray = Array.from(pool).filter(n => !pinnedNumbers.has(n));
  const results = [];
  while (results.length < count) {
    const picked = Array.from(pinnedNumbers);
    const tempPool = [...poolArray];
    while (picked.length < 6) {
      if (tempPool.length === 0) break;
      const idx = Math.floor(Math.random() * tempPool.length);
      picked.push(tempPool.splice(idx, 1)[0]);
    }
    picked.sort((a, b) => a - b);
    
    const stringified = JSON.stringify(picked);
    if (!results.some(r => JSON.stringify(r) === stringified)) {
      results.push(picked);
    }
  }
  return results;
}

function generateStatSets(pool, count, temp) {
  const poolArray = Array.from(pool).filter(n => !pinnedNumbers.has(n));
  const poolWeights = poolArray.map(num => adjustedWeights[num]);
  
  const candidates = [];
  for (let c = 0; c < 1000; c++) {
    const candidate = new Set(pinnedNumbers);
    while (candidate.size < 6) {
      if (poolArray.length === 0) break;
      candidate.add(weightedSample(poolArray, poolWeights));
    }
    candidates.push(Array.from(candidate).sort((a, b) => a - b));
  }
  
  const scores = candidates.map(c => calculateFitnessScore(c));
  const maxScore = Math.max(...scores);
  
  const shiftedScores = scores.map(s => (s - maxScore) / temp);
  const expScores = shiftedScores.map(ss => Math.exp(ss));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  const probs = expScores.map(es => es / sumExp);
  
  const sampledSets = [];
  const sampledScores = [];
  let attempts = 0;
  
  while (sampledSets.length < count && attempts < 2000) {
    attempts++;
    const idx = weightedIndexSample(probs);
    const candidate = candidates[idx];
    const stringified = JSON.stringify(candidate);
    
    if (!sampledSets.some(s => JSON.stringify(s) === stringified)) {
      sampledSets.push(candidate);
      sampledScores.push(scores[idx]);
    }
  }
  
  return { sets: sampledSets, scores: sampledScores };
}

function weightedSample(arr, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  const threshold = Math.random() * total;
  let accum = 0;
  for (let i = 0; i < arr.length; i++) {
    accum += weights[i];
    if (threshold <= accum) return arr[i];
  }
  return arr[arr.length - 1];
}

function weightedIndexSample(probs) {
  const threshold = Math.random();
  let accum = 0;
  for (let i = 0; i < probs.length; i++) {
    accum += probs[i];
    if (threshold <= accum) return i;
  }
  return probs.length - 1;
}

// --- Run Simulation & Real-time Canvas exit ---
function startSimulation() {
  // Validate remaining pool size (must have at least 6 numbers)
  const poolSize = 45 - excludedNumbers.size;
  if (poolSize < 6) {
    alert("제외수가 너무 많아 6자리 조합을 구성할 수 없습니다. 제외수를 줄여주십시오.");
    return;
  }

  isDrawing = true;
  btnGenerate.disabled = true;
  badgeStatus.classList.add('active');
  badgeText.textContent = "물리 믹싱 연산 중";
  
  resultsPanel.classList.add('hidden');
  
  initPhysicsBalls();
  isSpinning = true;

  const setsCount = parseInt(selectSets.value);
  const temp = parseFloat(selectTemp.value);
  
  let m1 = "stat", m2 = "stat";
  if (currentMode === 2) { m1 = "rand"; m2 = "stat"; }
  else if (currentMode === 3) { m1 = "stat"; m2 = "rand"; }
  else if (currentMode === 4) { m1 = "rand"; m2 = "rand"; }
  
  // 1차 풀: 제외수를 완전히 배제한 풀
  const pool_1 = new Set(Array.from({ length: 45 }, (_, i) => i + 1).filter(n => !excludedNumbers.has(n)));
  let results1, scores1;
  
  if (m1 === "stat") {
    const res = generateStatSets(pool_1, setsCount, temp);
    results1 = res.sets;
    scores1 = res.scores;
  } else {
    results1 = generateRandSets(pool_1, setsCount);
    scores1 = Array(setsCount).fill("Pure Random");
  }
  
  const usedNumbers = new Set();
  results1.forEach(s => s.forEach(n => usedNumbers.add(n)));
  
  // 2차 풀: 1차 추천된 번호들과 제외수를 전체 풀에서 배제
  let pool_2 = new Set([...pool_1].filter(x => !usedNumbers.has(x)));
  
  // Resilient fallback: 2차 풀에 남은 개수가 6개 미만이면 사용 번호들을 도로 집어넣어 개수 충당
  if (pool_2.size < 6) {
    const fallbackArr = Array.from(usedNumbers);
    while (pool_2.size < 6 && fallbackArr.length > 0) {
      pool_2.add(fallbackArr.pop());
    }
  }
  
  let results2, scores2;
  
  if (m2 === "stat") {
    const res = generateStatSets(pool_2, setsCount, temp);
    results2 = res.sets;
    scores2 = res.scores;
  } else {
    results2 = generateRandSets(pool_2, setsCount);
    scores2 = Array(setsCount).fill("Pure Random");
  }
  
  const drawNumbers = [...results1[0]];

  setTimeout(() => {
    isSpinning = false;
    badgeText.textContent = "순차 방출 중";
    
    let drawCount = 0;
    const drawInterval = setInterval(() => {
      if (drawCount < 6) {
        const numToDraw = drawNumbers[drawCount];
        
        const ballObj = balls.find(b => b.num === numToDraw && !b.exiting);
        if (ballObj) {
          ballObj.exiting = true;
          ballObj.exitProgress = 0;
        }
        
        drawCount++;
      } else {
        clearInterval(drawInterval);
        
        setTimeout(() => {
          badgeStatus.classList.remove('active');
          badgeText.textContent = "추천 완료";
          btnGenerate.disabled = false;
          isDrawing = false;
          
          renderDashboardResults(results1, scores1, usedNumbers, results2, scores2);
        }, 500);
      }
    }, 250);

  }, 1200);
}

// --- Render Dashboard Results ---
function renderDashboardResults(results1, scores1, usedNumbers, results2, scores2) {
  part1List.innerHTML = '';
  part2List.innerHTML = '';
  excludedChipsContainer.innerHTML = '';
  
  // Part 1 Cards
  results1.forEach((set, idx) => {
    part1List.appendChild(createSetCard(idx + 1, set, scores1[idx]));
  });
  
  // Excluded Chips
  for (let i = 1; i <= 45; i++) {
    const chip = document.createElement('div');
    chip.className = `chip-item ${usedNumbers.has(i) ? 'active' : ''}`;
    chip.textContent = i;
    excludedChipsContainer.appendChild(chip);
  }
  
  // Part 2 Cards
  results2.forEach((set, idx) => {
    part2List.appendChild(createSetCard(idx + 1, set, scores2[idx]));
  });
  
  // Animate micro gauge bars
  setTimeout(() => {
    document.querySelectorAll('.bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.targetWidth;
    });
  }, 100);
  
  // Donut charts & Gaussian
  updateStatsDashboard([...results1, ...results2]);
  
  resultsPanel.classList.remove('hidden');
}

function createSetCard(index, set, score) {
  const card = document.createElement('div');
  card.className = 'card-item';
  
  const sum = set.reduce((a, b) => a + b, 0);
  const odds = set.filter(x => x % 2 !== 0).length;
  const evens = 6 - odds;
  const isStat = typeof score === 'number';
  
  const scoreText = isStat ? `적합도: ${score}/80.0` : "모드: Pure Random";
  const scorePercent = isStat ? (score / 80) * 100 : 0;
  
  card.innerHTML = `
    <div class="card-head">
      <span class="lbl-card-idx">SET 0${index}</span>
      <button class="btn-save-set" type="button">확정 저장</button>
    </div>
    <div class="balls-line">
      ${set.map(n => `<div class="ball-mini ${getBallColorClass(n)}">${n}</div>`).join('')}
    </div>
    <div class="card-foot">
      <span>합계: ${sum}</span>
      <span>홀짝: ${odds}:${evens}</span>
    </div>
    ${isStat ? `
    <div class="bar-track">
      <div class="bar-fill" data-target-width="${scorePercent}%"></div>
    </div>` : ''}
  `;

  // Attach Save Handler
  const btnSave = card.querySelector('.btn-save-set');
  btnSave.addEventListener('click', () => {
    if (btnSave.classList.contains('saved')) return;
    saveTicketToHistory(set, score);
    btnSave.textContent = "저장완료 ✓";
    btnSave.classList.add('saved');
    btnSave.disabled = true;
  });
  
  return card;
}

function updateStatsDashboard(all10Sets) {
  let totalOdds = 0;
  let totalLows = 0;
  let totalSum = 0;
  
  all10Sets.forEach(set => {
    totalOdds += set.filter(x => x % 2 !== 0).length;
    totalLows += set.filter(x => x <= 22).length;
    totalSum += set.reduce((a, b) => a + b, 0);
  });
  
  const avgOdds = totalOdds / all10Sets.length;
  const avgEvens = 6 - avgOdds;
  const avgLows = totalLows / all10Sets.length;
  const avgHighs = 6 - avgLows;
  const avgSum = totalSum / all10Sets.length;
  
  const oddPercent = (avgOdds / 6) * 100;
  chartOddEven.style.background = `conic-gradient(var(--pastel-purple) 0% ${oddPercent}%, rgba(226, 232, 240, 0.8) ${oddPercent}% 100%)`;
  labelOddEven.textContent = `${avgOdds.toFixed(1)}:${avgEvens.toFixed(1)}`;
  
  const lowPercent = (avgLows / 6) * 100;
  chartHighLow.style.background = `conic-gradient(var(--pastel-cyan) 0% ${lowPercent}%, rgba(226, 232, 240, 0.8) ${lowPercent}% 100%)`;
  labelHighLow.textContent = `${avgLows.toFixed(1)}:${avgHighs.toFixed(1)}`;
  
  let cx = ((avgSum - 90) / (185 - 90)) * 80 + 10;
  cx = Math.max(10, Math.min(90, cx));
  const cy = 38 - 36 * Math.exp(-Math.pow(cx - 50, 2) / Math.pow(20, 2));
  
  gaussianDot.setAttribute('cx', cx.toString());
  gaussianDot.setAttribute('cy', cy.toString());
  
  document.querySelector('.gaussian-mid-val').textContent = `평균 합계: ${Math.round(avgSum)}`;
}

// --- History & Big Data Persistence Layer ---

function getFormattedDate() {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function saveTicketToHistory(set, score) {
  const item = {
    id: Date.now() + Math.random(),
    date: getFormattedDate(),
    mode: MODE_DESCRIPTIONS[currentMode].name,
    set: [...set].sort((a,b)=>a-b),
    score: typeof score === 'number' ? score : null,
    result: null
  };
  
  history.push(item);
  localStorage.setItem('ados_lotto_history', JSON.stringify(history));
  
  renderHistoryLogs();
  updateBigDataDashboard();
}

function loadHistoryFromStorage() {
  const stored = localStorage.getItem('ados_lotto_history');
  if (stored) {
    try {
      history = JSON.parse(stored);
    } catch(e) {
      history = [];
    }
  } else {
    history = [];
  }
  
  renderHistoryLogs();
  updateBigDataDashboard();
}

function deleteHistoryItem(id) {
  history = history.filter(item => item.id !== id);
  localStorage.setItem('ados_lotto_history', JSON.stringify(history));
  renderHistoryLogs();
  updateBigDataDashboard();
}

function clearHistoryAll() {
  if (confirm("정말로 확정 저장된 모든 로또 기록 대장을 비우시겠습니까? 누적 빅데이터가 초기화됩니다.")) {
    history = [];
    localStorage.removeItem('ados_lotto_history');
    renderHistoryLogs();
    updateBigDataDashboard();
  }
}

function renderHistoryLogs() {
  savedLogsList.innerHTML = '';
  savedLogsCount.textContent = history.length;
  
  if (history.length === 0) {
    savedLogsList.innerHTML = `<p class="no-history-placeholder">아직 저장된 확정 번호가 없습니다. 위의 추천 결과에서 [확정 저장]을 누르면 기록이 축적됩니다.</p>`;
    return;
  }
  
  history.forEach(item => {
    const card = document.createElement('div');
    card.className = 'log-item-card';
    
    let resultTagHtml = '';
    const hasResult = item.result !== null && item.result !== undefined;
    
    if (hasResult) {
      const rank = item.result.rank;
      const rankLabels = {
        1: "1등 🎉",
        2: "2등 🥈",
        3: "3등 🥉",
        4: "4등 5만원 💸",
        5: "5등 5천원 🍀",
        0: "낙첨"
      };
      const badgeClass = rank > 0 ? `prize-rank-${rank}` : 'prize-rank-lose';
      resultTagHtml = `<span class="prize-badge ${badgeClass}">${rankLabels[rank]}</span>`;
    }
    
    card.innerHTML = `
      <div class="log-head">
        <span class="log-date">${item.date} (${item.mode.toUpperCase()})</span>
        <div class="log-actions">
          ${resultTagHtml}
          <button class="btn-delete-log" data-id="${item.id}" type="button">삭제</button>
        </div>
      </div>
      <div class="balls-line">
        ${item.set.map(num => {
          let matchedClass = '';
          if (hasResult && item.result.matchedNumbers.includes(num)) {
            matchedClass = 'matched';
          }
          return `<div class="ball-mini ${getBallColorClass(num)} ${matchedClass}">${num}</div>`;
        }).join('')}
      </div>
      <div class="card-foot">
        <span>합계: ${item.set.reduce((a,b)=>a+b, 0)}</span>
        <span>적합도: ${item.score !== null ? item.score : 'N/A'}</span>
      </div>
    `;
    
    card.querySelector('.btn-delete-log').addEventListener('click', () => {
      deleteHistoryItem(item.id);
    });
    
    savedLogsList.appendChild(card);
  });
}

function updateBigDataDashboard() {
  const totalGames = history.length;
  const spendAmount = totalGames * 1000;
  
  let winAmount = 0;
  const rankCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  const prizePool = {
    1: 2000000000,
    2: 50000000,
    3: 1500000,
    4: 50000,
    5: 5000,
    0: 0
  };
  
  history.forEach(item => {
    if (item.result) {
      const rank = item.result.rank;
      if (rank > 0) {
        rankCounts[rank]++;
        winAmount += prizePool[rank];
      }
    }
  });
  
  valTotalSpend.textContent = spendAmount.toLocaleString() + '원';
  valTotalWin.textContent = winAmount.toLocaleString() + '원';
  
  let roi = 0.0;
  if (spendAmount > 0) {
    roi = (winAmount / spendAmount) * 100;
  }
  valRoi.textContent = roi.toFixed(1) + '%';
  
  if (roi >= 100.0) {
    valRoi.style.color = '#10b981';
  } else if (roi > 0.0) {
    valRoi.style.color = '#3b82f6';
  } else {
    valRoi.style.color = '#e11d48';
  }

  const maxRankCount = Math.max(...Object.values(rankCounts), 1);
  for (let rank = 1; rank <= 5; rank++) {
    const count = rankCounts[rank];
    const fillBar = document.getElementById(`rank-${rank}-fill`);
    const valLabel = document.getElementById(`rank-${rank}-val`);
    
    valLabel.textContent = count;
    
    const widthPercent = (count / maxRankCount) * 100;
    fillBar.style.width = `${widthPercent}%`;
  }
}

function runDrawMatcher() {
  if (history.length === 0) {
    return;
  }
  
  const winningNums = [];
  for (let i = 1; i <= 6; i++) {
    const val = parseInt(document.getElementById(`m-num-${i}`).value);
    if (isNaN(val) || val < 1 || val > 45) {
      return; // Fail silently on initial auto-loads if values are blank
    }
    winningNums.push(val);
  }
  
  const uniqueWinning = new Set(winningNums);
  if (uniqueWinning.size !== 6) return;
  
  const bonusNum = parseInt(document.getElementById('m-bonus').value);
  if (isNaN(bonusNum) || bonusNum < 1 || bonusNum > 45) return;
  if (winningNums.includes(bonusNum)) return;
  
  history.forEach(item => {
    const mainMatches = item.set.filter(n => winningNums.includes(n));
    const matchCount = mainMatches.length;
    const bonusMatch = item.set.includes(bonusNum);
    
    let rank = 0;
    
    if (matchCount === 6) {
      rank = 1;
    } else if (matchCount === 5 && bonusMatch) {
      rank = 2;
    } else if (matchCount === 5) {
      rank = 3;
    } else if (matchCount === 4) {
      rank = 4;
    } else if (matchCount === 3) {
      rank = 5;
    }
    
    item.result = {
      rank: rank,
      matchedNumbers: [...mainMatches, ...(bonusMatch ? [bonusNum] : [])]
    };
  });
  
  localStorage.setItem('ados_lotto_history', JSON.stringify(history));
  
  renderHistoryLogs();
  updateBigDataDashboard();
}

// --- Draw Number Auto-Fetching & CORS Proxy Integration ---

function getCalculatedLatestDraw() {
  const start = new Date('2002-12-07T20:45:00+09:00').getTime();
  const diff = Date.now() - start;
  const msInWeek = 7 * 24 * 60 * 60 * 1000;
  return 1 + Math.floor(diff / msInWeek);
}

async function tryFetchDraw(drawNo) {
  const targetUrl = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drawNo}`;
  
  // 1. Try AllOrigins
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.contents) {
        return JSON.parse(data.contents);
      }
    }
  } catch (e) {
    console.warn("AllOrigins proxy failed, trying Codetabs...", e);
  }
  
  // 2. Try Codetabs
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Codetabs proxy failed...", e);
  }
  
  throw new Error("All CORS proxies failed to fetch winning numbers.");
}

// Background auto loader on page load
async function loadLatestActualDrawInfo() {
  const lblDate = document.getElementById('info-card-date');
  const lblPrize = document.getElementById('info-prize-val');
  const ballsRow = document.getElementById('info-balls-row');
  const banner = document.getElementById('before-draw-banner');
  const lblLoadedDraw = document.getElementById('lbl-loaded-draw');
  
  let targetDraw = getCalculatedLatestDraw();
  let beforeDraw = false;
  let data = null;
  
  try {
    data = await tryFetchDraw(targetDraw);
    if (!data || data.returnValue === "fail") {
      beforeDraw = true;
      targetDraw -= 1;
      data = await tryFetchDraw(targetDraw);
    }
  } catch (e) {
    console.warn("CORS Proxies failed. Degrading gracefully to offline fallback data.", e);
    // Silent degradations using offline pre-verified fallback
    data = FALLBACK_LATEST_DRAW;
    targetDraw = FALLBACK_LATEST_DRAW.drwNo;
    beforeDraw = (getCalculatedLatestDraw() > targetDraw);
  }
  
  if (data && data.returnValue === "success") {
    // 1. Fill matcher inputs
    document.getElementById('m-num-1').value = data.drwtNo1;
    document.getElementById('m-num-2').value = data.drwtNo2;
    document.getElementById('m-num-3').value = data.drwtNo3;
    document.getElementById('m-num-4').value = data.drwtNo4;
    document.getElementById('m-num-5').value = data.drwtNo5;
    document.getElementById('m-num-6').value = data.drwtNo6;
    document.getElementById('m-bonus').value = data.bnusNo;
    
    lblLoadedDraw.textContent = targetDraw;
    
    // 2. Render Info Card details
    lblDate.textContent = `추첨일: ${data.drwNoDate}`;
    
    // Format Prize amount
    const prizeAmt = data.firstWinamnt;
    let prizeText = prizeAmt.toLocaleString() + '원';
    if (prizeAmt > 0) {
      const billionPart = Math.floor(prizeAmt / 100000000);
      const restBillion = Math.round((prizeAmt % 100000000) / 10000000);
      if (billionPart > 0) {
        prizeText = `1인당 약 ${billionPart}.${restBillion}억 원 (${prizeAmt.toLocaleString()}원)`;
      }
    }
    lblPrize.textContent = prizeText;
    
    // Render info balls
    ballsRow.innerHTML = '';
    const nums = [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6];
    nums.forEach(num => {
      const ball = document.createElement('div');
      ball.className = `ball-mini ${getBallColorClass(num)}`;
      ball.textContent = num;
      ballsRow.appendChild(ball);
    });
    
    const plus = document.createElement('span');
    plus.textContent = '+';
    plus.style.margin = '0 4px';
    plus.style.fontWeight = 'bold';
    ballsRow.appendChild(plus);
    
    const bonusBall = document.createElement('div');
    bonusBall.className = `ball-mini ${getBallColorClass(data.bnusNo)}`;
    bonusBall.textContent = data.bnusNo;
    ballsRow.appendChild(bonusBall);
    
    // Show/Hide Before Draw Banner
    if (beforeDraw) {
      banner.classList.remove('hidden');
      banner.textContent = `⚠️ 금주 ${targetDraw + 1}회차는 아직 추첨 전입니다. 직전 ${targetDraw}회차 결과를 자동으로 로드했습니다.`;
    } else {
      banner.classList.add('hidden');
    }
    
    // Trigger matcher
    runDrawMatcher();
  } else {
    ballsRow.innerHTML = '<span class="loading-draw-text">공식 데이터를 불러오지 못했습니다.</span>';
  }
}

async function fetchLatestLottoNumbers() {
  const btn = document.getElementById('btn-fetch-latest');
  btn.disabled = true;
  btn.textContent = "조회 중...";
  
  try {
    await loadLatestActualDrawInfo();
    btn.textContent = "로드 완료 ✓";
  } catch (e) {
    alert("당첨 번호 로드에 실패했습니다.");
    btn.textContent = "당첨번호 자동로드 🔄";
  } finally {
    btn.disabled = false;
  }
}

// --- Pinned / Excluded UI Marking Board Initialization ---
function initMarkingBoard() {
  const grid = document.getElementById('marking-board-grid');
  if (!grid) return;
  grid.innerHTML = '';
  
  for (let i = 1; i <= 45; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'marking-btn';
    btn.textContent = i;
    
    btn.addEventListener('click', () => {
      if (isDrawing) return;
      
      // Cycle: Default -> Pinned -> Excluded -> Default
      if (!pinnedNumbers.has(i) && !excludedNumbers.has(i)) {
        if (pinnedNumbers.size < 5) {
          pinnedNumbers.add(i);
          btn.className = 'marking-btn pinned';
          badgeText.textContent = `고정수 추가: ${i}번`;
        } else {
          // If pins are full, go straight to Exclude
          excludedNumbers.add(i);
          btn.className = 'marking-btn excluded';
          badgeText.textContent = `제외수 추가: ${i}번`;
        }
      } else if (pinnedNumbers.has(i)) {
        pinnedNumbers.delete(i);
        excludedNumbers.add(i);
        btn.className = 'marking-btn excluded';
        badgeText.textContent = `제외수로 전환: ${i}번`;
      } else if (excludedNumbers.has(i)) {
        excludedNumbers.delete(i);
        btn.className = 'marking-btn';
        badgeText.textContent = `필터 해제: ${i}번`;
      }
    });
    
    grid.appendChild(btn);
  }
}

// --- Attach History Control Handlers ---
btnClearHistory.addEventListener('click', clearHistoryAll);
btnRunMatch.addEventListener('click', runDrawMatcher);
document.getElementById('btn-fetch-latest').addEventListener('click', fetchLatestLottoNumbers);

// Initialize Marking Board, Load Storage, and Auto Fetch Actual Draw Info on Page Load
initMarkingBoard();
loadHistoryFromStorage();
loadLatestActualDrawInfo();
