import { ipcRenderer } from 'electron';
// const { dialog } = require('electron').remote;
// const dialog = null;
import Path from 'path';
import streamsaver from 'streamsaver';
import { STORAGE_NODE as storageNode, STORAGE_NODE_V1 } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Card from 'react-bootstrap/Card';
import Swal from 'sweetalert2';
import Styled from 'styled-components';
// import * as Utils from './../../opacity/Utils';
import FileTableItem from './FileTableItem';
import FolderTableItem from './FolderTableItem';
// import DragAndDropzone from './DragAndDropzone';
import ActionButtons from './ActionButtons';
import {
  WebAccountMiddleware,
  WebNetworkMiddleware,
} from '../../ts-client-library/packages/middleware-web/src';
import { hexToBytes } from '../../ts-client-library/packages/util/src/hex';
// import { FileSystemObject } from '../../ts-client-library/packages/filesystem-access/src/filesystem-object';
import {
  AccountSystem,
  FileMetadata,
  FolderFileEntry,
  FolderMetadata,
  FoldersIndexEntry,
  MetadataAccess,
} from '../../ts-client-library/packages/account-system/src';
// import { Account } from '../../ts-client-library/packages/account-management/src';
import {
  OpaqueDownload,
  OpaqueUpload,
} from '../../ts-client-library/packages/opaque/src';
import {
  bindDownloadToAccountSystem,
  bindFileSystemObjectToAccountSystem,
  bindUploadToAccountSystem,
} from '../../ts-client-library/packages/filesystem-access/src/account-system-binding';
import {
  polyfillReadableStreamIfNeeded,
  polyfillWritableStreamIfNeeded,
} from '../../ts-client-library/packages/util/src/streams';
import { saveAs } from 'file-saver';
import * as fflate from 'fflate';
import { Mutex } from 'async-mutex';
import {
  UploadEvents,
  UploadProgressEvent,
} from '../../ts-client-library/packages/filesystem-access/src/events';
import { isPathChild } from '../../ts-client-library/packages/util/src/path';
import * as fs from 'fs';
import { FileSystemObject } from '../../ts-client-library/packages/filesystem-access/src/filesystem-object';

const Checkbox = Styled.input.attrs({
  type: 'checkbox',
})``;

const Manager = () => {
  const { dialog } = require('electron').remote;
  const { handle } = localStorage;
  const history = useHistory();
  const [folderPath, setFolderPath] = useState('/');
  //reference needed to use folderPath in useEffect
  const refFolderPath = useRef(folderPath);
  refFolderPath.current = folderPath;
  const [folders, setFolders] = useState(['All Files']);
  const [metadata, setMetadata] = useState(false);
  const [filesForZip, setFilesForZip] = useState([]);
  const [updateCurrentFolderSwitch, setUpdateCurrentFolderSwitch] = useState(
    false
  );

  const defaultSorts = {
    name: {
      show: false,
      ascending: true,
      icon: '',
    },
    size: {
      show: false,
      ascending: true,
      icon: '',
    },
    createdDate: {
      show: false,
      ascending: true,
      icon: '',
    },
    icons: {
      down: '▼',
      up: '▲',
    },
  };
  const [sorts, setSorts] = useState(JSON.parse(JSON.stringify(defaultSorts)));
  const [selectAllCheckbox, setSelectAllCheckbox] = useState(false);
  const [massButtons, setMassButtons] = useState(false);
  const [folderData, setFolderData] = useState<FolderMetadata[]>([]);
  const [fileData, setFileData] = useState<FileMetadata[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  // For deletion
  // const [fileToDelete, setFileToDelete] = useState<FolderFileEntry | null>();
  // const [
  //   folderToDelete,
  //   setFolderToDelete,
  // ] = useState<FoldersIndexEntry | null>();
  const [totalItemsToDelete, setTotalItemsToDelete] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const fileUploadMutex = React.useMemo(() => new Mutex(), []);
  const relativePath = React.useCallback(
    (path: string) => path.substr(0, path.lastIndexOf('/')),
    []
  );
  const cryptoMiddleware = React.useMemo(
    () =>
      new WebAccountMiddleware({
        asymmetricKey: hexToBytes(handle ? handle : ''),
      }),
    []
  );
  const netMiddleware = React.useMemo(() => new WebNetworkMiddleware(), []);
  const metadataAccess = React.useMemo(
    () =>
      new MetadataAccess({
        net: netMiddleware,
        crypto: cryptoMiddleware,
        metadataNode: storageNode,
      }),
    [netMiddleware, cryptoMiddleware, storageNode]
  );
  const accountSystem = React.useMemo(
    () => new AccountSystem({ metadataAccess }),
    [metadataAccess]
  );

  useEffect(() => {
    setTimeout(async () => {
      // const fileSystemObject = new FileSystemObject({
      //   handle: undefined,
      //   location: undefined,
      //   config: {
      //     net: netMiddleware,
      //     crypto: cryptoMiddleware,
      //     storageNode: storageNode,
      //   },
      // });
      // const metadataAccess = new MetadataAccess({
      //   net: netMiddleware,
      //   crypto: cryptoMiddleware,
      //   metadataNode: storageNode,
      // });
      // const accountSystem = new AccountSystem({ metadataAccess });
      // const account = new Account({
      //   crypto: cryptoMiddleware,
      //   net: netMiddleware,
      //   storageNode,
      // });

      Promise.all([
        accountSystem.getFoldersInFolderByPath(folderPath),
        folderPath == '/'
          ? accountSystem.addFolder(folderPath)
          : accountSystem.getFolderMetadataByPath(folderPath),
      ])
        .then(async ([folders, folderMeta]) => {
          console.log('folders:', folders);
          console.log('folderMeta:', folderMeta);

          Promise.all(
            folders.map((folder) => {
              return accountSystem
                ._getFolderMetadataByLocation(folder.location)
                .then((f) => {
                  return f;
                });
            })
          ).then((processedData) => {
            console.log('detailed folder data:', processedData);
            setFolderData(processedData);
          });

          Promise.all(
            folderMeta.files.map((file) =>
              accountSystem._getFileMetadata(file.location).then((f) => {
                return f;
              })
            )
          ).then((processedData) => {
            console.log('detailed file data:', processedData);
            setFileData(processedData);
          });
        })
        .catch((err) => {
          console.error(err);
        });
    }, 0);
  }, [folderPath, updateCurrentFolderSwitch]);

  useEffect(() => {
    const selectedFiles = fileData.filter((file) => file.checked);
    if (
      filesForZip?.length !== 0 &&
      filesForZip?.length === selectedFiles.length
    ) {
      let zipableFiles = {};
      filesForZip?.forEach((item) => {
        zipableFiles = Object.assign(zipableFiles, { [item.name]: item.data });
      });
      const zipped = fflate.zipSync(zipableFiles, {
        level: 0,
      });

      const blob = new Blob([zipped]);
      saveAs(blob, `opacity_files.zip`);
      setPageLoading(false);
    }
  }, [filesForZip]);

  const addNewFolder = React.useCallback(
    async (folderName) => {
      setPageLoading(true);
      try {
        accountSystem
          .addFolder(
            folderPath === '/'
              ? folderPath + folderName
              : folderPath + '/' + folderName
          )
          .then(() => {
            toast(`Folder ${folderName} was successfully created.`);
            setPageLoading(false);
            setUpdateCurrentFolderSwitch(!updateCurrentFolderSwitch);
          });
      } catch (e) {
        setPageLoading(false);
        toast.error(`An error occurred while creating new folder.`);
      }
    },
    [accountSystem, folderPath, updateCurrentFolderSwitch]
  );

  const fileDownload = React.useCallback(
    async (file: FileMetadata, isMultiple) => {
      if (file.private.handle) {
        console.log(file.private.handle, typeof file.private.handle);
        try {
          const d = new OpaqueDownload({
            handle: file.private.handle,
            config: {
              crypto: cryptoMiddleware,
              net: netMiddleware,
              storageNodeV1: STORAGE_NODE_V1,
              storageNode,
            },
            name: file.name,
            fileMeta: file,
          });

          // side effects
          bindDownloadToAccountSystem(accountSystem, d);

          const fileStream = polyfillWritableStreamIfNeeded<Uint8Array>(
            streamsaver.createWriteStream(file.name, {
              size: file.size,
            })
          );
          const s = await d.start();

          d.finish().then(() => {
            console.log('finish');
          });

          // more optimized
          if ('WritableStream' in window && s?.pipeTo && !isMultiple) {
            console.log('pipe');
            s.pipeTo(fileStream as WritableStream<Uint8Array>)
              .then(() => {
                setPageLoading(false);
                console.log('done');
              })
              .catch((err) => {
                console.log(err);
                throw err;
              });
          } else if (isMultiple && s?.getReader) {
            console.log('Multiple downloading');
            let blobArray = new Uint8Array([]);

            const reader = s?.getReader();
            const pump = () =>
              reader.read().then(({ done, value }) => {
                if (done) {
                  setFilesForZip((prev) => [
                    ...prev,
                    {
                      name: file.name,
                      type: file.type,
                      data: blobArray,
                    },
                  ]);
                } else {
                  blobArray = new Uint8Array([...blobArray, ...value]);
                  pump();
                }
              });
            pump();
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        console.error('Public download is not yet available');
      }
    },
    [cryptoMiddleware, netMiddleware, storageNode]
  );

  const uploadFile = React.useCallback(
    async (file: File, path: string) => {
      try {
        const upload = new OpaqueUpload({
          config: {
            crypto: cryptoMiddleware,
            net: netMiddleware,
            storageNode: storageNode,
          },
          meta: file,
          name: file.name,
          path: path,
        });
        let toastID = file.size + file.name;
        // side effects
        bindUploadToAccountSystem(accountSystem, upload);

        upload.addEventListener(UploadEvents.START, async () => {
          // console.log(currentPathRef.current, path);

          if (isPathChild(folderPath, path)) {
            // setPageLoading(true)
            // setUpdateCurrentFolderSwitch(!updateCurrentFolderSwitch)
          }

          if (path == folderPath) {
            // setPageLoading(true);
            // const folderMeta = await accountSystem.getFolderMetadataByPath(
            //   folderPath
            // );
            // Promise.all(
            //   folderMeta.files.map((file) =>
            //     accountSystem._getFileMetadata(file.location).then((f) => {
            //       return f;
            //     })
            //   )
            // ).then((processedData) => {
            //   console.log('detailed file data on Upload:', processedData);
            //   setFileData(processedData);
            //   setPageLoading(false);
            // });
          }
        });
        // upload.addEventListener(
        //   UploadEvents.PROGRESS,
        //   (e: UploadProgressEvent) => {
        // let templist = currentUploadingList.current.slice();
        // let index = templist.findIndex((ele) => ele.id === toastID);
        // if (index > -1) {
        //   templist[index].percent = e.detail.progress * 100;
        //   setUploadingList(templist);
        // }
        //   }
        // );

        const fileStream = polyfillReadableStreamIfNeeded<Uint8Array>(
          file.stream()
        );

        const release = await fileUploadMutex.acquire();
        try {
          const stream = await upload.start();
          console.log('uploading,,,,,,');

          if (stream) {
            // TODO: Why does it do this?
            fileStream.pipeThrough(
              (stream as TransformStream<Uint8Array, Uint8Array>) as any
            );
          } else {
          }
          await upload.finish();

          console.log('Upload: folder Path -----', folderPath, path);
          if (path === folderPath) {
            const folderMeta = await accountSystem.getFolderMetadataByPath(
              folderPath
            );
            Promise.all(
              folderMeta.files.map((file) =>
                accountSystem._getFileMetadata(file.location).then((f) => {
                  return f;
                })
              )
            ).then((processedData) => {
              console.log('detailed file data on Upload:', processedData);
              setFileData(processedData);
            });
          }

          // let templistdone = currentUploadingList.current.slice();
          // let index = templistdone.findIndex((ele) => ele.id === toastID);
          // if (index > -1) {
          //   templistdone[index].percent = 100;
          //   setUploadingList(templistdone);
          // }
        } finally {
          release();
        }
      } catch (e) {
        console.error(e);
      }
    },
    [
      accountSystem,
      cryptoMiddleware,
      folderPath,
      netMiddleware,
      storageNode,
      updateCurrentFolderSwitch,
    ]
  );

  const handleChangeRename = React.useCallback(
    async (rename, isFolder, location) => {
      setPageLoading(true);
      try {
        if (!isFolder) {
          const status = await accountSystem.renameFile(location, rename);
          toast(`${location} was renamed successfully.`);
        } else {
          const status = await accountSystem.renameFolder(location, rename);
          toast(`${location} was renamed successfully.`);
        }
        setUpdateCurrentFolderSwitch(!updateCurrentFolderSwitch);
      } catch (e) {
        console.error(e);
        toast.error(`An error occurred while rename ${rename}.`);
      } finally {
        // setFolderToRename(null);
        // setFileToRename(null);
      }
    },
    [accountSystem, updateCurrentFolderSwitch]
  );

  const pathGenerator = React.useCallback(
    (file) => {
      console.log(relativePath(file.webkitRelativePath));
      // return file.name === (file.path || file.webkitRelativePath || file.name)
      //   ? folderPath
      //   : folderPath === '/'
      //   ? file.webkitRelativePath
      //     ? folderPath + relativePath(file.webkitRelativePath)
      //     : relativePath(file.path)
      //   : file.webkitRelativePath
      //   ? folderPath + '/' + relativePath(file.webkitRelativePath)
      //   : folderPath + relativePath(file.path);

      return file.name === (file.path || file.webkitRelativePath || file.name)
        ? folderPath
        : folderPath === '/'
        ? file.webkitRelativePath
          ? folderPath + relativePath(file.webkitRelativePath)
          : folderPath
        : file.webkitRelativePath
        ? folderPath + '/' + relativePath(file.webkitRelativePath)
        : folderPath;
    },
    [folderPath]
  );

  const selectFiles = React.useCallback(
    async (files) => {
      // console.log('filePaths:', filePaths);

      // const files = filePaths.map((path: string) =>
      //   JSON.parse(fs.readFileSync(path, 'utf-8'))
      // );
      // let templist = currentUploadingList.current.slice();
      // isFileManaging();

      // files.forEach((file) => {
      //   let toastID = file.size + file.name;
      //   templist.push({ id: toastID, fileName: file.name, percent: 0 });
      // });
      // setUploadingList(templist);

      for (const file of files) {
        const path = pathGenerator(file);
        // console.log(path);
        await uploadFile(file, path);
      }

      setUpdateCurrentFolderSwitch(!updateCurrentFolderSwitch);
      // OnfinishFileManaging();
    },
    [folderPath, uploadFile]
  );

  const handleMultiDownload = async () => {
    setFilesForZip([]);
    setPageLoading(true);
    const selectedFiles = fileData.filter((file) => file.checked);
    for (const file of selectedFiles) {
      await fileDownload(file, selectedFiles.length > 1 ? true : false);
    }
  };

  /******  Start Logic for deletion   ******/
  const deleteFile = React.useCallback(
    async (file: FileMetadata) => {
      // isFileManaging();
      try {
        const fso = new FileSystemObject({
          handle: file.private.handle,
          location: undefined,
          config: {
            net: netMiddleware,
            crypto: cryptoMiddleware,
            storageNode: storageNode,
          },
        });
        bindFileSystemObjectToAccountSystem(accountSystem, fso);
        await fso.delete();
        // toast(`${file.name} was successfully deleted.`);
        // setFileToDelete(null);
      } catch (e) {
        await accountSystem.removeFile(file.location);
        // setFileToDelete(null);
        toast.error(`An error occurred while deleting ${file.name}.`);
      }
    },
    [accountSystem, updateCurrentFolderSwitch]
  );

  const deleteFolder = React.useCallback(
    async (folder: FoldersIndexEntry) => {
      try {
        const folders = await accountSystem.getFoldersInFolderByPath(
          folder.path
        );
        const folderMeta = await accountSystem.getFolderMetadataByPath(
          folder.path
        );

        for (const file of folderMeta.files) {
          const metaFile = await accountSystem.getFileIndexEntryByFileMetadataLocation(
            file.location
          );
          // await cancelPublicShare(metaFile);
          const fso = new FileSystemObject({
            handle: metaFile.private.handle,
            location: undefined,
            config: {
              net: netMiddleware,
              crypto: cryptoMiddleware,
              storageNode: storageNode,
            },
          });
          bindFileSystemObjectToAccountSystem(accountSystem, fso);
          await fso.delete();
          setCount((count) => count + 1);
        }

        for (const folderItem of folders) {
          await deleteFolder(folderItem);
        }

        await accountSystem.removeFolderByPath(folder.path);
      } catch (e) {
        console.error(e);
        // setFolderToDelete(null);
        toast.error(`An error occurred while deleting Folder ${folder.path}.`);
      }
    },
    [accountSystem, updateCurrentFolderSwitch]
  );

  const calculateTotalItems = async (folder: FoldersIndexEntry) => {
    try {
      const folders = await accountSystem.getFoldersInFolderByPath(folder.path);
      const folderMeta = await accountSystem.getFolderMetadataByPath(
        folder.path
      );

      let files = folderMeta.files?.length;

      if (!folders.length) return files;

      for (const folderItem of folders) {
        files += (await calculateTotalItems(folderItem))!;
      }

      return files;
    } catch (e) {
      console.error(e);
    }

    return 0;
  };

  // async function deleteFunc(handle: string | Uint8Array, name: string | null) {
  //   const { value: result } = await Swal.fire({
  //     title: 'Are you sure?',
  //     html: `You won't be able to revert this!<br/>Deleting: ${name}`,
  //     icon: 'warning',
  //     showCancelButton: true,
  //     confirmButtonColor: '#3085d6',
  //     cancelButtonColor: '#d33',
  //     confirmButtonText: 'Yes, delete it!',
  //   });

  //   if (result) {
  //     handleDelete();
  //     // ipcRenderer.send('files:delete', {
  //     //   folder: folderPath,
  //     //   files: [
  //     //     {
  //     //       handle: handle,
  //     //       name: name,
  //     //     },
  //     //   ],
  //     // });
  //     changeAllCheckboxState(false);
  //   }
  // }

  const handleDeleteItem = React.useCallback(
    async (item: FolderFileEntry | FoldersIndexEntry, isFile: boolean) => {
      console.log('isFile', isFile, item);
      let fileToDelete, folderToDelete;
      if (isFile) fileToDelete = item as FolderFileEntry;
      else folderToDelete = item as FoldersIndexEntry;
      // setShowDeleteModal(true);
      const { value: result } = await Swal.fire({
        title: 'Are you sure?',
        html: `You won't be able to revert this!<br/>Deleting: ${name}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
      });

      if (result) {
        handleDelete(fileToDelete, folderToDelete);
        changeAllCheckboxState(false);
      }
    },
    []
  );

  const handleDelete = async (fileToDelete: any, folderToDelete: any) => {
    console.log('Handle Delete', folderToDelete, fileToDelete);
    setPageLoading(true);
    // setShowDeleteModal(false);
    const selectedFiles = fileData.filter((file) => file.checked);

    if (selectedFiles.length === 0) {
      if (folderToDelete) {
        // isFileManaging();
        setTotalItemsToDelete(await calculateTotalItems(folderToDelete));
        setCount(0);
        await deleteFolder(folderToDelete);
        setUpdateCurrentFolderSwitch(!updateCurrentFolderSwitch);
        // setFolderToDelete(null);
        // OnfinishFileManaging();

        setCount(0);
        setTotalItemsToDelete(0);
      } else {
        await deleteFile(fileToDelete);
        // OnfinishFileManaging();
        setUpdateCurrentFolderSwitch(!updateCurrentFolderSwitch);
      }
    } else {
      for (const file of selectedFiles) {
        await deleteFile(file);
      }
      // OnfinishFileManaging();
      setUpdateCurrentFolderSwitch(!updateCurrentFolderSwitch);
      // setSelectedFiles([]);
    }
  };

  function changeAllCheckboxState(checked: boolean) {
    const copyMetadata = [...fileData];

    copyMetadata.forEach(function (file) {
      file.checked = checked;
    });

    if (checked) {
      setMassButtons(true);
      setSelectAllCheckbox(true);
    } else {
      setMassButtons(false);
      setSelectAllCheckbox(false);
    }
    setMetadata(copyMetadata);
  }

  function changeFileCheckboxState(checked: boolean, handle: Uint8Array) {
    const copyMetadata = [...fileData];
    copyMetadata.forEach(function (file) {
      if (JSON.stringify(file.private.handle) === JSON.stringify(handle)) {
        file.checked = checked;
      }
    });
    // const checkedFolders = copyMetadata.folders.find(
    //   (folder) => folder.checked
    // );
    const checkedFiles = copyMetadata.find((file) => file.checked);
    if (checkedFiles) {
      setMassButtons(true);
    } else {
      setMassButtons(false);
    }
    setFileData(copyMetadata);
  }

  function updatePath(newPath: string) {
    const updatedPath = Path.join(folderPath, newPath);
    setFolderPath(updatedPath);
    // ipcRenderer.send('path:update', updatedPath);
    setFolders([...folders, newPath]);
  }

  function goBackTo(buttonIndex: number) {
    const newPath = folders.slice(0, buttonIndex + 1);
    setFolders(newPath);
    let traversedPath = [...newPath];
    traversedPath[0] = '/';
    setFolderPath(Path.join(...traversedPath));
  }

  async function downloadFunc(item) {
    fileDownload(item, false);
  }

  async function renameFunc(item: any, isFolder: Boolean) {
    const { value: newName } = await Swal.fire({
      title: 'Enter the a new name',
      input: 'text',
      inputValue: item.name,
      showCancelButton: true,
      inputValidator: (value) => {
        if (value === item.name) {
          return 'You need to set a new name!';
        }
        if (!value) {
          return 'Specify a name!';
        }
      },
    });

    if (newName) {
      console.log('Path ----', item.path, item.location);

      handleChangeRename(
        newName,
        isFolder,
        isFolder ? item.path : item.location
      ).then(() =>
        Swal.fire('', `Renamed ${item.name} into ${newName}`, 'success')
      );
      // ipcRenderer.send('file:rename', {
      //   folder: folderPath,
      //   item,
      //   newName: newName,
      // });
    }
  }

  async function sortName() {
    const copyMetadata = JSON.parse(JSON.stringify(metadata));

    copyMetadata.folders.sort(function (folderA, folderB) {
      return sorts.name.ascending
        ? ('' + folderA.name).localeCompare(folderB.name)
        : ('' + folderB.name).localeCompare(folderA.name);
    });

    copyMetadata.files.sort(function (fileA, fileB) {
      return sorts.name.ascending
        ? ('' + fileA.name).localeCompare(fileB.name)
        : ('' + fileB.name).localeCompare(fileA.name);
    });

    sorts.name.ascending = !sorts.name.ascending;
    sorts.name.show = true;
    sorts.name.icon = sorts.name.ascending ? sorts.icons.down : sorts.icons.up;
    sorts.size = defaultSorts.size;
    sorts.createdDate = defaultSorts.createdDate;
    setSorts(sorts);
    setMetadata(copyMetadata);
  }

  async function sortSize() {
    const copyMetadata = JSON.parse(JSON.stringify(metadata));

    copyMetadata.files.sort(function (fileA: any, fileB: any) {
      return sorts.size.ascending
        ? fileA.versions[0].size - fileB.versions[0].size
        : fileB.versions[0].size - fileA.versions[0].size;
    });

    sorts.size.ascending = !sorts.size.ascending;
    sorts.size.show = true;
    sorts.size.icon = sorts.size.ascending ? sorts.icons.down : sorts.icons.up;
    sorts.name = defaultSorts.name;
    sorts.createdDate = defaultSorts.createdDate;
    setSorts(sorts);
    setMetadata(copyMetadata);
  }

  async function sortCreated() {
    const copyMetadata = JSON.parse(JSON.stringify(metadata));

    copyMetadata.files.sort(function (fileA, fileB) {
      return sorts.createdDate.ascending
        ? fileA.created - fileB.created
        : fileB.created - fileA.created;
    });

    sorts.createdDate.ascending = !sorts.createdDate.ascending;
    sorts.createdDate.show = true;
    sorts.createdDate.icon = sorts.createdDate.ascending
      ? sorts.icons.down
      : sorts.icons.up;
    sorts.name = defaultSorts.name;
    sorts.size = defaultSorts.size;
    setSorts(sorts);
    setMetadata(copyMetadata);
  }

  return (
    // <DragAndDropzone folderPath={folderPath}>
    <Container fluid>
      <ButtonToolbar
        className="justify-content-between"
        aria-label="Toolbar with Button groups"
      >
        <ButtonGroup>
          {folders.map((folder, index) => {
            //if (folders.length - 1 != index) {
            return (
              <Card key={index}>
                <Button onClick={() => goBackTo(index)}>{folder}</Button>
              </Card>
            );
            //}
          })}
        </ButtonGroup>
        <ActionButtons
          metadata={metadata}
          folderPath={folderPath}
          massButtons={massButtons}
          downloadFunc={handleMultiDownload}
          uploadFunc={selectFiles}
          addFolder={addNewFolder}
          deleteFunc={() => handleDelete(null, null)}
          changeAllCheckboxState={changeAllCheckboxState}
        ></ActionButtons>
      </ButtonToolbar>
      <Table size="sm">
        <thead>
          <tr>
            <th>
              <Checkbox
                checked={selectAllCheckbox}
                onChange={(t) => changeAllCheckboxState(t.target.checked)}
              />
            </th>
            <th></th>
            <th>
              <Button variant="outline-secondary" onClick={sortName}>
                Name
                {sorts.name.show ? ' ' + sorts.name.icon : ''}
              </Button>
            </th>
            <th>
              <Button variant="outline-secondary" onClick={sortCreated}>
                Created
                {sorts.createdDate.show ? ' ' + sorts.createdDate.icon : ''}
              </Button>
            </th>
            <th>
              <Button variant="outline-secondary" onClick={sortSize}>
                Size
                {sorts.size.show ? ' ' + sorts.size.icon : ''}
              </Button>
            </th>
            <th style={{ fontWeight: 500 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {folderData &&
            folderData.map((folder, index) => {
              return (
                <FolderTableItem
                  key={index}
                  folder={folder}
                  updatePath={updatePath}
                  downloadFunc={downloadFunc}
                  deleteFunc={handleDeleteItem}
                  renameFunc={renameFunc}
                />
              );
            })}
          {fileData &&
            fileData.map((file, index) => {
              return (
                <FileTableItem
                  key={index}
                  file={file}
                  deleteFunc={handleDeleteItem}
                  downloadFunc={downloadFunc}
                  renameFunc={renameFunc}
                  changeCheckboxState={changeFileCheckboxState}
                />
              );
            })}
        </tbody>
      </Table>
      {(() => {
        if (fileData.length === 0 && folderData.length === 0)
          return (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 'bold', opacity: 0.8 }}>
                There are no items in this folder
              </p>
              <p>
                Drag files and folders here to upload, or click the upload
                button on the top right to browse files from your computer.
              </p>
            </div>
          );
      })()}
    </Container>
    // </DragAndDropzone>
  );
};

export default Manager;
