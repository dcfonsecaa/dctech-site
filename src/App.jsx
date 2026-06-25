import { useEffect, useState } from "react";
import "./App.css";

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
    icon: "bi-people-fill",
    tag: "Marketplace",
    title: "Resolve Aí",
    desc: "Plataforma de contratação de serviços que conecta prestadores e clientes com filtros por habilidade, preço e localização. Sistema de escrow integrado.",
    link: "#",
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
    icon: "bi-layout-text-window",
    tag: "Gestão",
    title: "Seu projeto aqui",
    desc: "Desenvolvo sistemas de gestão, dashboards e automações para negócios que precisam organizar processos internos de forma digital.",
    link: "#contato",
    linkLabel: "Vamos conversar?",
  },
];

const STATS = [
  { number: "2+",   label: "Projetos entregues" },
  { number: "React", label: "Frontend" },
  { number: "Java",  label: "Backend" },
  { number: "24h",  label: "Tempo de resposta" },
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
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="dc-hero">
      <div className="container">
        <div className="row align-items-center g-5">
          {/* Left */}
          <div className="col-lg-6">
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
          <div className="col-lg-6">
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
                  <div className="metric-box"><small>Projetos</small><strong>2+</strong></div>
                  <div className="metric-box"><small>Ambiente</small><strong>Web</strong></div>
                  <div className="metric-box highlight"><small>Status</small><strong>Ativo</strong></div>
                </div>
                {[
                  { icon: "bi-cart3",         name: "Resolve Aí",          sub: "Marketplace de serviços" },
                  { icon: "bi-car-front",     name: "Clássicos Via 2R",    sub: "Classificados automotivos" },
                  { icon: "bi-bar-chart-line",name: "Próximo projeto",      sub: "Pode ser o seu" },
                ].map((s) => (
                  <div className="sys-item" key={s.name}>
                    <div className="sys-icon"><i className={`bi ${s.icon}`}></i></div>
                    <div className="sys-info">
                      <strong>{s.name}</strong>
                      <span>{s.sub}</span>
                    </div>
                    <span className="sys-badge">
                      {s.name === "Próximo projeto" ? "Em breve" : "Ativo"}
                    </span>
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
  return (
    <section className="stats-bar">
      <div className="container">
        <div className="row justify-content-center text-center g-4">
          {STATS.map((s) => (
            <div className="col-6 col-md-3" key={s.label}>
              <div className="stat-item">
                <span className="stat-number">{s.number}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─── */
function Features() {
  return (
    <section className="dc-features" id="diferenciais">
      <div className="container">
        <div className="row mb-5">
          <div className="col-lg-7">
            <span className="section-label">Diferenciais</span>
            <h2 className="section-title">Por que trabalhar comigo?</h2>
            <p className="section-desc">
              Cada projeto é tratado como único. Falo direto com o cliente,
              entendo o problema real e entrego software que resolve — sem enrolação.
            </p>
          </div>
        </div>
        <div className="row g-4">
          {FEATURES.map((f) => (
            <div className="col-md-6 col-lg-4" key={f.title}>
              <div className="feat-card">
                <div className="feat-icon"><i className={`bi ${f.icon}`}></i></div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Projects ─── */
function Projects() {
  return (
    <section className="dc-systems" id="projetos">
      <div className="container">
        <div className="row mb-5">
          <div className="col-lg-7">
            <span className="section-label">Projetos</span>
            <h2 className="section-title">O que já desenvolvi</h2>
            <p className="section-desc">
              Projetos reais, construídos do zero por mim — do banco de dados ao deploy.
            </p>
          </div>
        </div>
        <div className="row g-4">
          {SYSTEMS.map((s) => (
            <div className="col-md-6 col-lg-4" key={s.title}>
              <div className="sys-card">
                <div className="sys-card-thumb">
                  <i className={`bi ${s.icon}`}></i>
                </div>
                <div className="sys-card-body">
                  <div className="sys-card-tag">{s.tag}</div>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                  <a
                    href={s.link}
                    className="sys-link"
                    target={s.link.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                  >
                    {s.linkLabel} <i className="bi bi-arrow-right"></i>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── About ─── */
function About() {
  return (
    <section className="dc-about" id="sobre">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-5 text-center">
            <img
              src="/denis.jpg"
              alt="Denis Cezar Fonseca"
              className="about-photo"
            />
          </div>
          <div className="col-lg-7">
            <span className="section-label">Sobre mim</span>
            <h2 className="section-title">Denis Cezar Fonseca</h2>
            <p className="section-desc" style={{ maxWidth: "100%" }}>
              Sou desenvolvedor full-stack especializado na criação de sistemas web, landing pages e soluções digitais personalizadas. Trabalho com React, Java, Python, Supabase e Vercel, desenvolvendo aplicações modernas, responsivas e escaláveis.

Sou graduado em Administração, Mestre em Planejamento e Análise de Políticas Públicas e atualmente curso Sistemas de Informação na Universidade Federal de Uberlândia (UFU). Minha formação combina visão estratégica e conhecimento técnico para desenvolver soluções que geram resultados reais para empresas e instituições.


            </p>
            <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.7, marginTop: 12 }}>
              Cada projeto começa com uma conversa honesta sobre o seu problema.
              Não cobro por reunião — entrego resultado.
            </p>
            <div className="kpi-grid">
              {STACK.map((s) => (
                <div className="kpi-box" key={s.tech}>
                  <strong>{s.tech}</strong>
                  <span>{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA / Contact ─── */
function Cta() {
  const contacts = [
    { icon: "bi-whatsapp", label: "Chamar no WhatsApp",       href: "https://wa.me/553496459701" },
    { icon: "bi-envelope",  label: "denis@dctech.com.br",      href: "mailto:denis-fonseca@hotmail.com" },
    { icon: "bi-linkedin",  label: "LinkedIn",                 href: "https://linkedin.com/in/denis-fonseca" },
  ];

  return (
    <section className="dc-cta" id="contato">
      <div className="container">
        <div className="cta-inner">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <span className="section-label">Contato</span>
              <h2 className="section-title">Tem um projeto em mente?</h2>
              <p className="section-desc">
                Me conta o que você precisa. Respondo em até 24 horas com
                uma análise honesta e um orçamento claro — sem enrolação.
              </p>
            </div>
            <div className="col-lg-5">
              <div className="cta-links">
                {contacts.map((c) => (
                  <a key={c.label} href={c.href} className="cta-link-item" target="_blank" rel="noreferrer">
                    <span className="cta-icon"><i className={`bi ${c.icon}`}></i></span>
                    {c.label}
                    <i className="bi bi-chevron-right cta-chevron"></i>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <footer className="dc-footer">
      <div className="container">
        <div className="row align-items-center justify-content-between g-3">
          <div className="col-auto">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src="/dctech-logo.png" alt="DCTECH" className="logo-footer" />
              <div className="brand-text">
                <strong></strong>
                <small></small>
              </div>
            </div>
          </div>
          <div className="col-auto d-flex gap-4">
            {["sobre", "projetos", "diferenciais", "contato"].map((id) => (
              <button
                key={id}
                className="footer-link border-0 bg-transparent"
                onClick={() => scrollTo(id)}
                style={{ textTransform: "capitalize" }}
              >
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="footer-copy">
          © {new Date().getFullYear()} DCTECH · Denis Cezar Fonseca · Uberlândia/MG
        </div>
      </div>
    </footer>
  );
}

/* ─── App ─── */
export default function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <StatsBar />
      <Features />
      <Projects />
      <About />
      <Cta />
      <Footer />
    </>
  );
}
