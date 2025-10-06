import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/auth/Header';
import PageTransition from '@/components/PageTransition';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import CameraCapture from '@/components/face-registration/CameraCapture';
import verificationService from '@/api/services/verificationService';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

const VerifyIdentityPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const cameraRef = useRef(null);

  const [pendingUser, setPendingUser] = useState(null);
  const [verifyToken, setVerifyToken] = useState('');
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState('initial'); // initial | scanning | processing | done | error
  const [error, setError] = useState('');
  const [imageData, setImageData] = useState('');

  useEffect(() => {
    try {
      const vt = sessionStorage.getItem('verify_token') || '';
      const pu = sessionStorage.getItem('pending_user');
      setVerifyToken(vt);
      setPendingUser(pu ? JSON.parse(pu) : null);
    } catch {}
  }, []);

  const startCapture = async () => {
    setError('');
    setImageData('');
    if (!consent) {
      setError('Please provide consent to proceed.');
      return;
    }
    setStep('scanning');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      const video = cameraRef.current?.getVideoRef();
      if (video) video.srcObject = stream;
      // give camera a moment to initialize
      await new Promise((r) => setTimeout(r, 1000));
      const shot = cameraRef.current?.captureImage(0);
      stream.getTracks().forEach((t) => t.stop());
      if (!shot?.data) throw new Error('Failed to capture image');
      setImageData(shot.data);
      setStep('processing');
      const res = await verificationService.uploadHeadshot({
        verifyToken,
        imageData: shot.data,
        consent: true,
      });
      if (res?.success) {
        setStep('done');
        toast({
          title: 'Verification submitted',
          description: 'Your request is pending admin review.',
        });
      } else {
        throw new Error(res?.message || 'Upload failed');
      }
    } catch (e) {
      setStep('error');
      setError(e?.message || 'Could not complete verification.');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Header />
        <div className="flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl space-y-6">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </Link>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-primary" /> Verify Your
                  Identity
                </CardTitle>
                <CardDescription>
                  For security, we need a headshot to complete access approval.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    We will collect a photo of your face to verify your
                    identity. This is only used for manual approval by an
                    administrator.
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Purpose: account verification only</li>
                    <li>Access: authorized admin reviewers</li>
                    <li>Storage: securely in private storage</li>
                    <li>Retention: deleted after review per policy</li>
                  </ul>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="consent"
                    checked={consent}
                    onCheckedChange={(v) => setConsent(Boolean(v))}
                  />
                  <label htmlFor="consent" className="text-sm">
                    I consent to the collection and processing of my photo for
                    verification.
                  </label>
                </div>

                <div className="relative">
                  <CameraCapture
                    ref={cameraRef}
                    step={
                      step === 'initial'
                        ? 'initial'
                        : step === 'scanning'
                          ? 'scanning'
                          : step === 'processing'
                            ? 'processing'
                            : 'initial'
                    }
                    currentPosition={{
                      instruction: 'Look straight at the camera',
                    }}
                    capturedImages={imageData ? [{ data: imageData }] : []}
                    capturePositions={[{ name: 'Center' }]}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/login')}
                    disabled={step === 'processing'}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={startCapture}
                    disabled={!consent || step === 'processing'}
                  >
                    {step === 'processing' ? 'Submitting…' : 'Capture & Submit'}
                  </Button>
                </div>

                {step === 'done' && (
                  <div className="text-sm text-center text-muted-foreground">
                    Your submission has been received. You will be notified
                    after approval. You can close this page.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default VerifyIdentityPage;
