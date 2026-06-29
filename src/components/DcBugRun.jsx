import { useEffect, useRef, useState, useCallback } from "react";

const QUOTES = [
  { text: '"Isso é mais rápido que um MVP meu."', author: "— Denis" },
  { text: '"Deploy em produção sem testar? Só no jogo."', author: "— Denis" },
  { text: '"Meu código real é mais estável que isso."', author: "— Denis" },
  { text: '"Já vi bug pior em sistema de cliente."', author: "— Denis" },
  { text: '"Se fosse React, renderizava mais liso."', author: "— Denis" },
  { text: '"Java não deixa cair assim, hein?"', author: "— Denis" },
  { text: '"Supabase aguenta mais que esse bug."', author: "— Denis" },
  { text: '"Vercel deploya em segundos. Esse bug, nem tanto."', author: "— Denis" },
  { text: '"24h de resposta. O bug não espera."', author: "— Denis" },
  { text: '"Sob medida, igual os sistemas que entrego."', author: "— Denis" },
];

// Obstáculos com altura variada: alguns no chão, alguns voando
const OBSTACLE_TYPES = [
  { emoji: "❌", width: 24, height: 24, flying: false },
  { emoji: "⚠️", width: 24, height: 24, flying: false },
  { emoji: "💥", width: 26, height: 26, flying: false },
  { emoji: "🐛", width: 24, height: 24, flying: false },
  { emoji: "🔥", width: 24, height: 24, flying: false },
  { emoji: "🦟", width: 22, height: 22, flying: true },  // voa baixo
  { emoji: "🛸", width: 26, height: 26, flying: true },  // voa alto
];

const GROUND_Y = 164;

export default function DcBugRun() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem("dcbug_high") || "0"); }
    catch { return 0; }
  });
  const [gameState, setGameState] = useState("menu");
  const [playerName, setPlayerName] = useState("");
  const [ranking, setRanking] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dcbug_ranking") || "[]"); }
    catch { return []; }
  });
  const [quoteVisible, setQuoteVisible] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [jumpsLeft, setJumpsLeft] = useState(2); // HUD duplo pulo

  const gameRef = useRef({
    running: false,
    score: 0,
    speed: 4,
    frame: 0,
    obstacles: [],
    player: { x: 60, y: 0, vy: 0, grounded: false, width: 28, height: 28, jumpsLeft: 2 },
    animId: null,
    lastQuoteIdx: -1,
    // Partículas de fundo
    stars: Array.from({ length: 40 }, () => ({
      x: Math.random() * 720,
      y: Math.random() * 140,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.5 + 0.2,
    })),
  });

  const highScoreRef = useRef(highScore);
  useEffect(() => { highScoreRef.current = highScore; }, [highScore]);

  const saveRanking = useCallback((newRanking) => {
    setRanking(newRanking);
    try { localStorage.setItem("dcbug_ranking", JSON.stringify(newRanking)); }
    catch {}
  }, []);

  const addToRanking = useCallback((name, scoreVal) => {
    const newEntry = { name: name.trim() || "Anônimo", score: scoreVal, date: new Date().toISOString() };
    setRanking(prev => {
      const updated = [...prev, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
      try { localStorage.setItem("dcbug_ranking", JSON.stringify(updated)); }
      catch {}
      return updated;
    });
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

  const drawBackground = useCallback((ctx, canvas, frame, speed) => {
    // Gradiente de fundo
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#0a0e1a");
    grad.addColorStop(1, "#0f1729");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Estrelas animadas
    const g = gameRef.current;
    ctx.save();
    g.stars.forEach(star => {
      star.x -= star.speed * speed * 0.3;
      if (star.x < 0) {
        star.x = canvas.width + 2;
        star.y = Math.random() * 140;
      }
      ctx.globalAlpha = star.opacity;
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Grid de fundo
    ctx.strokeStyle = "rgba(59, 130, 246, 0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
  }, []);

  const drawGround = useCallback((ctx, canvas, frame, speed) => {
    ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 1);
    ctx.lineTo(canvas.width, GROUND_Y + 1);
    ctx.stroke();

    const offset = (frame * speed) % 20;
    ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
    for (let i = -offset; i < canvas.width; i += 20) {
      ctx.fillRect(i, GROUND_Y + 6, 3, 3);
    }
  }, []);

  const drawPlayer = useCallback((ctx, player) => {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    // Sombra no chão quando no ar
    if (!player.grounded) {
      const shadowY = GROUND_Y - (player.y + player.height / 2) + 8;
      const shadowScale = Math.max(0.2, 1 - (GROUND_Y - player.y - player.height) / 120);
      ctx.save();
      ctx.globalAlpha = 0.18 * shadowScale;
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.ellipse(0, shadowY, 14 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Corpo
    ctx.fillStyle = player.jumpsLeft === 0 ? "#f59e0b" : "#34d399"; // amarelo no 2º pulo
    ctx.beginPath();
    ctx.roundRect(-12, -10, 24, 20, 6);
    ctx.fill();

    // Olhos
    ctx.fillStyle = "#0a0e1a";
    ctx.beginPath();
    ctx.arc(-5, -4, 3, 0, Math.PI * 2);
    ctx.arc(5, -4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Antenas
    ctx.strokeStyle = player.jumpsLeft === 0 ? "#f59e0b" : "#34d399";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -10); ctx.lineTo(-10, -18);
    ctx.moveTo(6, -10);  ctx.lineTo(10, -18);
    ctx.stroke();

    // Brilho
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(-3, 4, 2, 0, Math.PI * 2);
    ctx.arc(4, 3, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, []);

  const drawObstacles = useCallback((ctx, obstacles) => {
    obstacles.forEach(obs => {
      ctx.font = `${obs.height}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obs.emoji, obs.x + obs.width / 2, obs.y + obs.height / 2);
    });
  }, []);

  const gameOver = useCallback(() => {
    const g = gameRef.current;
    g.running = false;
    cancelAnimationFrame(g.animId);
    setGameState("gameover");
    if (g.score > highScoreRef.current) {
      setHighScore(g.score);
      try { localStorage.setItem("dcbug_high", g.score.toString()); }
      catch {}
    }
    setQuoteText('"Até os melhores devs encontram bugs. Quer um sistema que funcione?" — Denis');
    setQuoteVisible(true);
  }, []);

  const update = useCallback(() => {
    const g = gameRef.current;
    if (!g.running) return;

    g.frame++;
    const player = g.player;
    player.vy += 0.45;
    player.y += player.vy;

    if (player.y + player.height >= GROUND_Y) {
      player.y = GROUND_Y - player.height;
      player.vy = 0;
      player.grounded = true;
      player.jumpsLeft = 2; // reset duplo pulo ao tocar o chão
      setJumpsLeft(2);
    } else {
      player.grounded = false;
    }

    g.speed = 4 + Math.floor(g.score / 500) * 0.5;

    const canvas = canvasRef.current;
    if (canvas && (g.obstacles.length === 0 || g.obstacles[g.obstacles.length - 1].x < canvas.width - 200)) {
      if (Math.random() < 0.02) {
        const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];

        // Calcular posição Y baseado se é voador ou não
        let obsY;
        if (type.flying) {
          // voa baixo: altura de 1 pulo; voa alto: altura de 2 pulos
          const flyLow  = GROUND_Y - type.height - 44;  // precisa 1 pulo
          const flyHigh = GROUND_Y - type.height - 90;  // precisa 2 pulos
          obsY = type.emoji === "🛸" ? flyHigh : flyLow;
        } else {
          obsY = GROUND_Y - type.height + 4;
        }

        g.obstacles.push({
          x: canvas.width + 120 + Math.random() * 80,
          y: obsY,
          width: type.width,
          height: type.height,
          emoji: type.emoji,
          flying: type.flying,
          passed: false,
        });
      }
    }

    let collided = false;
    g.obstacles.forEach(obs => {
      obs.x -= g.speed;
      if (!obs.passed && obs.x + obs.width < player.x) {
        obs.passed = true;
        g.score += 10;
        setScore(g.score);
        if (g.score % 100 === 0 && g.score > 0) showQuote();
      }
      if (
        !collided &&
        player.x < obs.x + obs.width - 4 &&
        player.x + player.width > obs.x + 4 &&
        player.y < obs.y + obs.height - 4 &&
        player.y + player.height > obs.y + 4
      ) {
        collided = true;
      }
    });

    g.obstacles = g.obstacles.filter(obs => obs.x + obs.width >= -50);

    if (collided) gameOver();
  }, [showQuote, gameOver]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const g = gameRef.current;

    drawBackground(ctx, canvas, g.frame, g.speed);
    drawGround(ctx, canvas, g.frame, g.speed);
    drawObstacles(ctx, g.obstacles);
    drawPlayer(ctx, g.player);

    if (g.running) {
      g.animId = requestAnimationFrame(() => { update(); draw(); });
    }
  }, [drawBackground, drawGround, drawObstacles, drawPlayer, update]);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.running = true;
    g.score = 0;
    g.speed = 4;
    g.frame = 0;
    g.obstacles = [];
    g.player.y = GROUND_Y - g.player.height;
    g.player.vy = 0;
    g.player.grounded = false;
    g.player.jumpsLeft = 2;
    setScore(0);
    setJumpsLeft(2);
    setGameState("playing");
    setQuoteVisible(false);
    setTimeout(() => showQuote(), 500);
    draw();
  }, [showQuote, draw]);

  const handleStart = useCallback(() => {
    if (gameState === "gameover" && playerName.trim()) {
      addToRanking(playerName, gameRef.current.score);
    }
    setPlayerName("");
    startGame();
  }, [gameState, playerName, addToRanking, startGame]);

  const jump = useCallback(() => {
    const g = gameRef.current;
    if (!g.running) return;
    if (g.player.jumpsLeft > 0) {
      g.player.vy = -9;
      g.player.grounded = false;
      g.player.jumpsLeft -= 1;
      setJumpsLeft(g.player.jumpsLeft);
    }
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (gameState !== "playing") {
          if (gameState === "gameover" && document.activeElement?.id === "bug-name-input") return;
          handleStart();
        } else {
          jump();
        }
      }
      if (e.code === "Enter" && gameState === "gameover") {
        handleStart();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [gameState, handleStart, jump]);

  const onCanvasInteract = useCallback(() => {
    if (gameState !== "playing") handleStart();
    else jump();
  }, [gameState, handleStart, jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const g = gameRef.current;
    g.player.y = GROUND_Y - g.player.height;
    drawBackground(ctx, canvas, 0, 4);
    drawGround(ctx, canvas, 0, 4);
    drawPlayer(ctx, g.player);
  }, [drawBackground, drawGround, drawPlayer]);

  useEffect(() => () => { cancelAnimationFrame(gameRef.current.animId); }, []);

  return (
    <section className="dc-bugrun">
      <div className="container">
        <div className="bugrun-card">
          <div className="bugrun-header">
            <div className="bugrun-title">
              <span>🐛</span> DC BUG RUN
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* HUD duplo pulo */}
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {[0, 1].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: i < jumpsLeft ? "#34d399" : "rgba(100,116,139,0.3)",
                    transition: "background 0.15s",
                  }} />
                ))}
              </div>
              <span className="bugrun-score">{score.toString().padStart(4, "0")}</span>
              <span className="bugrun-rec">REC: {highScore.toString().padStart(4, "0")}</span>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={720}
            height={200}
            className="bugrun-canvas"
            onClick={onCanvasInteract}
            onTouchStart={(e) => { e.preventDefault(); onCanvasInteract(); }}
          />

          {gameState !== "playing" && (
            <div className="bugrun-overlay">
              <div className="bugrun-overlay-title">
                {gameState === "menu" ? "🐛 DC Bug Run" : "💥 Game Over!"}
              </div>
              <div className="bugrun-overlay-sub">
                {gameState === "menu" ? (
                  <>Ajude o bug a fugir dos erros de produção!<br />Toque 2x para duplo pulo. Cuidado com os voadores!</>
                ) : (
                  <>
                    Score: <strong>{score}</strong> | Recorde: <strong>{highScore}</strong><br />
                    {score >= highScore && score > 0 ? <span className="bugrun-newrec">🎉 Novo recorde!</span> : null}
                  </>
                )}
              </div>

              {gameState === "gameover" && (
                <div className="bugrun-namearea">
                  <label>Qual seu primeiro nome?</label>
                  <input
                    id="bug-name-input"
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
              <div className="bugrun-hint">Espaço / Clique / Toque — 2x para duplo pulo</div>
            </div>
          )}

          <div className="bugrun-quotebar">
            <div className={`bugrun-quote ${quoteVisible ? "visible" : ""}`}>
              {quoteText}
            </div>
          </div>

          <div className="bugrun-ranking">
            <div className="bugrun-ranking-title">🏆 TOP 10 BUG RUNNERS</div>
            <ul className="bugrun-ranking-list">
              {ranking.length === 0 ? (
                <li className="bugrun-ranking-empty">Ninguém jogou ainda. Seja o primeiro! 🐛</li>
              ) : (
                ranking.map((entry, i) => (
                  <li key={i} className={`bugrun-ranking-item rank-${i + 1}`}>
                    <span className={`bugrun-rank-pos ${i < 3 ? `pos-${i + 1}` : ""}`}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </span>
                    <span className="bugrun-rank-name">{entry.name}</span>
                    <span className="bugrun-rank-score">{entry.score.toString().padStart(4, "0")}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="bugrun-footer">
            <span>DCTECH — SOLUÇÕES EM SISTEMAS</span>
            <a href="#contato">Precisa de um dev? →</a>
          </div>
        </div>
      </div>
    </section>
  );
}
