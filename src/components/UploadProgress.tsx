import React, { useState } from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { CircularProgressbar } from 'react-circular-progressbar';
import { ProgressItem } from '../interfaces';

import 'react-circular-progressbar/dist/styles.css';
import '../styles/upload_progress.scss';

interface Props {
  list?: ProgressItem[] | null;
  clearList: () => void;
  onCancel: Function;
  onCancelAll: Function;
}

interface ItemProps {
  item?: ProgressItem | null;
  onCancel: Function;
}

const UploadProgressItem: React.FC<ItemProps> = ({
  item = null,
  onCancel = () => {},
}) => {
  const [hoverCancel, setHoverCancel] = useState(false);

  const iconRender = () => {
    switch (item?.status) {
      case 'active':
      case 'uploading':
        return (
          <div
            onMouseEnter={() => setHoverCancel(true)}
            onMouseLeave={() => setHoverCancel(false)}
          >
            {hoverCancel ? (
              <i className="icon-cancel" onClick={() => onCancel(item)}></i>
            ) : (
              <CircularProgressbar value={item?.percent} strokeWidth={20} />
            )}
          </div>
        );
      case 'cancelled':
        return <i className="icon-warning"></i>;
      case 'completed':
        return <i className="icon-completed"></i>;
      default:
        break;
    }
  };

  return (
    <ListGroup.Item key={item?.id}>
      <div className="text-ellipsis">{item?.fileName}</div>

      <div className="percent">{iconRender()}</div>
    </ListGroup.Item>
  );
};

const UploadProgress: React.FC<Props> = ({
  list,
  clearList = () => {},
  onCancel = () => {},
  onCancelAll = () => {},
}) => {
  const [minimize, setMinimize] = useState(false);

  if (!list || !list.length) return null;

  const completed = list.filter((item) => item.percent === 100)?.length;

  return (
    <Card className={`upload-progress-card ${minimize && 'minimize'}`}>
      <Card.Header>
        {completed === list.length
          ? 'Completed'
          : `Uploading ${list.length - completed} item${
              list.length - completed > 1 ? 's' : ''
            }`}
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
        {completed !== list.length && (
          <div className="subheader">
            <div>Uploading</div>

            <div className="cancel-button" onClick={() => onCancelAll()}>
              CANCEL
            </div>
          </div>
        )}

        <ListGroup variant="flush">
          {list?.map((item: ProgressItem) => (
            <UploadProgressItem
              item={item}
              onCancel={onCancel}
              key={item.id}
            ></UploadProgressItem>
          ))}
        </ListGroup>
      </div>
    </Card>
  );
};

export default UploadProgress;
