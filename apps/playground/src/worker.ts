import { Cancelled, Interpreter, LogoError, type InputKind, type Location } from '@logo/logo';
import { Controller } from './controller';
import type { FromWorker, ToWorker } from './protocol';
let controller: Controller | undefined;
let input:
  { id: number; resolve: (text: string) => void; reject: (reason: Error) => void } | undefined;
let nextInput = 0;
let stateTick = 0;
const send = (message: FromWorker) => postMessage(message);
self.onmessage = (event: MessageEvent<ToWorker>) => {
  const message = event.data;
  if (message.type === 'start') {
    if (controller) return;
    controller = new Controller(message.paused, (state, loc) => {
      if (loc && state === 'running' && controller?.delay === 0 && ++stateTick % 32 !== 1) return;
      send({ type: 'state', state, loc });
    });
    controller.setDelay(message.delay);
    const current = controller;
    const read = async (kind: InputKind, loc: Location) => {
      const text = await new Promise<string>((resolve, reject) => {
        const id = ++nextInput;
        input = { id, resolve, reject };
        send({ type: 'input', id, kind, loc });
        send({ type: 'state', state: 'waiting', loc });
      });
      await current.afterInput();
      return text;
    };
    void (async () => {
      let runtime: Interpreter | undefined;
      try {
        runtime = new Interpreter(
          message.source,
          message.options,
          {
            beforeInstruction: (loc) => current.before(loc),
            cancelled: () => current.stopped,
            cooperate: () => new Promise((resolve) => setTimeout(resolve, 0)),
            operation: (operation, loc) => send({ type: 'operation', operation, loc }),
            write: (text) => send({ type: 'write', text }),
            read,
            inputError: (error) => send({ type: 'input-error', diagnostic: error.diagnostic }),
          },
          message.limits,
        );
        await runtime.run();
        send({ type: 'state', state: 'done', instructions: runtime.instructions });
      } catch (error) {
        if (error instanceof Cancelled) send({ type: 'state', state: 'stopped' });
        else {
          const diagnostic =
            error instanceof LogoError
              ? error.diagnostic
              : {
                  line: 1,
                  column: 1,
                  offset: 0,
                  end: 0,
                  message: error instanceof Error ? error.message : String(error),
                };
          send({ type: 'error', diagnostic });
          send({ type: 'state', state: 'error', instructions: runtime?.instructions });
        }
      } finally {
        input = undefined;
      }
    })();
  } else if (message.type === 'input') {
    if (input?.id === message.id) {
      input.resolve(message.text);
      input = undefined;
    }
  } else if (message.type === 'speed') controller?.setDelay(message.delay);
  else if (message.type === 'stop') {
    controller?.stop();
    input?.reject(new Cancelled());
    input = undefined;
  } else if (message.type === 'pause') controller?.pause();
  else if (message.type === 'resume') controller?.resume();
  else if (message.type === 'step') controller?.step();
};
