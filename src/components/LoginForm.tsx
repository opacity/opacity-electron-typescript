import React, { useState, useEffect, FormEvent } from 'react';
import { Container, Form, Button, Card } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { hexToBytes } from '../../ts-client-library/packages/util/src/hex';
import {
  WebAccountMiddleware,
  WebNetworkMiddleware,
} from '../../ts-client-library/packages/middleware-web/src';
import { Account } from '../../ts-client-library/packages/account-management/src';
import { STORAGE_NODE as storageNode } from '../config';

import logo from '../../assets/logo2.png';
import '../styles/login.scss';

const LoginForm = () => {
  const history = useHistory();
  const [handle, setHandle] = useState('');
  const [save, setSave] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const autoLogin = localStorage.getItem('autoLogin');

    if (autoLogin !== 'enabled') return;

    const restoredHandle = localStorage.getItem('handle');

    if (!!restoredHandle) {
      setHandle(restoredHandle);
      login(restoredHandle);
    }
  }, []);

  const login = (handle: string) => {
    try {
      if (handle.length !== 128) {
        throw Error('Account handle must be 128 characters long.');
      }

      const cryptoMiddleware = new WebAccountMiddleware({
        asymmetricKey: hexToBytes(handle),
      });
      const netMiddleware = new WebNetworkMiddleware();
      const account = new Account({
        crypto: cryptoMiddleware,
        net: netMiddleware,
        storageNode,
      });
      account
        .info()
        .then((acc) => {
          if (acc.account.apiVersion !== 2) {
            console.log('This handle is old. Please Upgrade it.');
            return;
          }
          if (acc.paymentStatus === 'paid') {
            localStorage.setItem('handle', handle);
            localStorage.setItem('autoLogin', save ? 'enabled' : '');
            history.push('/manager');
          }
        })
        .catch(() => {
          const account = new Account({
            crypto: cryptoMiddleware,
            net: netMiddleware,
            storageNode: storageNode,
          });
          account
            .needsMigration()
            .then((res) => {
              if (res) {
                console.log('This handle is old. Please Upgrade it.');
                return;
              }
            })
            .catch((error: Error) => {
              setErrorMessage(error.message);
            });
        });
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    login(handle);
  };

  return (
    <Container className="login-container">
      <div className="login-bg"></div>

      <Card border="primary" className="shadow-lg">
        <Card.Body>
          <div className="logo">
            <img src={logo} className="logo" />
          </div>

          <Form onSubmit={onSubmit}>
            <Form.Group controlId="formHandle">
              <Form.Control
                type="password"
                placeholder="Enter your handle here"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="mb-2"
                autoFocus
              />

              <Form.Check
                type="checkbox"
                label="Auto Login"
                checked={save}
                onChange={(e) => setSave(e.target.checked)}
                className="mb-2"
              />
            </Form.Group>

            {(() => {
              return (
                errorMessage && (
                  <div style={{ textAlign: 'center', color: 'red' }}>
                    <p>{errorMessage}</p>
                  </div>
                )
              );
            })()}

            <div className="submit">
              <Button variant="primary" type="submit" size="lg">
                Sign In
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default LoginForm;
