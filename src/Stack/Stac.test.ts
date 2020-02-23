import Maybe from 'frctl/Maybe';

import { Stack, empty } from 'Stack';

it('Stack', () => {
    const _0: Stack<number> = empty;
    expect(_0.isEmpty()).toBe(true);
    expect(_0.pop()).toEqual(Maybe.Nothing);

    const _1 = _0.push(0);
});
