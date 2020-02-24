import React, { ButtonHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { Dispatch } from 'Provider';
import { Cmd } from 'frctl';
import Set from 'frctl/Set';
import Maybe, { Nothing, Just } from 'frctl/Maybe';
import RemoteData, { NotAsked, Failure, Succeed } from 'frctl/RemoteData/Optional';

import {
    History,
    init as initHistory
} from 'History';
import Tippy from 'Tippy';
import * as File from 'File';
import * as Maze from 'Maze';
import * as Solver from 'Maze/Solver';
import * as Utils from 'Utils';

import wallImage from './wall.svg';
import gravelImage from './gravel.svg';
import portalInImage from './portal_in.svg';
import portalOutImage from './portal_out.svg';
import startingLocationImage from './starting_location.svg';
import targetingLocationImage from './targeting_location.svg';
import findPathImage from './find_path.svg';
import startOverImage from './start_over.svg';
import saveImage from './save.svg';
import undoImage from './undo.svg';
import redoImage from './redo.svg';
import emptyImage from './empty.svg';

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

export const initWithMaze = (maze: Maze.Maze): Model => ({
    mode: AddObstacle(Maze.Obstacle.Wall),
    multiple: Nothing,
    history: initHistory(maze),
    solving: NotAsked
});

export const initEmpty = (rows: number, cols: number): Model => initWithMaze(Maze.init(rows, cols));

// U P D A T E

export interface Msg extends Utils.Msg<[ Model ], [ Model, Cmd<Msg> ]> {}

const NoOp = Utils.inst(class NoOp implements Msg {
    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [ model, Cmd.none ];
    }
});

const SetMode = Utils.cons(class SetMode implements Msg {
    public constructor(private readonly mode: Mode) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            {
                ...model,
                mode: this.mode
            },
            Cmd.none
        ];
    }
});

const StopMultiple = Utils.inst(class StopMultiple implements Msg {
    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            {
                ...model,
                multiple: Nothing,
                history: model.multiple.map(maze => model.history.push(maze)).getOrElse(model.history)
            },
            Cmd.none
        ];
    }
});

const ClearMaze = Utils.inst(class ClearMaze implements Msg {
    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            {
                ...model,
                history: model.history.push(model.history.getCurrent().clear()),
                solving: NotAsked
            },
            Cmd.none
        ];
    }
});

const Solve = Utils.inst(class Solve implements Msg {
    public update(model: Model): [ Model, Cmd<Msg> ] {
        const maze = model.history.getCurrent();

        return [
            {
                ...model,
                solving: maze.setup().cata({
                    Nothing: () => Failure('Please setup both starting and targeting locations'),

                    Just: setup => Solver.solve(setup).map(path => {
                        const cols = maze.cols();

                        return Set.fromList(path.map(([ row, col ]) => row * cols + col));
                    }).tap<RemoteData<string, Maybe<Set<Maze.ID>>>>(Succeed)
                })
            },
            Cmd.none
        ];
    }
});

const EditCell = Utils.cons(class EditCell implements Msg {
    public constructor(private readonly id: Maze.ID) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            model.multiple.fold(
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
            ),
            Cmd.none
        ];
    }
});

const Undo = Utils.inst(class Undo implements Msg {
    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            {
                ...model,
                history: model.history.undo().getOrElse(model.history),
                solving: NotAsked
            },
            Cmd.none
        ];
    }
});

const Redo = Utils.inst(class Redo implements Msg {
    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            {
                ...model,
                history: model.history.redo().getOrElse(model.history),
                solving: NotAsked
            },
            Cmd.none
        ];
    }
});

const SaveAsFile = Utils.inst(class SaveAsFile implements Msg {
    public update(model: Model): [ Model, Cmd<Msg> ] {
        const maze = model.history.getCurrent();

        return [
            model,
            File.saver(`maze_${maze.rows()}x${maze.cols()}`)
                .withStringBody(Maze.serialize(maze))
                .save()
                .perform(() => NoOp)
        ];
    }
});

// V I E W

interface StyledCellProps {
    static?: boolean;
    inPath?: boolean;
    image: Maybe<string>;
}

const StyledCell = styled.div<StyledCellProps>`
    position: relative;
    box-sizing: border-box;
    padding: 0 1px 1px 0;

    &:before {
        content: "";
        display: block;
        padding-top: 100%;
        background-color: #f4f4f4;
        background-image: ${props => props.image.fold(
            () => null,
            image => `url(${image})`
        )};
        background-size: 80%;
        background-position: center center;
        background-repeat: no-repeat;
        border-radius: 3px;
        box-shadow: ${props => props.inPath && '0 0 0 1px #3498db inset'};
    }


    ${props => !props.static && css`
        cursor: pointer;

        &:hover:before {
            background-color: #e8e8e8;
        }
    `};
`;

interface ViewCellProps {
    inPath: boolean;
    multiple: boolean;
    step: Maze.Cell;
    dispatch: Dispatch<Msg>;
}

class ViewCell extends React.Component<ViewCellProps> {
    private getImage(): Maybe<string> {
        if (this.props.step.starting) {
            return Just(startingLocationImage);
        }

        if (this.props.step.targeting) {
            return Just(targetingLocationImage);
        }

        // eslint-disable-next-line array-callback-return
        return this.props.step.obstacle.map((obstacle): string => {
            switch (obstacle) {
                case Maze.Obstacle.Wall:      return wallImage;
                case Maze.Obstacle.Gravel:    return gravelImage;
                case Maze.Obstacle.PortalIn:  return portalInImage;
                case Maze.Obstacle.PortalOut: return portalOutImage;
            }
        });
    }

    private readonly onMouseDown = () => {
        if (!this.props.multiple) {
            this.props.dispatch(EditCell(this.props.step.id));
        }
    }

    private readonly onMouseEnter = () => {
        if (this.props.multiple) {
            this.props.dispatch(EditCell(this.props.step.id));
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

        return props.inPath !== nextProps.inPath
            || props.dispatch !== nextProps.dispatch
            || props.step.id !== nextProps.step.id
            || props.step.starting !== nextProps.step.starting
            || props.step.targeting !== nextProps.step.targeting
            || !props.step.obstacle.isEqual(nextProps.step.obstacle)
            ;
    }

    public render() {
        return (
            <StyledCell
                inPath={this.props.inPath}
                image={this.getImage()}
                onMouseDown={this.onMouseDown}
                onMouseEnter={this.onMouseEnter}
                onMouseUp={this.onMouseUp}
            />
        );
    }
}

const StyledScroller = styled.div`
    flex: 1 1 auto;
    overflow: auto;
`;

interface StyledGridProps {
    cols: number;
}

const StyledGrid = styled.div<StyledGridProps>`
    display: flex;
    flex-flow: row wrap;
    margin-left: 10px;
    width: ${props => 30 * props.cols}px;
    min-width: 480px;
    max-width: 100%;

    ${StyledCell} {
        flex: 1 1 ${props => 100 / props.cols}%;
    }
`;

interface ViewGridProps {
    multiple: boolean;
    maze: Maze.Maze;
    path: Set<Maze.ID>;
    dispatch: Dispatch<Msg>;
}

class ViewGrid extends React.PureComponent<ViewGridProps> {
    private onMouseLeave = () => {
        if (this.props.multiple) {
            this.props.dispatch(StopMultiple);
        }
    }

    public render() {
        const { multiple, maze, path, dispatch } = this.props;

        return (
            <StyledGrid
                cols={maze.cols()}
                onMouseLeave={this.onMouseLeave}
            >
                {maze.map(step => (
                    <ViewCell
                        key={step.id}
                        multiple={multiple}
                        inPath={path.member(step.id)}
                        step={step}
                        dispatch={dispatch}
                    />
                ))}
            </StyledGrid>
        );
    }
}

interface StyledToolProps {
    active?: boolean;
    image: string;
}

const StyledTool = styled.button<StyledToolProps>`
    display: flex;
    width: 36px;
    height: 36px;
    background-color: #fff;
    background-image: ${props => `url(${props.image})`};
    background-size: 80%;
    background-position: center center;
    background-repeat: no-repeat;
    border-radius: 3px;
    border: 1px solid ${props => props.active ? '#3498db' : '#ddd'};
    outline: none;
    cursor: pointer;

    & + & {
        margin-top: 5px;
    }

    &:focus {
        box-shadow: 0 0 0 2px ${props => props.active ? 'rgba(52, 152, 219, .3)' : 'rgba(0, 0, 0, 0.05)'};
    }

    &:hover:not(:disabled) {
        background-color: #f9f9f9;
    }

    &:disabled {
        cursor: default;
        background-color: #f4f4f4;
        opacity: .75;
    }
`;

const ViewTool: React.FC<{
    title: string;
} & StyledToolProps & ButtonHTMLAttributes<Element>> = ({ title, ...props }) => (
    <Tippy
        arrow={false}
        distance={5}
        placement="bottom-end"
        content={title}
    >
        <StyledTool
            type="button"
            tabIndex={0}
            {...props}
        />
    </Tippy>
);

type EditTool = Readonly<{
    title: string;
    image: string;
    mode: Mode;
}>;

class ViewEditTool extends React.PureComponent<{
    tool: EditTool;
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
            <ViewTool
                active={this.isActive()}
                title={this.props.tool.title}
                image={this.props.tool.image}
                onClick={this.onClick}
            />
        );
    }
}

const TOOLS: Array<EditTool> = [
    {
        title: 'Add wall',
        image: wallImage,
        mode: AddObstacle(Maze.Obstacle.Wall)
    }, {
        title: 'Add gravel',
        image: gravelImage,
        mode: AddObstacle(Maze.Obstacle.Gravel)
    }, {
        title: 'Add portal in',
        image: portalInImage,
        mode: AddObstacle(Maze.Obstacle.PortalIn)
    }, {
        title: 'Add portal out',
        image: portalOutImage,
        mode: AddObstacle(Maze.Obstacle.PortalOut)
    }, {
        title: 'Clear cell',
        image: emptyImage,
        mode: ClearCell
    }, {
        title: 'Set starting location',
        image: startingLocationImage,
        mode: SetStart
    }, {
        title: 'Set targeting location',
        image: targetingLocationImage,
        mode: SetTarget
    }
];

const StyledToolGroup = styled.div`
    & + & {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #ddd;
    }
`;

const StyledToolbar = styled.div`
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 10px;
    background: #fff;
    box-shadow: 5px 0 5px -5px rgba(0, 0, 0, 0.1);
`;

const ViewToolbar: React.FC<{
    model: Model;
    dispatch: Dispatch<Msg>;
}> = ({ model, dispatch }) => (
    <StyledToolbar>
        <StyledToolGroup>
            <ViewTool
                title="Start over"
                image={startOverImage}
                onClick={() => dispatch(ClearMaze)}
            />

            <ViewTool
                title="Save as file"
                image={saveImage}
                onClick={() => dispatch(SaveAsFile)}
            />

            <ViewTool
                disabled={!model.history.isUndoable()}
                title="Undo"
                image={undoImage}
                onClick={() => dispatch(Undo)}
            />

            <ViewTool
                disabled={!model.history.isReadoable()}
                title="Redo"
                image={redoImage}
                onClick={() => dispatch(Redo)}
            />
        </StyledToolGroup>

        <StyledToolGroup>
            {TOOLS.map(tool => (
                <ViewEditTool
                    key={tool.title}
                    tool={tool}
                    mode={model.mode}
                    dispatch={dispatch}
                />
            ))}
        </StyledToolGroup>

        <StyledToolGroup>
            <ViewTool
                title="Find path"
                image={findPathImage}
                onClick={() => dispatch(Solve)}
            />
        </StyledToolGroup>
    </StyledToolbar>
);

const StyledError = styled.div`
    color: #c0392b;
`;

const StyledRoot = styled.div`
    display: flex;
    flex-flow: row nowrap;
    height: 100%;
    min-height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    font-size: 14px;
`;

export const View: React.FC<{
    model: Model;
    dispatch: Dispatch<Msg>;
}> = ({ model, dispatch }) => (
    <StyledRoot>
        <ViewToolbar model={model} dispatch={dispatch} />

        <StyledScroller>
            <ViewGrid
                multiple={model.multiple.isJust()}
                maze={model.multiple.getOrElse(model.history.getCurrent())}
                path={model.solving.toMaybe().tap(Maybe.join).getOrElse(Set.empty as Set<Maze.ID>)}
                dispatch={dispatch}
            />
        </StyledScroller>

        {model.solving.cata({
            Failure: error => (
                <StyledError>{error}</StyledError>
            ),

            Succeed: result => result.isNothing() && (
                <StyledError>No Path</StyledError>
            ),

            _: () => null
        })}
    </StyledRoot>
);
