import { Component } from './scripts/libs/kins/kins.js';

import Todos from './Components/TodoMVC/Todos/Todos.js';
import App from './scripts/app.js';

const todos = new Todos();

const app = new App(document.getElementById('kins-demo-app'));
app.append(todos);

// const todos2 = new Todos();
// app.append(todos2);

// Helpful for debugging
window.dev = {};
window.dev.Component = Component;
window.dev.app = app;
app.profile();
app.logEvents();
