import { readFile, writeFile, mkdir } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(
  new URL('../packages/logo/src/vocabulary.ts', import.meta.url),
  'utf8',
);
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { commands, helpEnglish } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
);
let doc =
  '# Referência de comandos / Command reference\n\nGerado por `npm run docs`. As abreviações abaixo são o vocabulário oficial **deste dialeto**. Todas as entradas possuem exemplos executados nos testes em inglês e português. Para executar os exemplos em inglês, selecione Flexível ou comandos English.\n\n';
await mkdir(new URL('../docs/examples/', import.meta.url), { recursive: true });
for (const c of commands) {
  doc += `## ${c.name} / ${c.pt}\n\n${c.help}\n\n${helpEnglish[c.name]}\n\n- Argumentos: ${c.arity < 0 ? 'cabeçalho: nome e zero ou mais parâmetros' : c.arity}.\n- Abreviações EN: ${c.enShort.join(', ') || 'nenhuma'}. PT: ${c.ptShort.join(', ') || 'nenhuma'}.\n- ${c.reporter ? 'Produz um valor.' : 'Instrução ou delimitador estrutural.'}\n\n\`\`\`logo\n${c.example}\n\`\`\`\n\n`;
  await writeFile(new URL(`../docs/examples/${c.name}.logo`, import.meta.url), c.example + '\n');
}
await writeFile(new URL('../docs/COMMANDS.md', import.meta.url), doc.trimEnd() + '\n');
