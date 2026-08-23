import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Scan, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Upload, 
  RefreshCw, 
  Camera, 
  Award,
  Layers
} from 'lucide-react';

interface AiQualityAssessorModalProps {
  onClose: () => void;
}

export const AiQualityAssessorModal: React.FC<AiQualityAssessorModalProps> = ({ onClose }) => {
  const { selectedCrop } = useApp();
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [hasScanned, setHasScanned] = useState<boolean>(true);
  const [selectedSample, setSelectedSample] = useState<'wheat_grade_a' | 'soyabean_sample' | 'onion_sample'>('wheat_grade_a');

  const sampleImages = {
    wheat_grade_a: {
      title: 'Golden Lokwan Wheat Sample',
      grade: 'Grade A (Export Certified)',
      moisture: '11.2%',
      foreignMatter: '0.4%',
      uniformity: '97.2%',
      lusterScore: '9.4/10',
      defectCount: 2,
      recommendation: 'Premium Flour Milling & Export Grade. Commands +3-5% price premium.',
    },
    soyabean_sample: {
      title: 'Yellow Soyabean Seed Lot',
      grade: 'Grade A (High Oil Content)',
      moisture: '10.5%',
      foreignMatter: '0.6%',
      uniformity: '95.8%',
      lusterScore: '9.1/10',
      defectCount: 3,
      recommendation: 'Optimal oil extraction grade. Accepted directly by Sahyadri & Adani Wilmar.',
    },
    onion_sample: {
      title: 'Nashik Garwa Red Onion',
      grade: 'Grade B (Domestic Wholesale)',
      moisture: '13.8%',
      foreignMatter: '1.2%',
      uniformity: '91.4%',
      lusterScore: '8.6/10',
      defectCount: 6,
      recommendation: 'Good curing and bulb skin. Suitable for immediate sale within 15-20 days.',
    }
  };

  const currentResult = sampleImages[selectedSample];

  const handleScan = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasScanned(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative my-6 text-[#1F2937]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#9CA3AF] hover:text-[#1F2937] p-1 rounded-lg hover:bg-[#F3F4F6] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-[#DCFCE7] border border-[#86EFAC] flex items-center justify-center text-[#15803D]">
            <Scan className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">
                AI Computer Vision Crop Quality Assayer
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                <Sparkles className="w-2.5 h-2.5 inline mr-1 text-[#15803D]" /> INSTANT AI
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Photometric grain analysis, foreign matter detection, and verifiable digital lot certification
            </p>
          </div>
        </div>

        {/* Sample Selector */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#1F2937]">
            <span>Select Inspection Sample:</span>
            <div className="flex space-x-2">
              {[
                { id: 'wheat_grade_a', label: '🌾 Wheat Lot' },
                { id: 'soyabean_sample', label: '🫘 Soyabean Lot' },
                { id: 'onion_sample', label: '🧅 Onion Lot' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedSample(s.id as any); handleScan(); }}
                  className={`px-3 py-1 rounded-xl text-xs transition cursor-pointer font-bold ${
                    selectedSample === s.id
                      ? 'bg-[#2E7D32] text-white shadow-sm'
                      : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Scanner Frame */}
          <div className="relative rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] p-4 overflow-hidden">
            
            {/* Visual crop grain canvas mockup */}
            <div className="h-44 sm:h-52 bg-[#F3F4F6] rounded-xl flex items-center justify-center relative overflow-hidden border border-[#E5E7EB]">
              
              <div className="text-center space-y-2 z-10">
                <div className="text-5xl">🌾</div>
                <div className="text-xs font-bold text-[#1F2937]">{currentResult.title}</div>
                <div className="text-[10px] text-[#15803D] font-mono font-bold">1080p Macro Lens Inspection Frame</div>
              </div>

              {/* Bounding box overlays */}
              <div className="absolute top-6 left-12 w-20 h-16 border-2 border-[#15803D] rounded bg-[#DCFCE7]/40 flex items-start justify-end p-1">
                <span className="text-[8px] text-[#15803D] font-mono font-bold bg-white px-1 rounded shadow-sm">98% Clean</span>
              </div>
              <div className="absolute bottom-8 right-16 w-24 h-16 border-2 border-[#15803D] rounded bg-[#DCFCE7]/40 flex items-start justify-end p-1">
                <span className="text-[8px] text-[#15803D] font-mono font-bold bg-white px-1 rounded shadow-sm">Moisture: 11%</span>
              </div>

              {/* Scan laser line animation */}
              {isAnalyzing && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#2E7D32] to-transparent animate-bounce shadow-md" />
              )}

            </div>

            {/* AI Results Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] shadow-sm">
                <div className="text-[10px] text-[#6B7280]">Assigned Grade</div>
                <div className="font-extrabold text-[#15803D] text-sm mt-0.5">{currentResult.grade.split(' ')[0]} {currentResult.grade.split(' ')[1]}</div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] shadow-sm">
                <div className="text-[10px] text-[#6B7280]">Moisture Content</div>
                <div className="font-extrabold text-[#1F2937] font-mono text-sm mt-0.5">{currentResult.moisture}</div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] shadow-sm">
                <div className="text-[10px] text-[#6B7280]">Foreign Matter</div>
                <div className="font-extrabold text-[#1F2937] font-mono text-sm mt-0.5">{currentResult.foreignMatter}</div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] shadow-sm">
                <div className="text-[10px] text-[#6B7280]">Grain Uniformity</div>
                <div className="font-extrabold text-[#15803D] font-mono text-sm mt-0.5">{currentResult.uniformity}</div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="mt-3 p-3 bg-[#F0FDF4] rounded-xl border border-[#86EFAC] text-xs text-[#1F2937] flex items-start space-x-2">
              <Award className="w-4 h-4 text-[#15803D] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#15803D]">AI Certificate: </span>
                <span className="font-medium text-[#4B5563]">{currentResult.recommendation}</span>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleScan}
              disabled={isAnalyzing}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F3F4F6] text-[#4B5563] text-xs font-bold flex items-center space-x-2 border border-[#D1D5DB] cursor-pointer transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>Rescan Sample</span>
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1E5128] text-white text-xs font-bold shadow-sm flex items-center space-x-2 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Grade A to Current Lot</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
