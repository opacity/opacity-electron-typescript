import { ipcRenderer } from 'electron';
import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { OverlayTrigger, Tooltip, Button, ButtonGroup } from 'react-bootstrap';

import {
  AiFillFolderAdd,
  AiFillQuestionCircle,
  AiOutlineCloudUpload,
  AiOutlineDelete,
  AiOutlineDownload,
  //AiOutlineSelect,
  AiOutlineUpload,
} from 'react-icons/ai';

import { FiCheck, FiLogOut } from 'react-icons/fi';
import { useHistory } from 'react-router-dom';
import Swal from 'sweetalert2';

const shell = require('electron').shell;
const app = require('electron').remote.app;

type UploadFormProps = {
  children: ReactNode | ReactNode[] | null;
  onSelected: (_: any) => void;
  isDirectory: Boolean;
};

const UploadForm: React.FC<UploadFormProps> = ({
  children,
  onSelected,
  isDirectory,
}) => {
  const uploadFileInput = useRef<HTMLInputElement>(null);
  const uploadForm = useRef<HTMLFormElement>(null);

  const directory = {
    directory: '',
    webkitdirectory: '',
    mozkitdirectory: '',
  };

  const selectFiles = () => {
    let files = Array.from(uploadFileInput.current!.files || []);
    uploadForm.current!.reset();
    if (files.length > 0) {
      // files = files.filter((file) => file.size <= FILE_MAX_SIZE);
      onSelected(files);
    }
    console.log(files);
  };

  return (
    <div onClick={() => uploadFileInput.current!.click()}>
      {children}
      <form ref={uploadForm} style={{ display: 'none' }}>
        <input
          type="file"
          id="file"
          ref={uploadFileInput}
          onChange={() => selectFiles()}
          multiple={true}
          {...(isDirectory && { ...directory })}
        />
      </form>
    </div>
  );
};

const ActionButtons = ({
  addFolder,
  metadata,
  folderPath,
  massButtons,
  downloadFunc = (_?: any) => {},
  uploadFunc = (_?: any) => {},
  deleteFunc = (_?: any) => {},
  changeAllCheckboxState,
}) => {
  const history = useHistory();
  const defaultCutButton = {
    cut: true,
    files: [],
    folder: '',
  };
  const [cutButton, setCutButton] = useState(
    JSON.parse(JSON.stringify(defaultCutButton))
  );
  const uploadFileInput = useRef(null);
  const uploadFolderInput = useRef(null);
  const [isDirectory, setIsDirectory] = useState(false);
  const buttonRef = useRef(null);

  async function cutAndPaste(paste = true) {
    if (cutButton.cut) {
      const filesToMove = [];
      metadata.folders.map((folder) => {
        if (folder.checked) {
          filesToMove.push({ handle: folder.handle, name: folder.name });
        }
      });
      metadata.files.map((file) => {
        if (file.checked) {
          filesToMove.push({
            handle: file.versions[0].handle,
            name: file.name,
          });
        }
      });
      setCutButton({ cut: false, folder: folderPath, files: filesToMove });
      changeAllCheckboxState(false);
    } else {
      if (paste && cutButton.folder !== folderPath) {
        ipcRenderer.send('files:move', {
          fromFolder: cutButton.folder,
          files: cutButton.files,
          toFolder: folderPath,
        });
      } else if (!paste) {
        console.log('Moving cancelled');
      } else if (cutButton.folder === folderPath) {
        console.log('Tried to drop into the origin folder');
      }
      setCutButton(JSON.parse(JSON.stringify(defaultCutButton)));
    }
  }

  async function deleteSelected() {
    // const checkedFolders = metadata.folders.filter((folder) => folder.checked);
    // const checkedFiles = metadata.files.filter((file) => file.checked);
    const { value: result } = await Swal.fire({
      title: 'Are you sure?',
      html: `You won't be able to revert this!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result) {
      deleteFunc();
      // const toDelete = [];
      // checkedFolders.map((folder) =>
      //   toDelete.push({
      //     handle: folder.handle,
      //     name: folder.name,
      //   })
      // );
      // checkedFiles.map((file) =>
      //   toDelete.push({
      //     handle: file.versions[0].handle,
      //     name: file.name,
      //   })
      // );
      // ipcRenderer.send('files:delete', { folder: folderPath, files: toDelete });
      // changeAllCheckboxState(false);
    }
  }

  async function newFolder() {
    const { value: folderName } = await Swal.fire({
      title: 'Enter the folder name',
      input: 'text',
      showCancelButton: true,
      cancelButtonColor: '#dd3333',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to write something!';
        }
      },
    });
    if (folderName) {
      Swal.fire(`Folder ${folderName} was successfully created.`, 'success');
      addFolder(folderName);
    }
  }

  function uploadButton(isFolder = false) {
    const currentRef = isFolder ? uploadFolderInput : uploadFileInput;
    setIsDirectory(isFolder);
    currentRef.current!.click();
  }

  const handleLogout = () => {
    window.localStorage.removeItem('handle');
    window.localStorage.removeItem('autoLogin');
    history.push('/');
  };

  const selectFiles = () => {
    const currentRef = isDirectory ? uploadFolderInput : uploadFileInput;
    let files = Array.from(currentRef.current!.files || []);
    // uploadFileInput.current!.reset();
    currentRef.current!.value = '';
    if (files.length > 0) {
      // files = files.filter((file) => file.size <= FILE_MAX_SIZE);
      // files.length !== filesLength && setShowWarningModal(true);
      uploadFunc(files);
    }
  };

  //menu item calling part
  useEffect(() => {
    ipcRenderer.on('new-folder', () => {
      newFolder();
    });
  }, []);

  useEffect(() => {
    ipcRenderer.on('upload-folder', () => {
      console.log('Uploadfolder called');
    });
  }, []);

  useEffect(() => {
    ipcRenderer.on('upload-file', () => {
      console.log('UploadFile called');
    });
  }, []);

  useEffect(() => {
    ipcRenderer.on('about-panel', () => {
      app.setAboutPanelOptions({
        applicationName: 'Opacity desktop app',
        applicationVersion: '2.0.0',
        version: 'Opacity Drive 0.1.3',
        copyright: 'Copyright 2018-2022 Opacity',
        iconPath: '../../icon.svg',
      });
      app.showAboutPanel();
    });
  }, []);

  useEffect(() => {
    ipcRenderer.on('download-file', () => {
      buttonRef.current.click();
      console.log('Download func called.');
    });
  }, []);

  useEffect(() => {
    ipcRenderer.on('logout-app', () => {
      handleLogout();
    });
  }, []);

  return (
    <ButtonGroup className="action-buttons">
      {!!massButtons && (
        <>
          <div className="selected">
            <FiCheck size={24} />
            <span className="ms-2">{massButtons} File(s) Selected</span>
          </div>

          <Button
            disabled={!massButtons}
            onClick={() => downloadFunc()}
            className="ms-5"
            ref={buttonRef}
          >
            <AiOutlineDownload size={24} />
            &nbsp;Download
          </Button>

          <Button disabled={!massButtons} onClick={() => deleteSelected()}>
            <AiOutlineDelete size={24} />
            &nbsp;Delete
          </Button>
        </>
      )}

      {!massButtons && (
        <>
          <Button onClick={() => newFolder()}>
            <AiFillFolderAdd size={24} />
            &nbsp;New Folder
          </Button>
          <UploadForm
            isDirectory={true}
            onSelected={(files) => uploadFunc(files)}
          >
            <Button>
              <AiOutlineCloudUpload size={24} />
              &nbsp; Upload Folder
            </Button>
          </UploadForm>
          <UploadForm
            isDirectory={false}
            onSelected={(files) => uploadFunc(files)}
          >
            <Button>
              <AiOutlineUpload size={24} />
              &nbsp; Upload Files
            </Button>
          </UploadForm>
        </>
      )}

      <OverlayTrigger
        key="bottom-help-center"
        placement="bottom"
        overlay={<Tooltip id="help-center">Help Center</Tooltip>}
      >
        <Button
          onClick={() => shell.openExternal('https://help.opacity.io')}
          className="ms-3"
        >
          <AiFillQuestionCircle size={24} />
        </Button>
      </OverlayTrigger>

      <OverlayTrigger
        key="bottom-sign-out"
        placement="bottom"
        overlay={<Tooltip id="sign-out">Sign Out</Tooltip>}
      >
        <Button onClick={() => handleLogout()} className="">
          <FiLogOut size={24} />
        </Button>
      </OverlayTrigger>
    </ButtonGroup>
  );
};

export default ActionButtons;
