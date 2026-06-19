import React from "react";
import { FileText, Car, BarChart3, ArrowRight, Mail, MessageCircle, CheckCircle } from "lucide-react";
import "./App.css";

const sistemas = [
  {
    nome: "SIPAD",
    descricao: "Sistema para gestão documental, classificação de documentos e tabelas de temporalidade.",
    icone: FileText,
  },
  {
    nome: "Clássicos Via²R",
    descricao: "Plataforma de curadoria e divulgação de veículos clássicos nacionais.",
    icone: Car,
  },
  {
    nome: "EstokOne",
    descricao: "ERP para estoque, vendas, compras, financeiro e indicadores de gestão.",
    icone: BarChart3,
  },
];

export default function App() {
  return (
    <main className="site-page">
      <section className="hero-section">
        <div className="container">

          <nav className="nav-box">
            <div className="brand">
              <img src="/dctech-logo.png" alt="DCTECH" />
              <div>
                <strong>DCTECH</strong>
                <span>Soluções em Sistemas</span>
              </div>
            </div>

            <div className="nav-links">
              <a href="#sobre">Sobre</a>
              <a href="#sistemas">Sistemas</a>
              <a href="#contato">Contato</a>
            </div>
          </nav>

          <div className="row align-items-center hero-content">
            <div className="col-lg-7">
              <div className="badge-tech">Tecnologia • Gestão • Sistemas Web</div>

              <h1>
                Desenvolvimento de sistemas web para transformar ideias em soluções reais.
              </h1>

              <p>
                A DCTECH cria soluções digitais modernas para empresas, instituições e projetos que precisam de organização, automação e presença profissional.
              </p>

              <div className="hero-actions">
                <a href="#sistemas" className="btn-primary-tech">
                  Conhecer sistemas <ArrowRight size={18} />
                </a>
                <a href="#contato" className="btn-outline-tech">
                  Fale comigo
                </a>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="hero-card">
                <img src="/dctech-logo.png" alt="DCTECH" className="hero-logo" />
                <h3>Vitrine de Soluções</h3>

                <ul>
                  <li><CheckCircle size={18} /> Sistemas sob medida</li>
                  <li><CheckCircle size={18} /> Dashboards e relatórios</li>
                  <li><CheckCircle size={18} /> Gestão documental</li>
                  <li><CheckCircle size={18} /> Marketplaces e ERPs</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section id="sobre" className="section-white">
        <div className="container">
          <div className="section-title">
            <span>Sobre a DCTECH</span>
            <h2>Tecnologia aplicada a problemas reais.</h2>
            <p>
              A DCTECH Soluções em Sistemas nasceu para transformar experiências práticas em sistemas digitais profissionais, acessíveis e eficientes.
            </p>
          </div>
        </div>
      </section>

      <section id="sistemas" className="section-light">
        <div className="container">
          <div className="section-title">
            <span>Nossos sistemas</span>
            <h2>Soluções desenvolvidas</h2>
          </div>

          <div className="row g-4">
            {sistemas.map((sistema) => {
              const Icone = sistema.icone;
              return (
                <div className="col-md-4" key={sistema.nome}>
                  <div className="system-card">
                    <div className="icon-box">
                      <Icone size={32} />
                    </div>
                    <h3>{sistema.nome}</h3>
                    <p>{sistema.descricao}</p>
                    <button>
                      Saiba mais <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="contato" className="contact-section">
        <div className="container">
          <div className="contact-box">
            <div>
              <span>Contato</span>
              <h2>Vamos transformar sua ideia em sistema?</h2>
              <p>Entre em contato para conhecer os sistemas ou solicitar uma solução personalizada.</p>
            </div>

            <div className="contact-actions">
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