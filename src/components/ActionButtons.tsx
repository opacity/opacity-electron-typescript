import { ipcRenderer } from 'electron';
import React, { useState, useRef, ReactNode } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Card from 'react-bootstrap/Card';
import Swal from 'sweetalert2';
import { FILE_MAX_SIZE } from '../config';

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
      console.log(files[0]);
      files = files.filter((file) => file.size <= FILE_MAX_SIZE);
      onSelected(files);
    }
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
  const { dialog } = require('electron').remote;
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
  const directory = {
    directory: '',
    webkitDirectory: '',
    mozkitdirectory: '',
  };

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
      Swal.fire('', `Created folder: ${folderName}`, 'success');
      addFolder(folderName);
    }
  }

  function uploadButton(isFolder = false) {
    const currentRef = isFolder ? uploadFolderInput : uploadFileInput;
    setIsDirectory(isFolder);
    currentRef.current!.click();

    // selectFiles();
    // const files = dialog.showOpenDialog({
    //   properties: [isFolder ? 'openDirectory' : 'openFile', 'multiSelections'],
    // });
    // .then((result) => {
    //   if (!result.canceled) {
    //     uploadFunc(result.filePaths);
    //     // ipcRenderer.send('files:upload', {
    //     //   folder: folderPath,
    //     //   files: result.filePaths,
    //     // });
    //   }
    // })
    // .catch((err) => {
    //   console.log(err);
    // });
  }

  const selectFiles = () => {
    const currentRef = isDirectory ? uploadFolderInput : uploadFileInput;
    let files = Array.from(currentRef.current!.files || []);
    // uploadFileInput.current!.reset();
    currentRef.current!.value = '';
    if (files.length > 0) {
      files = files.filter((file) => file.size <= FILE_MAX_SIZE);
      // files.length !== filesLength && setShowWarningModal(true);
      uploadFunc(files);
    }
  };

  return (
    <ButtonGroup>
      <Card>
        <Button disabled={!massButtons} onClick={() => downloadFunc()}>
          Download
        </Button>
      </Card>
      {/* <Card>
        {cutButton.cut ? (
          <Button disabled={!massButtons} onClick={() => cutAndPaste()}>
            Move
          </Button>
        ) : (
          <ButtonGroup>
            <Button
              disabled={cutButton.folder === folderPath}
              onClick={() => cutAndPaste()}
            >
              Paste
            </Button>
            <Button onClick={() => cutAndPaste(false)}>Cancel</Button>
          </ButtonGroup>
        )}
      </Card> */}
      <Card className="mr-1">
        <Button disabled={!massButtons} onClick={() => deleteSelected()}>
          Delete
        </Button>
      </Card>
      <Card className="mr-1">
        <Button onClick={() => newFolder()}>Create Folder</Button>
      </Card>
      <Card>
        <UploadForm
          isDirectory={true}
          onSelected={(files) => uploadFunc(files)}
        >
          <Button>Upload Folder</Button>
        </UploadForm>
      </Card>
      <Card>
        <UploadForm
          isDirectory={false}
          onSelected={(files) => uploadFunc(files)}
        >
          <Button>Upload Files</Button>
        </UploadForm>
      </Card>
    </ButtonGroup>
  );
};

export default ActionButtons;
