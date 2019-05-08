import { Component } from '../../../../../../scripts/libs/kins/kins.js';

import {
    TODOS__COMPLETION_STATUS_UPDATED,
    TODOS__REMOVE_TODO_ENTRY
} from './Todo.events.js';

import {
    TODOS__ARE_YOU_A_PENDING_TODO,
    TODOS__ARE_YOU_A_COMPLETED_TODO
} from '../../TodosUiBox.events.js';

import RemoveTodo from './RemoveTodo/RemoveTodo.js';
import { TODOS__REMOVE_CLICKED } from './RemoveTodo/RemoveTodo.events.js';

import { TODOS__TOGGLE_COMPLETION_STATUS } from './TodoCompletionStatus/TodoCompletionStatus.events.js';
import TodoCompletionStatus from './TodoCompletionStatus/TodoCompletionStatus.js';

class Todo extends Component {
    constructor(entryContents) {
        const config = {
            nodeName: 'li',
            attributes: {
                className: 'Todo'
            },
            innerHTML: entryContents
        };
        super(config);

        this.state = {
            complete: false
        };
    }
    afterConstructor() {
        super.afterConstructor();
        this
            .subscribeToParents(TODOS__ARE_YOU_A_PENDING_TODO, function () {
                if (this.state.complete) {
                    return false;
                }
                return true;
            })
            .subscribeToParents(TODOS__ARE_YOU_A_COMPLETED_TODO, function () {
                if (this.state.complete) {
                    return true;
                }
                return false;
            })
            .subscribeToChildren(TODOS__REMOVE_CLICKED, function () {
                this.publishToParents(TODOS__REMOVE_TODO_ENTRY, this);
            })
            .subscribeToChildren(TODOS__TOGGLE_COMPLETION_STATUS, function () {
                this.toggleCompletionStatus();
            });
    }
    render(config) {
        super.render(config);

        const completionStatusCheckbox = new TodoCompletionStatus();
        this.append(completionStatusCheckbox);

        const remove = new RemoveTodo();
        this.append(remove);
    }
    toggleCompletionStatus() {
        const _this = this;
        const currentlyComplete = _this.state.complete;
        if (currentlyComplete) {
            _this.state.complete = false;
            _this.dom.classList.remove('complete');
            _this.dom.classList.add('incomplete');
        } else {
            _this.state.complete = true;
            _this.dom.classList.remove('incomplete');
            _this.dom.classList.add('complete');
        }

        this.publishToParents(TODOS__COMPLETION_STATUS_UPDATED);
    }
}

export default Todo;
