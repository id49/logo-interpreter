# Ateliê Logo

Ambiente educacional Logo em TypeScript: editor, tartaruga, console e execução controlada em Web Worker. Interface em português/inglês, independente do idioma dos comandos. Subconjunto próprio inspirado no Berkeley Logo — não é uma implementação integral de Berkeley Logo ou SuperLogo.

## Executar localmente

Requer Node.js 24 e npm 11.

```sh
npm ci
npm run dev
```

Abra o endereço local mostrado pelo Vite (normalmente `http://127.0.0.1:5173`). Nenhuma conta, serviço remoto ou publicação é necessária. Scripts Logo não acessam arquivos, rede ou APIs do navegador.

```logo
repita 4 [
  parafrente 100
  paradireita 90
]
```

## Usar

- **Executar** começa uma execução limpa: variáveis, desenho e tartaruga são reiniciados.
- **Pausar / Continuar** preservam estado. **Passo a passo** começa pausado e libera uma instrução por clique, incluindo corpos de repetições e procedimentos.
- **Parar** encerra o Worker inteiro e preserva o desenho. O comando `stop/pare` apenas sai do procedimento atual.
- A velocidade pode mudar durante a execução. Instantânea remove os atrasos pedagógicos; o Worker ainda cede tempo para comunicação.
- **Abrir** lê um arquivo UTF-8 local. **Salvar** baixa o código. Novo, Abrir e exemplos pedem confirmação se houver alterações não salvas. Arquivos abertos e salvos sem editar preservam inclusive BOM e CRLF; edições usam LF.
- A resposta a `readword/readlist/readchar` é digitada no console. Entradas inválidas podem ser corrigidas sem perder variáveis ou reiniciar o orçamento.
- **Arraste o grid** com mouse ou toque para navegar pelo desenho. O botão **Centralizar vista** (⌖) retorna à origem; com o canvas focado, use as setas e Home. A navegação não altera o programa, a tartaruga ou os traços.
- A aparência da tartaruga pode mudar durante ou depois da execução sem alterar o desenho.

## Exemplos por complexidade

O seletor **Explorar exemplos** reúne 15 programas, com versões em português e inglês:

- **Iniciante:** primeiro quadrado, primeiros movimentos, triângulo equilátero, caminho tracejado e estrela de cinco pontas.
- **Intermediário:** jardim geométrico, conversa no console, quadrados crescentes, casa com procedimento e paleta de cores.
- **Avançado:** espiral recursiva, árvore recursiva, floco de Koch, quadrados recursivos e polígonos com retorno.

Os nomes e grupos seguem o idioma da interface; o código carregado segue o idioma dos comandos. Os comentários dos novos exemplos destacam o conceito a explorar.

## Modos

| Modo                 | Idiomas aceitos                       | Caixa               | Abreviações                    |
| -------------------- | ------------------------------------- | ------------------- | ------------------------------ |
| Flexível             | Português e inglês juntos             | Qualquer            | Oficiais dos dois idiomas      |
| Strict               | Apenas idioma de comandos selecionado | Comandos minúsculos | Não                            |
| Strict + abreviações | Apenas idioma de comandos selecionado | Comandos minúsculos | Oficiais do idioma selecionado |

Em todos os modos: sintaxe, delimitadores e aridade são obrigatórios. Não há prefixos adivinhados nem correções automáticas. Alterar seletores não reescreve o código. Indentação é recomendada, nunca obrigatória. Strict é uma regra pedagógica deste produto, não uma exigência histórica de Logo.

## Documentação

- [Especificação e decisões do dialeto](docs/SPECIFICATION.md)
- [Todos os comandos e exemplos executáveis](docs/COMMANDS.md)
- [Arquitetura, execução e protocolo](docs/ARCHITECTURE.md)
- [Auditoria de requisitos e validação](docs/VALIDATION.md)
- [Exemplos individuais para abrir no editor](docs/examples/)

## Verificar

```sh
npm run check           # lint, tipos (inclui testes), unidade, build
npx playwright install chromium
npm run test:e2e        # UI, Worker real, arquivos, snapshots do canvas
npm run test:production # smoke test do bundle compilado
npm run docs           # regenera referência e exemplos
npm run format:check
```

A CI repete as verificações e instala Chromium no Ubuntu. Referências visuais estão em `tests/visual/`; atualize-as apenas após revisar uma mudança intencional no desenho. Playwright salva rastros de falhas e relatório HTML.

## Organização

```text
apps/playground/             Vite, CodeMirror, interface, Worker e controlador
packages/logo/              léxico, parser, vocabulário, interpretador e portas de I/O
packages/turtle/            estado e geometria, sem DOM
packages/canvas-renderer/   apresentação Canvas 2D, duas aparências
packages/typescript-config/ configuração TypeScript compartilhada
docs/                      especificação, referência e auditoria
tests/                     integração no navegador e regressões visuais
```

Sem `eval`, sem backend e sem execução dinâmica de listas. As bibliotecas internas exportam TypeScript e são compiladas pelo aplicativo consumidor; seus builds verificam tipos.
