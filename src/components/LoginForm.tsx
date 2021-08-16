import React, { useState, useEffect, FormEvent } from 'react';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useHistory } from 'react-router-dom';
import { hexToBytes } from '../../ts-client-library/packages/util/src/hex';
import {
  WebAccountMiddleware,
  WebNetworkMiddleware,
} from '../../ts-client-library/packages/middleware-web/src';
import { Account } from '../../ts-client-library/packages/account-management/src';
import { STORAGE_NODE as storageNode } from '../config';

const LoginForm = () => {
  const history = useHistory();
  const [handle, setHandle] = useState('');
  const [save, setSave] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const restoredHandle = localStorage.getItem('handle');
    if (!!restoredHandle) {
      setHandle(restoredHandle);
      login(restoredHandle);
    }
  }, []);

  const login = (handle: string) => {
    try {
      if (handle.length !== 128) {
        throw Error("Then handle doesn't have the right length of 128 signs.");
      }

      console.log('HANDLE SET', handle);

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
          console.log('ACC:', acc.paymentStatus);
          if (acc.account.apiVersion !== 2) {
            console.log('This handle is old. Please Upgrade it.');
            return;
          }
          if (acc.paymentStatus === 'paid') {
            localStorage.setItem('handle', handle);
            // mainWindow?.webContents.send('login:success');
            console.log('Success');
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
    // ipcRenderer.send('handle:set', { handle: handle, saveHandle: save });
  };

  return (
    <Container>
      <Form onSubmit={onSubmit}>
        <Form.Group controlId="formHandle">
          <Form.Label>Account Handle</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter your handle here"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
          <Form.Check
            type="checkbox"
            label="Save handle"
            checked={save}
            onChange={(e) => setSave(e.target.checked)}
          />
        </Form.Group>
        {(() => {
          return (
            errorMessage && (
              <div style={{ textAlign: 'center', color: 'red' }}>
                <p style={{ fontWeight: 'bold', opacity: 0.8 }}>
                  Make sure you enter your handle correctly!
                </p>
                <p>{errorMessage}</p>
              </div>
            )
          );
        })()}
        <Button variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </Container>
  );
};

export default LoginForm;
