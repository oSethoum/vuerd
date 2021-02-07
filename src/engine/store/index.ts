import { CommandTypeAll, CommandTypeAny } from '@@types/engine/command';
import { State } from '@@types/engine/store';
import { IStore } from '@/internal-types/store';
import { observable } from '@dineug/lit-observable';
import { createCanvasState } from './canvas.state';
import { createTableState } from './table.state';
import { createRelationshipState } from './relationship.state';
import { createMemoState } from './memo.state';
import { createEditorState } from './editor.state';
import { createShareState } from './share.state';
import { createHistory } from '@/core/history';
import { createStream, executeCommand } from '@/engine/command';
import { createSubscriptionHelper } from '@/core/helper';

const mergeIterator = (
  acc: Array<CommandTypeAll>,
  cur: any
): CommandTypeAll[] => [...acc, ...(cur[Symbol.iterator] ? [...cur] : [cur])];
const mergeCommand = (commands: CommandTypeAny[]) =>
  commands.reduce<Array<CommandTypeAll>>(mergeIterator, []);

const createState = (): State => ({
  canvasState: observable(createCanvasState()),
  tableState: observable(createTableState()),
  relationshipState: observable(createRelationshipState()),
  memoState: observable(createMemoState()),
  editorState: observable(createEditorState()),
  shareState: observable(createShareState()),
});

export function createStore(): IStore {
  const subscriptionHelper = createSubscriptionHelper();
  const state = createState();
  const { dispatch$, history$ } = createStream();
  const history = createHistory(() => {});
  const command = executeCommand(state);
  const dispatch = (...commands: CommandTypeAny[]) =>
    dispatch$.next(mergeCommand(commands));
  const destroy = () => {
    subscriptionHelper.destroy();
    history.clear();
  };

  subscriptionHelper.push(
    history$.subscribe(command),
    // TODO: executeHistoryCommand
    dispatch$.subscribe(command)
  );

  return {
    ...state,
    dispatch,
    undo: history.undo,
    redo: history.redo,
    destroy,
  };
}
