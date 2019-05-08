import { Component } from '../../../../../scripts/libs/kins/kins.js';

import { TODOS__DESCRIPTION_FOR_NEW_TODO } from './EntryBox.events.js';

class EntryBox extends Component {
    constructor() {
        const config = {
            nodeName: 'input',
            attributes: {
                className: 'EntryBox',
                placeholder: 'What needs to be done?',
                autofocus: ''
            },
            handlers: {
                keypress: function (evt, el) {
                    if (evt.code === 'Enter') {
                        const value = el.dom.value;
                        el.publishToParents(TODOS__DESCRIPTION_FOR_NEW_TODO, value);
                        el.dom.value = '';
                    }
                }
            }
        };
        super(config);
    }
}

export default EntryBox;
