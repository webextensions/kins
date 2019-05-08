/* globals describe, it, before */

/* eslint-disable no-console */

import {
    expect,
    assert
} from 'chai';
import sinon from 'sinon';

import { Component } from './kins.js';

const assertThatCodeShouldNeverReachHere = function () {
    assert(false, 'The code should never reach here');
};

describe('package', function () {
    describe('kins', function () {
        const checkForComponentClassFunctionsCalled = false;
        let functionsToSpy;
        before(function () {
            if (checkForComponentClassFunctionsCalled) {
                functionsToSpy = (
                    Object.getOwnPropertyNames(Component.prototype)
                ).filter(function (key) {
                    if (typeof Component.prototype[key] === 'function') {
                        return true;
                    } else {
                        return false;
                    }
                });

                functionsToSpy.forEach(function (functionToSpy) {
                    sinon.spy(Component.prototype, functionToSpy);
                });
            }
        });

        describe('basic tests', function () {
            // If there would be an error in import, the code would not reach this point
            it('should load fine when using import', function (done) {
                done();
            });

            it('should be able to import the Component class', function (done) {
                if (Component) {
                    done();
                } else {
                    done(new Error('Component is not available'));
                }
            });

            it('should be able to create a new component from the Component class', function () {
                const cmp = new Component();
                assert(cmp instanceof Component);
                expect(cmp.children).to.deep.equal([]);
                expect(cmp.childrenSubscribeTo).to.deep.equal({});
                expect(cmp.subscriptionsFromChildren).to.deep.equal({});
                expect(cmp.subscriptionsFromParents).to.deep.equal({});
            });

            it('should have the default DOM element as a <div> element', function () {
                const cmp = new Component();
                assert.isTrue(cmp.dom instanceof HTMLDivElement, 'cmp.dom needs to be instanceof HTMLDivElement');
            });
        });

        describe('parent child relationship', function () {
            describe('adding and removing child elements', function () {
                it('should be able to create a parent component with a child component', function () {
                    const
                        parent = new Component(),
                        child = new Component();
                    parent.append(child);

                    expect(parent.children).to.deep.equal([child]);
                    expect(child.parent).to.equal(parent);
                });

                it('should be able to create a parent component with two children components', function () {
                    const
                        parent = new Component(),
                        child1 = new Component(),
                        child2 = new Component();
                    parent
                        .append(child1)
                        .append(child2);

                    expect(parent.children).to.deep.equal([child1, child2]);

                    expect(child1.parent).to.equal(parent);
                    expect(child2.parent).to.equal(parent);
                });

                it('should be able to create a component with a child component and a grandchild component', function () {
                    const
                        cmp = new Component(),
                        childCmp = new Component(),
                        grandchildCmp = new Component();
                    cmp.append(childCmp);
                    childCmp.append(grandchildCmp);

                    expect(cmp.children).to.deep.equal([childCmp]);
                    expect(childCmp.parent).to.equal(cmp);

                    expect(childCmp.children).to.deep.equal([grandchildCmp]);
                    expect(grandchildCmp.parent).to.equal(childCmp);
                });

                it('should be able to remove a child component from a parent component', function () {
                    const
                        parent = new Component(),
                        child = new Component();

                    const validateRelationships = function () {
                        expect(parent.children).to.deep.equal([]);
                        expect(child.parent).to.equal(undefined);
                    };

                    // Test <parent>.removeChild()
                    parent.append(child);
                    parent.removeChild(child);
                    validateRelationships();

                    // Trying to remove the child again to see if it is robust enough to handle .removeChild() call for a component which is not the child
                    parent.removeChild(child);
                    validateRelationships();

                    // Test <child>.remove()
                    parent.append(child);
                    child.remove();
                    validateRelationships();

                    // Trying to remove the child again to see if it is robust enough to handle .remove() call for a component which has already been removed
                    child.remove();
                    validateRelationships();
                });

                it('should be able to append children components to a parent component and the parent component should know about the events its children subscribe to', function () {
                    const run = function ({ establishRelationshipsInBeginning }) {
                        const
                            parent = new Component(),
                            child1 = new Component(),
                            child2 = new Component();

                        const establishRelationships = function () {
                            parent
                                .append(child1)
                                .append(child2);
                        };

                        if (establishRelationshipsInBeginning) {
                            establishRelationships();
                        }

                        const EVENT_COMMON = 'EVENT_COMMON';

                        const EVENT_SUBSCRIBED_BY_CHILD1 = 'EVENT_SUBSCRIBED_BY_CHILD1';
                        child1.subscribeToParents(EVENT_COMMON, function () {});
                        child1.subscribeToParents(EVENT_SUBSCRIBED_BY_CHILD1, function () {});

                        const EVENT_SUBSCRIBED_BY_CHILD2 = 'EVENT_SUBSCRIBED_BY_CHILD2';
                        child2.subscribeToParents(EVENT_COMMON, function () {});
                        child2.subscribeToParents(EVENT_SUBSCRIBED_BY_CHILD2, function () {});

                        if (!establishRelationshipsInBeginning) {
                            establishRelationships();
                        }

                        const subscriptionsOb = {};
                        subscriptionsOb[EVENT_COMMON] = 2;
                        subscriptionsOb[EVENT_SUBSCRIBED_BY_CHILD1] = 1;
                        subscriptionsOb[EVENT_SUBSCRIBED_BY_CHILD2] = 1;
                        expect(parent.childrenSubscribeTo).to.deep.equal(subscriptionsOb);
                    };

                    // * First establish the parent-child relationships
                    // * Then attach the events
                    run({ establishRelationshipsInBeginning: true });

                    // * First attach the events
                    // * Then establish the parent-child relationships
                    run({ establishRelationshipsInBeginning: false });
                });

                it('should be able to create a parent component with multiple children components using .insertBefore()', function () {
                    const
                        parent = new Component(),
                        child1 = new Component(),
                        child2 = new Component(),
                        child3 = new Component(),
                        child4 = new Component();
                    parent
                        .append(child1)
                        .append(child4);

                    const EVENT_COMMON = 'EVENT_COMMON';
                    child1.subscribeToParents(EVENT_COMMON, function () {});
                    child2.subscribeToParents(EVENT_COMMON, function () {});
                    child3.subscribeToParents(EVENT_COMMON, function () {});
                    child4.subscribeToParents(EVENT_COMMON, function () {});

                    expect(parent.childrenSubscribeTo).to.deep.equal({
                        [EVENT_COMMON]: 2
                    });

                    parent.insertBefore(child3, child4);
                    parent.insertBefore(child2, child3);

                    expect(parent.childrenSubscribeTo).to.deep.equal({
                        [EVENT_COMMON]: 4
                    });

                    expect(parent.children).to.deep.equal([child1, child2, child3, child4]);

                    expect(child1.parent).to.equal(parent);
                    expect(child2.parent).to.equal(parent);
                    expect(child3.parent).to.equal(parent);
                    expect(child4.parent).to.equal(parent);

                    child1.remove();
                    child4.remove();

                    expect(child1.parent).to.equal(undefined);
                    expect(child4.parent).to.equal(undefined);
                    expect(parent.childrenSubscribeTo).to.deep.equal({
                        [EVENT_COMMON]: 2
                    });
                });

                it('should be able to append children and grandchildren components to a parent component and the parent component should know about the events its children subscribe to', function () {
                    const run = function ({ establishRelationshipsInBeginning }) {
                        const
                            cmp = new Component(),
                            childA = new Component(),
                            grandchildA1 = new Component(),
                            grandchildA2 = new Component(),
                            childB = new Component(),
                            grandchildB1 = new Component(),
                            grandchildB2 = new Component();

                        const establishRelationships = function () {
                            cmp
                                .append(childA)
                                .append(childB);
                            childA
                                .append(grandchildA1)
                                .append(grandchildA2);
                            childB
                                .append(grandchildB1)
                                .append(grandchildB2);
                        };

                        if (establishRelationshipsInBeginning) {
                            establishRelationships();
                        }

                        const EVENT_COMMON = 'EVENT_COMMON';

                        const
                            EVENT_SUBSCRIBED_BY_CHILD_A = 'EVENT_SUBSCRIBED_BY_CHILD_A',
                            EVENT_SUBSCRIBED_BY_GRANDCHILD_A_1 = 'EVENT_SUBSCRIBED_BY_GRANDCHILD_A_1',
                            EVENT_SUBSCRIBED_BY_GRANDCHILD_A_2 = 'EVENT_SUBSCRIBED_BY_GRANDCHILD_A_2',
                            EVENT_SUBSCRIBED_BY_CHILD_B = 'EVENT_SUBSCRIBED_BY_CHILD_B',
                            EVENT_SUBSCRIBED_BY_GRANDCHILD_B_1 = 'EVENT_SUBSCRIBED_BY_GRANDCHILD_B_1',
                            EVENT_SUBSCRIBED_BY_GRANDCHILD_B_2 = 'EVENT_SUBSCRIBED_BY_GRANDCHILD_B_2';

                        {
                            childA.subscribeToParents(EVENT_COMMON, function () {});
                            childA.subscribeToParents(EVENT_SUBSCRIBED_BY_CHILD_A, function () {});
                            {
                                grandchildA1.subscribeToParents(EVENT_COMMON, function () {});
                                grandchildA1.subscribeToParents(EVENT_SUBSCRIBED_BY_GRANDCHILD_A_1, function () {});

                                grandchildA2.subscribeToParents(EVENT_COMMON, function () {});
                                grandchildA2.subscribeToParents(EVENT_SUBSCRIBED_BY_GRANDCHILD_A_2, function () {});
                            }
                        }

                        {
                            childB.subscribeToParents(EVENT_COMMON, function () {});
                            childB.subscribeToParents(EVENT_SUBSCRIBED_BY_CHILD_B, function () {});
                            {
                                grandchildB1.subscribeToParents(EVENT_COMMON, function () {});
                                grandchildB1.subscribeToParents(EVENT_SUBSCRIBED_BY_GRANDCHILD_B_1, function () {});

                                grandchildB2.subscribeToParents(EVENT_COMMON, function () {});
                                grandchildB2.subscribeToParents(EVENT_SUBSCRIBED_BY_GRANDCHILD_B_2, function () {});
                            }
                        }

                        if (!establishRelationshipsInBeginning) {
                            establishRelationships();
                        }

                        expect(cmp.childrenSubscribeTo).to.deep.equal({
                            [EVENT_COMMON]: 6,
                            [EVENT_SUBSCRIBED_BY_CHILD_A]: 1,
                            [EVENT_SUBSCRIBED_BY_GRANDCHILD_A_1]: 1,
                            [EVENT_SUBSCRIBED_BY_GRANDCHILD_A_2]: 1,
                            [EVENT_SUBSCRIBED_BY_CHILD_B]: 1,
                            [EVENT_SUBSCRIBED_BY_GRANDCHILD_B_1]: 1,
                            [EVENT_SUBSCRIBED_BY_GRANDCHILD_B_2]: 1
                        });
                    };

                    // * First establish the parent-child relationships
                    // * Then attach the events
                    run({ establishRelationshipsInBeginning: true });

                    // * First attach the events
                    // * Then establish the parent-child relationships
                    run({ establishRelationshipsInBeginning: false });
                });

                it('should be able to append and remove children (who subscribe to same event multiple times) to a parent component and the parent component should know about the events its children subscribe to', function () {
                    const run = function ({ establishRelationshipsInBeginning }) {
                        const
                            cmp = new Component(),
                            childA = new Component(),
                            childB = new Component(),
                            grandchildA1 = new Component(),
                            grandchildA2 = new Component(),
                            grandchildB1 = new Component(),
                            grandchildB2 = new Component();

                        const establishRelationships = function () {
                            cmp
                                .append(childA)
                                .append(childB);
                            childA
                                .append(grandchildA1)
                                .append(grandchildA2);
                            childB
                                .append(grandchildB1)
                                .append(grandchildB2);
                        };

                        if (establishRelationshipsInBeginning) {
                            establishRelationships();
                        }

                        const
                            EVENT_COMMON = 'EVENT_COMMON',
                            EVENT_SUBSCRIBED_BY_CHILDREN_MULTIPLE_TIMES = 'EVENT_SUBSCRIBED_BY_CHILDREN_MULTIPLE_TIMES',
                            EVENT_SUBSCRIBED_ONCE_BY_EACH_GRANDCHILD = 'EVENT_SUBSCRIBED_ONCE_BY_EACH_GRANDCHILD';

                        const
                            EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_CHILD_A = 'EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_CHILD_A',
                            EVENT_SUBSCRIBED_ONCE_BY_CHILD_A = 'EVENT_SUBSCRIBED_ONCE_BY_CHILD_A';
                        const
                            EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_A_1 = 'EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_A_1',
                            EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_A_1 = 'EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_A_1';
                        const
                            EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_A_2 = 'EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_A_2',
                            EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_A_2 = 'EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_A_2';
                        {
                            childA.subscribeToParents(EVENT_COMMON, function () {});

                            childA.subscribeToParents(EVENT_SUBSCRIBED_BY_CHILDREN_MULTIPLE_TIMES, function () {}); // subscribing first time
                            childA.subscribeToParents(EVENT_SUBSCRIBED_BY_CHILDREN_MULTIPLE_TIMES, function () {}); // subscribing again

                            childA.subscribeToParents(EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_CHILD_A, function () {});  // subscribing first time
                            childA.subscribeToParents(EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_CHILD_A, function () {});  // subscribing again

                            childA.subscribeToParents(EVENT_SUBSCRIBED_ONCE_BY_CHILD_A, function () {});

                            {
                                grandchildA1.subscribeToParents(EVENT_COMMON, function () {});
                                grandchildA1.subscribeToParents(EVENT_SUBSCRIBED_ONCE_BY_EACH_GRANDCHILD, function () {});
                                grandchildA1.subscribeToParents(EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_A_1, function () {});
                                grandchildA1.subscribeToParents(EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_A_1, function () {});
                                grandchildA1.subscribeToParents(EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_A_1, function () {});

                                grandchildA2.subscribeToParents(EVENT_COMMON, function () {});
                                grandchildA2.subscribeToParents(EVENT_SUBSCRIBED_ONCE_BY_EACH_GRANDCHILD, function () {});
                                grandchildA2.subscribeToParents(EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_A_2, function () {});
                                grandchildA2.subscribeToParents(EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_A_2, function () {});
                                grandchildA2.subscribeToParents(EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_A_2, function () {});
                            }
                        }

                        const
                            EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_CHILD_B = 'EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_CHILD_B',
                            EVENT_SUBSCRIBED_ONCE_BY_CHILD_B = 'EVENT_SUBSCRIBED_ONCE_BY_CHILD_B';
                        const
                            EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_B_1 = 'EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_B_1',
                            EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_B_1 = 'EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_B_1';
                        const
                            EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_B_2 = 'EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_B_2',
                            EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_B_2 = 'EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_B_2';
                        {
                            childB.subscribeToParents(EVENT_COMMON, function () {});

                            childB.subscribeToParents(EVENT_SUBSCRIBED_BY_CHILDREN_MULTIPLE_TIMES, function () {}); // subscribing first time
                            childB.subscribeToParents(EVENT_SUBSCRIBED_BY_CHILDREN_MULTIPLE_TIMES, function () {}); // subscribing again

                            childB.subscribeToParents(EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_CHILD_B, function () {});  // subscribing first time
                            childB.subscribeToParents(EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_CHILD_B, function () {});  // subscribing again

                            childB.subscribeToParents(EVENT_SUBSCRIBED_ONCE_BY_CHILD_B, function () {});

                            {
                                grandchildB1.subscribeToParents(EVENT_COMMON, function () {});
                                grandchildB1.subscribeToParents(EVENT_SUBSCRIBED_ONCE_BY_EACH_GRANDCHILD, function () {});
                                grandchildB1.subscribeToParents(EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_B_1, function () {});
                                grandchildB1.subscribeToParents(EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_B_1, function () {});
                                grandchildB1.subscribeToParents(EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_B_1, function () {});

                                grandchildB2.subscribeToParents(EVENT_COMMON, function () {});
                                grandchildB2.subscribeToParents(EVENT_SUBSCRIBED_ONCE_BY_EACH_GRANDCHILD, function () {});
                                grandchildB2.subscribeToParents(EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_B_2, function () {});
                                grandchildB2.subscribeToParents(EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_B_2, function () {});
                                grandchildB2.subscribeToParents(EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_B_2, function () {});
                            }
                        }

                        if (!establishRelationshipsInBeginning) {
                            establishRelationships();
                        }

                        expect(cmp.childrenSubscribeTo).to.deep.equal({
                            [EVENT_COMMON]: 6,
                            [EVENT_SUBSCRIBED_BY_CHILDREN_MULTIPLE_TIMES]: 2,
                            [EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_CHILD_A]: 1,
                            [EVENT_SUBSCRIBED_ONCE_BY_CHILD_A]: 1,
                            [EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_CHILD_B]: 1,
                            [EVENT_SUBSCRIBED_ONCE_BY_CHILD_B]: 1,

                            [EVENT_SUBSCRIBED_ONCE_BY_EACH_GRANDCHILD]: 4,

                            [EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_A_1]: 1,
                            [EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_A_1]: 1,
                            [EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_A_2]: 1,
                            [EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_A_2]: 1,

                            [EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_B_1]: 1,
                            [EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_B_1]: 1,
                            [EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_B_2]: 1,
                            [EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_B_2]: 1
                        });

                        childA.removeChild(grandchildA1);

                        expect(cmp.childrenSubscribeTo).to.deep.equal({
                            [EVENT_COMMON]: 5,
                            [EVENT_SUBSCRIBED_BY_CHILDREN_MULTIPLE_TIMES]: 2,
                            [EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_CHILD_A]: 1,
                            [EVENT_SUBSCRIBED_ONCE_BY_CHILD_A]: 1,
                            [EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_CHILD_B]: 1,
                            [EVENT_SUBSCRIBED_ONCE_BY_CHILD_B]: 1,

                            [EVENT_SUBSCRIBED_ONCE_BY_EACH_GRANDCHILD]: 3,

                            [EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_A_2]: 1,
                            [EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_A_2]: 1,

                            [EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_B_1]: 1,
                            [EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_B_1]: 1,
                            [EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_B_2]: 1,
                            [EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_B_2]: 1
                        });

                        cmp.removeChild(childB);
                        expect(cmp.childrenSubscribeTo).to.deep.equal({
                            [EVENT_COMMON]: 2,
                            [EVENT_SUBSCRIBED_BY_CHILDREN_MULTIPLE_TIMES]: 1,
                            [EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_CHILD_A]: 1,
                            [EVENT_SUBSCRIBED_ONCE_BY_CHILD_A]: 1,

                            [EVENT_SUBSCRIBED_ONCE_BY_EACH_GRANDCHILD]: 1,

                            [EVENT_SUBSCRIBED_MULTIPLE_TIMES_BY_GRANDCHILD_A_2]: 1,
                            [EVENT_SUBSCRIBED_ONCE_BY_GRANDCHILD_A_2]: 1
                        });

                        cmp.removeChild(childA);
                        expect(cmp.childrenSubscribeTo).to.deep.equal({});
                    };

                    // * First establish the parent-child relationships
                    // * Then attach the events
                    run({ establishRelationshipsInBeginning: true });

                    // * First attach the events
                    // * Then establish the parent-child relationships
                    run({ establishRelationshipsInBeginning: false });
                });
            });

            describe(
                'should be able to handle "this" and event object in the subscriber when a component fires an event towards parents/children direction',
                function () {
                    const
                        greatGrandparentCmp = new Component(),
                        grandparentCmp = new Component(),
                        parentCmp = new Component(),
                        cmp = new Component();
                    greatGrandparentCmp.append(grandparentCmp);
                    grandparentCmp.append(parentCmp);
                    parentCmp.append(cmp);

                    const
                        EVENT_WHO_ARE_YOU = 'EVENT_WHO_ARE_YOU';

                    const
                        I_AM_GREATGRANDPARENT = 'I_AM_GREATGRANDPARENT',
                        I_AM_GRANDPARENT = 'I_AM_GRANDPARENT',
                        I_AM_PARENT = 'I_AM_PARENT',
                        I_AM_CMP = 'I_AM_CMP';

                    it('.subscribeToChildren() calls', function () {
                        greatGrandparentCmp.subscribeToChildren(EVENT_WHO_ARE_YOU, function (evt) {
                            assert(this === greatGrandparentCmp);
                            assert(evt.currentTarget === greatGrandparentCmp);
                            assert(evt.sourceOfOrigin === cmp);
                            return I_AM_GREATGRANDPARENT;
                        });
                        grandparentCmp.subscribeToChildren(EVENT_WHO_ARE_YOU, function (evt) {
                            assert(this === grandparentCmp);
                            assert(evt.currentTarget === grandparentCmp);
                            assert(evt.sourceOfOrigin === cmp);
                            return I_AM_GRANDPARENT;
                        });
                        parentCmp.subscribeToChildren(EVENT_WHO_ARE_YOU, function (evt) {
                            assert(this === parentCmp);
                            assert(evt.currentTarget === parentCmp);
                            assert(evt.sourceOfOrigin === cmp);
                            return I_AM_PARENT;
                        });

                        const replies = cmp.publishToParents(EVENT_WHO_ARE_YOU);
                        expect(replies).to.deep.equal([I_AM_PARENT, I_AM_GRANDPARENT, I_AM_GREATGRANDPARENT]);
                    });

                    it('.subscribeToParents() calls', function () {
                        grandparentCmp.subscribeToParents(EVENT_WHO_ARE_YOU, function (evt) {
                            assert(this === grandparentCmp);
                            assert(evt.currentTarget === grandparentCmp);
                            assert(evt.sourceOfOrigin === greatGrandparentCmp);
                            return I_AM_GRANDPARENT;
                        });
                        parentCmp.subscribeToParents(EVENT_WHO_ARE_YOU, function (evt) {
                            assert(this === parentCmp);
                            assert(evt.currentTarget === parentCmp);
                            assert(evt.sourceOfOrigin === greatGrandparentCmp);
                            return I_AM_PARENT;
                        });
                        cmp.subscribeToParents(EVENT_WHO_ARE_YOU, function (evt) {
                            assert(this === cmp);
                            assert(evt.currentTarget === cmp);
                            assert(evt.sourceOfOrigin === greatGrandparentCmp);
                            return I_AM_CMP;
                        });

                        const replies = greatGrandparentCmp.publishToChildren(EVENT_WHO_ARE_YOU);
                        expect(replies).to.deep.equal([I_AM_GRANDPARENT, I_AM_PARENT, I_AM_CMP]);
                    });
                }
            );

            describe('publish towards parents', function () {
                it(
                    'should be able to subscribe to an event in a parent component and when a child component fires an event towards parent direction, it should be handled',
                    function () {
                        const
                            parent = new Component(),
                            child = new Component();
                        parent.append(child);

                        const
                            DUMMY_EVENT = 'DUMMY_EVENT',
                            DUMMY_DATA = 'DUMMY_DATA',
                            DUMMY_RETURN = 'DUMMY_RETURN';

                        parent.subscribeToChildren(DUMMY_EVENT, function (evt, data) {
                            assert(typeof evt === 'object', 'Received parameter evt should be an object');
                            assert(evt.name === DUMMY_EVENT, 'The name of the received event should be available via "evt" object');
                            assert(evt.data === DUMMY_DATA, 'The event data should be available in the event object');
                            assert(data === DUMMY_DATA, 'The event data should be available as the callback argument');

                            return DUMMY_RETURN;
                        });

                        const replies = child.publishToParents(DUMMY_EVENT, DUMMY_DATA);
                        expect(replies).to.deep.equal([DUMMY_RETURN]);
                    }
                );

                it(
                    'should be able to subscribe to an event multiple times in a parent component and when a child component fires an event towards parent direction, it should be handled',
                    function () {
                        const
                            parent = new Component(),
                            child = new Component();
                        parent.append(child);

                        const
                            DUMMY_EVENT = 'DUMMY_EVENT',
                            DUMMY_DATA = 'DUMMY_DATA';

                        const
                            DUMMY_RETURN_1 = 'DUMMY_RETURN_1',
                            DUMMY_RETURN_2 = 'DUMMY_RETURN_2',
                            DUMMY_RETURN_3 = 'DUMMY_RETURN_3';

                        const checkAssertions = function (evt, data) {
                            assert(typeof evt === 'object', 'Received parameter evt should be an object');
                            assert(evt.name === DUMMY_EVENT, 'The name of the received event should be available via "evt" object');
                            assert(evt.data === DUMMY_DATA, 'The event data should be available in the event object');
                            assert(data === DUMMY_DATA, 'The event data should be available as the callback argument');
                        };

                        parent.subscribeToChildren(DUMMY_EVENT, function (evt, data) {
                            checkAssertions(evt, data);
                            return DUMMY_RETURN_1;
                        });

                        parent.subscribeToChildren(DUMMY_EVENT, function (evt, data) {
                            checkAssertions(evt, data);
                            return DUMMY_RETURN_2;
                        });

                        parent.subscribeToChildren(DUMMY_EVENT, function (evt, data) {
                            checkAssertions(evt, data);
                            return DUMMY_RETURN_3;
                        });

                        const replies = child.publishToParents(DUMMY_EVENT, DUMMY_DATA);
                        expect(replies).to.deep.equal([DUMMY_RETURN_1, DUMMY_RETURN_2, DUMMY_RETURN_3]);
                    }
                );

                it(
                    'should be able to subscribe to an event in parent and grandparent component and when the child component fires an event towards parent direction, it should be handled',
                    function () {
                        const
                            grandparentCmp = new Component(),
                            parentCmp = new Component(),
                            cmp = new Component();
                        grandparentCmp.append(parentCmp);
                        parentCmp.append(cmp);

                        const
                            EVENT_WHO_ARE_YOU = 'EVENT_WHO_ARE_YOU';

                        const
                            I_AM_PARENT = 'I_AM_PARENT',
                            I_AM_GRANDPARENT = 'I_AM_GRANDPARENT';

                        grandparentCmp.subscribeToChildren(EVENT_WHO_ARE_YOU, function () {
                            return I_AM_GRANDPARENT;
                        });
                        parentCmp.subscribeToChildren(EVENT_WHO_ARE_YOU, function () {
                            return I_AM_PARENT;
                        });

                        const replies = cmp.publishToParents(EVENT_WHO_ARE_YOU);
                        expect(replies).to.deep.equal([I_AM_PARENT, I_AM_GRANDPARENT]);
                    }
                );

                it(
                    'should be able to subscribe to an event multiple times in parent component and multiple times in grandparent component and when the child component fires an event towards parent direction, it should be handled in parent and then in grandparent',
                    function () {
                        const
                            grandparentCmp = new Component(),
                            parentCmp = new Component(),
                            cmp = new Component();
                        grandparentCmp.append(parentCmp);
                        parentCmp.append(cmp);

                        const
                            EVENT_WHAT_DO_YOU_OWN = 'EVENT_WHAT_DO_YOU_OWN';

                        const
                            I_AM_PARENT_I_OWN_A_CAR = 'I_AM_PARENT_I_OWN_A_CAR',
                            I_AM_PARENT_I_OWN_A_HOUSE = 'I_AM_PARENT_I_OWN_A_HOUSE';
                        grandparentCmp.subscribeToChildren(EVENT_WHAT_DO_YOU_OWN, function () {
                            return I_AM_GRANDPARENT_I_OWN_A_DOG;
                        });
                        grandparentCmp.subscribeToChildren(EVENT_WHAT_DO_YOU_OWN, function () {
                            return I_AM_GRANDPARENT_I_OWN_A_HOUSE;
                        });

                        const
                            I_AM_GRANDPARENT_I_OWN_A_DOG = 'I_AM_GRANDPARENT_I_OWN_A_DOG',
                            I_AM_GRANDPARENT_I_OWN_A_HOUSE = 'I_AM_GRANDPARENT_I_OWN_A_HOUSE';
                        parentCmp.subscribeToChildren(EVENT_WHAT_DO_YOU_OWN, function () {
                            return I_AM_PARENT_I_OWN_A_CAR;
                        });
                        parentCmp.subscribeToChildren(EVENT_WHAT_DO_YOU_OWN, function () {
                            return I_AM_PARENT_I_OWN_A_HOUSE;
                        });

                        const replies = cmp.publishToParents(EVENT_WHAT_DO_YOU_OWN);
                        expect(replies).to.deep.equal([
                            I_AM_PARENT_I_OWN_A_CAR,
                            I_AM_PARENT_I_OWN_A_HOUSE,
                            I_AM_GRANDPARENT_I_OWN_A_DOG,
                            I_AM_GRANDPARENT_I_OWN_A_HOUSE
                        ]);
                    }
                );

                it(
                    'should be able to set "this" in the publisher condition when a component fires an event towards parent direction',
                    function () {
                        const
                            greatGrandparentCmp = new Component(),
                            grandparentCmp = new Component(),
                            parentCmp = new Component(),
                            cmp = new Component();
                        greatGrandparentCmp.append(grandparentCmp);
                        grandparentCmp.append(parentCmp);
                        parentCmp.append(cmp);

                        const
                            EVENT_WHO_ARE_YOU = 'EVENT_WHO_ARE_YOU';

                        const
                            I_AM_GREATGRANDPARENT = 'I_AM_GREATGRANDPARENT',
                            I_AM_GRANDPARENT = 'I_AM_GRANDPARENT',
                            I_AM_PARENT = 'I_AM_PARENT';

                        greatGrandparentCmp.subscribeToChildren(EVENT_WHO_ARE_YOU, function () {
                            return I_AM_GREATGRANDPARENT;
                        });
                        grandparentCmp.subscribeToChildren(EVENT_WHO_ARE_YOU, function () {
                            return I_AM_GRANDPARENT;
                        });
                        parentCmp.subscribeToChildren(EVENT_WHO_ARE_YOU, function () {
                            return I_AM_PARENT;
                        });

                        let numberOfTimesTheAssertInsideConditionWasCalled = 0;
                        cmp.publishToParents(EVENT_WHO_ARE_YOU, undefined, function () {
                            assert(this === cmp);
                            numberOfTimesTheAssertInsideConditionWasCalled++;
                        });
                        expect(numberOfTimesTheAssertInsideConditionWasCalled).to.equal(3);
                    }
                );

                it(
                    'should be able to ignore the replies which are not useful',
                    function () {
                        const
                            greatGrandparentCmp = new Component(),
                            grandparentCmp = new Component(),
                            parentCmp = new Component(),
                            cmp = new Component();
                        greatGrandparentCmp.append(grandparentCmp);
                        grandparentCmp.append(parentCmp);
                        parentCmp.append(cmp);

                        const
                            EVENT_TELL_ME_ABOUT_YOU = 'EVENT_TELL_ME_ABOUT_YOU';

                        const
                            PROFILE_OF_GREATGRANDPARENT = { age: 75, ownsCar: true,  hasRetired: true,  freeFromLoans: true,  havePhone: true },
                            PROFILE_OF_GRANDPARENT =      { age: 50, ownsCar: false, hasRetired: false, freeFromLoans: true,  havePhone: true },
                            PROFILE_OF_PARENT =           { age: 25, ownsCar: true,  hasRetired: false, freeFromLoans: false, havePhone: true };

                        greatGrandparentCmp.subscribeToChildren(EVENT_TELL_ME_ABOUT_YOU, function () {
                            return PROFILE_OF_GREATGRANDPARENT;
                        });
                        grandparentCmp.subscribeToChildren(EVENT_TELL_ME_ABOUT_YOU, function () {
                            return PROFILE_OF_GRANDPARENT;
                        });
                        parentCmp.subscribeToChildren(EVENT_TELL_ME_ABOUT_YOU, function () {
                            return PROFILE_OF_PARENT;
                        });

                        const profileOfEldersWhoOwnCar = cmp.publishToParents(EVENT_TELL_ME_ABOUT_YOU, undefined, function (evt, profile) {
                            return profile.ownsCar;
                        });
                        expect(profileOfEldersWhoOwnCar).to.deep.equal([PROFILE_OF_PARENT, PROFILE_OF_GREATGRANDPARENT]);

                        const profileOfEldersWhoHaveRetired = cmp.publishToParents(EVENT_TELL_ME_ABOUT_YOU, undefined, function (evt, profile) {
                            return profile.hasRetired;
                        });
                        expect(profileOfEldersWhoHaveRetired).to.deep.equal([PROFILE_OF_GREATGRANDPARENT]);

                        const profileOfEldersWhoAreFreeFromLoans = cmp.publishToParents(EVENT_TELL_ME_ABOUT_YOU, undefined, function (evt, profile) {
                            return profile.freeFromLoans;
                        });
                        expect(profileOfEldersWhoAreFreeFromLoans).to.deep.equal([PROFILE_OF_GRANDPARENT, PROFILE_OF_GREATGRANDPARENT]);

                        const profileOfEldersWhoHavePhone = cmp.publishToParents(EVENT_TELL_ME_ABOUT_YOU, undefined, function (evt, profile) {
                            return profile.havePhone;
                        });
                        expect(profileOfEldersWhoHavePhone).to.deep.equal([PROFILE_OF_PARENT, PROFILE_OF_GRANDPARENT, PROFILE_OF_GREATGRANDPARENT]);
                    }
                );

                describe('handle core message passing', function () {
                    it(
                        'should be able to handle basic .publishToParentsUptoFirstReply() call',
                        function () {
                            const
                                grandparentCmp = new Component(),
                                parentCmp = new Component(),
                                cmp = new Component();
                            grandparentCmp.append(parentCmp);
                            parentCmp.append(cmp);

                            const EVENT_WHO_ARE_YOU = 'EVENT_WHO_ARE_YOU';

                            const
                                REPLY_I_AM_PARENT = 'REPLY_I_AM_PARENT',
                                REPLY_I_AM_GRANDPARENT = 'REPLY_I_AM_GRANDPARENT';

                            const spyForParentSubscribingToChildren = sinon.spy(function () {});
                            parentCmp.subscribeToChildren(EVENT_WHO_ARE_YOU, function () {
                                spyForParentSubscribingToChildren();
                                return REPLY_I_AM_PARENT;
                            });

                            grandparentCmp.subscribeToChildren(EVENT_WHO_ARE_YOU, function () {
                                assertThatCodeShouldNeverReachHere();
                                return REPLY_I_AM_GRANDPARENT;
                            });

                            const reply = cmp.publishToParentsUptoFirstReply(EVENT_WHO_ARE_YOU);
                            expect(reply).to.equal(REPLY_I_AM_PARENT);
                            expect(spyForParentSubscribingToChildren.calledOnce).to.equal(true);

                            const EVENT_WHICH_NO_ONE_SUBSCRIBES_TO = 'EVENT_WHICH_NO_ONE_SUBSCRIBES_TO';
                            const replyForAnEventToWhichNoParentSubscribes = cmp.publishToParentsUptoFirstReply(EVENT_WHICH_NO_ONE_SUBSCRIBES_TO);
                            expect(replyForAnEventToWhichNoParentSubscribes).to.equal(undefined);
                        }
                    );

                    it(
                        'should be able to handle basic .publishToParentsUptoFirstUsefulReply() call',
                        function () {
                            const
                                greatGrandparentCmp = new Component(),
                                grandparentCmp = new Component(),
                                parentCmp = new Component(),
                                cmp = new Component();
                            greatGrandparentCmp.append(grandparentCmp);
                            grandparentCmp.append(parentCmp);
                            parentCmp.append(cmp);

                            const
                                YES = 'YES',
                                NO = 'NO';

                            // Just a block
                            {
                                const EVENT_ARE_YOU_THERE = 'EVENT_ARE_YOU_THERE';
                                const spyForParentSubscribingToChildren = sinon.spy(function () {});
                                parentCmp.subscribeToChildren(EVENT_ARE_YOU_THERE, function () {
                                    spyForParentSubscribingToChildren();
                                    return YES;
                                });
                                grandparentCmp.subscribeToChildren(EVENT_ARE_YOU_THERE, function () {
                                    assertThatCodeShouldNeverReachHere();
                                    return YES;
                                });

                                const replyAreYouThere = cmp.publishToParentsUptoFirstUsefulReply(EVENT_ARE_YOU_THERE, undefined, function (evt, data) {
                                    if (data === YES) {
                                        return true;
                                    } else {
                                        return false;
                                    }
                                });
                                expect(replyAreYouThere).to.equal(YES);
                                expect(spyForParentSubscribingToChildren.calledOnce).to.equal(true);
                            }

                            // Just a block
                            {
                                const ARE_YOU_GRANDPARENT_OR_SENIOR = 'ARE_YOU_GRANDPARENT_OR_SENIOR';
                                const
                                    YES_I_AM_GRANDPARENT = 'YES_I_AM_GRANDPARENT',
                                    YES_I_AM_GREATGRANDPARENT = 'YES_I_AM_GREATGRANDPARENT';
                                const spyForGreatGrandparent = sinon.spy(function () {});
                                greatGrandparentCmp.subscribeToChildren(ARE_YOU_GRANDPARENT_OR_SENIOR, function () {
                                    spyForGreatGrandparent();
                                    return YES_I_AM_GREATGRANDPARENT;
                                });
                                const spyForGrandparent = sinon.spy(function () {});
                                grandparentCmp.subscribeToChildren(ARE_YOU_GRANDPARENT_OR_SENIOR, function () {
                                    spyForGrandparent();
                                    return YES_I_AM_GRANDPARENT;
                                });
                                const spyForParent = sinon.spy(function () {});
                                parentCmp.subscribeToChildren(ARE_YOU_GRANDPARENT_OR_SENIOR, function () {
                                    spyForParent();
                                    return NO;
                                });

                                const replyGrandparentOrSenior = cmp.publishToParentsUptoFirstUsefulReply(ARE_YOU_GRANDPARENT_OR_SENIOR, undefined, function (evt, data) {
                                    if (data === YES_I_AM_GRANDPARENT || data === YES_I_AM_GREATGRANDPARENT) {
                                        return true;
                                    } else {
                                        return false;
                                    }
                                });
                                expect(replyGrandparentOrSenior).to.satisfy(function (data) {
                                    if (data === YES_I_AM_GRANDPARENT || data === YES_I_AM_GREATGRANDPARENT) {
                                        return true;
                                    } else {
                                        return false;
                                    }
                                });
                                expect(spyForParent.calledOnce).to.equal(true);
                                expect(spyForGrandparent.calledOnce).to.equal(true);
                                expect(spyForGreatGrandparent.calledOnce).to.equal(false);
                            }
                        }
                    );

                    it(
                        'should be able to handle basic .publishToParents() call upto some replies',
                        function () {
                            const
                                greatGrandparentCmp = new Component(),
                                grandparentCmp = new Component(),
                                parentCmp = new Component(),
                                cmp = new Component();
                            greatGrandparentCmp.append(grandparentCmp);
                            grandparentCmp.append(parentCmp);
                            parentCmp.append(cmp);

                            const
                                I_AM_PARENT = 'I_AM_PARENT',
                                I_AM_GRANDPARENT = 'I_AM_GRANDPARENT',
                                I_AM_GREATGRANDPARENT = 'I_AM_GREATGRANDPARENT';

                            const EVENT_DETECT_UP_TO_PARENT = 'EVENT_DETECT_UP_TO_PARENT';
                            parentCmp.subscribeToChildren(EVENT_DETECT_UP_TO_PARENT, function () { return I_AM_PARENT; });
                            grandparentCmp.subscribeToChildren(EVENT_DETECT_UP_TO_PARENT, function () { return I_AM_GRANDPARENT; });
                            greatGrandparentCmp.subscribeToChildren(EVENT_DETECT_UP_TO_PARENT, function () { return I_AM_GREATGRANDPARENT; });
                            let countDetectUpToParentCalls = 0;
                            const repliesUptoParent = cmp.publishToParents(EVENT_DETECT_UP_TO_PARENT, undefined, function (evt, data) {
                                countDetectUpToParentCalls++;
                                if (data === I_AM_PARENT) {
                                    evt.stop();
                                }
                                return data === I_AM_PARENT;
                            });
                            expect(countDetectUpToParentCalls).to.equal(1);
                            expect(repliesUptoParent).to.deep.equal([I_AM_PARENT]);

                            const EVENT_DETECT_UP_TO_GRANDPARENT = 'EVENT_DETECT_UP_TO_GRANDPARENT';
                            parentCmp.subscribeToChildren(EVENT_DETECT_UP_TO_GRANDPARENT, function () { return I_AM_PARENT; });
                            grandparentCmp.subscribeToChildren(EVENT_DETECT_UP_TO_GRANDPARENT, function () { return I_AM_GRANDPARENT; });
                            greatGrandparentCmp.subscribeToChildren(EVENT_DETECT_UP_TO_GRANDPARENT, function () { return I_AM_GREATGRANDPARENT; });
                            let countDetectUpToGrandparentCalls = 0;
                            const repliesUptoGrandparent = cmp.publishToParents(EVENT_DETECT_UP_TO_GRANDPARENT, undefined, function (evt, data) {
                                countDetectUpToGrandparentCalls++;
                                if (data === I_AM_GRANDPARENT) {
                                    evt.stop();
                                }
                                return (data === I_AM_PARENT || data === I_AM_GRANDPARENT);
                            });
                            expect(countDetectUpToGrandparentCalls).to.equal(2);
                            expect(repliesUptoGrandparent).to.deep.equal([I_AM_PARENT, I_AM_GRANDPARENT]);

                            const EVENT_DETECT_UP_TO_GREATGRANDPARENT = 'EVENT_DETECT_UP_TO_GREATGRANDPARENT';
                            parentCmp.subscribeToChildren(EVENT_DETECT_UP_TO_GREATGRANDPARENT, function () { return I_AM_PARENT; });
                            grandparentCmp.subscribeToChildren(EVENT_DETECT_UP_TO_GREATGRANDPARENT, function () { return I_AM_GRANDPARENT; });
                            greatGrandparentCmp.subscribeToChildren(EVENT_DETECT_UP_TO_GREATGRANDPARENT, function () { return I_AM_GREATGRANDPARENT; });
                            let countDetectUpToGreatGrandparentCalls = 0;
                            const repliesUptoGreatGrandparent = cmp.publishToParents(EVENT_DETECT_UP_TO_GREATGRANDPARENT, undefined, function (evt, data) {
                                countDetectUpToGreatGrandparentCalls++;
                                if (data === I_AM_GREATGRANDPARENT) {
                                    evt.stop();
                                }
                                return (data === I_AM_PARENT || data === I_AM_GRANDPARENT || data === I_AM_GREATGRANDPARENT);
                            });
                            expect(countDetectUpToGreatGrandparentCalls).to.equal(3);
                            expect(repliesUptoGreatGrandparent).to.deep.equal([I_AM_PARENT, I_AM_GRANDPARENT, I_AM_GREATGRANDPARENT]);
                        }
                    );

                    it(
                        'should be able to handle basic .publishToParents() call upto all replies',
                        function () {
                            const
                                greatGrandparentCmp = new Component(),
                                grandparentCmp = new Component(),
                                parentCmp = new Component(),
                                cmp = new Component();
                            greatGrandparentCmp.append(grandparentCmp);
                            grandparentCmp.append(parentCmp);
                            parentCmp.append(cmp);

                            const EVENT_WHO_ARE_YOU = 'EVENT_WHO_ARE_YOU';

                            const
                                I_AM_PARENT = 'I_AM_PARENT',
                                I_AM_GRANDPARENT = 'I_AM_GRANDPARENT',
                                I_AM_GREATGRANDPARENT = 'I_AM_GREATGRANDPARENT';

                            parentCmp.subscribeToChildren(EVENT_WHO_ARE_YOU, function () { return I_AM_PARENT; });
                            grandparentCmp.subscribeToChildren(EVENT_WHO_ARE_YOU, function () { return I_AM_GRANDPARENT; });
                            greatGrandparentCmp.subscribeToChildren(EVENT_WHO_ARE_YOU, function () { return I_AM_GREATGRANDPARENT; });

                            const replies = cmp.publishToParents(EVENT_WHO_ARE_YOU);

                            expect(replies).to.deep.equal([
                                I_AM_PARENT,
                                I_AM_GRANDPARENT,
                                I_AM_GREATGRANDPARENT
                            ]);
                        }
                    );
                });
            });

            describe('publish towards children', function () {
                it(
                    'should be able to subscribe to an event in a child component and when a parent component fires an event towards children direction, it should be handled',
                    function () {
                        const
                            parent = new Component(),
                            child = new Component();
                        parent.append(child);

                        const
                            DUMMY_EVENT = 'DUMMY_EVENT',
                            DUMMY_DATA = 'DUMMY_DATA',
                            DUMMY_RETURN = 'DUMMY_RETURN';

                        child.subscribeToParents(DUMMY_EVENT, function (evt, data) {
                            assert(typeof evt === 'object', 'Received parameter evt should be an object');
                            assert(evt.name === DUMMY_EVENT, 'The name of the received event should be available via "evt" object');
                            assert(evt.data === DUMMY_DATA, 'The event data should be available in the event object');
                            assert(data === DUMMY_DATA, 'The event data should be available as the callback argument');

                            return DUMMY_RETURN;
                        });

                        const replies = parent.publishToChildren(DUMMY_EVENT, DUMMY_DATA);
                        expect(replies).to.deep.equal([DUMMY_RETURN]);
                    }
                );

                it(
                    'should be able to subscribe to an event in a component and when a grandparent component fires an event towards children direction, it should be handled',
                    function () {
                        const
                            grandparentCmp = new Component(),
                            parentCmp = new Component(),
                            cmp = new Component();
                        grandparentCmp.append(parentCmp);
                        parentCmp.append(cmp);

                        const
                            DUMMY_EVENT = 'DUMMY_EVENT',
                            DUMMY_DATA = 'DUMMY_DATA',
                            DUMMY_REPLY = 'DUMMY_REPLY';

                        cmp.subscribeToParents(DUMMY_EVENT, function () {
                            return DUMMY_REPLY;
                        });

                        const replies = grandparentCmp.publishToChildren(DUMMY_EVENT, DUMMY_DATA);
                        expect(replies).to.deep.equal([DUMMY_REPLY]);
                    }
                );

                it(
                    'should be able to subscribe to an event multiple times in a child component and when a parent component fires an event towards children direction, it should be handled',
                    function () {
                        const
                            parent = new Component(),
                            child = new Component();
                        parent.append(child);

                        const
                            DUMMY_EVENT = 'DUMMY_EVENT',
                            DUMMY_DATA = 'DUMMY_DATA';

                        const
                            DUMMY_RETURN_1 = 'DUMMY_RETURN_1',
                            DUMMY_RETURN_2 = 'DUMMY_RETURN_2';

                        const checkAssertions = function (evt, data) {
                            assert(typeof evt === 'object', 'Received parameter evt should be an object');
                            assert(evt.name === DUMMY_EVENT, 'The name of the received event should be available via "evt" object');
                            assert(evt.data === DUMMY_DATA, 'The event data should be available in the event object');
                            assert(data === DUMMY_DATA, 'The event data should be available as the callback argument');
                        };

                        child.subscribeToParents(DUMMY_EVENT, function (evt, data) {
                            checkAssertions(evt, data);
                            return DUMMY_RETURN_1;
                        });

                        child.subscribeToParents(DUMMY_EVENT, function (evt, data) {
                            checkAssertions(evt, data);
                            return DUMMY_RETURN_2;
                        });

                        const replies = parent.publishToChildren(DUMMY_EVENT, DUMMY_DATA);
                        expect(replies).to.deep.equal([DUMMY_RETURN_1, DUMMY_RETURN_2]);
                    }
                );

                describe('handle core message passing', function () {
                    it(
                        'should be able to handle basic .publishToChildrenUptoFirstReply() call',
                        function () {
                            const
                                parent = new Component(),
                                child1 = new Component(),
                                child2 = new Component();
                            parent.append(child1);
                            parent.append(child2);

                            const
                                YES = 'YES',
                                NO = 'NO';

                            const ARE_YOU_THE_FIRST_CHILD = 'ARE_YOU_THE_FIRST_CHILD';

                            const spyForAreYouFirstChildEventInChild1 = sinon.spy(function () {});
                            child1.subscribeToParents(ARE_YOU_THE_FIRST_CHILD, function () { spyForAreYouFirstChildEventInChild1(); return YES; });
                            child2.subscribeToParents(ARE_YOU_THE_FIRST_CHILD, function () { assertThatCodeShouldNeverReachHere(); return NO; });
                            const firstReply = parent.publishToChildrenUptoFirstReply(ARE_YOU_THE_FIRST_CHILD);
                            expect(firstReply).to.equal(YES);
                            expect(spyForAreYouFirstChildEventInChild1.calledOnce).to.equal(true);
                        }
                    );

                    it(
                        'should be able to handle basic .publishToChildrenUptoFirstUsefulReply() call',
                        function () {
                            const
                                parent = new Component(),
                                child1 = new Component(),
                                child2 = new Component(),
                                child3 = new Component();
                            parent.append(child1);
                            parent.append(child2);
                            parent.append(child3);

                            const
                                YES = 'YES',
                                NO = 'NO';

                            const
                                ARE_YOU_THE_FIRST_CHILD = 'ARE_YOU_THE_FIRST_CHILD',
                                ARE_YOU_THE_SECOND_CHILD = 'ARE_YOU_THE_SECOND_CHILD',
                                ARE_YOU_THE_THIRD_CHILD = 'ARE_YOU_THE_THIRD_CHILD',
                                ARE_YOU_THE_FOURTH_CHILD = 'ARE_YOU_THE_FOURTH_CHILD';

                            const spyForAreYouFirstChildEventInChild1 = sinon.spy(function () {});
                            child1.subscribeToParents(ARE_YOU_THE_FIRST_CHILD, function () { spyForAreYouFirstChildEventInChild1(); return YES; });
                            child2.subscribeToParents(ARE_YOU_THE_FIRST_CHILD, function () { assertThatCodeShouldNeverReachHere(); return NO; });
                            child3.subscribeToParents(ARE_YOU_THE_FIRST_CHILD, function () { assertThatCodeShouldNeverReachHere(); return NO; });
                            const replyFirst = parent.publishToChildrenUptoFirstUsefulReply(ARE_YOU_THE_FIRST_CHILD, undefined, function condition(evt, reply) { return reply === YES; });
                            expect(replyFirst).to.equal(YES);
                            expect(spyForAreYouFirstChildEventInChild1.calledOnce).to.equal(true);

                            const spyForAreYouSecondChildEventInChild1 = sinon.spy(function () {});
                            child1.subscribeToParents(ARE_YOU_THE_SECOND_CHILD, function () { spyForAreYouSecondChildEventInChild1(); return NO; });
                            const spyForAreYouSecondChildEventInChild2 = sinon.spy(function () {});
                            child2.subscribeToParents(ARE_YOU_THE_SECOND_CHILD, function () { spyForAreYouSecondChildEventInChild2(); return YES; });
                            child3.subscribeToParents(ARE_YOU_THE_SECOND_CHILD, function () { assertThatCodeShouldNeverReachHere(); return NO; });
                            const replySecond = parent.publishToChildrenUptoFirstUsefulReply(ARE_YOU_THE_SECOND_CHILD, undefined, function condition(evt, reply) { return reply === YES; });
                            expect(replySecond).to.equal(YES);
                            expect(spyForAreYouSecondChildEventInChild1.calledOnce).to.equal(true);
                            expect(spyForAreYouSecondChildEventInChild2.calledOnce).to.equal(true);

                            const spyForAreYouThirdChildEventInChild1 = sinon.spy(function () {});
                            child1.subscribeToParents(ARE_YOU_THE_THIRD_CHILD, function () { spyForAreYouThirdChildEventInChild1(); return NO; });
                            const spyForAreYouThirdChildEventInChild2 = sinon.spy(function () {});
                            child2.subscribeToParents(ARE_YOU_THE_THIRD_CHILD, function () { spyForAreYouThirdChildEventInChild2(); return NO; });
                            const spyForAreYouThirdChildEventInChild3 = sinon.spy(function () {});
                            child3.subscribeToParents(ARE_YOU_THE_THIRD_CHILD, function () { spyForAreYouThirdChildEventInChild3(); return YES; });
                            const replyThird = parent.publishToChildrenUptoFirstUsefulReply(ARE_YOU_THE_THIRD_CHILD, undefined, function condition(evt, reply) { return reply === YES; });
                            expect(replyThird).to.equal(YES);
                            expect(spyForAreYouThirdChildEventInChild1.calledOnce).to.equal(true);
                            expect(spyForAreYouThirdChildEventInChild2.calledOnce).to.equal(true);
                            expect(spyForAreYouThirdChildEventInChild3.calledOnce).to.equal(true);

                            const spyForAreYouFourthChildEventInChild1 = sinon.spy(function () {});
                            child1.subscribeToParents(ARE_YOU_THE_FOURTH_CHILD, function () { spyForAreYouFourthChildEventInChild1(); return NO; });
                            const spyForAreYouFourthChildEventInChild2 = sinon.spy(function () {});
                            child2.subscribeToParents(ARE_YOU_THE_FOURTH_CHILD, function () { spyForAreYouFourthChildEventInChild2(); return NO; });
                            const spyForAreYouFourthChildEventInChild3 = sinon.spy(function () {});
                            child3.subscribeToParents(ARE_YOU_THE_FOURTH_CHILD, function () { spyForAreYouFourthChildEventInChild3(); return NO; });
                            const replyFourth = parent.publishToChildrenUptoFirstUsefulReply(ARE_YOU_THE_FOURTH_CHILD, undefined, function condition(evt, reply) { return reply === YES; });
                            expect(replyFourth).to.equal(undefined);
                            expect(spyForAreYouFourthChildEventInChild1.calledOnce).to.equal(true);
                            expect(spyForAreYouFourthChildEventInChild2.calledOnce).to.equal(true);
                            expect(spyForAreYouFourthChildEventInChild3.calledOnce).to.equal(true);
                        }
                    );

                    describe('should be able to handle basic .publishToChildren() call', function () {
                        const
                            cmp = new Component(),
                            child1Cmp = new Component(),
                            child1Child1Cmp = new Component(),
                            child1Child1Child1Cmp = new Component(),
                            child1Child2Cmp = new Component(),
                            child1Child2Child1Cmp = new Component(),
                            child1Child3Cmp = new Component(),
                            child2Cmp = new Component();
                        cmp.append(child1Cmp);
                        child1Cmp.append(child1Child1Cmp);
                        child1Child1Cmp.append(child1Child1Child1Cmp);
                        child1Cmp.append(child1Child2Cmp);
                        child1Child2Cmp.append(child1Child2Child1Cmp);
                        child1Cmp.append(child1Child3Cmp);
                        cmp.append(child2Cmp);

                        const EVENT_WHO_ARE_YOU = 'EVENT_WHO_ARE_YOU';

                        const
                            I_AM_CHILD_1 = 'I_AM_CHILD_1',
                            I_AM_CHILD_1_CHILD_1 = 'I_AM_CHILD_1_CHILD_1',
                            I_AM_CHILD_1_CHILD_1_CHILD_1 = 'I_AM_CHILD_1_CHILD_1_CHILD_1',
                            I_AM_CHILD_1_CHILD_2 = 'I_AM_CHILD_1_CHILD_2',
                            I_AM_CHILD_1_CHILD_2_CHILD_1 = 'I_AM_CHILD_1_CHILD_2_CHILD1',
                            I_AM_CHILD_1_CHILD_3 = 'I_AM_CHILD_1_CHILD_3',
                            I_AM_CHILD_2 = 'I_AM_CHILD_2';

                        child1Cmp.subscribeToParents(EVENT_WHO_ARE_YOU, function () { return I_AM_CHILD_1; });
                        child1Child1Cmp.subscribeToParents(EVENT_WHO_ARE_YOU, function () { return I_AM_CHILD_1_CHILD_1; });
                        child1Child1Child1Cmp.subscribeToParents(EVENT_WHO_ARE_YOU, function () { return I_AM_CHILD_1_CHILD_1_CHILD_1; });
                        child1Child2Cmp.subscribeToParents(EVENT_WHO_ARE_YOU, function () { return I_AM_CHILD_1_CHILD_2; });
                        child1Child2Child1Cmp.subscribeToParents(EVENT_WHO_ARE_YOU, function () { return I_AM_CHILD_1_CHILD_2_CHILD_1; });
                        child1Child3Cmp.subscribeToParents(EVENT_WHO_ARE_YOU, function () { return I_AM_CHILD_1_CHILD_3; });
                        child2Cmp.subscribeToParents(EVENT_WHO_ARE_YOU, function () { return I_AM_CHILD_2; });

                        it(
                            'upto some replies',
                            function () {
                                const replies = cmp.publishToChildren(EVENT_WHO_ARE_YOU, undefined, function (evt, data) {
                                    if (
                                        data === I_AM_CHILD_1 ||
                                        data === I_AM_CHILD_1_CHILD_1 ||
                                        data === I_AM_CHILD_1_CHILD_1_CHILD_1 ||
                                        data === I_AM_CHILD_1_CHILD_2 ||
                                        data === I_AM_CHILD_1_CHILD_2_CHILD_1
                                    ) {
                                        return true;
                                    } else {
                                        return false;
                                    }
                                });

                                expect(replies).to.deep.equal([
                                    I_AM_CHILD_1,
                                    I_AM_CHILD_1_CHILD_1,
                                    I_AM_CHILD_1_CHILD_1_CHILD_1,
                                    I_AM_CHILD_1_CHILD_2,
                                    I_AM_CHILD_1_CHILD_2_CHILD_1
                                ]);
                            }
                        );

                        it(
                            'upto all replies',
                            function () {
                                const replies = cmp.publishToChildren(EVENT_WHO_ARE_YOU);

                                expect(replies).to.deep.equal([
                                    I_AM_CHILD_1,
                                    I_AM_CHILD_1_CHILD_1,
                                    I_AM_CHILD_1_CHILD_1_CHILD_1,
                                    I_AM_CHILD_1_CHILD_2,
                                    I_AM_CHILD_1_CHILD_2_CHILD_1,
                                    I_AM_CHILD_1_CHILD_3,
                                    I_AM_CHILD_2
                                ]);
                            }
                        );
                    });
                });
            });
        });

        describe('Prototype functions of Component called while testing', function () {
            const testOrSkip = checkForComponentClassFunctionsCalled ? it : it.skip;
            testOrSkip('should have called all of the Component class functions', function () {
                const functionsWhichWereNotCalled = [];
                functionsToSpy.forEach(function (functionToSpy) {
                    // https://stackoverflow.com/questions/47110047/sinon-js-spy-on-a-class-constructor-returns-false-even-though-the-constructor-i/47424550#47424550
                    // https://github.com/sinonjs/sinon/issues/831#issuecomment-209648966
                    if (functionToSpy === 'constructor') {
                        return;
                    }

                    if (Component.prototype[functionToSpy].called !== true) {
                        functionsWhichWereNotCalled.push(functionToSpy);
                    }
                });
                expect(functionsWhichWereNotCalled).to.deep.equal([]);
            });
        });
    });
});
