import React from 'react';
import styled from 'styled-components';
import { Dispatch } from 'Provider';
import { Cata } from 'frctl/Basics';
import Set from 'frctl/Set';
import Maybe, { Nothing, Just } from 'frctl/Maybe';
import RemoteData, { NotAsked, Failure, Succeed } from 'frctl/RemoteData/Optional';

import * as Maze from 'Maze';
import * as Solver from 'Maze/Solver';
import * as Utils from 'Utils';

// M O D E L

type EditingPattern<R> = Cata<{
    SetStart(): R;
    SetTarget(): R;
    Remove(): R;
    AddObstacle(obstacle: Maze.Obstacle): R;
}>;

export abstract class Editing {
    public isSetStart(): boolean {
        return false;
    }

    public isSetTarget(): boolean {
        return false;
    }

    public isRemove(): boolean {
        return false;
    }

    public isAddObstacle(_obstacle: Maze.Obstacle): boolean {
        return false;
    }

    public abstract cata<R>(pattern: EditingPattern<R>): R;
}

export const SetStart = Utils.inst(class SetStart extends Editing {
    public isSetStart(): boolean {
        return true;
    }

    public cata<R>(pattern: EditingPattern<R>):R {
        return typeof pattern.SetStart === 'function' ? pattern.SetStart() : (pattern._ as () => R)();
    }
});

export const SetTarget = Utils.inst(class SetTarget extends Editing {
    public isSetTarget(): boolean {
        return true;
    }

    public cata<R>(pattern: EditingPattern<R>):R {
        return typeof pattern.SetTarget === 'function' ? pattern.SetTarget() : (pattern._ as () => R)();
    }
});

export const Remove = Utils.inst(class Remove extends Editing {
    public isRemove(): boolean {
        return true;
    }

    public cata<R>(pattern: EditingPattern<R>):R {
        return typeof pattern.Remove === 'function' ? pattern.Remove() : (pattern._ as () => R)();
    }
});

export const AddObstacle = Utils.cons(class AddObstacle extends Editing {
    public constructor(private readonly obstacle: Maze.Obstacle) {
        super();
    }

    public isAddObstacle(obstacle: Maze.Obstacle): boolean {
        return this.obstacle === obstacle;
    }

    public cata<R>(pattern: EditingPattern<R>):R {
        return typeof pattern.AddObstacle === 'function' ? pattern.AddObstacle(this.obstacle) : (pattern._ as () => R)();
    }
});

export type Model = Readonly<{
    editing: Editing;
    maze: Maze.Maze;
    solving: RemoteData<string, Maybe<Set<Maze.ID>>>;
}>;

export const initial = (rows: number, cols: number): Model => ({
    editing: AddObstacle(Maze.Obstacle.Wall),
    maze: Maze.init(rows, cols),
    solving: NotAsked
});

// U P D A T E

export interface Msg extends Utils.Msg<[ Model ], Model> {}

const SetEditing = Utils.cons(class SetEditing implements Msg {
    public constructor(private readonly editing: Editing) {}

    public update(model: Model): Model {
        return {
            ...model,
            editing: this.editing
        };
    }
});

const ClearMaze = Utils.inst(class ClearMaze implements Msg {
    public update(model: Model): Model {
        return {
            ...model,
            maze: model.maze.clear(),
            solving: NotAsked
        };
    }
});

const Solve = Utils.inst(class Solve implements Msg {
    public update(model: Model): Model {
        return {
            ...model,
            solving: model.maze.setup().cata({
                Nothing: () => Failure('Please setup both starting and targeting locations'),

                Just: setup => Solver.solve(setup).map(path => {
                    const cols = model.maze.cols();

                    return Set.fromList(path.map(([ row, col ]) => row * cols + col));
                }).tap<RemoteData<string, Maybe<Set<Maze.ID>>>>(Succeed)
            })
        };
    }
});

const EditCell = Utils.cons(class EditCell implements Msg {
    public constructor(private readonly id: Maze.ID) {}

    public update(model: Model): Model {
        return {
            ...model
        }

        return model.editing.map(editing => {
            switch (editing) {
                case Editing.SetStart: {
                    return {
                        ...model,
                        maze: model.maze.setStart(this.id)
                    };
                }

                case Editing.SetTarget: {
                    return {
                        ...model,
                        maze: model.maze.setTarget(this.id)
                    };
                }

                case Editing.AddWall: {
                    return {
                        ...model,
                        maze: model.maze.setObstacle(this.id, Maze.Obstacle.Wall)
                    };
                }

                case Editing.AddGravel: {
                    return {
                        ...model,
                        maze: model.maze.setObstacle(this.id, Maze.Obstacle.Gravel)
                    };
                }

                case Editing.AddPortalIn: {
                    return {
                        ...model,
                        maze: model.maze.setObstacle(this.id, Maze.Obstacle.PortalIn)
                    };
                }

                case Editing.AddPortalOut: {
                    return {
                        ...model,
                        maze: model.maze.setObstacle(this.id, Maze.Obstacle.PortalOut)
                    };
                }

                case Editing.Remove: {
                    return {
                        ...model,
                        maze: model.maze.remove(this.id)
                    };
                }

                default: {
                    return model;
                }
            }
        }).getOrElse(model);
    }
});

// V I E W

enum Color {
    Start = '#e74c3c',
    Target = '#2ecc71',
    Wall = '#2c3e50',
    Gravel = '#bdc3c7',
    PortalIn = '#3498db',
    PortalOut = '#e67e22',
    Default = '#ecf0f1'
}

interface StyledCellProps {
    inPath: boolean;
    background: Color;
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

class ViewCell extends React.PureComponent<{
    id: Maze.ID;
    inPath: boolean;
    editing: Maybe<Editing>;
    step: Maze.Step;
    dispatch: Dispatch<Msg>;
}> {
    private getBackground(): Color {
        if (this.props.step.starting) {
            return Color.Start;
        }

        if (this.props.step.targeting) {
            return Color.Target;
        }

        // eslint-disable-next-line array-callback-return
        return this.props.step.obstacle.map<Color>(obstacle => {
            switch (obstacle) {
                case Maze.Obstacle.Wall: return Color.Wall;
                case Maze.Obstacle.Gravel: return Color.Gravel;
                case Maze.Obstacle.PortalIn: return Color.PortalIn;
                case Maze.Obstacle.PortalOut: return Color.PortalOut;
            }
        }).getOrElse(Color.Default);
    }

    private readonly onClick = () => {
        if (this.props.editing.isJust()) {
            this.props.dispatch(EditCell(this.props.id));
        }
    }

    public render() {
        return (
            <StyledCell
                inPath={this.props.inPath}
                background={this.getBackground()}
                onClick={this.onClick}
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
    width: ${props => 30 * props.cols}px;
    min-width: 480px;
    max-width: 100%;

    ${StyledCell} {
        flex: 1 1 ${props => 100 / props.cols}%;
    }
`;

class ViewGrid extends React.PureComponent<{
    editing: Maybe<Editing>;
    maze: Maze.Maze;
    path: Set<Maze.ID>;
    dispatch: Dispatch<Msg>;
}> {
    public render() {
        const { editing, maze, path, dispatch } = this.props;

        return (
            <StyledGrid cols={maze.cols()}>
                {maze.fold((id, step, acc: Array<JSX.Element>) => {
                    acc.push(
                        <ViewCell
                            key={id}
                            editing={editing}
                            id={id}
                            inPath={path.member(id)}
                            step={step}
                            dispatch={dispatch}
                        />
                    );

                    return acc;
                }, [])}
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
    background: Color;
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

class ViewTool extends React.PureComponent<{
    tool: Editing;
    editing: Maybe<Editing>;
    dispatch: Dispatch<Msg>;
}> {
    private getBackground(): Color {
        switch (this.props.tool) {
            case Editing.SetStart: return Color.Start;
            case Editing.SetTarget: return Color.Target;
            case Editing.AddWall: return Color.Wall;
            case Editing.AddGravel: return Color.Gravel;
            case Editing.AddPortalIn: return Color.PortalIn;
            case Editing.AddPortalOut: return Color.PortalOut;
            default: return Color.Default;
        }
    }

    private isActive(): boolean {
        return Just(this.props.tool).isEqual(this.props.editing);
    }

    private readonly onClick = () => {
        this.props.dispatch(
            this.isActive() ? ResetEditing : SetEditing(this.props.tool)
        );
    }

    public render() {
        return (
            <StyledTool
                active={this.isActive()}
                background={this.getBackground()}
                onClick={this.onClick}
            />
        );
    }
}

const TOOLS = [
    Editing.SetStart,
    Editing.SetTarget,
    Editing.AddWall,
    Editing.AddGravel,
    Editing.AddPortalIn,
    Editing.AddPortalOut,
    Editing.Remove
];

const ViewToolbar: React.FC<{
    editing: Maybe<Editing>;
    dispatch: Dispatch<Msg>;
}> = ({ editing, dispatch }) => (
    <StyledToolbar>
        {TOOLS.map(tool => (
            <ViewTool
                key={tool}
                tool={tool}
                editing={editing}
                dispatch={dispatch}
            />
        ))}

        <StyledTool
            title="Remove all"
            background={Color.Default}
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
            editing={model.editing}
            dispatch={dispatch}
        />

        <ViewGrid
            editing={model.editing}
            maze={model.maze}
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
            disabled={model.solving.isLoading()}
            onClick={() => dispatch(Solve)}
        >
            Solve
        </button>
    </StyledRoot>
);
