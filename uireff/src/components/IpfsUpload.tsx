import React, { useState } from 'react';
import { create } from 'ipfs-http-client';

const IpfsUpload = () => {
  const [file, setFile] = useState(null);
  const [ipfsHash, setIpfsHash] = useState('');

  const client = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
  });

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (file) {
      try {
        const added = await client.add(file);
        setIpfsHash(added.path);
      } catch (error) {
        console.error('Error uploading file: ', error);
      }
    }
  };

  return (
    <div className="ipfs-upload">
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload to IPFS</button>
      {ipfsHash && (
        <p>IPFS Hash: <a href={`https://ipfs.io/ipfs/${ipfsHash}`} target="_blank" rel="noopener noreferrer">{ipfsHash}</a></p>
      )}
    </div>
  );
};

export default IpfsUpload;
