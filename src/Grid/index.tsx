import React from 'react';
import styled from 'styled-components';
import { Dispatch } from 'Provider';
import Set from 'frctl/Set';
import Maybe, { Nothing, Just } from 'frctl/Maybe';
import RemoteData, { NotAsked, Failure, Succeed } from 'frctl/RemoteData/Optional';

import {
    History,
    init as initHistory
} from 'History';
import * as Maze from 'Maze';
import * as Solver from 'Maze/Solver';
import * as Utils from 'Utils';

// M O D E L

export abstract class Mode {
    public isSetStart(): boolean {
        return false;
    }

    public isSetTarget(): boolean {
        return false;
    }

    public isClearCell(): boolean {
        return false;
    }

    public isAddObstacle(_obstacle: Maze.Obstacle): boolean {
        return false;
    }

    public abstract isEqual(another: Mode): boolean;

    public abstract edit(id: Maze.ID, maze: Maze.Maze): Maze.Maze;
}

export const SetStart = Utils.inst(class SetStart extends Mode {
    public isSetStart(): boolean {
        return true;
    }

    public isEqual(another: Mode): boolean {
        return another.isSetStart();
    }

    public edit(id: Maze.ID, maze: Maze.Maze): Maze.Maze {
        return maze.setStart(id);
    }
});

export const SetTarget = Utils.inst(class SetTarget extends Mode {
    public isSetTarget(): boolean {
        return true;
    }

    public isEqual(another: Mode): boolean {
        return another.isSetTarget();
    }

    public edit(id: Maze.ID, maze: Maze.Maze): Maze.Maze {
        return maze.setTarget(id);
    }
});

export const ClearCell = Utils.inst(class ClearCell extends Mode {
    public isClearCell(): boolean {
        return true;
    }

    public isEqual(another: Mode): boolean {
        return another.isClearCell();
    }

    public edit(id: Maze.ID, maze: Maze.Maze): Maze.Maze {
        return maze.remove(id);
    }
});

export const AddObstacle = Utils.cons(class AddObstacle extends Mode {
    public constructor(private readonly obstacle: Maze.Obstacle) {
        super();
    }

    public isAddObstacle(obstacle: Maze.Obstacle): boolean {
        return this.obstacle === obstacle;
    }

    public isEqual(another: Mode): boolean {
        return another.isAddObstacle(this.obstacle);
    }

    public edit(id: Maze.ID, maze: Maze.Maze): Maze.Maze {
        return maze.setObstacle(id, this.obstacle);
    }
});

export type Model = Readonly<{
    mode: Mode;
    multiple: Maybe<Maze.Maze>;
    history: History<Maze.Maze>;
    solving: RemoteData<string, Maybe<Set<Maze.ID>>>;
}>;

export const initial = (rows: number, cols: number): Model => ({
    mode: AddObstacle(Maze.Obstacle.Wall),
    multiple: Nothing,
    history: initHistory(Maze.init(rows, cols)),
    solving: NotAsked
});

// U P D A T E

export interface Msg extends Utils.Msg<[ Model ], Model> {}

const SetMode = Utils.cons(class SetMode implements Msg {
    public constructor(private readonly mode: Mode) {}

    public update(model: Model): Model {
        return {
            ...model,
            mode: this.mode
        };
    }
});

const StopMultiple = Utils.inst(class StopMultiple implements Msg {
    public update(model: Model): Model {
        return {
            ...model,
            multiple: Nothing,
            history: model.multiple.map(maze => model.history.push(maze)).getOrElse(model.history)
        };
    }
});

const ClearMaze = Utils.inst(class ClearMaze implements Msg {
    public update(model: Model): Model {
        return {
            ...model,
            history: model.history.push(model.history.getCurrent().clear()),
            solving: NotAsked
        };
    }
});

const Solve = Utils.inst(class Solve implements Msg {
    public update(model: Model): Model {
        const maze = model.history.getCurrent();

        return {
            ...model,
            solving: maze.setup().cata({
                Nothing: () => Failure('Please setup both starting and targeting locations'),

                Just: setup => Solver.solve(setup).map(path => {
                    const cols = maze.cols();

                    return Set.fromList(path.map(([ row, col ]) => row * cols + col));
                }).tap<RemoteData<string, Maybe<Set<Maze.ID>>>>(Succeed)
            })
        };
    }
});

const EditCell = Utils.cons(class EditCell implements Msg {
    public constructor(private readonly id: Maze.ID) {}

    public update(model: Model): Model {
        return model.multiple.fold(
            () => {
                if (model.mode.isClearCell()
                    || model.mode.isAddObstacle(Maze.Obstacle.Wall)
                    || model.mode.isAddObstacle(Maze.Obstacle.Gravel)
                ) {
                    return {
                        ...model,
                        multiple: Just(model.mode.edit(this.id, model.history.getCurrent())), // keep maze to apply multiple edits
                        solving: NotAsked
                    };
                }

                return {
                    ...model,
                    history: model.history.push(model.mode.edit(this.id, model.history.getCurrent())),
                    solving: NotAsked
                };
            },

            maze => ({
                ...model,
                multiple: Just(model.mode.edit(this.id, maze)),
                solving: NotAsked
            })
        );
    }
});

const Undo = Utils.inst(class Undo implements Msg {
    public update(model: Model): Model {
        return model.history.undo().map(history => ({
            ...model,
            history,
            solving: NotAsked
        } as Model)).getOrElse(model);
    }
});

const Redo = Utils.inst(class Redo implements Msg {
    public update(model: Model): Model {
        return model.history.redo().map(history => ({
            ...model,
            history,
            solving: NotAsked
        } as Model)).getOrElse(model);
    }
});

// V I E W

interface StyledCellProps {
    inPath: boolean;
    background: string;
}

const StyledCell = styled.div<StyledCellProps>`
    position: relative;
    box-sizing: border-box;
    padding: 0.5px;
    cursor: pointer;

    &:before {
        content: "";
        display: block;
        padding-top: 100%;
        background: ${props => props.background};
        box-shadow: ${props => props.inPath && '0 0 2px 2px #9b59b6 inset'};
    }

    &:hover:before {
        background: #7f8c8d;
    }
`;

interface ViewCellProps {
    id: Maze.ID;
    inPath: boolean;
    multiple: boolean;
    step: Maze.Step;
    dispatch: Dispatch<Msg>;
}

class ViewCell extends React.Component<ViewCellProps> {
    private getBackground(): string {
        if (this.props.step.starting) {
            return '#e74c3c';
        }

        if (this.props.step.targeting) {
            return '#2ecc71';
        }

        // eslint-disable-next-line array-callback-return
        return this.props.step.obstacle.map((obstacle): string => {
            switch (obstacle) {
                case Maze.Obstacle.Wall:      return '#2c3e50';
                case Maze.Obstacle.Gravel:    return '#bdc3c7';
                case Maze.Obstacle.PortalIn:  return '#3498db';
                case Maze.Obstacle.PortalOut: return '#e67e22';
            }
        }).getOrElse('#ecf0f1');
    }

    private readonly onMouseDown = () => {
        if (!this.props.multiple) {
            this.props.dispatch(EditCell(this.props.id));
        }
    }

    private readonly onMouseEnter = () => {
        if (this.props.multiple) {
            this.props.dispatch(EditCell(this.props.id));
        }
    }

    private readonly onMouseUp = () => {
        if (this.props.multiple) {
            this.props.dispatch(StopMultiple);
        }
    }

    // we don't care about multiple here because it doesn't required for view
    public shouldComponentUpdate(nextProps: ViewCellProps): boolean {
        const { props } = this;

        return props.id !== nextProps.id
            || props.inPath !== nextProps.inPath
            || props.dispatch !== nextProps.dispatch
            || props.step.starting !== nextProps.step.starting
            || props.step.targeting !== nextProps.step.targeting
            || !props.step.obstacle.isEqual(nextProps.step.obstacle)
            ;
    }

    public render() {
        return (
            <StyledCell
                inPath={this.props.inPath}
                background={this.getBackground()}
                onMouseDown={this.onMouseDown}
                onMouseEnter={this.onMouseEnter}
                onMouseUp={this.onMouseUp}
            />
        );
    }
}

interface StyledGridProps {
    cols: number;
}

const StyledGrid = styled.div<StyledGridProps>`
    display: flex;
    flex-flow: row wrap;
    margin-top: 10px;
    width: ${props => 16 * props.cols}px;
    min-width: 480px;
    max-width: 100%;

    ${StyledCell} {
        flex: 1 1 ${props => 100 / props.cols}%;
    }
`;

class ViewGrid extends React.PureComponent<{
    multiple: boolean;
    maze: Maze.Maze;
    path: Set<Maze.ID>;
    dispatch: Dispatch<Msg>;
}> {
    public render() {
        const { multiple, maze, path, dispatch } = this.props;

        return (
            <StyledGrid cols={maze.cols()}>
                {maze.map((id, step) => (
                    <ViewCell
                        key={id}
                        id={id}
                        multiple={multiple}
                        inPath={path.member(id)}
                        step={step}
                        dispatch={dispatch}
                    />
                ))}
            </StyledGrid>
        );
    }
}

const StyledToolbar = styled.div`
    display: flex;
    flex-flow: row nowrap;
    margin-left: -10px;
`;

interface StyledToolProps {
    active?: boolean;
    background: string;
}

const StyledTool = styled.div<StyledToolProps>`
    display: flex;
    margin-left: 10px;
    width: 48px;
    height: 48px;
    background: ${props => props.background};
    box-shadow: ${props => props.active && '0 0 0 4px #7f8c8d inset'};
    cursor: pointer;
`;

type Tool = Readonly<{
    title: string;
    color: string;
    mode: Mode;
}>;

class ViewTool extends React.PureComponent<{
    tool: Tool;
    mode: Mode;
    dispatch: Dispatch<Msg>;
}> {
    private isActive(): boolean {
        return this.props.tool.mode.isEqual(this.props.mode);
    }

    private readonly onClick = () => {
        if (!this.isActive()) {
            this.props.dispatch(SetMode(this.props.tool.mode));
        }
    }

    public render() {
        return (
            <StyledTool
                title={this.props.tool.title}
                active={this.isActive()}
                background={this.props.tool.color}
                onClick={this.onClick}
            />
        );
    }
}

const TOOLS: Array<Tool> = [
    {
        title: 'Add wall',
        color: '#2c3e50',
        mode: AddObstacle(Maze.Obstacle.Wall)
    }, {
        title: 'Add gravel',
        color: '#bdc3c7',
        mode: AddObstacle(Maze.Obstacle.Gravel)
    }, {
        title: 'Add portal in',
        color: '#3498db',
        mode: AddObstacle(Maze.Obstacle.PortalIn)
    }, {
        title: 'Add portal out',
        color: '#e67e22',
        mode: AddObstacle(Maze.Obstacle.PortalOut)
    }, {
        title: 'Set starting location',
        color: '#e74c3c',
        mode: SetStart
    }, {
        title: 'Set targeting location',
        color: '#2ecc71',
        mode: SetTarget
    }, {
        title: 'Clear cell',
        color: '#ecf0f1',
        mode: ClearCell
    }
];

const ViewToolbar: React.FC<{
    mode: Mode;
    dispatch: Dispatch<Msg>;
}> = ({ mode, dispatch }) => (
    <StyledToolbar>
        {TOOLS.map(tool => (
            <ViewTool
                key={tool.title}
                tool={tool}
                mode={mode}
                dispatch={dispatch}
            />
        ))}

        <StyledTool
            title="Remove all"
            background="#ecf0f1"
            onClick={() => dispatch(ClearMaze)}
        />
    </StyledToolbar>
);

const StyledError = styled.div`
    color: #c0392b;
`;

const StyledRoot = styled.div``;

export const View: React.FC<{
    model: Model;
    dispatch: Dispatch<Msg>;
}> = ({ model, dispatch }) => (
    <StyledRoot>
        <ViewToolbar
            mode={model.mode}
            dispatch={dispatch}
        />

        <ViewGrid
            multiple={model.multiple.isJust()}
            maze={model.multiple.getOrElse(model.history.getCurrent())}
            path={model.solving.toMaybe().tap(Maybe.join).getOrElse(Set.empty as Set<Maze.ID>)}
            dispatch={dispatch}
        />

        {model.solving.cata({
            Failure: error => (
                <StyledError>{error}</StyledError>
            ),

            Succeed: result => result.isNothing() && (
                <StyledError>No Path</StyledError>
            ),

            _: () => null
        })}

        <button
            onClick={() => dispatch(Solve)}
        >
            Solve
        </button>

        <button
            disabled={!model.history.isUndoable()}
            onClick={() => dispatch(Undo)}
        >
            Undo ←
        </button>

        <button
            disabled={!model.history.isReadoable()}
            onClick={() => dispatch(Redo)}
        >
            Redo →
        </button>
    </StyledRoot>
);
