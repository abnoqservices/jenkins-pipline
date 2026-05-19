import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, X, SwitchCamera, Loader2, CheckCircle, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { scanCard } from "@/lib/api";
import axiosClient from "@/lib/axiosClient";
import ExtractedDataCard from "@/components/extracted-data/ExtractedDataCard";
import CardFieldSelection from "./CardFieldSelection";

interface ExtractedCardData {
  company_name: string | null;
  person_name: string | null;
  designation: string | null;
  phone_numbers: string[];
  email: string | null;
  website: string | null;
  full_address: string | null;
  city: string | null;
  pincode: string | null;
  social_handles: {
    linkedin: string | null;
    instagram: string | null;
    facebook: string | null;
    x: string | null;
    youtube: string | null;
    other: string | null;
  };
  industry_field?: string | null;
  remarks?: string | null;
}

interface CameraScannerProps {
  onCardScanned?: () => void;
}

const CameraScanner = ({ onCardScanned }: CameraScannerProps) => {
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'ready' | 'error'>('idle');
  const [isScanning, setIsScanning] = useState(false);
  const [cardData, setCardData] = useState<ExtractedCardData | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showFieldSelection, setShowFieldSelection] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Check for multiple cameras
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    }).catch(() => {});
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState('idle');
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState('starting');
    setErrorMessage('');

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported');
      }

      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error('Video element not found');

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.muted = true;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Camera timeout')), 10000);

        const onCanPlay = () => {
          clearTimeout(timeout);
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('error', onError);
          resolve();
        };

        const onError = (e: Event) => {
          clearTimeout(timeout);
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('error', onError);
          reject(new Error('Video playback error'));
        };

        video.addEventListener('canplay', onCanPlay);
        video.addEventListener('error', onError);

        if (video.readyState >= 3) {
          clearTimeout(timeout);
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('error', onError);
          resolve();
        }
      });

      await video.play();
      setCameraState('ready');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(message);
      setCameraState('error');

      toast({
        title: "Camera Error",
        description: message.includes('Permission') ? "Please allow camera access" : message,
        variant: "destructive",
      });
    }
  }, [facingMode, toast]);

  const switchCamera = useCallback(async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);

    if (cameraState === 'ready') {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  }, [facingMode, cameraState, stopCamera, startCamera]);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setCapturedImage(dataUrl);
        processImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const captureImage = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast({
        title: "Capture failed",
        description: "Camera not ready",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 1024;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > height) {
      if (width > maxSize) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      }
    } else if (height > maxSize) {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, 0, 0, width, height);

    const imageData = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(imageData);
    stopCamera();
    processImage(imageData);
  }, [stopCamera, toast]);

  const processImage = async (imageData: string) => {
    setIsScanning(true);

    try {
      const result = await scanCard(imageData);
      if (!result.success) {
        throw new Error(result.error || 'Scan failed');
      }

      setCardData(result.data!);
      setCardId(result.card_id || null);
      setSavedImageUrl(result.image_url || null);
      setShowFieldSelection(true);

      toast({
        title: "Card scanned!",
        description: "Please select industry & add remarks if needed",
      });
    } catch (error) {
      toast({
        title: "Scan failed",
        description: error instanceof Error ? error.message : "Failed to process card",
        variant: "destructive",
      });
      setCapturedImage(null);
    } finally {
      setIsScanning(false);
    }
  };

  const sendWhatsAppMessages = async (phoneNumbers: string[], personName: string | null) => {
    if (!phoneNumbers?.length) return;

    try {
      const { data } = await axiosClient.post('/api/send-whatsapp', {
        phoneNumbers,
        personName: personName || 'there'
      });

      toast({
        title: "WhatsApp sent",
        description: data.message || `Sent to ${phoneNumbers.length} number(s)`,
      });
    } catch (error: any) {
      toast({
        title: "WhatsApp failed",
        description: error.response?.data?.message || "Could not send messages",
        variant: "destructive",
      });
    }
  };

  const handleFieldSave = async (industryField: string | null, remarks: string | null) => {
    if (!cardId) return;

    try {
      await updateCard(cardId, { industry_field: industryField, remarks });
      setCardData(prev => prev ? { ...prev, industry_field: industryField, remarks } : prev);
      setShowFieldSelection(false);

      toast({ title: "Card saved!", description: "Details updated successfully" });

      if (cardData?.phone_numbers?.length) {
        sendWhatsAppMessages(cardData.phone_numbers, cardData.person_name);
      }

      onCardScanned?.();
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Could not update card details",
        variant: "destructive",
      });
    }
  };

  const handleFieldSkip = () => {
    setShowFieldSelection(false);

    toast({
      title: "Card saved!",
      description: "Saved without additional details",
    });

    if (cardData?.phone_numbers?.length) {
      sendWhatsAppMessages(cardData.phone_numbers, cardData.person_name);
    }

    onCardScanned?.();
  };

  const handleScanAnother = () => {
    setCardData(null);
    setCardId(null);
    setCapturedImage(null);
    setSavedImageUrl(null);
    setShowFieldSelection(false);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // ────────────────────────────────────────────────────────────────
  //                          RENDER
  // ────────────────────────────────────────────────────────────────

  if (showFieldSelection && cardData) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
        <ExtractedDataCard data={cardData} previewImage={savedImageUrl || capturedImage} />
      
      </div>
    );
  }

  if (cardData && !showFieldSelection) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <span className="font-medium">Card saved successfully!</span>
        </div>
        <ExtractedDataCard data={cardData} previewImage={savedImageUrl || capturedImage} />
        <div className="flex justify-center">
          <Button
            onClick={handleScanAnother}
            size="lg"
            className="px-8"
          >
            <Camera className="w-5 h-5 mr-2" />
            Scan Another Card
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageSelect(file);
          // Reset input so same file can be selected again
          e.target.value = '';
        }}
      />

      {cameraState === 'idle' && !capturedImage && !isScanning && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Card - Great for testing */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex flex-col items-center justify-center h-80 md:h-96 rounded-3xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/5 to-accent/5 cursor-pointer transition-all hover:border-primary hover:shadow-lg hover:scale-[1.01]"
          >
            <Upload className="w-16 h-16 text-primary/60 mb-6 group-hover:text-primary group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold mb-2">Upload Card Image</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs px-4">
              Perfect for testing • Any business card photo works
            </p>
          </div>

          {/* Open Camera */}
          <div
            onClick={startCamera}
            className="group relative flex flex-col items-center justify-center h-80 md:h-96 rounded-3xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-card to-accent/5 cursor-pointer transition-all hover:border-primary hover:shadow-lg hover:scale-[1.01]"
          >
            <Camera className="w-16 h-16 text-primary/70 mb-6 group-hover:text-primary group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold mb-2">Scan with Camera</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs px-4">
              Real-time scanning using device camera
            </p>
          </div>
        </div>
      )}

      {cameraState === 'error' && (
        <div className="flex flex-col items-center justify-center h-96 rounded-3xl border border-destructive/30 bg-destructive/5">
          <X className="w-16 h-16 text-destructive mb-6" />
          <h3 className="text-xl font-semibold mb-3 text-destructive">Camera Error</h3>
          <p className="text-muted-foreground text-center max-w-md mb-8 px-6">
            {errorMessage || "Could not access the camera"}
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setCameraState('idle')}>
              Back
            </Button>
            <Button onClick={startCamera}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {(cameraState === 'starting' || cameraState === 'ready') && (
        <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto min-h-[400px] max-h-[70vh] object-cover"
            style={{ display: cameraState === 'ready' ? 'block' : 'none' }}
          />

          {cameraState === 'starting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90">
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
              <p className="text-white font-medium">Starting camera...</p>
            </div>
          )}

          {cameraState === 'ready' && (
            <>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-8 border-2 border-white/60 rounded-2xl">
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
                </div>
              </div>

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={stopCamera}
                  className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
                >
                  <X className="h-7 w-7" />
                </Button>

                <Button
                  size="lg"
                  onClick={captureImage}
                  className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 shadow-xl transition-transform active:scale-95"
                >
                  <Camera className="h-10 w-10" />
                </Button>

                {hasMultipleCameras && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={switchCamera}
                    className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
                  >
                    <SwitchCamera className="h-7 w-7" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {isScanning && (
        <div className="flex flex-col items-center justify-center h-96 rounded-3xl bg-gradient-to-br from-primary/5 to-accent/5 border">
          <div className="relative mb-8">
            <Sparkles className="w-20 h-20 text-primary animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Processing Card</h3>
          <p className="text-muted-foreground">Extracting information with AI...</p>
        </div>
      )}
    </div>
  );
};

export default CameraScanner;