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

const CODE_EGGS = [
  "<div>","</div>","{props}","useState()","npm i","git push",
  "console.log","return null","/* TODO */","<br/>","yarn dev",
  "docker run","API_KEY","404","200 OK","SELECT *","JSON.parse",
  "async/await","try/catch","import React","export default",
  "margin: 0","flex: 1","grid-gap","@media","function()",
  "=> {}","undefined","NaN","null","true","false",
  "git commit","git merge","git pull","main branch",
  "deploy","build","vercel --prod","supabase","tailwind",
  "typescript","javascript","python","java","spring boot",
  "REST API","GraphQL","WebSocket","OAuth2","JWT",
];

const CANVAS_W = 720;
const CANVAS_H = 480;
const FUEL_MAX = 200;
const BULLET_SPEED = 9;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function DcBugRun() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem("dcriverride_high") || "0"); }
    catch { return 0; }
  });
  const [fuel, setFuel] = useState(FUEL_MAX);
  const [gameState, setGameState] = useState("menu");
  const [playerName, setPlayerName] = useState("");
  const [ranking, setRanking] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dcriverride_ranking") || "[]"); }
    catch { return []; }
  });
  const [quoteVisible, setQuoteVisible] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [gameOverReason, setGameOverReason] = useState("");
  const [phase, setPhase] = useState(1);
  const [ghostGap, setGhostGap] = useState(0);
  const [combo, setCombo] = useState(0);
  const [invincible, setInvincible] = useState(false);

  const keysRef = useRef({ up: false, down: false, shoot: false, shootPressed: false });

  const gameRef = useRef({
    running: false,
    animId: null,
    lastQuoteIdx: -1,
    plane: { x: 80, y: CANVAS_H / 2, vy: 0, fuel: FUEL_MAX },
    camera: 0,
    scrollSpeed: 2.5,
    frame: 0,
    score: 0,
    phase: 1,
    nextBridge: 600,
    bullets: [],
    enemies: [],
    fuelStations: [],
    mines: [],
    powerUps: [],
    particles: [],
    riverBanks: [],
    bridges: [],
    easterEggs: [],
    clouds: Array.from({ length: 8 }, () => ({
      x: Math.random() * CANVAS_W * 2,
      y: Math.random() * 80 + 10,
      w: 50 + Math.random() * 60,
      h: 15 + Math.random() * 10,
      speed: 0.3 + Math.random() * 0.3,
    })),
    stars: Array.from({ length: 50 }, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * 100,
      r: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.4 + 0.1,
      twinkle: Math.random() * Math.PI * 2,
    })),
    ghost: { x: -100, y: CANVAS_H / 2, offset: 0 },
    combo: { count: 0, timer: 0 },
    invincible: false,
    invTimer: 0,
    playerSkill: { avgScore: 0, gamesPlayed: 0, bestScores: [] },
  });

  const highScoreRef = useRef(highScore);
  useEffect(() => { highScoreRef.current = highScore; }, [highScore]);

  useEffect(() => {
    try {
      const skillData = localStorage.getItem("dcriverride_skill");
      if (skillData) gameRef.current.playerSkill = JSON.parse(skillData);
    } catch {}
  }, []);

  const loadGlobalRanking = useCallback(async () => {
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return;
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/dctech_game_scores?select=name,score,created_at&order=score.desc&limit=10`,
        { headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` } }
      );
      if (!response.ok) throw new Error("Ranking indisponivel");
      setRanking(await response.json());
    } catch {}
  }, []);

  const addToRanking = useCallback((name, scoreVal) => {
    const cleanName = name.trim().slice(0, 15) || "Anonimo";
    const newEntry = { name: cleanName, score: scoreVal, date: new Date().toISOString() };
    setRanking(prev => {
      const updated = [...prev, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
      try { localStorage.setItem("dcriverride_ranking", JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
      fetch(`${SUPABASE_URL}/rest/v1/dctech_game_scores`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ name: cleanName, score: scoreVal }),
      }).then(response => {
        if (!response.ok) throw new Error("Nao foi possivel enviar o placar");
        return loadGlobalRanking();
      }).catch(() => {});
    }
    const skill = gameRef.current.playerSkill;
    skill.gamesPlayed++;
    skill.bestScores.push(scoreVal);
    skill.bestScores = skill.bestScores.slice(-20);
    skill.avgScore = skill.bestScores.reduce((a, b) => a + b, 0) / skill.bestScores.length;
    try { localStorage.setItem("dcriverride_skill", JSON.stringify(skill)); } catch {}
  }, [loadGlobalRanking]);

  useEffect(() => { loadGlobalRanking(); }, [loadGlobalRanking]);

  const showQuote = useCallback((customText) => {
    const g = gameRef.current;
    if (customText) {
      setQuoteText(customText);
      setQuoteVisible(true);
      setTimeout(() => setQuoteVisible(false), 4000);
      return;
    }
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
    const finalScore = g.score;
    setScore(finalScore);
    setGameOverReason(reason);
    setGameState("gameover");
    setGhostGap(Math.max(0, Math.round(g.ghost.offset / 10)));
    setCombo(0);
    setInvincible(false);
    if (finalScore > highScoreRef.current) {
      setHighScore(finalScore);
      try { localStorage.setItem("dcriverride_high", finalScore.toString()); } catch {}
    }
    const msg = reason === "fuel" ? '"Sem combustivel. Ate sistemas precisam de energia." — Denis'
      : reason === "crash" ? '"Bateu nas margens. Sempre teste antes do deploy." — Denis'
      : reason === "enemy" ? '"Inimigo abatido? Nao, foi voce." — Denis'
      : '"Fim da linha. Hora de commitar." — Denis';
    setQuoteText(msg);
    setQuoteVisible(true);
  }, []);

  const generateRiverBanks = useCallback((startX, count, phase) => {
    const banks = [];
    let leftY = 90;
    let rightY = CANVAS_H - 90;
    const diff = 1 + (phase - 1) * 0.25;
    for (let i = 0; i < count; i++) {
      const x = startX + i * 4;
      leftY += Math.sin(x * 0.012 + phase * 0.7) * 2.5 * diff + (Math.random() - 0.5) * 2;
      rightY += Math.sin(x * 0.009 + phase * 0.4) * 2.5 * diff + (Math.random() - 0.5) * 2;
      leftY = Math.max(50, Math.min(170, leftY));
      rightY = Math.max(CANVAS_H - 170, Math.min(CANVAS_H - 50, rightY));
      banks.push({ x, leftY, rightY });
    }
    return banks;
  }, []);

  const getBankY = useCallback((banks, x, isLeft) => {
    const idx = Math.floor((x - banks[0].x) / 4);
    if (idx < 0) return isLeft ? banks[0].leftY : banks[0].rightY;
    if (idx >= banks.length - 1) return isLeft ? banks[banks.length - 1].leftY : banks[banks.length - 1].rightY;
    const t = (x - banks[idx].x) / 4;
    return isLeft
      ? banks[idx].leftY + (banks[idx + 1].leftY - banks[idx].leftY) * t
      : banks[idx].rightY + (banks[idx + 1].rightY - banks[idx].rightY) * t;
  }, []);

  const drawScene = useCallback((ctx, canvas) => {
    const g = gameRef.current;
    const plane = g.plane;
    const camX = g.camera;

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#030712");
    sky.addColorStop(0.4, "#0a1a0a");
    sky.addColorStop(0.7, "#0f2a15");
    sky.addColorStop(1, "#1a3a1c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    g.stars.forEach(s => {
      const twinkle = Math.sin(g.frame * 0.03 + s.twinkle) * 0.3 + 0.7;
      const sx = ((s.x - camX * 0.05) % canvas.width + canvas.width) % canvas.width;
      ctx.globalAlpha = s.opacity * twinkle;
      ctx.fillStyle = "#b8d4f0";
      ctx.beginPath();
      ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Clouds
    g.clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x < -c.w) c.x = canvas.width + c.w;
      const cx = c.x - camX * 0.1;
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#1e3a2f";
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

    // River banks
    const banks = g.riverBanks;
    if (banks.length > 1) {
      ctx.beginPath();
      ctx.moveTo(banks[0].x - camX, 0);
      banks.forEach(p => ctx.lineTo(p.x - camX, p.leftY));
      ctx.lineTo(banks[banks.length - 1].x - camX, 0);
      ctx.closePath();
      ctx.fillStyle = "#1a3a1c";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(banks[0].x - camX, canvas.height);
      banks.forEach(p => ctx.lineTo(p.x - camX, p.rightY));
      ctx.lineTo(banks[banks.length - 1].x - camX, canvas.height);
      ctx.closePath();
      ctx.fillStyle = "#1a3a1c";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(banks[0].x - camX, banks[0].leftY);
      banks.forEach(p => ctx.lineTo(p.x - camX, p.leftY));
      ctx.lineTo(banks[banks.length - 1].x - camX, banks[banks.length - 1].rightY);
      for (let i = banks.length - 1; i >= 0; i--) {
        ctx.lineTo(banks[i].x - camX, banks[i].rightY);
      }
      ctx.closePath();
      const waterGrad = ctx.createLinearGradient(0, canvas.height * 0.3, 0, canvas.height * 0.7);
      waterGrad.addColorStop(0, "#0a5c0a");
      waterGrad.addColorStop(0.5, "#0d7a0d");
      waterGrad.addColorStop(1, "#0a5c0a");
      ctx.fillStyle = waterGrad;
      ctx.fill();

      // Water lines
      ctx.strokeStyle = "rgba(34, 197, 94, 0.1)";
      ctx.lineWidth = 1;
      for (let wy = 100; wy < canvas.height - 100; wy += 20) {
        ctx.beginPath();
        for (let wx = Math.floor(camX / 20) * 20; wx < camX + canvas.width + 20; wx += 20) {
          const left = getBankY(banks, wx, true);
          const right = getBankY(banks, wx, false);
          if (wy > left + 5 && wy < right - 5) {
            const offset = Math.sin(wx * 0.05 + g.frame * 0.05) * 3;
            ctx.lineTo(wx - camX, wy + offset);
          }
        }
        ctx.stroke();
      }
    }

    // Easter eggs
    g.easterEggs.forEach(egg => {
      if (egg.x < camX - 50 || egg.x > camX + canvas.width + 50) return;
      const ex = egg.x - camX;
      const left = getBankY(banks, egg.x, true);
      const right = getBankY(banks, egg.x, false);
      const ey = left + (right - left) * 0.88;
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(g.frame * 0.03 + egg.x) * 0.1;
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(egg.text, ex, ey);
      ctx.restore();
    });

    // Bridges
    g.bridges.forEach(bridge => {
      if (bridge.x < camX - 100 || bridge.x > camX + canvas.width + 100) return;
      const bx = bridge.x - camX;
      const left = getBankY(banks, bridge.x, true);
      const right = getBankY(banks, bridge.x, false);
      ctx.save();
      ctx.fillStyle = "#475569";
      ctx.fillRect(bx - 5, left, 10, right - left);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(bx - 8, left, 16, 8);
      ctx.fillRect(bx - 8, right - 8, 16, 8);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      for (let by = left + 15; by < right - 15; by += 25) {
        ctx.beginPath();
        ctx.moveTo(bx - 5, by);
        ctx.lineTo(bx + 5, by);
        ctx.stroke();
      }
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 8;
      ctx.fillText(`FASE ${bridge.phase}`, bx, left - 12);
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Fuel stations (Postos DC - VERDES)
    g.fuelStations.forEach(fs => {
      if (fs.x < camX - 50 || fs.x > camX + canvas.width + 50) return;
      const fx = fs.x - camX;
      const left = getBankY(banks, fs.x, true);
      const right = getBankY(banks, fs.x, false);
      const fy = left + (right - left) * 0.5;
      ctx.save();
      const pulse = 0.5 + Math.sin(g.frame * 0.1) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "#22c55e";
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(fx, fy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#14532d";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("DC", fx, fy);
      // Fuel icon
      ctx.globalAlpha = 0.6 + Math.sin(g.frame * 0.08) * 0.3;
      ctx.font = "14px Arial";
      ctx.fillText("⛽", fx, fy - 22);
      ctx.restore();
    });

    // Mines (BOMBAS VERMELHAS - drenam combustível)
    g.mines.forEach(m => {
      if (m.x < camX - 50 || m.x > camX + canvas.width + 50) return;
      const mx = m.x - camX;
      const left = getBankY(banks, m.x, true);
      const right = getBankY(banks, m.x, false);
      const my = left + (right - left) * (0.3 + Math.sin(g.frame * 0.02 + m.x) * 0.2);
      ctx.save();
      const pulse = 0.5 + Math.sin(g.frame * 0.15 + m.x) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(mx, my, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Mine spikes
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2;
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2 + g.frame * 0.02;
        ctx.beginPath();
        ctx.moveTo(mx + Math.cos(angle) * 10, my + Math.sin(angle) * 10);
        ctx.lineTo(mx + Math.cos(angle) * 16, my + Math.sin(angle) * 16);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#7f1d1d";
      ctx.font = "bold 9px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("-FUEL", mx, my);
      ctx.restore();
    });

    // Power-ups
    g.powerUps.forEach(pu => {
      if (pu.x < camX - 50 || pu.x > camX + canvas.width + 50) return;
      const px = pu.x - camX;
      const left = getBankY(banks, pu.x, true);
      const right = getBankY(banks, pu.x, false);
      const py = left + (right - left) * 0.5 + Math.sin(g.frame * 0.05 + pu.x) * 20;
      ctx.save();
      ctx.globalAlpha = 0.7 + Math.sin(g.frame * 0.1) * 0.2;
      if (pu.type === "shield") {
        ctx.fillStyle = "#60a5fa";
        ctx.shadowColor = "#3b82f6";
      } else if (pu.type === "rapid") {
        ctx.fillStyle = "#fbbf24";
        ctx.shadowColor = "#f59e0b";
      } else {
        ctx.fillStyle = "#a855f7";
        ctx.shadowColor = "#9333ea";
      }
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(pu.type === "shield" ? "🛡️" : pu.type === "rapid" ? "⚡" : "💥", px, py);
      ctx.restore();
    });

    // Enemies
    g.enemies.forEach(enemy => {
      if (enemy.x < camX - 50 || enemy.x > camX + canvas.width + 50) return;
      const ex = enemy.x - camX;
      ctx.save();
      ctx.translate(ex, enemy.y);

      if (enemy.type === "ship") {
        // Ship body
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(16, 0);
        ctx.lineTo(0, 10);
        ctx.lineTo(-10, 5);
        ctx.closePath();
        ctx.fill();
        // Detail
        ctx.fillStyle = "#7f1d1d";
        ctx.fillRect(-8, -3, 12, 6);
        // Wake
        if (g.frame % 4 === 0) {
          g.particles.push({
            x: enemy.x - 12, y: enemy.y + (Math.random() - 0.5) * 6,
            vx: -1 - Math.random(), vy: (Math.random() - 0.5) * 0.5,
            r: 1.5, color: "rgba(34, 197, 94, 0.3)",
            life: 8, maxLife: 8,
          });
        }
      } else if (enemy.type === "heli") {
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#92400e";
        ctx.fillRect(-3, -14, 6, 10);
        // Rotor
        ctx.strokeStyle = "#d97706";
        ctx.lineWidth = 2;
        const bladeAngle = g.frame * 0.4;
        ctx.beginPath();
        ctx.moveTo(-22, -14);
        ctx.lineTo(22, -14);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(0, -20);
        ctx.stroke();
      } else if (enemy.type === "jet") {
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(-12, -10);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-12, 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#7f1d1d";
        ctx.fillRect(-10, -3, 8, 6);
        // Engine glow
        ctx.fillStyle = "#f59e0b";
        ctx.globalAlpha = 0.5 + Math.sin(g.frame * 0.3) * 0.3;
        ctx.beginPath();
        ctx.arc(-14, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (enemy.type === "tanker") {
        // Big slow tanker
        ctx.fillStyle = "#854d0e";
        ctx.fillRect(-16, -10, 32, 20);
        ctx.fillStyle = "#a16207";
        ctx.fillRect(-12, -6, 24, 12);
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Bullets
    g.bullets.forEach(b => {
      const bx = b.x - camX;
      ctx.save();
      ctx.fillStyle = "#fbbf24";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(bx, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
      // Trail
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(bx - 6, b.y, 2, 0, Math.PI * 2);
      ctx.fill();
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
      p.life--;
    });
    ctx.globalAlpha = 1;

    // Combo display
    if (g.combo.count > 1 && g.combo.timer > 0) {
      const cx = plane.x - camX;
      const cy = plane.y - 35;
      ctx.save();
      ctx.globalAlpha = Math.min(1, g.combo.timer / 30);
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 10;
      ctx.fillText(`COMBO x${g.combo.count}!`, cx, cy);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Ghost plane
    const ghost = g.ghost;
    const ghostX = ghost.x - camX;
    if (ghostX > -60 && ghostX < canvas.width + 60) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.translate(ghostX, ghost.y);
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-12, -12);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-12, 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fb923c";
      ctx.fillRect(-5, -16, 10, 32);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.fillText("DC", 0, 3);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "#fdba74";
      ctx.font = "bold 9px Arial";
      ctx.textAlign = "center";
      ctx.fillText("👻 DC", ghostX, ghost.y - 24);
      ctx.restore();
    }

    // Player plane
    const px = plane.x - camX;
    const py = plane.y;
    ctx.save();
    ctx.translate(px, py);

    // Invincibility shield
    if (g.invincible) {
      ctx.globalAlpha = 0.3 + Math.sin(g.frame * 0.2) * 0.2;
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(96, 165, 250, 0.1)";
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Shadow
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(0, 22, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Body
    ctx.fillStyle = "#1e40af";
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-14, -12);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-14, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Wings
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(-7, -18, 12, 36);
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 1;
    ctx.strokeRect(-7, -18, 12, 36);

    // Tail
    ctx.fillStyle = "#1d4ed8";
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-22, -10);
    ctx.lineTo(-16, 0);
    ctx.lineTo(-22, 10);
    ctx.closePath();
    ctx.fill();

    // DC text
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#fef08a";
    ctx.shadowBlur = 4;
    ctx.fillText("DC", 2, 0);
    ctx.shadowBlur = 0;

    // Engine
    ctx.fillStyle = "#f59e0b";
    ctx.globalAlpha = 0.6 + Math.sin(g.frame * 0.2) * 0.3;
    ctx.beginPath();
    ctx.arc(-16, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Shooting flash
    if (keysRef.current.shoot && g.running) {
      ctx.fillStyle = "#fbbf24";
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(20, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // HUD
    const fuelPct = plane.fuel / FUEL_MAX;
    const barW = 140, barH = 12, barX = 14, barY = 14;
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
    ctx.fillText("⛽", barX, barY + 26);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Arial";
    ctx.fillText(`${Math.round(fuelPct * 100)}%`, barX + 22, barY + 26);

    // Phase
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.roundRect(14, 48, 90, 20, 6);
    ctx.fill();
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`FASE ${g.phase}`, 20, 62);

    // Score
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.roundRect(canvas.width - 120, 10, 110, 28, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(34, 197, 94, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${g.score}m`, canvas.width - 18, 30);

    // High score
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.roundRect(canvas.width - 120, 46, 110, 22, 6);
    ctx.fill();
    ctx.fillStyle = "#60a5fa";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`REC: ${highScoreRef.current}m`, canvas.width - 18, 62);

    // Ghost gap
    const gapMeters = Math.round(g.ghost.offset / 10);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.roundRect(14, 74, 110, 20, 6);
    ctx.fill();
    ctx.fillStyle = gapMeters >= 0 ? "#fb923c" : "#34d399";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`👻${gapMeters >= 0 ? "+" : ""}${gapMeters}m`, 20, 88);

    // Combo indicator
    if (g.combo.count > 1) {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.roundRect(canvas.width - 120, 74, 110, 20, 6);
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "right";
      ctx.fillText(`🔥 COMBO x${g.combo.count}`, canvas.width - 18, 88);
    }

    // Controls hint
    if (g.running) {
      ctx.font = "bold 10px Arial";
      ["⬆ SOBE", "⬇ DESCE", "SPACE ATIRA"].forEach((label, i) => {
        const active = i === 0 ? keysRef.current.up : i === 1 ? keysRef.current.down : keysRef.current.shoot;
        ctx.globalAlpha = active ? 1 : 0.35;
        ctx.fillStyle = active
          ? (i === 0 ? "#34d399" : i === 1 ? "#60a5fa" : "#fbbf24")
          : "#64748b";
        const xPos = i === 0 ? 14 : i === 2 ? canvas.width - 14 : canvas.width / 2;
        ctx.textAlign = i === 0 ? "left" : i === 2 ? "right" : "center";
        ctx.fillText(label, xPos, canvas.height - 10);
        ctx.globalAlpha = 1;
      });
    }
  }, [getBankY]);

  const updatePhysics = useCallback(() => {
    const g = gameRef.current;
    if (!g.running) return;
    const plane = g.plane;
    g.frame++;

    const up = keysRef.current.up;
    const down = keysRef.current.down;
    const shoot = keysRef.current.shoot;
    const shootPressed = keysRef.current.shootPressed;

    // Scroll speed increases with phase
    const baseSpeed = 2.5 + (g.phase - 1) * 0.4;
    g.scrollSpeed = Math.min(baseSpeed, 7);
    g.camera += g.scrollSpeed;
    plane.x = 80 + g.camera;

    // Plane movement
    if (up) plane.vy -= 0.45;
    if (down) plane.vy += 0.45;
    plane.vy *= 0.93;
    plane.y += plane.vy;

    // Keep plane in river bounds
    const leftBound = getBankY(g.riverBanks, plane.x, true) + 18;
    const rightBound = getBankY(g.riverBanks, plane.x, false) - 18;
    plane.y = Math.max(leftBound, Math.min(rightBound, plane.y));

    // Check collision with banks
    if (plane.y <= leftBound + 3 || plane.y >= rightBound - 3) {
      if (!g.invincible) {
        gameOver("crash");
        return;
      }
    }

    // Invincibility timer
    if (g.invincible) {
      g.invTimer--;
      if (g.invTimer <= 0) {
        g.invincible = false;
        setInvincible(false);
      }
    }

    // Combo timer
    if (g.combo.timer > 0) {
      g.combo.timer--;
      if (g.combo.timer <= 0) {
        g.combo.count = 0;
        setCombo(0);
      }
    }

    // Shooting
    const fireRate = g.powerUps.some(p => p.active && p.type === "rapid") ? 4 : 8;
    if (shoot && !shootPressed && g.frame % fireRate === 0) {
      g.bullets.push({ x: plane.x + 20, y: plane.y, vx: BULLET_SPEED });
      keysRef.current.shootPressed = true;
    }
    if (!shoot) keysRef.current.shootPressed = false;

    // Update bullets
    g.bullets = g.bullets.filter(b => {
      b.x += b.vx;
      return b.x < g.camera + CANVAS_W + 50;
    });

    // Fuel consumption
    plane.fuel -= 0.07 * (1 + (g.phase - 1) * 0.08);
    if (shoot) plane.fuel -= 0.015;
    plane.fuel = Math.max(0, plane.fuel);
    setFuel(plane.fuel);
    if (plane.fuel <= 0) {
      gameOver("fuel");
      return;
    }

    // Update enemies
    g.enemies = g.enemies.filter(e => {
      e.x -= g.scrollSpeed * 0.35;
      if (e.type === "heli") e.y += Math.sin(g.frame * 0.05 + e.x) * 0.8;
      if (e.type === "jet") e.y += Math.sin(g.frame * 0.08 + e.x * 0.5) * 0.3;
      return e.x > g.camera - 100;
    });

    // Spawn enemies - MORE FREQUENT
    const enemyChance = 0.015 + (g.phase - 1) * 0.004;
    const maxEnemies = 3 + g.phase;
    if (g.enemies.length < maxEnemies && Math.random() < enemyChance && g.frame % 20 === 0) {
      const types = ["ship", "heli", "jet", "tanker"];
      const availableTypes = types.slice(0, Math.min(types.length, g.phase + 1));
      const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      const left = getBankY(g.riverBanks, g.camera + CANVAS_W + 50, true);
      const right = getBankY(g.riverBanks, g.camera + CANVAS_W + 50, false);
      g.enemies.push({
        x: g.camera + CANVAS_W + 50,
        y: left + 25 + Math.random() * (right - left - 50),
        type,
        hp: type === "jet" ? 2 : type === "tanker" ? 3 : 1,
      });
    }

    // Bullet-enemy collision
    g.bullets.forEach(b => {
      g.enemies.forEach(e => {
        if (e.hp <= 0) return;
        const dx = Math.abs(b.x - e.x);
        const dy = Math.abs(b.y - e.y);
        const hitDist = e.type === "tanker" ? 18 : 14;
        if (dx < hitDist && dy < hitDist) {
          e.hp--;
          b.x = -9999;
          if (e.hp <= 0) {
            const points = e.type === "tanker" ? 80 : e.type === "jet" ? 50 : e.type === "heli" ? 35 : 25;
            g.score += points;
            // Combo system
            g.combo.count++;
            g.combo.timer = 90;
            setCombo(g.combo.count);
            // Bonus for combos
            if (g.combo.count >= 3) {
              plane.fuel = Math.min(FUEL_MAX, plane.fuel + g.combo.count * 2);
            }
            // Explosion particles
            const color = e.type === "tanker" ? "#a16207" : e.type === "jet" ? "#ef4444" : "#f59e0b";
            for (let i = 0; i < 15; i++) {
              g.particles.push({
                x: e.x, y: e.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                r: 2 + Math.random() * 3,
                color,
                life: 25, maxLife: 25,
              });
            }
          }
        }
      });
    });
    g.bullets = g.bullets.filter(b => b.x > -999);
    g.enemies = g.enemies.filter(e => e.hp > 0);

    // Plane-enemy collision
    if (!g.invincible) {
      g.enemies.forEach(e => {
        const dx = Math.abs(e.x - plane.x);
        const dy = Math.abs(e.y - plane.y);
        const hitDist = e.type === "tanker" ? 22 : 18;
        if (dx < hitDist && dy < hitDist) {
          gameOver("enemy");
        }
      });
    }

    // Fuel stations - MORE FREQUENT
    g.fuelStations = g.fuelStations.filter(fs => {
      fs.x -= g.scrollSpeed;
      const dx = Math.abs(fs.x - plane.x);
      const dy = Math.abs(fs.y - plane.y);
      if (dx < 22 && dy < 22) {
        plane.fuel = Math.min(FUEL_MAX, plane.fuel + 50);
        g.score += 10;
        for (let i = 0; i < 12; i++) {
          g.particles.push({
            x: fs.x, y: fs.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            r: 2 + Math.random() * 2,
            color: "#22c55e",
            life: 20, maxLife: 20,
          });
        }
        showQuote("⛽ Combustivel DC! +50%");
        return false;
      }
      return fs.x > g.camera - 100;
    });

    // Spawn fuel stations - EVERY 300-500m
    if (Math.random() < 0.008 && g.frame % 40 === 0) {
      const left = getBankY(g.riverBanks, g.camera + CANVAS_W + 100, true);
      const right = getBankY(g.riverBanks, g.camera + CANVAS_W + 100, false);
      g.fuelStations.push({
        x: g.camera + CANVAS_W + 100,
        y: left + (right - left) * 0.5,
      });
    }

    // Mines (red obstacles that drain fuel)
    g.mines = g.mines.filter(m => {
      m.x -= g.scrollSpeed;
      const left = getBankY(g.riverBanks, m.x, true);
      const right = getBankY(g.riverBanks, m.x, false);
      m.y = left + (right - left) * (0.3 + Math.sin(g.frame * 0.02 + m.x) * 0.2);
      const dx = Math.abs(m.x - plane.x);
      const dy = Math.abs(m.y - plane.y);
      if (dx < 18 && dy < 18 && !g.invincible) {
        plane.fuel = Math.max(0, plane.fuel - 30);
        for (let i = 0; i < 10; i++) {
          g.particles.push({
            x: m.x, y: m.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            r: 2 + Math.random() * 2,
            color: "#ef4444",
            life: 15, maxLife: 15,
          });
        }
        showQuote("💥 Mina! -30% combustivel!");
        return false;
      }
      return m.x > g.camera - 100;
    });

    // Spawn mines
    const mineChance = 0.006 + (g.phase - 1) * 0.002;
    if (Math.random() < mineChance && g.frame % 50 === 0) {
      const left = getBankY(g.riverBanks, g.camera + CANVAS_W + 80, true);
      const right = getBankY(g.riverBanks, g.camera + CANVAS_W + 80, false);
      g.mines.push({
        x: g.camera + CANVAS_W + 80,
        y: left + (right - left) * 0.5,
      });
    }

    // Power-ups
    g.powerUps = g.powerUps.filter(pu => {
      pu.x -= g.scrollSpeed;
      const left = getBankY(g.riverBanks, pu.x, true);
      const right = getBankY(g.riverBanks, pu.x, false);
      const py = left + (right - left) * 0.5 + Math.sin(g.frame * 0.05 + pu.x) * 20;
      const dx = Math.abs(pu.x - plane.x);
      const dy = Math.abs(py - plane.y);
      if (dx < 20 && dy < 20) {
        if (pu.type === "shield") {
          g.invincible = true;
          g.invTimer = 300; // 5 seconds at 60fps
          setInvincible(true);
          showQuote("🛡️ Escudo ativado! 5s de invencibilidade!");
        } else if (pu.type === "rapid") {
          pu.active = true;
          pu.timer = 300;
          showQuote("⚡ Tiro rapido! 5s de cadencia dupla!");
        } else if (pu.type === "nuke") {
          // Destroy all enemies on screen
          g.enemies.forEach(e => {
            for (let i = 0; i < 10; i++) {
              g.particles.push({
                x: e.x, y: e.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                r: 3 + Math.random() * 3,
                color: "#a855f7",
                life: 30, maxLife: 30,
              });
            }
          });
          g.score += g.enemies.length * 50;
          g.enemies = [];
          showQuote("💥 BOMBA! Todos inimigos destruidos!");
        }
        return false;
      }
      if (pu.active && pu.timer) {
        pu.timer--;
        if (pu.timer <= 0) pu.active = false;
      }
      return pu.x > g.camera - 100;
    });

    // Spawn power-ups
    if (Math.random() < 0.002 && g.frame % 120 === 0) {
      const types = ["shield", "rapid", "nuke"];
      const type = types[Math.floor(Math.random() * types.length)];
      const left = getBankY(g.riverBanks, g.camera + CANVAS_W + 120, true);
      const right = getBankY(g.riverBanks, g.camera + CANVAS_W + 120, false);
      g.powerUps.push({
        x: g.camera + CANVAS_W + 120,
        y: left + (right - left) * 0.5,
        type,
        active: false,
        timer: 0,
      });
    }

    // Bridges (phase transitions)
    g.bridges = g.bridges.filter(b => b.x > g.camera - 100);
    g.bridges.forEach(b => {
      if (!b.passed && plane.x > b.x + 20) {
        b.passed = true;
        g.phase++;
        setPhase(g.phase);
        g.score += 150;
        showQuote(`🌉 FASE ${g.phase}! Velocidade aumentada!`);
      }
    });

    if (g.camera + CANVAS_W > g.nextBridge - 200) {
      g.bridges.push({ x: g.nextBridge, phase: g.phase + 1, passed: false });
      g.nextBridge += 600 + Math.random() * 300;
    }

    // Generate river banks
    if (g.camera + CANVAS_W > g.riverBanks[g.riverBanks.length - 1]?.x - 100) {
      const lastX = g.riverBanks[g.riverBanks.length - 1].x;
      const newBanks = generateRiverBanks(lastX + 4, 200, g.phase);
      g.riverBanks = [...g.riverBanks.slice(-300), ...newBanks];
      newBanks.forEach((b, i) => {
        if (i % 20 === 0) {
          g.easterEggs.push({
            x: b.x,
            text: CODE_EGGS[Math.floor(Math.random() * CODE_EGGS.length)],
          });
        }
      });
    }
    g.riverBanks = g.riverBanks.filter(b => b.x > g.camera - CANVAS_W);
    g.easterEggs = g.easterEggs.filter(e => e.x > g.camera - CANVAS_W);

    g.score = Math.floor(g.camera / 10);
    setScore(g.score);

    // Ghost plane
    const ghostBias = Math.min(g.frame * 0.012, 350);
    const ghostOsc = Math.sin(g.frame * 0.01) * 130;
    g.ghost.offset = ghostOsc + ghostBias;
    g.ghost.x = plane.x + g.ghost.offset;
    const ghostLeft = getBankY(g.riverBanks, g.ghost.x, true);
    const ghostRight = getBankY(g.riverBanks, g.ghost.x, false);
    g.ghost.y = ghostLeft + (ghostRight - ghostLeft) * 0.5 + Math.sin(g.frame * 0.025) * 25;

    // Engine particles
    if (g.running && g.frame % 2 === 0) {
      g.particles.push({
        x: plane.x - 18,
        y: plane.y + (Math.random() - 0.5) * 5,
        vx: -2.5 - Math.random(),
        vy: (Math.random() - 0.5) * 0.8,
        r: 1.5 + Math.random() * 1.5,
        color: `rgba(251, 191, 36, ${0.4 + Math.random() * 0.4})`,
        life: 10, maxLife: 10,
      });
    }
  }, [showQuote, gameOver, generateRiverBanks, getBankY]);

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
    const banks = generateRiverBanks(0, 400, 1);
    g.riverBanks = banks;
    g.plane = { x: 80, y: CANVAS_H / 2, vy: 0, fuel: FUEL_MAX };
    g.camera = 0;
    g.scrollSpeed = 2.5;
    g.frame = 0;
    g.score = 0;
    g.phase = 1;
    g.nextBridge = 600;
    g.bullets = [];
    g.enemies = [];
    g.fuelStations = [];
    g.mines = [];
    g.powerUps = [];
    g.particles = [];
    g.bridges = [];
    g.easterEggs = [];
    g.ghost = { x: -100, y: CANVAS_H / 2, offset: 0 };
    g.combo = { count: 0, timer: 0 };
    g.invincible = false;
    g.invTimer = 0;
    banks.forEach((b, i) => {
      if (i % 20 === 0) {
        g.easterEggs.push({
          x: b.x,
          text: CODE_EGGS[Math.floor(Math.random() * CODE_EGGS.length)],
        });
      }
    });
    // Initial fuel station
    const left = getBankY(banks, 300, true);
    const right = getBankY(banks, 300, false);
    g.fuelStations.push({ x: 300, y: left + (right - left) * 0.5 });
    g.running = true;
    setScore(0);
    setFuel(FUEL_MAX);
    setPhase(1);
    setCombo(0);
    setInvincible(false);
    setGameState("playing");
    setQuoteVisible(false);
    setGhostGap(0);
    setTimeout(() => showQuote("Boa sorte, piloto DC! ✈️"), 500);
    g.animId = requestAnimationFrame(loop);
  }, [showQuote, loop, generateRiverBanks, getBankY]);

  const handleStart = useCallback(() => {
    if (gameState === "gameover" && playerName.trim()) {
      addToRanking(playerName, score);
    }
    setPlayerName("");
    startGame();
  }, [gameState, playerName, score, addToRanking, startGame]);

  useEffect(() => {
    const gameKeys = new Set(["ArrowUp", "ArrowDown", "Space", "KeyW", "KeyS", "KeyX"]);

    const onDown = (e) => {
      if (gameState === "playing" && gameKeys.has(e.code)) {
        e.preventDefault();
      }
      if (e.code === "ArrowUp" || e.code === "KeyW") keysRef.current.up = true;
      if (e.code === "ArrowDown" || e.code === "KeyS") keysRef.current.down = true;
      if (e.code === "Space" || e.code === "KeyX") {
        keysRef.current.shoot = true;
      }
      if ((e.code === "Space" || e.code === "Enter") && gameState !== "playing") {
        e.preventDefault();
        if (gameState === "gameover" && document.activeElement?.id === "river-name-input") return;
        handleStart();
      }
    };
    const onUp = (e) => {
      if (gameState === "playing" && gameKeys.has(e.code)) {
        e.preventDefault();
      }
      if (e.code === "ArrowUp" || e.code === "KeyW") keysRef.current.up = false;
      if (e.code === "ArrowDown" || e.code === "KeyS") keysRef.current.down = false;
      if (e.code === "Space" || e.code === "KeyX") {
        keysRef.current.shoot = false;
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
    const banks = generateRiverBanks(0, 400, 1);
    g.riverBanks = banks;
    g.easterEggs = banks.filter((_, i) => i % 20 === 0).map(b => ({
      x: b.x,
      text: CODE_EGGS[Math.floor(Math.random() * CODE_EGGS.length)],
    }));
    drawScene(ctx, canvas);
  }, [drawScene, generateRiverBanks]);

  useEffect(() => () => { cancelAnimationFrame(gameRef.current.animId); }, []);

  const upStart = useCallback(() => { keysRef.current.up = true; }, []);
  const upEnd = useCallback(() => { keysRef.current.up = false; }, []);
  const downStart = useCallback(() => { keysRef.current.down = true; }, []);
  const downEnd = useCallback(() => { keysRef.current.down = false; }, []);
  const shootStart = useCallback(() => { keysRef.current.shoot = true; }, []);
  const shootEnd = useCallback(() => { keysRef.current.shoot = false; keysRef.current.shootPressed = false; }, []);

  const fuelPct = fuel / FUEL_MAX;

  return (
    <section className="dc-riverride">
      <style>{`
        .dc-riverride {
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 20px 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .dc-riverride .container {
          width: 100%;
          max-width: 740px;
          padding: 0 10px;
        }
        .riverride-card {
          background: linear-gradient(145deg, #0a0f1a 0%, #0d1525 50%, #0a1220 100%);
          border-radius: 20px;
          border: 1px solid rgba(34, 197, 94, 0.15);
          box-shadow: 0 0 60px rgba(34, 197, 94, 0.08), 0 8px 32px rgba(0,0,0,0.4);
          overflow: hidden;
        }
        .riverride-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 14px;
          gap: 8px;
          flex-wrap: nowrap;
          background: linear-gradient(90deg, rgba(21, 128, 61, 0.15) 0%, transparent 100%);
          border-bottom: 1px solid rgba(34, 197, 94, 0.1);
        }
        .riverride-title {
          font-size: 13px;
          font-weight: 800;
          color: #e2e8f0;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .riverride-title span { font-size: 15px; }
        .riverride-score {
          font-size: 11px;
          font-weight: 700;
          color: #34d399;
          font-family: monospace;
          background: rgba(52, 211, 153, 0.1);
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid rgba(52, 211, 153, 0.2);
          white-space: nowrap;
        }
        .riverride-rec {
          font-size: 9px;
          color: #94a3b8;
          font-family: monospace;
          white-space: nowrap;
        }
        @media (max-width: 480px) {
          .riverride-header { padding: 6px 10px; gap: 5px; }
          .riverride-title { font-size: 11px; gap: 4px; }
          .riverride-title span { font-size: 13px; }
          .riverride-score { font-size: 10px; padding: 2px 6px; }
          .riverride-rec { font-size: 8px; }
        }
        .riverride-canvas {
          display: block;
          width: 100%;
          aspect-ratio: 720 / 480;
          background: #060d1f;
          border-bottom: 1px solid rgba(34, 197, 94, 0.1);
        }
        .canvas-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
        }
        .riverride-overlay {
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
        .riverride-overlay-title {
          font-size: 24px;
          font-weight: 800;
          color: #f8fafc;
          margin-bottom: 6px;
          text-shadow: 0 0 30px rgba(34, 197, 94, 0.3);
        }
        .riverride-overlay-sub {
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 18px;
          max-width: 420px;
        }
        .riverride-overlay-sub strong {
          color: #34d399;
          font-size: 16px;
        }
        .riverride-newrec {
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
        .riverride-namearea {
          margin-bottom: 14px;
          width: 100%;
          max-width: 280px;
        }
        .riverride-namearea label {
          display: block;
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 6px;
          text-align: left;
        }
        .riverride-namearea input {
          width: 100%;
          padding: 10px 14px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 10px;
          color: #e2e8f0;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .riverride-namearea input:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
        }
        .riverride-btn {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          color: white;
          border: none;
          padding: 12px 34px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(22, 163, 74, 0.3);
          letter-spacing: 0.5px;
        }
        .riverride-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 28px rgba(22, 163, 74, 0.4);
        }
        .riverride-btn:active {
          transform: translateY(0);
        }
        .riverride-hint {
          margin-top: 12px;
          font-size: 10px;
          color: #64748b;
        }
        @media (max-width: 480px) {
          .riverride-overlay { padding: 10px 14px; }
          .riverride-overlay-title { font-size: 19px; margin-bottom: 4px; }
          .riverride-overlay-sub { font-size: 11px; margin-bottom: 12px; line-height: 1.45; }
          .riverride-overlay-sub strong { font-size: 14px; }
          .riverride-btn { padding: 9px 26px; font-size: 13px; }
          .riverride-hint { margin-top: 8px; font-size: 9px; }
          .riverride-namearea { margin-bottom: 10px; }
          .riverride-namearea input { padding: 8px 12px; font-size: 13px; }
        }
        .riverride-quotebar {
          padding: 6px 16px;
          background: rgba(21, 128, 61, 0.06);
          border-top: 1px solid rgba(34, 197, 94, 0.08);
          min-height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .riverride-quote {
          font-size: 12px;
          color: #86efac;
          font-style: italic;
          text-align: center;
          opacity: 0;
          transform: translateY(6px);
          transition: all 0.5s ease;
          max-width: 600px;
        }
        .riverride-quote.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .riverride-ranking {
          padding: 12px 18px;
          background: rgba(6, 13, 31, 0.5);
        }
        .riverride-ranking-title {
          font-size: 12px;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }
        .riverride-ranking-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .riverride-ranking-empty {
          color: #64748b;
          font-size: 12px;
          text-align: center;
          padding: 10px;
        }
        .riverride-ranking-item {
          display: flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 8px;
          margin-bottom: 3px;
          font-size: 12px;
          transition: background 0.2s;
        }
        .riverride-ranking-item:hover {
          background: rgba(34, 197, 94, 0.06);
        }
        .riverride-rank-pos {
          width: 28px;
          font-size: 13px;
        }
        .riverride-rank-pos.pos-1 { color: #fbbf24; }
        .riverride-rank-pos.pos-2 { color: #cbd5e1; }
        .riverride-rank-pos.pos-3 { color: #fb923c; }
        .riverride-rank-name {
          flex: 1;
          color: #e2e8f0;
          font-weight: 500;
        }
        .riverride-rank-score {
          color: #34d399;
          font-weight: 700;
          font-family: monospace;
        }
        .riverride-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: rgba(6, 13, 31, 0.8);
          border-top: 1px solid rgba(34, 197, 94, 0.08);
          font-size: 10px;
          color: #475569;
        }
        .riverride-footer a {
          color: #22c55e;
          text-decoration: none;
          transition: color 0.2s;
        }
        .riverride-footer a:hover {
          color: #4ade80;
        }
        .touch-controls {
          display: flex;
          justify-content: space-between;
          padding: 6px 12px;
          background: rgba(0,0,0,0.35);
          border-top: 1px solid rgba(34,197,94,0.08);
          gap: 6px;
        }
        .touch-btn {
          flex: 1;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 12px;
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
        .touch-btn-up {
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.25);
          color: #34d399;
        }
        .touch-btn-up:active {
          background: rgba(34, 197, 94, 0.25);
        }
        .touch-btn-shoot {
          background: rgba(251, 191, 36, 0.12);
          border-color: rgba(251, 191, 36, 0.25);
          color: #fbbf24;
          max-width: 80px;
        }
        .touch-btn-shoot:active {
          background: rgba(251, 191, 36, 0.25);
        }
        .touch-btn-down {
          background: rgba(96, 165, 250, 0.12);
          border-color: rgba(96, 165, 250, 0.25);
          color: #60a5fa;
        }
        .touch-btn-down:active {
          background: rgba(96, 165, 250, 0.25);
        }
        .legend-row {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 14px;
          padding: 6px 16px;
          background: rgba(6, 13, 31, 0.5);
          border-top: 1px solid rgba(34, 197, 94, 0.06);
          font-size: 10px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #94a3b8;
        }
        .legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }
        .legend-dot.fuel { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
        .legend-dot.mine { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
        .legend-icon {
          font-size: 11px;
        }
      `}</style>

      <div className="container">
        <div className="riverride-card">

          <div className="riverride-header">
            <div className="riverride-title">
              <span>✈️</span> DC RIVER RIDE
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>⛽</span>
                <div style={{ width: 42, height: 5, background: "rgba(100,116,139,0.25)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    width: `${fuelPct * 100}%`, height: "100%", borderRadius: 3,
                    background: fuelPct > 0.4 ? "#22c55e" : fuelPct > 0.2 ? "#f59e0b" : "#ef4444",
                    transition: "width 0.3s, background 0.3s",
                  }} />
                </div>
              </div>
              <span className="riverride-score">{score.toString().padStart(4, "0")}m</span>
              <span className="riverride-rec">REC:{highScore.toString().padStart(4, "0")}m</span>
            </div>
          </div>

          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="riverride-canvas"
            />
            {gameState !== "playing" && (
              <div className="riverride-overlay">
                <div className="riverride-overlay-title">
                  {gameState === "menu" ? "✈️ DC River Ride" : gameOverReason === "fuel" ? "⛽ Sem combustivel!" : gameOverReason === "crash" ? "💥 Bateu nas margens!" : gameOverReason === "enemy" ? "💥 Inimigo te derrubou!" : "💥 Fim de jogo!"}
                </div>
                <div className="riverride-overlay-sub">
                  {gameState === "menu" ? (
                    <>Voe pelo rio, atire nos inimigos e colete combustivel!<br />
                    ⬆⬇ Sobe/Desce | ESPACO Atira<br />
                    🟢 Posto DC = +50% combustivel | 🔴 Minas = -30% combustivel<br />
                    🛡️ Escudo | ⚡ Tiro rapido | 💥 Bomba<br />
                    🌉 Pontes = troca de fase | 🔥 Combo x3+ = bonus combustivel<br />
                    👻 Fantasma DC compete com voce!</>
                  ) : (
                    <>
                      Distancia: <strong>{score}m</strong> | Recorde: <strong>{highScore}m</strong><br />
                      Fase alcancada: <strong>{phase}</strong> | Combo max: <strong>x{combo}</strong><br />
                      {score >= highScore && score > 0 ? <span className="riverride-newrec">🎉 Novo recorde!</span> : null}
                      <br />
                      <span style={{ color: "#fdba74" }}>👻 Fantasma DC venceu por {ghostGap}m!</span>
                    </>
                  )}
                </div>

                {gameState === "gameover" && (
                  <div className="riverride-namearea">
                    <label>Qual seu primeiro nome?</label>
                    <input
                      id="river-name-input"
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      maxLength={15}
                      placeholder="ex: Joao"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                <button className="riverride-btn" onClick={handleStart}>
                  {gameState === "menu" ? "▶ Jogar" : "↻ Tentar de novo"}
                </button>
                <div className="riverride-hint">⬆ Sobe | ⬇ Desce | ESPACO Atira | 🟢 +combustivel | 🔴 Minas</div>
              </div>
            )}
          </div>

          {gameState === "playing" && (
            <div className="touch-controls">
              <button
                className="touch-btn touch-btn-up"
                onTouchStart={(e) => { e.preventDefault(); upStart(); }}
                onTouchEnd={(e) => { e.preventDefault(); upEnd(); }}
                onMouseDown={upStart} onMouseUp={upEnd} onMouseLeave={upEnd}
              >⬆ SOBE</button>
              <button
                className="touch-btn touch-btn-shoot"
                onTouchStart={(e) => { e.preventDefault(); shootStart(); }}
                onTouchEnd={(e) => { e.preventDefault(); shootEnd(); }}
                onMouseDown={shootStart} onMouseUp={shootEnd} onMouseLeave={shootEnd}
              >🔥 ATIRAR</button>
              <button
                className="touch-btn touch-btn-down"
                onTouchStart={(e) => { e.preventDefault(); downStart(); }}
                onTouchEnd={(e) => { e.preventDefault(); downEnd(); }}
                onMouseDown={downStart} onMouseUp={downEnd} onMouseLeave={downEnd}
              >⬇ DESCE</button>
            </div>
          )}

          <div className="legend-row">
            <div className="legend-item">
              <div className="legend-dot fuel" />
              <span>Posto DC = +50% combustivel</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot mine" />
              <span>Minas = -30% combustivel</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon">🌉</span>
              <span>Pontes = nova fase</span>
            </div>
            <div className="legend-item">
              <span>🛡️ ⚡ 💥 Power-ups</span>
            </div>
            <div className="legend-item">
              <span>👻 Fantasma DC</span>
            </div>
          </div>

          <div className="riverride-quotebar">
            <div className={`riverride-quote ${quoteVisible ? "visible" : ""}`}>
              {quoteText}
            </div>
          </div>

          <div className="riverride-ranking">
            <div className="riverride-ranking-title">🏆 TOP 10 RIVER RIDERS</div>
            <ul className="riverride-ranking-list">
              {ranking.length === 0 ? (
                <li className="riverride-ranking-empty">Ninguem jogou ainda. Seja o primeiro! ✈️</li>
              ) : (
                ranking.map((entry, i) => (
                  <li key={i} className={`riverride-ranking-item rank-${i + 1}`}>
                    <span className={`riverride-rank-pos ${i < 3 ? `pos-${i + 1}` : ""}`}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </span>
                    <span className="riverride-rank-name">{entry.name}</span>
                    <span className="riverride-rank-score">{entry.score}m</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="riverride-footer">
            <span>DCTECH — SOLUCOES EM SISTEMAS</span>
            <a href="#contato">Precisa de um dev? →</a>
          </div>
        </div>
      </div>
    </section>
  );
}
