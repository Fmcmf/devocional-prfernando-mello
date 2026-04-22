import React, { useState, useEffect } from "react";

const STORAGE_KEY = "devocional-devocionais";
const ADMIN_KEY = "devocional-admin";
const NOTIF_KEY = "devocional-notif-time";

const initialDevocionais = [
  {
    id: 1,
    data: new Date().toISOString().split("T")[0],
    titulo: "Confie no Senhor de todo o seu coração",
    versiculo: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento; reconheça-o em todos os seus caminhos, e ele endireitará as suas veredas.",
    referencia: "Provérbios 3:5-6",
    reflexao: "Muitas vezes buscamos nossa própria sabedoria para resolver os problemas da vida. Mas Deus nos convida a algo mais profundo: uma confiança total nEle, que conhece o fim desde o princípio. Quando abrimos mão do controle e colocamos nossa vida nas mãos do Pai, descobrimos uma paz que transcende todo entendimento.",
    oracao: "Senhor, hoje entrego meus planos, minhas ansiedades e meus caminhos nas Tuas mãos. Que eu possa confiar em Ti em cada detalhe da minha vida, sabendo que Teu cuidado por mim é perfeito. Em nome de Jesus, amém.",
    aplicacao: "Hoje, antes de tomar qualquer decisão, pare por um momento e ore, pedindo a direção de Deus. Pratique reconhecê-Lo nos pequenos detalhes do seu dia.",
    pergunta: "Em qual área da sua vida você ainda está tentando controlar tudo sozinho, sem entregar a Deus?"
  }
];

export default function DevocionalApp() {
  const [view, setView] = useState("home");
  const [devocionais, setDevocionais] = useState([]);
  const [adminLogado, setAdminLogado] = useState(false);
  const [senhaInput, setSenhaInput] = useState("");
  const [senhaErro, setSenhaErro] = useState(false);
  const [devocionalAtivo, setDevocionalAtivo] = useState(null);
  const [devocionalHoje, setDevocionalHoje] = useState(null);
  const [editando, setEditando] = useState(null);
  const [secaoAberta, setSecaoAberta] = useState(null);
  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    titulo: "", versiculo: "", referencia: "",
    reflexao: "", oracao: "", aplicacao: "", pergunta: ""
  });
  const [salvando, setSalvando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifPermission, setNotifPermission] = useState("default");
  const [notifHora, setNotifHora] = useState("07:00");
  const [notifAtiva, setNotifAtiva] = useState(false);
  const [compartilhandoId, setCompartilhandoId] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : initialDevocionais;
    setDevocionais(data);
    if (!stored) localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDevocionais));
    const hoje = new Date().toISOString().split("T")[0];
    setDevocionalHoje(data.find(d => d.data === hoje) || null);
    if (localStorage.getItem(ADMIN_KEY) === "true") setAdminLogado(true);
    const savedHora = localStorage.getItem(NOTIF_KEY);
    if (savedHora) { setNotifHora(savedHora); setNotifAtiva(true); }
    if ("Notification" in window) setNotifPermission(Notification.permission);
  }, []);

  const mostrarToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const salvarDevocionais = (lista) => {
    setDevocionais(lista);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    const hoje = new Date().toISOString().split("T")[0];
    setDevocionalHoje(lista.find(d => d.data === hoje) || null);
  };

  const gerarTextoWhatsApp = (dev) => {
    const l = [];
    l.push(`✝️ *Devocional do Dia*`);
    l.push(`📅 ${formatarData(dev.data)}`);
    l.push(``);
    l.push(`*${dev.titulo}*`);
    l.push(``);
    l.push(`📖 *${dev.referencia || "Versículo"}*`);
    l.push(`_"${dev.versiculo}"_`);
    if (dev.reflexao) { l.push(``); l.push(`✨ *Reflexão*`); l.push(dev.reflexao); }
    if (dev.oracao) { l.push(``); l.push(`🙏 *Oração*`); l.push(dev.oracao); }
    if (dev.aplicacao) { l.push(``); l.push(`🌱 *Aplicação Prática*`); l.push(dev.aplicacao); }
    if (dev.pergunta) { l.push(``); l.push(`💭 *Para Meditar*`); l.push(`_${dev.pergunta}_`); }
    l.push(``);
    l.push(`_Enviado com 💛 pelo Pr Fernando Mello_`);
    return l.join("\n");
  };

  const compartilharWhatsApp = (dev) => {
    const url = `https://wa.me/?text=${encodeURIComponent(gerarTextoWhatsApp(dev))}`;
    window.open(url, "_blank");
    setCompartilhandoId(null);
  };

  const copiarTexto = (dev) => {
    navigator.clipboard.writeText(gerarTextoWhatsApp(dev))
      .then(() => mostrarToast("✅ Texto copiado!"))
      .catch(() => mostrarToast("Erro ao copiar."));
    setCompartilhandoId(null);
  };

  const pedirPermissaoNotif = async () => {
    if (!("Notification" in window)) { mostrarToast("❌ Não suportado neste navegador."); return false; }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    return perm === "granted";
  };

  const ativarNotificacoes = async () => {
    const ok = await pedirPermissaoNotif();
    if (!ok) { mostrarToast("❌ Permissão negada. Habilite nas configurações."); return; }
    localStorage.setItem(NOTIF_KEY, notifHora);
    setNotifAtiva(true);
    setShowNotifModal(false);
    mostrarToast(`🔔 Lembrete ativado para ${notifHora}!`);
    agendarVerificacao(notifHora);
  };

  const agendarVerificacao = (hora) => {
    const [h, m] = hora.split(":").map(Number);
    setInterval(() => {
      const agora = new Date();
      if (agora.getHours() === h && agora.getMinutes() === m && agora.getSeconds() < 15) {
        const hojeStr = agora.toISOString().split("T")[0];
        const stored = localStorage.getItem(STORAGE_KEY);
        const devs = stored ? JSON.parse(stored) : [];
        const dev = devs.find(d => d.data === hojeStr);
        if (Notification.permission === "granted") {
          new Notification("✝️ Devocional do Dia", {
            body: dev ? `${dev.titulo} — ${dev.referencia || ""}` : "Seu momento com Deus está esperando!",
          });
        }
      }
    }, 10000);
  };

  const desativarNotificacoes = () => {
    localStorage.removeItem(NOTIF_KEY);
    setNotifAtiva(false);
    setShowNotifModal(false);
    mostrarToast("🔕 Notificações desativadas.");
  };

  const testarNotificacao = () => {
    if (Notification.permission === "granted") {
      new Notification("✝️ Devocional do Dia", {
        body: devocionalHoje ? devocionalHoje.titulo : "Seu devocional está disponível!",
      });
      mostrarToast("🔔 Notificação de teste enviada!");
    } else {
      mostrarToast("Habilite permissão de notificação primeiro.");
    }
  };

  const handleLogin = () => {
    if (senhaInput === "pastor123") {
      setAdminLogado(true); localStorage.setItem(ADMIN_KEY, "true"); setSenhaErro(false); setView("admin");
    } else setSenhaErro(true);
  };

  const handleLogout = () => { setAdminLogado(false); localStorage.removeItem(ADMIN_KEY); setView("home"); };

  const abrirNovoForm = () => {
    setEditando(null);
    setForm({ data: new Date().toISOString().split("T")[0], titulo: "", versiculo: "", referencia: "", reflexao: "", oracao: "", aplicacao: "", pergunta: "" });
    setView("form");
  };

  const abrirEditarForm = (dev) => { setEditando(dev.id); setForm({ ...dev }); setView("form"); };

  const handleSalvar = () => {
    if (!form.titulo || !form.versiculo || !form.data) return;
    setSalvando(true);
    setTimeout(() => {
      let lista = editando ? devocionais.map(d => d.id === editando ? { ...form, id: editando } : d)
        : [...devocionais, { ...form, id: Date.now() }];
      lista.sort((a, b) => b.data.localeCompare(a.data));
      salvarDevocionais(lista); setSalvando(false); setView("admin");
    }, 600);
  };

  const handleDeletar = (id) => { salvarDevocionais(devocionais.filter(d => d.id !== id)); setConfirmDelete(null); };
  const formatarData = (s) => { const [a, m, d] = s.split("-"); return `${d}/${m}/${a}`; };

  const diasDaSemana = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const hoje = new Date();

  // WhatsApp SVG icon reutilizável
  const WaIcon = ({ size = 18, color = "#25d366" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{flexShrink:0}}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );

  const S = {
    app: { minHeight:"100vh", background:"#0f0e17", color:"#fffffe", fontFamily:"Georgia,'Times New Roman',serif", position:"relative", overflowX:"hidden" },
    bg: { position:"fixed", inset:0, zIndex:0, pointerEvents:"none", background:"radial-gradient(ellipse 80% 60% at 50% -10%,rgba(180,130,60,.18) 0%,transparent 70%),radial-gradient(ellipse 60% 40% at 80% 80%,rgba(120,80,200,.10) 0%,transparent 60%)" },
    wrap: { position:"relative", zIndex:1, maxWidth:420, margin:"0 auto", padding:"0 0 90px" },
    header: { padding:"32px 24px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" },
    appName: { fontSize:13, letterSpacing:4, textTransform:"uppercase", color:"#c9a84c" },
    dateStr: { fontSize:12, color:"rgba(255,255,255,.4)", letterSpacing:1 },
    notifChip: (on) => ({ background: on?"rgba(201,168,76,.15)":"rgba(255,255,255,.06)", border:`1px solid ${on?"rgba(201,168,76,.4)":"rgba(255,255,255,.1)"}`, borderRadius:20, padding:"5px 12px", fontSize:11, color: on?"#c9a84c":"rgba(255,255,255,.4)", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }),
    heroCard: { margin:"0 16px 24px", background:"linear-gradient(135deg,rgba(201,168,76,.18) 0%,rgba(180,120,60,.10) 100%)", border:"1px solid rgba(201,168,76,.25)", borderRadius:20, padding:"28px 24px", backdropFilter:"blur(12px)" },
    heroLabel: { fontSize:11, letterSpacing:3, textTransform:"uppercase", color:"#c9a84c", marginBottom:8 },
    heroTitle: { fontSize:22, fontWeight:"bold", lineHeight:1.3, marginBottom:12 },
    heroRef: { fontSize:13, color:"rgba(255,255,255,.5)", fontStyle:"italic", marginBottom:20 },
    heroVerse: { fontSize:15, lineHeight:1.7, color:"rgba(255,255,255,.85)", borderLeft:"2px solid #c9a84c", paddingLeft:14, fontStyle:"italic" },
    heroBtns: { marginTop:20, display:"flex", gap:10 },
    readBtn: { flex:1, padding:"13px 0", background:"linear-gradient(90deg,#c9a84c,#e8c97a)", border:"none", borderRadius:12, color:"#0f0e17", fontSize:14, fontWeight:"bold", cursor:"pointer", fontFamily:"Georgia,serif" },
    // ← BOTÃO WHATSAPP ATUALIZADO: flex:1 igual ao readBtn, com ícone + "Compartilhar"
    waBtn: { flex:1, padding:"13px 12px", background:"rgba(37,211,102,.12)", border:"1px solid rgba(37,211,102,.3)", borderRadius:12, color:"#25d366", fontSize:13, fontWeight:"bold", cursor:"pointer", fontFamily:"Georgia,serif", display:"flex", alignItems:"center", justifyContent:"center", gap:7 },
    emptyCard: { margin:"0 16px 24px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:20, padding:"40px 24px", textAlign:"center" },
    secTitle: { fontSize:11, letterSpacing:3, textTransform:"uppercase", color:"rgba(255,255,255,.35)", padding:"0 24px", marginBottom:12 },
    listCard: { margin:"0 16px 10px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" },
    listInfo: { flex:1, cursor:"pointer" },
    listTitle: { fontSize:14, color:"#fffffe", marginBottom:4 },
    listDate: { fontSize:12, color:"rgba(255,255,255,.35)" },
    listActions: { display:"flex", gap:8, alignItems:"center" },
    listWaBtn: { background:"rgba(37,211,102,.10)", border:"1px solid rgba(37,211,102,.25)", borderRadius:8, color:"#25d366", fontSize:12, padding:"6px 10px", cursor:"pointer", fontFamily:"Georgia,serif" },
    listArrow: { color:"#c9a84c", fontSize:18, cursor:"pointer" },
    nav: { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:420, background:"rgba(15,14,23,.95)", borderTop:"1px solid rgba(255,255,255,.08)", display:"flex", backdropFilter:"blur(20px)", zIndex:100 },
    navBtn: (a) => ({ flex:1, padding:"12px 0 16px", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, color: a?"#c9a84c":"rgba(255,255,255,.3)", fontSize:10, letterSpacing:1, textTransform:"uppercase", fontFamily:"Georgia,serif" }),
    navIcon: { fontSize:20 },
    back: { padding:"24px 24px 0", display:"flex", alignItems:"center", gap:10, cursor:"pointer", color:"#c9a84c", fontSize:13 },
    devHeader: { padding:"20px 24px 0" },
    devDate: { fontSize:11, letterSpacing:3, textTransform:"uppercase", color:"#c9a84c", marginBottom:8 },
    devTitle: { fontSize:24, fontWeight:"bold", lineHeight:1.25, marginBottom:16 },
    devShareRow: { display:"flex", gap:10, marginBottom:20 },
    devWaBtn: { flex:1, padding:"11px 0", background:"rgba(37,211,102,.12)", border:"1px solid rgba(37,211,102,.3)", borderRadius:12, color:"#25d366", fontSize:13, fontWeight:"bold", cursor:"pointer", fontFamily:"Georgia,serif", display:"flex", alignItems:"center", justifyContent:"center", gap:6 },
    devCopyBtn: { flex:1, padding:"11px 0", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, color:"rgba(255,255,255,.6)", fontSize:13, cursor:"pointer", fontFamily:"Georgia,serif" },
    accordion: { margin:"0 16px 10px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, overflow:"hidden" },
    accHeader: { padding:"16px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", userSelect:"none" },
    accLabel: { display:"flex", alignItems:"center", gap:10, fontSize:13, fontWeight:"bold", letterSpacing:1 },
    accArrow: (o) => ({ fontSize:16, color:"#c9a84c", transition:"transform .3s", transform: o?"rotate(180deg)":"rotate(0)" }),
    accBody: { padding:"0 18px 18px", fontSize:14.5, lineHeight:1.8, color:"rgba(255,255,255,.8)" },
    verse: { fontStyle:"italic", borderLeft:"2px solid #c9a84c", paddingLeft:14, color:"rgba(255,255,255,.9)", fontSize:16, lineHeight:1.75 },
    verseRef: { marginTop:10, fontSize:13, color:"#c9a84c", fontStyle:"normal" },
    pergunta: { background:"rgba(201,168,76,.08)", border:"1px solid rgba(201,168,76,.2)", borderRadius:10, padding:16, fontSize:14.5, lineHeight:1.7, fontStyle:"italic" },
    overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:24 },
    modal: { background:"#1a1828", border:"1px solid rgba(255,255,255,.1)", borderRadius:18, padding:28, maxWidth:360, width:"100%" },
    mTitle: { fontSize:17, fontWeight:"bold", marginBottom:10 },
    mText: { fontSize:13, color:"rgba(255,255,255,.6)", marginBottom:20, lineHeight:1.6 },
    mSub: { fontSize:12, color:"rgba(255,255,255,.4)", marginBottom:20 },
    mRow: { display:"flex", gap:10 },
    mCancel: { flex:1, padding:"11px 0", background:"none", border:"1px solid rgba(255,255,255,.15)", borderRadius:10, color:"rgba(255,255,255,.6)", fontSize:13, cursor:"pointer", fontFamily:"Georgia,serif" },
    mDel: { flex:1, padding:"11px 0", background:"#e05555", border:"none", borderRadius:10, color:"#fff", fontSize:13, fontWeight:"bold", cursor:"pointer", fontFamily:"Georgia,serif" },
    mGold: { width:"100%", padding:"13px 0", background:"linear-gradient(90deg,#c9a84c,#e8c97a)", border:"none", borderRadius:10, color:"#0f0e17", fontSize:14, fontWeight:"bold", cursor:"pointer", fontFamily:"Georgia,serif", marginBottom:8 },
    mWa: { width:"100%", padding:"14px 0", background:"linear-gradient(90deg,#25d366,#128C7E)", border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:"bold", cursor:"pointer", fontFamily:"Georgia,serif", marginBottom:8, display:"flex", alignItems:"center", justifyContent:"center", gap:8 },
    mCopy: { width:"100%", padding:"12px 0", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, color:"rgba(255,255,255,.7)", fontSize:14, cursor:"pointer", fontFamily:"Georgia,serif", marginBottom:8 },
    mClose: { width:"100%", padding:"10px 0", background:"none", border:"none", color:"rgba(255,255,255,.3)", fontSize:13, cursor:"pointer", fontFamily:"Georgia,serif" },
    notifRow: { display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,.04)", borderRadius:10, padding:"12px 14px", marginBottom:12 },
    notifLabel: { fontSize:13, color:"rgba(255,255,255,.7)" },
    timeInput: { background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.15)", borderRadius:8, padding:"8px 12px", color:"#fffffe", fontSize:15, fontFamily:"Georgia,serif", outline:"none" },
    adminHeader: { padding:"32px 24px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" },
    adminTitle: { fontSize:18, fontWeight:"bold" },
    logoutBtn: { background:"none", border:"1px solid rgba(255,255,255,.15)", borderRadius:8, color:"rgba(255,255,255,.5)", fontSize:12, padding:"6px 12px", cursor:"pointer", fontFamily:"Georgia,serif" },
    addBtn: { display:"block", margin:"12px 16px 20px", padding:"14px 0", background:"linear-gradient(90deg,#c9a84c,#e8c97a)", border:"none", borderRadius:12, color:"#0f0e17", fontSize:14, fontWeight:"bold", cursor:"pointer", width:"calc(100% - 32px)", fontFamily:"Georgia,serif", letterSpacing:1 },
    adminCard: { margin:"0 16px 10px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, padding:"14px 16px" },
    adminCardTop: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 },
    adminCardTitle: { fontSize:14, fontWeight:"bold", flex:1, paddingRight:8 },
    adminCardDate: { fontSize:12, color:"#c9a84c" },
    adminActions: { display:"flex", gap:8, marginTop:10 },
    adminWaBtn: { flex:1, padding:"8px 0", background:"rgba(37,211,102,.08)", border:"1px solid rgba(37,211,102,.25)", borderRadius:8, color:"#25d366", fontSize:12, cursor:"pointer", fontFamily:"Georgia,serif" },
    editBtn: { flex:1, padding:"8px 0", background:"rgba(201,168,76,.12)", border:"1px solid rgba(201,168,76,.3)", borderRadius:8, color:"#c9a84c", fontSize:12, cursor:"pointer", fontFamily:"Georgia,serif" },
    delBtn: { flex:1, padding:"8px 0", background:"rgba(220,50,50,.08)", border:"1px solid rgba(220,50,50,.2)", borderRadius:8, color:"#e05555", fontSize:12, cursor:"pointer", fontFamily:"Georgia,serif" },
    loginWrap: { padding:"60px 32px", textAlign:"center" },
    loginTitle: { fontSize:22, fontWeight:"bold", marginBottom:8 },
    loginSub: { fontSize:13, color:"rgba(255,255,255,.4)", marginBottom:32 },
    input: { width:"100%", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", borderRadius:10, padding:"14px 16px", color:"#fffffe", fontSize:15, fontFamily:"Georgia,serif", outline:"none", boxSizing:"border-box", marginBottom:12 },
    loginBtn: { width:"100%", padding:"14px 0", background:"linear-gradient(90deg,#c9a84c,#e8c97a)", border:"none", borderRadius:12, color:"#0f0e17", fontSize:15, fontWeight:"bold", cursor:"pointer", fontFamily:"Georgia,serif" },
    errMsg: { color:"#e05555", fontSize:13, marginBottom:10 },
    formWrap: { padding:"24px 20px 100px" },
    formTitle: { fontSize:18, fontWeight:"bold", marginBottom:20 },
    label: { display:"block", fontSize:11, letterSpacing:2, textTransform:"uppercase", color:"rgba(255,255,255,.4)", marginBottom:6, marginTop:16 },
    textarea: { width:"100%", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", borderRadius:10, padding:"12px 14px", color:"#fffffe", fontSize:14, fontFamily:"Georgia,serif", outline:"none", resize:"vertical", minHeight:80, boxSizing:"border-box" },
    saveBtn: (d) => ({ width:"100%", marginTop:24, padding:"15px 0", background: d?"rgba(201,168,76,.3)":"linear-gradient(90deg,#c9a84c,#e8c97a)", border:"none", borderRadius:12, color:"#0f0e17", fontSize:15, fontWeight:"bold", cursor: d?"not-allowed":"pointer", fontFamily:"Georgia,serif" }),
    cancelBtn: { width:"100%", marginTop:10, padding:"13px 0", background:"none", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, color:"rgba(255,255,255,.5)", fontSize:14, cursor:"pointer", fontFamily:"Georgia,serif" },
    toast: { position:"fixed", bottom:100, left:"50%", transform:"translateX(-50%)", background:"#1a1828", border:"1px solid rgba(201,168,76,.3)", borderRadius:12, padding:"12px 24px", fontSize:13, color:"#fffffe", zIndex:999, whiteSpace:"nowrap", boxShadow:"0 4px 24px rgba(0,0,0,.4)" },
  };

  const secoes = [
    { key:"versiculo", label:"Versículo do Dia", icon:"📖" },
    { key:"reflexao",  label:"Reflexão",          icon:"✨" },
    { key:"oracao",    label:"Oração",             icon:"🙏" },
    { key:"aplicacao", label:"Aplicação Prática",  icon:"🌱" },
    { key:"pergunta",  label:"Pergunta para Meditação", icon:"💭" },
  ];

  const devParaComp = compartilhandoId ? devocionais.find(d => d.id === compartilhandoId) : null;

  const ShareModal = () => !devParaComp ? null : (
    <div style={S.overlay} onClick={() => setCompartilhandoId(null)}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.mTitle}>💬 Compartilhar Devocional</div>
        <div style={S.mSub}>"{devParaComp.titulo}"</div>
        <button style={S.mWa} onClick={() => compartilharWhatsApp(devParaComp)}>
          <WaIcon size={20} color="#fff" /> Abrir no WhatsApp
        </button>
        <button style={S.mCopy} onClick={() => copiarTexto(devParaComp)}>📋 Copiar texto formatado</button>
        <button style={S.mClose} onClick={() => setCompartilhandoId(null)}>Cancelar</button>
      </div>
    </div>
  );

  const NotifModal = () => (
    <div style={S.overlay} onClick={() => setShowNotifModal(false)}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{fontSize:32, marginBottom:10}}>🔔</div>
        <div style={S.mTitle}>Notificações Diárias</div>
        <div style={S.mText}>Receba um lembrete todos os dias no horário escolhido para ler seu devocional.</div>
        <div style={S.notifRow}>
          <div style={S.notifLabel}>Horário do lembrete</div>
          <input style={S.timeInput} type="time" value={notifHora} onChange={e => setNotifHora(e.target.value)} />
        </div>
        {notifPermission === "denied" && (
          <div style={{fontSize:12, color:"#e05555", marginBottom:14, lineHeight:1.6}}>
            ⚠️ Notificações bloqueadas. Habilite nas configurações do navegador.
          </div>
        )}
        {notifAtiva && (
          <div style={{fontSize:12, color:"#c9a84c", marginBottom:14, background:"rgba(201,168,76,.08)", borderRadius:8, padding:"10px 12px"}}>
            ✅ Ativo — lembrete às {localStorage.getItem(NOTIF_KEY)}
          </div>
        )}
        <button style={S.mGold} onClick={ativarNotificacoes}>
          {notifAtiva ? "Atualizar horário" : "Ativar notificações"}
        </button>
        {notifAtiva && (
          <button style={{...S.mCopy, marginBottom:8}} onClick={testarNotificacao}>🔔 Testar agora</button>
        )}
        {notifAtiva && (
          <button style={{...S.mCopy, color:"#e05555", borderColor:"rgba(220,50,50,.3)", marginBottom:8}} onClick={desativarNotificacoes}>
            Desativar notificações
          </button>
        )}
        <button style={S.mClose} onClick={() => setShowNotifModal(false)}>Fechar</button>
      </div>
    </div>
  );

  const NavBar = ({ active }) => (
    <nav style={S.nav}>
      <button style={S.navBtn(active==="home")} onClick={() => setView("home")}><span style={S.navIcon}>🏠</span>Início</button>
      <button style={S.navBtn(active==="notif")} onClick={() => setShowNotifModal(true)}><span style={S.navIcon}>{notifAtiva?"🔔":"🔕"}</span>Lembrete</button>
      <button style={S.navBtn(active==="admin")} onClick={() => adminLogado ? setView("admin") : setView("login")}><span style={S.navIcon}>⚙️</span>Pastor</button>
    </nav>
  );

  // VIEW: DEVOCIONAL COMPLETO
  if (view === "devocional" && devocionalAtivo) {
    const dev = devocionalAtivo;
    return (
      <div style={S.app}><div style={S.bg}/>
        <div style={S.wrap}>
          <div style={S.back} onClick={() => setView("home")}>← Voltar</div>
          <div style={S.devHeader}>
            <div style={S.devDate}>{formatarData(dev.data)}</div>
            <div style={S.devTitle}>{dev.titulo}</div>
            <div style={S.devShareRow}>
              <button style={S.devWaBtn} onClick={() => setCompartilhandoId(dev.id)}>
                <WaIcon size={18} color="#25d366" /> Compartilhar
              </button>
              <button style={S.devCopyBtn} onClick={() => copiarTexto(dev)}>📋 Copiar</button>
            </div>
          </div>
          {secoes.map(sec => (
            <div key={sec.key} style={S.accordion}>
              <div style={S.accHeader} onClick={() => setSecaoAberta(secaoAberta===sec.key?null:sec.key)}>
                <span style={S.accLabel}><span>{sec.icon}</span>{sec.label}</span>
                <span style={S.accArrow(secaoAberta===sec.key)}>▼</span>
              </div>
              {secaoAberta===sec.key && (
                <div style={S.accBody}>
                  {sec.key==="versiculo" ? <div style={S.verse}>{dev.versiculo}{dev.referencia&&<div style={S.verseRef}>{dev.referencia}</div>}</div>
                    : sec.key==="pergunta" ? <div style={S.pergunta}>{dev[sec.key]}</div>
                    : <div>{dev[sec.key]}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
        {compartilhandoId&&<ShareModal/>}
        {showNotifModal&&<NotifModal/>}
        {toastMsg&&<div style={S.toast}>{toastMsg}</div>}
        <NavBar active="home"/>
      </div>
    );
  }

  // VIEW: LOGIN
  if (view === "login") return (
    <div style={S.app}><div style={S.bg}/>
      <div style={S.wrap}>
        <div style={S.back} onClick={() => setView("home")}>← Voltar</div>
        <div style={S.loginWrap}>
          <div style={{fontSize:48, marginBottom:16}}>🔒</div>
          <div style={S.loginTitle}>Área do Pastor</div>
          <div style={S.loginSub}>Entre com sua senha para gerenciar os devocionais</div>
          {senhaErro && <div style={S.errMsg}>Senha incorreta. Tente novamente.</div>}
          <input style={S.input} type="password" placeholder="Senha" value={senhaInput}
            onChange={e=>{setSenhaInput(e.target.value);setSenhaErro(false);}}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          <button style={S.loginBtn} onClick={handleLogin}>Entrar</button>
        </div>
      </div>
      <NavBar active="admin"/>
    </div>
  );

  // VIEW: ADMIN
  if (view === "admin") return (
    <div style={S.app}><div style={S.bg}/>
      <div style={S.wrap}>
        <div style={S.adminHeader}>
          <div style={S.adminTitle}>Gerenciar Devocionais</div>
          <button style={S.logoutBtn} onClick={handleLogout}>Sair</button>
        </div>
        <div style={{padding:"4px 24px 16px", fontSize:13, color:"rgba(255,255,255,.35)"}}>{devocionais.length} devocional(is)</div>
        <button style={S.addBtn} onClick={abrirNovoForm}>+ Novo Devocional</button>
        {devocionais.map(dev => (
          <div key={dev.id} style={S.adminCard}>
            <div style={S.adminCardTop}>
              <div style={S.adminCardTitle}>{dev.titulo}</div>
              <div style={S.adminCardDate}>{formatarData(dev.data)}</div>
            </div>
            <div style={{fontSize:12, color:"rgba(255,255,255,.35)", fontStyle:"italic"}}>{dev.referencia}</div>
            <div style={S.adminActions}>
              <button style={S.adminWaBtn} onClick={()=>setCompartilhandoId(dev.id)}>💬 WhatsApp</button>
              <button style={S.editBtn} onClick={()=>abrirEditarForm(dev)}>✏️ Editar</button>
              <button style={S.delBtn} onClick={()=>setConfirmDelete(dev.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
      {confirmDelete&&(
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.mTitle}>Excluir devocional?</div>
            <div style={S.mText}>Esta ação não pode ser desfeita.</div>
            <div style={S.mRow}>
              <button style={S.mCancel} onClick={()=>setConfirmDelete(null)}>Cancelar</button>
              <button style={S.mDel} onClick={()=>handleDeletar(confirmDelete)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
      {compartilhandoId&&<ShareModal/>}
      {showNotifModal&&<NotifModal/>}
      {toastMsg&&<div style={S.toast}>{toastMsg}</div>}
      <NavBar active="admin"/>
    </div>
  );

  // VIEW: FORMULÁRIO
  if (view === "form") {
    const invalido = !form.titulo||!form.versiculo||!form.data;
    return (
      <div style={S.app}><div style={S.bg}/>
        <div style={S.wrap}>
          <div style={S.back} onClick={()=>setView("admin")}>← Voltar</div>
          <div style={S.formWrap}>
            <div style={S.formTitle}>{editando?"Editar Devocional":"Novo Devocional"}</div>
            <label style={S.label}>Data *</label>
            <input style={{...S.input,marginBottom:0}} type="date" value={form.data} onChange={e=>setForm({...form,data:e.target.value})}/>
            <label style={S.label}>Título *</label>
            <input style={{...S.input,marginBottom:0}} type="text" placeholder="Ex: Confie no Senhor..." value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})}/>
            <label style={S.label}>Versículo *</label>
            <textarea style={S.textarea} placeholder="Texto do versículo..." value={form.versiculo} onChange={e=>setForm({...form,versiculo:e.target.value})}/>
            <label style={S.label}>Referência</label>
            <input style={{...S.input,marginBottom:0}} type="text" placeholder="Ex: João 3:16" value={form.referencia} onChange={e=>setForm({...form,referencia:e.target.value})}/>
            <label style={S.label}>Reflexão</label>
            <textarea style={{...S.textarea,minHeight:100}} placeholder="Mensagem do dia..." value={form.reflexao} onChange={e=>setForm({...form,reflexao:e.target.value})}/>
            <label style={S.label}>Oração</label>
            <textarea style={S.textarea} placeholder="Oração guiada..." value={form.oracao} onChange={e=>setForm({...form,oracao:e.target.value})}/>
            <label style={S.label}>Aplicação Prática</label>
            <textarea style={S.textarea} placeholder="Como viver isso hoje..." value={form.aplicacao} onChange={e=>setForm({...form,aplicacao:e.target.value})}/>
            <label style={S.label}>Pergunta para Meditação</label>
            <input style={{...S.input,marginBottom:0}} type="text" placeholder="Uma pergunta reflexiva..." value={form.pergunta} onChange={e=>setForm({...form,pergunta:e.target.value})}/>
            <button style={S.saveBtn(invalido||salvando)} onClick={handleSalvar} disabled={invalido||salvando}>
              {salvando?"Salvando...":"💾 Salvar Devocional"}
            </button>
            <button style={S.cancelBtn} onClick={()=>setView("admin")}>Cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  // HOME
  return (
    <div style={S.app}><div style={S.bg}/>
      <div style={S.wrap}>
        <div style={S.header}>
          <div>
            <div style={S.appName}>Pr Fernando Mello</div>
            <div style={S.dateStr}>{diasDaSemana[hoje.getDay()]}, {hoje.getDate()} de {meses[hoje.getMonth()]}</div>
          </div>
          <div style={S.notifChip(notifAtiva)} onClick={()=>setShowNotifModal(true)}>
            <span>{notifAtiva?"🔔":"🔕"}</span>
            <span>{notifAtiva?notifHora:"Lembrete"}</span>
          </div>
        </div>

        {devocionalHoje ? (
          <div style={S.heroCard}>
            <div style={S.heroLabel}>Para hoje</div>
            <div style={S.heroTitle}>{devocionalHoje.titulo}</div>
            {devocionalHoje.referencia&&<div style={S.heroRef}>{devocionalHoje.referencia}</div>}
            <div style={S.heroVerse}>{devocionalHoje.versiculo.substring(0,140)}{devocionalHoje.versiculo.length>140?"...":""}</div>
            <div style={S.heroBtns}>
              {/* Botão "Ler Completo" */}
              <button style={S.readBtn} onClick={()=>{setDevocionalAtivo(devocionalHoje);setSecaoAberta(null);setView("devocional");}}>
                Ler Completo →
              </button>
              {/* ↓ ALTERAÇÃO PRINCIPAL: ícone do WhatsApp + texto "Compartilhar" */}
              <button style={S.waBtn} onClick={()=>setCompartilhandoId(devocionalHoje.id)}>
                <WaIcon size={18} color="#25d366" />
                Compartilhar
              </button>
            </div>
          </div>
        ) : (
          <div style={S.emptyCard}>
            <div style={{fontSize:40, marginBottom:16}}>📖</div>
            <div style={{fontSize:17, color:"rgba(255,255,255,.6)", marginBottom:8}}>Nenhum devocional para hoje</div>
            <div style={{fontSize:13, color:"rgba(255,255,255,.3)"}}>O pastor ainda não publicou o devocional de hoje.</div>
          </div>
        )}

        {devocionais.filter(d=>d.data!==new Date().toISOString().split("T")[0]).length>0&&(
          <>
            <div style={S.secTitle}>Devocionais Anteriores</div>
            {devocionais.filter(d=>d.data!==new Date().toISOString().split("T")[0]).slice(0,6).map(dev=>(
              <div key={dev.id} style={S.listCard}>
                <div style={S.listInfo} onClick={()=>{setDevocionalAtivo(dev);setSecaoAberta(null);setView("devocional");}}>
                  <div style={S.listTitle}>{dev.titulo}</div>
                  <div style={S.listDate}>{formatarData(dev.data)}{dev.referencia?` • ${dev.referencia}`:""}</div>
                </div>
                <div style={S.listActions}>
                  <button style={S.listWaBtn} onClick={()=>setCompartilhandoId(dev.id)}>💬</button>
                  <span style={S.listArrow} onClick={()=>{setDevocionalAtivo(dev);setSecaoAberta(null);setView("devocional");}}>›</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {compartilhandoId&&<ShareModal/>}
      {showNotifModal&&<NotifModal/>}
      {toastMsg&&<div style={S.toast}>{toastMsg}</div>}
      <NavBar active="home"/>
    </div>
  );
}
