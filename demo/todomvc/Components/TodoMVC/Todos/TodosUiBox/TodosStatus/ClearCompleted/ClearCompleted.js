import { Component } from '../../../../../../scripts/libs/kins/kins.js';

import {
    TODOS__COMPLETED_TODO_EXISTS,
    TODOS__COMPLETED_TODO_DOES_NOT_EXIST
} from '../../TodosUiBox.events.js';

class ClearCompleted extends Component {
    constructor() {
        const config = {
            attributes: {
                className: 'ClearCompleted'
            },
            innerHTML: 'Clear completed',
            handlers: {
                click: function (/* evt, el */) {
                    // TODO: Pending
                    console.log('TODO');    // eslint-disable-line no-console
                }
            }
        };
        super(config);
        this.setup();
    }
    setup() {
        const _this = this;
        _this
            .subscribeToParents(TODOS__COMPLETED_TODO_EXISTS, function () {
                _this.$$('show');
            })
            .subscribeToParents(TODOS__COMPLETED_TODO_DOES_NOT_EXIST, function () {
                _this.$$('hide');
            });
    }
}

export default ClearCompleted;
