import { saveAs } from 'file-saver';

import { Task } from 'frctl';

export interface Saver {
    withStringBody(content: string): Saver;
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

class FileImpl implements Saver {
    public constructor(
        private readonly name: string,
        private readonly body: Body
    ) {}

    public withStringBody(content: string): Saver {
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

export const saver = (filename: string): Saver => new FileImpl(filename, EmptyBody);

export const read = (file: File): Task<DOMException, string> => {
    return Task.binding(done => {
        const reader = new FileReader();

        reader.readAsText(file);

        reader.onload = () => done(Task.succeed(reader.result as string));
        reader.onerror = () => done(Task.fail(reader.error as DOMException));
    });
};
