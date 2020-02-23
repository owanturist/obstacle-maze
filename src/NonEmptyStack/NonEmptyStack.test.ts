import Maybe from 'frctl/Maybe';

import { singleton } from './index';

it('NonEmptyStack', () => {
    const _0 = singleton(0);
    expect(_0.isSingleton()).toBe(true);
    expect(_0.pop()).toEqual(Maybe.Nothing);
    expect(_0.peek()).toEqual(0);
    expect(_0.toArray()).toEqual([ 0 ]);

    const _1 = _0.push(1);
    expect(_1.isSingleton()).toBe(false);
    expect(_1.peek()).toBe(1);
    expect(_1.pop()).toEqual(Maybe.Just([ 1, _0 ]));
    expect(_1.toArray()).toEqual([ 0, 1 ]);

    const _2 = _1.push(2);
    expect(_2.isSingleton()).toBe(false);
    expect(_2.peek()).toBe(2);
    expect(_2.pop()).toEqual(Maybe.Just([ 2, _1 ]));
    expect(_2.toArray()).toEqual([ 0, 1, 2 ]);

    const _3 = _2.push(3);
    expect(_3.isSingleton()).toBe(false);
    expect(_3.peek()).toBe(3);
    expect(_3.pop()).toEqual(Maybe.Just([ 3, _2 ]));
    expect(_3.toArray()).toEqual([ 0, 1, 2, 3 ]);
});
