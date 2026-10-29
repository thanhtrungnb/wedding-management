/* Trang thiệp cưới online — slide ngang, phong cách phong thư / hộp quà.
   Step 1: giá trị cố định trong CONFIG (bước 2 thay bằng dữ liệu per-guest).
   Tự chạy khi import; chỉ phụ thuộc utils/format (esc) — không đụng store hay storage. */
import { esc } from '../../../utils/format.js';

const CONFIG = {
  couple: {
    bride: 'Minh Trang', groom: 'Quốc Hưng', monogram: 'T · H',
    brideNote: 'Cô con gái út của gia đình ông bà Nguyễn Văn Bình',
    groomNote: 'Cậu con trai trưởng của gia đình ông bà Trần Quốc Thái',
  },
  weddingISO: '2026-12-06T11:00:00+07:00',
  dateText: 'Chủ nhật, ngày 06 tháng 12 năm 2026',
  dateShort: '06 · 12 · 2026',
  dateWeekday: 'Chủ nhật · 06 tháng 12 năm 2026',
  /* Hai sự kiện, hiển thị hai bên màn "Trân trọng kính mời". */
  events: [
    {
      label: 'Lễ cưới', role: 'Nhà gái', icon: 'home', time: '11:00 trưa',
      solar: 'Chủ nhật, 06 · 12 · 2026', lunar: 'Âm lịch: 28 tháng Mười, năm Bính Ngọ',
      place: 'Tư gia nhà gái — 25 Lê Lợi, Hải Châu, Đà Nẵng',
    },
    {
      label: 'Bữa cơm', role: 'Nhà trai', icon: 'pin', time: '18:00 tối',
      solar: 'Chủ nhật, 06 · 12 · 2026', lunar: 'Âm lịch: 28 tháng Mười, năm Bính Ngọ',
      place: 'Trung tâm Hội nghị & Tiệc cưới Hoàng Gia, Tân Bình, TP. Hồ Chí Minh',
    },
  ],
  /* Slide kể chuyện đan xen — mỗi màn 1-3 ảnh, mạch bạn → yêu → vợ chồng. */
  stories: [
    {
      tag: 'Từ những người bạn', images: ['gallery-3', 'gallery-5'],
      text: 'Ngày đầu gặp nhau, chúng mình chỉ là hai người bạn chung một lớp học.\nCùng ăn trưa, cùng thức khuya ôn thi, cùng cười đến mức quên cả giờ về.',
    },
    {
      tag: 'Rồi thành tình yêu', images: ['gallery-2'],
      text: 'Không có khoảnh khắc nào thật rõ ràng — chỉ là một ngày nhận ra, người ấy đã chiếm cả thanh xuân.\nBàn tay nắm bàn tay, chúng mình bắt đầu một câu chuyện khác.',
    },
    {
      tag: 'Những chuyến đi', images: ['gallery-6'],
      text: 'Mỗi chuyến đi là một lần hiểu nhau hơn.\nĐà Lạt, Hội An, rồi một góc biển vắng — nơi những lời yêu thương chẳng cần nói to.',
    },
    {
      tag: 'Lời hẹn ước', images: ['gallery-4'],
      text: 'Một buổi chiều giữa hoàng hôn, một câu hỏi rất khẽ — và một cái gật đầu thật nhanh.\nNgày 06 tháng 12, chúng mình chọn cùng nhau dài lâu, dưới sự chứng kiến của những người thương yêu nhất.',
    },
    {
      tag: 'Ngày chung đôi', images: ['gallery-1', 'gallery-3', 'gallery-6'],
      text: 'Từ hôm nay, hai mái nhà thành một.\nMọi nhọc nhằn gác lại sau cánh cửa — chỉ có hai gia đình, đôi ba chén trà, và câu chuyện chúng mình sẽ kể cho con nghe nhiều năm sau.',
    },
  ],
  venue: {
    name: 'Trung tâm Hội nghị & Tiệc cưới Hoàng Gia',
    address: '194 Hoàng Văn Thụ, Phường 9, Tân Bình, TP. Hồ Chí Minh',
    mapQuery: '194 Hoàng Văn Thụ, Phường 9, Tân Bình, Hồ Chí Minh',
  },
  guest: { salutation: 'Kính gửi', name: 'Cô Minh Anh' },
  message: 'Niềm hạnh phúc của chúng mình sẽ trọn vẹn hơn khi có bạn đến chung vui.\nTrân trọng kính mời bạn đến dự Lễ cưới và Bữa cơm của đôi chúng tôi — một dịp để những người thân yêu quây quần, nâng ly và chúc phúc cho hành trình mới của hai đứa.',
  images: {
    cover: 'assets/img/thiep/cover.svg',
    hero: 'assets/img/thiep/gallery-1.svg',
    bride: 'assets/img/thiep/bride.svg',
    groom: 'assets/img/thiep/groom.svg',
    gallery: {
      'gallery-1': 'assets/img/thiep/gallery-1.svg',
      'gallery-2': 'assets/img/thiep/gallery-2.svg',
      'gallery-3': 'assets/img/thiep/gallery-3.svg',
      'gallery-4': 'assets/img/thiep/gallery-4.svg',
      'gallery-5': 'assets/img/thiep/gallery-5.svg',
      'gallery-6': 'assets/img/thiep/gallery-6.svg',
    },
    end: 'assets/img/thiep/cover.svg',
  },
  music: 'assets/music/henuoctuhuvo.mp3',
};

/* ---------- Icon / hoạ tiết nhỏ dùng chung ---------- */
const orn = `<svg class="tp-orn" viewBox="0 0 180 26" fill="none" aria-hidden="true">
  <path d="M6 13h58M116 13h58" stroke="currentColor" stroke-width="1"/>
  <path d="M90 4c4.5 4.5 4.5 13 0 18-4.5-5-4.5-13.5 0-18z" stroke="currentColor" stroke-width="1.2"/>
  <path d="M72 13c7-7 12-7 16 0-4 7-9 7-16 0zM108 13c-7-7-12-7-16 0 4 7 9 7 16 0z" stroke="currentColor" stroke-width="1"/>
  <circle cx="64" cy="13" r="1.6" fill="currentColor"/><circle cx="116" cy="13" r="1.6" fill="currentColor"/>
</svg>`;
const iconClock = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;
const iconPin = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s-7-5.1-7-11a7 7 0 0 1 14 0c0 5.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>`;
const iconHome = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M10 21v-6h4v6"/></svg>`;
const iconMusic = `<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 18.5a2.5 2.5 0 1 1-1.5-2.29V5.6l11-2.2v11.6a2.5 2.5 0 1 1-1.5-2.29V6.1L9 7.6z"/></svg>`;
const iconCheck = `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="10.5"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>`;
const chevL = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>`;
const chevR = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>`;

function render(config) {
  const { couple, venue, guest, images } = config;
  const greet = esc([guest.salutation, guest.name].filter(Boolean).join(' '));
  const mapEmbed = `https://maps.google.com/maps?q=${encodeURIComponent(venue.mapQuery)}&z=16&output=embed`;
  const mapDir = `https://maps.google.com/?daddr=${encodeURIComponent(venue.mapQuery)}`;
  const sparks = Array.from({ length: 9 }, (_, i) =>
    `<span class="tp-spark" style="left:${6 + i * 11}%;top:${10 + (i % 4) * 22}%;animation-delay:${i * .4}s"></span>`).join('');
  const personCard = (side, image, name, role, note) => `
    <article class="tp-cover__person tp-cover__person--${side} rv" style="--d:${side === 'l' ? 2 : 3}">
      <img class="tp-cover__ava" src="${image}" alt="Ảnh ${role.toLowerCase()} ${esc(name)}">
      <h2 class="tp-cover__pname">${esc(name)}</h2>
      <p class="tp-cover__prole">${role}</p>
      <p class="tp-cover__pnote">${esc(note)}</p>
    </article>`;
  const eventCard = (ev, cls, delay) => `
    <aside class="tp-event tp-event--${cls} rv" style="--d:${delay}">
      <p class="tp-event__head">${ev.icon === 'home' ? iconHome : iconPin}<span>${esc(ev.label)}</span><em class="tp-event__role">${esc(ev.role)}</em></p>
      <p class="tp-event__time">${esc(ev.time)}</p>
      <p class="tp-event__solar">${esc(ev.solar)}</p>
      <p class="tp-event__lunar">${esc(ev.lunar)}</p>
      <p class="tp-event__place">${iconPin} ${esc(ev.place)}</p>
    </aside>`;
  /* Ảnh kể chuyện: 1 ảnh dùng khung lớn, 2-3 ảnh xếp collage. */
  const storyPhotos = (st) => {
    const srcs = st.images.map(k => images.gallery[k]);
    if (srcs.length === 1) return `
        <figure class="tp-story__photo" data-lightbox="${srcs[0]}">
          <img src="${srcs[0]}" alt="Ảnh cưới — ${esc(st.tag)}" loading="lazy">
        </figure>`;
    return `
        <div class="tp-story__photos tp-story__photos--${srcs.length}">
          ${srcs.map((src, i) => `<figure class="tp-story__pic" data-lightbox="${src}">
            <img src="${src}" alt="Ảnh cưới ${i + 1} — ${esc(st.tag)}" loading="lazy"></figure>`).join('')}
        </div>`;
  };
  const storySection = (st, i) => `
      <section class="tp-slide tp-slide--story${i % 2 ? ' tp-slide--story-flip' : ''}" aria-label="Khoảnh khắc: ${esc(st.tag)}">
        ${storyPhotos(st)}
        <div class="tp-story__body">
          <p class="tp-story__index rv">0${i + 1} <span>/ 0${config.stories.length}</span></p>
          <h2 class="tp-story__tag rv" style="--d:1">${esc(st.tag)}</h2>
          ${orn}
          <p class="tp-story__text rv" style="--d:2">${esc(st.text)}</p>
        </div>
      </section>`;

  /* Lời thư hiện sau khi mở bìa — mỗi dòng có tốc độ chạy chữ riêng (ms/ký tự). */
  const ltLines = [
    { cls: 'kicker', cm: 75, segs: [['Wedding Invitation']] },
    { cls: 'script', cm: 95, segs: [['Dear '], [guest.name, 'gold'], [',']] },
    { cls: 'body', cm: 75, segs: [['Trân trọng kính mời bạn đến chung vui']] },
    { cls: 'body', cm: 75, segs: [['trong ngày trọng đại của']] },
    { cls: 'names', cm: 75, segs: [[`${couple.bride} & ${couple.groom}`, 'gold']] },
    { cls: 'date', cm: 75, segs: [[config.dateWeekday]] },
    { cls: 'sign', cm: 95, segs: [[`${couple.bride} & ${couple.groom}`]] },
  ];
  /* Ghost span giữ đúng khối dòng khi chữ chưa chạy xong — tránh card nhảy layout. */
  const ltLine = l => {
    const seg = ([t, c]) => c ? `<span class="tp-lt-${c}">${esc(t)}</span>` : esc(t);
    return `<p class="tp-lt-line tp-lt-line--${l.cls}" data-cm="${l.cm}">` +
      `<span class="tp-lt-gh" aria-hidden="true">${l.segs.map(seg).join('')}</span><span class="tp-lt-live"></span></p>`;
  };
  const ltSr = ltLines.map(l => l.segs.map(s => s[0]).join('')).join(' ');

  return `
  <div class="tp-open" id="tp-open">
    <div class="tp-env" role="button" tabindex="0" aria-label="Mở thiệp mời">
      <p class="tp-env__corner" aria-hidden="true">Dear&nbsp;<strong>${esc(guest.name)}</strong>,<svg class="tp-env__corner-line" viewBox="0 0 200 12" fill="none"><path d="M4 8c34-6 72-7 96-3s52 2 96-6" pathLength="220" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></p>
      <div class="tp-env__body" id="tp-env-body">
        <div class="tp-env__letter">
          <p class="tp-env__brand">Wedding Invitation</p>
          <p class="tp-env__to">${esc(guest.salutation)}<strong>${esc(guest.name)}</strong></p>
          <p class="tp-env__date">${esc(config.dateShort)}</p>
        </div>
        <div class="tp-env__front"></div>
        <div class="tp-env__flap"><div class="tp-env__flap-inner"></div><span class="tp-seal">${esc(couple.monogram)}</span></div>
      </div>
      <p class="tp-open__hint">Nhấn vào triện sáp để mở thiệp</p>
    </div>

    <div class="tp-letter" id="tp-letter">
      <article class="tp-letter__card">
        <p class="tp-lt-wm" aria-hidden="true">${esc(couple.monogram)}</p>
        <p class="sr-only">${esc(ltSr)}</p>
        ${ltLines.map(ltLine).slice(0, 1).join('')}
        ${orn}
        ${ltLines.map(ltLine).slice(1).join('')}
        <div class="tp-lt-orn--end">${orn}</div>
        <p class="tp-lt-dots"><span></span><span></span><span></span></p>
      </article>
      <button class="tp-lt-skip" id="tp-lt-skip" type="button">Bỏ qua ${chevR}</button>
    </div>
  </div>

  <button class="tp-music" id="tp-music" type="button" aria-label="Bật hoặc tắt nhạc nền" aria-pressed="false">
    <span class="tp-music__ring" aria-hidden="true"></span>${iconMusic}
  </button>
  <div class="tp-progress" id="tp-progress" aria-hidden="true"></div>
  <canvas id="tp-petals" aria-hidden="true"></canvas>

  <main class="tp-deck" id="tp-deck" aria-live="polite">
    <div class="tp-track" id="tp-track">

      <section class="tp-slide tp-slide--dark tp-cover" aria-label="Bìa thiệp">
        <div class="tp-media"><img src="${images.cover}" alt="" fetchpriority="high"></div>
        ${sparks}
        <div class="tp-wrap tp-cover__wrap">
          <p class="tp-cover__kicker rv">Wedding Invitation</p>
          <div class="tp-cover__grid">
            ${personCard('l', images.bride, couple.bride, 'Cô dâu', couple.brideNote)}
            <div class="tp-cover__center">
              <p class="tp-cover__save rv" style="--d:1">Save the date</p>
              <h1 class="tp-cover__date rv" style="--d:2">${esc(config.dateShort)}</h1>
              <p class="tp-cover__weekday rv" style="--d:3">${esc(config.dateWeekday)}</p>
            </div>
            ${personCard('r', images.groom, couple.groom, 'Chú rể', couple.groomNote)}
          </div>
          <div class="tp-cover__orn rv" style="--d:3">${orn}</div>
          <div class="tp-cd tp-cd--cover rv" style="--d:4" id="tp-countdown" aria-live="off">
            <div class="tp-cd__box"><span class="tp-cd__num" data-cd="d">–</span><span class="tp-cd__lbl">Ngày</span></div>
            <div class="tp-cd__box"><span class="tp-cd__num" data-cd="h">–</span><span class="tp-cd__lbl">Giờ</span></div>
            <div class="tp-cd__box"><span class="tp-cd__num" data-cd="m">–</span><span class="tp-cd__lbl">Phút</span></div>
            <div class="tp-cd__box"><span class="tp-cd__num" data-cd="s">–</span><span class="tp-cd__lbl">Giây</span></div>
          </div>
        </div>
      </section>

      ${config.stories.slice(0, 2).map(storySection).join('')}

      <section class="tp-slide tp-slide--paper" aria-label="Trân trọng kính mời">
        <div class="tp-wrap tp-wrap--wide">
          <div class="tp-invite">
            ${eventCard(config.events[0], 'l', 2)}
            <div class="tp-card tp-invite__center rv" style="--d:0">
              <p class="tp-eyebrow">Trân trọng kính mời</p>
              <p class="tp-greet">${greet}</p>
              ${orn}
              <p class="tp-msg">${esc(config.message)}</p>
              <p class="tp-sign">${esc(couple.bride)} &amp; ${esc(couple.groom)}</p>
            </div>
            ${eventCard(config.events[1], 'r', 4)}
          </div>
        </div>
      </section>

      ${config.stories.slice(2).map((st, i) => storySection(st, i + 2)).join('')}

      <section class="tp-slide tp-slide--paper tp-slide--combo" aria-label="Địa điểm và xác nhận tham dự">
        <div class="tp-wrap tp-wrap--wide tp-wrap--fill">
          <p class="tp-eyebrow rv">Địa điểm &amp; xác nhận</p>
          <h2 class="tp-h rv" style="--d:1">Hẹn bạn tại đây</h2>
          <div class="tp-combo rv" style="--d:2">
            <div class="tp-map">
              <iframe src="${mapEmbed}" title="Bản đồ đến ${esc(venue.name)}" loading="lazy"
                referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
              <div class="tp-map__bar">
                <p class="tp-map__addr"><strong>${esc(venue.name)}</strong>${esc(venue.address)}</p>
                <a class="tp-btn" href="${mapDir}" target="_blank" rel="noopener">${iconPin} Chỉ đường</a>
              </div>
            </div>
            <div class="tp-card tp-rsvp" id="tp-rsvp">
              <h3 class="tp-rsvp__title">Bạn sẽ đến chứ?</h3>
              <p class="tp-rsvp__sub">Phản hồi giúp chúng mình chuẩn bị chu đáo hơn.</p>
              <form novalidate>
                <div class="tp-field"><label for="tp-rsvp-answer">Phản hồi của bạn</label>
                  <select id="tp-rsvp-answer" name="rsvp">
                    <option value="attending">Mình sẽ tham dự</option>
                    <option value="declined">Rất tiếc, mình không thể tham dự</option>
                  </select></div>
                <div class="tp-field"><label for="tp-rsvp-size">Số người đi cùng</label>
                  <input id="tp-rsvp-size" name="partySize" type="number" min="0" max="30" value="1"></div>
                <div class="tp-field"><label for="tp-rsvp-note">Lời nhắn gửi đôi trẻ</label>
                  <textarea id="tp-rsvp-note" name="note" maxlength="300" placeholder="Chúc hai bạn trăm năm hạnh phúc…"></textarea></div>
                <button class="tp-btn" type="submit">Gửi xác nhận</button>
              </form>
              <div class="tp-rsvp-ok" role="status">
                ${iconCheck}
                <h3>Cảm ơn ${esc(guest.name || 'bạn')}!</h3>
                <p class="tp-fine">Phản hồi của bạn đã được ghi lại. Hẹn gặp bạn trong ngày vui!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="tp-slide tp-slide--dark tp-end" aria-label="Lời kết">
        <div class="tp-media"><img src="${images.end}" alt="" loading="lazy"></div>
        ${sparks}
        <div class="tp-wrap">
          <p class="tp-end__script rv">Hẹn gặp bạn!</p>
          <p class="tp-end__names rv" style="--d:1">${esc(couple.bride)} &amp; ${esc(couple.groom)}</p>
          ${orn}
          <p class="tp-fine rv" style="--d:2;color:rgba(250,246,238,.75)">${esc(config.dateText)} · ${esc(venue.name)}</p>
        </div>
      </section>

    </div>
  </main>

  <button class="tp-nav tp-nav--prev" id="tp-prev" type="button" aria-label="Slide trước">${chevL}</button>
  <button class="tp-nav tp-nav--next" id="tp-next" type="button" aria-label="Slide sau">${chevR}</button>
  <nav class="tp-dots" id="tp-dots" aria-label="Chọn trang thiệp"></nav>

  <dialog class="tp-lightbox" id="tp-lightbox" aria-label="Xem ảnh lớn">
    <button type="button" aria-label="Đóng">×</button><img alt="Ảnh cưới phóng to">
  </dialog>`;
}

/* ---------- Nhạc nền: file mp3 do chủ thiệp đặt sẵn, loop vô hạn ---------- */
function createMusic(src) {
  const audio = new Audio(src);
  audio.loop = true;
  audio.preload = 'auto';
  return {
    start() { audio.play().catch(() => {}); },
    stop() { audio.pause(); },
    get playing() { return !audio.paused; },
  };
}

/* ---------- Hiệu ứng nền: cánh hoa rơi + bụi vàng lấp lánh (canvas) ---------- */
function startAmbience(canvas) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  const PETAL = ['rgba(232,207,196,', 'rgba(216,195,154,', 'rgba(244,231,198,'];
  let w, h, petals = [], sparks = [];
  const resize = () => {
    w = canvas.width = innerWidth * devicePixelRatio;
    h = canvas.height = innerHeight * devicePixelRatio;
    canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
  };
  resize(); addEventListener('resize', resize);
  const nPetal = Math.min(26, Math.round(innerWidth / 42));
  for (let i = 0; i < nPetal; i++) petals.push({
    x: Math.random(), y: Math.random(),
    r: 6 + Math.random() * 8, vy: .5 + Math.random() * .7,
    sway: .5 + Math.random(), phase: Math.random() * Math.PI * 2,
    spin: (Math.random() - .5) * 2.4, a: Math.random() * Math.PI,
    c: PETAL[i % PETAL.length], o: .55 + Math.random() * .35,
  });
  for (let i = 0; i < 18; i++) sparks.push({
    x: Math.random(), y: Math.random(),
    r: 1 + Math.random() * 2.2, tw: Math.random() * Math.PI * 2,
    sp: .8 + Math.random() * 1.6, drift: (Math.random() - .5) * .00012,
  });
  let last = 0;
  (function frame(t) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = Math.min(48, t - last) / 16.7; last = t;
    ctx.clearRect(0, 0, w, h);
    const s = devicePixelRatio;
    for (const p of petals) {
      p.phase += .022 * dt; p.a += p.spin * .012 * dt;
      p.y += p.vy * .0014 * dt;
      if (p.y > 1.06) { p.y = -.06; p.x = Math.random(); }
      const x = (p.x + Math.sin(p.phase) * p.sway * .024) * w, y = p.y * h;
      ctx.save(); ctx.translate(x, y); ctx.rotate(p.a);
      ctx.fillStyle = p.c + p.o + ')';
      ctx.beginPath(); ctx.ellipse(0, 0, p.r * s, p.r * .55 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    for (const k of sparks) {
      k.tw += .05 * k.sp * dt; k.x += k.drift * dt;
      if (k.x < -.02) k.x = 1.02; if (k.x > 1.02) k.x = -.02;
      const alpha = .25 + .55 * (Math.sin(k.tw) * .5 + .5);
      ctx.fillStyle = `rgba(216,180,120,${alpha})`;
      ctx.beginPath(); ctx.arc(k.x * w, k.y * h, k.r * s, 0, Math.PI * 2); ctx.fill();
    }
  })(0);
}

/* ---------- Khởi động ---------- */
function init() {
  document.body.classList.add('tp-body');
  document.body.innerHTML = render(CONFIG);

  const deck = document.getElementById('tp-deck');
  const track = document.getElementById('tp-track');
  const slides = [...track.querySelectorAll('.tp-slide')];
  const open = document.getElementById('tp-open');
  const musicBtn = document.getElementById('tp-music');
  const music = createMusic(CONFIG.music);
  const prev = document.getElementById('tp-prev');
  const next = document.getElementById('tp-next');
  const dots = document.getElementById('tp-dots');
  const progress = document.getElementById('tp-progress');
  let current = 0, busy = false;

  /* Dots điều hướng. */
  dots.innerHTML = slides.map((_, i) =>
    `<button type="button" data-go="${i}" aria-label="Trang ${i + 1}"></button>`).join('');
  const dotBtns = [...dots.querySelectorAll('button')];

  /* Chuyển slide: trượt track + hiệu ứng vào có hướng (trái/phải) + reveal so le. */
  function reveal(i) {
    slides.forEach((s, j) => s.querySelectorAll('.rv').forEach(el =>
      el.classList.toggle('in', j === i)));
  }
  function go(i, instant = false) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    const dir = i > current ? 'next' : i < current ? 'prev' : track.dataset.dir || 'next';
    current = i;
    track.dataset.dir = dir;
    track.style.transition = instant ? 'none' : 'transform .7s cubic-bezier(.65,0,.25,1)';
    track.style.transform = `translateX(${-current * 100}%)`;
    slides.forEach((s, j) => s.classList.toggle('is-active', j === current));
    dotBtns.forEach((b, j) => b.classList.toggle('is-active', j === current));
    progress.style.width = `${((current + 1) / slides.length) * 100}%`;
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    reveal(-1);
    setTimeout(() => reveal(current), instant ? 0 : 260);
  }
  const step = d => { if (!busy) { busy = true; go(current + d); setTimeout(() => busy = false, 500); } };

  next.addEventListener('click', () => step(1));
  prev.addEventListener('click', () => step(-1));
  dots.addEventListener('click', e => {
    const btn = e.target.closest('[data-go]');
    if (btn) go(Number(btn.dataset.go));
  });
  addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
  });

  /* Vuốt ngang trên cảm ứng + con lăn chuột. */
  let touchX = null, touchY = null;
  deck.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: true });
  deck.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX, dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    touchX = touchY = null;
  }, { passive: true });
  let wheelAt = 0;
  deck.addEventListener('wheel', e => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 26 || Date.now() - wheelAt < 750) return;
    wheelAt = Date.now(); step(d > 0 ? 1 : -1);
  }, { passive: true });

  /* Mở thiệp: triện vỡ → nắp lật → thư trồi lên đè vỏ bì → chạy chữ → 3 chấm nhấp nháy 3s → vào slide. */
  const letter = document.getElementById('tp-letter');
  const envBody = document.getElementById('tp-env-body');
  const skipBtn = document.getElementById('tp-lt-skip');
  const ltLineEls = [...letter.querySelectorAll('.tp-lt-line')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let skipped = false, opened = false;
  const skipResolvers = [];
  /* wait() có thể bị ngắt giữa chừng khi người xem bấm Bỏ qua. */
  const wait = ms => new Promise(res => {
    if (skipped) return res();
    const wake = () => { clearTimeout(t); res(); };
    const t = setTimeout(wake, ms);
    skipResolvers.push(wake);
  });
  const skipNow = () => {
    if (skipped) return;
    skipped = true;
    skipResolvers.splice(0).forEach(w => w());
  };
  async function typeLine(p) {
    const live = p.querySelector('.tp-lt-live');
    const gh = p.querySelector('.tp-lt-gh');
    const cm = Number(p.dataset.cm) || 55;
    if (skipped) { live.innerHTML = gh.innerHTML; return; }
    live.innerHTML = '';
    const caret = document.createElement('span');
    caret.className = 'tp-lt-caret';
    live.appendChild(caret);
    for (const node of gh.childNodes) {
      const span = document.createElement('span');
      if (node.nodeType === 1) span.className = node.className;
      live.insertBefore(span, caret);
      for (const ch of node.textContent) {
        if (skipped) break;
        span.textContent += ch;
        await wait(cm);
      }
      if (skipped) break;
    }
    caret.remove();
    if (skipped) live.innerHTML = gh.innerHTML;
  }
  const fillAll = () => ltLineEls.forEach(p => {
    p.querySelector('.tp-lt-live').innerHTML = p.querySelector('.tp-lt-gh').innerHTML;
  });
  function openInvite() {
    if (opened) return;
    opened = true;
    open.classList.add('is-open');
    music.start(); syncMusicBtn();
    const exit = () => {
      if (open.classList.contains('is-out')) return;
      open.classList.add('is-out');
      setTimeout(() => { open.classList.add('is-off'); go(0, true); }, 850);
      setTimeout(() => open.remove(), 1900);
    };
    if (reducedMotion) {
      letter.classList.add('is-in');
      envBody.classList.add('is-back');
      fillAll();
      letter.querySelector('.tp-lt-orn--end').classList.add('is-in');
      setTimeout(exit, 1700);
      return;
    }
    skipBtn.addEventListener('click', e => { e.stopPropagation(); skipNow(); });
    letter.addEventListener('click', skipNow);
    (async () => {
      await wait(1300);
      letter.classList.add('is-in');
      await wait(1100);
      envBody.classList.add('is-back');
      letter.classList.add('is-typing');
      await wait(400);
      for (const p of ltLineEls) { await typeLine(p); await wait(520); }
      letter.classList.remove('is-typing');
      letter.querySelector('.tp-lt-orn--end').classList.add('is-in');
      letter.classList.add('is-dots');
      await wait(3000);
      exit();
    })();
  }
  open.addEventListener('click', openInvite);
  open.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openInvite(); });

  function syncMusicBtn() {
    musicBtn.classList.toggle('is-on', music.playing);
    musicBtn.setAttribute('aria-pressed', String(music.playing));
  }
  musicBtn.addEventListener('click', () => {
    music.playing ? music.stop() : music.start();
    syncMusicBtn();
  });

  /* Đếm ngược từng giây (nằm ngay trên màn bìa). */
  const target = new Date(CONFIG.weddingISO).getTime();
  const cd = document.getElementById('tp-countdown');
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    if (!cd || cd.dataset.done) return;
    const diff = target - Date.now();
    if (diff <= 0) { cd.dataset.done = '1'; cd.innerHTML = '<p class="tp-sign" style="margin:6px 0">Đã đến ngày trọng đại!</p>'; return; }
    cd.querySelector('[data-cd="d"]').textContent = Math.floor(diff / 864e5);
    cd.querySelector('[data-cd="h"]').textContent = pad(Math.floor(diff / 36e5) % 24);
    cd.querySelector('[data-cd="m"]').textContent = pad(Math.floor(diff / 6e4) % 60);
    cd.querySelector('[data-cd="s"]').textContent = pad(Math.floor(diff / 1e3) % 60);
  };
  tick(); setInterval(tick, 1000);

  /* Lightbox cho ảnh kể chuyện. */
  const lightbox = document.getElementById('tp-lightbox');
  deck.addEventListener('click', e => {
    const fig = e.target.closest('[data-lightbox]');
    if (fig) { lightbox.querySelector('img').src = fig.dataset.lightbox; lightbox.showModal(); }
  });
  lightbox.addEventListener('click', e => { if (e.target === lightbox || e.target.tagName === 'BUTTON') lightbox.close(); });

  /* RSVP: bước 1 chỉ xác nhận trên máy (bước 2 gửi lên máy chủ theo token). */
  const rsvp = document.getElementById('tp-rsvp');
  rsvp.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    rsvp.classList.add('is-done');
  });

  go(0, true);
  startAmbience(document.getElementById('tp-petals'));
}

init();
