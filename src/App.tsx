import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import LoginForm from './components/LoginForm';
import Manager from './components/Manager';
import SplashScreen from './components/SplashScreen';

import './App.global.css';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/manager" component={Manager} />
        <Route path="/splash" component={SplashScreen} />
        <Route path="/" component={LoginForm} />
      </Switch>
    </Router>
  );
}
