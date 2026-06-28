import { useEffect, useRef, useState } from "react";
import "./App.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Analytics } from "@vercel/analytics/react";
import DcBugRun from "./components/DcBugRun";

gsap.registerPlugin(ScrollTrigger);

/* ─── Data ─── */
const FEATURES = [
  { icon: "bi-code-slash",       title: "Desenvolvimento sob medida",  desc: "Cada sistema é construído para o seu processo específico. Nada de plataformas prontas com limitações." },
  { icon: "bi-phone",            title: "100% responsivo",             desc: "Funciona perfeitamente em computador, tablet e celular — sem perda de funcionalidade ou usabilidade." },
  { icon: "bi-rocket-takeoff",   title: "Entrega rápida",              desc: "MVPs funcionais em semanas, não meses. Você começa a usar o sistema enquanto ele ainda evolui." },
  { icon: "bi-shield-check",     title: "Seguro e confiável",          desc: "Autenticação, controle de acesso e dados protegidos. Infraestrutura moderna em nuvem." },
  { icon: "bi-graph-up-arrow",   title: "Escalável",                   desc: "Começa pequeno e cresce com o negócio. Arquitetura preparada para volume crescente." },
  { icon: "bi-headset",          title: "Suporte próximo",             desc: "Atendimento direto comigo. Sem fila de suporte ou chamados perdidos." },
];

const SYSTEMS = [
  {
    icon: "bi-robot",
    tag: "IA Generativa",
    title: "Claud.ia",
    desc: "Assistente de programação com IA voltado para o público brasileiro. Gera código, explica erros e guia projetos inteiros em português — do iniciante ao desenvolvedor experiente.",
    link: "https://claudia-two-zeta.vercel.app/",
    linkLabel: "Ver projeto",
  },
  {
    icon: "bi-car-front-fill",
    tag: "Classificados",
    title: "Clássicos Via 2R",
    desc: "Marketplace curado de veículos clássicos e antigos. Anúncios com fotos, filtros por marca e período, e painel do anunciante completo.",
    link: "https://classicosvia2r.com.br",
    linkLabel: "Ver projeto",
  },
  {
    icon: "bi-people-fill",
    tag: "Marketplace",
    title: "Resolve Aí",
    desc: "Plataforma que conecta quem tem um problema a quem tem tempo e habilidade para resolver. Filtros por habilidade, localização e sistema de contratação integrado.",
    link: "https://resolve-ai-mu.vercel.app/",
    linkLabel: "Ver projeto",
  },
];

const STATS = [
  { number: "3+",    label: "Projetos entregues" },
  { number: "React", label: "Frontend" },
  { number: "Java",  label: "Backend" },
  { number: "24h",   label: "Tempo de resposta" },
];

const STACK = [
  { tech: "React",     desc: "Frontend moderno e responsivo" },
  { tech: "Java",      desc: "Backend robusto e escalável" },
  { tech: "Supabase",  desc: "Banco de dados em tempo real" },
  { tech: "Vercel",    desc: "Deploy contínuo e rápido" },
];

/* ─── Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <nav className={`dc-nav navbar navbar-expand-lg${scrolled ? " scrolled" : ""}`}>
      <div className="container">
        <a className="navbar-brand" href="#">
          <img src="/dctech-logo.png" alt="DCTECH" className="logo-navbar" />
        </a>

        <button className="navbar-toggler border-0" onClick={() => setOpen(!open)}>
          <span style={{ color: "#fff", fontSize: 22 }}>
            <i className={`bi ${open ? "bi-x" : "bi-list"}`}></i>
          </span>
        </button>

        <div className={`collapse navbar-collapse${open ? " show" : ""}`}>
          <ul className="navbar-nav mx-auto gap-1">
            {["sobre", "projetos", "diferenciais", "contato"].map((id) => (
              <li className="nav-item" key={id}>
                <button
                  className="nav-link border-0 bg-transparent"
                  onClick={() => scrollTo(id)}
                  style={{ textTransform: "capitalize" }}
                >
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </button>
              </li>
            ))}
          </ul>
          <button className="btn btn-demo ms-lg-3 mt-3 mt-lg-0" onClick={() => scrollTo("contato")}>
            Vamos conversar?
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero ─── */
function Hero() {
  const scrollTo  = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const leftRef   = useRef(null);
  const rightRef  = useRef(null);
  const canvasRef = useRef(null);

  /* Three.js background */
  useEffect(() => {
    let animId;
    let renderer, scene, camera, points;

    const init = async () => {
      const THREE = await import("three");

      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);

      scene  = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, canvasRef.current.offsetWidth / canvasRef.current.offsetHeight, 0.1, 1000);
      camera.position.z = 5;

      const count     = 1600;
      const positions = new Float32Array(count * 3);
      const colors    = new Float32Array(count * 3);

      const cA = new THREE.Color("#3b82f6");
      const cB = new THREE.Color("#0057FF");
      const cC = new THREE.Color("#60a5fa");

      for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 22;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
        const c = Math.random() < 0.5 ? cA : Math.random() < 0.7 ? cB : cC;
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.PointsMaterial({ size: 0.055, vertexColors: true, transparent: true, opacity: 0.75, sizeAttenuation: true });
      points = new THREE.Points(geo, mat);
      scene.add(points);

      const lineMat = new THREE.LineBasicMaterial({ color: 0x0057FF, transparent: true, opacity: 0.06 });
      for (let i = 0; i < 25; i++) {
        const lg = new THREE.BufferGeometry();
        const x = (Math.random() - 0.5) * 20, y = (Math.random() - 0.5) * 20;
        lg.setFromPoints([
          new THREE.Vector3(x, y, (Math.random() - 0.5) * 8),
          new THREE.Vector3(x + (Math.random() - 0.5) * 5, y + (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 8),
        ]);
        scene.add(new THREE.Line(lg, lineMat));
      }

      let mouseX = 0, mouseY = 0;
      const onMouse = (e) => {
        mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener("mousemove", onMouse);

      const onResize = () => {
        if (!renderer || !canvasRef.current) return;
        camera.aspect = canvasRef.current.offsetWidth / canvasRef.current.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
      };
      window.addEventListener("resize", onResize);

      let t = 0;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        t += 0.01;
        if (points) {
          points.rotation.y = t * 0.04 + mouseX * 0.12;
          points.rotation.x = t * 0.02 + mouseY * 0.06;
          points.position.y = Math.sin(t * 0.3) * 0.12;
        }
        renderer.render(scene, camera);
      };
      animate();

      return () => {
        window.removeEventListener("mousemove", onMouse);
        window.removeEventListener("resize", onResize);
      };
    };

    let cleanup;
    init().then((fn) => { cleanup = fn; });

    return () => {
      cancelAnimationFrame(animId);
      if (cleanup) cleanup();
      if (renderer) renderer.dispose();
    };
  }, []);

  /* GSAP animations */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(leftRef.current.children, {
        opacity: 0, y: 40, duration: 0.8, stagger: 0.15, ease: "power3.out", delay: 0.2,
      });
      gsap.from(rightRef.current, {
        opacity: 0, x: 60, duration: 0.9, ease: "power3.out", delay: 0.5,
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="dc-hero" style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          zIndex: 0, pointerEvents: "none",
        }}
      />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div className="row align-items-center g-5">
          {/* Left */}
          <div className="col-lg-6" ref={leftRef}>
            <div className="hero-eyebrow">
              <i className="bi bi-circle-fill" style={{ fontSize: 10 }}></i>
              Desenvolvedor freelancer
            </div>
            <h1>
              Transformo seu processo em um{" "}
              <span className="accent">sistema que funciona.</span>
            </h1>
            <p className="hero-desc">
              Sou Denis, desenvolvedor full-stack com foco em sistemas web sob medida.
              Entrego projetos reais — do zero até a produção — com atenção ao detalhe
              e comunicação direta.
            </p>
            <div className="hero-actions">
              <button className="btn-cta-primary" onClick={() => scrollTo("projetos")}>
                Ver meus projetos <i className="bi bi-arrow-right"></i>
              </button>
              <button className="btn-cta-ghost" onClick={() => scrollTo("contato")}>
                Falar comigo
              </button>
            </div>
            <div className="hero-trust">
              {["Entrega no prazo", "Comunicação direta", "100% web, sem instalação"].map((t) => (
                <div className="trust-item" key={t}>
                  <i className="bi bi-check-circle-fill"></i> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Dashboard */}
          <div className="col-lg-6" ref={rightRef}>
            <div className="dashboard-panel">
              <div className="panel-header">
                <div className="panel-header-text">
                  <small>Portfólio DCTECH</small>
                  <strong>Projetos em operação</strong>
                </div>
                <span className="badge-online">● Online</span>
              </div>
              <div className="mock-screen">
                <div className="mock-dots">
                  <span /><span /><span />
                </div>
                <div className="metric-row">
                  <div className="metric-box"><small>Projetos</small><strong>3+</strong></div>
                  <div className="metric-box"><small>Ambiente</small><strong>Web</strong></div>
                  <div className="metric-box highlight"><small>Status</small><strong>Ativo</strong></div>
                </div>
                {[
                  { icon: "bi-robot",      name: "Claud.ia",         sub: "Assistente IA para devs" },
                  { icon: "bi-car-front",  name: "Clássicos Via 2R", sub: "Classificados automotivos" },
                  { icon: "bi-people",     name: "Resolve Aí",       sub: "Marketplace de serviços" },
                ].map((s) => (
                  <div className="sys-item" key={s.name}>
                    <div className="sys-icon"><i className={`bi ${s.icon}`}></i></div>
                    <div className="sys-info">
                      <strong>{s.name}</strong>
                      <span>{s.sub}</span>
                    </div>
                    <span className="sys-badge">Ativo</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats Bar ─── */
function StatsBar() {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".stat-item", {
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
        },
        opacity: 0,
        y: 30,
        duration: 0.6,
