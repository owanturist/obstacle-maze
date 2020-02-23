import Maybe, { Nothing, Just } from 'frctl/Maybe';

export interface Stack<T> {
    isEmpty(): boolean;

    peek(): Maybe<T>;

    push(value: T): Stack<T>;

    pop(): Maybe<[ T, Stack<T> ]>;

    toArray(): Array<T>;
}

class Null<T> implements Stack<T> {
    public isEmpty(): boolean {
        return true;
    }

    public peek(): Maybe<T> {
        return Nothing;
    }

    public push(value: T): Stack<T> {
        return new Node(value, this);
    }

    public pop(): Maybe<[ T, Stack<T> ]> {
        return Nothing;
    }

    public toArray(): Array<T> {
        return [];
    }
}

class Node<T> implements Stack<T> {
    public constructor(
        private readonly value: T,
        private readonly prev: Stack<T>
    ) {}

    public isEmpty(): boolean {
        return false;
    }

    public peek(): Maybe<T> {
        return Just(this.value);
    }

    public push(value: T): Stack<T> {
        return new Node(value, this);
    }

    public pop(): Maybe<[ T, Stack<T> ]> {
        return Just([ this.value, this.prev ]);
    }

    public toArray(): Array<T> {
        const list = [];
        let nullOrNode: Null<T> | Node<T> = this;

        while (!nullOrNode.isEmpty()) {
            // yes it's tricky but while loop works
            // a lot faster than recursive folding
            // and does not care about stack overflow
            const node = nullOrNode as Node<T>;

            list.push(node.value);

            nullOrNode = node.prev;
        }

        return list.reverse();
    }
}

export const empty: Stack<never> = new Null();
