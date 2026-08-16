import React, { useState } from 'react';

interface SafetyChecklistModalProps {
  language: 'en' | 'mr' | 'hi';
  onClose: () => void;
}

interface ChecklistItem {
  id: string;
  label_en: string;
  label_mr: string;
  category: 'PPE' | 'WEATHER' | 'VEHICLE';
  required: boolean;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  {
    id: 'gloves',
    label_en: 'Heavy-Duty Puncture-Resistant Nitrile Gloves',
    label_mr: 'मजबूत रबरी सुरक्षा हातमोजे (Nitrile Gloves)',
    category: 'PPE',
    required: true
  },
  {
    id: 'boots',
    label_en: 'Steel-Toe Anti-Skid Rubber Gum Boots',
    label_mr: 'अँटी-स्किड सुरक्षा गमबूट्स',
    category: 'PPE',
    required: true
  },
  {
    id: 'vest',
    label_en: 'High-Visibility Fluorescent Reflective Vest',
    label_mr: 'चमकदार परावर्तक जॅकेट (Reflective Vest)',
    category: 'PPE',
    required: true
  },
  {
    id: 'mask',
    label_en: 'N95 Carbon Dust & Odor Mask',
    label_mr: 'N95 धूळ व दुर्गंधी विरोधी मास्क',
    category: 'PPE',
    required: true
  },
  {
    id: 'water',
    label_en: '2L Insulated Water Flask + ORS Electrolyte Pack',
    label_mr: '२ लिटर थंड पाण्याची बाटली + ओआरएस पाकीट',
    category: 'WEATHER',
    required: true
  },
  {
    id: 'tarpaulin',
    label_en: 'Waste Tipper Covering Tarpaulin Sheet',
    label_mr: 'कचरा गाडी झाकण्यासाठी ताडपत्री',
    category: 'VEHICLE',
    required: true
  },
  {
    id: 'disinfectant',
    label_en: 'Bleaching Powder / Disinfectant Spray Canister',
    label_mr: 'जंतुनाशक पावडर व सॅनिटायझेशन स्प्रे',
    category: 'VEHICLE',
    required: false
  }
];

export const SafetyChecklistModal: React.FC<SafetyChecklistModalProps> = ({
  language,
  onClose
}) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    new Set(['gloves', 'boots', 'vest', 'water'])
  );
  const [confirmed, setConfirmed] = useState<boolean>(false);

  const toggleItem = (id: string) => {
    const updated = new Set(checkedItems);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setCheckedItems(updated);
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const allRequiredChecked = DEFAULT_ITEMS.filter(i => i.required).every(i =>
    checkedItems.has(i.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-lg">
              🛡️
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                {language === 'mr' ? 'NMC दैनिक सुरक्षा चेकलिस्ट' : 'NMC Field Safety SOP Checklist'}
              </h3>
              <p className="text-xs text-slate-400">Swachh Nagpur Worker Safety Protocol</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-amber-200">
            ⚠️ <strong>Nagpur Weather Directive:</strong> Ensure all mandatory PPE and hydration gear is verified before commencing collection route in high ambient heat (43.8°C).
          </p>

          <div className="space-y-2">
            {DEFAULT_ITEMS.map(item => {
              const isChecked = checkedItems.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-900 cursor-pointer"
                    />
                    <div>
                      <span className="font-semibold block text-slate-200">
                        {language === 'mr' ? item.label_mr : item.label_en}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        {item.category} {item.required && '• Mandatory'}
                      </span>
                    </div>
                  </div>

                  <span className="text-base">{isChecked ? '✅' : '⚪'}</span>
                </div>
              );
            })}
          </div>

          {/* Confirm Button */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              onClick={handleConfirm}
              disabled={!allRequiredChecked || confirmed}
              className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                confirmed
                  ? 'bg-emerald-500 text-slate-950'
                  : allRequiredChecked
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>{confirmed ? '✓ Safety Protocol Confirmed!' : 'Confirm Daily Safety Readiness'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
