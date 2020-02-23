import Maybe from 'frctl/Maybe';

import {
    Stack,
    empty as emptyStack
} from 'Stack';

export interface History<T> {
    isUndoable(): boolean;
    isReadoable(): boolean;

    push(step: T): History<T>;

    undo(): Maybe<[ T, History<T> ]>;
    redo(): Maybe<[ T, History<T> ]>;
}

class HistoryImpl<T> implements History<T> {
    public constructor(
        private readonly done: Stack<T>,
        private readonly undone: Stack<T>
    ) {}

    public isUndoable(): boolean {
        return !this.done.isEmpty();
    }

    public isReadoable(): boolean {
        return !this.undone.isEmpty();
    }

    public push(step: T): History<T> {
        return new HistoryImpl(
            this.done.push(step),
            emptyStack
        );
    }

    public undo(): Maybe<[ T, History<T> ]> {
        return this.done.pop().map(([ step, nextDone ]) => [
            step,
            new HistoryImpl(
                nextDone,
                this.undone.push(step)
            )
        ]);
    }

    public redo(): Maybe<[ T, History<T> ]> {
        return this.undone.pop().map(([ step, nextUndone ]) => [
            step,
            new HistoryImpl(
                this.done.push(step),
                nextUndone
            )
        ]);
    }
}

export const empty: History<never> = new HistoryImpl(emptyStack, emptyStack);
