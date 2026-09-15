import type { Diagnostic, InputKind, Location, Operation, Options, Limits } from '@logo/logo';
import type { ExecutionState } from './controller';
export type ToWorker =
  | {
      type: 'start';
      source: string;
      options: Options;
      paused: boolean;
      delay: number;
      limits?: Limits;
    }
  | { type: 'pause' | 'resume' | 'step' | 'stop' }
  | { type: 'speed'; delay: number }
  | { type: 'input'; id: number; text: string };
export type FromWorker =
  | { type: 'state'; state: ExecutionState; loc?: Location; instructions?: number }
  | { type: 'operation'; operation: Operation; loc: Location }
  | { type: 'write'; text: string }
  | { type: 'input'; id: number; kind: InputKind; loc: Location }
  | { type: 'error' | 'input-error'; diagnostic: Diagnostic };
