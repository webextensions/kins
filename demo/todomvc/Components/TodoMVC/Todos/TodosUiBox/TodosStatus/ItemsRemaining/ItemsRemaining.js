import { Component } from '../../../../../../scripts/libs/kins/kins.js';

import { TODOS__NUMBER_OF_PENDING_TODOS } from '../../TodosUiBox.events.js';

class ItemsRemaining extends Component {
    constructor() {
        const config = {
            attributes: {
                className: 'ItemsRemaining'
            },
            innerHTML: '0 items left'
        };
        super(config);
    }
    afterConstructor() {
        const _this = this;
        _this.subscribeToParents(TODOS__NUMBER_OF_PENDING_TODOS, function (evt, count) {
            let str;
            if (count === 1) {
                str = count + ' item left';
            } else {
                str = count + ' items left';
            }
            _this.dom.innerHTML = str;
        });
    }
}

export default ItemsRemaining;
