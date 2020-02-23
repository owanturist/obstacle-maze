import Maybe from 'frctl/Maybe';

import { init } from 'History';

describe('History', () => {
    it('empty', () => {
        const _0 = init(0);

        expect(_0.isUndoable()).toBe(false);
        expect(_0.isReadoable()).toBe(false);
        expect(_0.getCurrent()).toBe(0);
        expect(_0.undo()).toEqual(Maybe.Nothing);
        expect(_0.redo()).toEqual(Maybe.Nothing);
    });

    it('push single + undo - redo', () => {
        const _0 = init(0).push(1);
        expect(_0.isUndoable()).toBe(true);
        expect(_0.isReadoable()).toBe(false);
        expect(_0.getCurrent()).toBe(1);
        expect(_0.undo()).not.toEqual(Maybe.Nothing);
        expect(_0.redo()).toEqual(Maybe.Nothing);

        const _1 = _0.undo().getOrElse(init(-1));
        expect(_1.isUndoable()).toBe(false);
        expect(_1.isReadoable()).toBe(true);
        expect(_1.getCurrent()).toBe(0);
        expect(_1.undo()).toEqual(Maybe.Nothing);
        expect(_1.redo()).not.toEqual(Maybe.Nothing);
        expect(_1.redo()).toEqual(Maybe.Just(_0));
    });

    it('push several + undo - redo', () => {
        const _0 = init(0).push(1).push(2).push(3);
        expect(_0.isUndoable()).toBe(true);
        expect(_0.isReadoable()).toBe(false);
        expect(_0.getCurrent()).toBe(3);
        expect(_0.undo()).not.toEqual(Maybe.Nothing);
        expect(_0.redo()).toEqual(Maybe.Nothing);

        const _1 = _0.undo().getOrElse(init(-1));
        expect(_1.isUndoable()).toBe(true);
        expect(_1.isReadoable()).toBe(true);
        expect(_1.getCurrent()).toBe(2);
        expect(_1.undo()).not.toEqual(Maybe.Nothing);
        expect(_1.redo()).not.toEqual(Maybe.Nothing);
        expect(_1.redo()).toEqual(Maybe.Just(_0));

        const _2 = _1.undo().getOrElse(init(-1));
        expect(_2.isUndoable()).toBe(true);
        expect(_2.isReadoable()).toBe(true);
        expect(_2.getCurrent()).toBe(1);
        expect(_2.undo()).not.toEqual(Maybe.Nothing);
        expect(_2.redo()).not.toEqual(Maybe.Nothing);
        expect(_2.redo()).toEqual(Maybe.Just(_1));

        const _3 = _2.undo().getOrElse(init(-1));
        expect(_3.isUndoable()).toBe(false);
        expect(_3.isReadoable()).toBe(true);
        expect(_3.getCurrent()).toBe(0);
        expect(_3.undo()).toEqual(Maybe.Nothing);
        expect(_3.redo()).not.toEqual(Maybe.Nothing);
        expect(_3.redo()).toEqual(Maybe.Just(_2));

        // singleton, but reduable ^

        const _4 = _3.push(4);
        expect(_4.isUndoable()).toBe(true);
        expect(_4.isReadoable()).toBe(false); // clears redos
        expect(_4.undo()).not.toEqual(Maybe.Nothing);
        expect(_4.redo()).toEqual(Maybe.Nothing);
    });
});
