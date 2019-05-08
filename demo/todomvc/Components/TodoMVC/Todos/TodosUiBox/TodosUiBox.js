import { Component } from '../../../../scripts/libs/kins/kins.js';

import {
    TODOS__COMPLETED_TODO_EXISTS,
    TODOS__COMPLETED_TODO_DOES_NOT_EXIST,
    TODOS__NUMBER_OF_PENDING_TODOS,
    TODOS__HOW_MANY_TODOS,
    TODOS__UPDATE_STATUS_BAR_VISIBILITY,
    TODOS__ARE_YOU_A_PENDING_TODO,
    TODOS__ARE_YOU_A_COMPLETED_TODO
} from './TodosUiBox.events.js';

import { TODOS__ITEMS_UPDATED } from './TodoList/TodoList.events.js';
import TodoList from './TodoList/TodoList.js';

import { TODOS__COMPLETION_STATUS_UPDATED } from './TodoList/Todo/Todo.events.js';

import TodosStatus from './TodosStatus/TodosStatus.js';

class TodosUiBox extends Component {
    constructor() {
        const config = {
            nodeName: 'section',
            attributes: {
                className: 'TodosUiBox'
            }
        };
        super(config);

        this.setup();
    }
    setup() {
        const _this = this;
        _this
            .append(new TodoList())
            .append(new TodosStatus());

        _this.subscribeToChildren(TODOS__ITEMS_UPDATED, function () {
            _this.updateStatusBarVisibility();
            _this.updateCompletedTodo();
            _this.updatePendingTodos();
        });

        _this.subscribeToChildren(TODOS__COMPLETION_STATUS_UPDATED, function () {
            _this.updateCompletedTodo();
            _this.updatePendingTodos();
        });
    }
    updateStatusBarVisibility() {
        const _this = this;

        const reply = _this.publishToChildrenUptoFirstReply(TODOS__HOW_MANY_TODOS);
        let show = false;
        if (reply >= 1) {
            show = true;
        }
        _this.publishToChildren(
            TODOS__UPDATE_STATUS_BAR_VISIBILITY,
            show ? 'show' : 'hide'
        );
    }
    updatePendingTodos() {
        const _this = this;

        let pendingTodos = 0;
        _this.publishToChildren(TODOS__ARE_YOU_A_PENDING_TODO, undefined, function (evt, value) {
            if (value) {
                pendingTodos++;
            }
            return true;
        });
        _this.publishToChildren(TODOS__NUMBER_OF_PENDING_TODOS, pendingTodos);
    }
    updateCompletedTodo() {
        const _this = this;

        const isThereAnyCompletedTodo = _this.publishToChildrenUptoFirstUsefulReply(TODOS__ARE_YOU_A_COMPLETED_TODO, undefined, function (evt, reply) {
            if (reply) {
                return true;
            }
            return false;
        });
        if (isThereAnyCompletedTodo) {
            _this.publishToChildren(TODOS__COMPLETED_TODO_EXISTS);
        } else {
            _this.publishToChildren(TODOS__COMPLETED_TODO_DOES_NOT_EXIST);
        }
    }
}

export default TodosUiBox;
