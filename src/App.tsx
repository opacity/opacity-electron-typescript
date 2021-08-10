import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import icon from '../assets/icon.svg';

import LoginForm from './components/LoginForm';
import Manager from './components/Manager';

import './App.global.css';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/manager" component={Manager} />
        <Route path="/" component={LoginForm} />
      </Switch>
    </Router>
  );
}
