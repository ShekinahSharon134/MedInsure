// IPFS Upload Utility using Pinata
import axios from 'axios';

// ================================
// PINATA CONFIGURATION
// ================================
// Get your API keys from: https://app.pinata.cloud/
const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY || 'YOUR_PINATA_API_KEY';
const PINATA_SECRET_KEY = process.env.REACT_APP_PINATA_SECRET_KEY || 'YOUR_PINATA_SECRET_KEY';

// Pinata Gateway - Use your dedicated gateway subdomain
// Get it from: https://app.pinata.cloud/gateway
// Format: https://YOUR_GATEWAY_SUBDOMAIN.mypinata.cloud/ipfs/
const PINATA_GATEWAY = process.env.REACT_APP_PINATA_GATEWAY || 'https://rose-persistent-cephalopod-766.mypinata.cloud/ipfs/';

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

/**
 * Upload a file to IPFS via Pinata
 * @param {File} file - The file to upload
 * @param {string} fileName - Optional custom filename
 * @returns {Promise<{success: boolean, cid: string, url: string, error?: string}>}
 */
export const uploadToIPFS = async (file, fileName = null) => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    // Add metadata
    const metadata = JSON.stringify({
      name: fileName || file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size,
      }
    });
    formData.append('pinataMetadata', metadata);

    // Upload to Pinata
    const response = await axios.post(PINATA_API_URL, formData, {
      maxBodyLength: 'Infinity',
      headers: {
        'Content-Type': `multipart/form-data`,
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY,
      }
    });

    const cid = response.data.IpfsHash;
    const url = `${PINATA_GATEWAY}${cid}`;

    return {
      success: true,
      cid: cid,
      url: url,
    };

  } catch (error) {
    console.error('IPFS Upload Error:', error);
    return {
      success: false,
      cid: '',
      url: '',
      error: error.message || 'Failed to upload to IPFS',
    };
  }
};

/**
 * Upload multiple files to IPFS
 * @param {FileList|Array<File>} files - Array of files to upload
 * @returns {Promise<Array<{success: boolean, cid: string, url: string, fileName: string}>>}
 */
export const uploadMultipleToIPFS = async (files) => {
  const uploadPromises = Array.from(files).map(file => 
    uploadToIPFS(file).then(result => ({
      ...result,
      fileName: file.name,
    }))
  );

  return Promise.all(uploadPromises);
};

/**
 * Get IPFS URL from CID
 * @param {string} cid - IPFS CID
 * @returns {string} Full IPFS URL or null for dummy CIDs
 */
export const getIPFSUrl = (cid) => {
  if (!cid) return '';
  
  // Check if it's a dummy/test CID
  if (cid.startsWith('QmTest') || !cid.startsWith('Qm')) {
    return null; // Return null for dummy CIDs
  }
  
  return `${PINATA_GATEWAY}${cid}`;
};

/**
 * Check if CID is a real IPFS CID or a dummy one
 * @param {string} cid - IPFS CID
 * @returns {boolean} True if real CID, false if dummy
 */
export const isRealIPFSCID = (cid) => {
  if (!cid) return false;
  return cid.startsWith('Qm') && !cid.startsWith('QmTest');
};

/**
 * Upload JSON data to IPFS
 * @param {Object} data - JSON data to upload
 * @param {string} fileName - Optional filename
 * @returns {Promise<{success: boolean, cid: string, url: string, error?: string}>}
 */
export const uploadJSONToIPFS = async (data, fileName = 'data.json') => {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const file = new File([blob], fileName, { type: 'application/json' });
    return await uploadToIPFS(file, fileName);
  } catch (error) {
    console.error('JSON Upload Error:', error);
    return {
      success: false,
      cid: '',
      url: '',
      error: error.message || 'Failed to upload JSON to IPFS',
    };
  }
};

/**
 * Check if Pinata credentials are configured
 * @returns {boolean}
 */
export const isPinataConfigured = () => {
  return PINATA_API_KEY !== 'YOUR_PINATA_API_KEY' && 
         PINATA_SECRET_KEY !== 'YOUR_PINATA_SECRET_KEY' &&
         PINATA_API_KEY && 
         PINATA_SECRET_KEY;
};

export default {
  uploadToIPFS,
  uploadMultipleToIPFS,
  uploadJSONToIPFS,
  getIPFSUrl,
  isPinataConfigured,
};
