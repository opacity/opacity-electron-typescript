import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';

import firstSplashImage from '../../assets/splash1.png';
import secondSplashImage from '../../assets/splash2.png';
import logo from '../../assets/logo2.png';
import '../styles/splash_screen.scss';
import { AiOutlineArrowLeft, AiOutlineArrowRight } from 'react-icons/ai';

const SplashScreen = () => {
  const history = useHistory();
  const [currentPage, setCurrentPage] = useState(0);

  const onNext = () => {
    if (currentPage === 0) {
      setCurrentPage(1);
    } else {
      history.push('/manager');
    }
  };

  const headings = ['Welcome To Opacity Drive!', "Let's Get Started!"];

  const descriptions = [
    `Opacity uses state-of-the-art encryption algorithms to ensure that your
    files are secure. The Opacity platform encrypts your files at rest to
    provide comprehensive protection for your files. As long as you protect
    your Opacity Handle, your data is safe.`,
    'Upload files or folder by clicking the upload button, or drag & drop from your device to get started.',
  ];

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
      </div>

      <div className="button-container px-2 pb-2">
        <div>
          <img src={logo} width={70} />
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
              {currentPage === 0 && (
                <>
                  <span>Next</span>
                  <AiOutlineArrowRight className="ms-2" />
                </>
              )}

              {currentPage === 1 && 'Get Started'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
