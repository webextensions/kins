import { Component } from '../../../../../scripts/libs/kins/kins.js';

import { TODOS__UPDATE_STATUS_BAR_VISIBILITY } from '../TodosUiBox.events.js';

import ClearCompleted from './ClearCompleted/ClearCompleted.js';

import ItemsRemaining from './ItemsRemaining/ItemsRemaining.js';

class TodosStatus extends Component {
    constructor() {
        const config = {
            attributes: {
                className: 'TodosStatus',
                style: 'display:none'
            }
        };
        super(config);

        this.setup();
    }
    setup() {
        const _this = this;
        _this.append(new ClearCompleted());
        _this.append(new ItemsRemaining());

        _this.subscribeToParents(TODOS__UPDATE_STATUS_BAR_VISIBILITY, function (evt, newState) {
            let styleDisplay = '';
            if (newState === 'hide') {
                styleDisplay = 'none';
            }
            _this.dom.style.display = styleDisplay;
        });
    }
}

export default TodosStatus;
