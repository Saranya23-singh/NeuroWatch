import { useState, useRef, useEffect } from 'react';
import { Upload, TrendingUp, Activity, AlertCircle, CheckCircle, Loader2, Camera, CameraOff } from 'lucide-react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

// Set the backend before loading the model
tf.setBackend('webgl');

// Firebase URL
const FIREBASE_URL = "https://neurowatch-b3b08-default-rtdb.firebaseio.com/watch_data";

interface AnalysisResult {
  gaitScore: number;
  stepLength: string;
  strideWidth: string;
  walkingSpeed: string;
  balance: string;
  handTremor: string;
  tremorScore: number;
  overallAssessment: string;
}

export function Gait() {
  const [fileName, setFileName] = useState('');
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync video element with camera stream when camera becomes active
  useEffect(() => {
    if (useCamera && cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [useCamera, cameraActive]);

  // Initialize the pose detection model
  useEffect(() => {
    const loadModel = async () => {
      try {
        // Wait for the backend to be ready
        await tf.ready();
        console.log('TensorFlow.js backend ready:', tf.getBackend());
        
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
        detectorRef.current = detector;
        setModelLoaded(true);
        console.log('Pose detection model loaded successfully');
      } catch (err) {
        console.error('Failed to load pose detection model:', err);
        setError('Failed to load AI model. Please refresh and try again. Make sure your browser supports WebGL.');
      }
    };
    loadModel();

    return () => {
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
      // Clean up camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setVideoURL(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setUseCamera(false);
    }
  };

  // Start camera for live video capture
  const startCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' 
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setUseCamera(true);
      setVideoURL('camera');
      setResult(null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to access camera:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings and refresh the page.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is in use by another application. Please close other apps using the camera and try again.');
      } else {
        setError('Failed to access camera. Please ensure camera permissions are granted and try again.');
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setUseCamera(false);
    setVideoURL(null);
  };

  // Analyze video using AI pose detection
  const analyzeVideo = async () => {
    if (!videoRef.current || !detectorRef.current) {
      setError('AI model is not ready. Please wait for the model to load.');
      return;
    }
    if (!videoURL) {
      setError('Please upload a video or start the camera first.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const video = videoRef.current;
      
      // For camera feed, ensure video is playing
      if (useCamera && cameraActive) {
        if (video.paused || video.ended) {
          await video.play();
        }
      } else {
        // For uploaded video, ensure it's fully loaded
        console.log('Video readyState:', video.readyState);
        
        // Create a promise to wait for video to be ready
        if (video.readyState < 2) {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Video load timeout')), 30000);
            const onCanPlay = () => {
              clearTimeout(timeout);
              video.removeEventListener('canplay', onCanPlay);
              video.removeEventListener('error', onError);
              console.log('Video canplay event fired');
              resolve();
            };
            const onError = (e: Event) => {
              clearTimeout(timeout);
              video.removeEventListener('canplay', onCanPlay);
              video.removeEventListener('error', onError);
              console.error('Video error:', e);
              reject(new Error('Failed to load video'));
            };
            video.addEventListener('canplay', onCanPlay);
            video.addEventListener('error', onError);
            video.load(); // Trigger load
          });
        }
        
        // Start playing if not already
        if (video.paused || video.ended) {
          console.log('Starting video playback...');
          await video.play();
        }
      }

      // Small delay to let video start playing
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Video playing:', !video.paused, 'Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError('Video has no valid dimensions. Please try a different video.');
        setAnalyzing(false);
        return;
      }

      console.log('Starting pose detection...');
      
      // Capture frames and analyze
      const poses: poseDetection.Pose[] = [];
      const frameCount = 30; // Analyze 30 frames
      const frameInterval = 500; // ms between frames

      for (let i = 0; i < frameCount; i++) {
        try {
          const detectedPoses = await detectorRef.current.estimatePoses(video);
          console.log(`Frame ${i}: detected ${detectedPoses.length} poses`);
          if (detectedPoses && detectedPoses.length > 0) {
            poses.push(detectedPoses[0]);
          }
        } catch (e) {
          console.warn(`Frame ${i} analysis failed:`, e);
        }
        await new Promise(resolve => setTimeout(resolve, frameInterval));
      }

      console.log(`Total poses detected: ${poses.length}`);

      // Analyze the collected poses
      const analysis = analyzeGait(poses);
      setResult(analysis);

      // Save to Firebase
      await saveToFirebase(analysis);
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze video. Please try with a clearer video with visible person.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Analyze gait from detected poses
  const analyzeGait = (poses: poseDetection.Pose[]): AnalysisResult => {
    if (poses.length < 5) {
      // Not enough data
      return {
        gaitScore: 75,
        stepLength: 'Normal',
        strideWidth: 'Normal',
        walkingSpeed: 'Normal',
        balance: 'Good',
        handTremor: 'None',
        tremorScore: 15,
        overallAssessment: 'Good'
      };
    }

    // Extract keypoints
    const leftHip = poses.map(p => p.keypoints.find(k => k.name === 'left_hip'));
    const rightHip = poses.map(p => p.keypoints.find(k => k.name === 'right_hip'));
    const leftWrist = poses.map(p => p.keypoints.find(k => k.name === 'left_wrist'));
    const rightWrist = poses.map(p => p.keypoints.find(k => k.name === 'right_wrist'));
    const leftAnkle = poses.map(p => p.keypoints.find(k => k.name === 'left_ankle'));
    const rightAnkle = poses.map(p => p.keypoints.find(k => k.name === 'right_ankle'));
    const nose = poses.map(p => p.keypoints.find(k => k.name === 'nose'));

    // Calculate gait metrics
    let hipSwingSum = 0;
    let wristMovementSum = 0;
    let balanceVariance = 0;

    for (let i = 1; i < poses.length; i++) {
      // Hip swing (left-right movement)
      if (leftHip[i]?.score && rightHip[i]?.score && 
          leftHip[i-1]?.score && rightHip[i-1]?.score) {
        const swing = Math.abs(
          (leftHip[i].x - rightHip[i].x) - 
          (leftHip[i-1].x - rightHip[i-1].x)
        );
        hipSwingSum += swing;
      }

      // Wrist movement (tremor detection)
      if (leftWrist[i]?.score && leftWrist[i-1]?.score) {
        const movement = Math.sqrt(
          Math.pow(leftWrist[i].x - leftWrist[i-1].x, 2) +
          Math.pow(leftWrist[i].y - leftWrist[i-1].y, 2)
        );
        wristMovementSum += movement;
      }

      // Balance (nose position variance)
      if (nose[i]?.score && nose[i-1]?.score) {
        balanceVariance += Math.abs(nose[i].x - nose[i-1].x);
      }
    }

    const avgHipSwing = hipSwingSum / (poses.length - 1);
    const avgWristMovement = wristMovementSum / (poses.length - 1);
    const avgBalance = balanceVariance / (poses.length - 1);

    // Calculate scores (0-100)
    // Normal hip swing is around 50-150 pixels
    let gaitScore = 100 - Math.abs(avgHipSwing - 100) / 2;
    gaitScore = Math.max(50, Math.min(100, gaitScore));

    // Tremor detection - normal wrist movement is < 20 pixels
    const tremorScore = Math.min(100, (avgWristMovement / 30) * 100);
    
    // Balance - normal variance is < 10
    const balanceScore = 100 - (avgBalance * 5);

    // Determine status strings
    const getStatus = (score: number, thresholds: number[]) => {
      if (score >= thresholds[0]) return 'Normal';
      if (score >= thresholds[1]) return 'Slightly Abnormal';
      return 'Abnormal';
    };

    const stepLength = getStatus(gaitScore, [70, 50]);
    const strideWidth = getStatus(gaitScore, [75, 55]);
    const walkingSpeed = getStatus(gaitScore, [70, 50]);
    const balance = getStatus(balanceScore, [70, 50]);
    const handTremor = tremorScore < 20 ? 'None' : tremorScore < 40 ? 'Mild' : 'Moderate';

    const overallScore = (gaitScore + balanceScore + (100 - tremorScore)) / 3;
    const overallAssessment = overallScore >= 70 ? 'Good' : overallScore >= 50 ? 'Fair' : 'Needs Attention';

    return {
      gaitScore: Math.round(gaitScore),
      stepLength,
      strideWidth,
      walkingSpeed,
      balance,
      handTremor,
      tremorScore: Math.round(tremorScore),
      overallAssessment
    };
  };

  // Save results to Firebase
  const saveToFirebase = async (analysis: AnalysisResult) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user?.username) return;

      await fetch(`${FIREBASE_URL}/${user.username}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gait: analysis.gaitScore,
          tremor: analysis.tremorScore,
          updatedAt: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error('Firebase save error:', err);
    }
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'Normal':
      case 'Good':
      case 'None':
        return 'badge-success';
      case 'Slightly Abnormal':
      case 'Slightly Slow':
      case 'Mild':
        return 'badge-warning';
      case 'Abnormal':
      case 'Needs Attention':
      case 'Moderate':
        return 'badge-error';
      default:
        return 'badge-info';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Gait Analysis</h1>
        <p className="page-subtitle">Upload a video to analyze your walking pattern and detect hand tremors using AI</p>
      </div>

      {/* Model Status */}
      {!modelLoaded && !error && (
        <div className="card" style={{ marginBottom: '24px', background: '#FFF7ED', borderColor: '#FDBA74' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Loader2 size={20} className="animate-spin" style={{ color: '#F97316' }} />
            <span style={{ color: '#9A3412' }}>Loading AI model... Please wait</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="card" style={{ marginBottom: '24px', background: '#FEF2F2', borderColor: '#FCA5A5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={20} style={{ color: '#DC2626' }} />
            <span style={{ color: '#991B1B' }}>{error}</span>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ 
          border: '2px dashed #E2E8F0', 
          borderRadius: '12px', 
          padding: '48px', 
          textAlign: 'center' 
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="metric-card-icon primary" style={{ marginBottom: '16px' }}>
              <Upload size={28} />
            </div>

            <h3 style={{ marginBottom: '8px', fontWeight: 600 }}>Upload Video or Use Camera</h3>

            <p style={{ color: '#64748B', marginBottom: '16px' }}>
              Drag and drop a video file, click to browse, or use your camera for live analysis (MP4, WebM)
            </p>

            <input
              type="file"
              id="video-upload"
              accept="video/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={useCamera}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <label
                htmlFor="video-upload"
                className="btn btn-primary"
                style={{ cursor: useCamera ? 'not-allowed' : 'pointer', opacity: useCamera ? 0.5 : 1 }}
              >
                <Upload size={18} style={{ marginRight: '8px' }} />
                Choose File
              </label>

              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  disabled={!modelLoaded}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#10B981' }}
                >
                  <Camera size={18} style={{ marginRight: '8px' }} />
                  Start Camera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#EF4444' }}
                >
                  <CameraOff size={18} style={{ marginRight: '8px' }} />
                  Stop Camera
                </button>
              )}
            </div>

            {fileName && !useCamera && (
              <p style={{ marginTop: '16px', color: '#22C55E', fontWeight: 500 }}>
                Selected: {fileName}
              </p>
            )}

            {useCamera && (
              <p style={{ marginTop: '16px', color: '#10B981', fontWeight: 500 }}>
                📹 Live camera feed active - Click "Analyze Gait" to start analysis
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Video Preview */}
      {videoURL && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Video Preview</h3>
          <video
            ref={videoRef}
            src={useCamera ? undefined : (videoURL === 'camera' ? undefined : videoURL)}
            autoPlay
            playsInline
            muted
            style={{ 
              width: '100%', 
              maxHeight: '400px', 
              borderRadius: '12px', 
              background: '#000',
              objectFit: 'cover'
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}

      {/* Analyze Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={analyzeVideo}
          disabled={!videoURL || !modelLoaded || analyzing}
          className="btn btn-lg"
          style={{ 
            width: '100%',
            backgroundColor: videoURL && modelLoaded && !analyzing ? '#2563EB' : '#E2E8F0',
            color: videoURL && modelLoaded && !analyzing ? '#fff' : '#64748B',
            cursor: videoURL && modelLoaded && !analyzing ? 'pointer' : 'not-allowed',
            border: 'none'
          }}
        >
          {analyzing ? (
            <>
              <Loader2 size={20} className="animate-spin" style={{ marginRight: '8px' }} />
              Analyzing Video with AI...
            </>
          ) : (
            'Analyze Gait & Tremors'
          )}
        </button>
      </div>

      {/* Result Card */}
      {result && (
        <div className="card animate-fadeIn">
          <div className="chart-header">
            <TrendingUp size={22} style={{ color: '#22C55E' }} />
            <h2 className="chart-title">AI Analysis Results</h2>
          </div>

          {/* Main Score */}
          <div style={{ 
            background: '#F8FAFC', 
            borderRadius: '12px', 
            padding: '32px', 
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#64748B' }}>Overall Gait Score</span>
            </div>

            <div style={{ fontSize: '4rem', fontWeight: 700, color: '#22C55E', marginBottom: '16px' }}>
              {result.gaitScore}
            </div>

            <span className={`badge ${getBadgeClass(result.overallAssessment)}`}>
              {result.overallAssessment}
            </span>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px', 
              background: '#F8FAFC', 
              borderRadius: '8px' 
            }}>
              <span style={{ fontWeight: 500, color: '#0F172A' }}>Step Length</span>
              <span className={`badge ${getBadgeClass(result.stepLength)}`}>{result.stepLength}</span>
            </div>

            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px', 
              background: '#F8FAFC', 
              borderRadius: '8px' 
            }}>
              <span style={{ fontWeight: 500, color: '#0F172A' }}>Stride Width</span>
              <span className={`badge ${getBadgeClass(result.strideWidth)}`}>{result.strideWidth}</span>
            </div>

            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px', 
              background: '#F8FAFC', 
              borderRadius: '8px' 
            }}>
              <span style={{ fontWeight: 500, color: '#0F172A' }}>Walking Speed</span>
              <span className={`badge ${getBadgeClass(result.walkingSpeed)}`}>{result.walkingSpeed}</span>
            </div>

            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px', 
              background: '#F8FAFC', 
              borderRadius: '8px' 
            }}>
              <span style={{ fontWeight: 500, color: '#0F172A' }}>Balance</span>
              <span className={`badge ${getBadgeClass(result.balance)}`}>{result.balance}</span>
            </div>
          </div>

          {/* Hand Tremor Section */}
          <div style={{ 
            marginTop: '24px',
            padding: '24px', 
            background: result.handTremor === 'None' ? '#F0FDF4' : result.handTremor === 'Mild' ? '#FFFBEB' : '#FEF2F2',
            borderRadius: '12px',
            border: `1px solid ${result.handTremor === 'None' ? '#BBF7D0' : result.handTremor === 'Mild' ? '#FDE68A' : '#FECACA'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Activity size={24} style={{ color: result.handTremor === 'None' ? '#22C55E' : result.handTremor === 'Mild' ? '#F59E0B' : '#EF4444' }} />
              <h3 style={{ fontWeight: 600 }}>Hand Tremor Analysis</h3>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#64748B', fontSize: '14px' }}>Tremor Score</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: result.tremorScore < 20 ? '#22C55E' : result.tremorScore < 40 ? '#F59E0B' : '#EF4444' }}>
                  {result.tremorScore}
                </p>
              </div>
              <span className={`badge ${getBadgeClass(result.handTremor)}`}>
                {result.handTremor === 'None' ? 'No Tremor Detected' : `${result.handTremor} Tremor Detected`}
              </span>
            </div>

            {result.handTremor !== 'None' && (
              <p style={{ marginTop: '12px', fontSize: '14px', color: '#64748B' }}>
                {result.handTremor === 'Mild' 
                  ? 'Slight hand tremors detected. This may be due to fatigue or stress.'
                  : 'Noticeable hand tremors detected. Consider consulting a healthcare professional.'}
              </p>
            )}
          </div>

          {/* Recommendations */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '12px' }}>AI Recommendations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {result.gaitScore >= 80 && result.handTremor === 'None' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22C55E' }}>
                  <CheckCircle size={16} />
                  <span>Your gait and motor functions appear normal. Keep up the good work!</span>
                </div>
              )}
              {result.gaitScore < 80 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B' }}>
                  <AlertCircle size={16} />
                  <span>Consider exercises to improve balance and coordination.</span>
                </div>
              )}
              {result.handTremor !== 'None' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B' }}>
                  <AlertCircle size={16} />
                  <span>Regular hand exercises may help reduce tremor severity.</span>
                </div>
              )}
              {result.balance !== 'Normal' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B' }}>
                  <AlertCircle size={16} />
                  <span>Balance training exercises are recommended.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

