import React from 'react';
import Moment from 'react-moment';
import Filesize from 'filesize';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Swal from 'sweetalert2';
import * as Clipboardy from 'clipboardy';
import {
  AiOutlineFile,
  AiOutlineDownload,
  AiOutlineDelete,
  AiOutlineShareAlt,
} from 'react-icons/ai';
import { FiEdit } from 'react-icons/fi';
import Styled from 'styled-components';

const Checkbox = Styled.input.attrs({
  type: 'checkbox',
})``;

const FileTableItem = ({
  file,
  deleteFunc,
  downloadFunc,
  renameFunc,
  changeCheckboxState,
}) => {
  const shareClick = (handle: string) => {
    Clipboardy.write('https://opacity.io/share#handle=' + handle);
    Swal.fire('', 'Copied the link to your clipboard!', 'success');
  };

  return (
    <tr>
      <td>
        <Checkbox
          checked={file.checked}
          onChange={(t) =>
            changeCheckboxState(t.target.checked, file.private.handle)
          }
        />
      </td>
      <td>
        <AiOutlineFile />
      </td>
      <td>{file.name.slice(0, 64)}</td>
      <td>
        <Moment format="MMM Do YYYY">{new Date(file.uploaded)}</Moment>
      </td>
      <td>{Filesize(file.size)}</td>
      <td>
        <ButtonGroup>
          {/* <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="share_file">Share file</Tooltip>}
          >
            <Button onClick={() => shareClick(file.versions[0].handle)}>
              <AiOutlineShareAlt />
            </Button>
          </OverlayTrigger> */}
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="download_file">Download file</Tooltip>}
          >
            <Button onClick={() => downloadFunc(file)}>
              <AiOutlineDownload />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="rename_file">Rename file</Tooltip>}
          >
            <Button onClick={() => renameFunc(file, false)}>
              <FiEdit />
            </Button>
          </OverlayTrigger>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="delete_file">Delete file</Tooltip>}
          >
            <Button onClick={() => deleteFunc(file, true)}>
              <AiOutlineDelete />
            </Button>
          </OverlayTrigger>
        </ButtonGroup>
      </td>
    </tr>
  );
};

export default FileTableItem;
