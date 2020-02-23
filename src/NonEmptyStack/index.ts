import { Stack, empty } from 'Stack';

export interface NonEmptyStack<T> {
    push(value: T): NonEmptyStack<T>;

    peek(): T;

    toArray(): Array<T>;
}

class NonEmptyStackImpl<T> implements NonEmptyStack<T> {
    public constructor(
        private readonly first: T,
        private readonly rest: Stack<T>
    ) {}

    public push(value: T): NonEmptyStack<T> {
        return new NonEmptyStackImpl(this.first, this.rest.push(value));
    }

    public peek(): T {
        return this.rest.peek().getOrElse(this.first);
    }

    public toArray(): Array<T> {
        const array = this.rest.toArray();

        // it's safe to mutate the array here
        array.unshift(this.first);

        return array;
    }
}

export const init = <T>(initial: T): NonEmptyStack<T> => new NonEmptyStackImpl(initial, empty);
