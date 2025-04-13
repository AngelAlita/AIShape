import { useState, useEffect, useRef } from 'react';
import { useCameraPermissions } from 'expo-camera';

export const useCamera = () => {
  const cameraRef = useRef<any>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionResponse, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permissionResponse?.granted) {
      requestPermission();
    } else {
      setHasPermission(true);
    }
  }, [permissionResponse]);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        qualityPrioritization: 'quality',
        skipMetadata: false,
      });
      return photo;
    }
  };

  return { hasPermission, cameraRef, takePicture };
};
