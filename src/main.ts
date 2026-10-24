import '@fontsource-variable/dm-sans';
import './style.css';
import projectData from './projects.json';
import previewData from './previews.json';

type Category = 'all' | 'apps' | 'games' | 'websites';
interface Project {
  id: string; title: string; type: string; category: string; coverSubtitle: string;
  url: string; description: string; scope: string; action: string;
}
interface Preview { src: string; alt: string; capturedAt?: string; source?: string; width?: number; height?: number }
const projects: Project[] = projectData;
const previews: Record<string, Preview> = previewData;
const escape = (s: string) => s.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const arrow = '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
const external = 'target="_blank" rel="noopener noreferrer"';

function cover(project: Project) {
  const preview = previews[project.id];
  if (preview) return `<img class="app-screenshot" src="${escape(preview.src)}" alt="${escape(preview.alt)}" width="${preview.width || 1440}" height="${preview.height || 820}" loading="lazy" decoding="async">`;
  const title = project.id === 'ash-and-oath' ? 'Ash<span class="cover-and"> and </span>Oath'
    : project.id === 'project-rone' ? '<span class="retro-window"><span class="retro-titlebar"><span></span><span class="retro-controls">─ □ ×</span></span><span class="retro-title">Project Rone</span></span>'
    : escape(project.title);
  return `<div class="project-cover cover-${project.id}" aria-hidden="true"><span class="cover-title">${title}</span><span class="cover-subtitle">${escape(project.coverSubtitle)}</span></div>`;
}

function card(project: Project) {
  const url = new URL(project.url);
  if (url.protocol !== 'https:') throw new Error('Live projects must use HTTPS.');
  return `<article class="project-card" data-category="${escape(project.type)}" id="project-${escape(project.id)}" aria-labelledby="title-${escape(project.id)}">
    <a class="preview-window" href="${escape(project.url)}" ${external} aria-label="Launch ${escape(project.title)} in a new tab">
      <div class="window-bar" aria-hidden="true"><span class="window-dots"><i></i><i></i><i></i></span><span class="window-address">${escape(url.hostname)}</span>${arrow}</div>
      <div class="window-content">${cover(project)}<span class="preview-hover">${escape(project.action)} ${arrow}</span></div>
    </a>
    <div class="card-content">
      <div class="card-top"><div><h2 id="title-${escape(project.id)}">${escape(project.title)}</h2><p class="project-category">${escape(project.category)}</p></div><a class="launch-button" href="${escape(project.url)}" ${external}>${escape(project.action)} ${arrow}<span class="sr-only">: ${escape(project.title)} (opens in a new tab)</span></a></div>
      <div class="project-description"><p>${escape(project.description)}</p>${project.scope ? `<p class="project-scope">${escape(project.scope)}</p>` : ''}</div>
    <p class="preview-caption">${previews[project.id] ? 'App screenshot' : 'Project cover'}${['intentshot', 'ash-and-oath'].includes(project.id) ? ' · Sign-in required' : ''}<span class="sr-only">. The visual preview and launch button open the real project in a new tab.</span></p>
    </div>
  </article>`;
}

const filters: [Category, string][] = [['all', 'All projects'], ['apps', 'Web apps'], ['games', 'Games'], ['websites', 'Websites']];
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <a class="skip-link" href="#work">Skip to projects</a>
  <header class="site-header container"><a class="wordmark" href="#top" aria-label="Doug, home">Doug.</a><nav aria-label="Main navigation"><a href="#work">Projects</a><a href="https://github.com/DougRev" ${external}>GitHub<span class="sr-only"> (opens in a new tab)</span></a></nav></header>
  <main class="container" id="work" tabindex="-1"><div id="top"></div>
    <section class="intro" aria-labelledby="page-title"><h1 id="page-title">Built to be explored.</h1><p>Web apps, games, and websites. Pick a project and jump into the live experience.</p></section>
    <div class="filters" role="group" aria-label="Filter projects">${filters.map(([key, name]) => `<button type="button" class="filter-button" data-filter="${key}" aria-pressed="${key === 'all'}" aria-controls="project-gallery">${name} (${key === 'all' ? projects.length : projects.filter(project => project.type === key).length})</button>`).join('')}</div>
    <p class="sr-only" role="status" id="filter-status" aria-live="polite">Showing all ${projects.length} projects.</p>
    <section class="project-grid" id="project-gallery" aria-label="Live project showcase">${projects.map(card).join('')}</section>
    <footer><a class="footer-wordmark" href="#top">Doug.</a><a href="https://github.com/DougRev" ${external}>GitHub<span class="sr-only"> (opens in a new tab)</span></a></footer>
  </main>`;

document.querySelectorAll<HTMLButtonElement>('.filter-button').forEach(button => {
  button.addEventListener('click', () => {
    const category = button.dataset.filter as Category;
    let count = 0;
    document.querySelectorAll<HTMLElement>('.project-card').forEach(card => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
      if (!card.hidden) count++;
    });
    document.querySelectorAll('.filter-button').forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    const singular = { apps: 'web app', games: 'game', websites: 'website' };
    const label = category !== 'all' && count === 1 ? singular[category] : filters.find(([key]) => key === category)![1].toLowerCase();
    document.querySelector('#filter-status')!.textContent = category === 'all' ? `Showing all ${count} projects.` : `Showing ${count} ${label}.`;
  });
});

// Preserve the visual fallback if a generated screenshot was moved or removed.
document.querySelectorAll<HTMLImageElement>('.app-screenshot').forEach(img => {
  img.addEventListener('error', () => {
    const article = img.closest<HTMLElement>('.project-card')!;
    const project = projects.find(item => `project-${item.id}` === article.id)!;
    delete previews[project.id];
    const wrapper = document.createElement('div');
    wrapper.innerHTML = cover(project);
    img.replaceWith(wrapper.firstElementChild!);
    article.querySelector('.preview-caption')!.textContent = `Project cover${['intentshot', 'ash-and-oath'].includes(project.id) ? ' · Sign-in required' : ''}`;
  }, { once: true });
});
