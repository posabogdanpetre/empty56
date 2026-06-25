// synthetic fixture — no sample data available from Action Planner
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'PNC Bank - Market Square',
    address: '300 Fifth Ave, Pittsburgh, PA 15222',
    phone: '(412) 555-0182',
    hours: 'Mon–Fri 9:00 AM – 5:00 PM',
  },
  {
    name: 'PNC Bank - Shadyside',
    address: '5500 Walnut St, Pittsburgh, PA 15232',
    phone: '(412) 555-0147',
    hours: 'Mon–Fri 9:00 AM – 6:00 PM, Sat 9:00 AM – 1:00 PM',
  },
];

// Brand palette from BuildWidgetRequest.
// getThemedCardBg() darkens palette[0] to luminance ≤ 0.12 so white text has WCAG AA contrast.
const PALETTE = ['#2d3943', '#e1e5ea'];
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
  for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m; }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

function pinSvg(color) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', color);
  path.setAttribute('stroke-width', '1.6');
  svg.appendChild(path);
  return svg;
}

function renderEmptyState(block, bridge) {
  const card = document.createElement('div');
  card.className = 'find-branch-search';
  card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

  const icon = document.createElement('div');
  icon.className = 'find-branch-pin';
  icon.appendChild(pinSvg(theme?.fg ?? '#fff'));
  card.appendChild(icon);

  const heading = document.createElement('div');
  heading.className = 'find-branch-heading';
  heading.textContent = 'Find a branch near you';
  card.appendChild(heading);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'find-branch-input';
  input.placeholder = 'Enter ZIP code...';
  input.setAttribute('aria-label', 'ZIP code');
  card.appendChild(input);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'find-branch-btn';
  btn.textContent = 'Search';
  const submit = () => {
    const zip = input.value.trim();
    if (bridge && zip) bridge.sendMessage(`Find a PNC branch near ${zip}`);
  };
  btn.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  card.appendChild(btn);

  block.appendChild(card);
}

function renderBranches(block, branches, bridge) {
  const row = document.createElement('div');
  row.className = 'find-branch-results';

  branches.slice(0, 2).forEach((b) => {
    const card = document.createElement('div');
    card.className = 'find-branch-card';
    card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const pin = document.createElement('div');
    pin.className = 'find-branch-card-pin';
    pin.appendChild(pinSvg(theme?.fg ?? '#fff'));
    card.appendChild(pin);

    const name = document.createElement('div');
    name.className = 'find-branch-name';
    name.textContent = b.name || '';
    card.appendChild(name);

    if (b.address) {
      const addr = document.createElement('div');
      addr.className = 'find-branch-address';
      addr.textContent = b.address;
      card.appendChild(addr);
    }

    if (b.phone) {
      const phone = document.createElement('div');
      phone.className = 'find-branch-phone';
      phone.textContent = b.phone;
      card.appendChild(phone);
    }

    if (b.hours) {
      const hours = document.createElement('div');
      hours.className = 'find-branch-hours';
      hours.textContent = b.hours;
      card.appendChild(hours);
    }

    row.appendChild(card);
  });

  block.appendChild(row);
}

export default async function decorate(block, bridge) {
  let branches = [];

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      branches = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.branches — bare array outputSchema; key derived from actionName "find_branch"
      branches = structuredContent?.branches || [];
    }
  } else {
    branches = SAMPLE_DATA;
  }

  block.textContent = '';
  if (branches && branches.length) {
    renderBranches(block, branches, bridge);
  } else {
    renderEmptyState(block, bridge);
  }

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
