import React from "react";
import {
  ArrowRight,
  FileText,
  Car,
  BarChart3,
  CheckCircle,
  Layers,
  Cloud,
  Database,
  Headphones,
  MessageCircle,
  Mail,
} from "lucide-react";
import "./App.css";

const sistemas = [
  {
    nome: "SIPAD",
    categoria: "Gestão documental",
    descricao:
      "Sistema para classificação de documentos, temporalidade, organização de acervos e apoio à gestão administrativa.",
    icone: FileText,
  },
  {
    nome: "Clássicos Via²R",
    categoria: "Marketplace especializado",
    descricao:
      "Plataforma para curadoria, divulgação e valorização de veículos clássicos nacionais.",
    icone: Car,
  },
  {
    nome: "EstokOne",
    categoria: "ERP empresarial",
    descricao:
      "Controle de estoque, compras, vendas, financeiro, relatórios e indicadores para pequenas empresas.",
    icone: BarChart3,
  },
];

const diferenciais = [
  {
    titulo: "Sistemas sob medida",
    texto: "Soluções adaptadas ao processo real de cada cliente.",
    icone: Layers,
  },
  {
    titulo: "100% web",
    texto: "Acesso online, responsivo e preparado para nuvem.",
    icone: Cloud,
  },
  {
    titulo: "Dados organizados",
    texto: "Estrutura com banco de dados, relatórios e indicadores.",
    icone: Database,
  },
  {
    titulo: "Acompanhamento",
    texto: "Evolução contínua dos sistemas conforme a necessidade.",
    icone: Headphones,
  },
];

export default function App() {
  return (
    <main className="dctech-page">
      <section className="hero">
        <div className="container">
          <nav className="topbar">
            <a className="brand" href="#">
              <div className="brand-mark">DC</div>
              <div>
                <strong>DCTECH</strong>
                <span>Soluções em Sistemas</span>
              </div>
            </a>

            <div className="menu">
              <a href="#sobre">Sobre</a>
              <a href="#sistemas">Sistemas</a>
              <a href="#diferenciais">Diferenciais</a>
              <a href="#contato">Contato</a>
            </div>

            <a href="#contato" className="nav-cta">
              Solicitar demonstração
            </a>
          </nav>

          <div className="row align-items-center hero-grid">
            <div className="col-lg-6">
              <div className="eyebrow">SOFTWARE SOB MEDIDA</div>

              <h1>
                Transformamos processos em sistemas inteligentes.
              </h1>

              <p className="hero-text">
                Desenvolvimento de sistemas web, ERPs, plataformas digitais e
                soluções de gestão para empresas, instituições e projetos que
                precisam de organização, automação e tecnologia.
              </p>

              <div className="hero-buttons">
                <a href="#contato" className="btn-main">
                  Solicitar demonstração <ArrowRight size={18} />
                </a>

                <a href="#sistemas" className="btn-secondary">
                  Conhecer sistemas
                </a>
              </div>

              <div className="trust-row">
                <span><CheckCircle size={16} /> Gestão documental</span>
                <span><CheckCircle size={16} /> ERP</span>
                <span><CheckCircle size={16} /> Marketplace</span>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="dashboard-card">
                <div className="dashboard-header">
                  <div>
                    <span>Vitrine DCTECH</span>
                    <h3>Soluções digitais em operação</h3>
                  </div>
                  <div className="status-pill">Online</div>
                </div>

                <div className="mock-window">
                  <div className="mock-top">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                  <div className="mock-content">
                    <div className="metric-card large">
                      <small>Sistemas próprios</small>
                      <strong>3</strong>
                    </div>

                    <div className="metric-card">
                      <small>Ambiente</small>
                      <strong>Web</strong>
                    </div>

                    <div className="metric-card">
                      <small>Foco</small>
                      <strong>Gestão</strong>
                    </div>
                  </div>

                  <div className="system-list">
                    {sistemas.map((item) => {
                      const Icone = item.icone;
                      return (
                        <div className="system-mini" key={item.nome}>
                          <div className="mini-icon">
                            <Icone size={20} />
                          </div>
                          <div>
                            <strong>{item.nome}</strong>
                            <span>{item.categoria}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="diferenciais" className="features-section">
        <div className="container">
          <div className="section-heading center">
            <span>Diferenciais</span>
            <h2>Tecnologia com estrutura, clareza e resultado.</h2>
            <p>
              Cada sistema é pensado para resolver um problema real, com
              organização visual, banco de dados e possibilidade de evolução.
            </p>
          </div>

          <div className="row g-4">
            {diferenciais.map((item) => {
              const Icone = item.icone;
              return (
                <div className="col-md-6 col-lg-3" key={item.titulo}>
                  <div className="feature-card">
                    <Icone size={28} />
                    <h3>{item.titulo}</h3>
                    <p>{item.texto}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="sistemas" className="systems-section">
        <div className="container">
          <div className="section-heading">
            <span>Nossos sistemas</span>
            <h2>Uma vitrine de soluções para gestão e negócios digitais.</h2>
          </div>

          <div className="systems-grid">
            {sistemas.map((item) => {
              const Icone = item.icone;
              return (
                <article className="system-showcase" key={item.nome}>
                  <div className="showcase-preview">
                    <Icone size={46} />
                    <div className="preview-lines">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>

                  <div className="showcase-content">
                    <span>{item.categoria}</span>
                    <h3>{item.nome}</h3>
                    <p>{item.descricao}</p>
                    <a href="#contato">
                      Conhecer solução <ArrowRight size={16} />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="sobre" className="about-section">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div className="section-heading">
                <span>Sobre a DCTECH</span>
                <h2>Desenvolvimento de sistemas com visão prática.</h2>
                <p>
                  A DCTECH Soluções em Sistemas atua na criação de aplicações
                  web para transformar ideias, rotinas administrativas e
                  processos de gestão em ferramentas digitais profissionais.
                </p>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="numbers-grid">
                <div>
                  <strong>3</strong>
                  <span>Sistemas em vitrine</span>
                </div>
                <div>
                  <strong>100%</strong>
                  <span>Web e responsivo</span>
                </div>
                <div>
                  <strong>ERP</strong>
                  <span>Gestão empresarial</span>
                </div>
                <div>
                  <strong>Dados</strong>
                  <span>Relatórios e organização</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contato" className="cta-section">
        <div className="container">
          <div className="cta-box">
            <div>
              <span>Contato</span>
              <h2>Pronto para transformar sua ideia em sistema?</h2>
              <p>
                Fale com a DCTECH para conhecer os sistemas, solicitar uma
                demonstração ou iniciar um projeto personalizado.
              </p>
            </div>

            <div className="cta-actions">
              <a href="mailto:contato@dctech.com.br">
                <Mail size={20} /> contato@dctech.com.br
              </a>
              <a href="#">
                <MessageCircle size={20} /> WhatsApp Comercial
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
