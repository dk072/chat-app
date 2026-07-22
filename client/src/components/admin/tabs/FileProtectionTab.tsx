import React, { useEffect, useState } from 'react';
import { FolderKey, ShieldAlert, Trash2, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';

const FileProtectionTab: React.FC = () => {
  const [scanData, setScanData] = useState<any>(null);
  const [cleaning, setCleaning] = useState(false);

  const fetchScan = async () => {
    try {
      const res = await api.get('/admin/advanced/media/scan');
      setScanData(res.data.scanResult);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchScan();
  }, []);

  const handleCleanup = async () => {
    setCleaning(true);
    try {
      const res = await api.post('/admin/advanced/media/cleanup');
      alert(`Cleanup completed. Removed ${res.data.result.cleanedCount} broken file references.`);
      fetchScan();
    } catch (err) {
      alert('Error during media cleanup');
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <FolderKey className="w-5 h-5 text-brand-500" />
            <span>File & Media Protection Suite</span>
          </h2>
          <p className="text-xs text-slate-500">Duplicate Hash Scanner, Malware Inspector & Storage Cleaner</p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={fetchScan}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rescan Storage</span>
          </button>

          <button
            onClick={handleCleanup}
            disabled={cleaning}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>{cleaning ? 'Cleaning...' : 'Cleanup Broken Media'}</span>
          </button>
        </div>
      </div>

      {scanData && (
        <div className="space-y-6">
          {/* Top Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
              <span className="text-xs font-bold text-slate-400 block mb-1">TOTAL MEDIA FILES</span>
              <div className="text-3xl font-extrabold text-slate-800">{scanData.totalMediaFiles}</div>
              <p className="text-[11px] text-slate-500 mt-1">Images, Videos, PDFs & Files</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
              <span className="text-xs font-bold text-slate-400 block mb-1">STORAGE USED</span>
              <div className="text-3xl font-extrabold text-indigo-600">{scanData.totalSizeMB} MB</div>
              <p className="text-[11px] text-slate-500 mt-1">Total disk footprint</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
              <span className="text-xs font-bold text-slate-400 block mb-1">DUPLICATE MEDIA</span>
              <div className="text-3xl font-extrabold text-amber-600">{scanData.duplicateCount} groups</div>
              <p className="text-[11px] text-slate-500 mt-1">Identical hash matches</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
              <span className="text-xs font-bold text-slate-400 block mb-1">SECURITY SCAN STATUS</span>
              <div className="mt-1">
                {scanData.cleanStatus === 'SECURE' ? (
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 font-extrabold text-xs rounded-xl flex items-center space-x-1.5 w-fit">
                    <CheckCircle2 className="w-4 h-4" /> <span>SECURE</span>
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl flex items-center space-x-1.5 w-fit">
                    <AlertTriangle className="w-4 h-4" /> <span>THREATS FOUND</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dangerous Files & Duplicates Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Dangerous File Extensions & Executables Inspector</span>
            </h3>

            {scanData.dangerousFiles.length === 0 ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-700 font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>No malicious file extensions (.exe, .bat, .cmd, .php) detected in uploads.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {scanData.dangerousFiles.map((df: any) => (
                  <div key={df.id} className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex justify-between items-center text-xs">
                    <span className="font-bold text-rose-800">{df.fileName}</span>
                    <span className="text-slate-500 font-mono">Size: {df.fileSize} B</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileProtectionTab;
