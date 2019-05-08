import { Component } from '../../../scripts/libs/kins/kins.js';

import { TODOS__ADD_ACTIONABLE_ENTRY } from './Todos.events.js';

import TodosHeader from './TodosHeader/TodosHeader.js';

import { TODOS__DESCRIPTION_FOR_NEW_TODO } from './TodosHeader/EntryBox/EntryBox.events.js';

import TodosUiBox from './TodosUiBox/TodosUiBox.js';

class Todos extends Component {
    constructor() {
        super({ nodeName: 'header' });
        this.setup();
    }
    setup() {
        this
            .append(new TodosHeader())
            .append(new TodosUiBox())
            .subscribeToChildren(TODOS__DESCRIPTION_FOR_NEW_TODO, function (evt, entryContents) {
                this.publishToChildren(TODOS__ADD_ACTIONABLE_ENTRY, entryContents);
            });
    }
}

export default Todos;
