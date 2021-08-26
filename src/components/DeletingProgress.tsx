import React from 'react';
import { Card, ProgressBar } from 'react-bootstrap';

import '../styles/delete_progress.scss';

interface Props {
  total: number;
  done: number;
  onClose?: () => void;
}

const DeletingProgress: React.FC<Props> = ({
  total = 1,
  done = 0,
  onClose = () => {},
}) => {
  if (!total) return null;

  const progress = total ? (done / total) * 100 : 0;

  return (
    <Card className="delete_progress">
      <Card.Body>
        <div className="header">
          <h6>
            {progress >= 100
              ? 'Completed'
              : `Deleting ${progress.toFixed(1)}% ...`}
          </h6>

          {progress >= 100 && (
            <span className="icon-close" onClick={() => onClose()}></span>
          )}
        </div>

        <ProgressBar animated={progress < 100} now={progress} />
      </Card.Body>
    </Card>
  );
};

export default DeletingProgress;
