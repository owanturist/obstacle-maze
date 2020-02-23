import Maybe from 'frctl/Maybe';

import { History, empty } from 'History';

const first = <T1, T2>(tuple: [ T1, T2 ]): T1 => tuple[ 0 ];
const second = <T1, T2>(tuple: [ T1, T2 ]): T2 => tuple[ 1 ];

describe('History', () => {
    it('empty', () => {
        expect(empty.isReadoable()).toBe(false);
        expect(empty.isUndoable()).toBe(false);
        expect(empty.undo()).toEqual(Maybe.Nothing);
        expect(empty.redo()).toEqual(Maybe.Nothing);
    });

    it('push single + undo - redo', () => {
        const _0 = (empty as History<number>).push(0);
        expect(_0.isReadoable()).toBe(false);
        expect(_0.isUndoable()).toBe(true);
        expect(_0.redo()).toEqual(Maybe.Nothing);
        expect(_0.undo().map(first)).toEqual(Maybe.Just(0));

        const _1 = _0.undo().map(second).getOrElse(empty);
        expect(_1.isReadoable()).toBe(true);
        expect(_1.isUndoable()).toBe(false);
        expect(_1.undo()).toEqual(Maybe.Nothing);
        expect(_1.redo()).toEqual(Maybe.Just([ 0, _0 ]));
    });

    it('push several + undo - redo', () => {
        const _0 = (empty as History<number>).push(0).push(1).push(2);
        expect(_0.isReadoable()).toBe(false);
        expect(_0.isUndoable()).toBe(true);
        expect(_0.redo()).toEqual(Maybe.Nothing);
        expect(_0.undo().map(first)).toEqual(Maybe.Just(2));

        const _1 = _0.undo().map(second).getOrElse(empty);
        expect(_1.isReadoable()).toBe(true);
        expect(_1.isUndoable()).toBe(true);
        expect(_1.redo()).toEqual(Maybe.Just([ 2, _0 ]));
        expect(_1.undo().map(first)).toEqual(Maybe.Just(1));

        const _2 = _1.undo().map(second).getOrElse(empty);
        expect(_2.isReadoable()).toBe(true);
        expect(_2.isUndoable()).toBe(true);
        expect(_2.redo()).toEqual(Maybe.Just([ 1, _1 ]));
        expect(_2.undo().map(first)).toEqual(Maybe.Just(0));

        const _3 = _2.undo().map(second).getOrElse(empty);
        expect(_3.isReadoable()).toBe(true);
        expect(_3.isUndoable()).toBe(false);
        expect(_3.redo()).toEqual(Maybe.Just([ 0, _2 ]));
        expect(_3.undo().map(first)).toEqual(Maybe.Nothing);

        // empty, but reduable ^

        const _4 = _3.push(3);
        expect(_4.isReadoable()).toBe(false);
        expect(_4.isUndoable()).toBe(true);
        expect(_4.redo()).toEqual(Maybe.Nothing);
        expect(_4.undo().map(first)).toEqual(Maybe.Just(3));
    });
});
