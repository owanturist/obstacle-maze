import Maybe from 'frctl/Maybe';
import { Stack, empty } from 'Stack';


/**
 * Represents immutable Non Empty Stack.
 * Gives basic methods to work with a stack.
 */
export interface NonEmptyStack<T> {
    /**
     * Determine the stack is singleton or not.
     * Takes constant time.
     */
    isSingleton(): boolean;

    /**
     * Return latest added element.
     * Takes constant time.
     */
    peek(): T;

    /**
     * Adds new value to the end of the stack.
     * Takes constant time.
     */
    push(value: T): NonEmptyStack<T>;

    /**
     * Returns latest added element and tail if the stack is not singleton.
     * Takes constant time.
     */
    pop(): Maybe<[ T, NonEmptyStack<T> ]>;

    /**
     * Converts the stack into an Array.
     * Latest element goes to the end of the array.
     * Takes time proportional to `O(n)`.
     */
    toArray(): Array<T>;
}

class NonEmptyStackImpl<T> implements NonEmptyStack<T> {
    public constructor(
        private readonly first: T,
        private readonly rest: Stack<T>
    ) {}

    public isSingleton(): boolean {
        return this.rest.isEmpty();
    }

    public peek(): T {
        return this.rest.peek().getOrElse(this.first);
    }

    public push(value: T): NonEmptyStack<T> {
        return new NonEmptyStackImpl(this.first, this.rest.push(value));
    }

    public pop(): Maybe<[ T, NonEmptyStack<T> ]> {
        return this.rest.pop().map(([ value, nextRest ]) => [
            value,
            new NonEmptyStackImpl(this.first, nextRest)
        ]);
    }

    public toArray(): Array<T> {
        const array = this.rest.toArray();

        // it's safe to mutate the array here
        array.unshift(this.first);

        return array;
    }
}

export const singleton = <T>(initial: T): NonEmptyStack<T> => new NonEmptyStackImpl(initial, empty);
