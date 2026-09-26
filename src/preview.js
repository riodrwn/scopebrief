// Source HTML is never inserted into the document.
function inline(parent, text) {
  const token = /(\\[\\`*_[\]<>])|(`+)([\s\S]*?)\2|\*\*([^*]+)\*\*|\[([^\]]+)\]\(<([^>]+)>\)/g;
  let last = 0, match;
  while ((match = token.exec(text))) {
    parent.append(document.createTextNode(text.slice(last, match.index)));
    if (match[1]) parent.append(document.createTextNode(match[1].slice(1)));
    else if (match[2]) { const e = document.createElement('code'); e.textContent = match[3].trim(); parent.append(e); }
    else if (match[4]) { const e = document.createElement('strong'); e.textContent = match[4]; parent.append(e); }
    else {
      let url; try { url = new URL(match[6]); } catch {}
      if (url && ['https:', 'http:'].includes(url.protocol)) {
        const e = document.createElement('a'); e.textContent = match[5]; e.href = url.href; e.target = '_blank'; e.rel = 'noopener noreferrer'; parent.append(e);
      } else parent.append(document.createTextNode(match[5]));
    }
    last = token.lastIndex;
  }
  parent.append(document.createTextNode(text.slice(last)));
}
export function renderPreview(root, markdown) {
  root.replaceChildren(); const lines = markdown.split('\n'); let i = 0;
  const add = (tag, text) => { const e = document.createElement(tag); inline(e, text); root.append(e); };
  while (i < lines.length) {
    const line = lines[i++];
    if (!line.trim()) continue;
    const fence = line.match(/^(`{3,})/);
    if (fence) {
      const block = [];
      while (i < lines.length && lines[i].trim() !== fence[1]) block.push(lines[i++]);
      i++; const pre = document.createElement('pre'), code = document.createElement('code'); code.textContent = block.join('\n'); pre.append(code); root.append(pre); continue;
    }
    const heading = line.match(/^(#{1,6}) (.*)$/);
    if (heading) { add('h' + Math.min(6, heading[1].length), heading[2]); continue; }
    if (line === '---') { root.append(document.createElement('hr')); continue; }
    if (/^\s*(?:- |\d+\. )/.test(line)) {
      const list = document.createElement(/^\s*\d+\. /.test(line) ? 'ol' : 'ul');
      const first = document.createElement('li'); inline(first, line.replace(/^\s*(?:- |\d+\. )/, '')); list.append(first);
      while (i < lines.length && /^\s*(?:- |\d+\. )/.test(lines[i])) {
        const li = document.createElement('li'); inline(li, lines[i++].replace(/^\s*(?:- |\d+\. )/, '')); list.append(li);
      }
      root.append(list); continue;
    }
    const paragraph = [line];
    while (i < lines.length && lines[i].trim() && !/^(#|```|---|\s*- |\s*\d+\. )/.test(lines[i])) paragraph.push(lines[i++]);
    const p = document.createElement('p');
    paragraph.forEach((text, n) => { if (n) p.append(document.createElement('br')); inline(p, text); }); root.append(p);
  }
}
