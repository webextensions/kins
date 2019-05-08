import { Component } from '../../../../../scripts/libs/kins/kins.js';

import { TODOS__ITEMS_UPDATED } from './TodoList.events.js';

import { TODOS__ADD_ACTIONABLE_ENTRY } from '../../Todos.events.js';

import { TODOS__HOW_MANY_TODOS } from '../TodosUiBox.events.js';

import { TODOS__REMOVE_TODO_ENTRY } from './Todo/Todo.events.js';
import Todo from './Todo/Todo.js';

class TodoList extends Component {
    constructor() {
        const config = {
            nodeName: 'ul',
            attributes: {
                className: 'TodoList'
            }
            /*
            // TODO: Cleanup this commented out code
            data: [
                {
                    details: 'todo one',
                    status: { complete: true }
                },
                {
                    details: 'todo two',
                    status: { complete: false }
                }
            ],
            render: function () {
                return {
                    attributes: {
                        className: 'TodoList'
                    }
                };
            }
            */
        };
        super(config);

        this.setup();
    }
    setup() {
        const _this = this;
        _this
            .subscribeToParents(TODOS__ADD_ACTIONABLE_ENTRY, function (evt, entryContents) {
                let success = false;
                const actionableTodo = new Todo(entryContents);

                this
                    .append(actionableTodo)
                    .publishToParents(TODOS__ITEMS_UPDATED);

                success = true;
                return success;
            })
            .subscribeToParents(TODOS__HOW_MANY_TODOS, function () {
                return this.children.length;
            });

        _this
            .subscribeToChildren(TODOS__REMOVE_TODO_ENTRY, function (evt, todoToRemove) {
                todoToRemove.remove();
                this.publishToParents(TODOS__ITEMS_UPDATED);
            });

    }
}

export default TodoList;
