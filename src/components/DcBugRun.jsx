import { useEffect, useRef, useState, useCallback } from "react";

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

const SEGMENT = 6;
const TERRAIN_LEN = 600;

function getDifficultyMultiplier(dist) {
  const meters = dist / 10;
  return Math.min(1 + meters * 0.003, 3.5);
}

function generateTerrain(startX, count, seed, dist = 0) {
  const pts = [];
  let y = 160;
  let angle = 0;
  const diff = getDifficultyMultiplier(dist);
  const amp1 = 0.04 * diff;
  const amp2 = 0.03 * diff;
  const maxAngle = 0.18 * Math.min(diff, 2.2);
  for (let i = 0; i < count; i++) {
    const worldX = startX + i * SEGMENT;
    const localDist = worldX - 120;
    const localDiff = getDifficultyMultiplier(localDist);
    angle += (Math.sin(worldX * 0.008 + seed) * amp1 * localDiff +
              Math.sin(worldX * 0.003 + seed * 1.7) * amp2 * localDiff);
    angle = Math.max(-maxAngle * localDiff, Math.min(maxAngle * localDiff, angle));
    y += Math.sin(angle) * SEGMENT;
    y = Math.max(60, Math.min(240, y));
    pts.push({ x: worldX, y });
  }
  return pts;
}

function getTerrainY(terrain, worldX) {
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
const CANVAS_H = 280;
const FUEL_MAX = 100;
const CAR_W = 58;
const CAR_H = 24;
const WHEEL_R = 13;
const AXLE_FRONT = 20;
const AXLE_REAR = -20;

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
  const [gameOverReason, setGameOverReason] = useState("");
  const [comboCount, setComboCount] = useState(0);
  const [boostActive, setBoostActive] = useState(false);

  const keysRef = useRef({ gas: false, brake: false, jump: false, jumpPressed: false });

  const gameRef = useRef({
    running: false,
    animId: null,
    lastQuoteIdx: -1,
    car: { x: 120, vx: 0, angle: 0, angularV: 0, fuel: FUEL_MAX, flipped: false, vy: 0, airborne: false, yOffset: 0 },
    camera: 120,
    terrain: [],
    terrainEnd: 0,
    dist: 0,
    frame: 0,
    score: 0,
    seed: Math.random() * 100,
    coins: [],
    particles: [],
    rocks: [],
    boostZones: [],
    clouds: Array.from({ length: 8 }, () => ({
      x: Math.random() * CANVAS_W * 2,
      y: Math.random() * 60 + 10,
      w: 60 + Math.random() * 80,
      h: 20 + Math.random() * 15,
      speed: 0.1 + Math.random() * 0.2,
      opacity: 0.08 + Math.random() * 0.12,
    })),
    stars: Array.from({ length: 50 }, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * 120,
      r: Math.random() * 1.8 + 0.2,
      opacity: Math.random() * 0.5 + 0.15,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.02 + Math.random() * 0.03,
    })),
    mountains: Array.from({ length: 5 }, (_, i) => ({
      x: i * 200 - 100,
      w: 180 + Math.random() * 120,
      h: 60 + Math.random() * 50,
      color: `rgba(15, 30, 55, ${0.3 + Math.random() * 0.2})`,
    })),
    wind: { active: false, force: 0, timer: 0, duration: 0, dir: 1 },
    deathWall: { x: -200, speed: 0.3, active: false },
    combo: { count: 0, lastJumpTime: 0, inCombo: false },
    playerSkill: { avgScore: 0, gamesPlayed: 0, bestScores: [] },
  });

  const highScoreRef = useRef(highScore);
  useEffect(() => { highScoreRef.current = highScore; }, [highScore]);

  useEffect(() => {
    try {
      const skillData = localStorage.getItem("dchillclimb_skill");
      if (skillData) gameRef.current.playerSkill = JSON.parse(skillData);
    } catch {}
  }, []);

  const addToRanking = useCallback((name, scoreVal) => {
    const newEntry = { name: name.trim() || "Anonimo", score: scoreVal, date: new Date().toISOString() };
    setRanking(prev => {
      const updated = [...prev, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
      try { localStorage.setItem("dchillclimb_ranking", JSON.stringify(updated)); } catch {}
      return updated;
    });
    const skill = gameRef.current.playerSkill;
    skill.gamesPlayed++;
    skill.bestScores.push(scoreVal);
    skill.bestScores = skill.bestScores.slice(-20);
    skill.avgScore = skill.bestScores.reduce((a, b) => a + b, 0) / skill.bestScores.length;
    try { localStorage.setItem("dchillclimb_skill", JSON.stringify(skill)); } catch {}
  }, []);

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

  const gameOver = useCallback((reason) => {
    const g = gameRef.current;
    g.running = false;
    cancelAnimationFrame(g.animId);
    const finalScore = Math.floor(g.dist / 10);
    g.score = finalScore;
    setScore(finalScore);
    setGameOverReason(reason);
    setGameState("gameover");
    setBoostActive(false);
    setComboCount(0);
    if (finalScore > highScoreRef.current) {
      setHighScore(finalScore);
      try { localStorage.setItem("dchillclimb_high", finalScore.toString()); } catch {}
    }
    const msg = reason === "fuel" ? '"Sem combustivel. Ate sistemas precisam de energia." — Denis'
      : reason === "flip" ? '"Capotou. Bugs acontecem. O importante e refatorar." — Denis'
      : reason === "rock" ? '"Bateu numa pedra. Sempre teste antes do deploy." — Denis'
      : reason === "deathwall" ? '"O tempo nao espera nem dev." — Denis'
      : '"Fim da linha. Hora de commitar." — Denis';
    setQuoteText(msg);
    setQuoteVisible(true);
  }, []);
    const drawScene = useCallback((ctx, canvas) => {
    const g = gameRef.current;
    const car = g.car;
    const camX = car.x - 160;

    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#030712");
    sky.addColorStop(0.3, "#0a1628");
    sky.addColorStop(0.7, "#0f2540");
    sky.addColorStop(1, "#1a3a5c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.shadowColor = "rgba(255,255,255,0.3)";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(canvas.width - 80, 45, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(200,200,210,0.3)";
    ctx.beginPath();
    ctx.arc(canvas.width - 75, 40, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(canvas.width - 85, 50, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    g.stars.forEach(s => {
      const twinkle = Math.sin(g.frame * s.twinkleSpeed + s.twinkle) * 0.3 + 0.7;
      const sx = ((s.x - camX * 0.1) % canvas.width + canvas.width) % canvas.width;
      ctx.globalAlpha = s.opacity * twinkle;
      ctx.fillStyle = "#b8d4f0";
      ctx.beginPath();
      ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 1.2) {
        ctx.globalAlpha = s.opacity * twinkle * 0.3;
        ctx.fillStyle = "#93c5fd";
        ctx.beginPath();
        ctx.arc(sx, s.y, s.r * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    g.mountains.forEach(m => {
      const mx = ((m.x - camX * 0.05) % (canvas.width + 400) + (canvas.width + 400)) % (canvas.width + 400) - 200;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.moveTo(mx - m.w / 2, canvas.height);
      ctx.lineTo(mx, canvas.height - m.h);
      ctx.lineTo(mx + m.w / 2, canvas.height);
      ctx.closePath();
      ctx.fill();
    });

    g.clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x < -c.w) c.x = canvas.width + c.w;
      const cx = c.x - camX * 0.15;
      ctx.globalAlpha = c.opacity;
      ctx.fillStyle = "#1e3a5f";
      ctx.beginPath();
      ctx.ellipse(cx, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx - c.w * 0.2, c.y + 2, c.w * 0.35, c.h * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + c.w * 0.2, c.y + 2, c.w * 0.35, c.h * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (g.wind.active) {
      const windAlpha = 0.15 + Math.sin(g.frame * 0.1) * 0.1;
      ctx.globalAlpha = windAlpha;
      ctx.strokeStyle = g.wind.dir > 0 ? "#60a5fa" : "#f87171";
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const wy = 40 + i * 35;
        const wx = (g.frame * 2 + i * 80) % (canvas.width + 100) - 50;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + g.wind.dir * 40, wy);
        ctx.lineTo(wx + g.wind.dir * 30, wy - 5);
        ctx.moveTo(wx + g.wind.dir * 40, wy);
        ctx.lineTo(wx + g.wind.dir * 30, wy + 5);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    const terrain = g.terrain;
    if (terrain.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(terrain[0].x - camX, canvas.height);
    terrain.forEach(p => ctx.lineTo(p.x - camX, p.y));
    ctx.lineTo(terrain[terrain.length - 1].x - camX, canvas.height);
    ctx.closePath();
    const terrGrad = ctx.createLinearGradient(0, 60, 0, canvas.height);
    terrGrad.addColorStop(0, "#1e3a5f");
    terrGrad.addColorStop(0.2, "#162d4a");
    terrGrad.addColorStop(0.5, "#0f2540");
    terrGrad.addColorStop(1, "#050d18");
    ctx.fillStyle = terrGrad;
    ctx.fill();

    ctx.beginPath();
    terrain.forEach((p, i) => {
      const sx = p.x - camX;
      if (i === 0) ctx.moveTo(sx, p.y);
      else ctx.lineTo(sx, p.y);
    });
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#3b82f6";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    terrain.forEach((p, i) => {
      const sx = p.x - camX;
      if (i === 0) ctx.moveTo(sx, p.y + 3);
      else ctx.lineTo(sx, p.y + 3);
    });
    ctx.strokeStyle = "rgba(59, 130, 246, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "rgba(100, 149, 237, 0.08)";
    for (let tx = Math.floor(camX / 30) * 30; tx < camX + canvas.width + 30; tx += 30) {
      const ty = getTerrainY(terrain, tx);
      if (ty < canvas.height - 5) {
        ctx.beginPath();
        ctx.arc(tx - camX, ty + 8 + Math.sin(tx * 0.1) * 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    g.boostZones.forEach(bz => {
      if (bz.x < camX - 50 || bz.x > camX + canvas.width + 50) return;
      const bx = bz.x - camX;
      const by = getTerrainY(terrain, bz.x) - 45;
      ctx.save();
      ctx.globalAlpha = 0.4 + Math.sin(g.frame * 0.08) * 0.2;
      ctx.fillStyle = "#f59e0b";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(bx, by - 12);
      ctx.lineTo(bx + 10, by + 8);
      ctx.lineTo(bx - 3, by + 3);
      ctx.lineTo(bx - 3, by + 12);
      ctx.lineTo(bx - 10, by - 3);
      ctx.lineTo(bx + 3, by - 3);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 9px Arial";
      ctx.textAlign = "center";
      ctx.fillText("BOOST", bx, by + 28);
      ctx.restore();
    });

    g.rocks.forEach(r => {
      if (r.x < camX - 50 || r.x > camX + canvas.width + 50) return;
      const rx = r.x - camX;
      const ry = getTerrainY(terrain, r.x) - r.h / 2;
      ctx.save();
      ctx.fillStyle = "#475569";
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx - r.w / 2, ry + r.h / 2);
      ctx.lineTo(rx - r.w / 4, ry - r.h / 2);
      ctx.lineTo(rx + r.w / 4, ry - r.h / 3);
      ctx.lineTo(rx + r.w / 2, ry + r.h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(148, 163, 184, 0.2)";
      ctx.beginPath();
      ctx.moveTo(rx - r.w / 4, ry - r.h / 2);
      ctx.lineTo(rx + r.w / 4, ry - r.h / 3);
      ctx.lineTo(rx, ry + r.h / 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    if (g.deathWall.active) {
      const dwX = g.deathWall.x - camX;
      if (dwX > -100 && dwX < canvas.width) {
        ctx.save();
        ctx.globalAlpha = 0.6 + Math.sin(g.frame * 0.15) * 0.3;
        const dwGrad = ctx.createLinearGradient(dwX, 0, dwX + 40, 0);
        dwGrad.addColorStop(0, "rgba(239, 68, 68, 0)");
        dwGrad.addColorStop(0.5, "rgba(239, 68, 68, 0.4)");
        dwGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
        ctx.fillStyle = dwGrad;
        ctx.fillRect(dwX, 0, 40, canvas.height);
        ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
        for (let sy = (g.frame * 2) % 20 - 20; sy < canvas.height; sy += 20) {
          ctx.fillRect(dwX + 5, sy, 8, 10);
          ctx.fillRect(dwX + 22, sy + 10, 8, 10);
        }
        ctx.restore();
      }
    }

    g.coins.forEach(c => {
      if (c.collected) return;
      const sx = c.x - camX;
      if (sx < -20 || sx > canvas.width + 20) return;
      const blinkSpeed = c.blinkSpeed || 1;
      const blinkPhase = Math.sin(g.frame * blinkSpeed);
      if (blinkPhase < -0.3) return;
      ctx.save();
      ctx.translate(sx, c.y);
      const isGood = c.type === "good";
      const glowColor = isGood ? "#22c55e" : "#ef4444";
      const bodyColor = isGood ? "#22c55e" : "#ef4444";
      const highlightColor = isGood ? "#86efac" : "#fca5a5";
      const textColor = isGood ? "#14532d" : "#7f1d1d";
      const moveOffset = c.moving ? Math.sin(g.frame * 0.05 + c.movePhase) * 15 : 0;
      ctx.translate(0, moveOffset);
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = isGood ? "#16a34a" : "#dc2626";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = highlightColor;
      ctx.beginPath();
      ctx.arc(-2, -2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = textColor;
      ctx.font = "bold 8px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("DC", 0, 0.5);
      ctx.restore();
    });

    if (g.combo.inCombo && g.combo.count > 1) {
      const comboX = car.x - camX;
      const groundY = getTerrainY(terrain, car.x);
      const carBaseY = groundY - WHEEL_R - CAR_H / 2 - 4;
      const comboY = carBaseY - CAR_H - 20 - g.combo.count * 3;
      ctx.save();
      ctx.globalAlpha = 0.8 + Math.sin(g.frame * 0.2) * 0.2;
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 10;
      ctx.fillText(`COMBO x${g.combo.count}!`, comboX, comboY);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

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

    const scrX = car.x - camX;
    const groundY = getTerrainY(terrain, car.x);
    const carBaseY = groundY - WHEEL_R - CAR_H / 2 - 4;
    const carY = carBaseY - car.yOffset;

    ctx.save();
    ctx.translate(scrX, carY);
    ctx.rotate(car.angle);

    if (car.airborne && car.vy < 0) {
      for (let i = 0; i < 3; i++) {
        g.particles.push({
          x: car.x + (Math.random() - 0.5) * 20,
          y: carBaseY + 10,
          vx: (Math.random() - 0.5) * 1,
          vy: -0.5 - Math.random(),
          r: 2 + Math.random() * 2,
          color: "rgba(148, 163, 184, 0.5)",
          life: 12, maxLife: 12,
        });
      }
    }

    if (keysRef.current.brake && g.running) {
      for (let i = 0; i < 2; i++) {
        g.particles.push({
          x: car.x - AXLE_REAR - 10,
          y: carBaseY + 2,
          vx: -2 - Math.random() * 1.5,
          vy: -0.8 + (Math.random() - 0.5) * 0.5,
          r: 3 + Math.random() * 3,
          color: `rgba(148, 163, 184, ${0.4 + Math.random() * 0.3})`,
          life: 22, maxLife: 22,
        });
      }
    }

    if (car.vx > 4 && g.running) {
      for (let i = 0; i < 2; i++) {
        g.particles.push({
          x: car.x + CAR_W / 2 + Math.random() * 20,
          y: carBaseY + (Math.random() - 0.5) * 15,
          vx: -3 - Math.random() * 2,
          vy: 0,
          r: 0.8,
          color: "rgba(147, 197, 253, 0.3)",
          life: 8, maxLife: 8,
        });
      }
    }

    if (boostActive) {
      for (let i = 0; i < 4; i++) {
        g.particles.push({
          x: car.x - CAR_W / 2 - Math.random() * 10,
          y: carBaseY + (Math.random() - 0.5) * 10,
          vx: -4 - Math.random() * 3,
          vy: (Math.random() - 0.5) * 2,
          r: 2 + Math.random() * 2,
          color: `rgba(251, 191, 36, ${0.5 + Math.random() * 0.5})`,
          life: 10, maxLife: 10,
        });
      }
    }

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(0, CAR_H / 2 + 8, CAR_W * 0.55, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#1e40af";
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-CAR_W / 2, -CAR_H / 2, CAR_W, CAR_H, [3, 6, 6, 3]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(59, 130, 246, 0.25)";
    ctx.beginPath();
    ctx.roundRect(-CAR_W / 2 + 2, -CAR_H / 2 + 1, CAR_W - 4, CAR_H / 3, [2, 4, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#1d4ed8";
    ctx.beginPath();
    ctx.roundRect(-6, -CAR_H / 2 - 14, 26, 16, [5, 5, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "rgba(147, 197, 253, 0.4)";
    ctx.beginPath();
    ctx.roundRect(-4, -CAR_H / 2 - 12, 22, 11, 3);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.roundRect(-4, -CAR_H / 2 - 12, 14, 5, [3, 3, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#fef08a";
    ctx.shadowColor = "#fef08a";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(CAR_W / 2 - 3, 3, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.moveTo(CAR_W / 2 - 1, 3);
    ctx.lineTo(CAR_W / 2 + 80, -15);
    ctx.lineTo(CAR_W / 2 + 80, 21);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#ef4444";
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(-CAR_W / 2 + 2, 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#475569";
    ctx.fillRect(-CAR_W / 2 - 7, 6, 9, 5);
    ctx.fillStyle = "#334155";
    ctx.fillRect(-CAR_W / 2 - 7, 6, 9, 2);

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "bold 7px Arial";
    ctx.textAlign = "center";
    ctx.fillText("DC", 0, 2);

    ctx.restore();

    [AXLE_FRONT, AXLE_REAR].forEach(ax => {
      const wx = car.x + ax * Math.cos(car.angle);
      const wBase = getTerrainY(terrain, wx);
      const wsx = wx - camX;
      const wsy = wBase - WHEEL_R;

      ctx.save();
      ctx.translate(wsx, wsy);

      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(0, WHEEL_R + 3, WHEEL_R * 0.75, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, WHEEL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      const treadRot = (g.frame * (car.vx > 0 ? 0.15 : -0.15)) % (Math.PI * 2);
      for (let t = 0; t < 8; t++) {
        const a = treadRot + t * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (WHEEL_R - 2), Math.sin(a) * (WHEEL_R - 2));
        ctx.lineTo(Math.cos(a) * WHEEL_R, Math.sin(a) * WHEEL_R);
        ctx.stroke();
      }

      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(0, 0, WHEEL_R * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.arc(0, 0, WHEEL_R * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#93c5fd";
      ctx.lineWidth = 2;
      const rot = (g.frame * (car.vx > 0 ? 0.15 : -0.15)) % (Math.PI * 2);
      for (let s = 0; s < 5; s++) {
        const a = rot + s * Math.PI * 2 / 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * WHEEL_R * 0.48, Math.sin(a) * WHEEL_R * 0.48);
        ctx.stroke();
      }

      ctx.fillStyle = "#1e40af";
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    const fuelPct = car.fuel / FUEL_MAX;
    const barW = 120, barH = 10, barX = 14, barY = 14;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 6);
    ctx.fill();
    ctx.fillStyle = "rgba(30, 41, 59, 0.8)";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 5);
    ctx.fill();
    const fuelColor = fuelPct > 0.4 ? "#22c55e" : fuelPct > 0.2 ? "#f59e0b" : "#ef4444";
    ctx.fillStyle = fuelColor;
    ctx.shadowColor = fuelColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * fuelPct, barH, 5);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "left";
    ctx.fillText("⛽", barX, barY + 24);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Arial";
    ctx.fillText(`${Math.round(fuelPct * 100)}%`, barX + 20, barY + 24);

    const diffLevel = getDifficultyMultiplier(g.dist);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.roundRect(14, 44, 80, 18, 6);
    ctx.fill();
    ctx.fillStyle = diffLevel > 2.5 ? "#ef4444" : diffLevel > 1.8 ? "#f59e0b" : "#60a5fa";
    ctx.font = "10px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`DIF: ${diffLevel.toFixed(1)}x`, 20, 56);

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.roundRect(canvas.width - 110, 10, 100, 26, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(59, 130, 246, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${Math.floor(g.dist / 10)}m`, canvas.width - 16, 28);

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.roundRect(canvas.width - 110, 42, 100, 20, 6);
    ctx.fill();
    ctx.fillStyle = "#60a5fa";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    const speed = Math.abs(car.vx).toFixed(1);
    ctx.fillText(`${speed} km/h`, canvas.width - 16, 56);

    if (g.wind.active) {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.roundRect(canvas.width - 110, 68, 100, 18, 6);
      ctx.fill();
      ctx.fillStyle = g.wind.dir > 0 ? "#60a5fa" : "#f87171";
      ctx.font = "10px Arial";
      ctx.textAlign = "right";
      const windDir = g.wind.dir > 0 ? "→" : "←";
      ctx.fillText(`VENTO ${windDir} ${Math.abs(g.wind.force).toFixed(1)}`, canvas.width - 16, 80);
    }

    if (g.deathWall.active) {
      const distToWall = car.x - g.deathWall.x;
      if (distToWall < 300) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`⚠ PERIGO ATRAS! ${Math.floor(distToWall)}m`, canvas.width / 2, 30);
      }
    }

    if (g.running) {
      ctx.font = "bold 10px Arial";
      ["⚡ GAS", "🛑 FREIO", "⬆ PULAR"].forEach((label, i) => {
        const active = i === 0 ? keysRef.current.gas : i === 1 ? keysRef.current.brake : keysRef.current.jump;
        ctx.globalAlpha = active ? 1 : 0.35;
        ctx.fillStyle = active
          ? (i === 0 ? "#34d399" : i === 1 ? "#f87171" : "#60a5fa")
          : "#64748b";
        const xPos = i === 0 ? 14 : i === 1 ? canvas.width / 2 : canvas.width - 14;
        ctx.textAlign = i === 0 ? "left" : i === 2 ? "right" : "center";
        ctx.fillText(label, xPos, canvas.height - 10);
        ctx.globalAlpha = 1;
      });
    }
  }, []);
  const updatePhysics = useCallback(() => {
    const g = gameRef.current;
    if (!g.running) return;
    const car = g.car;
    const terrain = g.terrain;
    g.frame++;

    const terrAngle = getTerrainAngle(terrain, car.x);
    const gas = keysRef.current.gas;
    const brake = keysRef.current.brake;
    const jump = keysRef.current.jump;
    const jumpPressed = keysRef.current.jumpPressed;
    const diff = getDifficultyMultiplier(g.dist);

    const skill = g.playerSkill;
    let adaptiveBoost = 1;
    if (skill.gamesPlayed > 5 && skill.avgScore > 200) {
      adaptiveBoost = 1 + Math.min((skill.avgScore - 200) / 1000, 0.5);
    }
    const effectiveDiff = diff * adaptiveBoost;

    if (!g.wind.active && Math.random() < 0.002 * effectiveDiff) {
      g.wind.active = true;
      g.wind.force = (0.3 + Math.random() * 0.7) * effectiveDiff;
      g.wind.dir = Math.random() > 0.5 ? 1 : -1;
      g.wind.duration = 120 + Math.random() * 180;
      g.wind.timer = 0;
    }
    if (g.wind.active) {
      g.wind.timer++;
      car.angle += g.wind.force * g.wind.dir * 0.008;
      car.vx += g.wind.force * g.wind.dir * 0.02;
      if (g.wind.timer >= g.wind.duration) {
        g.wind.active = false;
      }
    }

    if (g.dist / 10 > 50 && !g.deathWall.active) {
      g.deathWall.active = true;
      g.deathWall.x = car.x - 300;
    }
    if (g.deathWall.active) {
      g.deathWall.speed = 0.3 + (effectiveDiff - 1) * 0.15;
      g.deathWall.x += g.deathWall.speed;
      if (g.deathWall.x > car.x - 30) {
        gameOver("deathwall");
        return;
      }
    }

    if (jump && !jumpPressed && !car.airborne && car.vx > 0.5) {
      car.vy = -6;
      car.airborne = true;
      keysRef.current.jumpPressed = true;
      const now = Date.now();
      if (g.combo.inCombo && now - g.combo.lastJumpTime < 2000) {
        g.combo.count++;
        setComboCount(g.combo.count);
      } else {
        g.combo.count = 1;
        g.combo.inCombo = true;
        setComboCount(1);
      }
      g.combo.lastJumpTime = now;
      for (let i = 0; i < 10; i++) {
        g.particles.push({
          x: car.x + (Math.random() - 0.5) * 30,
          y: getTerrainY(terrain, car.x),
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 2 - 0.5,
          r: 2 + Math.random() * 2,
          color: "rgba(148, 163, 184, 0.6)",
          life: 15, maxLife: 15,
        });
      }
    }
    if (!jump) {
      keysRef.current.jumpPressed = false;
    }

    if (car.airborne) {
      car.vy += 0.25;
      car.yOffset -= car.vy;
      const groundY = getTerrainY(terrain, car.x);
      const carBaseY = groundY - WHEEL_R - CAR_H / 2 - 4;
      if (car.yOffset <= 0) {
        car.yOffset = 0;
        car.vy = 0;
        car.airborne = false;
        if (g.combo.count > 1) {
          const landingAngle = Math.abs(car.angle);
          if (landingAngle < 0.4) {
            const bonus = Math.min(g.combo.count * 3, 15);
            car.fuel = Math.min(FUEL_MAX, car.fuel + bonus);
          } else if (landingAngle > 0.7) {
            car.fuel = Math.max(0, car.fuel - 5);
          }
        }
        g.combo.inCombo = false;
        g.combo.count = 0;
        setComboCount(0);
        for (let i = 0; i < 6; i++) {
          g.particles.push({
            x: car.x + (Math.random() - 0.5) * 20,
            y: groundY,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 1.5,
            r: 2 + Math.random(),
            color: "rgba(100, 116, 139, 0.5)",
            life: 10, maxLife: 10,
          });
        }
      }
    }

    const maxSpeed = 7;
    const steepnessPenalty = Math.abs(terrAngle) > 0.1 ? 1 + Math.abs(terrAngle) * 3 : 1;
    const fuelConsumptionRate = 0.12 * effectiveDiff * steepnessPenalty;
    
    if (gas) {
      car.vx += Math.cos(terrAngle) * 0.2;
      car.fuel -= fuelConsumptionRate;
    }
    if (brake) {
      car.vx -= 0.3;
    }

    let inBoostZone = false;
    g.boostZones.forEach(bz => {
      if (car.x > bz.x - 20 && car.x < bz.x + 20 && car.airborne) {
        inBoostZone = true;
        car.vx += 0.4;
        car.fuel -= 0.25;
      }
    });
    setBoostActive(inBoostZone);

    if (!car.airborne) {
      car.vx += Math.sin(terrAngle) * (-0.14);
    }

    car.vx *= 0.982;
    car.vx = Math.max(-2.5, Math.min(maxSpeed, car.vx));

    car.x += car.vx;
    if (car.x < 80) { car.x = 80; car.vx = 0; }

    if (!car.airborne) {
      const targetAngle = terrAngle;
      car.angle += (targetAngle - car.angle) * 0.14;
    } else {
      car.angle += car.vx * 0.008;
      car.angle = Math.max(-0.8, Math.min(0.8, car.angle));
    }

    if (Math.abs(car.angle) > 1.15 && !car.airborne) {
      gameOver("flip");
      return;
    }

    car.fuel = Math.max(0, car.fuel);
    setFuel(car.fuel);
    if (car.fuel <= 0 && !car.airborne) {
      gameOver("fuel");
      return;
    }

    const carScreenY = getTerrainY(terrain, car.x) - WHEEL_R - CAR_H / 2 - 4 - car.yOffset;
    g.rocks.forEach(r => {
      if (r.x < car.x - 30 || r.x > car.x + 30) return;
      const dx = Math.abs(r.x - car.x);
      const dy = Math.abs((getTerrainY(terrain, r.x) - r.h / 2) - carScreenY);
      if (dx < r.w / 2 + CAR_W / 3 && dy < r.h / 2 + CAR_H / 2) {
        if (car.yOffset < r.h + 10) {
          gameOver("rock");
        }
      }
    });

    g.dist = Math.max(g.dist, car.x - 120);
    const newScore = Math.floor(g.dist / 10);
    if (newScore !== g.score) {
      g.score = newScore;
      setScore(newScore);
      if (newScore > 0 && newScore % 50 === 0) showQuote();
    }

    if (car.x + CANVAS_W > g.terrainEnd - SEGMENT * 10) {
      const extra = generateTerrain(g.terrainEnd, 200, g.seed, g.dist);
      g.terrain = [...g.terrain.slice(-200), ...extra];
      g.terrainEnd = g.terrain[g.terrain.length - 1].x;
      
      extra.forEach((p, i) => {
        if (i % 18 === 8) {
          const isElevated = Math.random() > 0.35;
          const badCoinChance = Math.min(0.3 + (effectiveDiff - 1) * 0.15, 0.7);
          const coinType = Math.random() > badCoinChance ? "good" : "bad";
          const isMoving = Math.random() > 0.7;
          g.coins.push({
            x: p.x,
            y: isElevated ? p.y - 55 : p.y - 32,
            collected: false,
            type: coinType,
            elevated: isElevated,
            moving: isMoving,
            movePhase: Math.random() * Math.PI * 2,
            blinkSpeed: 0.03 + Math.random() * 0.04,
          });
        }
      });
      
      extra.forEach((p, i) => {
        if (i % 45 === 20 && Math.random() < Math.min(0.4 + (effectiveDiff - 1) * 0.2, 0.8)) {
          g.rocks.push({
            x: p.x,
            w: 18 + Math.random() * 14,
            h: 14 + Math.random() * 12,
          });
        }
      });
      
      extra.forEach((p, i) => {
        if (i % 80 === 40 && Math.random() < 0.5) {
          g.boostZones.push({ x: p.x, active: true });
        }
      });
    }

    g.terrain = g.terrain.filter(p => p.x > car.x - CANVAS_W);
    g.coins = g.coins.filter(c => c.x > car.x - CANVAS_W);
    g.rocks = g.rocks.filter(r => r.x > car.x - CANVAS_W);
    g.boostZones = g.boostZones.filter(bz => bz.x > car.x - CANVAS_W);

    g.coins.forEach(c => {
      if (c.collected) return;
      const coinY = c.y + (c.moving ? Math.sin(g.frame * 0.05 + c.movePhase) * 15 : 0);
      const dx = Math.abs(c.x - car.x);
      const dy = Math.abs(coinY - carScreenY);
      if (dx < 24 && dy < 30) {
        c.collected = true;
        const isGood = c.type === "good";
        const fuelChange = isGood ? 12 : -15;
        car.fuel = Math.max(0, Math.min(FUEL_MAX, car.fuel + fuelChange));
        const particleColor = isGood ? "#22c55e" : "#ef4444";
        for (let i = 0; i < 12; i++) {
          g.particles.push({
            x: c.x, y: coinY,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 3 - 1,
            r: 2 + Math.random() * 2.5,
            color: particleColor,
            life: 25, maxLife: 25,
          });
        }
      }
    });
  }, [showQuote, gameOver]);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    updatePhysics();
    drawScene(ctx, canvas);
    if (gameRef.current.running) {
      gameRef.current.animId = requestAnimationFrame(loop);
    }
  }, [updatePhysics, drawScene]);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    const seed = Math.random() * 100;
    g.seed = seed;
    const terrain = generateTerrain(0, TERRAIN_LEN, seed);
    g.terrain = terrain;
    g.terrainEnd = terrain[terrain.length - 1].x;
    g.car = { x: 120, vx: 0, angle: 0, angularV: 0, fuel: FUEL_MAX, flipped: false, vy: 0, airborne: false, yOffset: 0 };
    g.dist = 0;
    g.score = 0;
    g.frame = 0;
    g.wind = { active: false, force: 0, timer: 0, duration: 0, dir: 1 };
    g.deathWall = { x: -200, speed: 0.3, active: false };
    g.combo = { count: 0, lastJumpTime: 0, inCombo: false };
    
    g.coins = [];
    terrain.forEach((p, i) => {
      if (i % 18 === 8) {
        const isElevated = Math.random() > 0.5;
        const coinType = Math.random() > 0.7 ? "good" : "bad";
        const isMoving = Math.random() > 0.7;
        g.coins.push({
          x: p.x,
          y: isElevated ? p.y - 55 : p.y - 32,
          collected: false,
          type: coinType,
          elevated: isElevated,
          moving: isMoving,
          movePhase: Math.random() * Math.PI * 2,
          blinkSpeed: 0.03 + Math.random() * 0.04,
        });
      }
    });
    
    g.rocks = [];
    g.boostZones = [];
    g.particles = [];
    g.running = true;
    setScore(0);
    setFuel(FUEL_MAX);
    setGameState("playing");
    setQuoteVisible(false);
    setComboCount(0);
    setBoostActive(false);
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

  useEffect(() => {
    const onDown = (e) => {
      if (e.code === "ArrowRight" || e.code === "KeyD") keysRef.current.gas = true;
      if (e.code === "ArrowLeft" || e.code === "KeyA") keysRef.current.brake = true;
      if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") {
        keysRef.current.jump = true;
      }
      if ((e.code === "Space" || e.code === "Enter") && gameState !== "playing") {
        e.preventDefault();
        if (gameState === "gameover" && document.activeElement?.id === "hill-name-input") return;
        handleStart();
      }
    };
    const onUp = (e) => {
      if (e.code === "ArrowRight" || e.code === "KeyD") keysRef.current.gas = false;
      if (e.code === "ArrowLeft" || e.code === "KeyA") keysRef.current.brake = false;
      if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") {
        keysRef.current.jump = false;
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, [gameState, handleStart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const g = gameRef.current;
    const terrain = generateTerrain(0, TERRAIN_LEN, g.seed);
    g.terrain = terrain;
    g.terrainEnd = terrain[terrain.length - 1].x;
    g.coins = terrain.filter((_, i) => i % 18 === 8).map((p, idx) => ({
      x: p.x,
      y: Math.random() > 0.5 ? p.y - 55 : p.y - 32,
      collected: false,
      type: Math.random() > 0.7 ? "good" : "bad",
      elevated: Math.random() > 0.5,
      moving: Math.random() > 0.7,
      movePhase: idx,
      blinkSpeed: 0.03 + Math.random() * 0.04,
    }));
    g.rocks = [];
    g.boostZones = [];
    drawScene(ctx, canvas);
  }, [drawScene]);

  useEffect(() => () => { cancelAnimationFrame(gameRef.current.animId); }, []);

  const gasStart  = useCallback(() => { keysRef.current.gas = true; }, []);
  const gasEnd    = useCallback(() => { keysRef.current.gas = false; }, []);
  const brakeStart= useCallback(() => { keysRef.current.brake = true; }, []);
  const brakeEnd  = useCallback(() => { keysRef.current.brake = false; }, []);
  const jumpStart = useCallback(() => { keysRef.current.jump = true; }, []);
  const jumpEnd   = useCallback(() => { keysRef.current.jump = false; keysRef.current.jumpPressed = false; }, []);

  const fuelPct = fuel / FUEL_MAX;

  return (
    <section className="dc-bugrun">
      <style>{`
        .dc-bugrun {
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 20px 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .dc-bugrun .container {
          width: 100%;
          max-width: 740px;
          padding: 0 10px;
        }
        .bugrun-card {
          background: linear-gradient(145deg, #0a0f1a 0%, #0d1525 50%, #0a1220 100%);
          border-radius: 20px;
          border: 1px solid rgba(59, 130, 246, 0.15);
          box-shadow: 0 0 60px rgba(59, 130, 246, 0.08), 0 8px 32px rgba(0,0,0,0.4);
          overflow: hidden;
        }
        .bugrun-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 22px;
          background: linear-gradient(90deg, rgba(30,64,175,0.15) 0%, transparent 100%);
          border-bottom: 1px solid rgba(59, 130, 246, 0.1);
        }
        .bugrun-title {
          font-size: 18px;
          font-weight: 800;
          color: #e2e8f0;
          letter-spacing: 1.5px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .bugrun-title span { font-size: 22px; }
        .bugrun-score {
          font-size: 15px;
          font-weight: 700;
          color: #34d399;
          font-family: monospace;
          background: rgba(52, 211, 153, 0.1);
          padding: 4px 12px;
          border-radius: 8px;
          border: 1px solid rgba(52, 211, 153, 0.2);
        }
        .bugrun-rec {
          font-size: 12px;
          color: #94a3b8;
          font-family: monospace;
        }
        .bugrun-canvas {
          display: block;
          width: 100%;
          aspect-ratio: 720 / 280;
          background: #060d1f;
          border-bottom: 1px solid rgba(59, 130, 246, 0.1);
        }
        .canvas-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
        }
        .bugrun-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(3, 7, 18, 0.92);
          backdrop-filter: blur(8px);
          z-index: 10;
          padding: 14px 18px;
          text-align: center;
          animation: fadeIn 0.4s ease;
          overflow-y: auto;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .bugrun-overlay-title {
          font-size: 24px;
          font-weight: 800;
          color: #f8fafc;
          margin-bottom: 6px;
          text-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
        }
        .bugrun-overlay-sub {
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 18px;
          max-width: 420px;
        }
        .bugrun-overlay-sub strong {
          color: #34d399;
          font-size: 16px;
        }
        .bugrun-newrec {
          display: inline-block;
          background: linear-gradient(90deg, #fbbf24, #f59e0b);
          color: #1a1a1a;
          font-weight: 700;
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 13px;
          margin-top: 8px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .bugrun-namearea {
          margin-bottom: 14px;
          width: 100%;
          max-width: 280px;
        }
        .bugrun-namearea label {
          display: block;
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 6px;
          text-align: left;
        }
        .bugrun-namearea input {
          width: 100%;
          padding: 10px 14px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 10px;
          color: #e2e8f0;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .bugrun-namearea input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
        .bugrun-btn {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          border: none;
          padding: 12px 34px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
          letter-spacing: 0.5px;
        }
        .bugrun-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 28px rgba(37, 99, 235, 0.4);
        }
        .bugrun-btn:active {
          transform: translateY(0);
        }
        .bugrun-hint {
          margin-top: 12px;
          font-size: 10px;
          color: #64748b;
        }
        @media (max-width: 480px) {
          .bugrun-overlay { padding: 10px 14px; }
          .bugrun-overlay-title { font-size: 19px; margin-bottom: 4px; }
          .bugrun-overlay-sub { font-size: 11px; margin-bottom: 12px; line-height: 1.45; }
          .bugrun-overlay-sub strong { font-size: 14px; }
          .bugrun-btn { padding: 9px 26px; font-size: 13px; }
          .bugrun-hint { margin-top: 8px; font-size: 9px; }
          .bugrun-namearea { margin-bottom: 10px; }
          .bugrun-namearea input { padding: 8px 12px; font-size: 13px; }
        }
        .bugrun-quotebar {
          padding: 10px 22px;
          background: rgba(30, 64, 175, 0.06);
          border-top: 1px solid rgba(59, 130, 246, 0.08);
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bugrun-quote {
          font-size: 13px;
          color: #93c5fd;
          font-style: italic;
          text-align: center;
          opacity: 0;
          transform: translateY(6px);
          transition: all 0.5s ease;
          max-width: 600px;
        }
        .bugrun-quote.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .bugrun-ranking {
          padding: 18px 22px;
          background: rgba(6, 13, 31, 0.5);
        }
        .bugrun-ranking-title {
          font-size: 13px;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 12px;
          letter-spacing: 1px;
        }
        .bugrun-ranking-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .bugrun-ranking-empty {
          color: #64748b;
          font-size: 13px;
          text-align: center;
          padding: 12px;
        }
        .bugrun-ranking-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 4px;
          font-size: 13px;
          transition: background 0.2s;
        }
        .bugrun-ranking-item:hover {
          background: rgba(59, 130, 246, 0.06);
        }
        .bugrun-rank-pos {
          width: 32px;
          font-size: 14px;
        }
        .bugrun-rank-pos.pos-1 { color: #fbbf24; }
        .bugrun-rank-pos.pos-2 { color: #cbd5e1; }
        .bugrun-rank-pos.pos-3 { color: #fb923c; }
        .bugrun-rank-name {
          flex: 1;
          color: #e2e8f0;
          font-weight: 500;
        }
        .bugrun-rank-score {
          color: #34d399;
          font-weight: 700;
          font-family: monospace;
        }
        .bugrun-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 22px;
          background: rgba(6, 13, 31, 0.8);
          border-top: 1px solid rgba(59, 130, 246, 0.08);
          font-size: 11px;
          color: #475569;
        }
        .bugrun-footer a {
          color: #3b82f6;
          text-decoration: none;
          transition: color 0.2s;
        }
        .bugrun-footer a:hover {
          color: #60a5fa;
        }
        .touch-controls {
          display: flex;
          justify-content: space-between;
          padding: 10px 16px;
          background: rgba(0,0,0,0.35);
          border-top: 1px solid rgba(59,130,246,0.08);
          gap: 8px;
        }
        .touch-btn {
          flex: 1;
          border-radius: 12px;
          padding: 14px 20px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          user-select: none;
          transition: all 0.15s;
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .touch-btn:active {
          transform: scale(0.96);
        }
        .touch-btn-brake {
          background: rgba(239,68,68,0.12);
          border-color: rgba(239,68,68,0.25);
          color: #f87171;
        }
        .touch-btn-brake:active {
          background: rgba(239,68,68,0.25);
        }
        .touch-btn-jump {
          background: rgba(96,165,250,0.12);
          border-color: rgba(96,165,250,0.25);
          color: #60a5fa;
          max-width: 80px;
        }
        .touch-btn-jump:active {
          background: rgba(96,165,250,0.25);
        }
        .touch-btn-gas {
          background: rgba(34,197,94,0.12);
          border-color: rgba(34,197,94,0.25);
          color: #34d399;
        }
        .touch-btn-gas:active {
          background: rgba(34,197,94,0.25);
        }
        .coin-legend {
          display: flex;
          justify-content: center;
          gap: 20px;
          padding: 8px 22px;
          background: rgba(6, 13, 31, 0.5);
          border-top: 1px solid rgba(59, 130, 246, 0.06);
          font-size: 11px;
        }
        .coin-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #94a3b8;
        }
        .coin-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .coin-dot.good { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
        .coin-dot.bad { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
        .boost-legend {
          display: flex;
          justify-content: center;
          gap: 20px;
          padding: 6px 22px;
          background: rgba(6, 13, 31, 0.3);
          border-top: 1px solid rgba(59, 130, 246, 0.04);
          font-size: 11px;
        }
        .boost-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #94a3b8;
        }
        .boost-icon {
          color: #f59e0b;
          font-size: 12px;
        }
      `}</style>

      <div className="container">
        <div className="bugrun-card">

          <div className="bugrun-header">
            <div className="bugrun-title">
              <span>🚗</span> DC HILL CLIMB
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>⛽</span>
                <div style={{ width: 60, height: 6, background: "rgba(100,116,139,0.25)", borderRadius: 3, overflow: "hidden" }}>
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

          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="bugrun-canvas"
            />
            {gameState !== "playing" && (
              <div className="bugrun-overlay">
                <div className="bugrun-overlay-title">
                  {gameState === "menu" ? "🚗 DC Hill Climb" : gameOverReason === "fuel" ? "⛽ Sem combustivel!" : gameOverReason === "rock" ? "💥 Bateu numa pedra!" : gameOverReason === "deathwall" ? "⏰ O tempo te alcancou!" : "💥 Capotou!"}
                </div>
                <div className="bugrun-overlay-sub">
                  {gameState === "menu" ? (
                    <>Acelere morro acima, colete moedas e pule nos picos!<br />
                    🟢 Moeda verde = +combustivel | 🔴 Moeda vermelha = -combustivel<br />
                    🪨 Pedras no chao so passa pulando!<br />
                    ⚡ Boost da velocidade mas gasta mais combustivel<br />
                    Use ← Freio | → Gas | ↑ Pular</>
                  ) : (
                    <>
                      Distancia: <strong>{score}m</strong> | Recorde: <strong>{highScore}m</strong><br />
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
                      placeholder="ex: Joao"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                <button className="bugrun-btn" onClick={handleStart}>
                  {gameState === "menu" ? "▶ Jogar" : "↻ Tentar de novo"}
                </button>
                <div className="bugrun-hint">← Freio | → Gas | ↑ Pular | 🟢 +combustivel | 🔴 -combustivel | 🪨 Pule as pedras</div>
              </div>
            )}
          </div>

          {gameState === "playing" && (
            <div className="touch-controls">
              <button
                className="touch-btn touch-btn-brake"
                onTouchStart={(e) => { e.preventDefault(); brakeStart(); }}
                onTouchEnd={(e) => { e.preventDefault(); brakeEnd(); }}
                onMouseDown={brakeStart} onMouseUp={brakeEnd} onMouseLeave={brakeEnd}
              >◀ FREIO</button>
              <button
                className="touch-btn touch-btn-jump"
                onTouchStart={(e) => { e.preventDefault(); jumpStart(); }}
                onTouchEnd={(e) => { e.preventDefault(); jumpEnd(); }}
                onMouseDown={jumpStart} onMouseUp={jumpEnd} onMouseLeave={jumpEnd}
              >⬆ PULAR</button>
              <button
                className="touch-btn touch-btn-gas"
                onTouchStart={(e) => { e.preventDefault(); gasStart(); }}
                onTouchEnd={(e) => { e.preventDefault(); gasEnd(); }}
                onMouseDown={gasStart} onMouseUp={gasEnd} onMouseLeave={gasEnd}
              >GAS ▶</button>
            </div>
          )}

          <div className="coin-legend">
            <div className="coin-legend-item">
              <div className="coin-dot good" />
              <span>+12% combustivel</span>
            </div>
            <div className="coin-legend-item">
              <div className="coin-dot bad" />
              <span>-15% combustivel</span>
            </div>
          </div>

          <div className="boost-legend">
            <div className="boost-legend-item">
              <span className="boost-icon">⚡</span>
              <span>Boost = velocidade extra (gasta mais combustivel)</span>
            </div>
          </div>

          <div className="bugrun-quotebar">
            <div className={`bugrun-quote ${quoteVisible ? "visible" : ""}`}>
              {quoteText}
            </div>
          </div>

          <div className="bugrun-ranking">
            <div className="bugrun-ranking-title">🏆 TOP 10 HILL CLIMBERS</div>
            <ul className="bugrun-ranking-list">
              {ranking.length === 0 ? (
                <li className="bugrun-ranking-empty">Ninguem jogou ainda. Seja o primeiro! 🚗</li>
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

          <div className="bugrun-footer">
            <span>DCTECH — SOLUCOES EM SISTEMAS</span>
            <a href="#contato">Precisa de um dev? →</a>
          </div>
        </div>
      </div>
    </section>
  );
}
