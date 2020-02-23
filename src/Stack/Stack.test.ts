import Maybe from 'frctl/Maybe';

import { Stack, empty } from 'Stack';

it('Stack', () => {
    const _0: Stack<number> = empty;
    expect(_0.isEmpty()).toBe(true);
    expect(_0.pop()).toEqual(Maybe.Nothing);

    const _1 = _0.push(0);
    expect(_1.isEmpty()).toBe(false);
    expect(_1.pop()).toEqual(Maybe.Just([ 0, _0 ]));

    const _2 = _1.push(1);
    expect(_2.isEmpty()).toBe(false);
    expect(_2.pop()).toEqual(Maybe.Just([ 1, _1 ]));

    const _3 = _2.push(2);
    expect(_3.isEmpty()).toBe(false);
    expect(_3.pop()).toEqual(Maybe.Just([ 2, _2 ]));
});
