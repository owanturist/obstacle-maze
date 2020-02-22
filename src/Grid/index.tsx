import React from 'react';
import styled from 'styled-components';
import { Dispatch } from 'Provider';

import * as Maze from 'Maze';
import * as Utils from 'Utils';

// M O D E L

export type Model = Readonly<{
    maze: Maze.Maze;
}>;

export const initial = (rows: number, cols: number): Model => ({
    maze: Maze.init(rows, cols)
});

// U P D A T E

export interface Msg extends Utils.Msg<[ Model ], Model> {}

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

    public render() {
        return (
            <StyledCell
                background={this.getBackground()}
            >

            </StyledCell>
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
    opacity: ${props => props.active && 0.5};
    cursor: pointer;
`;

const ViewToolbar: React.FC<{
    model: Model;
    dispatch: Dispatch<Msg>;
}> = ({ model, dispatch }) => (
    <StyledToolbar>
        <StyledTool
            title="Set start location"
            background={Color.Start}
        />

        <StyledTool
            title="Set target location"
            background={Color.Target}
        />

        <StyledTool
            title="Add boulder"
            background={Color.Wall}
        />

        <StyledTool
            title="Add gravel"
            background={Color.Gravel}
        />

        <StyledTool
            title="Add wormhole entrance"
            background={Color.PortalIn}
        />

        <StyledTool
            title="Add wormhole exit"
            background={Color.PortalOut}
        />

        <StyledTool
            title="Clear cell"
            background={Color.Default}
        />

        <StyledTool
            title="Remove all"
            background={Color.Default}
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
                        step={step}
                        dispatch={dispatch}
                    />
                );

                return acc;
            }, [])}
        </StyledGrid>
    </StyledRoot>
);
