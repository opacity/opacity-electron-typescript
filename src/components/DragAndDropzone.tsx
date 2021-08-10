import { ipcRenderer } from 'electron';
import React, { ReactNodeArray } from 'react';

type DragAndDropzoneProps = {
  children: ReactNodeArray;
  folderPath: any;
};
/*
  Handles all the dropped files/folders into the application.
  Gets the path of the files and sends them to the main thread to upload them.
*/
const DragAndDropzone: React.FC<DragAndDropzoneProps> = ({
  children,
  folderPath,
}) => {
  // From here
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragIn = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragOut = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  // till here these functions are needed to initialize,
  // otherwise the dropzone isn't functional

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = [];

    e?.dataTransfer?.files.forEach((file) => files.push(file.path));

    ipcRenderer.send('files:upload', {
      folder: folderPath,
      files: files,
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        padding: 0,
        margin: 0,
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
      }}
      className={'drag-drop-zone'}
      onDrop={(e) => handleDrop(e)}
      onDragOver={(e) => handleDrag(e)}
      onDragEnter={(e) => handleDragIn(e)}
      onDragLeave={(e) => handleDragOut(e)}
    >
      {children}
    </div>
  );
};

export default DragAndDropzone;
