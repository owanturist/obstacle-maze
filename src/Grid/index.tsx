import React from 'react';
import styled from 'styled-components';
import { Dispatch } from 'Provider';
import Maybe, { Nothing, Just } from 'frctl/Maybe';

import * as Maze from 'Maze';
import * as Utils from 'Utils';

// M O D E L

// Storybook needs only string as values for radio...
export enum Editing {
    SetStart = 'set_start',
    SetTarget = 'set_target',
    AddWall = 'add_wall',
    AddGravel = 'add_gravel',
    AddPortalIn = 'add_portal_in',
    AddPortalOut = 'add_portal_out',
    Remove = 'remove'
}

export type Model = Readonly<{
    editing: Maybe<Editing>;
    maze: Maze.Maze;
}>;

export const initial = (rows: number, cols: number): Model => ({
    editing: Nothing,
    maze: Maze.init(rows, cols)
});

// U P D A T E

export interface Msg extends Utils.Msg<[ Model ], Model> {}

const SetEditing = Utils.cons(class SetEditing implements Msg {
    public constructor(private readonly editing: Editing) {}

    public update(model: Model): Model {
        return {
            ...model,
            editing: Just(this.editing)
        };
    }
});

const ResetEditing = Utils.inst(class ResetEditing implements Msg {
    public update(model: Model): Model {
        return {
            ...model,
            editing: Nothing
        };
    }
});

const ClearMaze = Utils.inst(class ClearMaze implements Msg {
    public update(model: Model): Model {
        return {
            ...model,
            maze: model.maze.clear()
        };
    }
});

const EditCell = Utils.cons(class EditCell implements Msg {
    public constructor(private readonly id: Maze.ID) {}

    public update(model: Model): Model {
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
    }

    &:hover:before {
        background: #7f8c8d;
    }
`;

class ViewCell extends React.PureComponent<{
    id: Maze.ID;
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
        flex: 1 1 ${props => Math.floor(100 / props.cols)}%;
    }
`;

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
    model: Model;
    dispatch: Dispatch<Msg>;
}> = ({ model, dispatch }) => (
    <StyledToolbar>
        {TOOLS.map(tool => (
            <ViewTool
                key={tool}
                tool={tool}
                editing={model.editing}
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

const StyledRoot = styled.div``;

export const View: React.FC<{
    model: Model;
    dispatch: Dispatch<Msg>;
}> = ({ model, dispatch }) => (
    <StyledRoot>
        <ViewToolbar
            model={model}
            dispatch={dispatch}
        />

        <StyledGrid
            cols={model.maze.cols()}
        >
            {model.maze.fold((id, step, acc: Array<JSX.Element>) => {
                acc.push(
                    <ViewCell
                        key={id}
                        editing={model.editing}
                        id={id}
                        step={step}
                        dispatch={dispatch}
                    />
                );

                return acc;
            }, [])}
        </StyledGrid>
    </StyledRoot>
);
