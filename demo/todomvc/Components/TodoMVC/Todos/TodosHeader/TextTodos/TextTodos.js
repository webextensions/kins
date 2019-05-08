import { Component } from '../../../../../scripts/libs/kins/kins.js';

class TextTodos extends Component {
    constructor() {
        const config = {
            nodeName: 'h1',
            attributes: {
                className: 'TextTodos'
            },
            innerHTML: 'todos'
        };
        super(config);
    }
}

export default TextTodos;
