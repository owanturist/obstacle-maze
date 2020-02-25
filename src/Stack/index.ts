import Maybe, { Nothing, Just } from 'frctl/Maybe';

/**
 * Represents immutable Stack.
 * Gives basic methods to work with a stack.
 */
export interface Stack<T> {
    /**
     * Determine the stack is empty or not.
     * Takes constant time.
     */
    isEmpty(): boolean;

    /**
     * Returns latest added element if the stack is not empty.
     * Takes constant time.
     */
    peek(): Maybe<T>;

    /**
     * Adds new value to the end of the stack.
     * Takes constant time.
     */
    push(value: T): Stack<T>;

    /**
     * Returns latest added element and tail if the stack is not empty.
     * Takes constant time.
     */
    pop(): Maybe<[ T, Stack<T> ]>;

    /**
     * Converts the stack into an Array.
     * Latest element goes to the end of the array.
     * Takes time proportional to `O(n)`.
     */
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
