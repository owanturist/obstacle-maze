import Maybe, { Nothing, Just } from 'frctl/Maybe';

export interface Stack<T> {
    isEmpty(): boolean;

    push(value: T): Stack<T>;

    pop(): Maybe<[ T, Stack<T> ]>;
}

export const empty: Stack<never> = new class Null<T> implements Stack<T> {
    public isEmpty(): boolean {
        return true;
    }

    public push(value: T): Stack<T> {
        return new Node(value, this);
    }

    public pop(): Maybe<[ T, Stack<T> ]> {
        return Nothing;
    }
}();

class Node<T> implements Stack<T> {
    public constructor(
        private readonly value: T,
        private readonly prev: Stack<T>
    ) {}

    public isEmpty(): boolean {
        return false;
    }

    public push(value: T): Stack<T> {
        return new Node(value, this);
    }

    public pop(): Maybe<[ T, Stack<T> ]> {
        return Just([ this.value, this.prev ]);
    }
}
