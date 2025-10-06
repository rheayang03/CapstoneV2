import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Scan,
  Camera,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import Header from '@/components/auth/Header';
import PageTransition from '@/components/PageTransition';

const FaceScanPage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const { loginWithFace } = useAuth();

  const startFaceScan = async () => {
    try {
      setIsScanning(true);
      setError('');
      setScanResult(null);

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Wait a moment for camera auto-exposure then capture a frame
      setTimeout(async () => {
        try {
          const canvas = document.createElement('canvas');
          const video = videoRef.current;
          if (!video) throw new Error('Camera not ready');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

          // Stop camera as soon as we have a frame
          stream.getTracks().forEach((track) => track.stop());

          // Send to backend for face login
          const res = await loginWithFace(dataUrl, { remember: true });
          if (res?.success && res?.token) {
            setScanResult('success');
            navigate('/');
          } else if (res?.pending) {
            setScanResult('success');
            navigate('/verify');
          } else {
            setScanResult('failed');
          }
        } catch (e) {
          setScanResult('failed');
        } finally {
          setIsScanning(false);
        }
      }, 1200);
    } catch (err) {
      setError(
        'Unable to access camera. Please ensure camera permissions are granted.'
      );
      setIsScanning(false);
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setError('');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Header />

        <div className="flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-6">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Scan className="w-6 h-6 text-primary" />
                  Face Scan Login
                </CardTitle>
                <CardDescription>
                  Use your face to securely log into your account
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Camera viewport */}
                <div className="relative">
                  <div className="w-full h-64 bg-muted rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-border">
                    {!isScanning && !scanResult && (
                      <div className="text-center text-muted-foreground">
                        <Camera className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">Camera will appear here</p>
                      </div>
                    )}

                    {isScanning && (
                      <div className="relative w-full h-full">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 border-4 border-primary rounded-lg animate-pulse" />
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                          <div className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
                            <div className="flex items-center gap-2 text-sm">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Scanning...
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {scanResult === 'success' && (
                      <div className="text-center text-green-600">
                        <CheckCircle className="w-16 h-16 mx-auto mb-2" />
                        <p className="font-medium">Face recognized!</p>
                        <p className="text-sm text-muted-foreground">
                          Logging you in...
                        </p>
                      </div>
                    )}

                    {scanResult === 'failed' && (
                      <div className="text-center text-destructive">
                        <XCircle className="w-16 h-16 mx-auto mb-2" />
                        <p className="font-medium">
                          {error || 'Face not recognized'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {error
                            ? 'Update settings then try again'
                            : 'Please try again'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Instructions */}
                {!isScanning && !scanResult && (
                  <div className="text-center text-sm text-muted-foreground space-y-2">
                    <p>• Position your face in the center of the frame</p>
                    <p>• Ensure good lighting</p>
                    <p>• Look directly at the camera</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-3">
                  {!isScanning && !scanResult && (
                    <Button
                      onClick={startFaceScan}
                      className="w-full"
                      size="lg"
                    >
                      <Scan className="w-4 h-4 mr-2" />
                      Start Face Scan
                    </Button>
                  )}

                  {scanResult === 'failed' && (
                    <Button
                      onClick={resetScan}
                      className="w-full"
                      variant="outline"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  )}

                  {error && (
                    <Button
                      onClick={resetScan}
                      className="w-full"
                      variant="outline"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  )}
                </div>

                {/* Alternative login */}
                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Use password instead
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Security note */}
            <div className="text-center text-xs text-muted-foreground">
              <p>Only a privacy-preserving face template is stored securely.</p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default FaceScanPage;
