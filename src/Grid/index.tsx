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

interface StyledCellProps {
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
    }

    &:hover:before {
        background: #7f8c8d;
    }
`;

class ViewCell extends React.PureComponent<{
    step: Maze.Step;
    dispatch: Dispatch<Msg>;
}> {
    private getBackground() {
        if (this.props.step.starting) {
            return '#e74c3c';
        }

        if (this.props.step.targeting) {
            return '#2ecc71';
        }

        // eslint-disable-next-line array-callback-return
        return this.props.step.obstacle.map<string>(obstacle => {
            switch (obstacle) {
                case Maze.Obstacle.Wall: return '#2c3e50';
                case Maze.Obstacle.Gravel: return '#bdc3c7';
                case Maze.Obstacle.PortalIn: return '#3498db';
                case Maze.Obstacle.PortalOut: return '#e67e22';
            }
        }).getOrElse('#ecf0f1');
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
    width: ${props => 30 * props.cols}px;
    min-width: 480px;
    max-width: 100%;

    ${StyledCell} {
        flex: 1 1 ${props => Math.floor(100 / props.cols)}%;
    }
`;

const StyledRoot = styled.div``;

export const View: React.FC<{
    model: Model;
    dispatch: Dispatch<Msg>;
}> = ({ model, dispatch }) => (
    <StyledRoot>
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
