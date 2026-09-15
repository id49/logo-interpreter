import { Compartment, EditorState, StateEffect, StateField } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  type DecorationSet,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  StreamLanguage,
  syntaxHighlighting,
  defaultHighlightStyle,
  indentUnit,
} from '@codemirror/language';
import { linter, lintGutter, setDiagnostics } from '@codemirror/lint';
import { LogoError, parse, reserved, type Options, type Diagnostic } from '@logo/logo';
export const editable = new Compartment();
export const executionLine = StateEffect.define<number>();
const executionField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(value, tr) {
    value = value.map(tr.changes);
    for (const e of tr.effects)
      if (e.is(executionLine))
        value =
          e.value < 0
            ? Decoration.none
            : Decoration.set([
                Decoration.line({ class: 'executing-line' }).range(
                  tr.state.doc.lineAt(Math.min(e.value, tr.state.doc.length)).from,
                ),
              ]);
    return value;
  },
  provide: (field) => EditorView.decorations.from(field),
});
const logo = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match(/;.*/)) return 'comment';
    if (stream.match(/"[^\s[\];()]*/)) return 'string';
    if (stream.match(/:[\p{L}\p{N}_-]+/u)) return 'variableName';
    if (stream.match(/\d+(?:\.\d*)?/)) return 'number';
    if (stream.match(/[[\]()]/)) return 'bracket';
    if (stream.match(/[+*/=<>-]+/)) return 'operator';
    if (stream.match(/[\p{L}_][\p{L}\p{N}_-]*/u))
      return reserved.has(stream.current().toLowerCase()) ? 'keyword' : 'name';
    stream.next();
    return null;
  },
});
export function createEditor(
  parent: HTMLElement,
  doc: string,
  options: () => Options,
  onChange: (text: string) => void,
  localize: (d: Diagnostic) => Diagnostic = (d) => d,
) {
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        editable.of(EditorView.editable.of(true)),
        lineNumbers(),
        history(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        indentUnit.of('  '),
        logo,
        syntaxHighlighting(defaultHighlightStyle),
        executionField,
        lintGutter(),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ 'aria-label': 'Logo code editor', spellcheck: 'false' }),
        linter(
          (view) => {
            try {
              parse(view.state.doc.toString(), options());
              return [];
            } catch (error) {
              if (error instanceof LogoError) {
                const d = localize(error.diagnostic);
                return [
                  {
                    from: Math.min(d.offset, view.state.doc.length),
                    to: Math.min(Math.max(d.end, d.offset + 1), view.state.doc.length),
                    severity: 'error',
                    message: d.message + ' ' + (d.suggestion ?? ''),
                  },
                ];
              }
              return [];
            }
          },
          { delay: 350 },
        ),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChange(update.state.doc.toString());
        }),
      ],
    }),
  });
  return view;
}
export function markError(view: EditorView, d: Diagnostic) {
  const from = Math.min(d.offset, view.state.doc.length),
    to = Math.min(Math.max(d.end, from + 1), view.state.doc.length);
  view.dispatch(
    setDiagnostics(view.state, [
      {
        from,
        to,
        severity: 'error',
        message: `${d.line}:${d.column} ${d.message} ${d.suggestion ?? ''}`,
      },
    ]),
  );
  view.dispatch({
    selection: { anchor: from },
    effects: EditorView.scrollIntoView(from, { y: 'center' }),
  });
}
