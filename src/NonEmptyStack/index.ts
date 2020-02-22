export interface NonEmptyStack<T> {
    push(item: T): NonEmptyStack<T>;

    peek(): T;

    toList(): Array<T>;
}

class Node<T> implements NonEmptyStack<T> {
    public constructor(
        private readonly value: T,
        private readonly prev: null | Node<T>
    ) {}

    public push(item: T): NonEmptyStack<T> {
        return new Node(item, this);
    }

    public peek(): T {
        return this.value;
    }

    public toList(): Array<T> {
        const list = [];
        let node: null | Node<T> = this;

        while (node !== null) {
            list.push(node.value);

            node = node.prev;
        }

        return list.reverse();
    }
}

export const init = <T>(initial: T): NonEmptyStack<T> => new Node(initial, null);
