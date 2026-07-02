import { useEffect, useRef, useState, useCallback } from "react";

// ─── Quotes DCTECH ───
const QUOTES = [
  { text: '"Subindo colinas como subo pull requests."', author: "— Denis" },
  { text: '"Meu deploy é mais suave que essa descida."', author: "— Denis" },
  { text: '"Java no backend, física no frontend."', author: "— Denis" },
  { text: '"Cada curva é um requisito novo do cliente."', author: "— Denis" },
  { text: '"Sem combustível, sem sistema. Simples assim."', author: "— Denis" },
  { text: '"React renderiza mais rápido que esse carro."', author: "— Denis" },
  { text: '"Supabase aguenta mais impacto que essa capotagem."', author: "— Denis" },
  { text: '"Vercel no ar em segundos. O carro, nem tanto."', author: "— Denis" },
  { text: '"24h de resposta. O combustível não espera."', author: "— Denis" },
  { text: '"Sob medida, igual os sistemas que entrego."', author: "— Denis" },
];

// ─── Terrain generation ───
const SEGMENT = 6;        // pixels por segmento de terreno
const TERRAIN_LEN = 600;  // segmentos pré-gerados à frente

function generateTerrain(startX, count, seed) {
  const pts = [];
  let y = 160;
  let angle = 0;
  for (let i = 0; i < count; i++) {
    angle += (Math.sin((startX + i * SEGMENT) * 0.008 + seed) * 0.04 +
              Math.sin((startX + i * SEGMENT) * 0.003 + seed * 1.7) * 0.03);
    angle = Math.clamp ? Math.clamp(angle, -0.18, 0.18) : Math.max(-0.18, Math.min(0.18, angle));
    y += Math.sin(angle) * SEGMENT;
    y = Math.max(80, Math.min(220, y));
    pts.push({ x: startX + i * SEGMENT, y });
  }
  return pts;
}

function getTerrainY(terrain, worldX) {
  // binary-ish lookup
  const idx = Math.floor((worldX - terrain[0].x) / SEGMENT);
  if (idx < 0) return terrain[0].y;
  if (idx >= terrain.length - 1) return terrain[terrain.length - 1].y;
  const t = (worldX - terrain[idx].x) / SEGMENT;
  return terrain[idx].y + (terrain[idx + 1].y - terrain[idx].y) * t;
}

function getTerrainAngle(terrain, worldX) {
  const idx = Math.floor((worldX - terrain[0].x) / SEGMENT);
  const i = Math.max(0, Math.min(idx, terrain.length - 2));
  const dx = terrain[i + 1].x - terrain[i].x;
  const dy = terrain[i + 1].y - terrain[i].y;
  return Math.atan2(dy, dx);
}

const CANVAS_W = 720;
const CANVAS_H = 240;
const FUEL_MAX = 100;
const CAR_W = 52;
const CAR_H = 22;
const WHEEL_R = 11;
const AXLE_FRONT = 18;
const AXLE_REAR = -18;

export default function DcBugRun() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem("dchillclimb_high") || "0"); }
    catch { return 0; }
  });
  const [fuel, setFuel] = useState(FUEL_MAX);
  const [gameState, setGameState] = useState("menu");
  const [playerName, setPlayerName] = useState("");
  const [ranking, setRanking] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dchillclimb_ranking") || "[]"); }
    catch { return []; }
  });
  const [quoteVisible, setQuoteVisible] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [gameOverReason, setGameOverReason] = useState(""); // "fuel" | "flip"

  const keysRef = useRef({ gas: false, brake: false });

  const gameRef = useRef({
    running: false,
    animId: null,
    lastQuoteIdx: -1,
    // car physics
    car: {
      x: 120,        // world X of car center
      vx: 0,
      angle: 0,      // car body angle
      angularV: 0,
      fuel: FUEL_MAX,
      flipped: false,
    },
    camera: 120,     // world X that maps to CANVAS_W/2 - 160
    terrain: [],
    terrainEnd: 0,
    dist: 0,
    frame: 0,
    score: 0,
    seed: Math.random() * 100,
    // coins
    coins: [],
    particles: [],
    stars: Array.from({ length: 35 }, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * 100,
      r: Math.random() * 1.4 + 0.3,
      opacity: Math.random() * 0.4 + 0.15,
    })),
  });

  const highScoreRef = useRef(highScore);
  useEffect(() => { highScoreRef.current = highScore; }, [highScore]);

  // ─── Ranking ───
  const addToRanking = useCallback((name, scoreVal) => {
    const newEntry = { name: name.trim() || "Anônimo", score: scoreVal, date: new Date().toISOString() };
    setRanking(prev => {
      const updated = [...prev, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
      try { localStorage.setItem("dchillclimb_ranking", JSON.stringify(updated)); }
      catch {}
      return updated;
    });
  }, []);

  // ─── Quote ───
  const showQuote = useCallback(() => {
    const g = gameRef.current;
    let idx;
    do { idx = Math.floor(Math.random() * QUOTES.length); }
    while (idx === g.lastQuoteIdx && QUOTES.length > 1);
    g.lastQuoteIdx = idx;
    const q = QUOTES[idx];
    setQuoteText(`${q.text} ${q.author}`);
    setQuoteVisible(true);
    setTimeout(() => setQuoteVisible(false), 4000);
  }, []);

  // ─── Game Over ───
  const gameOver = useCallback((reason) => {
    const g = gameRef.current;
    g.running = false;
    cancelAnimationFrame(g.animId);
    const finalScore = Math.floor(g.dist / 10);
    g.score = finalScore;
    setScore(finalScore);
    setGameOverReason(reason);
    setGameState("gameover");
    if (finalScore > highScoreRef.current) {
      setHighScore(finalScore);
      try { localStorage.setItem("dchillclimb_high", finalScore.toString()); }
      catch {}
    }
    const msg = reason === "fuel"
      ? '"Sem combustível. Até sistemas precisam de energia." — Denis'
      : '"Capotou. Bugs acontecem. O importante é refatorar." — Denis';
    setQuoteText(msg);
    setQuoteVisible(true);
  }, []);

  // ─── Draw ───
  const drawScene = useCallback((ctx, canvas) => {
    const g = gameRef.current;
    const car = g.car;
    const camX = car.x - 160; // world X at left edge of canvas

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#060d1f");
    sky.addColorStop(1, "#0d1f3c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars (parallax 0.2)
    g.stars.forEach(s => {
      const sx = ((s.x - camX * 0.2) % canvas.width + canvas.width) % canvas.width;
      ctx.globalAlpha = s.opacity;
      ctx.fillStyle = "#93c5fd";
      ctx.beginPath();
      ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Terrain fill
    const terrain = g.terrain;
    if (terrain.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(terrain[0].x - camX, canvas.height);
    terrain.forEach(p => ctx.lineTo(p.x - camX, p.y));
    ctx.lineTo(terrain[terrain.length - 1].x - camX, canvas.height);
    ctx.closePath();
    const terrGrad = ctx.createLinearGradient(0, 80, 0, canvas.height);
    terrGrad.addColorStop(0, "#1e3a5f");
    terrGrad.addColorStop(0.3, "#0f2540");
    terrGrad.addColorStop(1, "#07131f");
    ctx.fillStyle = terrGrad;
    ctx.fill();

    // Terrain line
    ctx.beginPath();
    terrain.forEach((p, i) => {
      const sx = p.x - camX;
      if (i === 0) ctx.moveTo(sx, p.y);
      else ctx.lineTo(sx, p.y);
    });
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Coins
    g.coins.forEach(c => {
      if (c.collected) return;
      const sx = c.x - camX;
      if (sx < -20 || sx > canvas.width + 20) return;
      ctx.save();
      ctx.translate(sx, c.y);
      ctx.fillStyle = "#fbbf24";
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff8";
      ctx.font = "bold 8px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("$", 0, 0.5);
      ctx.restore();
    });

    // Particles
    g.particles = g.particles.filter(p => p.life > 0);
    g.particles.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life--;
    });
    ctx.globalAlpha = 1;

    // ─── Car ───
    const scrX = car.x - camX;
    const groundY = getTerrainY(terrain, car.x);
    const carY = groundY - WHEEL_R - CAR_H / 2 - 4;

    ctx.save();
    ctx.translate(scrX, carY);
    ctx.rotate(car.angle);

    // Exhaust smoke when braking
    if (keysRef.current.brake && g.running) {
      for (let i = 0; i < 1; i++) {
        g.particles.push({
          x: car.x - AXLE_REAR - 8,
          y: carY + 4,
          vx: -1.5 - Math.random(),
          vy: -0.5 + (Math.random() - 0.5),
          r: 3 + Math.random() * 2,
          color: "#94a3b8",
          life: 18, maxLife: 18,
        });
      }
    }

    // Car body
    ctx.fillStyle = "#1d4ed8";
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-CAR_W / 2, -CAR_H / 2, CAR_W, CAR_H, 5);
    ctx.fill();
    ctx.stroke();

    // Cabin
    ctx.fillStyle = "#2563eb";
    ctx.beginPath();
    ctx.roundRect(-8, -CAR_H / 2 - 12, 22, 14, [4, 4, 0, 0]);
    ctx.fill();

    // Windows
    ctx.fillStyle = "rgba(147,197,253,0.35)";
    ctx.beginPath();
    ctx.roundRect(-6, -CAR_H / 2 - 10, 18, 10, 3);
    ctx.fill();

    // Headlight
    ctx.fillStyle = "#fef08a";
    ctx.shadowColor = "#fef08a";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(CAR_W / 2 - 4, 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Exhaust pipe
    ctx.fillStyle = "#475569";
    ctx.fillRect(-CAR_W / 2 - 6, 5, 8, 4);

    ctx.restore();

    // Wheels
    [AXLE_FRONT, AXLE_REAR].forEach(ax => {
      const wx = car.x + ax * Math.cos(car.angle);
      const wBase = getTerrainY(terrain, wx);
      const wsx = wx - camX;
      const wsy = wBase - WHEEL_R;

      ctx.save();
      ctx.translate(wsx, wsy);

      // Wheel shadow
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(0, WHEEL_R + 2, WHEEL_R * 0.8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Tire
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, WHEEL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rim
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.arc(0, 0, WHEEL_R * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Spoke
      ctx.strokeStyle = "#93c5fd";
      ctx.lineWidth = 1.5;
      const rot = (g.frame * (car.vx > 0 ? 0.1 : -0.1)) % (Math.PI * 2);
      for (let s = 0; s < 4; s++) {
        const a = rot + s * Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * WHEEL_R * 0.48, Math.sin(a) * WHEEL_R * 0.48);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Fuel bar (in-canvas HUD)
    const fuelPct = car.fuel / FUEL_MAX;
    const barW = 100, barH = 8, barX = 10, barY = 10;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 4);
    ctx.fill();
    const fuelColor = fuelPct > 0.4 ? "#22c55e" : fuelPct > 0.2 ? "#f59e0b" : "#ef4444";
    ctx.fillStyle = fuelColor;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * fuelPct, barH, 4);
    ctx.fill();
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "left";
    ctx.fillText("⛽", barX, barY + 20);

    // Distance HUD
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.roundRect(canvas.width - 90, 8, 82, 20, 5);
    ctx.fill();
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${Math.floor(g.dist / 10)}m`, canvas.width - 12, 22);

    // Gas/Brake indicators
    if (g.running) {
      ["⚡ GAS", "🛑 FREIO"].forEach((label, i) => {
        const active = i === 0 ? keysRef.current.gas : keysRef.current.brake;
        ctx.globalAlpha = active ? 1 : 0.3;
        ctx.fillStyle = active ? (i === 0 ? "#34d399" : "#f87171") : "#64748b";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = i === 0 ? "left" : "right";
        ctx.fillText(label, i === 0 ? 12 : canvas.width - 12, canvas.height - 8);
        ctx.globalAlpha = 1;
      });
    }
  }, []);

  // ─── Update physics ───
  const updatePhysics = useCallback(() => {
    const g = gameRef.current;
    if (!g.running) return;
    const car = g.car;
    const terrain = g.terrain;
    g.frame++;

    const terrAngle = getTerrainAngle(terrain, car.x);
    const gas = keysRef.current.gas;
    const brake = keysRef.current.brake;

    // Acceleration
    const maxSpeed = 6;
    if (gas) {
      car.vx += Math.cos(terrAngle) * 0.18;
      car.fuel -= 0.08;
    }
    if (brake) {
      car.vx -= 0.25;
    }

    // Gravity component along slope
    car.vx += Math.sin(terrAngle) * (-0.12);

    // Friction
    car.vx *= 0.985;
    car.vx = Math.max(-2, Math.min(maxSpeed, car.vx));

    car.x += car.vx;
    if (car.x < 80) { car.x = 80; car.vx = 0; }

    // Car body angle follows terrain smoothly
    const targetAngle = terrAngle;
    car.angle += (targetAngle - car.angle) * 0.12;

    // Flip detection
    if (Math.abs(car.angle) > 1.1) {
      gameOver("flip");
      return;
    }

    // Fuel
    car.fuel = Math.max(0, car.fuel);
    setFuel(car.fuel);
    if (car.fuel <= 0) {
      gameOver("fuel");
      return;
    }

    // Distance & score
    g.dist = Math.max(g.dist, car.x - 120);
    const newScore = Math.floor(g.dist / 10);
    if (newScore !== g.score) {
      g.score = newScore;
      setScore(newScore);
      if (newScore > 0 && newScore % 50 === 0) showQuote();
    }

    // Extend terrain
    if (car.x + CANVAS_W > g.terrainEnd - SEGMENT * 10) {
      const extra = generateTerrain(g.terrainEnd, 200, g.seed);
      g.terrain = [...g.terrain.slice(-200), ...extra];
      g.terrainEnd = g.terrain[g.terrain.length - 1].x;

      // Spawn coins on new terrain
      extra.filter((_, i) => i % 18 === 8).forEach(p => {
        g.coins.push({ x: p.x, y: p.y - 28, collected: false });
      });
    }

    // Remove off-screen terrain & coins
    g.terrain = g.terrain.filter(p => p.x > car.x - CANVAS_W);
    g.coins = g.coins.filter(c => c.x > car.x - CANVAS_W);

    // Coin collection
    g.coins.forEach(c => {
      if (c.collected) return;
      if (Math.abs(c.x - car.x) < 20 && Math.abs(c.y - (getTerrainY(terrain, car.x) - WHEEL_R - CAR_H / 2)) < 30) {
        c.collected = true;
        car.fuel = Math.min(FUEL_MAX, car.fuel + 8);
        for (let i = 0; i < 8; i++) {
          g.particles.push({
            x: c.x, y: c.y,
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 2 - 1,
            r: 2 + Math.random() * 2,
            color: "#fbbf24",
            life: 20, maxLife: 20,
          });
        }
      }
    });
  }, [showQuote, gameOver]);

  // ─── Game loop ───
  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const g = gameRef.current;

    updatePhysics();
    drawScene(ctx, canvas);

    if (g.running) {
      g.animId = requestAnimationFrame(loop);
    }
  }, [updatePhysics, drawScene]);

  // ─── Start game ───
  const startGame = useCallback(() => {
    const g = gameRef.current;
    const seed = Math.random() * 100;
    g.seed = seed;
    const terrain = generateTerrain(0, TERRAIN_LEN, seed);
    g.terrain = terrain;
    g.terrainEnd = terrain[terrain.length - 1].x;
    g.car = { x: 120, vx: 0, angle: 0, angularV: 0, fuel: FUEL_MAX, flipped: false };
    g.dist = 0;
    g.score = 0;
    g.frame = 0;
    g.coins = terrain.filter((_, i) => i % 18 === 8).map(p => ({ x: p.x, y: p.y - 28, collected: false }));
    g.particles = [];
    g.running = true;
    setScore(0);
    setFuel(FUEL_MAX);
    setGameState("playing");
    setQuoteVisible(false);
    setTimeout(() => showQuote(), 800);
    g.animId = requestAnimationFrame(loop);
  }, [showQuote, loop]);

  const handleStart = useCallback(() => {
    if (gameState === "gameover" && playerName.trim()) {
      addToRanking(playerName, score);
    }
    setPlayerName("");
    startGame();
  }, [gameState, playerName, score, addToRanking, startGame]);

  // ─── Controls ───
  useEffect(() => {
    const onDown = (e) => {
      if (e.code === "ArrowRight" || e.code === "KeyD") keysRef.current.gas = true;
      if (e.code === "ArrowLeft"  || e.code === "KeyA") keysRef.current.brake = true;
      if ((e.code === "Space" || e.code === "Enter") && gameState !== "playing") {
        e.preventDefault();
        if (gameState === "gameover" && document.activeElement?.id === "hill-name-input") return;
        handleStart();
      }
    };
    const onUp = (e) => {
      if (e.code === "ArrowRight" || e.code === "KeyD") keysRef.current.gas = false;
      if (e.code === "ArrowLeft"  || e.code === "KeyA") keysRef.current.brake = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, [gameState, handleStart]);

  // ─── Initial draw ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const g = gameRef.current;
    const terrain = generateTerrain(0, TERRAIN_LEN, g.seed);
    g.terrain = terrain;
    g.terrainEnd = terrain[terrain.length - 1].x;
    g.coins = terrain.filter((_, i) => i % 18 === 8).map(p => ({ x: p.x, y: p.y - 28, collected: false }));
    drawScene(ctx, canvas);
  }, [drawScene]);

  useEffect(() => () => { cancelAnimationFrame(gameRef.current.animId); }, []);

  // ─── Touch buttons ───
  const gasStart  = useCallback(() => { keysRef.current.gas   = true;  }, []);
  const gasEnd    = useCallback(() => { keysRef.current.gas   = false; }, []);
  const brakeStart= useCallback(() => { keysRef.current.brake = true;  }, []);
  const brakeEnd  = useCallback(() => { keysRef.current.brake = false; }, []);

  const fuelPct = fuel / FUEL_MAX;

  return (
    <section className="dc-bugrun">
      <div className="container">
        <div className="bugrun-card">

          {/* Header */}
          <div className="bugrun-header">
            <div className="bugrun-title">
              <span>🚗</span> DC HILL CLIMB
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Fuel HUD */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>⛽</span>
                <div style={{ width: 60, height: 6, background: "rgba(100,116,139,0.3)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    width: `${fuelPct * 100}%`, height: "100%", borderRadius: 3,
                    background: fuelPct > 0.4 ? "#22c55e" : fuelPct > 0.2 ? "#f59e0b" : "#ef4444",
                    transition: "width 0.3s, background 0.3s",
                  }} />
                </div>
              </div>
              <span className="bugrun-score">{score.toString().padStart(4, "0")}m</span>
              <span className="bugrun-rec">REC: {highScore.toString().padStart(4, "0")}m</span>
            </div>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="bugrun-canvas"
            style={{ height: CANVAS_H }}
          />

          {/* Touch controls */}
          {gameState === "playing" && (
            <div style={{
              display: "flex", justifyContent: "space-between",
              padding: "8px 16px", background: "rgba(0,0,0,0.3)",
              borderTop: "1px solid rgba(59,130,246,0.1)",
            }}>
              <button
                onTouchStart={(e) => { e.preventDefault(); brakeStart(); }}
                onTouchEnd={(e) => { e.preventDefault(); brakeEnd(); }}
                onMouseDown={brakeStart} onMouseUp={brakeEnd} onMouseLeave={brakeEnd}
                style={{
                  background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 10, padding: "10px 28px", color: "#f87171",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", userSelect: "none",
                }}
              >◀ FREIO</button>
              <button
                onTouchStart={(e) => { e.preventDefault(); gasStart(); }}
                onTouchEnd={(e) => { e.preventDefault(); gasEnd(); }}
                onMouseDown={gasStart} onMouseUp={gasEnd} onMouseLeave={gasEnd}
                style={{
                  background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: 10, padding: "10px 28px", color: "#34d399",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", userSelect: "none",
                }}
              >GÁS ▶</button>
            </div>
          )}

          {/* Overlay */}
          {gameState !== "playing" && (
            <div className="bugrun-overlay">
              <div className="bugrun-overlay-title">
                {gameState === "menu" ? "🚗 DC Hill Climb" : gameOverReason === "fuel" ? "⛽ Sem combustível!" : "💥 Capotou!"}
              </div>
              <div className="bugrun-overlay-sub">
                {gameState === "menu" ? (
                  <>Acelere morro acima e colete moedas para reabastecer!<br />
                  Use ← Freio e → Gás (ou os botões na tela)</>
                ) : (
                  <>
                    Distância: <strong>{score}m</strong> | Recorde: <strong>{highScore}m</strong><br />
                    {score >= highScore && score > 0 ? <span className="bugrun-newrec">🎉 Novo recorde!</span> : null}
                  </>
                )}
              </div>

              {gameState === "gameover" && (
                <div className="bugrun-namearea">
                  <label>Qual seu primeiro nome?</label>
                  <input
                    id="hill-name-input"
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={15}
                    placeholder="ex: João"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              <button className="bugrun-btn" onClick={handleStart}>
                {gameState === "menu" ? "▶ Jogar" : "↻ Tentar de novo"}
              </button>
              <div className="bugrun-hint">← Freio &nbsp;|&nbsp; → Gás &nbsp;|&nbsp; Moedas = combustível</div>
            </div>
          )}

          {/* Quote bar */}
          <div className="bugrun-quotebar">
            <div className={`bugrun-quote ${quoteVisible ? "visible" : ""}`}>
              {quoteText}
            </div>
          </div>

          {/* Ranking */}
          <div className="bugrun-ranking">
            <div className="bugrun-ranking-title">🏆 TOP 10 HILL CLIMBERS</div>
            <ul className="bugrun-ranking-list">
              {ranking.length === 0 ? (
                <li className="bugrun-ranking-empty">Ninguém jogou ainda. Seja o primeiro! 🚗</li>
              ) : (
                ranking.map((entry, i) => (
                  <li key={i} className={`bugrun-ranking-item rank-${i + 1}`}>
                    <span className={`bugrun-rank-pos ${i < 3 ? `pos-${i + 1}` : ""}`}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </span>
                    <span className="bugrun-rank-name">{entry.name}</span>
                    <span className="bugrun-rank-score">{entry.score}m</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Footer */}
          <div className="bugrun-footer">
            <span>DCTECH — SOLUÇÕES EM SISTEMAS</span>
            <a href="#contato">Precisa de um dev? →</a>
          </div>
        </div>
      </div>
    </section>
  );
}
