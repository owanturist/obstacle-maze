import React from 'react';
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

const MINIMUM_SIDE = 10;
const MAXIMUM_SIDE = 100;

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

export const View: React.FC<{
    model: Model;
    dispatch: Dispatch<Msg>;
}> = ({ model, dispatch }) => (
    <div>
        {model.error.fold(
            () => null,
            error => (
                <div>{error}</div>
            )
        )}

        <Dropzone
            onLoad={file => dispatch(UploadFile(file))}
        />

        -- or --

        <br />

        Rows: {model.rows}
        <Slider
            value={model.rows}
            step={1}
            min={MINIMUM_SIDE}
            max={MAXIMUM_SIDE}
            onChange={rows => dispatch(SetSize(true, rows))}
        />
        <br />

        Cols: {model.cols}
        <Slider
            value={model.cols}
            step={1}
            min={MINIMUM_SIDE}
            max={MAXIMUM_SIDE}
            onChange={cols => dispatch(SetSize(false, cols))}
        />

        <button
            onClick={() => dispatch(Configure)}
        >
            Done
        </button>
    </div>
);
