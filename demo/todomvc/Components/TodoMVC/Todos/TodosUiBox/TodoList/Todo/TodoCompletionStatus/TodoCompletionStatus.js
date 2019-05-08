import { Component } from '../../../../../../../scripts/libs/kins/kins.js';

import { TODOS__TOGGLE_COMPLETION_STATUS } from './TodoCompletionStatus.events.js';

class TodoCompletionStatus extends Component {
    constructor() {
        const config = {
            attributes: {
                className: 'TodoCompletionStatus incomplete'
            },
            handlers: {
                click: function (evt, el) {
                    el.publishToParentsUptoFirstReply(TODOS__TOGGLE_COMPLETION_STATUS);
                }
            }
        };
        super(config);
    }
}

export default TodoCompletionStatus;
