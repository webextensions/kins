import { Component } from '../../../../../../../scripts/libs/kins/kins.js';

import { TODOS__REMOVE_CLICKED } from './RemoveTodo.events.js';

class RemoveTodo extends Component {
    constructor() {
        const config = {
            attributes: {
                className: 'RemoveTodo'
            },
            handlers: {
                click: function (evt, el) {
                    el.publishToParentsUptoFirstReply(TODOS__REMOVE_CLICKED);
                }
            }
        };
        super(config);
    }
}

export default RemoveTodo;
