/* =====================================================
   CROQUI INTERATIVO – FORMATURA NPOR
   ===================================================== */

const NS = "http://www.w3.org/2000/svg";
const CENTRO = { x: 576, y: 324 };      // centro da área (viewBox 1152 x 648)

const CORES = {
  aluno:  "#3f48cc",
  verde:  "#22b14c",
  laranja:"#ff7f27",
  vermelho:"#ed1c24"
};

/* ---------- GRADE (tudo alinhado) ----------
   7 colunas igualmente espaçadas e 4 fileiras.
   Para mover uma mesa, basta trocar a coluna/fileira dela abaixo. */
const GRADE = {
  x0: 213,                   // x da coluna 0 (576 - 3 colunas: grade centralizada entre as paredes)
  dx: 121,                   // distância entre colunas
  y:  [75, 184, 464, 573]    // y de cada fileira (margem de cima = margem de baixo)
};
const colX = c => GRADE.x0 + GRADE.dx * c;
const RAIO_MESA = 34;

/* ---------- definição das mesas ---------- */
const MESAS = [];

function mesaRedonda(id, cor, coluna, fileira) {
  MESAS.push({
    id, tipo: "circulo", cor, lugares: 8,
    cx: colX(coluna), cy: GRADE.y[fileira], r: RAIO_MESA
  });
}

// Mesa dos formandos: vai da coluna 2 até a coluna 5, entre as fileiras 2 e 3
MESAS.push({
  id: "ALUNOS", rotulo: "FORMANDOS", tipo: "retangulo", cor: CORES.aluno, lugares: 20,
  cx: (colX(2) + colX(5)) / 2,
  cy: (GRADE.y[1] + GRADE.y[2]) / 2,
  w: colX(5) - colX(2),
  h: 108
});

let nV = 0, nI = 0, nA = 0;
const verde    = (c, f) => mesaRedonda("V" + (++nV), CORES.verde,    c, f);
const laranja  = (c, f) => mesaRedonda("I" + (++nI), CORES.laranja,  c, f);
const vermelha = (c, f) => mesaRedonda("A" + (++nA), CORES.vermelho, c, f);

// fileira 1 (7 mesas)
for (let c = 0; c <= 6; c++) verde(c, 0);
// fileira 2 (6 mesas): autoridades nas colunas 3 e 4
verde(1, 1); verde(2, 1); vermelha(3, 1); vermelha(4, 1); verde(5, 1); verde(6, 1);
// fileira 3: instrução nas colunas 2, 3, 4 e 5
verde(1, 2); laranja(2, 2); laranja(3, 2); laranja(4, 2); laranja(5, 2); verde(6, 2);
// fileira 4 (7 mesas)
for (let c = 0; c <= 6; c++) verde(c, 3);

/* ---------- elementos da página ---------- */
const svg       = document.getElementById("salao");
const gMesas    = document.getElementById("mesas");
const gCadeiras = document.getElementById("cadeiras");
const btnFechar = document.getElementById("fechar");
const fundo     = document.getElementById("fundo");

let mesaAtiva = null;
let timerCadeiras = null;
let timerLimpeza = null;

function criar(tag, attrs = {}) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

/* ---------- desenha as mesas ---------- */
MESAS.forEach(m => {
  const g = criar("g", { class: "mesa", tabindex: 0, role: "button",
                         "aria-label": "Mesa " + m.id });
  // centro da mesa = ponto de origem do zoom
  g.style.transformOrigin = `${m.cx}px ${m.cy}px`;

  let forma;
  if (m.tipo === "retangulo") {
    forma = criar("rect", { x: m.cx - m.w / 2, y: m.cy - m.h / 2, width: m.w, height: m.h,
                            rx: 4, fill: m.cor });
  } else {
    forma = criar("circle", { cx: m.cx, cy: m.cy, r: m.r, fill: m.cor });
  }
  forma.setAttribute("class", "forma");
  g.appendChild(forma);

  // descrição dentro da mesa (V1, I1, A1... / FORMANDOS)
  const t = criar("text", { x: m.cx, y: m.cy, class: "codigo" });
  t.textContent = m.rotulo || m.id;
  g.appendChild(t);

  g.addEventListener("click", e => { e.stopPropagation(); abrirMesa(m); });
  g.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirMesa(m); }
  });

  m.el = g;
  gMesas.appendChild(g);
});

/* ---------- nomes de cada lugar ---------- */
function nomesDaMesa(m) {
  const lista = ((typeof NOMES !== "undefined" && NOMES[m.id]) || []).slice(0, m.lugares);
  while (lista.length < m.lugares) lista.push("Lugar " + (lista.length + 1));
  return lista;
}

/* quebra o nome em até 3 linhas curtas para caber na cadeira */
function quebrarNome(nome, max = 11) {
  const palavras = String(nome).trim().split(/\s+/);
  const linhas = [];
  let atual = "";
  palavras.forEach(p => {
    if ((atual + " " + p).trim().length <= max) {
      atual = (atual + " " + p).trim();
    } else {
      if (atual) linhas.push(atual);
      atual = p;
    }
  });
  if (atual) linhas.push(atual);
  if (linhas.length > 3) {                       // muito longo: abrevia
    linhas.length = 3;
    linhas[2] = linhas[2].slice(0, max - 1) + "…";
  }
  return linhas.map(l => (l.length > max + 2 ? l.slice(0, max + 1) + "…" : l));
}

/* ---------- posição das cadeiras (coordenadas da tela) ---------- */
const ESCALA_CIRCULO = 3.5;
const ESCALA_RETANGULO = 1.9;

// tamanho da cadeira: maior nas mesas redondas (há mais espaço), menor na mesa dos formandos
const raioCadeira = m => (m.tipo === "circulo" ? 46 : 36);

function posicoesCadeiras(m) {
  const pos = [];
  const R_CADEIRA = raioCadeira(m);
  if (m.tipo === "circulo") {
    const raio = m.r * ESCALA_CIRCULO + R_CADEIRA + 8;
    for (let i = 0; i < m.lugares; i++) {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / m.lugares;   // começa no topo, sentido horário
      pos.push([CENTRO.x + raio * Math.cos(ang), CENTRO.y + raio * Math.sin(ang)]);
    }
    return pos;
  }
  // retângulo: 7 em cima, 3 à direita, 7 embaixo, 3 à esquerda = 20
  const w = m.w * ESCALA_RETANGULO, h = m.h * ESCALA_RETANGULO;
  const off = R_CADEIRA + 14;
  const topo = -h / 2 - off, base = h / 2 + off;
  const dir = w / 2 + off, esq = -w / 2 - off;
  for (let i = 0; i < 7; i++) pos.push([-w / 2 + i * (w / 6), topo]);
  [-80, 0, 80].forEach(y => pos.push([dir, y]));
  for (let i = 6; i >= 0; i--) pos.push([-w / 2 + i * (w / 6), base]);
  [80, 0, -80].forEach(y => pos.push([esq, y]));
  return pos.map(([x, y]) => [CENTRO.x + x, CENTRO.y + y]);
}

/* ---------- abrir mesa ---------- */
function abrirMesa(m) {
  if (mesaAtiva) return;
  mesaAtiva = m;
  clearTimeout(timerLimpeza);
  gCadeiras.innerHTML = "";

  svg.classList.add("foco");

  MESAS.forEach(o => {
    if (o === m) {
      const escala = m.tipo === "circulo" ? ESCALA_CIRCULO : ESCALA_RETANGULO;
      const dx = CENTRO.x - m.cx;
      const dy = CENTRO.y - m.cy;
      o.el.classList.add("selecionada");
      o.el.style.transform = `translate(${dx}px, ${dy}px) scale(${escala})`;
    } else {
      // afasta a mesa para longe do centro
      const dx = (o.cx - CENTRO.x) * 1.3;
      const dy = (o.cy - CENTRO.y) * 1.3;
      o.el.classList.add("afastada");
      o.el.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  });

  btnFechar.classList.add("visivel");

  // cadeiras aparecem enquanto a mesa termina de crescer
  timerCadeiras = setTimeout(() => desenharCadeiras(m), 350);
}

/* ---------- desenhar cadeiras com os nomes ---------- */
function desenharCadeiras(m) {
  const nomes = nomesDaMesa(m);
  const pos = posicoesCadeiras(m);

  pos.forEach(([x, y], i) => {
    // <g> externo: só posição (atributo SVG, funciona em qualquer navegador)
    const g = criar("g", { class: "cadeira", transform: `translate(${x} ${y})` });
    // <g> interno: animação de entrada
    const dentro = criar("g", { class: "cadeira-in" });
    dentro.style.animationDelay = (i * 45) + "ms";

    const redonda = m.tipo === "circulo";
    const fonte = redonda ? 13 : 10.5;        // tamanho da letra
    const passo = fonte + 2;                  // distância entre linhas
    const c = criar("circle", { r: raioCadeira(m), cx: 0, cy: 0, stroke: m.cor });
    const t = criar("text", { x: 0, y: 0 });
    t.style.fontSize = fonte + "px";
    const linhas = quebrarNome(nomes[i], redonda ? 12 : 10);
    const inicio = -((linhas.length - 1) * passo) / 2;
    linhas.forEach((ln, k) => {
      const ts = criar("tspan", { x: 0, dy: k === 0 ? inicio + fonte * 0.35 : passo });
      ts.textContent = ln;
      t.appendChild(ts);
    });

    const tip = criar("title");
    tip.textContent = nomes[i];

    dentro.append(c, t, tip);
    g.appendChild(dentro);
    gCadeiras.appendChild(g);
  });
}

/* ---------- fechar / voltar ao normal ---------- */
function fecharMesa() {
  if (!mesaAtiva) return;
  clearTimeout(timerCadeiras);

  // cadeiras somem
  gCadeiras.querySelectorAll(".cadeira").forEach(g => {
    g.querySelector(".cadeira-in").style.animationDelay = "0ms";
    g.classList.add("saindo");
  });
  timerLimpeza = setTimeout(() => (gCadeiras.innerHTML = ""), 320);

  // mesas voltam
  MESAS.forEach(o => {
    o.el.classList.remove("selecionada", "afastada");
    o.el.style.transform = "";
  });

  btnFechar.classList.remove("visivel");
  svg.classList.remove("foco");
  mesaAtiva = null;
}

btnFechar.addEventListener("click", fecharMesa);
fundo.addEventListener("click", fecharMesa);
document.addEventListener("keydown", e => { if (e.key === "Escape") fecharMesa(); });