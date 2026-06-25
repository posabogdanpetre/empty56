// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'PNC Cash Rewards Visa Credit Card',
    description: 'Earn a $200 bonus after qualifying purchases plus 4% cash back on gas, 3% on dining, and 2% on groceries.',
    image_url: 'https://www.pnc.com/en/personal-banking/banking/credit-cards/_jcr_content/main/pageBody/containergrid_copy_c_283020490/embeddedGrid/containergrid_copy_c_215278159/embeddedGrid/containergrid/embeddedGrid/image.coreimg.png/1778094519173/creditcard-cash-rewards-200-bonus-ribbon.png',
    price: '$0 Annual Fee',
    category: 'Credit Card',
  },
  {
    name: 'PNC Spend Wise Visa Credit Card',
    description: 'Unlock a lower purchase APR over time with a 0% introductory APR on purchases and balance transfers for the first 18 months.',
    image_url: 'https://www.pnc.com/en/personal-banking/banking/credit-cards/_jcr_content/main/pageBody/containergrid_1061138187/embeddedGrid/containergrid_copy_c/embeddedGrid/image.coreimg.png/1730324023559/creditcard-spend-wise.png',
    price: '$0 Annual Fee',
    category: 'Credit Card',
  },
  {
    name: 'PNC Secured Visa Credit Card',
    description: 'Start, build, and strengthen your credit by setting your own credit limit with a refundable security deposit.',
    image_url: 'https://www.pnc.com/en/personal-banking/banking/credit-cards/_jcr_content/main/pageBody/containergrid/embeddedGrid/containergrid_copy_c/embeddedGrid/containergrid_121507/embeddedGrid/image_copy.coreimg.png/1769797267110/creditcard-secured.png',
    category: 'Credit Card',
  },
];

// Brand palette from BuildWidgetRequest. getThemedCardBg() darkens palette[0]
// to luminance <= 0.12 so white text has WCAG AA contrast.
const PALETTE = ['#2d3943', '#e1e5ea'];
const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.products — bare array outputSchema; key derived from actionName "list_banking_products"
      items = structuredContent?.products || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderItems(block, items, bridge);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderItems(block, items, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'lbp-wrapper';

  const track = document.createElement('div');
  track.className = 'lbp-track';

  (items || []).slice(0, 5).forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'lbp-card';

    const media = document.createElement('div');
    media.className = 'lbp-media';
    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };
    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => img.parentNode && img.parentNode.replaceChild(colorDiv(), img);
      media.appendChild(img);
    } else {
      media.appendChild(colorDiv());
    }
    card.appendChild(media);

    const info = document.createElement('div');
    info.className = 'lbp-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

    const title = document.createElement('h3');
    title.className = 'lbp-title';
    title.textContent = item.name || '';
    info.appendChild(title);

    if (item.price) {
      const price = document.createElement('div');
      price.className = 'lbp-price';
      price.textContent = item.price;
      info.appendChild(price);
    }

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'lbp-badge';
      badge.textContent = item.category;
      info.appendChild(badge);
    }

    const cta = document.createElement('button');
    cta.className = 'lbp-cta';
    cta.type = 'button';
    cta.textContent = 'View Plan';
    if (bridge) {
      cta.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    info.appendChild(cta);

    card.appendChild(info);
    track.appendChild(card);
  });

  wrapper.appendChild(track);

  const fade = document.createElement('div');
  fade.className = 'lbp-fade';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  const mkArrow = (dir) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `lbp-arrow lbp-arrow-${dir}`;
    b.setAttribute('aria-label', dir === 'left' ? 'Scroll left' : 'Scroll right');
    b.textContent = dir === 'left' ? '◀' : '▶';
    b.addEventListener('click', () => {
      const card = track.querySelector('.lbp-card');
      const dx = (card ? card.offsetWidth : 210) + 16;
      track.scrollBy({ left: dir === 'left' ? -dx : dx, behavior: 'smooth' });
    });
    return b;
  };
  const leftArrow = mkArrow('left');
  const rightArrow = mkArrow('right');
  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  const updateArrows = () => {
    const max = track.scrollWidth - track.clientWidth - 1;
    leftArrow.style.display = track.scrollLeft <= 1 ? 'none' : 'flex';
    rightArrow.style.display = track.scrollLeft >= max ? 'none' : 'flex';
    fade.style.display = track.scrollLeft >= max ? 'none' : 'block';
  };
  track.addEventListener('scroll', updateArrows);
  setTimeout(updateArrows, 0);

  block.appendChild(wrapper);
}
