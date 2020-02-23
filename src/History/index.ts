import Maybe from 'frctl/Maybe';

import {
    Stack,
    empty as emptyStack
} from 'Stack';

export interface History<T> {
    isUndoable(): boolean;
    isReadoable(): boolean;
    getCurrent(): T;

    push(step: T): History<T>;

    undo(): Maybe<History<T>>;
    redo(): Maybe<History<T>>;
}

class HistoryImpl<T> implements History<T> {
    public constructor(
        private readonly current: T,
        private readonly done: Stack<T>,
        private readonly undone: Stack<T>
    ) {}

    public isUndoable(): boolean {
        return !this.done.isEmpty();
    }

    public isReadoable(): boolean {
        return !this.undone.isEmpty();
    }

    public getCurrent(): T {
        return this.current;
    }

    public push(step: T): History<T> {
        return new HistoryImpl(
            step,
            this.done.push(this.current),
            emptyStack
        );
    }

    public undo(): Maybe<History<T>> {
        return this.done.pop().map(
            ([ nextCurrent, nextDone ]) => new HistoryImpl(nextCurrent, nextDone, this.undone.push(this.current))
        );
    }

    public redo(): Maybe<History<T>> {
        return this.undone.pop().map(
            ([ nextCurrent, nextUndone ]) => new HistoryImpl(nextCurrent, this.done.push(this.current), nextUndone)
        );
    }
}

export const init = <T>(initial: T): History<T> => new HistoryImpl(initial, emptyStack, emptyStack);
