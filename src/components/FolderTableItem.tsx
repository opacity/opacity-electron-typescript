import React from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import {
  AiFillFolder,
  AiOutlineDownload,
  AiOutlineDelete,
} from 'react-icons/ai';
import { FiEdit } from 'react-icons/fi';
import Styled from 'styled-components';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Moment from 'react-moment';

const Checkbox = Styled.input.attrs({
  type: 'checkbox',
})``;

type FolderTableItemProps = {
  folder: any;
  updatePath: any;
  downloadFunc: any;
  deleteFunc: any;
  renameFunc: any;
};

const FolderTableItem: React.FC<FolderTableItemProps> = ({
  folder,
  updatePath,
  deleteFunc,
  renameFunc,
  // changeCheckboxState,
}) => {
  return (
    <tr>
      <td>
        {/* <Checkbox
          checked={folder.checked}
          onChange={(t) => changeCheckboxState(t.target.checked, folder.handle)}
        /> */}
      </td>
      <td>
        <AiFillFolder />
      </td>
      <td>
        <Button variant="outline-info" onClick={() => updatePath(folder.name)}>
          {folder.name.slice(0, 64)}
        </Button>
      </td>
      <td>
        <Moment format="MMM Do YYYY">{new Date(folder.uploaded)}</Moment>
      </td>
      <td>{folder.size} items</td>
      <td>
        <ButtonGroup>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="rename_folder">Rename folder</Tooltip>}
          >
            <Button onClick={() => renameFunc(folder, true)}>
              <FiEdit />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="delete_folder">Delete folder</Tooltip>}
          >
            <Button onClick={() => deleteFunc(folder, false)}>
              <AiOutlineDelete></AiOutlineDelete>
            </Button>
          </OverlayTrigger>
        </ButtonGroup>
      </td>
    </tr>
  );
};

export default FolderTableItem;
