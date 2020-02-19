import React from 'react';
import { Program, Worker, Cmd, Sub } from 'frctl/Core';

export type Dispatch<Msg> = (msg: Msg) => void;

export interface Props<Model, Msg> {
    view: React.FC<{
        model: Model;
        dispatch: Dispatch<Msg>;
    }>;
    init: [ Model, Cmd<Msg> ];
    update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
    subscription(model: Model): Sub<Msg>;
}

export default class Provider<Model, Msg> extends React.PureComponent<Props<Model, Msg>, Model> {
    private readonly worker: Worker<Model, Msg>;
    private readonly dispatch: Dispatch<Msg>;
    private unsubscribe = () => { /* noop */ };

    protected constructor(props: Props<Model, Msg>) {
        super(props);

        this.worker = Program.worker({
            init: () => props.init,
            update: props.update,
            subscriptions: props.subscription
        }).init(null);

        this.dispatch = msg => this.worker.dispatch(msg);

        this.state = this.worker.getModel();
    }

    public componentDidMount() {
        this.unsubscribe = this.worker.subscribe(() => this.setState(this.worker.getModel()));
    }

    public componentWillUnmount() {
        this.unsubscribe();
    }

    public render() {
        const View = this.props.view;

        return (
            <View model={this.state} dispatch={this.dispatch} />
        );
    }
}
