/* globals document, HTMLElement, localStorage */

// http://xahlee.info/js/html5_non-closing_tag.html
const selfClosingTagNames = [
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr'
];

const tabs = function (numOfTabs) {
    return ' ' + ' |  '.repeat(numOfTabs);
};

class KinsEvent {
    constructor(evtConfig, evtData, sourceOfOrigin, currentTarget) {
        const _this = this;

        // _this.initialConfig = evtConfig;

        if (typeof evtConfig === 'string') {
            _this.name = evtConfig;
        } else {
            _this.name = evtConfig.name;
        }

        _this.data = evtData;

        _this.sourceOfOrigin = sourceOfOrigin;
        _this.currentTarget = currentTarget;

        _this._flagStopPropagation = false;
        _this._flagStop = false;
    }
    updateCurrentTarget(currentTarget) {
        this.currentTarget = currentTarget;
    }
    stopPropagation() {
        this._flagStopPropagation = true;
    }
    stop() {
        this._flagStop = true;
    }
}

class Component {
    constructor(config) {
        const _this = this;

        _this.initialConfig = config;
        _this.config = config;

        _this.children = [];

        _this.subscriptionsFromParents = {};
        _this.subscriptionsFromChildren = {};

        _this.childrenSubscribeTo = {};

        if (config instanceof HTMLElement) {
            _this.dom = config;
        } else {
            _this.render(config);
        }

        _this.afterConstructor();
    }
    afterConstructor() {
        // Currently doing nothing
    }
    $$(operation) {
        const _this = this;

        if (operation === 'hide') {
            _this.dom.style.display = 'none';
        } else if (operation === 'show') {
            _this.dom.style.display = '';
        }
    }
    queryItemPath() {
        const _this = this;

        let el = _this;
        const path = [];
        while (el && el.parent) {
            path.push(el.parent.children.indexOf(el));
            el = el.parent;
        }
        path.reverse();
        return path;    // root_object[p][a][t][h]
    }
    getRootNode() {
        const _this = this;

        let el = _this;
        while (el.parent) {
            el = el.parent;
        }
        return el;
    }
    getComponentFromPath(itemPath, wrt) {
        const _this = this;

        let root;
        if (wrt) {
            root = wrt;
        } else {
            root = _this.getRootNode();
        }

        let component = root;
        for (let i = 0; i < itemPath.length; i++) {
            component = component.children[itemPath[i]];
        }
        return component;
    }
    nativeEventToStrippedJsonObject(evt) {
        // Stripping out the properties which are not used often, so that
        // the localStorage doesn't use too much space
        return {
            altKey: evt.altKey,
            clientX: evt.clientX,
            clientY: evt.clientY,
            ctrlKey: evt.ctrlKey,
            metaKey: evt.metaKey,
            movementX: evt.movementX,
            movementY: evt.movementY,
            offsetX: evt.offsetX,
            offsetY: evt.offsetY,
            pageX: evt.pageX,
            pageY: evt.pageY,
            screenX: evt.screenX,
            screenY: evt.screenY,
            shiftKey: evt.shiftKey,
            type: evt.type,
            which: evt.which,
            x: evt.x,
            y: evt.y
        };
    }
    recordEvent(eventName, eventData, value) {
        const _this = this;

        const
            itemPath = _this.queryItemPath(),
            recordedEvents = Component.prototype.recordEvent.recordedEvents;

        recordedEvents.push({
            itemPath,
            eventName,
            eventData: _this.nativeEventToStrippedJsonObject(eventData),
            value
        });

        if (typeof localStorage !== 'undefined') {
            localStorage['recordedEvents'] = JSON.stringify(recordedEvents);
        }
    }
    replayEvents() {
        const _this = this;

        const
            root = _this.getRootNode(),
            recordedEvents = JSON.parse(localStorage.recordedEvents);

        const recordEventDefinition = Component.prototype.recordEvent;
        recordEventDefinition.recordedEvents = recordedEvents;
        recordEventDefinition.activateRecording = false;

        // TODO: Make this for loop and enabling of recordEventDefinition.activateRecording as
        //       asynchronous. For example, there might be AJAX calls happening in between events.
        //       To cover all such cases, we might need to do some refactoring elsewhere also.
        for (let i = 0; i < recordedEvents.length; i++) {
            const
                event = recordedEvents[i],
                component = root.getComponentFromPath(event.itemPath, root),
                value = event.value,
                dom = component.dom;
            if (value) {
                // TODO: Handle any other missing types as well
                if (['INPUT', 'TEXTAREA'].indexOf(dom.nodeName) >= 0) {
                    if (dom.nodeName === 'TEXTAREA') {
                        dom.value = value.value;
                    } else {
                        // TODO: Handle any other required cases, if any
                        if (dom.type === 'radio' || dom.type === 'checkbox') {
                            dom.checked = value.checked;
                        } else {
                            dom.value = value.value;
                        }
                    }
                } else {
                    // TODO: Remove "eslint-disable-line no-console" for the next line
                    console.log('Error: Unhandled scenario in "replayEvents"');     // eslint-disable-line no-console
                }
            }
            component.renderOptions.handlers[event.eventName](event.eventData, component);
        }
        // It might be safe to restore recordEventDefinition.activateRecording after the above loop
        // completes (we might need to make the above loop as asynchronous and add a "done" callback).
        // Verify that it would be so and remove this setTimeout.
        setTimeout(function () {
            recordEventDefinition.activateRecording = true;
        }, 10);
    }
    receiveEvent(evt, evtData, cb) {
        const _this = this;

        const evtName = evt.name;
        const subscriptionsFromChildrenForEvent = _this.subscriptionsFromChildren[evtName];
        if (subscriptionsFromChildrenForEvent) {
            for (let i = 0; i < subscriptionsFromChildrenForEvent.length; i++) {
                const subscriptionFromChildrenForEvent = subscriptionsFromChildrenForEvent[i];
                const reply = subscriptionFromChildrenForEvent.cb.call(evt.currentTarget, evt, evtData);
                cb(reply);
            }
        }
    }

    /*
    Sample usage:
        const
            EVENT_NAME = 'EVENT_NAME',
            EVENT_DATA = {};

        TODO:
            The first parameter should be extensible to:
                <String>
                    For example:
                        'EVENT_NAME'

                OR

                <Object>
                    For example:
                        {
                            name: 'EVENT_NAME',
                            propagation: 'bubble' (default) / 'capture'
                        }
    */

    /*
        Example:
            const replies = childComponent.publishToParents(
                EVENT_NAME,
                EVENT_DATA,
                function condition (evt, reply) {
                    if (doesReplySatisfyCondition(reply)) {
                        return true;
                    } else {
                        return false;
                    }
                }
            );
    */
    publishToParents(evtConfig, evtData, condition = true) {
        const _this = this;

        let startTime;
        // TODO: This code should be kept in development mode only
        if (Component.prototype._flagProfileEvents) {
            startTime = new Date();
        }

        const replies = [];

        let curNode = _this.parent;
        const evt = new KinsEvent(evtConfig, evtData, _this, curNode);

        let currentLogEventDepth;
        // TODO: This code should be kept in development mode only
        if (Component.prototype._flagLogEvents) {
            Component.prototype._logEventsDepth++;
            currentLogEventDepth = Component.prototype._logEventsDepth;
            console.log( // eslint-disable-line no-console
                tabs(currentLogEventDepth),
                evt.sourceOfOrigin.constructor.name,
                evt.sourceOfOrigin.dom,
                '▲',
                evt.name,
                evt.data === undefined ? '' : evt.data
            );
        }

        while (curNode) {
            evt.updateCurrentTarget(curNode);
            let continueProcessing = true;
            curNode.receiveEvent(evt, evtData, function (reply) {
                let flagCondition;
                if (typeof condition === 'function') {
                    flagCondition = condition.call(evt.sourceOfOrigin, evt, reply);
                } else {
                    flagCondition = condition;
                }

                if (flagCondition) {
                    replies.push(reply);
                }

                if (evt._flagStop) {
                    continueProcessing = false;
                    return;
                }
            });
            if (!continueProcessing) {
                break;
            }

            curNode = curNode.parent;
        }

        // TODO: This code should be kept in development mode only
        if (Component.prototype._flagProfileEvents) {
            Component.prototype._eventProfile['▲' + evt.name] = Component.prototype._eventProfile['▲' + evt.name] || 0;
            Component.prototype._eventProfile['▲' + evt.name] += (new Date() - startTime);
        }

        // TODO: This code should be kept in development mode only
        if (Component.prototype._flagLogEvents) {
            console.log( // eslint-disable-line no-console
                tabs(currentLogEventDepth),
                evt.name,
                replies
            );
            Component.prototype._logEventsDepth--;
        }

        return replies;
    }

    /*
        Sample usage:

        const
            EVENT_NAME = 'EVENT_NAME',
            EVENT_DATA = {};

        TODO:
            The first parameter should be extensible to:
                <String>
                    For example:
                        'EVENT_NAME'

                OR

                <Object>
                    For example:
                        {
                            name: 'EVENT_NAME',
                            traversal: 'dfs-pre-order' (default, synonym 'dfs') / 'dfs-in-order' / 'dfs-post-order' / 'bfs',
                            siblingsDirection: 'sequential' (default) / 'reverse'
                        }
    */
    /*
        Example:
            const replies = parentComponent.publishToChildren(
                EVENT_NAME,
                EVENT_DATA,
                function condition (evt, reply) {
                    if (doesReplySatisfyCondition(reply)) {
                        return true;
                    } else {
                        return false;
                    }
                }
            );
    */
    publishToChildren(evtConfig, evtData, condition = true) {
        const _this = this;

        let startTime;
        // TODO: This code should be kept in development mode only
        if (Component.prototype._flagProfileEvents) {
            startTime = new Date();
        }

        const replies = [];

        let curNode = _this;    // eslint-disable-line prefer-const
        const evt = new KinsEvent(evtConfig, evtData, _this, curNode);

        let currentLogEventDepth;
        // TODO: This code should be kept in development mode only
        if (Component.prototype._flagLogEvents) {
            Component.prototype._logEventsDepth++;
            currentLogEventDepth = Component.prototype._logEventsDepth;
            console.log( // eslint-disable-line no-console
                tabs(currentLogEventDepth),
                evt.sourceOfOrigin.constructor.name,
                evt.sourceOfOrigin.dom,
                '▼',
                evt.name,
                evt.data === undefined ? '' : evt.data
            );
        }

        _this.walkForEvent(_this, evt, function (subscriptionFromParents) {
            const reply = subscriptionFromParents.cb.call(this, evt, evtData);

            let flagCondition;
            if (typeof condition === 'function') {
                flagCondition = condition(evt, reply);
            } else {
                flagCondition = condition;
            }

            let continueProcessing;
            if (flagCondition) {
                replies.push(reply);
                continueProcessing = true;
            } else {
                continueProcessing = false;
            }

            if (evt._flagStop) {
                continueProcessing = false;
            }

            return continueProcessing;
        });

        // TODO: This code should be kept in development mode only
        if (Component.prototype._flagProfileEvents) {
            Component.prototype._eventProfile['▼' + evt.name] = Component.prototype._eventProfile['▼' + evt.name] || 0;
            Component.prototype._eventProfile['▼' + evt.name] += (new Date() - startTime);
        }

        // TODO: This code should be kept in development mode only
        if (Component.prototype._flagLogEvents) {
            console.log( // eslint-disable-line no-console
                tabs(currentLogEventDepth),
                evt.name,
                replies
            );
            Component.prototype._logEventsDepth--;
        }

        return replies;
    }

    getPublishFunctionByDirection(direction) {
        const _this = this;

        let publishToParentsOrChildren = undefined;
        switch (direction) {
            case 'parents':
                publishToParentsOrChildren = _this.publishToParents.bind(_this);
                break;
            case 'children':
                publishToParentsOrChildren = _this.publishToChildren.bind(_this);
                break;
            default:
                throw new Error('This should never happen');
        }

        return publishToParentsOrChildren;
    }

    publishToWhomUptoFirstReply(direction, evtConfig, evtData) {
        const _this = this;

        const publishToParentsOrChildren = _this.getPublishFunctionByDirection(direction);

        let firstReply = undefined;
        publishToParentsOrChildren(evtConfig, evtData, function (evt, reply) {
            firstReply = reply;
            evt.stop();
            return true;
        });

        return firstReply;
    }
    /*
        Example:
            const reply = childComponent.publishToParentsUptoFirstReply(EVENT_NAME, EVENT_DATA);
    */
    publishToParentsUptoFirstReply(evtConfig, evtData) {
        return this.publishToWhomUptoFirstReply('parents', evtConfig, evtData);
    }
    /*
        Example:
            const reply = parentComponent.publishToChildrenUptoFirstReply(EVENT_NAME, EVENT_DATA);
    */
    publishToChildrenUptoFirstReply(evtConfig, evtData) {
        return this.publishToWhomUptoFirstReply('children', evtConfig, evtData);
    }

    publishToWhomUptoFirstUsefulReply(direction, evtConfig, evtData, condition = true) {
        const _this = this;

        const publishToParentsOrChildren = _this.getPublishFunctionByDirection(direction);

        let foundUsefulReply = false;

        let usefulReply = undefined;
        publishToParentsOrChildren(evtConfig, evtData, function (evt, reply) {
            if (typeof condition === 'function') {
                foundUsefulReply = condition.call(evt.sourceOfOrigin, evt, reply);
            } else {
                foundUsefulReply = condition;
            }

            if (foundUsefulReply) {
                usefulReply = reply;
                evt.stop(); // No need to traverse further since we found a useful reply
            }

            return true;
        });

        return usefulReply;
    }
    /*
        Example:
            const reply = childComponent.publishToParentsUptoFirstUsefulReply(
                EVENT_NAME,
                EVENT_DATA,
                function condition (evt, reply) {
                    if (doesReplySatisfyCondition(reply)) {
                        return true;
                    } else {
                        return false;
                    }
                }
            );
    */
    publishToParentsUptoFirstUsefulReply(evtConfig, evtData, condition) {
        return this.publishToWhomUptoFirstUsefulReply('parents', evtConfig, evtData, condition);
    }
    /*
        Example:
            const reply = parentComponent.publishToChildrenUptoFirstUsefulReply(
                EVENT_NAME,
                EVENT_DATA,
                function condition (evt, reply) {
                    if (doesReplySatisfyCondition(reply)) {
                        return true;
                    } else {
                        return false;
                    }
                }
            );
    */
    publishToChildrenUptoFirstUsefulReply(evtConfig, evtData, condition) {
        return this.publishToWhomUptoFirstUsefulReply('children', evtConfig, evtData, condition);
    }

    /*
        Example:
            parentComponent.subscribeToChildren(
                EVENT_NAME,
                function (evt, data) {
                    let reply = processEvt(evt, data);
                    return reply;
                }
            );
    */
    subscribeToChildren(eventName, cb) {
        const _this = this;

        if (!_this.subscriptionsFromChildren[eventName]) {
            _this.subscriptionsFromChildren[eventName] = [];
        }
        _this.subscriptionsFromChildren[eventName].push({
            cb: cb
        });
        return _this;
    }

    /*
        Example:
            childComponent.subscribeToParents(
                EVENT_NAME,
                function (evt, data) {
                    let reply = processEvt(evt, data);
                    return reply;
                }
            );
    */
    subscribeToParents(eventName, cb) {
        const _this = this;

        if (!_this.subscriptionsFromParents[eventName]) {
            _this.subscriptionsFromParents[eventName] = [];
        }
        _this.subscriptionsFromParents[eventName].push({
            cb: cb
        });
        const componentHadAlreadySubscribedToThisEvent = _this.subscriptionsFromParents[eventName].length >= 2;

        if (!componentHadAlreadySubscribedToThisEvent) {
            let parentCmp = _this.parent;
            while (parentCmp) {
                if (!parentCmp.childrenSubscribeTo[eventName]) {
                    parentCmp.childrenSubscribeTo[eventName] = 0;
                }
                parentCmp.childrenSubscribeTo[eventName]++;
                parentCmp = parentCmp.parent;
            }
        }

        return _this;
    }

    walkForEvent(component, evt, cb) {
        // TODO:
        //     Recreate the "eventOb" and append it with "current-element" or some similar property

        const _this = this;

        const {
            name,
            sourceOfOrigin
        } = evt;

        let continueProcessing = true;

        // If the event is fired from the item which is currently being walked, then skip
        // checking its subscriptions (since we need to look only for subscriptions of the
        // children elements)
        if (sourceOfOrigin === component) {
            // do nothing
        } else {
            const subscriptionsFromParentsForEventName = component.subscriptionsFromParents[name];
            if (subscriptionsFromParentsForEventName) {
                for (let i = 0; i < subscriptionsFromParentsForEventName.length; i++) {
                    continueProcessing = cb.call(component, subscriptionsFromParentsForEventName[i]);
                    if (!continueProcessing) {
                        break;
                    }
                }
            }
        }

        if (continueProcessing) {
            // Walk through the children elements
            if (component.childrenSubscribeTo[name]) {
                const { children } = component;
                for (let i = 0; i < children.length; i++) {
                    const curNode = children[i];
                    evt.updateCurrentTarget(curNode);
                    continueProcessing = _this.walkForEvent(curNode, evt, cb);
                    if (!continueProcessing) {
                        break;
                    }
                }
            }
        }

        return continueProcessing;
    }

    syncChildrenSubscribeToInParentsOnComponentAddition(parentCmp, childCmp) {
        const firstParentBeingUpdated = parentCmp;

        {
            let curParent = firstParentBeingUpdated;
            while (curParent) {
                for (const eventName in childCmp.subscriptionsFromParents) {
                    if (!curParent.childrenSubscribeTo[eventName]) {
                        curParent.childrenSubscribeTo[eventName] = 0;
                    }
                    curParent.childrenSubscribeTo[eventName]++;
                }
                curParent = curParent.parent;
            }
        }

        {
            let curParent = firstParentBeingUpdated;
            while (curParent) {
                for (const eventName in childCmp.childrenSubscribeTo) {
                    if (!curParent.childrenSubscribeTo[eventName]) {
                        curParent.childrenSubscribeTo[eventName] = 0;
                    }
                    curParent.childrenSubscribeTo[eventName]++;
                }
                curParent = curParent.parent;
            }
        }
    }

    append(cmpToInsert) {
        const _this = this;

        // TODO: If "el" already has a parent, then it should be removed from there first
        cmpToInsert.parent = _this;

        _this.children.push(cmpToInsert);

        const
            parentCmp = _this,
            childCmp = cmpToInsert;
        _this.syncChildrenSubscribeToInParentsOnComponentAddition(parentCmp, childCmp);

        // Update DOM
        _this.dom.appendChild(cmpToInsert.dom);

        return _this;
    }
    getIndex() {
        const _this = this;

        return _this.parent.children.indexOf(_this);
    }
    getChildIndex(el) {
        return this.children.indexOf(el);
    }
    insertBefore(cmpToInsert, insertBeforeThisItem) {
        const _this = this;

        cmpToInsert.parent = _this;

        const indexToInsertAt = insertBeforeThisItem.getIndex();
        _this.children.splice(indexToInsertAt, 0, cmpToInsert);

        const
            parentCmp = _this,
            childCmp = cmpToInsert;
        _this.syncChildrenSubscribeToInParentsOnComponentAddition(parentCmp, childCmp);

        // Update DOM
        _this.dom.insertBefore(cmpToInsert.dom, insertBeforeThisItem.dom);

        // TODO: append
        return cmpToInsert;
    }
    replaceWith(newElement) {
        const _this = this;

        const parent = _this.parent;
        parent.insertBefore(newElement, _this);
        parent.removeChild(_this);
        return _this;
    }
    remove() {
        const _this = this;

        if (_this.parent) {
            _this.parent.removeChild(_this);
        }
        return _this;
    }

    syncChildrenSubscribeToInParentsOnComponentRemoval(parentCmp, childCmp) {
        const parentBeingUpdatedForComponentBeingRemoved = parentCmp;

        {
            let curParent = parentBeingUpdatedForComponentBeingRemoved;
            while (curParent) {
                for (const eventName in childCmp.subscriptionsFromParents) {
                    if (curParent.childrenSubscribeTo[eventName]) {
                        curParent.childrenSubscribeTo[eventName] -= (childCmp.subscriptionsFromParents[eventName].length ? 1 : 0);
                    }

                    if (curParent.childrenSubscribeTo[eventName] === 0) {
                        delete curParent.childrenSubscribeTo[eventName];
                    }
                }
                curParent = curParent.parent;
            }
        }

        {
            let curParent = parentBeingUpdatedForComponentBeingRemoved;
            while (curParent) {
                for (const eventName in childCmp.childrenSubscribeTo) {
                    if (curParent.childrenSubscribeTo[eventName]) {
                        curParent.childrenSubscribeTo[eventName] -= childCmp.childrenSubscribeTo[eventName];
                    }

                    if (curParent.childrenSubscribeTo[eventName] === 0) {
                        delete curParent.childrenSubscribeTo[eventName];
                    }
                }
                curParent = curParent.parent;
            }
        }
    }

    removeChild(child) {
        const _this = this;

        const componentAtIndex = _this.getChildIndex(child);
        if (componentAtIndex === -1) {
            // TODO: Add a warning (like the following) in non-production mode
            // console.warn('Warning: Attempting to remove a child which does not exist.'); // eslint-disable-line no-console
        } else {
            const removedComponent = _this.children.splice(componentAtIndex, 1)[0];

            const dom = removedComponent.dom;
            dom.parentNode.removeChild(dom);

            const
                parentCmp = _this,
                childCmp = child;
            _this.syncChildrenSubscribeToInParentsOnComponentRemoval(parentCmp, childCmp);

            removedComponent.parent = undefined;
        }
        return _this;
    }
    generateDom(options = {}) {
        const {
            nodeName = 'div',
            attributes = {},
            innerHTML
        } = options;

        let node;

        // https://www.dotnetperls.com/clonenode-js - A small optimization
        const preparedNodes = Component.prototype.generateDom.preparedNodes;
        if (preparedNodes[nodeName]) {
            node = preparedNodes[nodeName].cloneNode(false);
        } else {
            node = document.createElement(nodeName);
            preparedNodes[nodeName] = node.cloneNode(false);
        }

        const setAttribute = node.setAttribute.bind(node);
        Object.keys(attributes).forEach(function (passedAttributeName) {
            let appliedAttributeName;
            switch (passedAttributeName) {
                case 'className':
                    appliedAttributeName = 'class';
                    break;
                case 'htmlFor':
                    appliedAttributeName = 'for';
                    break;
                default:
                    appliedAttributeName = passedAttributeName;
                    break;
            }
            const appliedAttributeValue = attributes[passedAttributeName];
            setAttribute(appliedAttributeName, appliedAttributeValue);
        });

        if (innerHTML) {
            if (typeof innerHTML === 'function') {
                node.innerHTML = innerHTML();
            } else {
                node.innerHTML = innerHTML;
            }
        }

        return node;
    }
    generateHtml(options = {}) {
        const {
            nodeName = 'div',
            attributes = {},
            innerHTML
        } = options;
        let html = '',
            selfClosingTag = false;

        if (selfClosingTagNames.indexOf(nodeName) >= 0) {
            selfClosingTag = true;
        }

        html += `<${nodeName}`;
        Object.keys(attributes).forEach(function (passedAttributeName) {
            let appliedAttributeName;
            switch (passedAttributeName) {
                case 'className':
                    appliedAttributeName = 'class';
                    break;
                case 'htmlFor':
                    appliedAttributeName = 'for';
                    break;
                default:
                    appliedAttributeName = passedAttributeName;
                    break;
            }
            html += ' ' + appliedAttributeName + '="' + attributes[passedAttributeName] + '"';
        });

        if (selfClosingTag) {
            // As per XML like rules, it should be:
            //     html += ' />';
            // But, to make it same as how browsers render it, we use:
            //     html += '>';
            html += '>';
        } else {
            html += '>';
            if (innerHTML) {
                html += innerHTML;
            }
            html += `</${nodeName}>`;
        }
        return html;
    }
    nodeFromHtml(html) {
        // TODO: Warn / Throw error if there are none or multiple childNodes

        const outerNode = Component.prototype.nodeFromHtml.outerNode;
        outerNode.innerHTML = html;

        if (Component.prototype.nodeFromHtml.compareHtmlAndInnerhtml) {
            // Should be used in development mode only and disabled in production / profiling mode
            if (outerNode.innerHTML !== html) {
                // TODO: Remove "eslint-disable-line no-console" for the next line
                console.log(    // eslint-disable-line no-console
                    'Warning: There was a difference between the provided HTML and generated HTML' +
                    '\nHTML provided            : ' + html +
                    '\nHTML generated by browser: ' + outerNode.innerHTML
                );
            }
        }

        return outerNode.childNodes[0];
    }
    render(config = {}) {
        const _this = this;

        let dom;
        _this.renderOptions = config;

        if (Component.prototype.render.renderingApproach === 'createElement') {
            dom = _this.generateDom(config);
        } else {
            const html = _this.generateHtml(config);

            const useOptimization = true;
            // Later on, we may provide control for turning off this optimization globally
            if (useOptimization) {
                // Reusing "lastNode" improves performance for cases where same element is created multiple times
                // And on the same line, it can degrade performance where same element is not being created multiple times
                // In general, it seems to be a good enough optimization which doesn't have much negative side effects
                const constructor = _this.constructor;
                if (html === constructor.lastHtml) {
                    dom = constructor.lastNode.cloneNode(true);
                } else {
                    dom = _this.nodeFromHtml(html);
                    constructor.lastHtml = html;
                    constructor.lastNode = dom.cloneNode(true);
                }
            } else {
                dom = _this.nodeFromHtml(html);
            }
        }
        _this.dom = dom;

        const handlers = config.handlers;
        for (const eventName in handlers) {
            dom.addEventListener(eventName, function (evt) {
                if (Component.prototype.recordEvent.activateRecording) {
                    const dom = this;
                    let obValue = undefined;
                    // TODO: Handle any other types as well
                    if (['INPUT', 'TEXTAREA'].indexOf(dom.nodeName) >= 0) {
                        if (dom.nodeName === 'TEXTAREA') {
                            obValue = { value: dom.value };
                        } else {
                            if (dom.nodeName === 'INPUT') {
                                // TODO: Handle any other required cases, if any.
                                //       eg: Warn if we attempt to record event for "file" type input element
                                if (dom.type === 'radio' || dom.type === 'checkbox') {
                                    obValue = { checked: dom.checked };
                                } else {
                                    obValue = { value: dom.value };
                                }
                            }
                        }
                    }
                    _this.recordEvent(eventName, evt, obValue);
                }
                handlers[eventName](evt, _this);
            });
        }

        if (config && config.items) {
            for (let i = 0; i < config.items.length; i++) {
                _this.append(config.items[i]);
            }
        }
    }
}

/*
    We may have:

        Publish to children and subscribe to parents
        ============================================
            Component.prototype.replyWhenParentsAsk = Component.prototype.subscribeToParents;
            Component.prototype.askChildrenUptoFirstReply = Component.prototype.publishToChildrenUptoFirstReply;
            Component.prototype.askChildrenUptoFirstUsefulReply = Component.prototype.publishToChildrenUptoFirstUsefulReply;

        Publish to parents and subscribe to children
        ============================================
            Component.prototype.replyWhenChildrenAsk = Component.prototype.subscribeToChildren;
            Component.prototype.askParentsUptoFirstReply = Component.prototype.publishToParentsUptoFirstReply;
            Component.prototype.askParentsUptoFirstUsefulReply = Component.prototype.publishToParentsUptoFirstUsefulReply;
*/

// TODO: This code block should be kept in development mode only
/* Begin block */
Component.prototype._eventProfile = {};
Component.prototype._flagProfileEvents = false;
Component.prototype.profile = function () {
    Component.prototype._flagProfileEvents = true;
    console.log('Profiling Kins events.'); // eslint-disable-line no-console
};
Component.prototype.profileEnd = function () {
    Component.prototype._flagProfileEvents = false;
    console.log('Stopped profiling Kins events.'); // eslint-disable-line no-console
    Component.prototype.logProfile();
};
Component.prototype.logProfile = function () {
    console.log(Component.prototype._eventProfile); // eslint-disable-line no-console
};
/* End block */

// TODO: This code block should be kept in development mode only
/* Begin block */
Component.prototype._logEventsDepth = -1;
Component.prototype._flagLogEvents = false;
Component.prototype.logEvents = function () {
    Component.prototype._flagLogEvents = true;
    console.log('Logging Kins events.'); // eslint-disable-line no-console
};
Component.prototype.stopLoggingEvents = function () {
    Component.prototype._flagLogEvents = false;
    console.log('Stopped logging Kins events.'); // eslint-disable-line no-console
};
/* End block */

Component.prototype.generateDom.preparedNodes = {};
Component.prototype.render.renderingApproach = 'createElement';
// Component.prototype.render.renderingApproach = 'innerHTML';
Component.prototype.nodeFromHtml.outerNode = document.createElement('div');
Component.prototype.nodeFromHtml.compareHtmlAndInnerhtml = false;

Component.prototype.recordEvent.recordedEvents = [];
// Component.prototype.recordEvent.activateRecording = true;
Component.prototype.recordEvent.activateRecording = false;

export { Component };
