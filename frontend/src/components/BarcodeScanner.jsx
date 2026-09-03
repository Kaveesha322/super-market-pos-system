import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { X, Camera } from 'lucide-react';

export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const readerRef = useRef(null);

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    readerRef.current.listVideoInputDevices().then(devs => {
      setDevices(devs);
      if (devs.length > 0) setSelectedDevice(devs[devs.length - 1].deviceId);
    }).catch(() => setError('Camera not accessible'));

    return () => {
      readerRef.current?.reset();
    };
  }, []);

  useEffect(() => {
    if (!selectedDevice || !videoRef.current) return;
    readerRef.current?.reset();
    readerRef.current.decodeFromVideoDevice(selectedDevice, videoRef.current, (result, err) => {
      if (result) {
        onScan(result.getText());
      }
    }).catch(e => setError(e.message));
  }, [selectedDevice]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Camera size={20} className="text-green-600" />
            Camera Barcode Scanner
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {devices.length > 1 && (
            <select
              value={selectedDevice || ''}
              onChange={e => setSelectedDevice(e.target.value)}
              className="input-field mb-3"
            >
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera ' + d.deviceId.slice(0, 6)}</option>
              ))}
            </select>
          )}

          {error && <div className="text-red-500 text-sm mb-3 p-3 bg-red-50 rounded-lg">{error}</div>}

          <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <video ref={videoRef} className="w-full h-full object-cover" />
            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-40 border-2 border-green-400 rounded-xl relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-green-400/70 animate-pulse" />
              </div>
            </div>
          </div>

          <p className="text-center text-slate-500 text-xs mt-3">
            Point camera at barcode or QR code
          </p>
        </div>
      </div>
    </div>
  );
}
