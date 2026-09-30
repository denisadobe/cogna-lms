import { moveInstrumentation } from '../../scripts/ue-utils.js';

/**
 * Builds the embeddable URL for a video link.
 * @param {URL} url video URL
 * @returns {{type: string, src: string}|null}
 */
function resolveVideo(url) {
  const host = url.hostname.replace(/^www\./, '');
  if (host === 'youtu.be' || host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    const id = host === 'youtu.be'
      ? url.pathname.slice(1)
      : url.searchParams.get('v') || url.pathname.split('/').pop();
    return { type: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` };
  }
  if (host.endsWith('vimeo.com')) {
    const id = url.pathname.split('/').filter(Boolean).pop();
    return { type: 'iframe', src: `https://player.vimeo.com/video/${id}?autoplay=1` };
  }
  if (/\.(mp4|webm|m3u8)$/i.test(url.pathname)) return { type: 'video', src: url.href };
  return { type: 'iframe', src: url.href };
}

/**
 * Vídeo (videoaula): link do vídeo (YouTube, Vimeo, MP4 ou player externo),
 * imagem de capa opcional e título/descrição opcionais. O player só carrega ao clicar.
 * @param {Element} block
 */
export default function decorate(block) {
  const link = block.querySelector('a[href]');
  const href = link?.href || block.textContent.match(/https?:\/\/\S+/)?.[0];
  if (!href) return;
  const video = resolveVideo(new URL(href));
  const poster = block.querySelector('picture');

  const texts = [...block.querySelectorAll(':scope > div > div')]
    .filter((cell) => !cell.querySelector('picture') && !cell.querySelector('a[href]') && cell.textContent.trim());
  const title = texts[0]?.textContent.trim() || 'Videoaula';

  const player = document.createElement('div');
  player.className = 'video-player';
  if (poster) player.append(poster);

  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'video-play';
  play.innerHTML = `<span class="video-play-icone" aria-hidden="true"></span><span class="video-play-texto">Assistir</span><span class="visually-hidden">: ${title}</span>`;
  player.append(play);

  play.addEventListener('click', () => {
    let el;
    if (video.type === 'video') {
      el = document.createElement('video');
      el.src = video.src;
      el.controls = true;
      el.autoplay = true;
      el.playsInline = true;
    } else {
      el = document.createElement('iframe');
      el.src = video.src;
      el.title = title;
      el.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      el.allowFullscreen = true;
    }
    player.replaceChildren(el);
    player.classList.add('ativo');
    el.focus();
  });

  block.replaceChildren(player);
  texts.forEach((cell, i) => {
    const div = document.createElement('div');
    div.className = i === 0 ? 'video-titulo' : 'video-descricao';
    moveInstrumentation(cell, div);
    div.append(...cell.childNodes);
    block.append(div);
  });
}
