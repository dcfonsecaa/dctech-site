import { useEffect, useState } from "react";
import "./App.css";

/* ─── Data ─── */
const FEATURES = [
  { icon: "bi-code-slash",       title: "Desenvolvimento sob medida",  desc: "Cada sistema é construído para o seu processo específico. Nada de plataformas prontas com limitações." },
  { icon: "bi-phone",            title: "100% responsivo",             desc: "Funciona perfeitamente em computador, tablet e celular — sem perda de funcionalidade ou usabilidade." },
  { icon: "bi-rocket-takeoff",   title: "Entrega rápida",              desc: "MVPs funcionais em semanas, não meses. Você começa a usar o sistema enquanto ele ainda evolui." },
  { icon: "bi-shield-check",     title: "Seguro e confiável",          desc: "Autenticação, controle de acesso e dados protegidos. Infraestrutura moderna em nuvem." },
  { icon: "bi-graph-up-arrow",   title: "Escalável",                   desc: "Começa pequeno e cresce com o negócio. Arquitetura preparada para volume crescente." },
  { icon: "bi-headset",          title: "Suporte próximo",             desc: "Atendimento direto com o desenvolvedor. Sem fila de suporte ou chamados perdidos." },
];

const SYSTEMS = [
  {
    icon: "bi-people-fill",
    tag: "Marketplace",
    title: "Resolve Aí",
    desc: "Plataforma de contratação de serviços que conecta prestadores e clientes com filtros por habilidade, preço e localização. Sistema de escrow integrado.",
    link: "#",
    linkLabel: "Ver sistema",
  },
  {
    icon: "bi-car-front-fill",
    tag: "Classificados",
    title: "Clássicos Via 2R",
    desc: "Marketplace curado de veículos clássicos e antigos. Anúncios com fotos, filtros por marca e período, e painel do anunciante completo.",
    link: "https://classicosvia2r.com.br",
    linkLabel: "Ver sistema",
  },
  {
    icon: "bi-layout-text-window",
    tag: "Gestão",
    title: "Sistema personalizado",
    desc: "Desenvolvemos sistemas de gestão, dashboards e automações para empresas que precisam organizar processos internos de forma digital.",
    link: "#contato",
    linkLabel: "Solicitar proposta",
  },
];

const STATS = [
  { number: "3+",   label: "Sistemas entregues" },
  { number: "100%", label: "Projetos no prazo" },
  { number: "Web",  label: "Sem instalação local" },
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
          <div className="brand-logo">DC</div>
          <div className="brand-text">
            <strong>DCTECH</strong>
            <small>Soluções em Sistemas</small>
          </div>
        </a>

        <button className="navbar-toggler border-0" onClick={() => setOpen(!open)}>
          <span style={{ color: "#fff", fontSize: 22 }}>
            <i className={`bi ${open ? "bi-x" : "bi-list"}`}></i>
          </span>
        </button>

        <div className={`collapse navbar-collapse${open ? " show" : ""}`}>
          <ul className="navbar-nav mx-auto gap-1">
            {["sobre", "sistemas", "diferenciais", "contato"].map((id) => (
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
            Solicitar demonstração
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
              Software sob medida
            </div>
            <h1>
              Transformamos processos em{" "}
              <span className="accent">sistemas inteligentes.</span>
            </h1>
            <p className="hero-desc">
              Desenvolvemos soluções web personalizadas que automatizam, organizam e escalam
              o seu negócio — do planejamento à entrega em produção.
            </p>
            <div className="hero-actions">
              <button className="btn-cta-primary" onClick={() => scrollTo("sistemas")}>
                Conhecer sistemas <i className="bi bi-arrow-right"></i>
              </button>
              <button className="btn-cta-ghost" onClick={() => scrollTo("contato")}>
                Falar com consultor
              </button>
            </div>
            <div className="hero-trust">
              {["Entrega ágil", "Suporte contínuo", "100% web, sem instalação"].map((t) => (
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
                  <small>Vitrine DCTECH</small>
                  <strong>Soluções em operação</strong>
                </div>
                <span className="badge-online">● Online</span>
              </div>
              <div className="mock-screen">
                <div className="mock-dots">
                  <span /><span /><span />
                </div>
                <div className="metric-row">
                  <div className="metric-box"><small>Sistemas ativos</small><strong>3</strong></div>
                  <div className="metric-box"><small>Ambiente</small><strong>Web</strong></div>
                  <div className="metric-box highlight"><small>Foco</small><strong>Gestão</strong></div>
                </div>
                {[
                  { icon: "bi-cart3",          name: "Marketplace de serviços",   sub: "Conexão prestador ↔ cliente" },
                  { icon: "bi-car-front",       name: "Classificados automotivos", sub: "Veículos clássicos e antigos" },
                  { icon: "bi-bar-chart-line",  name: "Sistema de gestão",         sub: "Dashboard e relatórios" },
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
            <h2 className="section-title">Por que escolher a DCTECH?</h2>
            <p className="section-desc">
              Desenvolvemos cada projeto do zero, com foco total no problema do cliente —
              sem templates genéricos, sem achismos.
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

/* ─── Systems ─── */
function Systems() {
  return (
    <section className="dc-systems" id="sistemas">
      <div className="container">
        <div className="row mb-5">
          <div className="col-lg-7">
            <span className="section-label">Sistemas</span>
            <h2 className="section-title">Soluções desenvolvidas</h2>
            <p className="section-desc">
              Conheça os sistemas criados pela DCTECH — cada um resolvendo um problema real de negócio.
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
                  <a href={s.link} className="sys-link" target={s.link.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
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
          <div className="col-lg-5">
            <div className="about-img-block">
              <i className="bi bi-braces-asterisk"></i>
            </div>
          </div>
          <div className="col-lg-7">
            <span className="section-label">Sobre a DCTECH</span>
            <h2 className="section-title">Tecnologia aplicada ao negócio real</h2>
            <p className="section-desc" style={{ maxWidth: "100%" }}>
              A DCTECH é uma empresa de desenvolvimento de software focada em criar sistemas web
              que resolvem problemas reais. Trabalhamos com tecnologias modernas — React, Java,
              Supabase e Vercel — entregando produtos prontos para produção, responsivos e escaláveis.
            </p>
            <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.7, marginTop: 12 }}>
              Cada projeto começa com uma conversa honesta sobre o problema do cliente.
              Não vendemos horas de reunião — entregamos software funcionando.
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
    { icon: "bi-envelope",  label: "contato@dctech.com.br",  href: "mailto:contato@dctech.com.br" },
    { icon: "bi-whatsapp",  label: "WhatsApp direto",         href: "https://wa.me/5534999999999" },
    { icon: "bi-linkedin",  label: "LinkedIn",                href: "https://linkedin.com/in/" },
  ];

  return (
    <section className="dc-cta" id="contato">
      <div className="container">
        <div className="cta-inner">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <span className="section-label">Contato</span>
              <h2 className="section-title">Pronto para digitalizar seu processo?</h2>
              <p className="section-desc">
                Conte-nos sobre o seu desafio. Em até 24 horas entramos em contato com uma
                análise inicial gratuita e uma proposta clara.
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
              <div className="brand-logo" style={{ width: 36, height: 36, fontSize: 13 }}>DC</div>
              <div className="brand-text">
                <strong>DCTECH</strong>
                <small>Soluções em Sistemas</small>
              </div>
            </div>
          </div>
          <div className="col-auto d-flex gap-4">
            {["sobre", "sistemas", "diferenciais", "contato"].map((id) => (
              <button key={id} className="footer-link border-0 bg-transparent" onClick={() => scrollTo(id)} style={{ textTransform: "capitalize" }}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="footer-copy">
          © {new Date().getFullYear()} DCTECH. Todos os direitos reservados. · Uberlândia/MG
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
      <Systems />
      <About />
      <Cta />
      <Footer />
    </>
  );
}
