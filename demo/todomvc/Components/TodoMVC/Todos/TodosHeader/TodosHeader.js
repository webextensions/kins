import { Component } from '../../../../scripts/libs/kins/kins.js';

import TextTodos from './TextTodos/TextTodos.js';

import EntryBox from './EntryBox/EntryBox.js';

class TodosHeader extends Component {
    constructor() {
        super({ nodeName: 'header' });
        this.setup();
    }
    setup() {
        this
            .append(new TextTodos())
            .append(new EntryBox());
    }
}

export default TodosHeader;
