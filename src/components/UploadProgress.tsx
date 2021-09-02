import React, { useState } from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { CircularProgressbar } from 'react-circular-progressbar';
import { ProgressItem } from '../interfaces';

import 'react-circular-progressbar/dist/styles.css';
import '../styles/upload_progress.scss';

interface Props {
  list?: ProgressItem[] | null;
  clearList: () => void;
}

const UploadProgress: React.FC<Props> = ({ list, clearList = () => {} }) => {
  const [minimize, setMinimize] = useState(false);

  list = [
    ...list,
    {
      id: 'test',
      fileName:
        'reallylongggggggggggggggggglongggggggggggggggggglongggggggggggggggggglongggggggggggggggggglonggggggggggggggggggfilename.jpg',
      percent: 0,
    },
  ];
  if (!list || !list.length) return null;

  const completed = list.filter((item) => item.percent === 100)?.length;

  return (
    <Card className={`upload-progress-card ${minimize && 'minimize'}`}>
      <Card.Header>
        {completed === list.length
          ? 'Completed'
          : `Uploading ${list.length - completed} items`}
        <div>
          <span
            className="icon-down"
            onClick={() => setMinimize(!minimize)}
          ></span>

          <span
            className={`icon-close ${list.length !== completed && 'disabled'}`}
            onClick={() => list.length === completed && clearList()}
          ></span>
        </div>
      </Card.Header>

      <div className="upload-progress-body">
        <ListGroup variant="flush">
          {list?.map(({ id, fileName, percent }) => (
            <ListGroup.Item key={id}>
              <div className="text-ellipsis">{fileName}</div>

              <div className="percent">
                <CircularProgressbar value={percent} strokeWidth={20} />
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>
    </Card>
  );
};

export default UploadProgress;
