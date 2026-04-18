// ============================================================
//  Traffic Intersection Simulator — simulation.js
//  Mirrors the semaphore logic from your C files exactly:
//    signal = 0  →  NS Green / EW Red
//    signal = 1  →  EW Green / NS Red
//    PHASE_DURATION = 5000ms  (matches sleep(5) in controller.c)
// ============================================================

const roadCanvas = document.getElementById('road-canvas');
const animCanvas = document.getElementById('anim-canvas');
const rctx = roadCanvas.getContext('2d');
const ctx  = animCanvas.getContext('2d');

const W = 520, H = 520;
const CX = W / 2, CY = H / 2;
const LANE = 42;
const ROAD = LANE * 2;
const PHASE_DURATION = 5000; // ms — matches sleep(5) in controller.c

// ---- State (mirrors your C globals) ----
let signal     = 0;   // 0 = NS green, 1 = EW green  (mirrors current_signal)
let semaphore  = 1;   // mirrors semaphore in member1_semaphore.c
let phaseStart = Date.now();
let paused     = false;
let speedMult  = 1;
let vehicles   = [];
let vid        = 0;

// Per-direction counters
const counts = { North: 0, South: 0, East: 0, West: 0 };

// Colours per direction
const DIR_COLOR = {
  North: '#3ecf8e',
  South: '#ff6b81',
  East:  '#4da6ff',
  West:  '#ffa502'
};

const GREEN_COL = '#2ed573';
const RED_COL   = '#ff4757';

// ============================================================
//  Draw static road (called once)
// ============================================================
function drawRoad() {
  const r = rctx;
  r.clearRect(0, 0, W, H);

  // Background tarmac grid
  r.fillStyle = '#1a1d26';
  r.fillRect(0, 0, W, H);

  // Grass / city blocks
  const grassColor = '#1e2a1e';
  r.fillStyle = grassColor;
  r.fillRect(0,         0,         CX - ROAD/2, CY - ROAD/2);
  r.fillRect(CX+ROAD/2, 0,         W-(CX+ROAD/2), CY-ROAD/2);
  r.fillRect(0,         CY+ROAD/2, CX-ROAD/2,    H-(CY+ROAD/2));
  r.fillRect(CX+ROAD/2, CY+ROAD/2, W-(CX+ROAD/2), H-(CY+ROAD/2));

  // City block details (windows in buildings)
  drawBuildings(r);

  // Road surface
  r.fillStyle = '#2a2d38';
  r.fillRect(CX - ROAD/2, 0, ROAD, H);    // vertical road
  r.fillRect(0, CY - ROAD/2, W, ROAD);    // horizontal road

  // Intersection box (slightly lighter)
  r.fillStyle = '#323544';
  r.fillRect(CX - ROAD/2, CY - ROAD/2, ROAD, ROAD);

  // Yellow centre lines — vertical
  r.save();
  r.setLineDash([20, 14]);
  r.strokeStyle = '#c8a020';
  r.lineWidth = 1.5;
  r.beginPath();
  r.moveTo(CX, 0); r.lineTo(CX, CY - ROAD/2);
  r.stroke();
  r.beginPath();
  r.moveTo(CX, CY + ROAD/2); r.lineTo(CX, H);
  r.stroke();
  // Yellow centre lines — horizontal
  r.beginPath();
  r.moveTo(0, CY); r.lineTo(CX - ROAD/2, CY);
  r.stroke();
  r.beginPath();
  r.moveTo(CX + ROAD/2, CY); r.lineTo(W, CY);
  r.stroke();
  r.restore();

  // Stop lines
  const stopDist = ROAD/2 + 5;
  r.strokeStyle = '#ffffff';
  r.lineWidth = 3;
  r.beginPath(); r.moveTo(CX-ROAD/2, CY-stopDist); r.lineTo(CX+ROAD/2, CY-stopDist); r.stroke();
  r.beginPath(); r.moveTo(CX-ROAD/2, CY+stopDist); r.lineTo(CX+ROAD/2, CY+stopDist); r.stroke();
  r.beginPath(); r.moveTo(CX-stopDist, CY-ROAD/2); r.lineTo(CX-stopDist, CY+ROAD/2); r.stroke();
  r.beginPath(); r.moveTo(CX+stopDist, CY-ROAD/2); r.lineTo(CX+stopDist, CY+ROAD/2); r.stroke();

  // Zebra crossings
  drawZebra(r);

  // Lane arrows
  drawLaneArrows(r);
}

function drawBuildings(r) {
  const blocks = [
    [10, 10, CX-ROAD/2-20, CY-ROAD/2-20],
    [CX+ROAD/2+10, 10, W-(CX+ROAD/2+20), CY-ROAD/2-20],
    [10, CY+ROAD/2+10, CX-ROAD/2-20, H-(CY+ROAD/2+20)],
    [CX+ROAD/2+10, CY+ROAD/2+10, W-(CX+ROAD/2+20), H-(CY+ROAD/2+20)],
  ];
  for (const [bx, by, bw, bh] of blocks) {
    if (bw <= 0 || bh <= 0) continue;
    r.fillStyle = '#1a2218';
    r.fillRect(bx, by, bw, bh);
    // Windows
    r.fillStyle = 'rgba(255, 220, 100, 0.12)';
    for (let wx = bx+6; wx < bx+bw-6; wx += 10) {
      for (let wy = by+6; wy < by+bh-6; wy += 10) {
        if (Math.random() > 0.4) r.fillRect(wx, wy, 5, 4);
      }
    }
  }
}

function drawZebra(r) {
  const stopDist = ROAD/2 + 5;
  const stripeW = 4, stripeGap = 3;
  r.fillStyle = 'rgba(255,255,255,0.18)';
  // North crossing
  for (let i = 0; i < 5; i++) {
    r.fillRect(CX-ROAD/2+4, CY-stopDist-18 + i*(stripeW+stripeGap), ROAD-8, stripeW);
  }
  // South crossing
  for (let i = 0; i < 5; i++) {
    r.fillRect(CX-ROAD/2+4, CY+stopDist+3 + i*(stripeW+stripeGap), ROAD-8, stripeW);
  }
  // West crossing
  for (let i = 0; i < 5; i++) {
    r.fillRect(CX-stopDist-18 + i*(stripeW+stripeGap), CY-ROAD/2+4, stripeW, ROAD-8);
  }
  // East crossing
  for (let i = 0; i < 5; i++) {
    r.fillRect(CX+stopDist+3 + i*(stripeW+stripeGap), CY-ROAD/2+4, stripeW, ROAD-8);
  }
}

function drawLaneArrows(r) {
  r.fillStyle = 'rgba(255,255,255,0.15)';
  r.font = 'bold 16px sans-serif';
  r.textAlign = 'center';
  r.textBaseline = 'middle';
  // Incoming lanes — small arrows
  r.fillText('↑', CX + LANE/2, CY + ROAD/2 + 35);
  r.fillText('↓', CX - LANE/2, CY - ROAD/2 - 35);
  r.fillText('→', CX - ROAD/2 - 35, CY - LANE/2);
  r.fillText('←', CX + ROAD/2 + 35, CY + LANE/2);
}

// ============================================================
//  Traffic Light drawing (called every frame)
// ============================================================
function drawTrafficLight(x, y, isGreen, glowColor) {
  // Housing
  ctx.fillStyle = '#111318';
  ctx.beginPath();
  ctx.roundRect(x - 11, y - 30, 22, 58, 5);
  ctx.fill();
  ctx.strokeStyle = '#2a2f42';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Red bulb
  const redOn = !isGreen;
  ctx.beginPath();
  ctx.arc(x, y - 16, 8, 0, Math.PI * 2);
  ctx.fillStyle = redOn ? RED_COL : '#3a1010';
  ctx.fill();
  if (redOn) {
    ctx.shadowColor = RED_COL;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Green bulb
  const greenOn = isGreen;
  ctx.beginPath();
  ctx.arc(x, y + 16, 8, 0, Math.PI * 2);
  ctx.fillStyle = greenOn ? GREEN_COL : '#0a2a14';
  ctx.fill();
  if (greenOn) {
    ctx.shadowColor = GREEN_COL;
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawAllLights() {
  const nsGreen = signal === 0;
  const ewGreen = signal === 1;
  const S = ROAD/2 + 8;
  // NS lights (top-left and bottom-right of intersection)
  drawTrafficLight(CX - ROAD/2 - 20, CY - S,     nsGreen, GREEN_COL);
  drawTrafficLight(CX + ROAD/2 + 20, CY + S,     nsGreen, GREEN_COL);
  // EW lights (top-right and bottom-left of intersection)
  drawTrafficLight(CX + S,           CY - ROAD/2 - 20, ewGreen, GREEN_COL);
  drawTrafficLight(CX - S,           CY + ROAD/2 + 20, ewGreen, GREEN_COL);
}

// ============================================================
//  Vehicle spawning / logic
//  Mirrors: wait until your signal is green, then pass
// ============================================================
function spawnVehicle(dir) {
  const baseSpeed = (1.4 + Math.random() * 0.5) * speedMult;
  const jitter = (Math.random() - 0.5) * 8;
  let x, y, dx = 0, dy = 0;

  if (dir === 'North') { x = CX + LANE/2 + jitter; y = H + 14; dy = -baseSpeed; }
  else if (dir === 'South') { x = CX - LANE/2 + jitter; y = -14; dy = baseSpeed; }
  else if (dir === 'East')  { x = -14; y = CY - LANE/2 + jitter; dx = baseSpeed; }
  else                      { x = W + 14; y = CY + LANE/2 + jitter; dx = -baseSpeed; }

  vehicles.push({
    id: vid++, dir, x, y, dx, dy,
    color: DIR_COLOR[dir],
    size: 13 + Math.random() * 5,
    counted: false,
    stopped: false,
  });
}

function getStopLine(dir) {
  const S = ROAD/2 + 5;
  if (dir === 'North') return { axis: 'y', val: CY + S + 14, cmp: '>' };
  if (dir === 'South') return { axis: 'y', val: CY - S - 14, cmp: '<' };
  if (dir === 'East')  return { axis: 'x', val: CX - S - 14, cmp: '<' };
  if (dir === 'West')  return { axis: 'x', val: CX + S + 14, cmp: '>' };
}

function isApproachingStop(v) {
  const sl = getStopLine(v.dir);
  if (sl.axis === 'y') {
    const ahead = sl.cmp === '>' ? (v.y > sl.val && v.y < sl.val + 55)
                                 : (v.y < sl.val && v.y > sl.val - 55);
    return ahead;
  } else {
    const ahead = sl.cmp === '<' ? (v.x < sl.val && v.x > sl.val - 55)
                                 : (v.x > sl.val && v.x < sl.val + 55);
    return ahead;
  }
}

function updateVehicles() {
  for (const v of vehicles) {
    const nsDir = v.dir === 'North' || v.dir === 'South';
    const green = nsDir ? signal === 0 : signal === 1;

    // Semaphore wait — stop at red
    v.stopped = !green && isApproachingStop(v);

    if (!v.stopped) {
      v.x += v.dx;
      v.y += v.dy;
    }

    // Count vehicle when it crosses the centre
    if (!v.counted) {
      const inBox = Math.abs(v.x - CX) < ROAD/2 && Math.abs(v.y - CY) < ROAD/2;
      if (inBox) {
        v.counted = true;
        counts[v.dir]++;
        updateStats();
        addLog(v.dir);
      }
    }
  }
  // Remove off-screen
  vehicles = vehicles.filter(v => v.x > -60 && v.x < W+60 && v.y > -60 && v.y < H+60);
}

// ============================================================
//  Vehicle drawing
// ============================================================
function drawVehicle(v) {
  ctx.save();
  ctx.translate(v.x, v.y);
  ctx.rotate(Math.atan2(v.dy, v.dx));

  const W2 = v.size, H2 = v.size * 0.55;

  // Car body
  ctx.fillStyle = v.color;
  ctx.beginPath();
  ctx.roundRect(-W2/2, -H2/2, W2, H2, 3);
  ctx.fill();

  // Roof / cab
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.roundRect(-W2*0.12, -H2/2, W2*0.42, H2*0.8, 2);
  ctx.fill();

  // Windshield glare
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(-W2*0.1, -H2*0.38, W2*0.38, H2*0.34);

  // Headlights
  ctx.fillStyle = v.stopped ? '#888' : '#ffffcc';
  ctx.fillRect(W2*0.44, -H2*0.34, 3, 3);
  ctx.fillRect(W2*0.44,  H2*0.10, 3, 3);

  // Tail lights
  ctx.fillStyle = '#ff4757';
  ctx.fillRect(-W2*0.5, -H2*0.34, 3, 3);
  ctx.fillRect(-W2*0.5,  H2*0.10, 3, 3);

  ctx.restore();
}

// ============================================================
//  Spawn scheduler
// ============================================================
const lastSpawn = { North: 0, South: 0, East: 0, West: 0 };
const SPAWN_INTERVAL = 1600;

function maybeSpawn() {
  const now = Date.now();
  const dirs = ['North', 'South', 'East', 'West'];
  for (const d of dirs) {
    const nsDir = d === 'North' || d === 'South';
    const green = nsDir ? signal === 0 : signal === 1;
    if (!green) continue;
    if (now - lastSpawn[d] < SPAWN_INTERVAL / speedMult) continue;
    const existing = vehicles.filter(v => v.dir === d).length;
    if (existing >= 3) continue;
    spawnVehicle(d);
    lastSpawn[d] = now;
  }
}

// ============================================================
//  Phase / signal control — mirrors traffic_controller()
// ============================================================
function updatePhase() {
  const elapsed = Date.now() - phaseStart;
  const pct = Math.min(elapsed / PHASE_DURATION, 1);

  // Countdown
  const remaining = Math.max(0, (PHASE_DURATION - elapsed) / 1000);
  document.getElementById('countdown').textContent = remaining.toFixed(1) + 's';

  // Progress bar
  const fill = document.getElementById('phase-fill');
  fill.style.width = ((1 - pct) * 100) + '%';
  fill.style.background = signal === 0 ? GREEN_COL : '#4da6ff';

  // Switch signal after PHASE_DURATION — mirrors switch_signal()
  if (pct >= 1) {
    signal = 1 - signal;
    phaseStart = Date.now();
    updateSignalUI();
    addLog(null, 'SIGNAL SWITCH → ' + (signal === 0 ? 'NS GREEN' : 'EW GREEN'));
  }
}

function updateSignalUI() {
  const nsGreen = signal === 0;
  const pill = document.getElementById('signal-pill');
  pill.textContent = nsGreen ? 'NS GREEN' : 'EW GREEN';
  pill.className = 'status-pill' + (nsGreen ? '' : ' ew-active');

  // NS lights
  document.getElementById('ns-red').className   = 'bulb red'   + (nsGreen ? '' : ' on');
  document.getElementById('ns-green').className = 'bulb green' + (nsGreen ? ' on' : '');
  document.getElementById('ns-state').textContent = nsGreen ? 'GREEN' : 'RED';
  document.getElementById('ns-state').className = 'phase-state ' + (nsGreen ? 'green-txt' : 'red-txt');
  document.getElementById('ns-phase-row').className = 'phase-row' + (nsGreen ? ' active-phase' : '');

  // EW lights
  const ewGreen = !nsGreen;
  document.getElementById('ew-red').className   = 'bulb red'   + (ewGreen ? '' : ' on');
  document.getElementById('ew-green').className = 'bulb green' + (ewGreen ? ' on' : '');
  document.getElementById('ew-state').textContent = ewGreen ? 'GREEN' : 'RED';
  document.getElementById('ew-state').className = 'phase-state ' + (ewGreen ? 'green-txt' : 'red-txt');
  document.getElementById('ew-phase-row').className = 'phase-row' + (ewGreen ? ' active-phase' : '');
}

// ============================================================
//  Stats UI
// ============================================================
function updateStats() {
  document.getElementById('stat-north').textContent = counts.North;
  document.getElementById('stat-south').textContent = counts.South;
  document.getElementById('stat-east').textContent  = counts.East;
  document.getElementById('stat-west').textContent  = counts.West;
  const total = counts.North + counts.South + counts.East + counts.West;
  document.getElementById('stat-total').textContent = total;

  const ns = counts.North + counts.South;
  const ew = counts.East + counts.West;
  const tot = ns + ew || 1;
  document.getElementById('balance-ns').style.width = (ns / tot * 100) + '%';
  document.getElementById('balance-ew').style.width = (ew / tot * 100) + '%';
}

// ============================================================
//  Event log
// ============================================================
const LOG_COLORS = { North: 'ns', South: 'ns', East: 'ew', West: 'ew' };
function addLog(dir, msg) {
  const list = document.getElementById('log-list');
  const now = new Date();
  const ts = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
  const entry = document.createElement('div');
  entry.className = 'log-entry ' + (dir ? LOG_COLORS[dir] : 'sig');
  entry.textContent = `[${ts}] ${msg || dir + ' vehicle passed'}`;
  list.prepend(entry);
  // Keep only last 30 entries
  while (list.children.length > 30) list.removeChild(list.lastChild);
}

// ============================================================
//  Controls
// ============================================================
function togglePause() {
  paused = !paused;
  const btn = document.getElementById('btn-pause');
  btn.textContent = paused ? '▶ Resume' : '⏸ Pause';
  btn.className = 'ctrl-btn' + (paused ? ' active' : '');
}

let speedIdx = 0;
const SPEEDS = [1, 2, 4];
const SPEED_LABELS = ['Normal', 'Fast', 'Turbo'];

function cycleSpeed() {
  speedIdx = (speedIdx + 1) % 3;
  speedMult = SPEEDS[speedIdx];
  document.getElementById('btn-speed').textContent = '▶ ' + SPEED_LABELS[speedIdx];
  // Update speed dots
  for (let i = 0; i < 3; i++) {
    document.getElementById('spd' + i).className = 'speed-dot' + (i <= speedIdx ? ' active' : '');
  }
  // Update vehicle speeds
  for (const v of vehicles) {
    const base = 1.4 + Math.random() * 0.5;
    if (v.dy !== 0) v.dy = (v.dy < 0 ? -1 : 1) * base * speedMult;
    if (v.dx !== 0) v.dx = (v.dx < 0 ? -1 : 1) * base * speedMult;
  }
}

function resetSim() {
  vehicles = [];
  counts.North = counts.South = counts.East = counts.West = 0;
  signal = 0;
  phaseStart = Date.now();
  updateStats();
  updateSignalUI();
  document.getElementById('log-list').innerHTML = '';
  addLog(null, 'Simulation reset');
}

// ============================================================
//  Main animation loop
// ============================================================
function loop() {
  if (!paused) {
    updatePhase();
    maybeSpawn();
    updateVehicles();
  }

  ctx.clearRect(0, 0, W, H);
  drawAllLights();
  for (const v of vehicles) drawVehicle(v);

  requestAnimationFrame(loop);
}

// ============================================================
//  Init
// ============================================================
drawRoad();
updateSignalUI();
addLog(null, 'Simulation started');
loop();
