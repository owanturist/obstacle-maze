import React from 'react';
import Enzyme from 'enzyme';
import { Cmd } from 'frctl';
import Maybe from 'frctl/Maybe';
import Set from 'frctl/Set';

import * as History from 'History';
import * as Maze from 'Maze';
import * as Grid from './index';

// M O D E

it('Grid.SetStart', () => {
    expect(Grid.SetStart.isSetStart()).toBe(true);
    expect(Grid.SetStart.isEqual(Grid.SetStart)).toBe(true);

    const _0 = Maze.empty(20, 10);
    const _1 = Grid.SetStart.edit(5, _0);
    expect(_1).toEqual(_0.setStart(5));
});

it('Grid.SetTarget', () => {
    expect(Grid.SetTarget.isSetTarget()).toBe(true);
    expect(Grid.SetTarget.isEqual(Grid.SetTarget)).toBe(true);

    const _0 = Maze.empty(20, 10);
    const _1 = Grid.SetTarget.edit(5, _0);
    expect(_1).toEqual(_0.setTarget(5));
});

it('Grid.ClearCell', () => {
    expect(Grid.ClearCell.isClearCell()).toBe(true);
    expect(Grid.ClearCell.isEqual(Grid.ClearCell)).toBe(true);

    const _0 = Maze.empty(20, 10).setStart(5).setTarget(10);
    const _1 = Grid.ClearCell.edit(5, _0);
    expect(_1).toEqual(_0.remove(5));
});

it('Grid.AddObstacle', () => {
    expect(Grid.AddObstacle(Maze.Obstacle.Gravel).isAddObstacle(Maze.Obstacle.Gravel)).toBe(true);
    expect(Grid.AddObstacle(Maze.Obstacle.Gravel).isAddObstacle(Maze.Obstacle.Wall)).toBe(false);

    expect(
        Grid.AddObstacle(Maze.Obstacle.Gravel).isEqual(Grid.AddObstacle(Maze.Obstacle.Gravel))
    ).toBe(true);
    expect(
        Grid.AddObstacle(Maze.Obstacle.Gravel).isEqual(Grid.AddObstacle(Maze.Obstacle.Wall))
    ).toBe(false);

    const _0 = Maze.empty(20, 10);

    const _1 = Grid.AddObstacle(Maze.Obstacle.Wall).edit(5, _0);
    expect(_1).toEqual(_0.setObstacle(5, Maze.Obstacle.Wall));

    const _2 = Grid.AddObstacle(Maze.Obstacle.Gravel).edit(10, _1);
    expect(_2).toEqual(_1.setObstacle(10, Maze.Obstacle.Gravel));

    const _3 = Grid.AddObstacle(Maze.Obstacle.PortalIn).edit(15, _2);
    expect(_3).toEqual(_2.setObstacle(15, Maze.Obstacle.PortalIn));

    const _4 = Grid.AddObstacle(Maze.Obstacle.PortalIn).edit(20, _3);
    expect(_4).toEqual(_3.setObstacle(20, Maze.Obstacle.PortalIn));
});

// M S G

it('Grid.NoOp', () => {
    const initialModel = Grid.init(Maze.empty(20, 10));
    const [ nextModel, cmd ] = Grid.NoOp.update(initialModel);

    expect(nextModel).toEqual({
        mode: Grid.AddObstacle(Maze.Obstacle.Wall),
        multiple: Maybe.Nothing,
        history: History.init(Maze.empty(20, 10)),
        solution: Maybe.Nothing
    });
    expect(nextModel).toBe(initialModel);
    expect(cmd).toBe(Cmd.none);
});

it('Grid.SetMode', () => {
    const _0 = Grid.init(Maze.empty(20, 10));
    const [ _1 ] = Grid.SetMode(Grid.ClearCell).update(_0);

    expect(_1).toEqual({
        mode: Grid.ClearCell,
        multiple: Maybe.Nothing,
        history: History.init(Maze.empty(20, 10)),
        solution: Maybe.Nothing
    });
});

describe('Grid.EditCell', () => {
    it('Turn multiple on', () => {
        const _0 = {
            ...Grid.init(Maze.empty(20, 10).setStart(0)),
            solution: Maybe.Just(Set.singleton(10))
        };

        const [ _1 ] = Grid.EditCell(0).update({
            ..._0,
            mode: Grid.ClearCell
        });
        expect(_1).toEqual({
            mode: Grid.ClearCell,
            multiple: Maybe.Just(Maze.empty(20, 10)),
            history: History.init(Maze.empty(20, 10).setStart(0)),
            solution: Maybe.Nothing
        });

        const [ _2 ] = Grid.EditCell(5).update({
            ..._0,
            mode: Grid.AddObstacle(Maze.Obstacle.Wall)
        });
        expect(_2).toEqual({
            mode: Grid.AddObstacle(Maze.Obstacle.Wall),
            multiple: Maybe.Just(Maze.empty(20, 10).setStart(0).setObstacle(5, Maze.Obstacle.Wall)),
            history: History.init(Maze.empty(20, 10).setStart(0)),
            solution: Maybe.Nothing
        });

        const [ _3 ] = Grid.EditCell(5).update({
            ..._0,
            mode: Grid.AddObstacle(Maze.Obstacle.Gravel)
        });
        expect(_3).toEqual({
            mode: Grid.AddObstacle(Maze.Obstacle.Gravel),
            multiple: Maybe.Just(Maze.empty(20, 10).setStart(0).setObstacle(5, Maze.Obstacle.Gravel)),
            history: History.init(Maze.empty(20, 10).setStart(0)),
            solution: Maybe.Nothing
        });
    });

    it('Keep multiple off', () => {
        const _0 = {
            ...Grid.init(Maze.empty(20, 10)),
            solution: Maybe.Just(Set.singleton(10))
        };

        const [ _1 ] = Grid.EditCell(0).update({
            ..._0,
            mode: Grid.SetStart
        });
        expect(_1).toEqual({
            mode: Grid.ClearCell,
            multiple: Maybe.Nothing,
            history: History.init(Maze.empty(20, 10)).push(Maze.empty(20, 10).setStart(0)),
            solution: Maybe.Nothing
        });

        const [ _2 ] = Grid.EditCell(0).update({
            ..._0,
            mode: Grid.SetTarget
        });
        expect(_2).toEqual({
            mode: Grid.ClearCell,
            multiple: Maybe.Nothing,
            history: History.init(Maze.empty(20, 10)).push(Maze.empty(20, 10).setTarget(0)),
            solution: Maybe.Nothing
        });

        const [ _3 ] = Grid.EditCell(0).update({
            ..._0,
            mode: Grid.AddObstacle(Maze.Obstacle.PortalIn)
        });
        expect(_3).toEqual({
            mode: Grid.AddObstacle(Maze.Obstacle.PortalIn),
            multiple: Maybe.Nothing,
            history: History.init(Maze.empty(20, 10)).push(Maze.empty(20, 10).setObstacle(0, Maze.Obstacle.PortalIn)),
            solution: Maybe.Nothing
        });

        const [ _4 ] = Grid.EditCell(0).update({
            ..._0,
            mode: Grid.AddObstacle(Maze.Obstacle.PortalOut)
        });
        expect(_4).toEqual({
            mode: Grid.AddObstacle(Maze.Obstacle.PortalOut),
            multiple: Maybe.Nothing,
            history: History.init(Maze.empty(20, 10)).push(Maze.empty(20, 10).setObstacle(0, Maze.Obstacle.PortalOut)),
            solution: Maybe.Nothing
        });
    });

    it('Change multiple', () => {
        const _0 = {
            ...Grid.init(Maze.empty(20, 10)),
            mode: Grid.AddObstacle(Maze.Obstacle.Gravel),
            multiple: Maybe.Just(Maze.empty(20, 10)),
            solution: Maybe.Just(Set.singleton(10))
        };

        const [ _1 ] = Grid.EditCell(0).update(_0);
        expect(_1).toEqual({
            mode: Grid.AddObstacle(Maze.Obstacle.Gravel),
            multiple: Maybe.Just(Maze.empty(20, 10).setObstacle(0, Maze.Obstacle.Gravel)),
            history: History.init(Maze.empty(20, 10)),
            solution: Maybe.Nothing
        });

        const [ _2 ] = Grid.EditCell(1).update(_1);
        expect(_2).toEqual({
            mode: Grid.AddObstacle(Maze.Obstacle.Gravel),
            multiple: Maybe.Just(Maze.empty(20, 10).setObstacle(0, Maze.Obstacle.Gravel).setObstacle(1, Maze.Obstacle.Gravel)),
            history: History.init(Maze.empty(20, 10)),
            solution: Maybe.Nothing
        });
    });
});

it('Grid.StopMultiple', () => {
    const _0 = Grid.init(Maze.empty(20, 10));
    const [ _1 ] = Grid.StopMultiple.update(_0);
    expect(_1).toBe(_0);

    const [ _2 ] = Grid.StopMultiple.update({
        ..._1,
        multiple: Maybe.Just(Maze.empty(20, 10).setStart(0))
    });
    expect(_2).toEqual({
        mode: Grid.AddObstacle(Maze.Obstacle.Wall),
        multiple: Maybe.Nothing,
        history: History.init(Maze.empty(20, 10)).push(Maze.empty(20, 10).setStart(0)),
        solution: Maybe.Nothing
    });
});

it('Grid.ClearMaze', () => {
    const _0 = Grid.init(Maze.empty(20, 10).setStart(0));
    const [ _1 ] = Grid.ClearMaze.update(_0);

    expect(_1).toEqual({
        mode: Grid.AddObstacle(Maze.Obstacle.Wall),
        multiple: Maybe.Nothing,
        history: History.init(Maze.empty(20, 10).setStart(0)).push(Maze.empty(20, 10)),
        solution: Maybe.Nothing
    });
});

it('Grid.Undo', () => {
    const _0 = Grid.init(Maze.empty(20, 10));
    const [ _1 ] = Grid.Undo.update(_0);

    expect(_1).toEqual(_0);

    const [ _3 ] = Grid.Undo.update({
        ..._0,
        history: History.init(Maze.empty(20, 10)).push(Maze.empty(20, 10).setStart(0))
    });
    expect(_3).toEqual({
        mode: Grid.AddObstacle(Maze.Obstacle.Wall),
        multiple: Maybe.Nothing,
        history: History.init(Maze.empty(20, 10)).push(Maze.empty(20, 10).setStart(0)).undo().getOrElse(null as never),
        solution: Maybe.Nothing
    });
});

it('Grid.Redo', () => {
    const _0 = Grid.init(Maze.empty(20, 10));
    const [ _1 ] = Grid.Redo.update(_0);

    expect(_1).toEqual(_0);

    const [ _3 ] = Grid.Redo.update({
        ..._0,
        history: History.init(Maze.empty(20, 10)).push(Maze.empty(20, 10).setStart(0)).undo().getOrElse(null as never)
    });
    expect(_3).toEqual({
        mode: Grid.AddObstacle(Maze.Obstacle.Wall),
        multiple: Maybe.Nothing,
        history: History.init(Maze.empty(20, 10)).push(Maze.empty(20, 10).setStart(0)),
        solution: Maybe.Nothing
    });
});

describe('Grid.Solve', () => {
    it('Setup is not completed', () => {
        const [ _0 ] = Grid.Solve.update({
            ...Grid.init(Maze.empty(2, 3)),
            solution: Maybe.Just(Set.singleton(10))
        });
        expect(_0).toEqual({
            mode: Grid.AddObstacle(Maze.Obstacle.Wall),
            multiple: Maybe.Nothing,
            history: History.init(Maze.empty(2, 3)),
            solution: Maybe.Nothing
        });
    });

    it('No path', () => {
        const maze = Maze.empty(2, 3)
            .setStart(0)
            .setTarget(2)
            .setObstacle(1, Maze.Obstacle.Wall)
            .setObstacle(4, Maze.Obstacle.Wall);

        const [ _1 ] = Grid.Solve.update({
            ...Grid.init(maze),
            solution: Maybe.Just(Set.singleton(10))
        });
        expect(_1).toEqual({
            mode: Grid.AddObstacle(Maze.Obstacle.Wall),
            multiple: Maybe.Nothing,
            history: History.init(maze),
            solution: Maybe.Nothing
        });
    });

    it('Path found', () => {
        const maze = Maze.empty(2, 3)
            .setStart(0)
            .setTarget(2);

        const [ _1 ] = Grid.Solve.update({
            ...Grid.init(maze),
            solution: Maybe.Just(Set.singleton(10))
        });
        expect(_1).toEqual({
            mode: Grid.AddObstacle(Maze.Obstacle.Wall),
            multiple: Maybe.Nothing,
            history: History.init(maze),
            solution: Maybe.Just(Set.fromList([ 0, 1, 2 ]))
        });
    });
});

it('Grid.SaveAsFile', () => {
    const _0 = Grid.init(Maze.empty(20, 10));
    const [ _1 ] = Grid.SaveAsFile.update(_0);

    expect(_1).toBe(_0);
});

describe('Grid.View', () => {
    const dispatch = jest.fn<void, [ Grid.Msg ]>();

    beforeEach(() => {
        dispatch.mockReset();
    });

    it('Button "Start over" disabled when maze is empty', () => {
        const wrapper = Enzyme.shallow(
            <Grid.View
                model={Grid.init(Maze.empty(20, 10))}
                dispatch={dispatch}
            />
        );

        expect(
            wrapper
                .find('ViewToolbar').dive()
                .find('ViewTool').at(0).dive()
                .childAt(0)
                .prop('disabled')
        ).toBe(true);
    });

    it('Button "Start over" enabled and triggers Grid.SetMode(Grid.ClearMaze)', () => {
        const wrapper = Enzyme.shallow(
            <Grid.View
                model={Grid.init(Maze.empty(20, 10).setStart(0))}
                dispatch={dispatch}
            />
        );

        const button = wrapper
            .find('ViewToolbar').dive()
            .find('ViewTool').at(0).dive()
            .childAt(0);

        button.simulate('click');

        expect(button.prop('disabled')).toBe(false);
        expect(dispatch).toBeCalledWith(Grid.ClearMaze);
    });

    it('Button "Save as file" triggers Grid.SaveAsFile', () => {
        const wrapper = Enzyme.shallow(
            <Grid.View
                model={Grid.init(Maze.empty(20, 10))}
                dispatch={dispatch}
            />
        );

        wrapper
            .find('ViewToolbar').dive()
            .find('ViewTool').at(1).dive()
            .childAt(0)
            .simulate('click');

        expect(dispatch).toBeCalledWith(Grid.SaveAsFile);
    });

    it('Button "Undo" disabled when nothing to undo', () => {
        const wrapper = Enzyme.shallow(
            <Grid.View
                model={Grid.init(Maze.empty(20, 10))}
                dispatch={dispatch}
            />
        );

        expect(
            wrapper
                .find('ViewToolbar').dive()
                .find('ViewTool').at(2).dive()
                .childAt(0)
                .prop('disabled')
        ).toBe(true);
    });

    it('Button "Undo" enabled and triggers Grid.Unto', () => {
        const initialModel = Grid.init(Maze.empty(20, 10));
        const wrapper = Enzyme.shallow(
            <Grid.View
                model={{
                    ...initialModel,
                    history: initialModel.history.push(Maze.empty(20, 10).setStart(0))
                }}
                dispatch={dispatch}
            />
        );

        const button = wrapper
            .find('ViewToolbar').dive()
            .find('ViewTool').at(2).dive()
            .childAt(0);

        button.simulate('click');

        expect(button.prop('disabled')).toBe(false);
        expect(dispatch).toBeCalledWith(Grid.Undo);
    });

    it('Button "Redo" disabled when nothing to undo', () => {
        const wrapper = Enzyme.shallow(
            <Grid.View
                model={Grid.init(Maze.empty(20, 10))}
                dispatch={dispatch}
            />
        );

        expect(
            wrapper
                .find('ViewToolbar').dive()
                .find('ViewTool').at(3).dive()
                .childAt(0)
                .prop('disabled')
        ).toBe(true);
    });

    it('Button "Redo" enabled and triggers Grid.Unto', () => {
        const initialModel = Grid.init(Maze.empty(20, 10));
        const wrapper = Enzyme.shallow(
            <Grid.View
                model={{
                    ...initialModel,
                    history: initialModel.history.push(Maze.empty(20, 10).setStart(0)).undo().getOrElse(initialModel.history)
                }}
                dispatch={dispatch}
            />
        );

        const button = wrapper
            .find('ViewToolbar').dive()
            .find('ViewTool').at(3).dive()
            .childAt(0);

        button.simulate('click');

        expect(button.prop('disabled')).toBe(false);
        expect(dispatch).toBeCalledWith(Grid.Redo);
    });

    it('Button "Find path" triggers Grid.Solve', () => {
        const wrapper = Enzyme.shallow(
            <Grid.View
                model={Grid.init(Maze.empty(20, 10))}
                dispatch={dispatch}
            />
        );

        wrapper
            .find('ViewToolbar').dive()
            .find('ViewTool').at(4).dive()
            .childAt(0)
            .simulate('click');

        expect(dispatch).toBeCalledWith(Grid.Solve);
    });

    it('Button "Add wall" triggers Grid.SetMode(Grid.AddObstacle(Obstacle.Wall))', () => {
        const initialModel = Grid.init(Maze.empty(20, 10));
        const _0 = Enzyme.shallow(
            <Grid.View
                model={initialModel}
                dispatch={dispatch}
            />
        );

        _0.find('ViewToolbar').dive()
            .find('ViewEditTool').at(0).dive().dive()
            .childAt(0)
            .simulate('click');

        expect(dispatch).not.toBeCalled();

        const _1 = Enzyme.shallow(
            <Grid.View
                model={{
                    ...initialModel,
                    mode: Grid.ClearCell
                }}
                dispatch={dispatch}
            />
        );

        _1.find('ViewToolbar').dive()
            .find('ViewEditTool').at(0).dive().dive()
            .childAt(0)
            .simulate('click');

            expect(dispatch).toBeCalledWith(Grid.SetMode(Grid.AddObstacle(Maze.Obstacle.Wall)));
    });

    it('Button "Add gravel" triggers Grid.SetMode(Grid.AddObstacle(Obstacle.Gravel))', () => {
        const initialModel = Grid.init(Maze.empty(20, 10));
        const _0 = Enzyme.shallow(
            <Grid.View
                model={{
                    ...initialModel,
                    mode: Grid.AddObstacle(Maze.Obstacle.Gravel)
                }}
                dispatch={dispatch}
            />
        );

        _0.find('ViewToolbar').dive()
            .find('ViewEditTool').at(1).dive().dive()
            .childAt(0)
            .simulate('click');

        expect(dispatch).not.toBeCalled();

        const _1 = Enzyme.shallow(
            <Grid.View
                model={initialModel}
                dispatch={dispatch}
            />
        );

        _1.find('ViewToolbar').dive()
            .find('ViewEditTool').at(1).dive().dive()
            .childAt(0)
            .simulate('click');

            expect(dispatch).toBeCalledWith(Grid.SetMode(Grid.AddObstacle(Maze.Obstacle.Gravel)));
    });

    it('Button "Add portal in" triggers Grid.SetMode(Grid.AddObstacle(Obstacle.PortalIn))', () => {
        const initialModel = Grid.init(Maze.empty(20, 10));
        const _0 = Enzyme.shallow(
            <Grid.View
                model={{
                    ...initialModel,
                    mode: Grid.AddObstacle(Maze.Obstacle.PortalIn)
                }}
                dispatch={dispatch}
            />
        );

        _0.find('ViewToolbar').dive()
            .find('ViewEditTool').at(2).dive().dive()
            .childAt(0)
            .simulate('click');

        expect(dispatch).not.toBeCalled();

        const _1 = Enzyme.shallow(
            <Grid.View
                model={initialModel}
                dispatch={dispatch}
            />
        );

        _1.find('ViewToolbar').dive()
            .find('ViewEditTool').at(2).dive().dive()
            .childAt(0)
            .simulate('click');

            expect(dispatch).toBeCalledWith(Grid.SetMode(Grid.AddObstacle(Maze.Obstacle.PortalIn)));
    });

    it('Button "Add portal out" triggers Grid.SetMode(Grid.AddObstacle(Obstacle.PortalOut))', () => {
        const initialModel = Grid.init(Maze.empty(20, 10));
        const _0 = Enzyme.shallow(
            <Grid.View
                model={{
                    ...initialModel,
                    mode: Grid.AddObstacle(Maze.Obstacle.PortalOut)
                }}
                dispatch={dispatch}
            />
        );

        _0.find('ViewToolbar').dive()
            .find('ViewEditTool').at(3).dive().dive()
            .childAt(0)
            .simulate('click');

        expect(dispatch).not.toBeCalled();

        const _1 = Enzyme.shallow(
            <Grid.View
                model={initialModel}
                dispatch={dispatch}
            />
        );

        _1.find('ViewToolbar').dive()
            .find('ViewEditTool').at(3).dive().dive()
            .childAt(0)
            .simulate('click');

            expect(dispatch).toBeCalledWith(Grid.SetMode(Grid.AddObstacle(Maze.Obstacle.PortalOut)));
    });

    it('Button "Clear cell" triggers Grid.SetMode(Grid.ClearCell)', () => {
        const initialModel = Grid.init(Maze.empty(20, 10));
        const _0 = Enzyme.shallow(
            <Grid.View
                model={{
                    ...initialModel,
                    mode: Grid.ClearCell
                }}
                dispatch={dispatch}
            />
        );

        _0.find('ViewToolbar').dive()
            .find('ViewEditTool').at(4).dive().dive()
            .childAt(0)
            .simulate('click');

        expect(dispatch).not.toBeCalled();

        const _1 = Enzyme.shallow(
            <Grid.View
                model={initialModel}
                dispatch={dispatch}
            />
        );

        _1.find('ViewToolbar').dive()
            .find('ViewEditTool').at(4).dive().dive()
            .childAt(0)
            .simulate('click');

            expect(dispatch).toBeCalledWith(Grid.SetMode(Grid.ClearCell));
    });

    it('Button "Set starting location" triggers Grid.SetMode(Grid.SetStart)', () => {
        const initialModel = Grid.init(Maze.empty(20, 10));
        const _0 = Enzyme.shallow(
            <Grid.View
                model={{
                    ...initialModel,
                    mode: Grid.SetStart
                }}
                dispatch={dispatch}
            />
        );

        _0.find('ViewToolbar').dive()
            .find('ViewEditTool').at(5).dive().dive()
            .childAt(0)
            .simulate('click');

        expect(dispatch).not.toBeCalled();

        const _1 = Enzyme.shallow(
            <Grid.View
                model={initialModel}
                dispatch={dispatch}
            />
        );

        _1.find('ViewToolbar').dive()
            .find('ViewEditTool').at(5).dive().dive()
            .childAt(0)
            .simulate('click');

            expect(dispatch).toBeCalledWith(Grid.SetMode(Grid.SetStart));
    });

    it('Button "Set targeting location" triggers Grid.SetMode(Grid.SetTarget)', () => {
        const initialModel = Grid.init(Maze.empty(20, 10));
        const _0 = Enzyme.shallow(
            <Grid.View
                model={{
                    ...initialModel,
                    mode: Grid.SetTarget
                }}
                dispatch={dispatch}
            />
        );

        _0.find('ViewToolbar').dive()
            .find('ViewEditTool').at(6).dive().dive()
            .childAt(0)
            .simulate('click');

        expect(dispatch).not.toBeCalled();

        const _1 = Enzyme.shallow(
            <Grid.View
                model={initialModel}
                dispatch={dispatch}
            />
        );

        _1.find('ViewToolbar').dive()
            .find('ViewEditTool').at(6).dive().dive()
            .childAt(0)
            .simulate('click');

            expect(dispatch).toBeCalledWith(Grid.SetMode(Grid.SetTarget));
    });

    it('Cell triggers Grid.EditCell only on mousedown when not multiple', () => {
        const wrapper = Enzyme.shallow(
            <Grid.View
                model={Grid.init(Maze.empty(20, 10))}
                dispatch={dispatch}
            />
        );

        const cell = wrapper.find('ViewGrid').dive().childAt(10).dive();

        cell.simulate('mouseenter');
        expect(dispatch).not.toBeCalled();

        dispatch.mockReset();

        cell.simulate('mousedown');
        expect(dispatch).toBeCalledWith(Grid.EditCell(10));
    });

    it('Cell triggers Grid.EditCell only on mousedown when not multiple', () => {
        const initialModel = Grid.init(Maze.empty(20, 10));
        const wrapper = Enzyme.shallow(
            <Grid.View
                model={{
                    ...initialModel,
                    multiple: Maybe.Just(Maze.empty(20, 10))
                }}
                dispatch={dispatch}
            />
        );

        const cell = wrapper.find('ViewGrid').dive().childAt(10).dive();

        cell.simulate('mousedown');
        expect(dispatch).not.toBeCalled();

        dispatch.mockReset();

        cell.simulate('mouseenter');
        expect(dispatch).toBeCalledWith(Grid.EditCell(10));
    });

    it('Triggers Grid.StopMultiple on very top when multiple', () => {
        const initialModel = Grid.init(Maze.empty(20, 10));
        const wrapper = Enzyme.shallow(
            <Grid.View
                model={{
                    ...initialModel,
                    multiple: Maybe.Just(Maze.empty(20, 10))
                }}
                dispatch={dispatch}
            />
        );

        wrapper.simulate('mouseup');
        expect(dispatch).toBeCalledWith(Grid.StopMultiple);
    });

    it('Does not trigger Grid.StopMultiple on very top when not multiple', () => {
        const wrapper = Enzyme.shallow(
            <Grid.View
                model={Grid.init(Maze.empty(20, 10))}
                dispatch={dispatch}
            />
        );

        wrapper.simulate('mouseup');
        expect(dispatch).not.toBeCalled();
    });
});
