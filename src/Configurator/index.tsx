// tslint:disable:no-import-side-effect
import 'rc-slider/assets/index.css';

import React from 'react';
import styled from 'styled-components';
import { Dispatch } from 'Provider';
import Slider from 'rc-slider';
import { Cmd } from 'frctl';
import { Cata } from 'frctl/Basics';
import Maybe, { Nothing, Just } from 'frctl/Maybe';
import Either from 'frctl/Either';

import Dropzone from 'Dropzone';
import * as Utils from 'Utils';
import * as File from 'File';
import * as Maze from 'Maze';

// M O D E L

export type Model = Readonly<{
    rows: number;
    cols: number;
    error: Maybe<string>;
}>;

export const initial: Model = {
    rows: 20,
    cols: 20,
    error: Nothing
};

// U P D A T E

export type StagePattern<R> = Cata<{
    Updated(model: Model, cmd: Cmd<Msg>): R;
    Configured(rows: number, cols: number): R;
    Uploaded(maze: Maze.Maze): R;
}>;

export interface Stage {
    cata<R>(pattern: StagePattern<R>): R;
}

const Updated = Utils.cons(class Updated implements Stage {
    public constructor(
        private readonly model: Model,
        private readonly cmd: Cmd<Msg>
    ) {}

    public cata<R>(pattern: StagePattern<R>): R {
        return pattern.Updated ? pattern.Updated(this.model, this.cmd) : (pattern._ as () => R)();
    }
});

const Configured = Utils.cons(class Configured implements Stage {
    public constructor(
        private readonly rows: number,
        private readonly cols: number
    ) {}

    public cata<R>(pattern: StagePattern<R>): R {
        return pattern.Configured ? pattern.Configured(this.rows, this.cols) : (pattern._ as () => R)();
    }
});

const Uploaded = Utils.cons(class Uploaded implements Stage {
    public constructor(private readonly maze: Maze.Maze) {}

    public cata<R>(pattern: StagePattern<R>): R {
        return pattern.Uploaded ? pattern.Uploaded(this.maze) : (pattern._ as () => R)();
    }
});

// M S G

export interface Msg extends Utils.Msg<[ Model ], Stage> {}

const SetSize = Utils.cons(class SetRows implements Msg {
    public constructor(
        private readonly rows: boolean,
        private readonly size: number
    ) {}

    public update(model: Model): Stage {
        return Updated(
            this.rows ? {
                ...model,
                rows: this.size
            } : {
                ...model,
                cols: this.size
            },
            Cmd.none
        );
    }
});

const Configure = Utils.inst(class Configure implements Msg {
    public update(model: Model): Stage {
        return Configured(model.rows, model.cols);
    }
});

const UploadFile = Utils.cons(class UploadFile implements Msg {
    public constructor(private readonly file: Maybe<File>) {}

    public update(model: Model): Stage {
        return this.file.fold(
            () => Updated(
                {
                    ...model,
                    error: Just('Expects .txt file')
                },
                Cmd.none
            ),
            file => Updated(
                model,
                File.read(file)
                    .mapError(() => 'Error while reading')
                    .attempt(result => ReadMaze(result.chain(Maze.deserialize)))
            )
        );
    }
});

const ReadMaze = Utils.cons(class ReadMaze implements Msg {
    public constructor(private readonly result: Either<string, Maze.Maze>) {}

    public update(model: Model): Stage {
        return this.result.fold<Stage>(
            error => Updated(
                {
                    ...model,
                    error: Just(error)
                },
                Cmd.none
            ),

            Uploaded
        );
    }
});

// V I E W

const StyledSideSlider = styled.div`
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    margin-top: 10px;
`;

const StyledSideName = styled.span`
    flex: 0 0 auto;
    font-size: 16px;
    min-width: 80px;
`;

const ViewSideSlider: React.FC<{
    title: string;
    value: number;
    onChange(value: number): void;
}> = ({ title, value, onChange }) => (
    <StyledSideSlider>
        <StyledSideName>
            {title}: {value}
        </StyledSideName>

        <Slider
            value={value}
            step={1}
            min={Maze.MINIMUM_SIDE}
            max={Maze.MAXIMUM_SIDE}
            onChange={onChange}
        />
    </StyledSideSlider>
);

const StyledDropLink = styled.strong`
    cursor: pointer;

    &:hover {
        color: #3498db
    }
`;

const StyledDivider = styled.div`
    position: relative;
    margin: 30px 0;
    font-weight: bold;
    font-size: 18px;
    color: #ddd;
    text-align: center;

    &:before,
    &:after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        margin: auto;
        height: 0;
        border-top: 1px solid;
    }

    &:before {
        left: 0;
        right: 50%;
        margin-right: 20px;
    }

    &:after {
        right: 0;
        left: 50%;
        margin-left: 20px;
    }
`;

const StyledStartButton = styled.button`
    margin-top: 20px;
    display: block;
    width: 100%;
    height: 48px;
    border: none;
    border-radius: 3px;
    background: #3498db;
    color: #fff;
    outline: none;
    font-size: 18px;
    letter-spacing: 0.05em;
    cursor: pointer;

    &:focus {
        box-shadow: 0 0 0 3px rgba(52, 152, 219, .3);
    }

    &:hover {
        background-color: #258ed4;
    }
`;

const StyledRoot = styled.div`
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    font-size: 14px;
    color: #444;
`;


export const View: React.FC<{
    model: Model;
    dispatch: Dispatch<Msg>;
}> = ({ model, dispatch }) => (
    <StyledRoot>
        {model.error.fold(
            () => null,
            error => (
                <div>{error}</div>
            )
        )}

        <Dropzone onLoad={file => dispatch(UploadFile(file))}>
            <StyledDropLink>Choose maze file</StyledDropLink> or drag and drop
        </Dropzone>

        <StyledDivider>OR</StyledDivider>

        <ViewSideSlider
            title="Rows"
            value={model.rows}
            onChange={rows => dispatch(SetSize(true, rows))}
        />

        <ViewSideSlider
            title="Cols"
            value={model.cols}
            onChange={cols => dispatch(SetSize(false, cols))}
        />

        <StyledStartButton
            type="button"
            tabIndex={0}
            onClick={() => dispatch(Configure)}
        >
            Start from scratch
        </StyledStartButton>
    </StyledRoot>
);
