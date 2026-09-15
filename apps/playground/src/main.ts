import { EditorView } from '@codemirror/view';
import { forceLinting } from '@codemirror/lint';
import { commands, helpEnglish, LogoError, parse, type Diagnostic, type Options } from '@logo/logo';
import { applyOperation, initialState } from '@logo/turtle';
import { render, type Appearance } from '@logo/canvas-renderer';
import { createEditor, editable, executionLine, markError } from './editor';
import { complexityLevels, examples } from './examples';
import type { ExecutionState } from './controller';
import type { FromWorker, ToWorker } from './protocol';
import './style.css';
import { attachPan } from './pan';
import { localizeDiagnostic } from './diagnostics';
const dictionary = {
  pt: {
    subtitle: 'APRENDER DESENHANDO',
    title: 'Uma ideia. Muitos caminhos.',
    intro: 'Escreva, experimente e descubra o que a tartaruga pode criar.',
    ui: 'Interface',
    language: 'Comandos',
    mode: 'Modo de escrita',
    flexible: 'Flexível',
    strict: 'Strict',
    abbreviations: 'Strict + abreviações',
    editor: 'Seu programa',
    new: 'Novo',
    open: 'Abrir',
    save: 'Salvar',
    examples: 'Explorar exemplos',
    run: 'Executar',
    pause: 'Pausar',
    resume: 'Continuar',
    step: 'Passo a passo',
    stop: 'Parar',
    speed: 'Velocidade',
    slow: 'Lenta',
    instant: 'Instantânea',
    canvas: 'Área de descobertas',
    centerView: 'Centralizar vista',
    panHint: 'Arraste para mover a vista · Setas para navegar · Home para centralizar',
    appearance: 'Aparência',
    turtle: 'Tartaruga',
    triangle: 'Triângulo',
    console: 'Console',
    empty: 'A conversa com seu programa aparece aqui.',
    send: 'Enviar',
    input: 'Resposta do console',
    ready: 'Pronto para criar',
    running: 'Executando',
    paused: 'Pausado',
    waiting: 'Aguardando entrada',
    done: 'Concluído',
    stopped: 'Interrompido',
    error: 'Erro',
    guide: 'Guia de comandos',
    guideIntro: 'Um pequeno vocabulário, infinitas experiências.',
    hint: '0° aponta para cima · x cresce para a direita · y cresce para cima',
    dirty: 'Alterações não salvas',
    saved: 'Arquivo salvo',
    replace: 'Há alterações não salvas. Deseja substituir o programa?',
    modeHint: 'Mudar idioma ou modo não altera seu código.',
    line: 'Linha',
    col: 'coluna',
    loadError: 'Não foi possível abrir o arquivo.',
    name: 'programa.logo',
    file: 'Arquivo local',
    guideHelp: 'Nomes completos em inglês e português. Abreviações entre parênteses.',
    inputPrompt: 'Digite uma resposta e pressione Enviar.',
    export: 'Baixar programa',
    sourceError: 'O programa pode ter no máximo 200.000 caracteres.',
    instruction: 'instruções',
    welcome: 'Experimente mudar a distância ou o ângulo.',
  },
  en: {
    subtitle: 'LEARN BY DRAWING',
    title: 'One idea. Many paths.',
    intro: 'Write, experiment, and discover what your turtle can create.',
    ui: 'Interface',
    language: 'Commands',
    mode: 'Writing mode',
    flexible: 'Flexible',
    strict: 'Strict',
    abbreviations: 'Strict + abbreviations',
    editor: 'Your program',
    new: 'New',
    open: 'Open',
    save: 'Save',
    examples: 'Explore examples',
    run: 'Run',
    pause: 'Pause',
    resume: 'Continue',
    step: 'Step by step',
    stop: 'Stop',
    speed: 'Speed',
    slow: 'Slow',
    instant: 'Instant',
    canvas: 'Discovery canvas',
    centerView: 'Center view',
    panHint: 'Drag to pan · Arrow keys to navigate · Home to center',
    appearance: 'Appearance',
    turtle: 'Turtle',
    triangle: 'Triangle',
    console: 'Console',
    empty: 'Your conversation with the program appears here.',
    send: 'Send',
    input: 'Console response',
    ready: 'Ready to create',
    running: 'Running',
    paused: 'Paused',
    waiting: 'Waiting for input',
    done: 'Completed',
    stopped: 'Stopped',
    error: 'Error',
    guide: 'Command guide',
    guideIntro: 'A small vocabulary, endless experiments.',
    hint: '0° points up · x increases rightward · y increases upward',
    dirty: 'Unsaved changes',
    saved: 'File saved',
    replace: 'You have unsaved changes. Replace the program?',
    modeHint: 'Changing language or mode does not change your code.',
    line: 'Line',
    col: 'column',
    loadError: 'Could not open the file.',
    name: 'program.logo',
    file: 'Local file',
    guideHelp: 'Full names in English and Portuguese. Abbreviations in parentheses.',
    inputPrompt: 'Enter a response and press Send.',
    export: 'Download program',
    sourceError: 'Programs are limited to 200,000 characters.',
    instruction: 'instructions',
    welcome: 'Try changing the distance or the angle.',
  },
};
let ui: 'pt' | 'en' = 'pt',
  options: Options = { language: 'pt', mode: 'flexible' },
  appearance: Appearance = 'turtle';
let state: ExecutionState | 'ready' = 'ready',
  turtle = initialState(),
  worker: Worker | undefined,
  inputId: number | undefined,
  dirty = false,
  savedText = examples[0].code.pt,
  filename = 'programa.logo',
  log = '',
  errorText = '';
let savedRaw = savedText;
let editorLocked = false;
let consolePending = false;
let active = false,
  drawPending = false;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const t = (key: keyof typeof dictionary.pt) => dictionary[ui][key];
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<header><a class="brand" href="#"><span class="brand-icon">↗</span><span>ateliê<span class="brand-logo">logo</span><small data-i18n="subtitle"></small></span></a><label class="ui-language"><span data-i18n="ui"></span><select id="ui-language" aria-label="Interface"><option value="pt">Português</option><option value="en">English</option></select></label></header>
<main><section class="intro"><div><div class="eyebrow">01 / LOGO LAB</div><h1 data-i18n="title"></h1><p data-i18n="intro"></p></div><span class="intro-art" aria-hidden="true">↗<span>✳</span></span></section>
<section class="settings" aria-label="Settings"><label><span data-i18n="language"></span><select id="command-language"><option value="pt">Português</option><option value="en">English</option></select></label><label><span data-i18n="mode"></span><select id="mode"><option value="flexible" data-i18n="flexible"></option><option value="strict" data-i18n="strict"></option><option value="strict-abbreviations" data-i18n="abbreviations"></option></select></label><p data-i18n="modeHint"></p><a href="#guide" class="guide-link" data-i18n="guide"></a></section>
<div class="workspace"><section class="panel editor-panel"><div class="panel-heading"><h2><span class="section-number">01</span> <span data-i18n="editor"></span></h2><span id="dirty" class="file-state"></span></div><div class="file-tools"><button id="new" data-i18n="new"></button><button id="open" data-i18n="open"></button><button id="save" data-i18n="save"></button><select id="examples" aria-label="Exemplos"></select><input id="file" type="file" accept=".logo,.lgo,.txt,text/plain" hidden></div><div id="editor"></div><div id="diagnostic" role="alert" hidden></div><div class="execution-tools"><button id="run" class="primary">▶ <span data-i18n="run"></span></button><button id="pause" data-i18n="pause"></button><button id="resume" data-i18n="resume"></button><button id="step" data-i18n="step"></button><button id="stop" data-i18n="stop" class="stop"></button></div><div class="speed"><label for="speed" data-i18n="speed"></label><span data-i18n="slow"></span><input id="speed" type="range" min="0" max="100" value="80"><span data-i18n="instant"></span></div><div class="status-row"><span class="status-dot"></span><span id="status" role="status"></span><span id="location"></span></div></section>
<section class="panel canvas-panel"><div class="panel-heading"><h2><span class="section-number">02</span> <span data-i18n="canvas"></span></h2><button id="center-view" class="center-view"><span aria-hidden="true">⌖</span><span class="sr-only" data-i18n="centerView"></span></button><label class="appearance"><span class="sr-only" data-i18n="appearance"></span><select id="appearance"><option value="turtle" data-i18n="turtle"></option><option value="triangle" data-i18n="triangle"></option></select></label></div><div class="canvas-wrap"><canvas id="canvas" tabindex="0" aria-describedby="pan-hint" role="img" aria-label="Desenho da tartaruga"></canvas><div class="coordinates" id="coordinates"></div></div><div class="canvas-note"><span id="pan-hint" data-i18n="panHint"></span></div></section>
<section class="panel console-panel"><div class="panel-heading"><h2><span class="section-number">03</span> <span data-i18n="console"></span></h2><span class="console-symbol" aria-hidden="true">&gt;_</span></div><pre id="console" aria-live="polite" tabindex="0"></pre><form id="input-form" hidden><label for="input" id="input-label"></label><div><span aria-hidden="true">❯</span><input id="input" autocomplete="off"><button class="primary" data-i18n="send" type="submit"></button></div></form></section></div>
<details id="guide"><summary><span data-i18n="guide"></span><span>＋</span></summary><p data-i18n="guideIntro"></p><p data-i18n="guideHelp"></p><div class="command-grid" id="commands"></div></details><footer><span>ateliê logo</span><span data-i18n="welcome"></span></footer></main>`;
const editor = createEditor(
  $('editor'),
  savedText,
  () => options,
  (text) => {
    dirty = text !== savedText;
    updateDirty();
  },
  (d) => localizeDiagnostic(d, ui),
);
const canvas = $<HTMLCanvasElement>('canvas');
const view = attachPan(canvas, draw);
$('center-view').onclick = view.reset;
function draw() {
  if (drawPending) return;
  drawPending = true;
  requestAnimationFrame(() => {
    drawPending = false;
    render(canvas, turtle, appearance, true, view.offset);
    $('coordinates').textContent =
      `x ${turtle.x.toFixed(1)}  ·  y ${turtle.y.toFixed(1)}  ·  ${turtle.heading.toFixed(0)}°`;
  });
}
new ResizeObserver(draw).observe(canvas);
function updateDirty() {
  $('dirty').textContent = dirty ? `● ${t('dirty')}` : filename;
}
function update() {
  document.documentElement.lang = ui === 'pt' ? 'pt-BR' : 'en';
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n as keyof typeof dictionary.pt);
  });
  $('examples').replaceChildren(
    new Option(t('examples'), ''),
    ...complexityLevels.map((level) => {
      const group = document.createElement('optgroup');
      group.label = level.name[ui];
      examples.forEach((example, index) => {
        if (example.level === level.id) group.append(new Option(example.name[ui], String(index)));
      });
      return group;
    }),
  );
  $('status').textContent = t(state);
  $('console').textContent = log || t('empty');
  $('diagnostic').textContent = errorText;
  $('diagnostic').hidden = !errorText;
  $('input-label').textContent = t('inputPrompt');
  $<HTMLInputElement>('input').setAttribute('aria-label', t('input'));
  $('canvas').setAttribute('aria-label', ui === 'pt' ? 'Desenho da tartaruga' : 'Turtle drawing');
  $('examples').setAttribute('aria-label', t('examples'));
  $('center-view').title = t('centerView');
  canvas.title = t('hint');
  updateDirty();
  updateControls();
  document.querySelectorAll<HTMLElement>('[data-command-help]').forEach((el) => {
    const c = commands.find((c) => c.name === el.dataset.commandHelp)!;
    el.textContent = ui === 'en' ? helpEnglish[c.name] : c.help;
  });
  forceLinting(editor);
}
function updateControls() {
  for (const id of ['new', 'open', 'examples', 'command-language', 'mode'])
    $<HTMLButtonElement>(id).disabled = active;
  $<HTMLButtonElement>('run').disabled = active;
  $<HTMLButtonElement>('pause').disabled = !active || state === 'paused';
  $<HTMLButtonElement>('resume').disabled = !active || state !== 'paused';
  $<HTMLButtonElement>('stop').disabled = !active;
  if (editorLocked !== active) {
    editorLocked = active;
    editor.dispatch({ effects: editable.reconfigure(EditorView.editable.of(!active)) });
  }
}
function send(message: ToWorker) {
  worker?.postMessage(message);
}
function write(text: string) {
  log += text;
  if (log.length > 100000) log = '[…]\n' + log.slice(-90000);
  if (!consolePending) {
    consolePending = true;
    requestAnimationFrame(() => {
      consolePending = false;
      $('console').textContent = log || t('empty');
      $('console').scrollTop = $('console').scrollHeight;
    });
  }
}
function report(d: Diagnostic) {
  d = localizeDiagnostic(d, ui);
  errorText = `${t('line')} ${d.line}, ${t('col')} ${d.column}: ${d.message} ${d.suggestion ?? ''}`;
  $('diagnostic').textContent = errorText;
  $('diagnostic').hidden = false;
  markError(editor, d);
}
function finish(next: ExecutionState) {
  active = false;
  state = next;
  inputId = undefined;
  $('input-form').hidden = true;
  worker?.terminate();
  worker = undefined;
  editor.dispatch({ effects: executionLine.of(-1) });
  $('status').textContent = t(state);
  updateControls();
}
function run(paused = false) {
  const source = editor.state.doc.toString();
  errorText = '';
  $('diagnostic').hidden = true;
  try {
    parse(source, options);
  } catch (error) {
    if (error instanceof LogoError) {
      report(error.diagnostic);
      state = 'error';
      $('status').textContent = t(state);
    }
    return;
  }
  worker?.terminate();
  turtle = initialState();
  log = '';
  $('console').textContent = t('empty');
  $('location').textContent = '';
  draw();
  active = true;
  state = paused ? 'paused' : 'running';
  updateControls();
  worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const currentWorker = worker;
  worker.onerror = (event) => {
    if (worker !== currentWorker) return;
    report({ line: 1, column: 1, offset: 0, end: 0, message: event.message });
    finish('error');
  };
  worker.onmessage = (event: MessageEvent<FromWorker>) => {
    if (worker !== currentWorker) return;
    const m = event.data;
    if (m.type === 'operation') {
      try {
        applyOperation(turtle, m.operation);
        draw();
      } catch (error) {
        report({ ...m.loc, message: error instanceof Error ? error.message : String(error) });
        finish('error');
      }
    } else if (m.type === 'write') write(m.text);
    else if (m.type === 'error') report(m.diagnostic);
    else if (m.type === 'input-error') write(`⚠ ${localizeDiagnostic(m.diagnostic, ui).message}\n`);
    else if (m.type === 'input') {
      inputId = m.id;
      $('input-form').hidden = false;
      $<HTMLInputElement>('input').value = '';
      $<HTMLInputElement>('input').focus();
      $('input-label').textContent = `${t('inputPrompt')} (${m.kind})`;
    } else if (m.type === 'state') {
      state = m.state;
      if (m.loc) {
        editor.dispatch({
          effects: [
            executionLine.of(m.loc.offset),
            EditorView.scrollIntoView(m.loc.offset, { y: 'nearest' }),
          ],
        });
        $('location').textContent = `${t('line')} ${m.loc.line}:${m.loc.column}`;
      }
      if (['done', 'stopped', 'error'].includes(m.state)) {
        finish(m.state);
        if (m.instructions !== undefined)
          $('location').textContent = `${m.instructions} ${t('instruction')}`;
      } else {
        $('status').textContent = t(state);
        updateControls();
      }
    }
  };
  send({ type: 'start', source, options, paused, delay: delay() });
  if (paused) send({ type: 'step' });
}
function delay() {
  const value = Number($<HTMLInputElement>('speed').value);
  return value === 100 ? 0 : Math.round((100 - value) ** 2 / 10);
}
function replace(text: string, name: string, saved: boolean) {
  if (dirty && !confirm(t('replace'))) return false;
  editor.dispatch({
    changes: { from: 0, to: editor.state.doc.length, insert: text },
    effects: executionLine.of(-1),
  });
  savedText = saved ? editor.state.doc.toString() : '';
  savedRaw = text;
  filename = name;
  dirty = editor.state.doc.toString() !== savedText;
  errorText = '';
  state = 'ready';
  update();
  forceLinting(editor);
  return true;
}
$('new').onclick = () => replace('', t('name'), true);
$('open').onclick = () => $<HTMLInputElement>('file').click();
$<HTMLInputElement>('file').onchange = async (event) => {
  const input = event.target as HTMLInputElement,
    file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 800000) throw new Error(t('sourceError'));
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
      await file.arrayBuffer(),
    );
    if (text.length > 200000) throw new Error(t('sourceError'));
    replace(text, file.name, true);
  } catch (error) {
    errorText = `${t('loadError')} ${String(error)}`;
    update();
  } finally {
    input.value = '';
  }
};
$('save').onclick = () => {
  const text = editor.state.doc.toString(),
    raw = text === savedText ? savedRaw : text,
    blob = new Blob([raw], { type: 'text/plain;charset=utf-8' }),
    url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  savedText = text;
  savedRaw = raw;
  dirty = false;
  updateDirty();
};
$<HTMLSelectElement>('examples').onchange = (event) => {
  const select = event.target as HTMLSelectElement;
  if (select.value !== '')
    replace(examples[Number(select.value)].code[options.language], t('name'), false);
  select.value = '';
};
$('run').onclick = () => run();
$('step').onclick = () => {
  if (!active) run(true);
  else send({ type: 'step' });
};
$('pause').onclick = () => send({ type: 'pause' });
$('resume').onclick = () => send({ type: 'resume' });
$('stop').onclick = () => {
  send({ type: 'stop' });
  finish('stopped');
};
$<HTMLInputElement>('speed').oninput = () => send({ type: 'speed', delay: delay() });
$('input-form').onsubmit = (event) => {
  event.preventDefault();
  if (inputId === undefined) return;
  const text = $<HTMLInputElement>('input').value;
  write(`❯ ${text}\n`);
  send({ type: 'input', id: inputId, text });
  inputId = undefined;
  $('input-form').hidden = true;
};
$<HTMLSelectElement>('ui-language').onchange = (event) => {
  ui = (event.target as HTMLSelectElement).value as typeof ui;
  update();
};
$<HTMLSelectElement>('command-language').onchange = (event) => {
  options = {
    ...options,
    language: (event.target as HTMLSelectElement).value as Options['language'],
  };
  forceLinting(editor);
};
$<HTMLSelectElement>('mode').onchange = (event) => {
  options = { ...options, mode: (event.target as HTMLSelectElement).value as Options['mode'] };
  forceLinting(editor);
};
$<HTMLSelectElement>('appearance').onchange = (event) => {
  appearance = (event.target as HTMLSelectElement).value as Appearance;
  draw();
};
window.addEventListener('beforeunload', (event) => {
  if (dirty) {
    event.preventDefault();
    event.returnValue = '';
  }
});
for (const c of commands) {
  const article = document.createElement('article'),
    title = document.createElement('h3'),
    help = document.createElement('p'),
    code = document.createElement('pre');
  title.textContent = `${c.name} / ${c.pt}`;
  help.textContent = c.help;
  help.dataset.commandHelp = c.name;
  code.textContent = c.example;
  article.append(title, help);
  const short = document.createElement('small');
  short.textContent = `EN: ${c.enShort.join(', ') || '—'} · PT: ${c.ptShort.join(', ') || '—'} · ${c.arity < 0 ? '…' : c.arity} args`;
  article.append(short, code);
  $('commands').append(article);
}
update();
draw();
