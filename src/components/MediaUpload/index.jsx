import React, { useState } from "react";
import { storage, db } from "../../config"; // Apna config path verify kar lena
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button, Box, LinearProgress, Typography, Card, Stack } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const MediaUpload = ({ userId = "guest_user" }) => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [downloadURL, setDownloadURL] = useState("");

  const onFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const startUpload = () => {
    if (!file) return;

    // Firebase Storage mein file ka unique path
    const fileRef = ref(storage, "gsoc-media/$userId/${Date.now()}_${file.name}");
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
      },
      (err) => {
        console.error("Upload Error:", err);
        alert("Upload failed! Check Firebase permissions.");
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setDownloadURL(url);
        
        // Firestore mein metadata save karna
        try {
          await addDoc(collection(db, "media_metadata"), {
            uid: userId,
            url: url,
            fileName: file.name,
            uploadedAt: serverTimestamp()
          });
          setProgress(0);
          setFile(null);
        } catch (dbError) {
          console.error("Firestore Error: ", dbError);
        }
      }
    );
  };

  return (
    <Card sx={{ p: 3, mt: 2, borderRadius: 4, border: '1px solid #e5e7eb', bgcolor: '#ffffff' }}>
      <Stack spacing={2}>
        <Typography variant="h6" fontWeight={700} color="primary">
          Task 3: Media Upload (Firebase)
        </Typography>
        
        <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} sx={{ borderStyle: 'dashed', py: 2 }}>
          Select Media
          <input type="file" hidden onChange={onFileChange} />
        </Button>

        {file && <Typography variant="body2" sx={{ bgcolor: '#f3f4f6', p: 1, borderRadius: 1 }}>📄 {file.name}</Typography>}

        {progress > 0 && (
          <Box sx={{ width: '100%' }}>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
            <Typography variant="caption">{Math.round(progress)}% Uploading...</Typography>
          </Box>
        )}

        <Button variant="contained" onClick={startUpload} disabled={!file || progress > 0} sx={{ py: 1.5, fontWeight: 'bold' }}>
          Upload to Cloud
        </Button>

        {downloadURL && (
          <Box sx={{ mt: 1, p: 2, bgcolor: '#ecfdf5', borderRadius: 2, border: '1px solid #10b981' }}>
            <Typography variant="caption" color="success.main" fontWeight="bold">✅ File URL:</Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              <a href={downloadURL} target="_blank" rel="noreferrer">{downloadURL}</a>
            </Typography>
          </Box>
        )}
      </Stack>
    </Card>
  );
};

export default MediaUpload;
