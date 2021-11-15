import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';

import firstSplashImage from '../../assets/splash1.svg';
import secondSplashImage from '../../assets/splash2.svg';
import thirdSplashImage from '../../assets/splash3.svg';
import getStartedImage from '../../assets/splash4.png';
import logo from '../../assets/logo2.png';
import '../styles/splash_screen.scss';
import { AiOutlineArrowLeft, AiOutlineArrowRight } from 'react-icons/ai';

const electron = require('electron');

const SplashScreen = () => {
  const history = useHistory();
  const [currentPage, setCurrentPage] = useState(0);

  const onNext = () => {
    if (currentPage < 3) {
      setCurrentPage(currentPage + 1);
    } else {
      history.push('/manager');
    }
  };

  const headings = [
    'Anonymous File Storage',
    'One Handle To Access Your Account',
    'Encrypted At Rest Share Only What You Want',
    "Let's Get Started!",
  ];

  const descriptions = [
    `Get access to file storage without needing to give us any sensitive information like name, phone number or email.`,
    'Easy sign up and sign in process. Get started in seconds.',
    'We keep your data safe and secure while giving you granular controls over what you want to share and when.',
    'Upload files or folder by clicking the upload button, or drag & drop from your device to get started.',
  ];

  let { isFirstTime } = electron.remote.getGlobal('shared');

  if (!isFirstTime) {
    onNext();

    return null;
  }

  return (
    <div className="splash-page">
      <h1>{headings[currentPage]}</h1>

      <p>{descriptions[currentPage]}</p>

      <div className="d-flex justify-content-center splash-image-container">
        {currentPage === 0 && (
          <img src={firstSplashImage} className="splash-image" />
        )}

        {currentPage === 1 && (
          <img src={secondSplashImage} className="splash-image" />
        )}

        {currentPage === 2 && (
          <img src={thirdSplashImage} className="splash-image" />
        )}

        {currentPage === 3 && (
          <img src={getStartedImage} className="splash-image" />
        )}
      </div>

      <div className="button-container px-5 pb-2">
        <div>
          <img src={logo} width={70} className="mb-4" />
        </div>

        <div className="d-flex align-items-center">
          {currentPage !== 0 && (
            <div className="d-flex align-items-center me-2">
              <Button
                className="d-flex align-items-center"
                disabled={currentPage === 0}
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <AiOutlineArrowLeft />
                <span className="ms-2">Back</span>
              </Button>
            </div>
          )}

          <div className="d-flex align-items-center">
            <Button
              className="d-flex align-items-center"
              size="sm"
              onClick={onNext}
            >
              {currentPage < 3 && (
                <>
                  <span>Next</span>
                  <AiOutlineArrowRight className="ms-2" />
                </>
              )}

              {currentPage === 3 && 'Get Started'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
