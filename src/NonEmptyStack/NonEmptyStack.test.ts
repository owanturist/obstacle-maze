import { init } from './index';

it('NonEmptyStack', () => {
    const _0 = init(0);
    expect(_0.toList()).toEqual([ 0 ]);
    expect(_0.peek()).toBe(0);

    const _1 = _0.push(1).push(2).push(3).push(4);
    expect(_1.toList()).toEqual([ 0, 1, 2, 3, 4 ]);
    expect(_1.peek()).toBe(4);
});
