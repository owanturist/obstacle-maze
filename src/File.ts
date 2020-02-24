import { saveAs } from 'file-saver';

import { Task } from 'frctl';

export interface File {
    withStringBody(content: string): File;
    save(): Task<never, null>;
}

interface Body {
    getExtention(): string;
    getType(): string;
    getContent(): string;
}

class StringBody implements Body {
    public constructor(private readonly content: string) {}

    public getExtention(): string {
        return 'txt';
    }

    public getType(): string {
        return 'text/plain;charset=utf-8';
    }

    public getContent(): string {
        return this.content;
    }
}

const EmptyBody = new StringBody('');

class FileImpl implements File {
    public constructor(
        private readonly name: string,
        private readonly body: Body
    ) {}

    public withStringBody(content: string): File {
        return new FileImpl(this.name, new StringBody(content));
    }

    public save(): Task<never, null> {
        return Task.binding(done => {
            const blob = new Blob([ this.body.getContent() ], { type: this.body.getType() });

            saveAs(blob, this.name);
            done(Task.succeed(null));
        });
    }
}

export const file = (filename: string): File => new FileImpl(filename, EmptyBody);
