import axios from 'axios';

const boundary = '';
const VITE_IPFS_TOKEN = '';

export function pinFileToIPFS(file: any) {
  return new Promise((resolve, reject) => {
    const fileSizeInMb = file.size / (1024 * 1024);
    if (fileSizeInMb >= 1) reject(new Error('file max 1MB'));

    const formData = new FormData();
    formData.append('file', file);
    const pinataMetadata = JSON.stringify({
      name: 'File name'
    });
    formData.append('pinataMetadata', pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 0
    });
    formData.append('pinataOptions', pinataOptions);

    axios
      .post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          Authorization: `Bearer ${VITE_IPFS_TOKEN}`
        }
      })
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function uploadFile(file: any) {
  
}
